document.addEventListener('DOMContentLoaded', async () => {
    const loadingElement = document.getElementById('loading');
    const metricsResultElement = document.getElementById('metrics-result');
    const errorMessageElement = document.getElementById('error-message');
    const domainNameElement = document.getElementById('domain-name');
    const domainAuthorityElement = document.getElementById('domain-authority');
    const pageAuthorityElement = document.getElementById('page-authority');
    const spamScoreElement = document.getElementById('spam-score');
    const backlinksElement = document.getElementById('backlinks');
    const refreshButton = document.getElementById('refresh-btn');
    const exportButton = document.getElementById('export-btn');

    // Show loading state
    loadingElement.classList.remove('hidden');
    metricsResultElement.classList.add('hidden');
    errorMessageElement.classList.add('hidden');

    try {
        // Get the current tab's URL
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tab.url);
        const domain = url.hostname;

        // Display domain name
        domainNameElement.textContent = domain;

        // Get API URL from storage
        const { DOMAIN_METRICS_API } = await chrome.storage.local.get('DOMAIN_METRICS_API');

        // Fetch metrics (using mock data for testing)
        const response = await fetch(`${DOMAIN_METRICS_API}?domain=${domain}`);
        const data = await response.json();

        // Update UI with metrics
        domainAuthorityElement.textContent = data.domain_authority;
        pageAuthorityElement.textContent = data.page_authority;
        spamScoreElement.textContent = data.spam_score;
        backlinksElement.textContent = data.backlinks.toLocaleString();

        // Show results
        loadingElement.classList.add('hidden');
        metricsResultElement.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        errorMessageElement.querySelector('.error-text').textContent = 
            'Failed to fetch domain metrics. Please try again.';
        loadingElement.classList.add('hidden');
        errorMessageElement.classList.remove('hidden');
    }

    // Refresh button click handler
    refreshButton.addEventListener('click', async () => {
        loadingElement.classList.remove('hidden');
        metricsResultElement.classList.add('hidden');
        errorMessageElement.classList.add('hidden');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = new URL(tab.url);
            const domain = url.hostname;

            // Simulate API call with mock data
            const mockData = {
                domainAuthority: Math.floor(Math.random() * 100),
                pageAuthority: Math.floor(Math.random() * 100),
                spamScore: Math.floor(Math.random() * 17),
                backlinks: Math.floor(Math.random() * 10000)
            };

            // Update UI with new metrics
            domainAuthorityElement.textContent = mockData.domainAuthority;
            pageAuthorityElement.textContent = mockData.pageAuthority;
            spamScoreElement.textContent = mockData.spamScore;
            backlinksElement.textContent = mockData.backlinks.toLocaleString();

            loadingElement.classList.add('hidden');
            metricsResultElement.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            errorMessageElement.querySelector('.error-text').textContent = 
                'Failed to refresh metrics. Please try again.';
            loadingElement.classList.add('hidden');
            errorMessageElement.classList.remove('hidden');
        }
    });

    // Export button click handler
    exportButton.addEventListener('click', async () => {
        try {
            const metrics = {
                domain: domainNameElement.textContent,
                domainAuthority: domainAuthorityElement.textContent,
                pageAuthority: pageAuthorityElement.textContent,
                spamScore: spamScoreElement.textContent,
                backlinks: backlinksElement.textContent,
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `domain-metrics-${metrics.domain}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
            errorMessageElement.querySelector('.error-text').textContent = 
                'Failed to export data. Please try again.';
            errorMessageElement.classList.remove('hidden');
        }
    });
}); 