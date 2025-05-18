import time
import random
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import os
from collections import deque
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """Class to store performance metrics for each search engine."""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    consecutive_failures: int = 0
    total_backoff_time: float = 0.0

class RateLimiter:
    """Rate limiter with exponential backoff."""
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.retry_counts: Dict[str, int] = {}
        self.last_request_time: Dict[str, float] = {}
        self.min_delay = 1.0  # Minimum delay between requests
        self.max_delay = 60.0  # Maximum delay between requests

    def wait(self, key: str) -> None:
        """Wait with exponential backoff."""
        current_time = time.time()
        if key in self.last_request_time:
            elapsed = current_time - self.last_request_time[key]
            if elapsed < self.min_delay:
                time.sleep(self.min_delay - elapsed)
        
        self.last_request_time[key] = time.time()

    def get_backoff_time(self, key: str) -> float:
        """Calculate backoff time with exponential increase."""
        retry_count = self.retry_counts.get(key, 0)
        backoff_time = min(
            self.max_delay,
            self.base_delay * (2 ** retry_count) + random.uniform(0, 1)
        )
        self.retry_counts[key] = retry_count + 1
        return backoff_time

class FingerprintRandomizer:
    """Enhanced browser fingerprint randomization."""
    def __init__(self):
        self.user_agents = [
            # Windows Chrome
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            # Windows Edge
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/119.0.0.0 Safari/537.36",
            # Windows Firefox
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0",
            # macOS Safari
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
        ]
        
        self.screen_resolutions = [
            (1920, 1080),  # Full HD
            (1366, 768),   # HD
            (1440, 900),   # WXGA+
            (1536, 864),   # HD+
            (2560, 1440),  # QHD
            (3840, 2160)   # 4K
        ]
        
        self.color_depths = [24, 32]
        self.platforms = ["Win32", "MacIntel", "Linux x86_64"]
        self.languages = ["en-US", "en-GB", "en-CA", "en-AU", "en-NZ"]
        self.timezones = list(range(-12, 13))  # -12 to +12
        
        # WebGL vendors and renderers
        self.webgl_vendors = [
            "Google Inc. (NVIDIA)",
            "Google Inc. (Intel)",
            "Google Inc. (AMD)",
            "Intel Inc.",
            "NVIDIA Corporation",
            "AMD"
        ]
        
        self.webgl_renderers = [
            "ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0)",
            "ANGLE (AMD, AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0)"
        ]
        
        # Additional browser features
        self.browser_features = {
            "webgl": True,
            "canvas": True,
            "webRTC": True,
            "audio": True,
            "video": True,
            "pdf": True,
            "flash": False,
            "java": False
        }

    def get_random_fingerprint(self) -> Dict[str, Any]:
        """Generate a sophisticated random browser fingerprint."""
        user_agent = random.choice(self.user_agents)
        
        # Extract browser and version from user agent
        browser_info = self._parse_user_agent(user_agent)
        
        return {
            "userAgent": user_agent,
            "screenResolution": random.choice(self.screen_resolutions),
            "colorDepth": random.choice(self.color_depths),
            "platform": random.choice(self.platforms),
            "timezone": random.choice(self.timezones),
            "language": random.choice(self.languages),
            "webglVendor": random.choice(self.webgl_vendors),
            "webglRenderer": random.choice(self.webgl_renderers),
            "browser": browser_info["browser"],
            "browserVersion": browser_info["version"],
            "os": browser_info["os"],
            "osVersion": browser_info["os_version"],
            "features": self.browser_features,
            "plugins": self._get_random_plugins(browser_info["browser"]),
            "fonts": self._get_random_fonts(),
            "hardwareConcurrency": random.choice([2, 4, 6, 8, 12, 16]),
            "deviceMemory": random.choice([4, 8, 16, 32]),
            "touchSupport": random.choice([True, False])
        }
    
    def _parse_user_agent(self, user_agent: str) -> Dict[str, str]:
        """Parse user agent string to extract browser and OS information."""
        browser = "Chrome"
        version = "120.0.0.0"
        os = "Windows"
        os_version = "10"
        
        if "Firefox" in user_agent:
            browser = "Firefox"
            version = user_agent.split("Firefox/")[1].split()[0]
        elif "Edge" in user_agent:
            browser = "Edge"
            version = user_agent.split("Edge/")[1].split()[0]
        elif "Safari" in user_agent and "Chrome" not in user_agent:
            browser = "Safari"
            version = user_agent.split("Version/")[1].split()[0]
        
        if "Macintosh" in user_agent:
            os = "MacOS"
            os_version = "10.15"
        elif "Linux" in user_agent:
            os = "Linux"
            os_version = "x86_64"
        
        return {
            "browser": browser,
            "version": version,
            "os": os,
            "os_version": os_version
        }
    
    def _get_random_plugins(self, browser: str) -> List[str]:
        """Get random browser plugins based on browser type."""
        common_plugins = [
            "PDF Viewer",
            "Chrome PDF Viewer",
            "Chromium PDF Viewer",
            "Microsoft Edge PDF Viewer",
            "WebKit built-in PDF"
        ]
        
        browser_specific = {
            "Chrome": [
                "Chrome PDF Plugin",
                "Chrome PDF Viewer",
                "Native Client"
            ],
            "Firefox": [
                "PDF Viewer",
                "OpenH264 Video Codec",
                "WebGL"
            ],
            "Edge": [
                "Microsoft Edge PDF Plugin",
                "Microsoft Edge PDF Viewer",
                "Native Client"
            ],
            "Safari": [
                "WebKit built-in PDF",
                "QuickTime Plug-in",
                "WebGL"
            ]
        }
        
        plugins = common_plugins + browser_specific.get(browser, [])
        return random.sample(plugins, k=random.randint(3, len(plugins)))
    
    def _get_random_fonts(self) -> List[str]:
        """Get random system fonts."""
        common_fonts = [
            "Arial",
            "Helvetica",
            "Times New Roman",
            "Times",
            "Courier New",
            "Courier",
            "Verdana",
            "Georgia",
            "Palatino",
            "Garamond",
            "Bookman",
            "Comic Sans MS",
            "Trebuchet MS",
            "Arial Black",
            "Impact"
        ]
        
        return random.sample(common_fonts, k=random.randint(8, len(common_fonts)))

class ResultValidator:
    """Validate and sanity check search results."""
    def __init__(self):
        self.historical_data: Dict[str, List[int]] = {}
        self.anomaly_threshold = 0.5  # 50% deviation threshold

    def validate_result(self, domain: str, engine: str, result: int) -> bool:
        """Validate a search result against historical data and sanity checks."""
        if result < 0:
            logger.warning(f"Invalid negative result for {domain} on {engine}")
            return False

        if result > 1000000000:  # Unrealistic number of backlinks
            logger.warning(f"Unrealistically high result for {domain} on {engine}")
            return False

        # Check against historical data
        if domain in self.historical_data:
            avg = sum(self.historical_data[domain]) / len(self.historical_data[domain])
            if abs(result - avg) / avg > self.anomaly_threshold:
                logger.warning(f"Anomalous result detected for {domain} on {engine}")
                return False

        return True

    def update_historical_data(self, domain: str, result: int):
        """Update historical data with new result."""
        if domain not in self.historical_data:
            self.historical_data[domain] = []
        self.historical_data[domain].append(result)
        # Keep only last 10 results
        if len(self.historical_data[domain]) > 10:
            self.historical_data[domain].pop(0)

class PerformanceMonitor:
    """Monitor and alert on performance metrics."""
    def __init__(self):
        self.metrics: Dict[str, PerformanceMetrics] = {}
        self.alert_thresholds = {
            "failure_rate": 0.3,  # 30% failure rate
            "response_time": 10.0,  # 10 seconds
            "consecutive_failures": 3
        }

    def update_metrics(self, engine: str, success: bool, response_time: float):
        """Update performance metrics for a search engine."""
        if engine not in self.metrics:
            self.metrics[engine] = PerformanceMetrics()

        metrics = self.metrics[engine]
        metrics.total_requests += 1
        if success:
            metrics.successful_requests += 1
            metrics.consecutive_failures = 0
            metrics.last_success = datetime.now()
        else:
            metrics.failed_requests += 1
            metrics.consecutive_failures += 1
            metrics.last_failure = datetime.now()

        # Update average response time
        metrics.average_response_time = (
            (metrics.average_response_time * (metrics.total_requests - 1) + response_time)
            / metrics.total_requests
        )

        self._check_alerts(engine, metrics)

    def _check_alerts(self, engine: str, metrics: PerformanceMetrics):
        """Check for performance anomalies and generate alerts."""
        failure_rate = metrics.failed_requests / metrics.total_requests if metrics.total_requests > 0 else 0

        if failure_rate > self.alert_thresholds["failure_rate"]:
            logger.warning(f"High failure rate for {engine}: {failure_rate:.2%}")

        if metrics.average_response_time > self.alert_thresholds["response_time"]:
            logger.warning(f"Slow response time for {engine}: {metrics.average_response_time:.2f}s")

        if metrics.consecutive_failures >= self.alert_thresholds["consecutive_failures"]:
            logger.warning(f"Multiple consecutive failures for {engine}: {metrics.consecutive_failures}")

    def get_metrics_summary(self) -> Dict[str, Dict[str, Any]]:
        """Get summary of performance metrics."""
        return {
            engine: {
                "success_rate": metrics.successful_requests / metrics.total_requests if metrics.total_requests > 0 else 0,
                "average_response_time": metrics.average_response_time,
                "total_requests": metrics.total_requests,
                "consecutive_failures": metrics.consecutive_failures
            }
            for engine, metrics in self.metrics.items()
        } 