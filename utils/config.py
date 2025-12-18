"""Configuration settings"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

os.makedirs(DATA_DIR, exist_ok=True)

LEARNED_WORDS_FILE = os.path.join(DATA_DIR, 'learned_words.json')
GAME_HISTORY_FILE = os.path.join(DATA_DIR, 'game_history.json')
STATISTICS_FILE = os.path.join(DATA_DIR, 'statistics.json')

# UNLIMITED WORDLE SITE
WORDLE_URL = "https://wordplay.com"
MAX_ATTEMPTS = 6
WORD_LENGTH = 5

INITIAL_EXPLORATION_GAMES = 50
MIN_WORDS_TO_START_SMART = 100

HEADLESS = False
IMPLICIT_WAIT = 5
PAGE_LOAD_TIMEOUT = 30

WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 900
UPDATE_INTERVAL = 500

COLORS = {
    'correct': '#6aaa64',
    'present': '#c9b458',
    'absent': '#787c7e',
    'empty': '#ffffff',
    'bg': '#121213',
    'text': '#ffffff'
}
