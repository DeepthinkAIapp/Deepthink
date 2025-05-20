import undetected_chromedriver as uc
from fastapi import APIRouter, Request
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import re
from bs4 import BeautifulSoup
from pydantic import BaseModel

router = APIRouter()

class AuthorityCheckerRequest(BaseModel):
    domain: str

def parse_number(text):
    # Converts 2.6B, 3.0M, etc. to integer
    text = text.replace(",", "").strip()
    match = re.match(r"([\d.]+)([KMB]?)", text, re.I)
    if not match:
        return text
    num, suffix = match.groups()
    num = float(num)
    if suffix.upper() == 'B':
        num *= 1_000_000_000
    elif suffix.upper() == 'M':
        num *= 1_000_000
    elif suffix.upper() == 'K':
        num *= 1_000
    return int(num)

@router.post("/api/authority-checker")
async def authority_checker(request: AuthorityCheckerRequest):
    domain = request.domain
    if not domain:
        return {"error": "No domain provided"}

    # Use undetected-chromedriver
    options = uc.ChromeOptions()
    # options.add_argument("--headless=new")  # Try headless if you want, but non-headless is more likely to work
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    driver = uc.Chrome(options=options)

    try:
        driver.get("https://ahrefs.com/backlink-checker/")
        time.sleep(2)
        # Find the input, enter the domain, and submit
        input_box = driver.find_element(By.CSS_SELECTOR, "input[type='text']")
        input_box.clear()
        input_box.send_keys(domain)
        input_box.send_keys(Keys.RETURN)
        time.sleep(3)  # Wait at least 3 seconds before looking for the XPath

        # Wait up to 30 seconds for the title element to appear
        element0 = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, '/html/body/div[6]/div/div/div[1]/div[1]'))
        )
        html0 = element0.get_attribute('outerHTML')

        # Wait up to 30 seconds for the first element to appear
        element1 = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, '/html/body/div[6]/div/div/div[1]/div[2]/div[1]/div[2]/div/div[2]/div/div/div/span'))
        )
        html1 = element1.get_attribute('outerHTML')

        # Wait up to 30 seconds for the second element to appear
        element2 = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, '/html/body/div[6]/div/div/div[1]/div[2]/div[2]/div[1]/div/div[2]/div/div/div/span'))
        )
        html2 = element2.get_attribute('outerHTML')

        # Wait up to 30 seconds for the third element to appear
        element3 = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, '/html/body/div[6]/div/div/div[1]/div[2]/div[2]/div[2]/div/div[2]/div/div/div/span'))
        )
        html3 = element3.get_attribute('outerHTML')

        # Wait up to 30 seconds for the fourth element to appear
        element4 = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, '/html/body/div[6]/div/div/div[1]/div[3]'))
        )
        html4 = element4.get_attribute('outerHTML')

        html = f'{html0}<div style="display:flex;gap:2em">{html1}{html2}{html3}</div><div style="margin-top:2em">{html4}</div>'
    except Exception as e:
        html = f"<div>Element not found: {str(e)}</div>"
    finally:
        driver.quit()

    return {"domain": domain, "html": html} 