class WordleSolver {
    constructor() {
        this.allWords = [];
        this.possibleWords = [];
        this.attempts = [];
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
            
            this.allWords = [...new Set([...answers, ...guesses])];
            this.possibleWords = [...this.allWords];
            
            document.getElementById('wordCount').textContent = `${this.allWords.length.toLocaleString()} words loaded`;
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading words:', error);
            this.allWords = ['soare', 'roate', 'raise', 'slate', 'crane', 'crate', 'trace', 'stare', 'audio', 'about'];
            this.possibleWords = [...this.allWords];
            document.getElementById('wordCount').textContent = 'Using fallback word list';
        }
    }
    
    setupEventListeners() {
        const wordInput = document.getElementById('wordInput');
        const feedbackInput = document.getElementById('feedbackInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const undoBtn = document.getElementById('undoBtn');
        const resetBtn = document.getElementById('resetBtn');
        const suggestion = document.getElementById('suggestion');
        
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const suggestedWord = document.getElementById('suggestion').textContent;
                if (suggestedWord && suggestedWord !== '---') {
                    wordInput.value = suggestedWord;
                }
                feedbackInput.focus();
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
        
        analyzeBtn.addEventListener('click', () => this.processGuess());
        undoBtn.addEventListener('click', () => this.undoLast());
        resetBtn.addEventListener('click', () => this.reset());
        suggestion.addEventListener('click', () => this.copySuggestion());
    }
    
    processGuess() {
        const word = document.getElementById('wordInput').value.trim().toLowerCase();
        const feedback = document.getElementById('feedbackInput').value.trim().toUpperCase();
        
        if (word.length !== 5) {
            alert('Word must be exactly 5 letters!');
            return;
        }
        
        if (!this.allWords.includes(word)) {
            alert(`"${word.toUpperCase()}" is not in our dictionary!`);
            return;
        }
        
        if (feedback.length !== 5) {
            alert('Feedback must be 5 characters (G/Y/B)!');
            return;
        }
        
        if (!/^[GYB]+$/.test(feedback)) {
            alert('Feedback must only contain G, Y, or B!');
            return;
        }
        
        if (feedback === 'GGGGG') {
            alert(`🎉 Solved in ${this.attempts.length + 1} attempts!\n\nThe word was: ${word.toUpperCase()}`);
            return;
        }
        
        this.applyFeedback(word, feedback);
        this.attempts.push({ word, feedback });
        
        document.getElementById('wordInput').value = '';
        document.getElementById('feedbackInput').value = '';
        document.getElementById('wordInput').focus();
        
        document.getElementById('undoBtn').disabled = false;
        
        this.updateHistory();
        this.updateDisplay();
        
        if (this.possibleWords.length === 0) {
            alert('⚠️ No words match your feedback!\n\nDouble-check your feedback pattern.');
        }
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
                let isGreenOrYellow = false;
                if (Object.values(this.constraints.green).includes(letter)) {
                    isGreenOrYellow = true;
                }
                if (this.constraints.yellow.has(letter)) {
                    isGreenOrYellow = true;
                }
                
                if (!isGreenOrYellow) {
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
    
    getBestSuggestion() {
        if (this.possibleWords.length === 0) return '---';
        if (this.possibleWords.length === 1) return this.possibleWords[0];
        
        if (this.attempts.length === 0) {
            const starters = ['soare', 'roate', 'raise', 'slate', 'crane'];
            for (const starter of starters) {
                if (this.allWords.includes(starter)) return starter;
            }
        }
        
        return this.possibleWords[0];
    }
    
    updateDisplay() {
        const suggestion = this.getBestSuggestion();
        document.getElementById('suggestion').textContent = suggestion.toUpperCase();
        
        const total = this.allWords.length;
        const possible = this.possibleWords.length;
        const eliminated = total - possible;
        
        document.getElementById('possibleCount').textContent = possible.toLocaleString();
        document.getElementById('attemptsCount').textContent = this.attempts.length;
        document.getElementById('eliminatedCount').textContent = eliminated.toLocaleString();
        document.getElementById('wordsCount').textContent = possible.toLocaleString();
        document.getElementById('headerStats').textContent = `${possible.toLocaleString()} possible • ${this.attempts.length} attempts`;
        
        const wordsList = document.getElementById('wordsList');
        if (possible === 0) {
            wordsList.textContent = 'No words match your feedback!';
        } else if (possible <= 200) {
            let html = '';
            for (let i = 0; i < possible; i += 5) {
                const words = this.possibleWords.slice(i, i + 5);
                html += words.map(w => w.toUpperCase().padEnd(7)).join('') + '\n';
            }
            wordsList.textContent = html;
        } else {
            let html = `Showing 150 of ${possible.toLocaleString()} words\n\n`;
            for (let i = 0; i < 150; i += 5) {
                const words = this.possibleWords.slice(i, i + 5);
                html += words.map(w => w.toUpperCase().padEnd(7)).join('') + '\n';
            }
            wordsList.textContent = html;
        }
    }
    
    updateHistory() {
        const container = document.getElementById('historyContainer');
        const count = document.getElementById('attemptCount');
        
        if (this.attempts.length === 0) {
            container.innerHTML = '<p class="empty-state">No attempts yet. Enter your first guess above!</p>';
            count.textContent = '0 attempts';
            return;
        }
        
        count.textContent = `${this.attempts.length} attempt${this.attempts.length > 1 ? 's' : ''}`;
        
        let html = '';
        this.attempts.forEach((attempt, i) => {
            html += `<div class="history-item">`;
            html += `<span class="history-number">${i + 1}.  </span>`;
            
            for (let j = 0; j < 5; j++) {
                const letter = attempt.word[j].toUpperCase();
                const status = attempt.feedback[j];
                
                if (status === 'G') {
                    html += `<span class="letter-green">${letter}</span> `;
                } else if (status === 'Y') {
                    html += `<span class="letter-yellow">${letter}</span> `;
                } else {
                    html += `<span class="letter-gray">${letter}</span> `;
                }
            }
            
            html += `</div>`;
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
        
        if (this.attempts.length === 0) {
            document.getElementById('undoBtn').disabled = true;
        }
        
        this.updateHistory();
        this.updateDisplay();
    }
    
    reset() {
        if (this.attempts.length > 0) {
            if (!confirm('Start a new game? This will clear all progress.')) {
                return;
            }
        }
        
        this.attempts = [];
        this.possibleWords = [...this.allWords];
        this.constraints = {
            green: {},
            yellow: new Set(),
            gray: new Set(),
            yellowNot: {}
        };
        
        document.getElementById('wordInput').value = '';
        document.getElementById('feedbackInput').value = '';
        document.getElementById('undoBtn').disabled = true;
        
        this.updateHistory();
        this.updateDisplay();
    }
    
    copySuggestion() {
        const suggestion = document.getElementById('suggestion').textContent;
        if (suggestion && suggestion !== '---') {
            document.getElementById('wordInput').value = suggestion;
            document.getElementById('wordInput').focus();
        }
    }
}

const solver = new WordleSolver();
