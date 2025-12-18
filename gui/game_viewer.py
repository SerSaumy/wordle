"""Real-time game visualization panel"""

import tkinter as tk
from tkinter import ttk
from utils.config import COLORS


class GameViewer(ttk.Frame):
    def __init__(self, parent, color_scheme):
        super().__init__(parent)
        self.colors = color_scheme
        self.tiles = []
        self.create_widgets()
    
    def create_widgets(self):
        """Create game board visualization"""
        # Header
        header = tk.Label(
            self,
            text="GAME BOARD",
            font=('Segoe UI', 11, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['accent']
        )
        header.pack(pady=(0, 15))
        
        # Game board frame
        board_container = tk.Frame(self, bg=self.colors['bg_light'])
        board_container.pack(pady=10)
        
        board_frame = tk.Frame(board_container, bg=self.colors['bg_dark'], padx=15, pady=15)
        board_frame.pack()
        
        # Create 6x5 grid of tiles
        self.tiles = []
        for row in range(6):
            row_tiles = []
            row_frame = tk.Frame(board_frame, bg=self.colors['bg_dark'])
            row_frame.pack(pady=3)
            
            for col in range(5):
                tile = tk.Label(
                    row_frame,
                    text='',
                    font=('Segoe UI', 18, 'bold'),
                    width=3,
                    height=1,
                    bg='#2a2a3e',
                    fg='white',
                    relief='flat',
                    borderwidth=2,
                    highlightthickness=1,
                    highlightbackground='#3a3a4e',
                    highlightcolor='#3a3a4e'
                )
                tile.pack(side='left', padx=3)
                row_tiles.append(tile)
            
            self.tiles.append(row_tiles)
        
        # Divider
        tk.Frame(self, bg=self.colors['text_dim'], height=1).pack(fill='x', pady=15)
        
        # Info section
        info_frame = tk.Frame(self, bg=self.colors['bg_light'])
        info_frame.pack(fill='x', padx=10)
        
        # Current word
        tk.Label(
            info_frame,
            text="Current Word:",
            font=('Segoe UI', 9),
            bg=self.colors['bg_light'],
            fg=self.colors['text_dim']
        ).pack(anchor='w')
        
        self.current_word_label = tk.Label(
            info_frame,
            text="-",
            font=('Consolas', 14, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['accent_light']
        )
        self.current_word_label.pack(anchor='w', pady=(0, 10))
        
        # Game stats grid
        stats_grid = tk.Frame(info_frame, bg=self.colors['bg_light'])
        stats_grid.pack(fill='x')
        
        # Game number
        game_frame = tk.Frame(stats_grid, bg=self.colors['bg_light'])
        game_frame.pack(fill='x', pady=3)
        tk.Label(
            game_frame,
            text="Game:",
            font=('Segoe UI', 9),
            bg=self.colors['bg_light'],
            fg=self.colors['text_dim'],
            width=12,
            anchor='w'
        ).pack(side='left')
        self.game_number_label = tk.Label(
            game_frame,
            text="#0",
            font=('Segoe UI', 9, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['text']
        )
        self.game_number_label.pack(side='left')
        
        # Attempt
        attempt_frame = tk.Frame(stats_grid, bg=self.colors['bg_light'])
        attempt_frame.pack(fill='x', pady=3)
        tk.Label(
            attempt_frame,
            text="Attempt:",
            font=('Segoe UI', 9),
            bg=self.colors['bg_light'],
            fg=self.colors['text_dim'],
            width=12,
            anchor='w'
        ).pack(side='left')
        self.attempt_label = tk.Label(
            attempt_frame,
            text="0/6",
            font=('Segoe UI', 9, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['text']
        )
        self.attempt_label.pack(side='left')
        
        # Vocabulary
        vocab_frame = tk.Frame(stats_grid, bg=self.colors['bg_light'])
        vocab_frame.pack(fill='x', pady=3)
        tk.Label(
            vocab_frame,
            text="Vocabulary:",
            font=('Segoe UI', 9),
            bg=self.colors['bg_light'],
            fg=self.colors['text_dim'],
            width=12,
            anchor='w'
        ).pack(side='left')
        self.vocab_label = tk.Label(
            vocab_frame,
            text="0",
            font=('Segoe UI', 9, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['text']
        )
        self.vocab_label.pack(side='left')
        
        # Recently learned words section
        tk.Frame(self, bg=self.colors['text_dim'], height=1).pack(fill='x', pady=15)
        
        recent_header = tk.Label(
            self,
            text="RECENTLY LEARNED",
            font=('Segoe UI', 9, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['text_dim']
        )
        recent_header.pack(anchor='w', padx=10)
        
        recent_container = tk.Frame(self, bg=self.colors['bg_dark'])
        recent_container.pack(fill='both', expand=True, padx=10, pady=10)
        
        self.recent_words_text = tk.Text(
            recent_container,
            height=8,
            font=('Consolas', 9),
            wrap='word',
            bg=self.colors['bg_dark'],
            fg=self.colors['text'],
            insertbackground=self.colors['accent'],
            selectbackground=self.colors['accent'],
            borderwidth=0,
            highlightthickness=0
        )
        self.recent_words_text.pack(side='left', fill='both', expand=True)
        
        scrollbar = ttk.Scrollbar(recent_container, command=self.recent_words_text.yview)
        scrollbar.pack(side='right', fill='y')
        self.recent_words_text.config(yscrollcommand=scrollbar.set)
    
    def reset_board(self):
        """Clear the game board"""
        for row in self.tiles:
            for tile in row:
                tile.config(text='', bg='#2a2a3e', highlightbackground='#3a3a4e')
    
    def update_tile(self, row, col, letter, status):
        """Update a single tile"""
        if row < 0 or row >= 6 or col < 0 or col >= 5:
            return
        
        tile = self.tiles[row][col]
        tile.config(text=letter.upper())
        
        # Set color based on status
        color_map = {
            'correct': COLORS['correct'],
            'present': COLORS['present'],
            'absent': COLORS['absent'],
            'empty': '#2a2a3e',
            'pending': '#3a3a4e'
        }
        
        bg_color = color_map.get(status, '#2a2a3e')
        tile.config(bg=bg_color, highlightbackground=bg_color)
    
    def update_row(self, row, word, feedback):
        """Update an entire row"""
        for col, (letter, fb) in enumerate(zip(word, feedback)):
            status = fb.get('status', 'empty')
            self.update_tile(row, col, letter, status)
    
    def update_game_info(self, bot_state):
        """Update game information"""
        current_game = bot_state.get('current_game')
        if current_game:
            game_num = current_game.get('game_number', 0)
            self.game_number_label.config(text=f"#{game_num}")
            
            attempts = current_game.get('attempts', [])
            self.attempt_label.config(text=f"{len(attempts)}/6")
            
            if attempts:
                last_attempt = attempts[-1]
                word = last_attempt.get('word', '')
                self.current_word_label.config(text=word.upper())
        
        vocab_size = bot_state.get('vocabulary_size', 0)
        self.vocab_label.config(text=f"{vocab_size:,}")
        
        # Update recently learned words
        learned_words = bot_state.get('learned_words', [])
        if learned_words:
            recent_text = '\n'.join(learned_words[-50:])
            self.recent_words_text.delete('1.0', 'end')
            self.recent_words_text.insert('1.0', recent_text)
    
    def display_game(self, game_data):
        """Display a complete game"""
        self.reset_board()
        
        attempts = game_data.get('attempts', [])
        for attempt in attempts:
            row = attempt['attempt'] - 1
            word = attempt['word']
            feedback = attempt['feedback']
            self.update_row(row, word, feedback)
