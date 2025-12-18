"""Selenium controller with improved feedback detection"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from typing import List, Dict
from utils.config import WORDLE_URL, HEADLESS, IMPLICIT_WAIT, PAGE_LOAD_TIMEOUT
from utils.logger import logger


class SeleniumController:
    def __init__(self):
        self.driver = None
        self.browser_type = None
        self.last_entered_word = ""
    
    def start_browser(self):
        """Start browser"""
        browsers = [
            ('Firefox', self._start_firefox),
            ('Edge', self._start_edge),
            ('Chrome', self._start_chrome),
        ]
        
        for name, start_func in browsers:
            try:
                logger.info(f"Trying {name}...")
                if start_func():
                    self.browser_type = name
                    logger.info(f"Started {name}!")
                    return True
            except Exception as e:
                logger.warning(f"{name} failed")
        
        return False
    
    def _start_firefox(self):
        from selenium.webdriver.firefox.options import Options
        options = Options()
        if HEADLESS:
            options.add_argument('--headless')
        try:
            from webdriver_manager.firefox import GeckoDriverManager
            from selenium.webdriver.firefox.service import Service
            self.driver = webdriver.Firefox(service=Service(GeckoDriverManager().install()), options=options)
        except:
            self.driver = webdriver.Firefox(options=options)
        self.driver.implicitly_wait(IMPLICIT_WAIT)
        return True
    
    def _start_edge(self):
        from selenium.webdriver.edge.options import Options
        options = Options()
        if HEADLESS:
            options.add_argument('--headless')
        try:
            from webdriver_manager.microsoft import EdgeChromiumDriverManager
            from selenium.webdriver.edge.service import Service
            self.driver = webdriver.Edge(service=Service(EdgeChromiumDriverManager().install()), options=options)
        except:
            self.driver = webdriver.Edge(options=options)
        self.driver.implicitly_wait(IMPLICIT_WAIT)
        return True
    
    def _start_chrome(self):
        from selenium.webdriver.chrome.options import Options
        options = Options()
        if HEADLESS:
            options.add_argument('--headless')
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            from selenium.webdriver.chrome.service import Service
            self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        except:
            self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(IMPLICIT_WAIT)
        return True
    
    def navigate_to_game(self):
        """Navigate to game"""
        try:
            logger.info(f"Loading {WORDLE_URL}...")
            self.driver.get(WORDLE_URL)
            time.sleep(4)
            
            # Close modals
            try:
                for _ in range(3):
                    buttons = self.driver.find_elements(By.CSS_SELECTOR, "button")
                    for btn in buttons:
                        try:
                            text = btn.text.lower()
                            if any(word in text for word in ['close', 'got it', 'ok', 'start', 'play']):
                                if btn.is_displayed():
                                    btn.click()
                                    time.sleep(1)
                                    break
                        except:
                            pass
                    time.sleep(0.5)
            except:
                pass
            
            logger.info("Game loaded!")
            return True
        except Exception as e:
            logger.error(f"Navigation failed: {e}")
            return False
    
    def enter_word(self, word: str) -> bool:
        """Enter word and check if accepted"""
        try:
            word = word.lower()
            self.last_entered_word = word
            
            # Get initial row count
            initial_rows = self._count_filled_rows()
            
            # Type word
            body = self.driver.find_element(By.TAG_NAME, 'body')
            body.click()
            time.sleep(0.3)
            
            for letter in word:
                body.send_keys(letter)
                time.sleep(0.12)
            
            time.sleep(0.3)
            
            # Press Enter
            body.send_keys(Keys.RETURN)
            
            # Wait and check if word was accepted
            time.sleep(2.5)
            
            # Check if row count increased (word was accepted)
            final_rows = self._count_filled_rows()
            
            if final_rows > initial_rows:
                logger.debug(f"✓ Word accepted: {word.upper()}")
                return True
            else:
                logger.debug(f"✗ Word rejected: {word.upper()}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to enter word: {e}")
            return False
    
    def _count_filled_rows(self) -> int:
        """Count how many rows have been filled"""
        try:
            # Look for filled rows
            rows = self.driver.find_elements(By.CSS_SELECTOR, ".game-row")
            filled = 0
            
            for row in rows:
                tiles = row.find_elements(By.CSS_SELECTOR, ".game-row-letter, [class*='tile']")
                if tiles and any(tile.text.strip() for tile in tiles):
                    filled += 1
            
            return filled
        except:
            return 0
    
    def get_feedback(self, attempt_number: int) -> List[Dict]:
        """Get feedback from tiles with better detection"""
        try:
            time.sleep(1.5)
            
            # Get all rows
            rows = self.driver.find_elements(By.CSS_SELECTOR, ".game-row, [class*='row']")
            
            if not rows or len(rows) < attempt_number:
                logger.warning(f"Could not find row {attempt_number}")
                return None
            
            # Get the specific row (0-indexed)
            row = rows[attempt_number - 1]
            
            # Get tiles from this row
            tiles = row.find_elements(By.CSS_SELECTOR, ".game-row-letter, [class*='tile'], [class*='letter']")
            
            if len(tiles) != 5:
                logger.warning(f"Expected 5 tiles, found {len(tiles)}")
                return None
            
            feedback = []
            for i, tile in enumerate(tiles):
                letter = tile.text.lower().strip() if tile.text else ''
                
                # Get all possible status indicators
                classes = tile.get_attribute('class') or ''
                data_state = tile.get_attribute('data-state') or ''
                aria_label = tile.get_attribute('aria-label') or ''
                style = tile.get_attribute('style') or ''
                
                # Combine all text for status detection
                all_text = f"{classes} {data_state} {aria_label} {style}".lower()
                
                # Detect status
                status = 'empty'
                if 'correct' in all_text or 'green' in all_text or 'rgb(106, 170, 100)' in all_text:
                    status = 'correct'
                elif 'present' in all_text or 'yellow' in all_text or 'elsewhere' in all_text or 'rgb(201, 180, 88)' in all_text:
                    status = 'present'
                elif 'absent' in all_text or 'gray' in all_text or 'grey' in all_text or 'rgb(120, 124, 126)' in all_text:
                    status = 'absent'
                
                feedback.append({
                    'letter': letter,
                    'status': status,
                    'position': i
                })
            
            # Log feedback
            visual = ''.join(['🟩' if f['status'] == 'correct' else '🟨' if f['status'] == 'present' else '⬜' for f in feedback])
            logger.debug(f"Feedback: {self.last_entered_word.upper()} {visual}")
            
            return feedback
            
        except Exception as e:
            logger.error(f"Failed to get feedback: {e}")
            return None
    
    def is_word_invalid(self) -> bool:
        """Check if word was rejected - now handled by enter_word"""
        return False
    
    def start_new_game(self):
        """Start new game"""
        try:
            # Look for new game button
            buttons = self.driver.find_elements(By.CSS_SELECTOR, "button")
            for btn in buttons:
                try:
                    text = btn.text.lower()
                    if any(word in text for word in ['new', 'again', 'play']):
                        if btn.is_displayed():
                            btn.click()
                            time.sleep(2)
                            logger.info("New game started")
                            return True
                except:
                    pass
            
            # Fallback: refresh
            logger.info("Refreshing for new game...")
            self.driver.refresh()
            time.sleep(4)
            return True
            
        except Exception as e:
            logger.error(f"Failed to start new game: {e}")
            return False
    
    def close_browser(self):
        """Close browser"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Browser closed")
            except:
                pass
