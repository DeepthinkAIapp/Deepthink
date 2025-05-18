// Constants for storage keys
const STORAGE_KEYS = {
    FIRST_CHECK: 'domainauthoritychecker_first_check_completed',
    REVIEW_DECLINED: 'domainauthoritychecker_review_declined',
    LAST_CLOSED_DATE: 'domainauthoritychecker_last_closed_date'
};

const CHROME_STORE_REVIEW_URL = 'https://chromewebstore.google.com/detail/domain-authority-checker/aiehdjgeijiaojekcihghpcamepglmha/reviews';
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Inject CSS styles into the page
function injectStyles() {
    const styles = `
        .review-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .review-modal.visible {
            opacity: 1;
        }

        .review-content {
            background: white;
            padding: 28px 32px;
            border-radius: 16px;
            max-width: 420px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            position: relative;
        }

        .review-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 24px;
            height: 24px;
            border: none;
            background: none;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            transition: color 0.2s ease;
            font-size: 24px;
            line-height: 1;
        }

        .review-close:hover {
            color: #1a1a1a;
        }

        .review-content h2 {
            font-size: 20px;
            color: #1a1a1a;
            margin: 0 0 20px 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            line-height: 1.3;
            padding-right: 20px;
        }

        .review-content p {
            font-size: 15px;
            color: #666666;
            margin: 0 0 8px;
            line-height: 1.5;
        }

        .review-content p:last-of-type {
            margin-bottom: 0;
            font-size: 14px;
            color: #888888;
        }

        .review-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 28px;
        }

        .review-button {
            padding: 12px 24px;
            border-radius: 12px;
            border: none;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 120px;
        }

        .review-button:hover {
            transform: translateY(-1px);
        }

        .review-button.primary {
            background-color: #4263EB;
            color: white;
        }

        .review-button.primary:hover {
            background-color: #3b5bdb;
            box-shadow: 0 4px 12px rgba(66, 99, 235, 0.2);
        }

        .review-button.secondary {
            background-color: #f1f3f5;
            color: #495057;
        }

        .review-button.secondary:hover {
            background-color: #e9ecef;
        }
    `;

    if (!document.querySelector('#review-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'review-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Show review request after successful domain authority check
async function showReviewRequest() {
    console.log('Showing review request...');
    const { review_declined, last_closed_date } = await chrome.storage.local.get([
        STORAGE_KEYS.REVIEW_DECLINED,
        STORAGE_KEYS.LAST_CLOSED_DATE
    ]);

    if (review_declined) {
        console.log('Review was previously declined');
        return;
    }

    // Check if it's been closed before and if a month has passed
    if (last_closed_date) {
        const currentTime = Date.now();
        if (currentTime - last_closed_date < ONE_MONTH_MS) {
            console.log('Less than a month since last close, skipping');
            return;
        }
    }

    // Inject styles if not already injected
    injectStyles();

    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.style.opacity = '0';
    modal.innerHTML = `
    <div class="review-content">
        <button class="review-close" aria-label="Close">×</button>
        <h2>✨ Enjoying Domain Authority Checker?</h2>
        <p>Your feedback helps us grow and improve! If you find our tool helpful, would you take a moment to share your experience?</p>
        <p>Your review means the world to us and helps others discover this tool.</p>
        <div class="review-buttons">
            <button id="maybeNext" class="review-button secondary">Already Did</button>
            <button id="leaveReview" class="review-button primary">Yes, I'll Help!</button>
        </div>
    </div>`;

    document.body.appendChild(modal);

    // Trigger fade-in animation
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.classList.add('visible');
    });

    // Handle button clicks
    document.getElementById('leaveReview').addEventListener('click', () => {
        chrome.storage.local.set({
            [STORAGE_KEYS.REVIEW_DECLINED]: true
        });
        window.open(CHROME_STORE_REVIEW_URL, '_blank');
        modal.remove();
    });

    document.getElementById('maybeNext').addEventListener('click', () => {
        chrome.storage.local.set({
            [STORAGE_KEYS.REVIEW_DECLINED]: true
        });
        modal.remove();
    });

    // Handle close button click - show again in a month
    modal.querySelector('.review-close').addEventListener('click', () => {
        chrome.storage.local.set({
            [STORAGE_KEYS.LAST_CLOSED_DATE]: Date.now()
        });
        modal.remove();
    });

    // Handle click outside modal to close - also show again in a month
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            chrome.storage.local.set({
                [STORAGE_KEYS.LAST_CLOSED_DATE]: Date.now()
            });
            modal.remove();
        }
    });
}

// Track first successful check
async function trackFirstCheck() {
    console.log('Tracking first check...');
    const { first_check_completed, review_declined, last_closed_date } = await chrome.storage.local.get([
        STORAGE_KEYS.FIRST_CHECK,
        STORAGE_KEYS.REVIEW_DECLINED,
        STORAGE_KEYS.LAST_CLOSED_DATE
    ]);

    // If user clicked "Already Did", never show again
    if (review_declined) {
        console.log('Review was previously declined');
        return;
    }

    // Check if it's been closed before and if a month has passed
    const currentTime = Date.now();
    const shouldShowAfterClose = last_closed_date
        ? (currentTime - last_closed_date) >= ONE_MONTH_MS
        : true;

    // Show if:
    // 1. Never shown before OR
    // 2. Was closed (not declined) and a month has passed
    if (!first_check_completed || shouldShowAfterClose) {
        showReviewRequest();
    }
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showReview') {
        trackFirstCheck();
    }
}); 