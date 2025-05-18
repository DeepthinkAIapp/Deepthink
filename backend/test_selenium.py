from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.service import Service
from webdriver_manager.microsoft import EdgeChromiumDriverManager
import logging
import traceback
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG for more detailed logs
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Log to stdout for immediate feedback
    ]
)
logger = logging.getLogger('SeleniumTest')

def test_google_search():
    driver = None
    try:
        logger.info("Setting up Edge options...")
        options = webdriver.EdgeOptions()
        options.add_argument('--headless')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        # Log all options for debugging
        logger.debug(f"Edge options: {options.arguments}")
        
        logger.info("Installing Edge WebDriver...")
        driver_path = EdgeChromiumDriverManager().install()
        logger.info(f"Edge WebDriver installed at: {driver_path}")
        
        service = Service(driver_path)
        logger.info("Creating Edge WebDriver service...")
        
        logger.info("Starting Edge WebDriver...")
        driver = webdriver.Edge(service=service, options=options)
        logger.info("Edge WebDriver started successfully")
        
        url = "https://www.google.com/search?q=site:microsoft.com"
        logger.info(f"Making request to: {url}")
        driver.get(url)
        logger.info("Page loaded successfully")
        
        # Log current URL to check for redirects
        logger.info(f"Current URL: {driver.current_url}")
        
        # Wait for stats element
        logger.info("Waiting for results stats element...")
        stats_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "result-stats"))
        )
        logger.info("Results stats element found")
        
        stats_text = stats_element.text
        logger.info(f"Results stats text: {stats_text}")
        
        # Get page source for debugging
        page_source = driver.page_source
        logger.debug(f"Page source preview: {page_source[:1000]}")
        
    except Exception as e:
        logger.error(f"Error during test: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        if driver:
            try:
                logger.debug(f"Current URL at error: {driver.current_url}")
                logger.debug(f"Page source at error: {driver.page_source[:1000]}")
            except:
                pass
    finally:
        if driver:
            try:
                driver.quit()
                logger.info("WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {str(e)}")

if __name__ == "__main__":
    test_google_search() 