"""Main GUI - Complete Material Design with All Features"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import time
from bot.wordle_bot import WordleBot
from utils.config import UPDATE_INTERVAL
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure


class MaterialUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Wordle Learning Bot")
        self.root.geometry("1400x900")
        
        # Material Design Colors
        self.colors = {
            'bg': '#F5F5F5',
            'surface': '#FFFFFF',
            'primary': '#8B7FD6',
            'secondary': '#7FD6A0',
            'accent': '#FF9F9F',
            'info': '#9FDFFF',
            'text': '#2C3E50',
            'text_light': '#7F8C8D',
            'success': '#7FD6A0',
            'error': '#FF9F9F',
            'warning': '#FFD69F'
        }
        
        self.root.configure(bg=self.colors['bg'])
        
        self.bot = None
        self.is_learning = False
        
        self.create_ui()
        self.setup_update_loop()
        
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def create_ui(self):
        """Create complete UI with tabs"""
        
        # TOP BAR
        top_bar = tk.Frame(self.root, bg=self.colors['primary'], height=70)
        top_bar.pack(fill='x')
        top_bar.pack_propagate(False)
        
        # Title
        title_frame = tk.Frame(top_bar, bg=self.colors['primary'])
        title_frame.pack(side='left', padx=30, pady=15)
        
        tk.Label(
            title_frame,
            text="Wordle Learning Bot",
            font=('Segoe UI', 20, 'bold'),
            bg=self.colors['primary'],
            fg='white'
        ).pack(anchor='w')
        
        tk.Label(
            title_frame,
            text="Self-learning AI • Unlimited Practice Mode",
            font=('Segoe UI', 10),
            bg=self.colors['primary'],
            fg='white'
        ).pack(anchor='w')
        
        # Status
        status_frame = tk.Frame(top_bar, bg=self.colors['primary'])
        status_frame.pack(side='right', padx=30)
        
        self.status_dot = tk.Canvas(status_frame, width=20, height=20, bg=self.colors['primary'], highlightthickness=0)
        self.status_dot.create_oval(2, 2, 18, 18, fill=self.colors['error'], outline='')
        self.status_dot.pack(side='left', padx=5)
        
        self.status_label = tk.Label(
            status_frame,
            text="Offline",
            font=('Segoe UI', 11, 'bold'),
            bg=self.colors['primary'],
            fg='white'
        )
        self.status_label.pack(side='left')
        
        # TABBED NOTEBOOK
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TNotebook', background=self.colors['bg'], borderwidth=0)
        style.configure('TNotebook.Tab', 
            background=self.colors['surface'],
            foreground=self.colors['text'],
            padding=[20, 10],
            font=('Segoe UI', 10, 'bold')
        )
        style.map('TNotebook.Tab',
            background=[('selected', self.colors['primary'])],
            foreground=[('selected', 'white')]
        )
        
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Create all tabs
        self.create_play_tab()
        self.create_stats_tab()
        self.create_graphs_tab()
        self.create_words_tab()
        self.create_log_tab()
    
    def create_play_tab(self):
        """TAB 1: PLAY - Main game controls"""
        play_frame = tk.Frame(self.notebook, bg=self.colors['bg'])
        self.notebook.add(play_frame, text="  PLAY  ")
        
        content = tk.Frame(play_frame, bg=self.colors['bg'])
        content.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Left: Game Board
        left = tk.Frame(content, bg=self.colors['surface'], relief='flat')
        left.pack(side='left', fill='both', expand=True, padx=(0, 10))
        
        tk.Label(
            left,
            text="Live Game Board",
            font=('Segoe UI', 16, 'bold'),
            bg=self.colors['surface'],
            fg=self.colors['text']
        ).pack(pady=20)
        
        # Game tiles
        tiles_container = tk.Frame(left, bg=self.colors['surface'])
        tiles_container.pack(pady=20)
        
        self.tiles = []
        for row in range(6):
            row_tiles = []
            row_frame = tk.Frame(tiles_container, bg=self.colors['surface'])
            row_frame.pack(pady=4)
            
            for col in range(5):
                tile = tk.Label(
                    row_frame,
                    text='',
                    font=('Segoe UI', 20, 'bold'),
                    width=3,
                    height=1,
                    bg='#E8E8E8',
                    fg=self.colors['text'],
                    relief='flat'
                )
                tile.pack(side='left', padx=4)
                row_tiles.append(tile)
            self.tiles.append(row_tiles)
        
        # Game info
        info = tk.Frame(left, bg=self.colors['surface'])
        info.pack(pady=20)
        
        self.game_number_label = tk.Label(
            info,
            text="Game: #0",
            font=('Segoe UI', 12),
            bg=self.colors['surface'],
            fg=self.colors['text_light']
        )
        self.game_number_label.pack(pady=3)
        
        self.current_word_label = tk.Label(
            info,
            text="Current Word: -----",
            font=('Segoe UI', 14, 'bold'),
            bg=self.colors['surface'],
            fg=self.colors['primary']
        )
        self.current_word_label.pack(pady=3)
        
        self.attempt_label = tk.Label(
            info,
            text="Attempt: 0/6",
            font=('Segoe UI', 11),
            bg=self.colors['surface'],
            fg=self.colors['text_light']
        )
        self.attempt_label.pack(pady=3)
        
        # Right: Controls
        right = tk.Frame(content, bg=self.colors['surface'], relief='flat')
        right.pack(side='right', fill='both', expand=True, padx=(10, 0))
        
        tk.Label(
            right,
            text="Bot Controls",
            font=('Segoe UI', 16, 'bold'),
            bg=self.colors['surface'],
            fg=self.colors['text']
        ).pack(pady=20)
        
        btn_container = tk.Frame(right, bg=self.colors['surface'])
        btn_container.pack(pady=20, padx=40, fill='x')
        
        # Start button
        self.start_btn = tk.Button(
            btn_container,
            text="▶  START BOT",
            font=('Segoe UI', 16, 'bold'),
            bg=self.colors['success'],
            fg='white',
            relief='flat',
            padx=50,
            pady=20,
            command=self.start_bot,
            cursor='hand2',
            activebackground='#6FC690'
        )
        self.start_btn.pack(pady=8, fill='x')
        
        # Stop button
        self.stop_btn = tk.Button(
            btn_container,
            text="■  STOP BOT",
            font=('Segoe UI', 16, 'bold'),
            bg=self.colors['error'],
            fg='white',
            relief='flat',
            padx=50,
            pady=20,
            command=self.stop_bot,
            state='disabled',
            cursor='hand2',
            activebackground='#FF8F8F'
        )
        self.stop_btn.pack(pady=8, fill='x')
        
        # Divider
        tk.Frame(right, bg='#E0E0E0', height=2).pack(fill='x', padx=40, pady=20)
        
        tk.Label(
            right,
            text="Quick Play",
            font=('Segoe UI', 14, 'bold'),
            bg=self.colors['surface'],
            fg=self.colors['text']
        ).pack(pady=10)
        
        # Game buttons
        game_btns = tk.Frame(right, bg=self.colors['surface'])
        game_btns.pack(padx=40, fill='x')
        
        for count in [1, 5, 10, 25, 50, 100]:
            tk.Button(
                game_btns,
                text=f"{count} Game{'s' if count > 1 else ''}",
                font=('Segoe UI', 12),
                bg=self.colors['info'],
                fg='white',
                relief='flat',
                padx=30,
                pady=12,
                command=lambda c=count: self.play_games(c),
                cursor='hand2',
                activebackground='#8FCFEF'
            ).pack(pady=4, fill='x')
        
        # Vocabulary display
        tk.Frame(right, bg='#E0E0E0', height=2).pack(fill='x', padx=40, pady=20)
        
        vocab_frame = tk.Frame(right, bg=self.colors['info'], relief='flat')
        vocab_frame.pack(padx=40, pady=10, fill='x')
        
        tk.Label(
            vocab_frame,
            text="Vocabulary Size",
            font=('Segoe UI', 10),
            bg=self.colors['info'],
            fg='white'
        ).pack(pady=(15, 5))
        
        self.vocab_display_label = tk.Label(
            vocab_frame,
            text="0",
            font=('Segoe UI', 32, 'bold'),
            bg=self.colors['info'],
            fg='white'
        )
        self.vocab_display_label.pack(pady=(5, 15))
    
    def create_stats_tab(self):
        """TAB 2: STATS - Performance metrics"""
        stats_frame = tk.Frame(self.notebook, bg=self.colors['bg'])
        self.notebook.add(stats_frame, text="  STATISTICS  ")
        
        tk.Label(
            stats_frame,
            text="Performance Metrics",
            font=('Segoe UI', 18, 'bold'),
            bg=self.colors['bg'],
            fg=self.colors['text']
        ).pack(pady=20)
        
        # Stats grid
        grid = tk.Frame(stats_frame, bg=self.colors['bg'])
        grid.pack(fill='x', padx=30, pady=10)
        
        self.stat_widgets = {}
        stats_data = [
            ('total', 'Total Games', '0', self.colors['primary']),
            ('wins', 'Games Won', '0', self.colors['success']),
            ('losses', 'Games Lost', '0', self.colors['error']),
            ('rate', 'Win Rate', '0%', self.colors['accent']),
            ('vocab', 'Vocabulary', '0', self.colors['info']),
            ('avg', 'Avg Attempts', '0.0', self.colors['warning']),
        ]
        
        for i in range(0, len(stats_data), 3):
            row = tk.Frame(grid, bg=self.colors['bg'])
            row.pack(fill='x', pady=5)
            
            for j in range(3):
                if i + j < len(stats_data):
                    key, label, value, color = stats_data[i + j]
                    card = self.create_stat_card_large(row, label, value, color)
                    card.pack(side='left', fill='both', expand=True, padx=5)
                    self.stat_widgets[key] = card
        
        # Recent games
        tk.Label(
            stats_frame,
            text="Recent Games",
            font=('Segoe UI', 14, 'bold'),
            bg=self.colors['bg'],
            fg=self.colors['text']
        ).pack(pady=(20, 10))
        
        recent_frame = tk.Frame(stats_frame, bg=self.colors['surface'])
        recent_frame.pack(fill='both', expand=True, padx=30, pady=10)
        
        self.recent_games_text = scrolledtext.ScrolledText(
            recent_frame,
            font=('Consolas', 10),
            bg=self.colors['surface'],
            fg=self.colors['text'],
            height=15,
            relief='flat'
        )
        self.recent_games_text.pack(fill='both', expand=True, padx=10, pady=10)
    
    def create_graphs_tab(self):
        """TAB 3: GRAPHS - Visual analytics"""
        graphs_frame = tk.Frame(self.notebook, bg=self.colors['bg'])
        self.notebook.add(graphs_frame, text="  GRAPHS  ")
        
        tk.Label(
            graphs_frame,
            text="Learning Analytics",
            font=('Segoe UI', 18, 'bold'),
            bg=self.colors['bg'],
            fg=self.colors['text']
        ).pack(pady=20)
        
        # Create matplotlib figures
        fig_container = tk.Frame(graphs_frame, bg=self.colors['bg'])
        fig_container.pack(fill='both', expand=True, padx=20, pady=10)
        
        # Learning curve
        left_graph = tk.Frame(fig_container, bg=self.colors['surface'])
        left_graph.pack(side='left', fill='both', expand=True, padx=(0, 5))
        
        tk.Label(
            left_graph,
            text="Vocabulary Growth",
            font=('Segoe UI', 12, 'bold'),
            bg=self.colors['surface'],
            fg=self.colors['text']
        ).pack(pady=10)
        
        self.fig1 = Figure(figsize=(6, 4), dpi=80, facecolor='white')
        self.ax1 = self.fig1.add_subplot(111)
        self.canvas1 = FigureCanvasTkAgg(self.fig1, left_graph)
        self.canvas1.get_tk_widget().pack(fill='both', expand=True, padx=10, pady=10)
        
        # Win rate
        right_graph = tk.Frame(fig_container, bg=self.colors['surface'])
        right_graph.pack(side='right', fill='both', expand=True, padx=(5, 0))
        
        tk.Label(
            right_graph,
            text="Win Rate Over Time",
            font=('Segoe UI', 12, 'bold'),
            bg=self.colors['surface'],
            fg=self.colors['text']
        ).pack(pady=10)
        
        self.fig2 = Figure(figsize=(6, 4), dpi=80, facecolor='white')
        self.ax2 = self.fig2.add_subplot(111)
        self.canvas2 = FigureCanvasTkAgg(self.fig2, right_graph)
        self.canvas2.get_tk_widget().pack(fill='both', expand=True, padx=10, pady=10)
        
        # Initialize empty graphs
        self.update_empty_graphs()
    
    def create_words_tab(self):
        """TAB 4: WORDS - Learned vocabulary"""
        words_frame = tk.Frame(self.notebook, bg=self.colors['bg'])
        self.notebook.add(words_frame, text="  VOCABULARY  ")
        
        header = tk.Frame(words_frame, bg=self.colors['bg'])
        header.pack(fill='x', pady=20)
        
        tk.Label(
            header,
            text="Learned Words",
            font=('Segoe UI', 18, 'bold'),
            bg=self.colors['bg'],
            fg=self.colors['text']
        ).pack()
        
        self.words_count_label = tk.Label(
            header,
            text="0 words learned",
            font=('Segoe UI', 12),
            bg=self.colors['bg'],
            fg=self.colors['text_light']
        )
        self.words_count_label.pack(pady=5)
        
        # Search box
        search_frame = tk.Frame(words_frame, bg=self.colors['bg'])
        search_frame.pack(fill='x', padx=30, pady=10)
        
        tk.Label(
            search_frame,
            text="Search:",
            font=('Segoe UI', 10),
            bg=self.colors['bg'],
            fg=self.colors['text']
        ).pack(side='left', padx=5)
        
        self.word_search = tk.Entry(
            search_frame,
            font=('Segoe UI', 11),
            bg=self.colors['surface'],
            fg=self.colors['text'],
            relief='flat'
        )
        self.word_search.pack(side='left', fill='x', expand=True, padx=5)
        self.word_search.bind('<KeyRelease>', lambda e: self.filter_words())
        
        # Words display
        words_container = tk.Frame(words_frame, bg=self.colors['surface'])
        words_container.pack(fill='both', expand=True, padx=30, pady=10)
        
        self.words_text = scrolledtext.ScrolledText(
            words_container,
            font=('Segoe UI', 10),
            bg=self.colors['surface'],
            fg=self.colors['text'],
            wrap='word',
            relief='flat'
        )
        self.words_text.pack(fill='both', expand=True, padx=10, pady=10)
    
    def create_log_tab(self):
        """TAB 5: LOG - Activity log"""
        log_frame = tk.Frame(self.notebook, bg=self.colors['bg'])
        self.notebook.add(log_frame, text="  ACTIVITY LOG  ")
        
        tk.Label(
            log_frame,
            text="Activity Log",
            font=('Segoe UI', 18, 'bold'),
            bg=self.colors['bg'],
            fg=self.colors['text']
        ).pack(pady=20)
        
        # Log controls
        controls = tk.Frame(log_frame, bg=self.colors['bg'])
        controls.pack(fill='x', padx=30, pady=10)
        
        tk.Button(
            controls,
            text="Clear Log",
            font=('Segoe UI', 10),
            bg=self.colors['error'],
            fg='white',
            relief='flat',
            padx=20,
            pady=8,
            command=lambda: self.log_text.delete('1.0', 'end'),
            cursor='hand2'
        ).pack(side='right')
        
        # Log display
        log_container = tk.Frame(log_frame, bg=self.colors['surface'])
        log_container.pack(fill='both', expand=True, padx=30, pady=10)
        
        self.log_text = scrolledtext.ScrolledText(
            log_container,
            font=('Consolas', 9),
            bg='#1E1E1E',
            fg='#00FF00',
            wrap='word',
            relief='flat'
        )
        self.log_text.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Color tags
        self.log_text.tag_config('info', foreground='#00BFFF')
        self.log_text.tag_config('success', foreground='#00FF00')
        self.log_text.tag_config('error', foreground='#FF0000')
        self.log_text.tag_config('warning', foreground='#FFA500')
    
    def create_stat_card_large(self, parent, label, value, color):
        """Create large stat card"""
        card = tk.Frame(parent, bg=color, relief='flat')
        
        tk.Label(
            card,
            text=label,
            font=('Segoe UI', 11),
            bg=color,
            fg='white'
        ).pack(pady=(15, 5))
        
        value_label = tk.Label(
            card,
            text=value,
            font=('Segoe UI', 28, 'bold'),
            bg=color,
            fg='white'
        )
        value_label.pack(pady=(5, 15))
        
        return value_label
    
    def setup_update_loop(self):
        """Setup periodic updates"""
        self.update_display()
    
    def update_display(self):
        """Update all displays"""
        if self.bot and self.bot.is_running:
            state = self.bot.get_current_state()
            self.update_game_board(state)
            self.update_statistics(state)
            self.update_graphs(state)
            self.update_vocabulary(state)
        
        self.root.after(UPDATE_INTERVAL, self.update_display)
    
    def update_game_board(self, state):
        """Update game board"""
        current_game = state.get('current_game')
        
        # Reset board
        for row in self.tiles:
            for tile in row:
                tile.config(text='', bg='#E8E8E8')
        
        if current_game:
            game_num = current_game.get('game_number', 0)
            self.game_number_label.config(text=f"Game: #{game_num}")
            
            attempts = current_game.get('attempts', [])
            self.attempt_label.config(text=f"Attempt: {len(attempts)}/6")
            
            # Display attempts
            for attempt in attempts:
                row_idx = attempt['attempt'] - 1
                if row_idx >= 6:
                    continue
                    
                word = attempt['word']
                feedback = attempt['feedback']
                
                for col, (letter, fb) in enumerate(zip(word, feedback)):
                    tile = self.tiles[row_idx][col]
                    tile.config(text=letter.upper())
                    
                    status = fb.get('status', 'empty')
                    if status == 'correct':
                        tile.config(bg=self.colors['success'], fg='white')
                    elif status == 'present':
                        tile.config(bg=self.colors['warning'], fg='white')
                    elif status == 'absent':
                        tile.config(bg='#999999', fg='white')
            
            if attempts:
                last_word = attempts[-1]['word']
                self.current_word_label.config(text=f"Current Word: {last_word.upper()}")
        
        vocab = state.get('vocabulary_size', 0)
        self.vocab_display_label.config(text=f"{vocab:,}")
    
    def update_statistics(self, state):
        """Update statistics"""
        stats = state['statistics']
        
        self.stat_widgets['total'].config(text=str(stats['total_games']))
        self.stat_widgets['wins'].config(text=str(stats['games_won']))
        self.stat_widgets['losses'].config(text=str(stats['games_lost']))
        
        rate = (stats['games_won'] / stats['total_games'] * 100) if stats['total_games'] > 0 else 0
        self.stat_widgets['rate'].config(text=f"{rate:.1f}%")
        
        self.stat_widgets['vocab'].config(text=str(state['vocabulary_size']))
        
        avg = (stats['total_attempts'] / stats['games_won']) if stats['games_won'] > 0 else 0
        self.stat_widgets['avg'].config(text=f"{avg:.2f}")
        
        # Update recent games
        curve = stats.get('learning_curve', [])
        if curve:
            self.recent_games_text.delete('1.0', 'end')
            self.recent_games_text.insert('1.0', "GAME  |  VOCAB  |  RESULT\n")
            self.recent_games_text.insert('end', "-" * 40 + "\n")
            
            for point in curve[-20:]:
                game = point['game']
                vocab = point['vocabulary']
                result = "WON " if point['won'] else "LOST"
                self.recent_games_text.insert('end', f"#{game:3d}  |  {vocab:5d}  |  {result}\n")
    
    def update_graphs(self, state):
        """Update graphs"""
        stats = state['statistics']
        curve = stats.get('learning_curve', [])
        
        if not curve or len(curve) < 2:
            return
        
        # Vocabulary growth
        games = [p['game'] for p in curve]
        vocab = [p['vocabulary'] for p in curve]
        
        self.ax1.clear()
        self.ax1.plot(games, vocab, color=self.colors['primary'], linewidth=2.5)
        self.ax1.set_xlabel('Games Played', fontsize=10)
        self.ax1.set_ylabel('Words Learned', fontsize=10)
        self.ax1.grid(True, alpha=0.3)
        self.ax1.set_facecolor('#FAFAFA')
        self.fig1.tight_layout()
        self.canvas1.draw()
        
        # Win rate
        if len(curve) > 5:
            window = min(10, len(curve))
            wins = [1 if p['won'] else 0 for p in curve]
            rolling = []
            for i in range(len(wins)):
                start = max(0, i - window + 1)
                rolling.append(sum(wins[start:i+1]) / (i - start + 1) * 100)
            
            self.ax2.clear()
            self.ax2.plot(games, rolling, color=self.colors['success'], linewidth=2.5)
            self.ax2.set_xlabel('Games Played', fontsize=10)
            self.ax2.set_ylabel('Win Rate (%)', fontsize=10)
            self.ax2.set_ylim(0, 100)
            self.ax2.grid(True, alpha=0.3)
            self.ax2.set_facecolor('#FAFAFA')
            self.fig2.tight_layout()
            self.canvas2.draw()
    
    def update_empty_graphs(self):
        """Show empty graph placeholders"""
        self.ax1.text(0.5, 0.5, 'Play games to see\nvocabulary growth', 
                     ha='center', va='center', transform=self.ax1.transAxes, fontsize=12)
        self.ax1.set_facecolor('#FAFAFA')
        self.canvas1.draw()
        
        self.ax2.text(0.5, 0.5, 'Play games to see\nwin rate progression', 
                     ha='center', va='center', transform=self.ax2.transAxes, fontsize=12)
        self.ax2.set_facecolor('#FAFAFA')
        self.canvas2.draw()
    
    def update_vocabulary(self, state):
        """Update vocabulary display"""
        vocab = state.get('vocabulary_size', 0)
        self.words_count_label.config(text=f"{vocab:,} words learned")
        
        words = state.get('learned_words', [])
        if words:
            self.words_text.delete('1.0', 'end')
            sorted_words = sorted(words)
            
            # Display in columns
            words_per_line = 8
            for i in range(0, len(sorted_words), words_per_line):
                line_words = sorted_words[i:i+words_per_line]
                self.words_text.insert('end', '  '.join(line_words) + '\n')
    
    def filter_words(self):
        """Filter vocabulary by search term"""
        if not self.bot:
            return
        
        search_term = self.word_search.get().lower()
        state = self.bot.get_current_state()
        all_words = state.get('learned_words', [])
        
        if search_term:
            filtered = [w for w in all_words if search_term in w.lower()]
        else:
            filtered = all_words
        
        self.words_text.delete('1.0', 'end')
        sorted_words = sorted(filtered)
        
        words_per_line = 8
        for i in range(0, len(sorted_words), words_per_line):
            line_words = sorted_words[i:i+words_per_line]
            self.words_text.insert('end', '  '.join(line_words) + '\n')
    
    def log(self, message, tag='info'):
        """Add to log"""
        timestamp = time.strftime("%H:%M:%S")
        self.log_text.insert('end', f"[{timestamp}] {message}\n", tag)
        self.log_text.see('end')
    
    def start_bot(self):
        """Start bot"""
        if self.is_learning:
            return
        
        self.log("Starting bot...", 'info')
        self.bot = WordleBot()
        
        def start_thread():
            if self.bot.start():
                self.is_learning = True
                self.start_btn.config(state='disabled')
                self.stop_btn.config(state='normal')
                self.status_dot.delete('all')
                self.status_dot.create_oval(2, 2, 18, 18, fill=self.colors['success'])
                self.status_label.config(text="Online")
                self.log("Bot started! Browser opened successfully.", 'success')
            else:
                self.log("Failed to start bot", 'error')
                messagebox.showerror("Error", "Could not start browser.\n\nMake sure Firefox, Edge, or Chrome is installed.")
        
        threading.Thread(target=start_thread, daemon=True).start()
    
    def stop_bot(self):
        """Stop bot"""
        if self.bot:
            self.log("Stopping bot...", 'warning')
            self.bot.stop()
            self.is_learning = False
            self.start_btn.config(state='normal')
            self.stop_btn.config(state='disabled')
            self.status_dot.delete('all')
            self.status_dot.create_oval(2, 2, 18, 18, fill=self.colors['error'])
            self.status_label.config(text="Offline")
            self.log("Bot stopped", 'info')
    
    def play_games(self, count):
        """Play games"""
        if not self.is_learning:
            messagebox.showwarning("Warning", "Please start the bot first!")
            return
        
        self.log(f"Starting session: {count} games", 'info')
        
        def play_thread():
            try:
                self.bot.play_multiple_games(count)
                self.log(f"Session complete! Played {count} games.", 'success')
            except Exception as e:
                self.log(f"Error during gameplay: {e}", 'error')
        
        threading.Thread(target=play_thread, daemon=True).start()
    
    def on_closing(self):
        """Handle close"""
        if self.is_learning:
            if messagebox.askokcancel("Quit", "Bot is running. Stop and quit?"):
                if self.bot:
                    self.bot.stop()
                self.root.destroy()
        else:
            self.root.destroy()
    
    def run(self):
        """Run app"""
        self.root.mainloop()


# Alias
MainWindow = MaterialUI
