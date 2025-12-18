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
        
        this.usageData = this.loadUsageData();
        
        this.init();
    }
    
    loadUsageData() {
        const stored = localStorage.getItem('wordleUsageData');
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            wordSuccessRate: {},
            wordUsageCount: {},
            positionSuccess: {},
            averageAttempts: [],
            totalGames: 0
        };
    }
    
    saveUsageData() {
        localStorage.setItem('wordleUsageData', JSON.stringify(this.usageData));
    }
    
    logWordPerformance(word, wasSuccessful, attemptNumber) {
        if (!this.usageData.wordSuccessRate[word]) {
            this.usageData.wordSuccessRate[word] = { success: 0, total: 0 };
        }
        
        this.usageData.wordSuccessRate[word].total++;
        if (wasSuccessful) {
            this.usageData.wordSuccessRate[word].success++;
        }
        
        this.usageData.wordUsageCount[word] = (this.usageData.wordUsageCount[word] || 0) + 1;
        
        this.saveUsageData();
    }
    
    logGameComplete(totalAttempts) {
        this.usageData.averageAttempts.push(totalAttempts);
        this.usageData.totalGames++;
        
        if (this.usageData.averageAttempts.length > 100) {
            this.usageData.averageAttempts.shift();
        }
        
        this.saveUsageData();
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
            
            const extraWords = this.getExtraWords();
            
            this.allWords = [...new Set([...answers, ...guesses, ...extraWords])];
            this.possibleWords = [...this.allWords];
            this.lastValidSuggestions = [...this.allWords];
            
            document.getElementById('wordCount').textContent = `${this.allWords.length.toLocaleString()} words loaded`;
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading words:', error);
            this.allWords = this.getExtraWords();
            this.possibleWords = [...this.allWords];
            this.lastValidSuggestions = [...this.allWords];
            document.getElementById('wordCount').textContent = `${this.allWords.length.toLocaleString()} words loaded`;
        }
    }
    
    getExtraWords() {
        return [
            'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult',
            'after', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album', 'alert',
            'alien', 'align', 'alike', 'alive', 'allow', 'alone', 'along', 'alter',
            'angel', 'anger', 'angle', 'angry', 'apart', 'apple', 'apply', 'arena',
            'argue', 'arise', 'array', 'arrow', 'aside', 'asset', 'audio', 'audit',
            'avoid', 'awake', 'award', 'aware', 'badly', 'baker', 'bases', 'basic',
            'basis', 'beach', 'began', 'begin', 'being', 'below', 'bench', 'billy',
            'birth', 'black', 'blade', 'blame', 'blank', 'blast', 'bleed', 'blend',
            'bless', 'blind', 'block', 'blood', 'bloom', 'board', 'boost', 'booth',
            'bound', 'brain', 'brand', 'bread', 'break', 'breed', 'brief', 'bring',
            'broad', 'broke', 'brown', 'brush', 'buddy', 'build', 'built', 'bunch',
            'buyer', 'cable', 'calif', 'carry', 'catch', 'cause', 'chain', 'chair',
            'chaos', 'charm', 'chart', 'chase', 'cheap', 'cheat', 'check', 'chest',
            'chief', 'child', 'china', 'chose', 'civil', 'claim', 'class', 'clean',
            'clear', 'click', 'climb', 'clock', 'close', 'cloud', 'coach', 'coast',
            'could', 'count', 'court', 'cover', 'crack', 'craft', 'crash', 'crazy',
            'cream', 'crime', 'cross', 'crowd', 'crown', 'crude', 'curve', 'cycle',
            'daily', 'dance', 'dated', 'dealt', 'death', 'debut', 'delay', 'depth',
            'doing', 'doubt', 'dozen', 'draft', 'drama', 'drank', 'drawn', 'dream',
            'dress', 'drill', 'drink', 'drive', 'drove', 'dying', 'eager', 'early',
            'earth', 'eight', 'elite', 'empty', 'enemy', 'enjoy', 'enter', 'entry',
            'equal', 'error', 'event', 'every', 'exact', 'exist', 'extra', 'faith',
            'false', 'fault', 'fence', 'fever', 'fewer', 'fiber', 'field', 'fifth',
            'fifty', 'fight', 'final', 'first', 'flash', 'fleet', 'flesh', 'flight',
            'float', 'flood', 'floor', 'flour', 'flows', 'fluid', 'focus', 'force',
            'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh',
            'front', 'fruit', 'fully', 'funny', 'giant', 'given', 'glass', 'globe',
            'glory', 'grace', 'grade', 'grain', 'grand', 'grant', 'graph', 'grass',
            'grave', 'great', 'green', 'gross', 'group', 'grown', 'guard', 'guess',
            'guest', 'guide', 'guild', 'habit', 'happy', 'harry', 'harsh', 'heart',
            'heavy', 'hence', 'henry', 'horse', 'hotel', 'house', 'human', 'ideal',
            'image', 'imply', 'index', 'inner', 'input', 'issue', 'james', 'japan',
            'jimmy', 'joint', 'jones', 'judge', 'juice', 'known', 'label', 'labor',
            'large', 'laser', 'later', 'laugh', 'layer', 'learn', 'lease', 'least',
            'leave', 'legal', 'lemon', 'level', 'lewis', 'light', 'limit', 'links',
            'lives', 'local', 'logic', 'loose', 'lower', 'lucky', 'lunch', 'lying',
            'magic', 'major', 'maker', 'march', 'maria', 'match', 'maybe', 'mayor',
            'meant', 'media', 'metal', 'might', 'minor', 'minus', 'mixed', 'model',
            'money', 'month', 'moral', 'motor', 'mount', 'mouse', 'mouth', 'moved',
            'movie', 'music', 'needs', 'nerve', 'never', 'newly', 'night', 'noise',
            'north', 'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often',
            'order', 'other', 'ought', 'paint', 'panel', 'paper', 'party', 'peace',
            'peter', 'phase', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pitch',
            'place', 'plain', 'plane', 'plant', 'plate', 'point', 'pound', 'power',
            'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'proof',
            'proud', 'prove', 'queen', 'quick', 'quiet', 'quite', 'radio', 'raise',
            'rally', 'ranch', 'range', 'rapid', 'ratio', 'reach', 'ready', 'realm',
            'refer', 'relax', 'reply', 'rider', 'ridge', 'rifle', 'right', 'rigid',
            'rival', 'river', 'robin', 'roger', 'roman', 'rough', 'round', 'route',
            'royal', 'rural', 'scale', 'scene', 'scope', 'score', 'sense', 'serve',
            'seven', 'shall', 'shape', 'share', 'sharp', 'sheet', 'shelf', 'shell',
            'shift', 'shine', 'shirt', 'shock', 'shoot', 'shore', 'short', 'shown',
            'sight', 'since', 'sixth', 'sixty', 'sized', 'skill', 'sleep', 'slide',
            'small', 'smart', 'smile', 'smith', 'smoke', 'solid', 'solve', 'sorry',
            'sound', 'south', 'space', 'spare', 'speak', 'speed', 'spend', 'spent',
            'split', 'spoke', 'sport', 'staff', 'stage', 'stake', 'stand', 'start',
            'state', 'steam', 'steel', 'stick', 'still', 'stock', 'stone', 'stood',
            'store', 'storm', 'story', 'strip', 'stuck', 'study', 'stuff', 'style',
            'sugar', 'suite', 'sunny', 'super', 'sweet', 'table', 'taken', 'taste',
            'taxes', 'teach', 'terry', 'texas', 'thank', 'theft', 'their', 'theme',
            'there', 'these', 'thick', 'thing', 'think', 'third', 'those', 'three',
            'threw', 'throw', 'tight', 'times', 'tired', 'title', 'today', 'topic',
            'total', 'touch', 'tough', 'tower', 'track', 'trade', 'train', 'treat',
            'trend', 'trial', 'tribe', 'trick', 'tried', 'tries', 'troop', 'truck',
            'truly', 'trunk', 'trust', 'truth', 'twice', 'uncle', 'under', 'union',
            'unity', 'until', 'upper', 'upset', 'urban', 'usage', 'usual', 'valid',
            'value', 'video', 'virus', 'visit', 'vital', 'vocal', 'voice', 'waste',
            'watch', 'water', 'wheel', 'where', 'which', 'while', 'white', 'whole',
            'whose', 'woman', 'women', 'world', 'worry', 'worse', 'worst', 'worth',
            'would', 'wound', 'write', 'wrong', 'wrote', 'yield', 'young', 'youth',
            'soare', 'roate', 'raile', 'reast', 'slate', 'sauce', 'slice', 'shale',
            'crate', 'trace', 'crane', 'stare', 'snare', 'share', 'spare', 'scare',
            'adieu', 'arise', 'irate', 'arose', 'stale', 'alone', 'atone', 'suite',
            'aisle', 'anime', 'oxide', 'ounce', 'olive', 'opine', 'outre', 'ovine',
            'uveal', 'ulnae', 'ureal', 'urate', 'unite', 'untie', 'usage', 'urine'
        ].filter(w => w.length === 5);
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
            
            const posScore = positionFreq[i][letter] || 0;
            score += posScore * 2;
            
            if (!usedLetters.has(letter)) {
                const freqScore = letterFreq[letter] || 0;
                score += freqScore;
                usedLetters.add(letter);
            }
        }
        
        const uniqueLetters = new Set(word.split('')).size;
        score += uniqueLetters * 50;
        
        const vowels = (word.match(/[aeiou]/g) || []).length;
        if (vowels >= 2 && vowels <= 3) {
            score += 100;
        }
        
        const commonPairs = ['st', 'th', 'ch', 'sh', 'er', 'an', 'in', 'on', 'at', 'or'];
        commonPairs.forEach(pair => {
            if (word.includes(pair)) {
                score += 30;
            }
        });
        
        if (this.usageData.wordSuccessRate[word]) {
            const data = this.usageData.wordSuccessRate[word];
            const successRate = data.success / data.total;
            score += successRate * 200;
        }
        
        return score;
    }
    
    getBestSuggestion() {
        if (this.possibleWords.length === 0) {
            if (this.lastValidSuggestions.length > 1) {
                return this.lastValidSuggestions[1];
            }
            return this.lastValidSuggestions[0] || 'raise';
        }
        
        if (this.possibleWords.length === 1) {
            return this.possibleWords[0];
        }
        
        if (this.attempts.length === 0) {
            const topStarters = ['soare', 'roate', 'raise', 'arise', 'irate', 'slate', 'crane', 'stare'];
            for (const starter of topStarters) {
                if (this.possibleWords.includes(starter)) {
                    return starter;
                }
            }
        }
        
        if (this.possibleWords.length <= 20) {
            const scoredWords = this.possibleWords.map(word => ({
                word,
                score: this.scoreWord(word)
            }));
            
            scoredWords.sort((a, b) => b.score - a.score);
            
            return scoredWords[0].word;
        }
        
        const sample = this.possibleWords.slice(0, Math.min(100, this.possibleWords.length));
        const scoredWords = sample.map(word => ({
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
        
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const suggestedWord = document.getElementById('suggestion').textContent;
                if (suggestedWord) {
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
            alert('Word must be exactly 5 letters');
            return;
        }
        
        if (!this.isValidWord(word)) {
            const response = confirm('Word not in dictionary. Add it and continue?');
            if (response) {
                this.allWords.push(word);
                this.possibleWords.push(word);
            } else {
                return;
            }
        }
        
        if (feedback.length !== 5) {
            alert('Feedback must be 5 characters');
            return;
        }
        
        if (!/^[GYB]+$/.test(feedback)) {
            alert('Feedback must only contain G, Y, or B');
            return;
        }
        
        if (feedback === 'GGGGG') {
            this.logWordPerformance(word, true, this.attempts.length + 1);
            this.logGameComplete(this.attempts.length + 1);
            alert(`Solved in ${this.attempts.length + 1} attempts. The word was ${word.toUpperCase()}`);
            return;
        }
        
        if (this.possibleWords.length > 0) {
            this.lastValidSuggestions = [...this.possibleWords];
        }
        
        this.applyFeedback(word, feedback);
        this.attempts.push({ word, feedback });
        
        this.logWordPerformance(word, false, this.attempts.length);
        
        document.getElementById('wordInput').value = '';
        document.getElementById('feedbackInput').value = '';
        document.getElementById('wordInput').focus();
        
        document.getElementById('undoBtn').disabled = false;
        
        this.updateHistory();
        this.updateDisplay();
        
        if (this.possibleWords.length === 0) {
            alert('No exact matches found. Using next best suggestion from previous list.');
        }
    }
    
    isValidWord(word) {
        return this.allWords.includes(word) || /^[a-z]{5}$/.test(word);
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
        document.getElementById('headerStats').textContent = `${possible.toLocaleString()} possible ${this.attempts.length} attempts`;
        
        const wordsList = document.getElementById('wordsList');
        if (possible === 0) {
            wordsList.textContent = 'No exact matches. Using fallback suggestions.';
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
            container.innerHTML = '<p class="empty-state">No attempts yet. Enter your first guess above</p>';
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
        
        if (this.possibleWords.length > 0) {
            this.lastValidSuggestions = [...this.possibleWords];
        }
        
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
        this.lastValidSuggestions = [...this.allWords];
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
        if (suggestion) {
            document.getElementById('wordInput').value = suggestion;
            document.getElementById('wordInput').focus();
        }
    }
}

const solver = new WordleSolver();
