/**
 * Palace Cafe & Bar - Admin Dashboard Main
 * Application initialization and global setup
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

'use strict';

/**
 * Application entry point
 * Initialize the admin dashboard when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Palace Admin Dashboard starting...');
    
    // Check authentication before initializing
    if (!checkAuthentication()) {
        redirectToLogin();
        return;
    }
    
    // Initialize the main dashboard
    window.adminDashboard = new AdminDashboard();

    setTimeout(() => {
        if (window.adminDashboard && window.adminDashboard.apps.analytics) {
            window.statsApp = window.adminDashboard.apps.analytics;
        }
    }, 100);
    
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Setup service worker for offline support
    setupServiceWorker();
    
    // Setup performance monitoring
    setupPerformanceMonitoring();
    
    // Handle browser back/forward buttons
    setupBrowserNavigation();
    
    // Setup keyboard shortcuts help
    setupKeyboardShortcutsHelp();
    
    console.log('✅ Palace Admin Dashboard initialized');
});

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    const tokenExpiry = localStorage.getItem('adminTokenExpiry');
    
    if (!token || !tokenExpiry) {
        console.warn('🔒 No authentication token found');
        return false;
    }
    
    if (new Date() > new Date(tokenExpiry)) {
        console.warn('🔒 Authentication token expired');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpiry');
        return false;
    }
    
    return true;
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    console.log('🔄 Redirecting to login...');
    window.location.href = 'admin-login.html';
}

/**
 * Setup global error handling
 */
function setupGlobalErrorHandling() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('🚨 Global JavaScript Error:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
        
        // Show user-friendly error message
        if (window.adminDashboard) {
            window.adminDashboard.showNotification(
                'Váratlan hiba történt. Kérjük frissítse az oldalt.',
                'error'
            );
        }
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Unhandled Promise Rejection:', event.reason);
        
        // Show user-friendly error message
        if (window.adminDashboard) {
            window.adminDashboard.showNotification(
                'Hálózati hiba történt. Kérjük próbálja újra.',
                'error'
            );
        }
        
        // Prevent default browser error handling
        event.preventDefault();
    });
}

/**
 * Setup service worker for offline support
 */
function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/admin-sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered:', registration.scope);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available
                                if (window.adminDashboard) {
                                    window.adminDashboard.showNotification(
                                        'Új verzió elérhető. Frissítse az oldalt.',
                                        'info'
                                    );
                                }
                            }
                        });
                    });
                })
                .catch(registrationError => {
                    console.warn('❌ Service Worker registration failed:', registrationError);
                });
        });
    }
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
    window.addEventListener('load', () => {
        // Measure page load performance
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            console.log(`📊 Page load time: ${loadTime}ms`);
            
            // Log slow load times
            if (loadTime > 3000) {
                console.warn('⚠️ Slow page load detected');
            }
        }
        
        // Monitor resource loading
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(resource => resource.duration > 1000);
        if (slowResources.length > 0) {
            console.warn('⚠️ Slow resources detected:', slowResources);
        }
    });
    
    // Monitor memory usage (if available)
    if ('memory' in performance) {
        setInterval(() => {
            const memInfo = performance.memory;
            const usedMB = Math.round(memInfo.usedJSHeapSize / 1048576);
            
            // Log memory warnings
            if (usedMB > 100) {
                console.warn(`⚠️ High memory usage: ${usedMB}MB`);
            }
        }, 60000); // Check every minute
    }
}

/**
 * Setup browser navigation (back/forward buttons)
 */
function setupBrowserNavigation() {
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.app && window.adminDashboard) {
            window.adminDashboard.loadApp(event.state.app);
        } else {
            // Default to dashboard if no state
            const hash = window.location.hash.substring(1);
            const app = hash || 'dashboard';
            if (window.adminDashboard) {
                window.adminDashboard.loadApp(app);
            }
        }
    });
    
    // Handle initial load with hash
    window.addEventListener('load', () => {
        const hash = window.location.hash.substring(1);
        if (hash && window.adminDashboard) {
            setTimeout(() => {
                window.adminDashboard.loadApp(hash);
            }, 100);
        }
    });
}

/**
 * Setup keyboard shortcuts help
 */
function setupKeyboardShortcutsHelp() {
    // Show help modal when Ctrl+? or F1 is pressed
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.key === '?') || e.key === 'F1') {
            e.preventDefault();
            showKeyboardShortcutsHelp();
        }
    });
}

/**
 * Show keyboard shortcuts help modal
 */
function showKeyboardShortcutsHelp() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('keyboardShortcutsModal');
    if (!modal) {
        modal = createKeyboardShortcutsModal();
        document.body.appendChild(modal);
    }
    
    modal.classList.add('active');
}

/**
 * Create keyboard shortcuts help modal
 */
function createKeyboardShortcutsModal() {
    const modal = document.createElement('div');
    modal.id = 'keyboardShortcutsModal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeKeyboardShortcutsModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-keyboard"></i> Billentyű parancsok</h3>
                <button class="modal-close" onclick="closeKeyboardShortcutsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="shortcuts-grid">
                    <div class="shortcut-section">
                        <h4>Navigáció</h4>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>1</kbd>
                            <span>Áttekintés</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>2</kbd>
                            <span>Rendelések</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>3</kbd>
                            <span>Menü kezelés</span>
                        </div>
                    </div>
                    
                    <div class="shortcut-section">
                        <h4>Műveletek</h4>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>R</kbd>
                            <span>Adatok frissítése</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>F</kbd>
                            <span>Keresés</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Modális bezárása</span>
                        </div>
                    </div>
                    
                    <div class="shortcut-section">
                        <h4>Súgó</h4>
                        <div class="shortcut-item">
                            <kbd>F1</kbd>
                            <span>Billentyű parancsok</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>?</kbd>
                            <span>Billentyű parancsok</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add styles for the modal
    if (!document.getElementById('keyboardShortcutsStyles')) {
        const styles = document.createElement('style');
        styles.id = 'keyboardShortcutsStyles';
        styles.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
            }
            
            .modal.active {
                display: flex;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .modal-content {
                position: relative;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                animation: modalSlideIn 0.3s ease;
            }
            
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            .modal-header {
                padding: 20px 25px;
                border-bottom: 1px solid #ecf0f1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #f8f9fa, #ffffff);
            }
            
            .modal-header h3 {
                margin: 0;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .modal-header h3 i {
                color: #D4AF37;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 18px;
                color: #7f8c8d;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            
            .modal-close:hover {
                background: #ecf0f1;
                color: #2c3e50;
            }
            
            .modal-body {
                padding: 25px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .shortcuts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 25px;
            }
            
            .shortcut-section h4 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                font-size: 16px;
                font-weight: 600;
                border-bottom: 2px solid #D4AF37;
                padding-bottom: 8px;
            }
            
            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #ecf0f1;
            }
            
            .shortcut-item:last-child {
                border-bottom: none;
            }
            
            kbd {
                background: #2c3e50;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                font-family: monospace;
                margin: 0 2px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .shortcut-item span {
                color: #7f8c8d;
                font-size: 14px;
            }
        `;
        document.head.appendChild(styles);
    }
    
    return modal;
}

/**
 * Close keyboard shortcuts modal
 */
function closeKeyboardShortcutsModal() {
    const modal = document.getElementById('keyboardShortcutsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Make close function available globally
window.closeKeyboardShortcutsModal = closeKeyboardShortcutsModal;

/**
 * Setup beforeunload event to warn about unsaved changes
 */
window.addEventListener('beforeunload', (event) => {
    // Check if there are any unsaved changes
    if (window.adminDashboard && window.adminDashboard.hasUnsavedChanges) {
        const message = 'Mentetlen módosításai vannak. Biztosan el szeretne navigálni?';
        event.returnValue = message;
        return message;
    }
});

/**
 * Development helpers (only in development mode)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Add development console commands
    window.adminDebug = {
        // Get current dashboard state
        getState: () => window.adminDashboard?.state,
        
        // Force reload an app
        reloadApp: (appName) => {
            if (window.adminDashboard?.apps[appName]) {
                window.adminDashboard.apps[appName].isLoaded = false;
                window.adminDashboard.loadApp(appName);
            }
        },
        
        // Show test notification
        testNotification: (message = 'Test notification', type = 'info') => {
            window.adminDashboard?.showNotification(message, type);
        },
        
        // Clear localStorage
        clearStorage: () => {
            localStorage.clear();
            console.log('localStorage cleared');
        },
        
        // Simulate API error
        simulateError: () => {
            throw new Error('Test error for debugging');
        },
        
        // Get performance metrics
        getPerformance: () => {
            return {
                navigation: performance.getEntriesByType('navigation')[0],
                resources: performance.getEntriesByType('resource'),
                memory: performance.memory
            };
        }
    };
    
    console.log('🔧 Development mode active. Use adminDebug object for debugging.');
    console.log('Available commands:');
    console.log('- adminDebug.getState()');
    console.log('- adminDebug.reloadApp(appName)');
    console.log('- adminDebug.testNotification(message, type)');
    console.log('- adminDebug.clearStorage()');
    console.log('- adminDebug.getPerformance()');
}

/**
 * Analytics tracking (future implementation)
 */
function trackPageView(page) {
    // Future implementation for analytics
    console.log(`📊 Page view: ${page}`);
}

function trackUserAction(action, details = {}) {
    // Future implementation for analytics
    console.log(`📊 User action: ${action}`, details);
}

/**
 * Accessibility enhancements
 */
function setupAccessibility() {
    // Focus management for keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-focus');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-focus');
    });
    
    // Skip to main content link for screen readers
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Ugrás a fő tartalomhoz';
    skipLink.className = 'skip-link sr-only';
    skipLink.addEventListener('focus', () => {
        skipLink.classList.remove('sr-only');
    });
    skipLink.addEventListener('blur', () => {
        skipLink.classList.add('sr-only');
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Initialize accessibility when DOM is ready
document.addEventListener('DOMContentLoaded', setupAccessibility);

/**
 * Cleanup when page is unloaded
 */
window.addEventListener('unload', () => {
    if (window.adminDashboard) {
        window.adminDashboard.destroy();
    }
    console.log('🧹 Dashboard cleanup completed');
});

/**
 * Export functions for testing
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuthentication,
        setupGlobalErrorHandling,
        setupPerformanceMonitoring,
        trackPageView,
        trackUserAction
    };
}