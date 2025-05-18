import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def find_submission_forms(directory_url, max_pages=5):
    """
    Scrape forms from a directory, following pagination up to max_pages.
    Returns a list of dicts: {action, method, fields}
    """
    forms_found = []
    url = directory_url
    pages_scraped = 0

    while url and pages_scraped < max_pages:
        print(f"Scraping: {url}")
        resp = requests.get(url)
        soup = BeautifulSoup(resp.text, 'html.parser')

        # Extract forms and their fields
        for form in soup.find_all('form'):
            action = form.get('action')
            method = form.get('method', 'get').lower()
            fields = {}
            for input_tag in form.find_all('input'):
                name = input_tag.get('name')
                if name:
                    fields[name] = input_tag.get('value', '')
            for textarea in form.find_all('textarea'):
                name = textarea.get('name')
                if name:
                    fields[name] = textarea.text
            for select in form.find_all('select'):
                name = select.get('name')
                if name:
                    # Get first option as default
                    option = select.find('option')
                    fields[name] = option.get('value', '') if option else ''
            forms_found.append({
                'action': urljoin(url, action) if action else url,
                'method': method,
                'fields': fields
            })

        # Find pagination link (look for rel="next" or text like "Next")
        next_link = soup.find('a', rel='next')
        if not next_link:
            next_link = soup.find('a', string=lambda t: t and 'next' in t.lower())
        url = urljoin(url, next_link['href']) if next_link and next_link.get('href') else None
        pages_scraped += 1

    # Filter only submission forms
    submission_forms = [form for form in forms_found if is_submission_form(form['fields'])]
    return submission_forms

def is_submission_form(fields):
    submission_keywords = ['url', 'website', 'title', 'description', 'email']
    return any(keyword in field.lower() for field in fields for keyword in submission_keywords) 