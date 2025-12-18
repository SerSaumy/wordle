"""Word learning with starter vocabulary"""

import json
import random
from collections import Counter
from typing import List, Set, Dict
from utils.config import LEARNED_WORDS_FILE, WORD_LENGTH
from utils.logger import logger


class WordLearner:
    def __init__(self):
        # Start with common valid 5-letter words as seed
        self.starter_words = [
            "raise", "later", "soare", "arise", "irate", "arose", "alter", "saner",
            "stare", "snare", "crate", "slate", "crane", "trace", "share", "spare",
            "parse", "reaps", "pares", "cares", "dares", "fares", "wares", "tares",
            "rates", "mates", "dates", "gates", "hates", "fates", "bates", "sates",
            "about", "after", "other", "which", "their", "there", "would", "could",
            "these", "those", "think", "place", "still", "where", "world", "first",
            "great", "heart", "house", "large", "point", "small", "round", "white",
            "black", "plain", "green", "light", "stand", "clear", "sound", "water"
        ]
        
        self.learned_words: Set[str] = set(self.starter_words)  # Start with seed words
        self.invalid_words: Set[str] = set()
        self.letter_frequencies: Counter = Counter()
        self.position_frequencies: Dict[int, Counter] = {i: Counter() for i in range(WORD_LENGTH)}
        self.used_exploration_words = set()
        
        self.load_learned_words()
        
        # Update frequencies with starter words
        for word in self.starter_words:
            self._update_frequencies(word)
    
    def load_learned_words(self):
        """Load previously learned words"""
        try:
            with open(LEARNED_WORDS_FILE, 'r') as f:
                content = f.read().strip()
                if not content:
                    logger.info("Empty learned words file, using starter vocabulary")
                    self.save_learned_words()
                    return
                
                data = json.loads(content)
                loaded_words = set(data.get('valid_words', []))
                
                # Merge with starter words
                self.learned_words = self.learned_words.union(loaded_words)
                self.invalid_words = set(data.get('invalid_words', []))
                
                logger.info(f"Loaded {len(self.learned_words)} words (including {len(self.starter_words)} starters)")
                
                # Rebuild frequency data
                for word in self.learned_words:
                    self._update_frequencies(word)
                    
        except FileNotFoundError:
            logger.info("No previous learned words, using starter vocabulary")
            self.save_learned_words()
        except json.JSONDecodeError as e:
            logger.warning(f"Corrupted file, resetting with starter vocabulary: {e}")
            self.learned_words = set(self.starter_words)
            self.invalid_words = set()
            self.save_learned_words()
        except Exception as e:
            logger.error(f"Error loading: {e}")
            self.save_learned_words()
    
    def save_learned_words(self):
        """Save learned words"""
        try:
            data = {
                'valid_words': sorted(list(self.learned_words)),
                'invalid_words': sorted(list(self.invalid_words)),
                'total_learned': len(self.learned_words)
            }
            with open(LEARNED_WORDS_FILE, 'w') as f:
                json.dump(data, f, indent=2)
            logger.debug(f"Saved {len(self.learned_words)} words")
        except Exception as e:
            logger.error(f"Error saving: {e}")
    
    def add_valid_word(self, word: str):
        """Add valid word"""
        word = word.lower()
        if word not in self.learned_words:
            self.learned_words.add(word)
            self._update_frequencies(word)
            self.save_learned_words()
            logger.info(f"[NEW WORD] Learned: {word.upper()} (Total: {len(self.learned_words)})")
    
    def add_invalid_word(self, word: str):
        """Mark word as invalid"""
        word = word.lower()
        if word not in self.invalid_words:
            self.invalid_words.add(word)
            self.save_learned_words()
            logger.debug(f"[INVALID] {word.upper()}")
    
    def _update_frequencies(self, word: str):
        """Update letter frequencies"""
        for letter in set(word):
            self.letter_frequencies[letter] += 1
        
        for i, letter in enumerate(word):
            self.position_frequencies[i][letter] += 1
    
    def generate_exploration_word(self) -> str:
        """Generate word for exploration - use starter words first"""
        # Use unused starter words first
        unused_starters = [w for w in self.starter_words if w not in self.used_exploration_words]
        
        if unused_starters:
            word = random.choice(unused_starters)
            self.used_exploration_words.add(word)
            return word
        
        # Then try learned words we haven't used recently
        available = [w for w in self.learned_words if w not in self.used_exploration_words]
        
        if available:
            word = random.choice(available)
            self.used_exploration_words.add(word)
            return word
        
        # Reset used set if we've exhausted all words
        if len(self.used_exploration_words) > 50:
            self.used_exploration_words.clear()
        
        # Fallback: pick any learned word
        return random.choice(list(self.learned_words)) if self.learned_words else self.starter_words[0]
    
    def generate_smart_guess(self, constraints: Dict = None) -> str:
        """Generate guess based on constraints"""
        candidates = list(self.learned_words)
        
        # Apply constraints if any
        if constraints:
            candidates = self._apply_constraints(candidates, constraints)
        
        if not candidates:
            # No candidates match constraints, try exploration
            return self.generate_exploration_word()
        
        # Score and pick best
        best_word = max(candidates, key=self._score_word)
        return best_word
    
    def _apply_constraints(self, candidates: List[str], constraints: Dict) -> List[str]:
        """Filter by constraints"""
        filtered = []
        
        green_positions = constraints.get('green', {})
        yellow_letters = constraints.get('yellow', set())
        gray_letters = constraints.get('gray', set())
        yellow_wrong_positions = constraints.get('yellow_positions', {})
        
        for word in candidates:
            valid = True
            
            # Green: must match position
            for pos, letter in green_positions.items():
                if word[pos] != letter:
                    valid = False
                    break
            
            if not valid:
                continue
            
            # Yellow: must be in word but not in known wrong positions
            for letter in yellow_letters:
                if letter not in word:
                    valid = False
                    break
            
            if not valid:
                continue
            
            # Yellow wrong positions
            for letter, positions in yellow_wrong_positions.items():
                for pos in positions:
                    if pos < len(word) and word[pos] == letter:
                        valid = False
                        break
                if not valid:
                    break
            
            if not valid:
                continue
            
            # Gray: must not be in word
            for letter in gray_letters:
                if letter in word:
                    valid = False
                    break
            
            if valid:
                filtered.append(word)
        
        return filtered
    
    def _score_word(self, word: str) -> float:
        """Score word by letter frequency"""
        score = 0.0
        unique_letters = set(word)
        
        for letter in unique_letters:
            score += self.letter_frequencies.get(letter, 0)
        
        for i, letter in enumerate(word):
            score += self.position_frequencies[i].get(letter, 0) * 0.5
        
        score *= (len(unique_letters) / WORD_LENGTH)
        
        return score
    
    def get_statistics(self) -> Dict:
        """Get stats"""
        return {
            'total_words': len(self.learned_words),
            'invalid_attempts': len(self.invalid_words),
            'top_letters': self.letter_frequencies.most_common(10),
            'vocabulary_size': len(self.learned_words)
        }
