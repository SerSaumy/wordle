"""Statistics and graphs panel"""

import tkinter as tk
from tkinter import ttk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure


class StatsPanel(ttk.Frame):
    def __init__(self, parent, color_scheme):
        super().__init__(parent)
        self.colors = color_scheme
        self.create_widgets()
    
    def create_widgets(self):
        """Create statistics display and graphs"""
        # Header
        header = tk.Label(
            self,
            text="PERFORMANCE METRICS",
            font=('Segoe UI', 11, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['accent']
        )
        header.pack(pady=(0, 15))
        
        # Stats cards
        stats_container = tk.Frame(self, bg=self.colors['bg_light'])
        stats_container.pack(fill='x', padx=5, pady=5)
        
        self.stats_labels = {}
        stats_info = [
            ('total_games', 'Total Games', '0'),
            ('games_won', 'Games Won', '0'),
            ('win_rate', 'Win Rate', '0%'),
            ('vocabulary', 'Vocabulary', '0'),
            ('avg_attempts', 'Avg Attempts', '0.0')
        ]
        
        for i, (key, label, default) in enumerate(stats_info):
            card = self._create_stat_card(stats_container, label, default)
            self.stats_labels[key] = card
            card['frame'].pack(fill='x', pady=4)
        
        # Divider
        tk.Frame(self, bg=self.colors['text_dim'], height=1).pack(fill='x', pady=15)
        
        # Graphs
        graphs_label = tk.Label(
            self,
            text="LEARNING ANALYTICS",
            font=('Segoe UI', 9, 'bold'),
            bg=self.colors['bg_light'],
            fg=self.colors['text_dim']
        )
        graphs_label.pack(anchor='w', padx=5, pady=(0, 10))
        
        # Notebook for graphs
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill='both', expand=True, padx=5, pady=5)
        
        # Configure matplotlib style
        plt.style.use('dark_background')
        
        # Learning curve graph
        self.fig1 = Figure(figsize=(5, 3), dpi=80, facecolor=self.colors['bg_dark'])
        self.ax1 = self.fig1.add_subplot(111)
        self.canvas1 = FigureCanvasTkAgg(self.fig1, self.notebook)
        self.notebook.add(self.canvas1.get_tk_widget(), text="Learning Curve")
        
        # Win rate graph
        self.fig2 = Figure(figsize=(5, 3), dpi=80, facecolor=self.colors['bg_dark'])
        self.ax2 = self.fig2.add_subplot(111)
        self.canvas2 = FigureCanvasTkAgg(self.fig2, self.notebook)
        self.notebook.add(self.canvas2.get_tk_widget(), text="Win Rate")
        
        # Initialize empty graphs
        self._init_empty_graphs()
    
    def _create_stat_card(self, parent, label, value):
        """Create a stat card"""
        frame = tk.Frame(parent, bg=self.colors['bg_dark'], relief='flat', borderwidth=0)
        frame.pack_propagate(False)
        
        content = tk.Frame(frame, bg=self.colors['bg_dark'])
        content.pack(fill='both', expand=True, padx=12, pady=8)
        
        label_widget = tk.Label(
            content,
            text=label,
            font=('Segoe UI', 8),
            bg=self.colors['bg_dark'],
            fg=self.colors['text_dim'],
            anchor='w'
        )
        label_widget.pack(fill='x')
        
        value_widget = tk.Label(
            content,
            text=value,
            font=('Segoe UI', 14, 'bold'),
            bg=self.colors['bg_dark'],
            fg=self.colors['accent_light'],
            anchor='w'
        )
        value_widget.pack(fill='x')
        
        return {'frame': frame, 'label': label_widget, 'value': value_widget}
    
    def _init_empty_graphs(self):
        """Initialize empty graphs"""
        # Learning curve
        self.ax1.text(0.5, 0.5, 'Play games to see\nlearning curve', 
                     ha='center', va='center', transform=self.ax1.transAxes,
                     color='#666', fontsize=10)
        self.ax1.set_facecolor(self.colors['bg_dark'])
        self.canvas1.draw()
        
        # Win rate
        self.ax2.text(0.5, 0.5, 'Play games to see\nwin rate progression', 
                     ha='center', va='center', transform=self.ax2.transAxes,
                     color='#666', fontsize=10)
        self.ax2.set_facecolor(self.colors['bg_dark'])
        self.canvas2.draw()
    
    def update_stats(self, bot_state):
        """Update statistics display"""
        stats = bot_state['statistics']
        
        # Update stat cards
        self.stats_labels['total_games']['value'].config(text=str(stats['total_games']))
        self.stats_labels['games_won']['value'].config(text=str(stats['games_won']))
        
        win_rate = (stats['games_won'] / stats['total_games'] * 100) if stats['total_games'] > 0 else 0
        self.stats_labels['win_rate']['value'].config(text=f"{win_rate:.1f}%")
        
        self.stats_labels['vocabulary']['value'].config(text=f"{bot_state['vocabulary_size']:,}")
        
        avg_attempts = (stats['total_attempts'] / stats['games_won']) if stats['games_won'] > 0 else 0
        self.stats_labels['avg_attempts']['value'].config(text=f"{avg_attempts:.2f}")
        
        # Update graphs
        self.update_graphs(stats)
    
    def update_graphs(self, stats):
        """Update all graphs"""
        learning_curve = stats.get('learning_curve', [])
        
        if not learning_curve or len(learning_curve) < 2:
            return
        
        # Learning curve
        games = [point['game'] for point in learning_curve]
        vocab = [point['vocabulary'] for point in learning_curve]
        
        self.ax1.clear()
        self.ax1.plot(games, vocab, color='#00adb5', linewidth=2.5)
        self.ax1.set_xlabel('Games Played', color='#aaa', fontsize=9)
        self.ax1.set_ylabel('Words Learned', color='#aaa', fontsize=9)
        self.ax1.set_title('Vocabulary Growth', color='#00d4d4', fontsize=10, pad=10)
        self.ax1.grid(True, alpha=0.15, color='#555')
        self.ax1.set_facecolor(self.colors['bg_dark'])
        self.ax1.tick_params(colors='#777', labelsize=8)
        self.fig1.tight_layout()
        self.canvas1.draw()
        
        # Win rate over time (rolling average)
        if len(learning_curve) > 5:
            window = min(10, len(learning_curve))
            wins = [1 if point['won'] else 0 for point in learning_curve]
            rolling_win_rate = []
            for i in range(len(wins)):
                start = max(0, i - window + 1)
                rolling_win_rate.append(sum(wins[start:i+1]) / (i - start + 1) * 100)
            
            self.ax2.clear()
            self.ax2.plot(games, rolling_win_rate, color='#00ff88', linewidth=2.5)
            self.ax2.set_xlabel('Games Played', color='#aaa', fontsize=9)
            self.ax2.set_ylabel('Win Rate (%)', color='#aaa', fontsize=9)
            self.ax2.set_title(f'Win Rate Progression (window={window})', color='#00d4d4', fontsize=10, pad=10)
            self.ax2.grid(True, alpha=0.15, color='#555')
            self.ax2.set_ylim(0, 100)
            self.ax2.set_facecolor(self.colors['bg_dark'])
            self.ax2.tick_params(colors='#777', labelsize=8)
            self.fig2.tight_layout()
            self.canvas2.draw()
