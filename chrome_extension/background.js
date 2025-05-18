// Domain Authority API endpoint
const DOMAIN_METRICS_API = "https://variousapi.pushkarsingh32.workers.dev/get-domain-authority";

// Set up the API URL when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ DOMAIN_METRICS_API }, () => {
        console.log('API URL configured successfully');
    });
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: "popup.html" });
});