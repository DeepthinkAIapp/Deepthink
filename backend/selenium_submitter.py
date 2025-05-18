from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def submit_with_selenium(form_url, data):
    options = webdriver.ChromeOptions()
    # Remove headless for visible browser
    # options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    try:
        driver.get(form_url)
        for field, value in data.items():
            try:
                element = driver.find_element(By.NAME, field)
                element.clear()
                element.send_keys(value)
            except Exception:
                pass  # Field may not be present, skip
        print("\nPlease solve the CAPTCHA in the browser window, complete any remaining fields, and submit the form manually.")
        input("Press Enter here after you have submitted the form in the browser...")
        # Optionally, check for success message or URL change
        success = True  # Assume success if user confirms
        return success
    except Exception as e:
        print(f"Error submitting to {form_url} using Selenium: {e}")
        return False
    finally:
        driver.quit() 