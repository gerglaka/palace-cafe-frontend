/**
 * Palace Cafe & Bar - Admin Dashboard Core
 * Component-based SPA architecture with security and performance focus
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

'use strict';

/**
 * Main Admin Dashboard Controller
 * Handles navigation, app loading, and core functionality
 */
class AdminDashboard {
    constructor() {
        // Configuration
        this.config = {
            apiUrl: 'https://palace-cafe-backend-production.up.railway.app/api/admin',
            refreshInterval: 30000, // 30 seconds
            maxRetries: 3,
            retryDelay: 1000
        };

        // State management
        this.state = {
            currentApp: 'dashboard',
            user: null,
            isLoading: false,
            sidebarCollapsed: false,
            notifications: [],
            lastRefresh: null
        };

        // Available apps (will be expanded later)
        this.apps = {
            dashboard: new DashboardOverview(),
            orders: new OrdersApp(),
            menu: new MenuApp(),
            analytics: typeof StatsApp !== 'undefined' ? new StatsApp() : new BaseApp('analytics'),
            invoices: new InvoicesApp(),
            content: new ContentApp(),
            settings: new SettingsApp()
        };

        this.apps = {
            dashboard: new DashboardOverview(),
            orders: new OrdersApp(),
            menu: new MenuApp(),
            analytics: typeof StatsApp !== 'undefined' ? new StatsApp() : new BaseApp('analytics'),
            invoices: new InvoicesApp(),
            content: new ContentApp(),
            settings: new SettingsApp()
        };
        
        // Make orders app globally accessible for onclick handlers
        window.ordersApp = this.apps.orders;
        window.invoicesApp = this.apps.invoices;

        // Event listeners and security
        this.setupEventListeners();
        this.setupSecurity();
        this.init();
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        try {
            this.showLoading();
            
            // Load user information
            await this.loadUserInfo();

            // Restore sidebar state
            this.restoreSidebarState();            
            
            // Initialize real-time features
            this.setupRealTimeUpdates();
            
            // Setup automatic data refresh
            this.setupAutoRefresh();
            
            // Load default app
            await this.loadApp('dashboard');
            
            // Start time updates
            this.startTimeUpdates();
            
            this.hideLoading();
            
            console.log('✅ Admin Dashboard initialized successfully');
            this.showNotification('Dashboard loaded successfully', 'success');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.hideLoading();
            this.showNotification('Failed to load dashboard', 'error');
        }


    }

    /**
     * Setup security measures
     */
    setupSecurity() {
        // CSRF Token management
        this.csrfToken = this.getCSRFToken();
        
        // Session timeout handling
        this.setupSessionTimeout();
        
        // Prevent XSS
        this.sanitizeUserInput = this.sanitizeUserInput.bind(this);
        
        // Rate limiting for API calls
        this.apiCallLimiter = this.createRateLimiter(100, 60000); // 100 calls per minute
    }

    /**
     * Get CSRF token from meta tag
     */
    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    /**
     * Setup session timeout
     */
    setupSessionTimeout() {
        let lastActivity = Date.now();
        const timeoutDuration = 30 * 60 * 1000; // 30 minutes

        // Update last activity on user interaction
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
            }, { passive: true });
        });

        // Check for timeout every minute
        setInterval(() => {
            if (Date.now() - lastActivity > timeoutDuration) {
                this.handleSessionTimeout();
            }
        }, 60000);
    }

    /**
     * Handle session timeout
     */
    handleSessionTimeout() {
        this.showNotification('Session expired. Please log in again.', 'warning');
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 3000);
    }

    /**
     * Create rate limiter
     */
    createRateLimiter(maxCalls, timeWindow) {
        const calls = [];
        return () => {
            const now = Date.now();
            // Remove old calls outside time window
            while (calls.length > 0 && calls[0] <= now - timeWindow) {
                calls.shift();
            }
            
            if (calls.length >= maxCalls) {
                throw new Error('Rate limit exceeded');
            }
            
            calls.push(now);
            return true;
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation clicks
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.app) {
                e.preventDefault();
                this.loadApp(navItem.dataset.app);
            }
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Mobile menu button
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Quick action buttons
        const newOrderBtn = document.getElementById('newOrderBtn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.loadApp('orders');
            });
        }

        const refreshDataBtn = document.getElementById('refreshDataBtn');
        if (refreshDataBtn) {
            refreshDataBtn.addEventListener('click', () => {
                this.refreshAllData();
            });
        }

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.debounce((e) => {
                this.performGlobalSearch(e.target.value);
            }, 500));
        }

        // Notification bell
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.showNotificationsPanel();
            });
        }

        // Mark all notifications as read
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllNotificationsAsRead();
            });
        }

        // Clear all notifications
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearAllNotifications();
            });
        }

        // View all notifications (placeholder for now)
        const viewAllBtn = document.getElementById('viewAllBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideNotificationsPanel();
                // Future: Navigate to full notifications page
                console.log('Navigate to full notifications page');
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');

            if (window.innerWidth <= 768 && 
                sidebar && 
                sidebar.classList.contains('mobile-open') && 
                !sidebar.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Visibility change (for pausing updates when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseRealTimeUpdates();
            } else {
                this.resumeRealTimeUpdates();
            }
        });
    }

    /**
     * Toggle mobile sidebar
     */
    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + combinations
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.loadApp('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.loadApp('orders');
                    break;
                case '3':
                    e.preventDefault();
                    this.loadApp('menu');
                    break;
                case 'r':
                    e.preventDefault();
                    this.refreshAllData();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('globalSearch')?.focus();
                    break;
            }
        }
        
        // Escape key
        if (e.key === 'Escape') {
            this.closeModals();
        }
    }

    /**
     * Load user information
     */
    async loadUserInfo() {
        try {
            const response = await this.apiCall('/auth/user');
            this.state.user = response.data;
            
            // Update UI with user info
            const adminName = document.getElementById('adminName');
            const adminRole = document.getElementById('adminRole');
            
            if (adminName && this.state.user.name) {
                adminName.textContent = this.state.user.name;
            }
            
            if (adminRole && this.state.user.role) {
                adminRole.textContent = this.state.user.role;
            }
            
        } catch (error) {
            console.error('Failed to load user info:', error);
            // Use defaults if API fails
            this.state.user = {
                name: 'Admin User',
                role: 'Administrator'
            };
        }
    }

    /**
     * Load specific app
     */
    async loadApp(appName) {
        if (this.state.currentApp === appName) return;

        try {
            this.showLoading();

            // Hide current app
            const currentContainer = document.getElementById(`${this.state.currentApp}-app`);
            if (currentContainer) {
                currentContainer.classList.remove('active');
            }

            // Update navigation
            this.updateNavigation(appName);

            // Load new app
            const app = this.apps[appName];
            if (app) {
                await app.load();
                
                // Show new app container
                const newContainer = document.getElementById(`${appName}-app`);
                if (newContainer) {
                    newContainer.classList.add('active');
                }

                // Update state
                this.state.currentApp = appName;
                
                // Update URL without page reload
                this.updateURL(appName);
                
                // Update page title and breadcrumb
                this.updatePageHeader(appName);
                
                console.log(`✅ Loaded app: ${appName}`);
            }

            this.hideLoading();

        } catch (error) {
            console.error(`❌ Failed to load app ${appName}:`, error);
            this.hideLoading();
            this.showNotification(`Failed to load ${appName}`, 'error');
        }
    }

    /**
     * Update navigation active state
     */
    updateNavigation(appName) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current nav item
        const currentNavItem = document.querySelector(`[data-app="${appName}"]`);
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
    }

    /**
     * Update page header
     */
    updatePageHeader(appName) {
        const titles = {
            dashboard: 'Áttekintés',
            orders: 'Rendelések',
            menu: 'Menü kezelés',
            analytics: 'Statisztikák',
            content: 'Tartalom szerkesztő',
            settings: 'Beállítások'
        };

        const pageTitle = document.getElementById('pageTitle');
        const breadcrumbPath = document.getElementById('breadcrumbPath');

        if (pageTitle) {
            pageTitle.textContent = titles[appName] || 'Dashboard';
        }

        if (breadcrumbPath) {
            breadcrumbPath.textContent = `Dashboard > ${titles[appName] || appName}`;
        }

        // Update document title
        document.title = `${titles[appName] || 'Dashboard'} - Palace Admin`;
    }

    /**
     * Update URL without page reload
     */
    updateURL(appName) {
        const newURL = `${window.location.pathname}#${appName}`;
        window.history.pushState({ app: appName }, '', newURL);
    }

    /**
     * Toggle sidebar collapse
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            this.state.sidebarCollapsed = sidebar.classList.contains('collapsed');
            
            // Store preference
            localStorage.setItem('sidebarCollapsed', this.state.sidebarCollapsed);
        }
    }

    /**
     * Restore sidebar state from localStorage
     */
    restoreSidebarState() {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
                this.state.sidebarCollapsed = true;
            }
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        if (confirm('Biztosan ki szeretne jelentkezni?')) {
            try {
                this.showLoading();
                
                // Call logout API
                await this.apiCall('/auth/logout', { method: 'POST' });
                
                // Clear local storage
                localStorage.clear();
                
                // Redirect to login
                window.location.href = 'admin-login.html';
                
            } catch (error) {
                console.error('Logout failed:', error);
                this.hideLoading();
                // Force redirect even if API fails
                window.location.href = 'admin-login.html';
            }
        }
    }

    /**
     * Setup real-time updates
     */
    setupRealTimeUpdates() {
        // For now, use polling. Will upgrade to WebSockets later
        this.updateInterval = setInterval(() => {
            if (!document.hidden && this.state.currentApp === 'dashboard') {
                this.refreshDashboardData();
            }
        }, this.config.refreshInterval);
    }

    /**
     * Setup auto refresh
     */
    setupAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            if (!document.hidden) {
                this.refreshAllData();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Pause real-time updates
     */
    pauseRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    /**
     * Resume real-time updates
     */
    resumeRealTimeUpdates() {
        this.setupRealTimeUpdates();
    }

    /**
     * Refresh all data
     */
    async refreshAllData() {
        try {
            this.showNotification('Refreshing data...', 'info');
            
            // Refresh current app data
            const currentApp = this.apps[this.state.currentApp];
            if (currentApp && currentApp.refresh) {
                await currentApp.refresh();
            }
            
            // Update last refresh time
            this.state.lastRefresh = new Date();
            
            this.showNotification('Data refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Failed to refresh data:', error);
            this.showNotification('Failed to refresh data', 'error');
        }
    }

    /**
     * Refresh dashboard data specifically
     */
    async refreshDashboardData() {
        if (this.state.currentApp === 'dashboard' && this.apps.dashboard) {
            await this.apps.dashboard.refresh();
        }
    }

    /**
     * Start time updates
     */
    startTimeUpdates() {
        const updateTime = () => {
            const currentTime = document.getElementById('currentTime');
            if (currentTime) {
                const now = new Date();
                const timeString = now.toLocaleTimeString('hu-HU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                currentTime.textContent = timeString;
            }
        };

        // Update immediately and then every second
        updateTime();
        setInterval(updateTime, 1000);
    }

    /**
     * Perform global search
     */
    async performGlobalSearch(query) {
        if (query.length < 2) return;

        try {
            const response = await this.apiCall(`/search?q=${encodeURIComponent(query)}`);
            
            // Show search results (will implement dropdown later)
            console.log('Search results:', response.data);
            
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    /**
     * Show notifications panel
     */
    showNotificationsPanel() {
        const panel = document.getElementById('notificationsPanel');
        if (!panel) return;

        // Toggle panel visibility
        const isActive = panel.classList.contains('active');

        if (isActive) {
            this.hideNotificationsPanel();
        } else {
            // Hide any other open panels first
            this.hideNotificationsPanel();

            // Show panel
            panel.classList.add('active');

            // Render notifications
            this.renderNotificationsList();

            // Mark all as read after a short delay
            setTimeout(() => {
                this.markNotificationsAsRead();
            }, 1000);

            // Add click outside listener
            setTimeout(() => {
                document.addEventListener('click', this.handleNotificationOutsideClick.bind(this), { once: true });
            }, 100);
        }
    }

    /**
     * Hide notifications panel
     */
    hideNotificationsPanel() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    /**
     * Handle click outside notifications panel
     */
    handleNotificationOutsideClick(event) {
        const panel = document.getElementById('notificationsPanel');
        const bell = document.getElementById('notificationBell');

        if (panel && bell && !bell.contains(event.target)) {
            this.hideNotificationsPanel();
        }
    }

    /**
     * Render notifications list
     */
    renderNotificationsList() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        const notifications = this.state.notifications.slice().reverse(); // Show newest first

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="notifications-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>Nincsenek értesítések</p>
                </div>
            `;
            return;
        }

        const notificationsHtml = notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon ${notification.type}">
                    <i class="${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${this.getNotificationTitle(notification.type)}</div>
                    <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                    <div class="notification-time">${this.formatNotificationTime(notification.timestamp)}</div>
                </div>
                <div class="notification-actions">
                    <button class="btn-notification-close" onclick="adminDashboard.removeNotification(${notification.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = notificationsHtml;
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get notification title based on type
     */
    getNotificationTitle(type) {
        const titles = {
            success: 'Sikeres művelet',
            error: 'Hiba történt',
            warning: 'Figyelmeztetés',
            info: 'Információ'
        };
        return titles[type] || titles.info;
    }

    /**
     * Format notification timestamp
     */
    formatNotificationTime(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Most';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} perce`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} órája`;
        } else {
            return notificationTime.toLocaleDateString('hu-HU', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    /**
     * Mark notifications as read
     */
    markNotificationsAsRead() {
        this.state.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateNotificationCount();
    }

    /**
     * Remove a specific notification
     */
    removeNotification(notificationId) {
        this.state.notifications = this.state.notifications.filter(n => n.id !== notificationId);
        this.updateNotificationCount();
        this.renderNotificationsList();
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        if (this.state.notifications.length === 0) return;

        if (confirm('Biztosan törli az összes értesítést?')) {
            this.state.notifications = [];
            this.updateNotificationCount();
            this.renderNotificationsList();
            this.showNotification('Összes értesítés törölve', 'info');
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead() {
        const unreadCount = this.state.notifications.filter(n => !n.read).length;
        if (unreadCount === 0) return;

        this.markNotificationsAsRead();
        this.renderNotificationsList();
        this.showNotification(`${unreadCount} értesítés megjelölve olvasottként`, 'success');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Auto-collapse sidebar on mobile
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.add('collapsed');
        }
    }

    /**
     * Close all modals
     */
    closeModals() {
        // Will implement modal closing later
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        this.state.isLoading = true;
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.state.isLoading = false;
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Show notification toast
     */
    showNotification(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type] || icons.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        toastContainer.appendChild(toast);

        // Add to notifications array
        this.state.notifications.push({
            message,
            type,
            timestamp: new Date(),
            id: Date.now()
        });

        // Update notification count
        this.updateNotificationCount();
    }

    /**
     * Remove toast notification
     */
    removeToast(toast) {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Update notification count badge
     */
    updateNotificationCount() {
        const notificationCount = document.getElementById('notificationCount');
        if (notificationCount) {
            const unreadCount = this.state.notifications.filter(n => !n.read).length;
            notificationCount.textContent = unreadCount;
            notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    /**
     * Sanitize user input to prevent XSS
     */
    sanitizeUserInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for performance
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Make API calls with error handling and retries
     */
    async apiCall(endpoint, options = {}) {
        // Check rate limit
        try {
            this.apiCallLimiter();
        } catch (error) {
            throw new Error('Too many requests. Please wait before trying again.');
        }

        const url = `${this.config.apiUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.csrfToken,
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
        };

        const requestOptions = { ...defaultOptions, ...options };

        let lastError;
        
        // Retry logic
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await fetch(url, requestOptions);
                
                // Handle authentication errors
                if (response.status === 401) {
                    this.handleSessionTimeout();
                    throw new Error('Authentication required');
                }

                // Handle other HTTP errors
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Validate response structure
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid response format');
                }

                return data;

            } catch (error) {
                lastError = error;
                console.warn(`API call attempt ${attempt} failed:`, error.message);
                
                // Don't retry on authentication errors
                if (error.message.includes('Authentication')) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < this.config.maxRetries) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt - 1))
                    );
                }
            }
        }

        // All retries failed
        console.error(`API call failed after ${this.config.maxRetries} attempts:`, lastError);
        throw lastError;
    }

    /**
     * Format currency values
     */
    formatCurrency(amount, currency = 'EUR') {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Format dates
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('hu-HU', { ...defaultOptions, ...options }).format(new Date(date));
    }

    /**
     * Format relative time (e.g., "2 minutes ago")
     */
    formatRelativeTime(date) {
        const rtf = new Intl.RelativeTimeFormat('hu-HU', { numeric: 'auto' });
        const now = new Date();
        const targetDate = new Date(date);
        const diffInSeconds = Math.floor((targetDate - now) / 1000);

        if (Math.abs(diffInSeconds) < 60) {
            return rtf.format(diffInSeconds, 'second');
        } else if (Math.abs(diffInSeconds) < 3600) {
            return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
        } else if (Math.abs(diffInSeconds) < 86400) {
            return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
        } else {
            return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
        }
    }

    /**
     * Cleanup when dashboard is destroyed
     */
    destroy() {
        // Clear all intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Remove event listeners
        document.removeEventListener('click', this.handleNavigation);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        window.removeEventListener('resize', this.handleResize);

        // Cleanup apps
        Object.values(this.apps).forEach(app => {
            if (app.destroy) {
                app.destroy();
            }
        });

        console.log('✅ Dashboard cleaned up');
    }
}

// Make AdminDashboard available globally for debugging
window.AdminDashboard = AdminDashboard;