#!/usr/bin/env python3
"""Wordle Self-Learning Bot - Main Entry"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gui.main_window import MaterialUI
from utils.logger import logger


def main():
    try:
        logger.info("="*70)
        logger.info("[BOT] WORDLE SELF-LEARNING BOT")
        logger.info("="*70)
        
        app = MaterialUI()
        app.run()
        
    except KeyboardInterrupt:
        logger.info("\n[EXIT] Application stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"[FATAL] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
