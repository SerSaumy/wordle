// Performance optimization: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
        try {
            const stored = localStorage.getItem('wordleUsageData');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Could not load usage data:', e);
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
        try {
            localStorage.setItem('wordleUsageData', JSON.stringify(this.usageData));
        } catch (e) {
            console.warn('Could not save usage data:', e);
        }
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
        try {
            await this.loadWords();
            this.setupEventListeners();
            this.updateDisplay();
            
            setTimeout(() => {
                document.getElementById('wordInput').focus();
            }, 100);
        } catch (error) {
            console.error('Initialization error:', error);
            document.getElementById('wordCount').textContent = 'Error loading. Please refresh.';
        }
    }
    
    async loadWords() {
        try {
            const [answersRes, guessesRes] = await Promise.all([
                fetch('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt'),
                fetch('https://gist.githubusercontent.com/cfreshman/cdcdf777450c5b5301e439061d29694c/raw/wordle-allowed-guesses.txt')
            ]);
            
            const answersText = await answersRes.text();
            const answers = answersText.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length === 5);
            
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
            document.getElementById('wordCount').textContent = `${this.allWords.length.toLocaleString()} words loaded (offline mode)`;
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
    
    calculateEntropy(word) {
        const patterns = new Map();
        
        for (const answer of this.possibleWords) {
            const pattern = this.getPattern(word, answer);
            patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }
        
        let entropy = 0;
        const total = this.possibleWords.length;
        
        for (const count of patterns.values()) {
            const probability = count / total;
            entropy -= probability * Math.log2(probability);
        }
        
        return entropy;
    }
    
    getPattern(word, answer) {
        const pattern = new Array(5).fill('B');
        const answerLetters = answer.split('');
        const wordLetters = word.split('');
        
        for (let i = 0; i < 5; i++) {
            if (wordLetters[i] === answerLetters[i]) {
                pattern[i] = 'G';
                answerLetters[i] = null;
                wordLetters[i] = null;
            }
        }
        
        for (let i = 0; i < 5; i++) {
            if (wordLetters[i] !== null) {
                const answerIndex = answerLetters.indexOf(wordLetters[i]);
                if (answerIndex !== -1) {
                    pattern[i] = 'Y';
                    answerLetters[answerIndex] = null;
                }
            }
        }
        
        return pattern.join('');
    }
    
    calculateFrequencies() {
        const letterFreq = {};
        const positionFreq = [{}, {}, {}, {}, {}];
        
        for (const word of this.possibleWords) {
            const uniqueLetters = new Set();
            
            for (let i = 0; i < 5; i++) {
                const letter = word[i];
                
                positionFreq[i][letter] = (positionFreq[i][letter] || 0) + 1;
                
                if (!uniqueLetters.has(letter)) {
                    letterFreq[letter] = (letterFreq[letter] || 0) + 1;
                    uniqueLetters.add(letter);
                }
            }
        }
        
        return { letterFreq, positionFreq };
    }
    
    scoreWord(word, isStartingWord = false) {
        let score = 0;
        const { letterFreq, positionFreq } = this.calculateFrequencies();
        
        const uniqueLetters = new Set(word.split(''));
        const uniqueBonus = uniqueLetters.size * 100;
        score += uniqueBonus;
        
        for (let i = 0; i < 5; i++) {
            const letter = word[i];
            const posFreq = positionFreq[i][letter] || 0;
            const positionScore = (posFreq / this.possibleWords.length) * 500;
            score += positionScore;
        }
        
        const uniqueLetterCoverage = new Set();
        for (let i = 0; i < 5; i++) {
            const letter = word[i];
            if (!uniqueLetterCoverage.has(letter)) {
                const coverage = (letterFreq[letter] || 0) / this.possibleWords.length;
                score += coverage * 300;
                uniqueLetterCoverage.add(letter);
            }
        }
        
        const vowels = word.match(/[aeiou]/g) || [];
        const vowelCount = vowels.length;
        if (vowelCount >= 2 && vowelCount <= 3) {
            score += 150;
        } else if (vowelCount === 1 || vowelCount === 4) {
            score += 50;
        }
        
        const goodPairs = ['st', 'th', 'ch', 'sh', 'wh', 'ph', 'tr', 'cr', 'br', 'fr', 'gr', 'pr', 'dr'];
        const greatPairs = ['er', 'ing', 'ly', 'ed', 'es'];
        
        for (const pair of goodPairs) {
            if (word.includes(pair)) score += 40;
        }
        for (const pair of greatPairs) {
            if (word.includes(pair)) score += 60;
        }
        
        if (isStartingWord) {
            const rareLetters = ['j', 'q', 'x', 'z'];
            for (const rare of rareLetters) {
                if (word.includes(rare)) score -= 200;
            }
        }
        
        const commonStarts = ['s', 't', 'c', 'p', 'a', 'b', 'f', 'm', 'd', 'r'];
        if (commonStarts.includes(word[0])) {
            score += 60;
        }
        
        const commonEnds = ['e', 's', 't', 'd', 'n', 'r', 'y'];
        if (commonEnds.includes(word[4])) {
            score += 60;
        }
        
        if (this.usageData.wordSuccessRate[word]) {
            const data = this.usageData.wordSuccessRate[word];
            const successRate = data.success / data.total;
            score += successRate * 250;
        }
        
        return score;
    }
    
    getBestSuggestion() {
        if (this.possibleWords.length === 0) {
            return this.lastValidSuggestions[0] || 'raise';
        }
        
        if (this.possibleWords.length === 1) {
            return this.possibleWords[0];
        }
        
        if (this.attempts.length === 0) {
            const eliteStarters = ['soare', 'roate', 'raise', 'raile', 'slate', 'crane', 'crate', 'trace', 'stare', 'arise'];
            for (const starter of eliteStarters) {
                if (this.allWords.includes(starter)) {
                    return starter;
                }
            }
        }
        
        if (this.possibleWords.length <= 2) {
            return this.possibleWords[0];
        }
        
        if (this.possibleWords.length <= 50) {
            const scored = this.possibleWords.map(word => ({
                word,
                score: this.scoreWord(word, false)
            }));
            
            scored.sort((a, b) => b.score - a.score);
            return scored[0].word;
        }
        
        if (this.possibleWords.length <= 500) {
            const sample = this.possibleWords.slice(0, Math.min(150, this.possibleWords.length));
            
            const scored = sample.map(word => {
                const freqScore = this.scoreWord(word, false);
                const entropyScore = this.calculateEntropy(word) * 200;
                
                return {
                    word,
                    score: freqScore * 0.6 + entropyScore * 0.4
                };
            });
            
            scored.sort((a, b) => b.score - a.score);
            return scored[0].word;
        }
        
        const sample = this.possibleWords.slice(0, 200);
        
        const scored = sample.map(word => {
            const entropyScore = this.calculateEntropy(word) * 250;
            const freqScore = this.scoreWord(word, true);
            
            return {
                word,
                score: entropyScore * 0.7 + freqScore * 0.3
            };
        });
        
        scored.sort((a, b) => b.score - a.score);
        return scored[0].word;
    }
    
    setupEventListeners() {
        const wordInput = document.getElementById('wordInput');
        const feedbackInput = document.getElementById('feedbackInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const undoBtn = document.getElementById('undoBtn');
        const resetBtn = document.getElementById('resetBtn');
        const suggestion = document.getElementById('suggestion');
        
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                this.reset();
                return;
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                e.stopPropagation();
                if (!undoBtn.disabled) {
                    this.undoLast();
                }
                return;
            }
        }, true);
        
        suggestion.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.copySuggestion();
            }
        });
        
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const suggestedWord = document.getElementById('suggestion').textContent;
                if (suggestedWord) {
                    wordInput.value = suggestedWord;
                }
                feedbackInput.focus();
            } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                feedbackInput.focus();
            }
        });
        
        feedbackInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.processGuess();
            }
        });
        
        const debouncedValidation = debounce(() => {
            const word = wordInput.value.trim().toLowerCase();
            if (word.length === 5 && !this.isValidWord(word)) {
                wordInput.classList.add('error');
            } else {
                wordInput.classList.remove('error');
            }
        }, 500);
        
        wordInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            debouncedValidation();
        });
        
        feedbackInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            const feedback = e.target.value;
            if (feedback.length > 0 && !/^[GYB]*$/.test(feedback)) {
                feedbackInput.classList.add('error');
            } else {
                feedbackInput.classList.remove('error');
            }
        });
        
        analyzeBtn.addEventListener('click', () => this.processGuess());
        undoBtn.addEventListener('click', () => this.undoLast());
        resetBtn.addEventListener('click', () => this.reset());
        suggestion.addEventListener('click', () => this.copySuggestion());
    }
    
    processGuess() {
        const wordInput = document.getElementById('wordInput');
        const feedbackInput = document.getElementById('feedbackInput');
        
        const word = wordInput.value.trim().toLowerCase();
        const feedback = feedbackInput.value.trim().toUpperCase();
        
        wordInput.classList.remove('error');
        feedbackInput.classList.remove('error');
        
        if (word.length !== 5) {
            wordInput.classList.add('error');
            wordInput.focus();
            this.showToast('Word must be exactly 5 letters', 'error');
            return;
        }
        
        if (!this.isValidWord(word)) {
            this.allWords.push(word);
            this.possibleWords.push(word);
            this.showToast(`Added "${word.toUpperCase()}" to dictionary`, 'info');
        }
        
        if (feedback.length !== 5) {
            feedbackInput.classList.add('error');
            feedbackInput.focus();
            this.showToast('Feedback must be 5 characters', 'error');
            return;
        }
        
        if (!/^[GYB]+$/.test(feedback)) {
            feedbackInput.classList.add('error');
            feedbackInput.focus();
            this.showToast('Feedback must only contain G, Y, or B', 'error');
            return;
        }
        
        if (feedback === 'GGGGG') {
            this.logWordPerformance(word, true, this.attempts.length + 1);
            this.logGameComplete(this.attempts.length + 1);
            wordInput.classList.add('success');
            this.showToast(`🎉 Solved in ${this.attempts.length + 1} attempts!`, 'success');
            return;
        }
        
        if (this.possibleWords.length > 0) {
            this.lastValidSuggestions = [...this.possibleWords];
        }
        
        this.applyFeedback(word, feedback);
        this.attempts.push({ word, feedback });
        
        this.logWordPerformance(word, false, this.attempts.length);
        
        wordInput.value = '';
        feedbackInput.value = '';
        wordInput.focus();
        
        document.getElementById('undoBtn').disabled = false;
        
        this.updateHistory();
        this.updateDisplay();
        
        if (this.possibleWords.length === 0) {
            this.showToast('No exact matches. Using best suggestion.', 'warning');
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
        
        const stickyElement = document.getElementById('suggestionSticky');
        if (stickyElement) {
            stickyElement.textContent = suggestion.toUpperCase();
        }
        
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
            container.innerHTML = '<p class="empty-state">No attempts yet</p>';
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
        
        wordInput.value = '';
        feedbackInput.value = '';
        wordInput.classList.remove('error', 'success');
        feedbackInput.classList.remove('error', 'success');
        
        document.getElementById('undoBtn').disabled = true;
        
        this.updateHistory();
        this.updateDisplay();
        
        this.showToast('New game started', 'success');
        
        setTimeout(() => {
            wordInput.focus();
        }, 100);
    }
    
    copySuggestion() {
        const suggestion = document.getElementById('suggestion').textContent;
        if (suggestion) {
            document.getElementById('wordInput').value = suggestion;
            document.getElementById('wordInput').focus();
        }
    }
    
    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('toast-show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const solver = new WordleSolver();
    });
} else {
    const solver = new WordleSolver();
}
