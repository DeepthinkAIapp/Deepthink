from fp.fp import FreeProxy
from typing import Optional, List
import logging
import requests
from fake_useragent import UserAgent
import random
import time
from cachetools import TTLCache
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger('ProxyManager')

class ProxyManager:
    def __init__(self):
        self.proxy_cache = TTLCache(maxsize=100, ttl=3600)  # Cache proxies for 1 hour
        self.user_agent = UserAgent()
        self.current_proxy = None
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def get_working_proxy(self) -> Optional[str]:
        """Get a working proxy with retry logic."""
        try:
            # First check cache
            working_proxies = [p for p in self.proxy_cache.values() if self._test_proxy(p)]
            if working_proxies:
                return random.choice(working_proxies)
            
            # Get new proxy
            proxy = FreeProxy(
                rand=True,
                timeout=5,
                anonym=True,
                country_id=['US', 'CA', 'GB', 'DE', 'FR']  # Use reliable countries
            ).get()
            
            if self._test_proxy(proxy):
                self.proxy_cache[proxy] = proxy
                return proxy
                
        except Exception as e:
            logger.warning(f"Error getting proxy: {str(e)}")
            return None
            
    def _test_proxy(self, proxy: str) -> bool:
        """Test if a proxy is working."""
        try:
            headers = {'User-Agent': self.user_agent.random}
            proxies = {
                'http': f'http://{proxy}',
                'https': f'http://{proxy}'
            }
            
            # Test with a reliable site
            response = requests.get(
                'https://www.example.com',
                proxies=proxies,
                headers=headers,
                timeout=5
            )
            return response.status_code == 200
            
        except Exception:
            return False
            
    def get_selenium_options(self, proxy: Optional[str] = None) -> dict:
        """Get Selenium options with proxy and user agent."""
        if not proxy:
            proxy = self.get_working_proxy()
            
        options = {
            'proxy': proxy,
            'user_agent': self.user_agent.random
        }
        return options
        
    def rotate_proxy(self) -> Optional[str]:
        """Rotate to a new working proxy."""
        new_proxy = self.get_working_proxy()
        if new_proxy:
            self.current_proxy = new_proxy
        return self.current_proxy 