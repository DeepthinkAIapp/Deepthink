import random
import time
import logging
import requests
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class ProxyStats:
    """Statistics for a proxy."""
    success_count: int = 0
    failure_count: int = 0
    total_response_time: float = 0.0
    last_used: Optional[datetime] = None
    last_success: Optional[datetime] = None
    consecutive_failures: int = 0
    is_active: bool = True

class ProxyManager:
    """Enhanced proxy manager with quality checks and rotation strategy."""
    
    def __init__(self, proxy_list: Optional[List[str]] = None):
        self.proxies: Dict[str, ProxyStats] = {}
        self.current_proxy: Optional[str] = None
        self.last_rotation: Optional[datetime] = None
        self.min_rotation_interval = timedelta(minutes=5)
        self.max_consecutive_failures = 3
        self.quality_threshold = 0.7  # Minimum success rate
        
        # Initialize with provided proxies or fetch from service
        if proxy_list:
            self._add_proxies(proxy_list)
        else:
            self._fetch_proxies()
    
    def _add_proxies(self, proxy_list: List[str]):
        """Add proxies to the manager."""
        for proxy in proxy_list:
            if proxy not in self.proxies:
                self.proxies[proxy] = ProxyStats()
    
    def _fetch_proxies(self):
        """Fetch proxies from a proxy service."""
        try:
            # Example: Fetch from a proxy service
            # Replace with your preferred proxy service
            response = requests.get('https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all')
            if response.status_code == 200:
                proxy_list = response.text.strip().split('\n')
                self._add_proxies(proxy_list)
        except Exception as e:
            logger.error(f"Error fetching proxies: {str(e)}")
    
    def _check_proxy_quality(self, proxy: str) -> bool:
        """Check if a proxy meets quality standards."""
        stats = self.proxies[proxy]
        total_requests = stats.success_count + stats.failure_count
        
        if total_requests == 0:
            return True  # New proxy, give it a chance
        
        success_rate = stats.success_count / total_requests
        return success_rate >= self.quality_threshold
    
    def _get_best_proxy(self) -> Optional[str]:
        """Get the best available proxy based on performance metrics."""
        active_proxies = [
            proxy for proxy, stats in self.proxies.items()
            if stats.is_active and self._check_proxy_quality(proxy)
        ]
        
        if not active_proxies:
            return None
        
        # Sort by success rate and response time
        def proxy_score(proxy: str) -> Tuple[float, float]:
            stats = self.proxies[proxy]
            total_requests = stats.success_count + stats.failure_count
            if total_requests == 0:
                return (1.0, 0.0)  # New proxy gets highest score
            success_rate = stats.success_count / total_requests
            avg_response_time = stats.total_response_time / total_requests
            return (success_rate, -avg_response_time)  # Negative for ascending sort
        
        return sorted(active_proxies, key=proxy_score, reverse=True)[0]
    
    def rotate_proxy(self):
        """Rotate to a new proxy based on performance metrics."""
        current_time = datetime.now()
        
        # Check if we need to rotate
        if (self.last_rotation and 
            current_time - self.last_rotation < self.min_rotation_interval):
            return
        
        new_proxy = self._get_best_proxy()
        if new_proxy and new_proxy != self.current_proxy:
            self.current_proxy = new_proxy
            self.last_rotation = current_time
            logger.info(f"Rotated to new proxy: {new_proxy}")
    
    def update_proxy_stats(self, success: bool, response_time: float):
        """Update statistics for the current proxy."""
        if not self.current_proxy:
            return
        
        stats = self.proxies[self.current_proxy]
        stats.last_used = datetime.now()
        
        if success:
            stats.success_count += 1
            stats.last_success = datetime.now()
            stats.consecutive_failures = 0
        else:
            stats.failure_count += 1
            stats.consecutive_failures += 1
            
            # Deactivate proxy if too many consecutive failures
            if stats.consecutive_failures >= self.max_consecutive_failures:
                stats.is_active = False
                logger.warning(f"Deactivated proxy {self.current_proxy} due to consecutive failures")
        
        stats.total_response_time += response_time
    
    def get_selenium_options(self) -> Dict[str, str]:
        """Get proxy options for Selenium."""
        options = {
            'proxy': self.current_proxy,
            'user_agent': self._get_random_user_agent()
        }
        return options
    
    def _get_random_user_agent(self) -> str:
        """Get a random user agent."""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"
        ]
        return random.choice(user_agents)
    
    def get_proxy_stats(self) -> Dict[str, Dict]:
        """Get statistics for all proxies."""
        return {
            proxy: {
                'success_rate': stats.success_count / (stats.success_count + stats.failure_count) if (stats.success_count + stats.failure_count) > 0 else 0,
                'total_requests': stats.success_count + stats.failure_count,
                'avg_response_time': stats.total_response_time / (stats.success_count + stats.failure_count) if (stats.success_count + stats.failure_count) > 0 else 0,
                'is_active': stats.is_active,
                'consecutive_failures': stats.consecutive_failures
            }
            for proxy, stats in self.proxies.items()
        } 