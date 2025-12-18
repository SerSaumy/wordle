"""Wordle bot with improved gameplay logic"""

import time
import json
from datetime import datetime
from typing import Dict, List
from bot.selenium_controller import SeleniumController
from bot.word_learner import WordLearner
from utils.config import MAX_ATTEMPTS, GAME_HISTORY_FILE, STATISTICS_FILE
from utils.logger import logger


class WordleBot:
    def __init__(self):
        self.controller = SeleniumController()
        self.learner = WordLearner()
        self.game_history = []
        self.statistics = {
            'total_games': 0,
            'games_won': 0,
            'games_lost': 0,
            'total_attempts': 0,
            'words_learned': len(self.learner.learned_words),
            'learning_curve': []
        }
        self.current_game = None
        self.is_running = False
        self.load_history()
    
    def start(self):
        """Start bot"""
        logger.info("[BOT] Starting...")
        if not self.controller.start_browser():
            return False
        if not self.controller.navigate_to_game():
            return False
        self.is_running = True
        logger.info("[BOT] Ready!")
        return True
    
    def stop(self):
        """Stop bot"""
        self.is_running = False
        self.controller.close_browser()
        self.save_history()
        logger.info("[BOT] Stopped")
    
    def play_game(self) -> Dict:
        """Play one game"""
        if not self.is_running:
            return None
        
        game_num = self.statistics['total_games'] + 1
        logger.info(f"\n{'='*60}")
        logger.info(f"[GAME #{game_num}] Starting | Vocab: {len(self.learner.learned_words)} words")
        logger.info(f"{'='*60}")
        
        game_data = {
            'game_number': game_num,
            'timestamp': datetime.now().isoformat(),
            'attempts': [],
            'won': False,
            'target_word': None,
            'vocabulary_size': len(self.learner.learned_words)
        }
        
        self.current_game = game_data
        constraints = {
            'green': {},
            'yellow': set(),
            'gray': set(),
            'yellow_positions': {}
        }
        
        for attempt_num in range(1, MAX_ATTEMPTS + 1):
            if not self.is_running:
                break
            
            # Generate guess
            if len(self.learner.learned_words) < 50 or attempt_num == 1:
                guess = self.learner.generate_exploration_word()
                logger.info(f"[ATTEMPT {attempt_num}/6] Trying: {guess.upper()}")
            else:
                guess = self.learner.generate_smart_guess(constraints)
                logger.info(f"[ATTEMPT {attempt_num}/6] Smart guess: {guess.upper()}")
            
            # Enter word - returns False if rejected
            word_accepted = self.controller.enter_word(guess)
            
            if not word_accepted:
                # Word was rejected as invalid
                logger.warning(f"[INVALID] '{guess.upper()}' not in word list")
                self.learner.add_invalid_word(guess)
                # Don't count this as an attempt, try again
                continue
            
            # Word was accepted! Learn it
            self.learner.add_valid_word(guess)
            
            # Get feedback
            feedback = self.controller.get_feedback(attempt_num)
            
            if not feedback:
                logger.warning("[WARN] Could not get feedback, waiting...")
                time.sleep(2)
                feedback = self.controller.get_feedback(attempt_num)
            
            if feedback:
                attempt_data = {
                    'attempt': attempt_num,
                    'word': guess,
                    'feedback': feedback
                }
                game_data['attempts'].append(attempt_data)
                
                # Update constraints
                self._update_constraints(constraints, guess, feedback)
                
                # Check if won
                if all(f['status'] == 'correct' for f in feedback):
                    game_data['won'] = True
                    game_data['target_word'] = guess
                    logger.info(f"[WIN] Solved in {attempt_num} attempts! Word: {guess.upper()}")
                    break
            else:
                logger.error("[ERROR] No feedback received")
            
            time.sleep(1)
        
        # Update stats
        self._update_statistics(game_data)
        self.game_history.append(game_data)
        self.save_history()
        
        # Start new game
        if self.is_running:
            time.sleep(3)
            self.controller.start_new_game()
        
        return game_data
    
    def play_multiple_games(self, num_games: int):
        """Play multiple games"""
        logger.info(f"[SESSION] Playing {num_games} games")
        
        for i in range(num_games):
            if not self.is_running:
                break
            
            self.play_game()
            time.sleep(2)
        
        logger.info(f"[SESSION] Complete!")
        self._print_statistics()
    
    def _update_constraints(self, constraints: Dict, guess: str, feedback: List[Dict]):
        """Update constraints from feedback"""
        for i, fb in enumerate(feedback):
            letter = fb['letter']
            status = fb['status']
            
            if status == 'correct':
                constraints['green'][i] = letter
                constraints['yellow'].discard(letter)
            
            elif status == 'present':
                constraints['yellow'].add(letter)
                if letter not in constraints['yellow_positions']:
                    constraints['yellow_positions'][letter] = []
                constraints['yellow_positions'][letter].append(i)
            
            elif status == 'absent':
                if letter not in constraints['green'].values() and letter not in constraints['yellow']:
                    constraints['gray'].add(letter)
    
    def _update_statistics(self, game_data: Dict):
        """Update stats"""
        self.statistics['total_games'] += 1
        if game_data['won']:
            self.statistics['games_won'] += 1
        else:
            self.statistics['games_lost'] += 1
        
        self.statistics['total_attempts'] += len(game_data['attempts'])
        self.statistics['words_learned'] = len(self.learner.learned_words)
        
        self.statistics['learning_curve'].append({
            'game': self.statistics['total_games'],
            'vocabulary': len(self.learner.learned_words),
            'won': game_data['won']
        })
    
    def _print_statistics(self):
        """Print stats"""
        stats = self.statistics
        win_rate = (stats['games_won'] / stats['total_games'] * 100) if stats['total_games'] > 0 else 0
        avg = (stats['total_attempts'] / stats['games_won']) if stats['games_won'] > 0 else 0
        
        logger.info(f"\n{'='*60}")
        logger.info(f"[STATS] SESSION SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Total Games: {stats['total_games']}")
        logger.info(f"Won: {stats['games_won']} ({win_rate:.1f}%)")
        logger.info(f"Lost: {stats['games_lost']}")
        logger.info(f"Avg Attempts: {avg:.2f}")
        logger.info(f"Vocabulary: {stats['words_learned']} words")
        logger.info(f"{'='*60}\n")
    
    def load_history(self):
        """Load history"""
        try:
            with open(GAME_HISTORY_FILE, 'r') as f:
                content = f.read().strip()
                if content:
                    self.game_history = json.loads(content)
            
            with open(STATISTICS_FILE, 'r') as f:
                content = f.read().strip()
                if content:
                    self.statistics = json.loads(content)
                    
            logger.info(f"[SYSTEM] Loaded {len(self.game_history)} games")
        except:
            self.save_history()
    
    def save_history(self):
        """Save history"""
        try:
            with open(GAME_HISTORY_FILE, 'w') as f:
                json.dump(self.game_history, f, indent=2)
            with open(STATISTICS_FILE, 'w') as f:
                json.dump(self.statistics, f, indent=2)
        except Exception as e:
            logger.error(f"[ERROR] Save failed: {e}")
    
    def get_current_state(self) -> Dict:
        """Get state for GUI"""
        return {
            'is_running': self.is_running,
            'statistics': self.statistics,
            'current_game': self.current_game,
            'vocabulary_size': len(self.learner.learned_words),
            'learned_words': list(self.learner.learned_words)
        }
