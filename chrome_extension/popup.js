document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            const url = new URL(tab.url);
            const domain = url.hostname;
            document.getElementById('domain-name').textContent = domain;
            await fetchMetrics(domain);
        }
    } catch (error) {
        showError('Failed to get current tab');
    }
});

async function fetchMetrics(domain) {
    const loadingElement = document.getElementById('loading');
    const metricsResult = document.getElementById('metrics-result');
    const errorMessage = document.getElementById('error-message');

    try {
        // Show loading state
        loadingElement.classList.remove('hidden');
        metricsResult.classList.add('hidden');
        errorMessage.classList.add('hidden');

        const metrics = await getDomainMetrics(domain);

        // Update metrics display
        document.getElementById('domain-authority').textContent = metrics.domainAuthority;
        document.getElementById('page-authority').textContent = metrics.pageAuthority;

        // Show results
        loadingElement.classList.add('hidden');
        metricsResult.classList.remove('hidden');

        // Trigger review check by sending message to content script
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
            try {
                await chrome.tabs.sendMessage(activeTab.id, { action: 'showReview' });
            } catch (error) {
                console.error('Failed to send message to content script:', error);
            }
        }
    } catch (error) {
        showError(error.message);
    }
}

async function getDomainMetrics(domain) {
    try {
        const storage = await chrome.storage.local.get('DOMAIN_METRICS_API');
        console.log('Storage state:', storage);

        if (!storage.DOMAIN_METRICS_API) {
            console.error('API URL missing in storage');
            throw new Error('API URL not configured');
        }

        const apiUrl = `${storage.DOMAIN_METRICS_API}?domain=${encodeURIComponent(domain)}`;
        console.log('Fetching from:', apiUrl);

        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error('Failed to fetch metrics');
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.domain_authority || !data.page_authority) {
            console.error('Invalid API response format:', data);
            throw new Error('No metrics available');
        }

        return {
            domainAuthority: data.domain_authority,
            pageAuthority: data.page_authority
        };
    } catch (error) {
        console.error('Detailed error:', error);
        throw error;
    }
}

function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('metrics-result').classList.add('hidden');
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.remove('hidden');
    errorMessage.querySelector('.error-text').textContent = message;
}