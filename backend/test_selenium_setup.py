from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import sys
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger('SeleniumTest')

def get_chrome_driver_path():
    """Get the correct ChromeDriver executable path."""
    base_path = ChromeDriverManager().install()
    # The base path might point to THIRD_PARTY_NOTICES, so let's get the directory
    driver_dir = os.path.dirname(base_path)
    # Look for chromedriver.exe in the directory
    for file in os.listdir(driver_dir):
        if file.lower() == 'chromedriver.exe':
            return os.path.join(driver_dir, file)
    return base_path  # Return the original path if we can't find chromedriver.exe

def test_selenium_setup():
    logger.info("Starting Selenium test...")
    
    # Set up Chrome options
    options = Options()
    options.add_argument('--headless=new')  # Use new headless mode
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-gpu')  # Recommended for Windows
    options.add_experimental_option('excludeSwitches', ['enable-automation'])
    options.add_experimental_option('useAutomationExtension', False)
    
    try:
        logger.info("Initializing Chrome WebDriver...")
        driver_path = get_chrome_driver_path()
        logger.info(f"ChromeDriver path: {driver_path}")
        
        service = Service(driver_path)
        driver = webdriver.Chrome(service=service, options=options)
        
        logger.info("Opening test website...")
        driver.get("https://www.example.com")
        
        # Wait for and find the h1 element
        h1 = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        
        logger.info(f"Found page title: {h1.text}")
        logger.info("Test completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during test: {str(e)}")
        logger.error(f"Python version: {sys.version}")
        logger.error(f"Current working directory: {os.getcwd()}")
        if 'driver_path' in locals():
            logger.error(f"Driver exists at path: {os.path.exists(driver_path)}")
            if os.path.exists(driver_path):
                logger.error(f"Driver file size: {os.path.getsize(driver_path)} bytes")
                logger.error(f"Driver directory contents: {os.listdir(os.path.dirname(driver_path))}")
    finally:
        if 'driver' in locals():
            driver.quit()
            logger.info("WebDriver closed.")

if __name__ == "__main__":
    test_selenium_setup() 