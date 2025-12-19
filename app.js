class WordleSolver {
    constructor() {
        this.allWords = [];
        this.possibleWords = [];
        this.attempts = [];
        this.lastValidSuggestions = [];
        this.constraints = {
            green: {},
            yellow: new Set(),
            gray: new Set(),
            yellowNot: {}
        };
        
        this.init();
    }
    
    async init() {
        await this.loadWords();
        this.setupEventListeners();
        this.initDarkMode();
        this.initHelpModal();
        this.updateDisplay();
    }
    
    async loadWords() {
        try {
            const answersRes = await fetch('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt');
            const answersText = await answersRes.text();
            const answers = answersText.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length === 5);
            
            const guessesRes = await fetch('https://gist.githubusercontent.com/cfreshman/cdcdf777450c5b5301e439061d29694c/raw/wordle-allowed-guesses.txt');
            const guessesText = await guessesRes.text();
            const guesses = guessesText.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length === 5);
            
            const extraWords = this.getExtraWords();
            
            this.allWords = [...new Set([...answers, ...guesses, ...extraWords])];
            this.possibleWords = [...this.allWords];
            this.lastValidSuggestions = [...this.allWords];
            
            document.getElementById('wordCount').textContent = `${this.allWords.length.toLocaleString()} words`;
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading words:', error);
            this.allWords = this.getExtraWords();
            this.possibleWords = [...this.allWords];
            this.lastValidSuggestions = [...this.allWords];
            document.getElementById('wordCount').textContent = `${this.allWords.length.toLocaleString()} words`;
        }
    }
    
    getExtraWords() {
        return [
            'soare', 'roate', 'raise', 'arise', 'irate', 'slate', 'crane', 'stare',
            'snare', 'share', 'spare', 'scare', 'adieu', 'audio', 'ounce', 'about'
        ];
    }
    
    calculateLetterFrequency() {
        const letterFreq = {};
        const positionFreq = [{}, {}, {}, {}, {}];
        
        this.possibleWords.forEach(word => {
            for (let i = 0; i < 5; i++) {
                const letter = word[i];
                letterFreq[letter] = (letterFreq[letter] || 0) + 1;
                positionFreq[i][letter] = (positionFreq[i][letter] || 0) + 1;
            }
        });
        
        return { letterFreq, positionFreq };
    }
    
    scoreWord(word) {
        const { letterFreq, positionFreq } = this.calculateLetterFrequency();
        let score = 0;
        const usedLetters = new Set();
        
        for (let i = 0; i < 5; i++) {
            const letter = word[i];
            score += (positionFreq[i][letter] || 0) * 2;
            
            if (!usedLetters.has(letter)) {
                score += letterFreq[letter] || 0;
                usedLetters.add(letter);
            }
        }
        
        score += new Set(word.split('')).size * 50;
        
        const vowels = (word.match(/[aeiou]/g) || []).length;
        if (vowels >= 2 && vowels <= 3) score += 100;
        
        return score;
    }
    
    getBestSuggestion() {
        if (this.possibleWords.length === 0) {
            return this.lastValidSuggestions[0] || 'soare';
        }
        
        if (this.possibleWords.length === 1) {
            return this.possibleWords[0];
        }
        
        if (this.attempts.length === 0) {
            const topStarters = ['soare', 'roate', 'raise', 'arise', 'irate'];
            for (const starter of topStarters) {
                if (this.possibleWords.includes(starter)) return starter;
            }
        }
        
        const scoredWords = this.possibleWords.map(word => ({
            word,
            score: this.scoreWord(word)
        }));
        scoredWords.sort((a, b) => b.score - a.score);
        return scoredWords[0].word;
    }
    
    setupEventListeners() {
        const wordInput = document.getElementById('wordInput');
        const feedbackInput = document.getElementById('feedbackInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const undoBtn = document.getElementById('undoBtn');
        const resetBtn = document.getElementById('resetBtn');
        const suggestion = document.getElementById('suggestion');
        const suggestionSticky = document.getElementById('suggestionSticky');
        
        if (!wordInput || !feedbackInput) return;
        
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const suggestedWord = document.getElementById('suggestion').textContent;
                if (suggestedWord) {
                    wordInput.value = suggestedWord;
                    feedbackInput.focus();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                feedbackInput.focus();
            }
        });
        
        feedbackInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.processGuess();
            }
        });
        
        wordInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        feedbackInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.processGuess());
        if (undoBtn) undoBtn.addEventListener('click', () => this.undoLast());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (suggestion) suggestion.addEventListener('click', () => this.copySuggestion());
        if (suggestionSticky) suggestionSticky.addEventListener('click', () => this.copySuggestion());
    }
    
    initDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;
        
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    initHelpModal() {
        const helpBtn = document.getElementById('helpBtn');
        const modal = document.getElementById('helpModal');
        const closeModal = document.getElementById('closeModal');
        
        if (helpBtn && modal) {
            helpBtn.addEventListener('click', () => {
                modal.classList.add('show');
            });
            
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    modal.classList.remove('show');
                });
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    modal.classList.remove('show');
                }
            });
        }
    }
    
    processGuess() {
        const wordInput = document.getElementById('wordInput');
        const feedbackInput = document.getElementById('feedbackInput');
        
        if (!wordInput || !feedbackInput) return;
        
        const word = wordInput.value.trim().toLowerCase();
        const feedback = feedbackInput.value.trim().toUpperCase();
        
        if (word.length !== 5) {
            this.showToast('Enter 5 letters', 'error');
            return;
        }
        
        if (feedback.length !== 5) {
            this.showToast('Enter 5 feedback letters', 'error');
            return;
        }
        
        if (!/^[GYB]+$/.test(feedback)) {
            this.showToast('Use only G, Y, or B', 'error');
            return;
        }
        
        if (feedback === 'GGGGG') {
            this.showToast(`Solved in ${this.attempts.length + 1}`, 'success');
            return;
        }
        
        if (this.possibleWords.length > 0) {
            this.lastValidSuggestions = [...this.possibleWords];
        }
        
        this.applyFeedback(word, feedback);
        this.attempts.push({ word, feedback });
        
        wordInput.value = '';
        feedbackInput.value = '';
        wordInput.focus();
        
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) undoBtn.disabled = false;
        
        this.updateHistory();
        this.updateDisplay();
    }
    
    applyFeedback(word, feedback) {
        for (let i = 0; i < 5; i++) {
            const letter = word[i];
            const status = feedback[i];
            
            if (status === 'G') {
                this.constraints.green[i] = letter;
            } else if (status === 'Y') {
                this.constraints.yellow.add(letter);
                if (!this.constraints.yellowNot[letter]) {
                    this.constraints.yellowNot[letter] = new Set();
                }
                this.constraints.yellowNot[letter].add(i);
            } else if (status === 'B') {
                if (!Object.values(this.constraints.green).includes(letter) && 
                    !this.constraints.yellow.has(letter)) {
                    this.constraints.gray.add(letter);
                }
            }
        }
        
        this.filterWords();
    }
    
    filterWords() {
        this.possibleWords = this.possibleWords.filter(word => {
            for (const [pos, letter] of Object.entries(this.constraints.green)) {
                if (word[pos] !== letter) return false;
            }
            
            for (const letter of this.constraints.yellow) {
                if (!word.includes(letter)) return false;
                if (this.constraints.yellowNot[letter]) {
                    for (const pos of this.constraints.yellowNot[letter]) {
                        if (word[pos] === letter) return false;
                    }
                }
            }
            
            for (const letter of this.constraints.gray) {
                if (word.includes(letter)) return false;
            }
            
            return true;
        });
    }
    
    updateDisplay() {
        const suggestion = this.getBestSuggestion();
        const suggestionEl = document.getElementById('suggestion');
        const suggestionSticky = document.getElementById('suggestionSticky');
        
        if (suggestionEl) suggestionEl.textContent = suggestion.toUpperCase();
        if (suggestionSticky) suggestionSticky.textContent = suggestion.toUpperCase();
        
        const possible = this.possibleWords.length;
        const eliminated = this.allWords.length - possible;
        
        const els = {
            possibleCount: document.getElementById('possibleCount'),
            attemptsCount: document.getElementById('attemptsCount'),
            eliminatedCount: document.getElementById('eliminatedCount'),
            wordsCount: document.getElementById('wordsCount'),
            headerStats: document.getElementById('headerStats'),
            wordsList: document.getElementById('wordsList')
        };
        
        if (els.possibleCount) els.possibleCount.textContent = possible.toLocaleString();
        if (els.attemptsCount) els.attemptsCount.textContent = this.attempts.length;
        if (els.eliminatedCount) els.eliminatedCount.textContent = eliminated.toLocaleString();
        if (els.wordsCount) els.wordsCount.textContent = possible.toLocaleString();
        if (els.headerStats) els.headerStats.textContent = `${possible.toLocaleString()} • ${this.attempts.length}`;
        
        if (els.wordsList) {
            if (possible === 0) {
                els.wordsList.textContent = 'No matches';
            } else if (possible <= 200) {
                let html = '';
                for (let i = 0; i < possible; i += 5) {
                    const words = this.possibleWords.slice(i, i + 5);
                    html += words.map(w => w.toUpperCase().padEnd(7)).join('') + '\n';
                }
                els.wordsList.textContent = html;
            } else {
                let html = `Showing 150 of ${possible.toLocaleString()}:\n\n`;
                for (let i = 0; i < 150; i += 5) {
                    const words = this.possibleWords.slice(i, i + 5);
                    html += words.map(w => w.toUpperCase().padEnd(7)).join('') + '\n';
                }
                els.wordsList.textContent = html;
            }
        }
    }
    
    updateHistory() {
        const container = document.getElementById('historyContainer');
        const count = document.getElementById('attemptCount');
        
        if (!container || !count) return;
        
        if (this.attempts.length === 0) {
            container.innerHTML = '<p class="empty-state">No attempts yet</p>';
            count.textContent = '0';
            return;
        }
        
        count.textContent = `${this.attempts.length}`;
        
        let html = '';
        this.attempts.forEach((attempt, i) => {
            html += '<div class="history-item">';
            html += `<span class="history-number">${i + 1}.</span>`;
            for (let j = 0; j < 5; j++) {
                const letter = attempt.word[j].toUpperCase();
                const status = attempt.feedback[j];
                const className = status === 'G' ? 'letter-green' : status === 'Y' ? 'letter-yellow' : 'letter-gray';
                html += `<span class="${className}">${letter}</span>`;
            }
            html += '</div>';
        });
        
        container.innerHTML = html;
    }
    
    undoLast() {
        if (this.attempts.length === 0) return;
        
        this.attempts.pop();
        this.possibleWords = [...this.allWords];
        this.constraints = {
            green: {},
            yellow: new Set(),
            gray: new Set(),
            yellowNot: {}
        };
        
        this.attempts.forEach(attempt => {
            this.applyFeedback(attempt.word, attempt.feedback);
        });
        
        if (this.possibleWords.length > 0) {
            this.lastValidSuggestions = [...this.possibleWords];
        }
        
        const undoBtn = document.getElementById('undoBtn');
        if (this.attempts.length === 0 && undoBtn) {
            undoBtn.disabled = true;
        }
        
        this.updateHistory();
        this.updateDisplay();
        this.showToast('Undone', 'info');
    }
    
    reset() {
        if (this.attempts.length > 0) {
            if (!confirm('Reset and start over?')) return;
        }
        
        this.attempts = [];
        this.possibleWords = [...this.allWords];
        this.lastValidSuggestions = [...this.allWords];
        this.constraints = {
            green: {},
            yellow: new Set(),
            gray: new Set(),
            yellowNot: {}
        };
        
        const wordInput = document.getElementById('wordInput');
        const feedbackInput = document.getElementById('feedbackInput');
        const undoBtn = document.getElementById('undoBtn');
        
        if (wordInput) wordInput.value = '';
        if (feedbackInput) feedbackInput.value = '';
        if (undoBtn) undoBtn.disabled = true;
        
        this.updateHistory();
        this.updateDisplay();
    }
    
    copySuggestion() {
        const suggestion = document.getElementById('suggestion');
        const wordInput = document.getElementById('wordInput');
        const feedbackInput = document.getElementById('feedbackInput');
        
        if (suggestion && wordInput && feedbackInput) {
            wordInput.value = suggestion.textContent;
            feedbackInput.focus();
        }
    }
    
    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 200);
        }, 2000);
    }
}

const solver = new WordleSolver();
