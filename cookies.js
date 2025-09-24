/**
 * Palace Cafe & Bar - Cookie Consent System
 * GDPR Compliant Cookie Management
 * Professional implementation with security features
 */

class CookieConsent {
    constructor() {
        this.config = {
            cookieName: 'palace_cookie_consent',
            cookieExpiry: 365, // days
            version: '1.0'
        };

        this.consentData = {
            essential: true,    // Always true - required for functionality
            analytics: false,
            marketing: false,
            timestamp: null,
            version: this.config.version
        };

        this.init();
    }

    /**
     * Initialize the cookie consent system
     */
    init() {
        console.log('🍪 Initializing Cookie Consent System...');
        
        // Load existing consent
        this.loadConsent();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show banner if needed
        this.checkAndShowBanner();
        
        // Initialize analytics if consented
        this.initializeServices();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Banner buttons
        document.getElementById('cookieSettings')?.addEventListener('click', () => {
            this.showModal();
        });

        document.getElementById('acceptEssential')?.addEventListener('click', () => {
            this.acceptEssential();
        });

        document.getElementById('acceptAll')?.addEventListener('click', () => {
            this.acceptAll();
        });

        // Modal buttons
        document.getElementById('closeCookieModal')?.addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveCustomSettings();
        });

        // Close modal on background click
        document.getElementById('cookieModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'cookieModal') {
                this.hideModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    /**
     * Load existing consent from localStorage
     */
    loadConsent() {
        try {
            const stored = localStorage.getItem(this.config.cookieName);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Check if consent is still valid (version match)
                if (data.version === this.config.version) {
                    this.consentData = { ...this.consentData, ...data };
                    console.log('✅ Loaded existing cookie consent:', this.consentData);
                    return true;
                }
            }
        } catch (error) {
            console.warn('⚠️ Error loading cookie consent:', error);
        }
        return false;
    }

    /**
     * Save consent to localStorage
     */
    saveConsent() {
        try {
            this.consentData.timestamp = new Date().toISOString();
            localStorage.setItem(this.config.cookieName, JSON.stringify(this.consentData));
            console.log('💾 Cookie consent saved:', this.consentData);
        } catch (error) {
            console.error('❌ Error saving cookie consent:', error);
        }
    }

    /**
     * Check if banner should be shown
     */
    checkAndShowBanner() {
        if (!this.consentData.timestamp) {
            this.showBanner();
        }
    }

    /**
     * Show cookie consent banner
     */
    showBanner() {
        const banner = document.getElementById('cookieConsent');
        if (banner) {
            // Small delay for better UX
            setTimeout(() => {
                banner.classList.add('show');
                console.log('📢 Cookie banner shown');
            }, 1000);
        }
    }

    /**
     * Hide cookie consent banner
     */
    hideBanner() {
        const banner = document.getElementById('cookieConsent');
        if (banner) {
            banner.classList.remove('show');
            console.log('✅ Cookie banner hidden');
        }
    }

    /**
     * Show cookie settings modal
     */
    showModal() {
        const modal = document.getElementById('cookieModal');
        if (modal) {
            // Set current preferences
            document.getElementById('analyticsCookies').checked = this.consentData.analytics;
            document.getElementById('marketingCookies').checked = this.consentData.marketing;
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            console.log('⚙️ Cookie settings modal shown');
        }
    }

    /**
     * Hide cookie settings modal
     */
    hideModal() {
        const modal = document.getElementById('cookieModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = ''; // Restore scroll
            console.log('✅ Cookie settings modal hidden');
        }
    }

    /**
     * Accept only essential cookies
     */
    acceptEssential() {
        this.consentData.essential = true;
        this.consentData.analytics = false;
        this.consentData.marketing = false;
        
        this.saveConsent();
        this.hideBanner();
        this.initializeServices();
        
        this.showNotification('Csak a szükséges sütik lettek elfogadva.', 'info');
    }

    /**
     * Accept all cookies
     */
    acceptAll() {
        this.consentData.essential = true;
        this.consentData.analytics = true;
        this.consentData.marketing = true;
        
        this.saveConsent();
        this.hideBanner();
        this.initializeServices();
        
        this.showNotification('Minden süti elfogadva. Köszönjük!', 'success');
    }

    /**
     * Save custom settings from modal
     */
    saveCustomSettings() {
        this.consentData.essential = true; // Always true
        this.consentData.analytics = document.getElementById('analyticsCookies').checked;
        this.consentData.marketing = document.getElementById('marketingCookies').checked;
        
        this.saveConsent();
        this.hideModal();
        this.hideBanner();
        this.initializeServices();
        
        this.showNotification('Süti beállítások mentve.', 'success');
    }

    /**
     * Initialize services based on consent
     */
    initializeServices() {
        // Initialize Google Analytics if consented
        if (this.consentData.analytics) {
            this.initGoogleAnalytics();
        }

        // Initialize marketing cookies if consented
        if (this.consentData.marketing) {
            this.initMarketingServices();
        }

        console.log('🔧 Services initialized based on consent:', this.consentData);
    }

    /**
     * Initialize Google Analytics (when you add it later)
     */
    initGoogleAnalytics() {
        console.log('📊 Initializing Google Analytics...');
        
        if (typeof gtag !== 'undefined') {
            // Update consent for analytics
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
            
            // Enable enhanced measurement features if user fully consented
            if (this.consentData.marketing) {
                gtag('config', 'YOUR_G_ID_HERE', {
                    'allow_google_signals': true,
                    'allow_ad_personalization_signals': true
                });
            }
            
            // Track that analytics was enabled
            gtag('event', 'cookie_consent_granted', {
                'event_category': 'privacy',
                'event_label': 'analytics_enabled'
            });
            
            console.log('✅ Google Analytics initialized with user consent');
        } else {
            console.warn('⚠️ Google Analytics not loaded');
        }
    }

    /**
     * Initialize marketing services
     */
    initMarketingServices() {
        console.log('📢 Marketing services would be initialized here');
        
        // Future: Facebook Pixel, other marketing tools
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `cookie-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10002;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    /**
     * Public method to check if specific consent is given
     */
    hasConsent(type) {
        return this.consentData[type] || false;
    }

    /**
     * Public method to revoke all consent (for testing or user request)
     */
    revokeConsent() {
        localStorage.removeItem(this.config.cookieName);
        this.consentData = {
            essential: true,
            analytics: false,
            marketing: false,
            timestamp: null,
            version: this.config.version
        };
        console.log('🗑️ Cookie consent revoked');
        this.showBanner();
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.palaceCookieConsent) {
        return;
    }
    
    window.palaceCookieConsent = new CookieConsent();
});

// Add notification animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(style);