/**
 * Palace Cafe & Bar - Admin Dashboard Apps
 * Individual app components for the SPA dashboard
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

'use strict';

/**
 * Base App Class
 * All dashboard apps extend from this class
 */
class BaseApp {
    constructor(appName) {
        this.appName = appName;
        this.container = document.getElementById(`${appName}-app`);
        this.isLoaded = false;
        this.data = {};
        this.config = {
            apiUrl: 'https://palace-cafe-backend-production.up.railway.app/api/admin'
        };
    }

    /**
     * Load the app
     */
    async load() {
        if (!this.isLoaded) {
            await this.initialize();
            this.isLoaded = true;
        }
        this.show();
    }

    /**
     * Initialize the app (override in subclasses)
     */
    async initialize() {
        // Override in subclasses
    }

    /**
     * Show the app
     */
    show() {
        if (this.container) {
            this.container.classList.add('active');
        }
    }

    /**
     * Hide the app
     */
    hide() {
        if (this.container) {
            this.container.classList.remove('active');
        }
    }

    /**
     * Refresh app data
     */
    async refresh() {
        // Override in subclasses
    }

    /**
     * Cleanup when app is destroyed
     */
    destroy() {
        // Override in subclasses
    }

    /**
     * Make API call using the main dashboard's method
     */
    async apiCall(endpoint, options = {}) {
        if (window.adminDashboard) {
            console.log('🔍 Making API call to:', endpoint);
            console.log('🔍 Options:', options);
            
            const result = await window.adminDashboard.apiCall(endpoint, options);
            console.log('📦 API response:', result);
            
            return result;
        }
        throw new Error('Dashboard not available');
    }

    /**
     * Show notification using the main dashboard's method
     */
    showNotification(message, type = 'info') {
        if (window.adminDashboard) {
            window.adminDashboard.showNotification(message, type);
        }
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'EUR') {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Format date
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
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Dashboard Overview App
 * Main dashboard with stats and quick overview
 */
class DashboardOverview extends BaseApp {
    constructor() {
        super('dashboard');
        this.refreshInterval = null;
    }

    async initialize() {
        console.log('🏠 Initializing Dashboard Overview...');
        await this.loadDashboardData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadDashboardData() {
        try {
            // Load multiple data sources in parallel
            const [statsData, ordersData, systemStatus] = await Promise.all([
                this.loadStats(),
                this.loadRecentOrders(),
                this.loadSystemStatus()
            ]);

            this.updateStatsCards(statsData);
            this.updateRecentOrders(ordersData);
            this.updateSystemStatus(systemStatus);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadStats() {
        // Skip API call for now, return mock data
        return {
            todayOrders: 0,
            todayRevenue: 0,
            avgWaitTime: 0,
            activeCustomers: 0
        };
    }

    async loadRecentOrders() {
        return[];
    }

    async loadSystemStatus() {
        // Skip API call for now
        return {
            api: 'online',
            database: 'online',
            email: 'online',
            payment: 'online'
        };
    }

    updateStatsCards(stats) {
        // Update today's orders
        const todayOrdersEl = document.getElementById('todayOrders');
        if (todayOrdersEl) {
            todayOrdersEl.textContent = stats.todayOrders || '--';
        }

        // Update today's revenue
        const todayRevenueEl = document.getElementById('todayRevenue');
        if (todayRevenueEl) {
            todayRevenueEl.textContent = stats.todayRevenue ? 
                this.formatCurrency(stats.todayRevenue) : '--';
        }

        // Update average wait time
        const avgWaitTimeEl = document.getElementById('avgWaitTime');
        if (avgWaitTimeEl) {
            avgWaitTimeEl.textContent = stats.avgWaitTime ? 
                `${stats.avgWaitTime} perc` : '--';
        }

        // Update active customers
        const activeCustomersEl = document.getElementById('activeCustomers');
        if (activeCustomersEl) {
            activeCustomersEl.textContent = stats.activeCustomers || '--';
        }

        // Update orders badge in sidebar
        const ordersBadge = document.getElementById('ordersBadge');
        if (ordersBadge) {
            ordersBadge.textContent = stats.pendingOrders || '0';
        }
    }

    updateRecentOrders(orders) {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-inbox"></i>
                    Nincsenek legutóbbi rendelések
                </div>
            `;
            return;
        }

        const ordersHtml = orders.map(order => `
            <div class="order-item">
                <div class="order-info">
                    <h4>${this.escapeHtml(order.customerName)}</h4>
                    <p>${order.orderNumber} • ${this.formatCurrency(order.total)} • ${this.formatRelativeTime(order.createdAt)}</p>
                </div>
                <span class="order-status ${order.status}">
                    ${this.getStatusText(order.status)}
                </span>
            </div>
        `).join('');

        container.innerHTML = ordersHtml;
    }

    updateSystemStatus(status) {
        const statusItems = document.querySelectorAll('.status-item');
        
        const statusMap = {
            'API szerver': status.api,
            'Adatbázis': status.database,
            'Email szolgáltatás': status.email,
            'Fizetési rendszer': status.payment
        };

        statusItems.forEach(item => {
            const label = item.querySelector('span:first-of-type').textContent;
            const indicator = item.querySelector('.status-indicator');
            const statusText = item.querySelector('.status-text');
            
            if (statusMap[label]) {
                const currentStatus = statusMap[label];
                
                // Update indicator
                indicator.className = `status-indicator ${currentStatus}`;
                
                // Update status text
                const statusTexts = {
                    online: 'Online',
                    warning: 'Lassú',
                    offline: 'Offline'
                };
                
                if (statusText) {
                    statusText.textContent = statusTexts[currentStatus] || 'Ismeretlen';
                }
            }
        });
    }

    getStatusText(status) {
        const statusTexts = {
            pending: 'Függőben',
            confirmed: 'Megerősítve',
            preparing: 'Készítés',
            ready: 'Kész',
            delivered: 'Kiszállítva',
            cancelled: 'Törölve'
        };
        
        return statusTexts[status] || status;
    }

    formatRelativeTime(date) {
        const now = new Date();
        const targetDate = new Date(date);
        const diffInMinutes = Math.floor((now - targetDate) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Most';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} perce`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} órája`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} napja`;
        }
    }

    setupEventListeners() {
        // Add click handlers for stat cards to navigate to relevant sections
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const targets = ['orders', 'analytics', 'orders', 'analytics'];
                if (window.adminDashboard && targets[index]) {
                    window.adminDashboard.loadApp(targets[index]);
                }
            });
        });
    }

    startAutoRefresh() {
        // Refresh dashboard data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (this.container && this.container.classList.contains('active')) {
                this.refresh();
            }
        }, 30000);
    }

    async refresh() {
        await this.loadDashboardData();
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}


/**
 * Palace Cafe & Bar - Menu Management App
 * Complete menu and item management system
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

'use strict';

class MenuApp extends BaseApp {
    constructor() {
        super('menu');

        this.config = {
            apiUrl: 'https://palace-cafe-backend-production.up.railway.app/api/admin', 
            publicApiUrl: 'https://palace-cafe-backend-production.up.railway.app/api'   
        };
        
        // State management
        this.state = {
            currentSection: 'availability', // 'availability' or 'management'
            deliverableItems: [],
            allItems: [],
            categories: [],
            selectedItems: new Set(),
            searchQuery: '',
            filterCategory: 'all',
            filterAvailability: 'all',
            sortBy: 'id',
            sortOrder: 'asc',
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 0
        };

        // Modal listeners tracking
        this.modalEventListeners = [];
        
        // File input reference
        this.fileInputRef = null;
        
        // Image preview
        this.imagePreviewUrl = null;
    }

    async initialize() {
        console.log('🍽️ Initializing Menu Management App...');
        
        this.render();
        await this.loadInitialData();
        this.setupEventListeners();
        
        console.log('✅ Menu Management App initialized');
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <!-- Menu Management Header -->
            <div class="menu-management-header">
                <div class="menu-title">
                    <h2>🍽️ Menü kezelés</h2>
                    <p>Termékek elérhetőségének kezelése és menü szerkesztés</p>
                </div>
                
                <div class="menu-section-tabs">
                    <button class="tab-btn active" data-section="availability">
                        <i class="fas fa-toggle-on"></i>
                        Elérhetőség
                    </button>
                    <button class="tab-btn" data-section="management">
                        <i class="fas fa-edit"></i>
                        Menü szerkesztés
                    </button>
                </div>
            </div>

            <!-- Availability Management Section -->
            <div id="availability-section" class="menu-section active">
                <div class="section-header">
                    <h3>
                        <i class="fas fa-toggle-on"></i>
                        Termék elérhetőség kezelése
                    </h3>
                    <p>Gyorsan ki- és bekapcsolhatja a termékeket rendelésre</p>
                    
                    <div class="bulk-actions">
                        <button class="btn-success" id="enableAllBtn" disabled>
                            <i class="fas fa-check"></i>
                            Kijelöltek engedélyezése
                        </button>
                        <button class="btn-danger" id="disableAllBtn" disabled>
                            <i class="fas fa-times"></i>
                            Kijelöltek letiltása
                        </button>
                    </div>
                </div>

                <div class="deliverable-items-container" id="deliverableItemsContainer">
                    <div class="loading-placeholder">
                        <i class="fas fa-spinner fa-spin"></i>
                        Termékek betöltése...
                    </div>
                </div>
            </div>

            <!-- Menu Management Section -->
            <div id="management-section" class="menu-section">
                <div class="management-header">
                    <h3>
                        <i class="fas fa-edit"></i>
                        Teljes menü kezelése
                    </h3>
                    
                    <div class="management-controls">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" 
                                   id="menuSearch" 
                                   placeholder="Keresés név vagy leírás alapján...">
                        </div>
                        
                        <select id="categoryFilter" class="filter-select">
                            <option value="all">Minden kategória</option>
                        </select>
                        
                        <select id="availabilityFilter" class="filter-select">
                            <option value="all">Minden állapot</option>
                            <option value="available">Elérhető</option>
                            <option value="unavailable">Nem elérhető</option>
                        </select>
                        
                        <button class="btn-primary" id="addNewItemBtn">
                            <i class="fas fa-plus"></i>
                            Új termék
                        </button>
                        
                        <button class="btn-secondary" id="exportMenuBtn">
                            <i class="fas fa-download"></i>
                            Export
                        </button>
                    </div>
                </div>

                <div class="items-table-container">
                    <div class="table-controls">
                        <div class="items-count">
                            <span id="itemsCount">0 termék</span>
                        </div>
                        
                        <div class="sort-controls">
                            <select id="sortBy" class="sort-select">
                                <option value="id">ID szerint</option>
                                <option value="name">Név szerint</option>
                                <option value="price">Ár szerint</option>
                                <option value="category">Kategória szerint</option>
                                <option value="createdAt">Létrehozás dátuma</option>
                            </select>
                            
                            <button class="btn-sort" id="sortOrder" data-order="asc">
                                <i class="fas fa-sort-alpha-down"></i>
                            </button>
                        </div>
                    </div>

                    <div class="menu-items-table" id="menuItemsTable">
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                            Termékek betöltése...
                        </div>
                    </div>

                    <div class="pagination-container" id="paginationContainer">
                        <!-- Pagination will be rendered here -->
                    </div>
                </div>
            </div>

            <!-- Add/Edit Item Modal -->
            <div class="modal" id="itemModal">
                <div class="modal-backdrop"></div>
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3 id="itemModalTitle">Új termék hozzáadása</h3>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="itemForm" enctype="multipart/form-data">
                            <div class="form-grid">
                                <!-- Basic Information -->
                                <div class="form-section">
                                    <h4>Alapinformációk</h4>
                                    
                                    <div class="form-group">
                                        <label for="itemSlug">Slug (URL-barát név)*:</label>
                                        <input type="text" 
                                               id="itemSlug" 
                                               name="slug" 
                                               placeholder="pl: cheeseburger-deluxe"
                                               required>
                                        <small>Csak kisbetűk, számok és kötőjel</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="itemPrice">Ár (EUR)*:</label>
                                        <input type="number" 
                                               id="itemPrice" 
                                               name="price" 
                                               step="0.01" 
                                               min="0"
                                               placeholder="9.99"
                                               required>
                                    </div>

                                    <div class="form-group" id="priceAddonGroup" style="display: none;">
                                        <label for="itemPriceAddon">Kiegészítő ár (EUR):</label>
                                        <input type="number" 
                                               id="itemPriceAddon" 
                                               name="priceAddon" 
                                               step="0.01" 
                                               min="0"
                                               placeholder="2.50">
                                        <small>Ár különbözet amikor köretként választják</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="itemCategory">Kategória*:</label>
                                        <select id="itemCategory" name="categoryId" required>
                                            <option value="">Válasszon kategóriát</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="itemBadge">Jelvény:</label>
                                        <select id="itemBadge" name="badge">
                                            <option value="">Nincs jelvény</option>
                                            <option value="spicy">🌶️ Csípős</option>
                                            <option value="bestseller">⭐ Bestseller</option>
                                            <option value="new">🆕 Új</option>
                                            <option value="vegetarian">🥗 Vegetáriánus</option>
                                            <option value="vegan">🌱 Vegán</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Image Upload -->
                                <div class="form-section">
                                    <h4>Kép</h4>
                                    
                                    <div class="image-upload-section">
                                        <div class="image-preview" id="imagePreview">
                                            <div class="image-placeholder">
                                                <i class="fas fa-image"></i>
                                                <p>Kép feltöltése</p>
                                            </div>
                                        </div>
                                        
                                        <div class="image-upload-controls">
                                            <input type="file" 
                                                   id="itemImage" 
                                                   name="image" 
                                                   accept="image/jpeg,image/jpg,image/png,image/webp"
                                                   hidden>
                                            <button type="button" 
                                                    class="btn-secondary" 
                                                    id="uploadImageBtn">
                                                <i class="fas fa-upload"></i>
                                                Kép kiválasztása
                                            </button>
                                            <button type="button" 
                                                    class="btn-danger" 
                                                    id="removeImageBtn" 
                                                    style="display: none;">
                                                <i class="fas fa-trash"></i>
                                                Kép eltávolítása
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Settings -->
                                <div class="form-section">
                                    <h4>Beállítások</h4>
                                    
                                    <div class="form-group">
                                        <label for="spicyLevel">Csípősség szint:</label>
                                        <select id="spicyLevel" name="spicyLevel">
                                            <option value="0">Nem csípős</option>
                                            <option value="1">🌶️ Enyhe</option>
                                            <option value="2">🌶️🌶️ Közepes</option>
                                            <option value="3">🌶️🌶️🌶️ Csípős</option>
                                            <option value="4">🌶️🌶️🌶️🌶️ Nagyon csípős</option>
                                            <option value="5">🌶️🌶️🌶️🌶️🌶️ Pokoli</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="allergens">Allergének:</label>
                                        <div class="allergen-checkboxes" id="allergenCheckboxes">
                                            <!-- Allergen checkboxes will be populated here -->
                                        </div>
                                        <small>Válassza ki az érintett allergéneket</small>
                                    </div>
                                    
                                    <div class="form-checkboxes">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="includesSides" name="includesSides">
                                            <span class="checkbox-custom"></span>
                                            Köretet tartalmaz
                                        </label>
                                        
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="isPopular" name="isPopular">
                                            <span class="checkbox-custom"></span>
                                            Népszerű termék
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Translations Section -->
                            <div class="translations-section">
                                <h4>Többnyelvű tartalom</h4>
                                
                                <div class="translation-tabs">
                                    <button type="button" class="translation-tab active" data-lang="hu">
                                        Magyar
                                    </button>
                                    <button type="button" class="translation-tab" data-lang="en">
                                        English
                                    </button>
                                    <button type="button" class="translation-tab" data-lang="sk">
                                        Slovenčina
                                    </button>
                                </div>

                                <!-- Hungarian Translation -->
                                <div class="translation-content active" data-lang="hu">
                                    <div class="form-group">
                                        <label for="nameHu">Név (Magyar)*:</label>
                                        <input type="text" 
                                               id="nameHu" 
                                               name="nameHu" 
                                               placeholder="pl: Sajtburger Deluxe"
                                               required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="descriptionHu">Leírás (Magyar):</label>
                                        <textarea id="descriptionHu" 
                                                  name="descriptionHu" 
                                                  rows="3"
                                                  placeholder="Részletes termékleírás..."></textarea>
                                    </div>
                                </div>

                                <!-- English Translation -->
                                <div class="translation-content" data-lang="en">
                                    <div class="form-group">
                                        <label for="nameEn">Name (English):</label>
                                        <input type="text" 
                                               id="nameEn" 
                                               name="nameEn" 
                                               placeholder="e.g: Deluxe Cheeseburger">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="descriptionEn">Description (English):</label>
                                        <textarea id="descriptionEn" 
                                                  name="descriptionEn" 
                                                  rows="3"
                                                  placeholder="Detailed product description..."></textarea>
                                    </div>
                                </div>

                                <!-- Slovak Translation -->
                                <div class="translation-content" data-lang="sk">
                                    <div class="form-group">
                                        <label for="nameSk">Názov (Slovak):</label>
                                        <input type="text" 
                                               id="nameSk" 
                                               name="nameSk" 
                                               placeholder="napr: Deluxe cheeseburger">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="descriptionSk">Popis (Slovak):</label>
                                        <textarea id="descriptionSk" 
                                                  name="descriptionSk" 
                                                  rows="3"
                                                  placeholder="Podrobný popis produktu..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn-secondary" id="cancelItemBtn">
                                    Mégse
                                </button>
                                <button type="submit" class="btn-primary" id="saveItemBtn">
                                    <i class="fas fa-save"></i>
                                    Mentés
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div class="modal" id="deleteConfirmModal">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Termék törlése</h3>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="confirmation-dialog">
                            <div class="confirmation-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="confirmation-content">
                                <h4>Biztosan törölni szeretné ezt a terméket?</h4>
                                <p id="deleteItemName">Termék neve</p>
                                <div class="warning-message">
                                    <i class="fas fa-warning"></i>
                                    Ez a művelet nem visszavonható!
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" id="cancelDeleteBtn">
                            Mégse
                        </button>
                        <button class="btn-danger" id="confirmDeleteBtn">
                            <i class="fas fa-trash"></i>
                            Törlés
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loading Overlay -->
            <div class="loading-overlay" id="menuLoading" style="display: none;">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Feldolgozás...</p>
                </div>
            </div>
        `;

        // Set initial section
        this.showSection(this.state.currentSection);
    }

    async loadInitialData() {
        try {
            this.showLoading();
            
            // Load both datasets in parallel
            await Promise.all([
                this.loadDeliverableItems(),
                this.loadCategories(),
                this.loadAllItems(),
                this.loadAllergenData()
            ]);
            
            this.renderCurrentSection();
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Nem sikerült betölteni az adatokat', 'error');
            this.hideLoading();
        }
    }

    async loadDeliverableItems() {
        try {
            console.log('🔍 Loading deliverable items...');

            // Add authentication token
            const token = localStorage.getItem('adminToken');
            console.log('🔑 Auth token available:', !!token);

            const response = await fetch(`${this.config.apiUrl}/menu/deliverable-items`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Raw deliverable items response:', result);

            this.state.deliverableItems = result.data || {};
            console.log('✅ Deliverable items loaded:', Object.keys(this.state.deliverableItems));

        } catch (error) {
            console.error('❌ Failed to load deliverable items:', error);
            this.state.deliverableItems = {};
        }
    }

    async loadCategories() {
        try {
            const response = await this.apiCall('/menu/categories');
            this.state.categories = response.data || [];
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.state.categories = [];
        }
    }

    async loadAllergenData() {
        try {
            const response = await fetch(`${this.config.publicApiUrl}/allergens?lang=hu`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('🏷️ Allergen data loaded:', result);

            if (result.success) {
                this.allergenData = result.data || [];
            } else {
                throw new Error(result.error || 'Failed to load allergen data');
            }

        } catch (error) {
            console.error('❌ Failed to load allergen data:', error);
            this.allergenData = [];
        }
    }

    renderAllergenCheckboxes() {
        const container = document.getElementById('allergenCheckboxes');
        if (!container || !this.allergenData) return;

        if (this.allergenData.length === 0) {
            container.innerHTML = '<p class="no-allergens">Nincsenek elérhető allergének</p>';
            return;
        }

        container.innerHTML = this.allergenData.map(allergen => `
            <label class="checkbox-label allergen-checkbox">
                <input type="checkbox" 
                       name="allergen" 
                       value="${allergen.code}" 
                       data-allergen-id="${allergen.id}">
                <span class="checkbox-custom"></span>
                <span class="allergen-info">
                    <span class="allergen-code">${allergen.code}</span>
                    <span class="allergen-name">${this.escapeHtml(allergen.name)}</span>
                </span>
            </label>
        `).join('');
    }

    async loadAllItems() {
        try {
            console.log('🔍 Loading all menu items...');

            const params = new URLSearchParams({
                page: this.state.currentPage,
                limit: this.state.itemsPerPage,
                search: this.state.searchQuery,
                categoryId: this.state.filterCategory,
                availability: this.state.filterAvailability,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder
            });

            const token = localStorage.getItem('adminToken');
            console.log('🔑 Auth token available:', !!token);

            const response = await fetch(`${this.config.apiUrl}/menu/items?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication required. Please login again.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Raw items response:', result);

            if (result.success) {
                this.state.allItems = result.data.items || [];
                this.state.totalItems = result.data.pagination?.total || 0;
                console.log('✅ Menu items loaded:', this.state.allItems.length);
            } else {
                throw new Error(result.error || 'API returned unsuccessful response');
            }

        } catch (error) {
            console.error('❌ Failed to load all items:', error);
            this.showNotification(error.message || 'Failed to load menu items', 'error');
            this.state.allItems = [];
            this.state.totalItems = 0;
        }
    }

    setupEventListeners() {
        // Section tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });

        // Availability section listeners
        this.setupAvailabilityListeners();
        
        // Management section listeners
        this.setupManagementListeners();
    }

    setupAvailabilityListeners() {
        // Bulk actions
        const enableAllBtn = document.getElementById('enableAllBtn');
        const disableAllBtn = document.getElementById('disableAllBtn');

        if (enableAllBtn) {
            enableAllBtn.addEventListener('click', () => {
                this.bulkToggleAvailability(true);
            });
        }

        if (disableAllBtn) {
            disableAllBtn.addEventListener('click', () => {
                this.bulkToggleAvailability(false);
            });
        }
    }

    setupManagementListeners() {
        // Search
        const searchInput = document.getElementById('menuSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.state.searchQuery = e.target.value;
                this.state.currentPage = 1;
                this.loadAllItems().then(() => this.renderItemsTable());
            }, 500));
        }

        // Filters
        const categoryFilter = document.getElementById('categoryFilter');
        const availabilityFilter = document.getElementById('availabilityFilter');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.state.filterCategory = e.target.value;
                this.state.currentPage = 1;
                this.loadAllItems().then(() => this.renderItemsTable());
            });
        }

        if (availabilityFilter) {
            availabilityFilter.addEventListener('change', (e) => {
                this.state.filterAvailability = e.target.value;
                this.state.currentPage = 1;
                this.loadAllItems().then(() => this.renderItemsTable());
            });
        }

        // Sort controls
        const sortBy = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.state.sortBy = e.target.value;
                this.loadAllItems().then(() => this.renderItemsTable());
            });
        }

        if (sortOrder) {
            sortOrder.addEventListener('click', (e) => {
                const currentOrder = e.target.dataset.order;
                const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
                
                e.target.dataset.order = newOrder;
                e.target.innerHTML = newOrder === 'asc' ? 
                    '<i class="fas fa-sort-alpha-down"></i>' : 
                    '<i class="fas fa-sort-alpha-up"></i>';
                
                this.state.sortOrder = newOrder;
                this.loadAllItems().then(() => this.renderItemsTable());
            });
        }

        // Action buttons
        const addNewItemBtn = document.getElementById('addNewItemBtn');
        const exportMenuBtn = document.getElementById('exportMenuBtn');

        if (addNewItemBtn) {
            addNewItemBtn.addEventListener('click', () => {
                this.openItemModal();
            });
        }

        if (exportMenuBtn) {
            exportMenuBtn.addEventListener('click', () => {
                this.exportMenu();
            });
        }
    }

    switchSection(section) {
        // Update state
        this.state.currentSection = section;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });

        // Show section
        this.showSection(section);
        this.renderCurrentSection();
    }

    showSection(section) {
        document.querySelectorAll('.menu-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}-section`);
        });
    }

    renderCurrentSection() {
        if (this.state.currentSection === 'availability') {
            this.renderDeliverableItems();
        } else {
            this.renderItemsTable();
            this.renderCategoryFilter();
        }
    }

    renderDeliverableItems() {
        const container = document.getElementById('deliverableItemsContainer');
        if (!container) return;

        const deliverableItems = this.state.deliverableItems;
        
        if (!deliverableItems || Object.keys(deliverableItems).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h3>Nincsenek rendelhető termékek</h3>
                    <p>Jelenleg nincsenek olyan kategóriák, amelyekből rendelni lehet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = Object.entries(deliverableItems).map(([categoryName, categoryData]) => `
            <div class="category-section">
                <h4 class="category-title">
                    <i class="fas fa-utensils"></i>
                    ${this.escapeHtml(categoryName)}
                    <span class="item-count">${categoryData.items.length} termék</span>
                </h4>
                
                <div class="category-actions">
                    <label class="checkbox-label category-checkbox">
                        <input type="checkbox" class="category-select-all" data-category="${categoryData.categoryId}">
                        <span class="checkbox-custom"></span>
                        Összes kijelölése
                    </label>
                </div>
                
                <div class="items-grid">
                    ${categoryData.items.map(item => `
                        <div class="availability-item ${item.isAvailable ? 'available' : 'unavailable'}" 
                             data-item-id="${item.id}">
                            <label class="checkbox-label">
                                <input type="checkbox" class="item-checkbox" value="${item.id}">
                                <span class="checkbox-custom"></span>
                            </label>
                            
                            <div class="item-image">
                                ${item.imageUrl ? 
                                    `<img src="${item.imageUrl}" alt="${this.escapeHtml(item.name)}">` :
                                    '<div class="image-placeholder"><i class="fas fa-image"></i></div>'
                                }
                            </div>
                            
                            <div class="item-info">
                                <h5>${this.escapeHtml(item.name)}</h5>
                                <p class="item-price">${this.formatCurrency(item.price)}</p>
                            </div>
                            
                            <div class="availability-toggle">
                                <label class="toggle-switch">
                                    <input type="checkbox" 
                                           ${item.isAvailable ? 'checked' : ''} 
                                           data-item-id="${item.id}">
                                    <span class="toggle-slider"></span>
                                </label>
                                <span class="toggle-label">
                                    ${item.isAvailable ? 'Elérhető' : 'Letiltva'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Setup individual toggle listeners
        container.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const itemId = parseInt(e.target.dataset.itemId);
                const isAvailable = e.target.checked;
                this.toggleItemAvailability(itemId, isAvailable);
            });
        });

        // Setup checkbox listeners
        this.setupCheckboxListeners(container);
    }

    setupCheckboxListeners(container) {
        // Individual item checkboxes
        container.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.state.selectedItems.add(itemId);
                } else {
                    this.state.selectedItems.delete(itemId);
                }
                this.updateBulkActionButtons();
            });
        });

        // Category select all checkboxes
        container.querySelectorAll('.category-select-all').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const categoryId = parseInt(e.target.dataset.category);
                const isChecked = e.target.checked;
                
                // Find all items in this category
                const categorySection = e.target.closest('.category-section');
                const itemCheckboxes = categorySection.querySelectorAll('.item-checkbox');
                
                itemCheckboxes.forEach(itemCheckbox => {
                    itemCheckbox.checked = isChecked;
                    const itemId = parseInt(itemCheckbox.value);
                    
                    if (isChecked) {
                        this.state.selectedItems.add(itemId);
                    } else {
                        this.state.selectedItems.delete(itemId);
                    }
                });
                
                this.updateBulkActionButtons();
            });
        });
    }

    updateBulkActionButtons() {
        const enableBtn = document.getElementById('enableAllBtn');
        const disableBtn = document.getElementById('disableAllBtn');
        const hasSelection = this.state.selectedItems.size > 0;

        if (enableBtn) enableBtn.disabled = !hasSelection;
        if (disableBtn) disableBtn.disabled = !hasSelection;
    }

    async toggleItemAvailability(itemId, isAvailable) {
        try {
            const response = await this.apiCall(`/menu/items/${itemId}/availability`, {
                method: 'PATCH',
                body: JSON.stringify({ isAvailable })
            });

            if (response.success) {
                // Update local state
                Object.values(this.state.deliverableItems).forEach(category => {
                    const item = category.items.find(item => item.id === itemId);
                    if (item) {
                        item.isAvailable = isAvailable;
                    }
                });

                // Update UI element
                const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
                if (itemElement) {
                    itemElement.classList.toggle('available', isAvailable);
                    itemElement.classList.toggle('unavailable', !isAvailable);
                    
                    const labelSpan = itemElement.querySelector('.toggle-label');
                    if (labelSpan) {
                        labelSpan.textContent = isAvailable ? 'Elérhető' : 'Letiltva';
                    }
                }

                this.showNotification(
                    `${response.data.name} ${isAvailable ? 'engedélyezve' : 'letiltva'}`, 
                    'success'
                );
                
            } else {
                throw new Error(response.error || 'Ismeretlen hiba');
            }

        } catch (error) {
            console.error('Failed to toggle availability:', error);
            this.showNotification('Hiba az elérhetőség módosításakor', 'error');
            
            // Revert toggle state
            const toggle = document.querySelector(`[data-item-id="${itemId}"] .toggle-switch input`);
            if (toggle) {
                toggle.checked = !isAvailable;
            }
        }
    }
    
    async restoreItem(itemId) {
        if (!confirm('Biztosan visszaállítja ezt a terméket?')) {
            return;
        }
    
        try {
            this.showLoading();
        
            const response = await this.apiCall(`/menu/items/${itemId}/restore`, {
                method: 'PATCH'
            });
        
            if (response.success) {
                this.showNotification('Termék sikeresen visszaállítva', 'success');
                
                // Reload data
                await this.loadAllItems();
                if (this.state.currentSection === 'availability') {
                    await this.loadDeliverableItems();
                }
                this.renderCurrentSection();
            
            } else {
                throw new Error(response.error || 'Visszaállítás sikertelen');
            }
        
        } catch (error) {
            console.error('Failed to restore item:', error);
            this.showNotification(error.message || 'Hiba a termék visszaállításakor', 'error');
        } finally {
            this.hideLoading();
        }
    } 

    async bulkToggleAvailability(isAvailable) {
        const itemIds = Array.from(this.state.selectedItems);
        
        if (itemIds.length === 0) return;

        try {
            this.showLoading();

            const response = await this.apiCall('/menu/items/bulk-availability', {
                method: 'PATCH',
                body: JSON.stringify({ itemIds, isAvailable })
            });

            if (response.success) {
                // Update local state
                Object.values(this.state.deliverableItems).forEach(category => {
                    category.items.forEach(item => {
                        if (itemIds.includes(item.id)) {
                            item.isAvailable = isAvailable;
                        }
                    });
                });

                // Re-render section
                this.renderDeliverableItems();

                // Clear selection
                this.state.selectedItems.clear();

                this.showNotification(
                    `${response.data.updatedCount} termék ${isAvailable ? 'engedélyezve' : 'letiltva'}`,
                    'success'
                );

            } else {
                throw new Error(response.error || 'Bulk update failed');
            }

        } catch (error) {
            console.error('Failed to bulk toggle availability:', error);
            this.showNotification('Hiba a tömeges módosításkor', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        // Keep current selection
        const currentValue = categoryFilter.value;

        categoryFilter.innerHTML = `
            <option value="all">Minden kategória</option>
            ${this.state.categories.map(category => `
                <option value="${category.id}">
                    ${category.translations.hu?.name || 'Névtelen kategória'} (${category.itemCount})
                </option>
            `).join('')}
        `;

        // Restore selection
        categoryFilter.value = currentValue;
    }

    renderItemsTable() {
        const container = document.getElementById('menuItemsTable');
        const countContainer = document.getElementById('itemsCount');

        if (!container) return;

        // Update count
        if (countContainer) {
            countContainer.textContent = `${this.state.totalItems} termék`;
        }

        if (this.state.allItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Nincsenek találatok</h3>
                    <p>Próbálja meg módosítani a szűrési feltételeket.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="items-table-wrapper">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Kép</th>
                            <th>Név</th>
                            <th>Kategória</th>
                            <th>Ár</th>
                            <th>Állapot</th>
                            <th>Népszerű</th>
                            <th>Művelet</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.allItems.map(item => `
                            <tr class="item-row ${item.isAvailable ? 'available' : 'unavailable'} ${item.isDeleted ? 'deleted' : ''}">
                                <td>
                                    <div class="item-image-small">
                                        ${item.imageUrl ? 
                                            `<img src="${item.imageUrl}" alt="${this.escapeHtml(item.translations.hu?.name || 'Termék')}">` :
                                            '<div class="image-placeholder"><i class="fas fa-image"></i></div>'
                                        }
                                    </div>
                                </td>
                                <td>
                                    <div class="item-name-cell">
                                        <h5>${this.escapeHtml(item.translations.hu?.name || 'Névtelen termék')}</h5>
                                        <p class="item-slug">${this.escapeHtml(item.slug)}</p>
                                        ${item.badge ? `<span class="item-badge badge-${item.badge}">${this.getBadgeText(item.badge)}</span>` : ''}
                                        ${item.isDeleted ? '<span class="deleted-badge">Törölve</span>' : ''}
                                    </div>
                                </td>
                                <td>
                                    <span class="category-name">${this.escapeHtml(item.category.name)}</span>
                                </td>
                                <td>
                                    <span class="item-price">${this.formatCurrency(item.price)}</span>
                                </td>
                                <td>
                                    <span class="availability-status ${item.isDeleted ? 'deleted' : (item.isAvailable ? 'available' : 'unavailable')}">
                                        <i class="fas fa-${item.isDeleted ? 'trash' : (item.isAvailable ? 'check-circle' : 'times-circle')}"></i>
                                        ${item.isDeleted ? 'Törölve' : (item.isAvailable ? 'Elérhető' : 'Letiltva')}
                                    </span>
                                </td>
                                <td>
                                    <span class="popular-status">
                                        <i class="fas fa-${item.isPopular ? 'star' : 'star-o'}"></i>
                                        ${item.isPopular ? 'Igen' : 'Nem'}
                                    </span>
                                </td>
                                <td>
                                    <div class="item-actions">
                                        ${item.isDeleted ? `
                                            <!-- Deleted item - only show restore -->
                                            <button class="btn-restore" 
                                                    data-item-id="${item.id}"
                                                    title="Visszaállítás">
                                                <i class="fas fa-undo"></i>
                                            </button>
                                            <span class="deleted-info" title="Törölve: ${item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('hu-HU') : 'Ismeretlen'}">
                                                <i class="fas fa-info-circle"></i>
                                            </span>
                                        ` : `
                                            <!-- Active item - show edit, toggle, delete -->
                                            <button class="btn-edit" 
                                                    data-item-id="${item.id}"
                                                    title="Szerkesztés">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-toggle ${item.isAvailable ? 'btn-disable' : 'btn-enable'}" 
                                                    data-item-id="${item.id}"
                                                    title="${item.isAvailable ? 'Letiltás' : 'Engedélyezés'}">
                                                <i class="fas fa-${item.isAvailable ? 'eye-slash' : 'eye'}"></i>
                                            </button>
                                            <button class="btn-delete" 
                                                    data-item-id="${item.id}"
                                                    title="Törlés">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        `}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Setup action button listeners
        container.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.closest('button').dataset.itemId);
                this.editItem(itemId);
            });
        });

        container.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.closest('button').dataset.itemId);
                const item = this.state.allItems.find(item => item.id === itemId);
                if (item && !item.isDeleted) {
                    this.toggleItemAvailability(itemId, !item.isAvailable);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.closest('button').dataset.itemId);
                this.deleteItem(itemId);
            });
        });

        // Setup restore button listeners for deleted items
        container.querySelectorAll('.btn-restore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.closest('button').dataset.itemId);
                this.restoreItem(itemId);
            });
        });

        console.log('Items with deletion status:', this.state.allItems.map(item => ({
            id: item.id,
            name: item.translations.hu?.name,
            isDeleted: item.isDeleted,
            isAvailable: item.isAvailable
        })));

        // Render pagination
        this.renderPagination();
    }

    renderPagination() {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        const totalPages = Math.ceil(this.state.totalItems / this.state.itemsPerPage);
        const currentPage = this.state.currentPage;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';

        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">Előző</button>`;
        }

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
            paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">Következő</button>`;
        }

        paginationHTML += '</div>';

        container.innerHTML = paginationHTML;

        // Add click listeners
        container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                this.state.currentPage = page;
                this.loadAllItems().then(() => this.renderItemsTable());
            });
        });
    }

    getBadgeText(badge) {
        const badges = {
            spicy: '🌶️ Csípős',
            bestseller: '⭐ Bestseller',
            new: '🆕 Új',
            vegetarian: '🥗 Vegetáriánus',
            vegan: '🌱 Vegán'
        };
        return badges[badge] || badge;
    }

    openItemModal(itemId = null) {
        const modal = document.getElementById('itemModal');
        const modalTitle = document.getElementById('itemModalTitle');
        
        // Reset form
        const form = document.getElementById('itemForm');
        form.reset();
        this.clearImagePreview();
        
        if (itemId) {
            // Edit mode
            modalTitle.textContent = 'Termék szerkesztése';
            this.renderAllergenCheckboxes();
            this.loadItemForEdit(itemId);            
        } else {
            // Create mode
            modalTitle.textContent = 'Új termék hozzáadása';
            this.populateCategoryOptions();
            this.renderAllergenCheckboxes();
        }

        modal.classList.add('active');
        this.setupModalListeners(modal);
    }

    async loadItemForEdit(itemId) {
        try {
            this.showLoading();
            
            const response = await this.apiCall(`/menu/items/${itemId}`);
            
            if (response.success) {
                const item = response.data;
                
                // Populate form fields
                document.getElementById('itemSlug').value = item.slug || '';
                document.getElementById('itemPrice').value = item.price || '';
                document.getElementById('itemPriceAddon').value = item.priceAddon || '';
                document.getElementById('itemBadge').value = item.badge || '';
                document.getElementById('spicyLevel').value = item.spicyLevel || '0';
                
                if (Array.isArray(item.allergens)) {
                    item.allergens.forEach(allergenCode => {
                        const checkbox = document.querySelector(`input[name="allergen"][value="${allergenCode}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                }

                document.getElementById('includesSides').checked = item.includesSides || false;
                document.getElementById('isPopular').checked = item.isPopular || false;

                // Set image if exists
                if (item.imageUrl) {
                    this.setImagePreview(item.imageUrl);
                }

                // Populate translations
                Object.keys(item.translations).forEach(lang => {
                    const translation = item.translations[lang];
                    const nameField = document.getElementById(`name${lang.charAt(0).toUpperCase() + lang.slice(1)}`);
                    const descField = document.getElementById(`description${lang.charAt(0).toUpperCase() + lang.slice(1)}`);
                    
                    if (nameField) nameField.value = translation.name || '';
                    if (descField) descField.value = translation.description || '';
                });

                // Populate categories and set selection
                await this.populateCategoryOptions();
                document.getElementById('itemCategory').value = item.category.id;

                const categorySelect = document.getElementById('itemCategory');
                if (categorySelect) {
                    // Create and dispatch a change event to trigger the handler
                    const changeEvent = new Event('change', { bubbles: true });
                    categorySelect.dispatchEvent(changeEvent);
                }                

                // Store item ID for update
                document.getElementById('itemForm').dataset.itemId = itemId;
            }
            
        } catch (error) {
            console.error('Failed to load item for edit:', error);
            this.showNotification('Nem sikerült betölteni a termék adatait', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async populateCategoryOptions() {
        const categorySelect = document.getElementById('itemCategory');
        if (!categorySelect) return;

        categorySelect.innerHTML = '<option value="">Válasszon kategóriát</option>';
        
        this.state.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.setAttribute('data-slug', category.slug);
            option.textContent = category.translations.hu?.name || 'Névtelen kategória';
            categorySelect.appendChild(option);
        });
    }

    handleCategoryChange(e) {
        const categoryId = parseInt(e.target.value);
        const priceAddonGroup = document.getElementById('priceAddonGroup');

        if (!categoryId || !priceAddonGroup) return;

        // Get selected option to check slug
        const selectedOption = e.target.options[e.target.selectedIndex];
        const categorySlug = selectedOption.getAttribute('data-slug');

        if (categorySlug === 'sides') {
            // Show price addon field for sides
            priceAddonGroup.style.display = 'block';
            document.getElementById('itemPriceAddon').required = true;

            // Only set focus if creating new item (not editing)
            const form = document.getElementById('itemForm');
            const isEditing = form && form.dataset.itemId;

            if (!isEditing) {
                setTimeout(() => {
                    const priceAddonInput = document.getElementById('itemPriceAddon');
                    if (priceAddonInput) {
                        priceAddonInput.focus();
                    }
                }, 100);
            }
        } else {
            // Hide price addon field for other categories
            priceAddonGroup.style.display = 'none';
            document.getElementById('itemPriceAddon').required = false;

            // Only clear value if not editing (preserve existing values when editing)
            const form = document.getElementById('itemForm');
            const isEditing = form && form.dataset.itemId;

            if (!isEditing) {
                document.getElementById('itemPriceAddon').value = '';
            }
        }
    }    

    setupModalListeners(modal) {
        // Clean up previous listeners
        this.cleanupModalListeners();

        const backdrop = modal.querySelector('.modal-backdrop');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelItemBtn');
        const form = document.getElementById('itemForm');

        // Close handlers
        const closeHandler = () => this.closeModal();
        
        backdrop.addEventListener('click', closeHandler);
        closeBtn.addEventListener('click', closeHandler);
        cancelBtn.addEventListener('click', closeHandler);

        // Form submission
        const formHandler = (e) => this.handleItemFormSubmit(e);
        form.addEventListener('submit', formHandler);

        // Translation tabs
        const tabHandler = (e) => this.switchTranslationTab(e.target.dataset.lang);
        document.querySelectorAll('.translation-tab').forEach(tab => {
            tab.addEventListener('click', tabHandler);
            this.modalEventListeners.push({ element: tab, event: 'click', handler: tabHandler });
        });

        // Image upload
        const uploadBtn = document.getElementById('uploadImageBtn');
        const removeBtn = document.getElementById('removeImageBtn');
        const fileInput = document.getElementById('itemImage');

        const uploadHandler = () => fileInput.click();
        const removeHandler = () => this.clearImagePreview();
        const fileHandler = (e) => this.handleImageUpload(e);

        uploadBtn.addEventListener('click', uploadHandler);
        removeBtn.addEventListener('click', removeHandler);
        fileInput.addEventListener('change', fileHandler);

        const categorySelect = document.getElementById('itemCategory');
        const categoryHandler = (e) => this.handleCategoryChange(e);
        categorySelect.addEventListener('change', categoryHandler);        

        // Track all listeners for cleanup
        this.modalEventListeners.push(
            { element: backdrop, event: 'click', handler: closeHandler },
            { element: closeBtn, event: 'click', handler: closeHandler },
            { element: cancelBtn, event: 'click', handler: closeHandler },
            { element: form, event: 'submit', handler: formHandler },
            { element: uploadBtn, event: 'click', handler: uploadHandler },
            { element: removeBtn, event: 'click', handler: removeHandler },
            { element: fileInput, event: 'change', handler: fileHandler }
        );
    }

    cleanupModalListeners() {
        this.modalEventListeners.forEach(({ element, event, handler }) => {
            if (element) {
                element.removeEventListener(event, handler);
            }
        });
        this.modalEventListeners = [];
    }

    switchTranslationTab(lang) {
        // Update tab buttons
        document.querySelectorAll('.translation-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.lang === lang);
        });

        // Update content sections
        document.querySelectorAll('.translation-content').forEach(content => {
            content.classList.toggle('active', content.dataset.lang === lang);
        });
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
            this.showNotification('Csak JPEG, PNG vagy WebP képek engedélyezettek', 'error');
            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            this.showNotification('A kép mérete maximum 5MB lehet', 'error');
            e.target.value = '';
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    setImagePreview(url) {
        const preview = document.getElementById('imagePreview');
        const removeBtn = document.getElementById('removeImageBtn');

        if (preview) {
            preview.innerHTML = `<img src="${url}" alt="Preview">`;
            removeBtn.style.display = 'inline-block';
        }

        this.imagePreviewUrl = url;
    }

    clearImagePreview() {
        const preview = document.getElementById('imagePreview');
        const removeBtn = document.getElementById('removeImageBtn');
        const fileInput = document.getElementById('itemImage');

        if (preview) {
            preview.innerHTML = `
                <div class="image-placeholder">
                    <i class="fas fa-image"></i>
                    <p>Kép feltöltése</p>
                </div>
            `;
        }

        if (removeBtn) removeBtn.style.display = 'none';
        if (fileInput) fileInput.value = '';
        
        this.imagePreviewUrl = null;
    }

    async handleItemFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const itemId = form.dataset.itemId;
        const isEdit = !!itemId;

        try {
            this.showLoading();

            // Create FormData for file upload
            const formData = new FormData(form);

            // Convert checkbox values
            formData.set('includesSides', form.includesSides.checked);
            formData.set('isPopular', form.isPopular.checked);

            const selectedAllergens = Array.from(document.querySelectorAll('input[name="allergen"]:checked'))
                .map(checkbox => checkbox.value);
            formData.set('allergens', selectedAllergens.join(','));            

            const endpoint = isEdit ? `/menu/items/${itemId}` : '/menu/items';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(
                    `Termék ${isEdit ? 'frissítve' : 'létrehozva'}`, 
                    'success'
                );
                
                this.closeModal();
                
                // Reload data
                await this.loadAllItems();
                if (this.state.currentSection === 'availability') {
                    await this.loadDeliverableItems();
                }
                this.renderCurrentSection();

            } else {
                throw new Error(data.error || 'Ismeretlen hiba');
            }

        } catch (error) {
            console.error('Failed to save item:', error);
            this.showNotification(
                error.message || `Hiba a termék ${isEdit ? 'frissítésénél' : 'létrehozásánál'}`,
                'error'
            );
        } finally {
            this.hideLoading();
        }
    }

    editItem(itemId) {
        this.openItemModal(itemId);
    }

    deleteItem(itemId) {
        const item = this.state.allItems.find(item => item.id === itemId);
        if (!item) return;

        const modal = document.getElementById('deleteConfirmModal');
        const itemNameEl = document.getElementById('deleteItemName');
        
        if (itemNameEl) {
            itemNameEl.textContent = item.translations.hu?.name || 'Névtelen termék';
        }

        modal.classList.add('active');

        // Setup delete confirmation listeners
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const cancelBtn = document.getElementById('cancelDeleteBtn');
        const backdrop = modal.querySelector('.modal-backdrop');
        const closeBtn = modal.querySelector('.modal-close');

        const closeHandler = () => {
            modal.classList.remove('active');
            this.cleanupDeleteListeners();
        };

        const confirmHandler = async () => {
            await this.confirmDelete(itemId);
            closeHandler();
        };

        // Add listeners
        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', closeHandler);
        backdrop.addEventListener('click', closeHandler);
        closeBtn.addEventListener('click', closeHandler);

        // Store listeners for cleanup
        this.deleteListeners = [
            { element: confirmBtn, event: 'click', handler: confirmHandler },
            { element: cancelBtn, event: 'click', handler: closeHandler },
            { element: backdrop, event: 'click', handler: closeHandler },
            { element: closeBtn, event: 'click', handler: closeHandler }
        ];
    }

    cleanupDeleteListeners() {
        if (this.deleteListeners) {
            this.deleteListeners.forEach(({ element, event, handler }) => {
                if (element) {
                    element.removeEventListener(event, handler);
                }
            });
            this.deleteListeners = [];
        }
    }

    async confirmDelete(itemId) {
        try {
            this.showLoading();

            const response = await this.apiCall(`/menu/items/${itemId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showNotification('Termék sikeresen törölve', 'success');
                
                // Reload data
                await this.loadAllItems();
                if (this.state.currentSection === 'availability') {
                    await this.loadDeliverableItems();
                }
                this.renderCurrentSection();

            } else {
                throw new Error(response.error || 'Törlés sikertelen');
            }

        } catch (error) {
            console.error('Failed to delete item:', error);
            this.showNotification(error.message || 'Hiba a termék törlésekor', 'error');
        } finally {
            this.hideLoading();
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        this.cleanupModalListeners();
        this.clearImagePreview();
        
        // Clear form data
        const form = document.getElementById('itemForm');
        if (form) {
            form.reset();
            delete form.dataset.itemId;
        }

        document.querySelectorAll('input[name="allergen"]').forEach(checkbox => {
            checkbox.checked = false;
        });        

        const priceAddonGroup = document.getElementById('PriceAddonGroup');
        if (priceAddonGroup) {
            priceAddonGroup.style.display = 'none';
        }
    }

    async exportMenu() {
        try {
            this.showNotification('Menü exportálása...', 'info');

            const response = await fetch(`${this.config.apiUrl}/menu/export`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `menu-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                this.showNotification('Menü sikeresen exportálva', 'success');
            } else {
                throw new Error('Export failed');
            }

        } catch (error) {
            console.error('Failed to export menu:', error);
            this.showNotification('Hiba az exportálás során', 'error');
        }
    }

    showLoading() {
        const loading = document.getElementById('menuLoading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('menuLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // Utility methods
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

    async refresh() {
        await this.loadInitialData();
    }

    destroy() {
        this.cleanupModalListeners();
        this.cleanupDeleteListeners();
        super.destroy();
    }
}

// Make globally available
window.MenuApp = MenuApp;

/**
 * Palace Cafe & Bar - Invoices Management App
 * Complete invoice administration system
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

'use strict';

class InvoicesApp extends BaseApp {
    constructor() {
        super('invoices');

        this.config = {
            apiUrl: 'https://palace-cafe-backend-production.up.railway.app/api/admin',
            itemsPerPage: 20
        };
        
        // State management
        this.state = {
            currentSection: 'overview', // 'overview', 'management', 'reports'
            invoices: [],
            totalInvoices: 0,
            currentPage: 1,
            searchQuery: '',
            filters: {
                dateRange: 'month',
                paymentMethod: 'all',
                orderType: 'all',
                invoiceType: 'all',
                startDate: null,
                endDate: null
            },
            sortBy: 'createdAt',
            sortOrder: 'desc',
            selectedInvoices: new Set(),
            overview: {
                todayInvoices: 0,
                monthlyInvoices: 0,
                todayRevenue: 0,
                monthlyRevenue: 0,
                paymentBreakdown: {}
            }
        };

        // Modal listeners tracking
        this.modalEventListeners = [];
    }

    async initialize() {
        console.log('📄 Initializing Invoices Management App...');
        
        this.render();
        await this.loadInitialData();
        this.setupEventListeners();
        
        console.log('✅ Invoices Management App initialized');
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <!-- Invoices Management Header -->
            <div class="invoices-management-header">
                <div class="invoices-title">
                    <h2>📄 Számlák kezelése</h2>
                    <p>Számlák áttekintése, keresése és exportálása</p>
                </div>
                
                <div class="invoices-section-tabs">
                    <button class="tab-btn active" data-section="overview">
                        <i class="fas fa-chart-pie"></i>
                        Áttekintés
                    </button>
                    <button class="tab-btn" data-section="management">
                        <i class="fas fa-list"></i>
                        Számlák
                    </button>
                    <button class="tab-btn" data-section="reports">
                        <i class="fas fa-download"></i>
                        Exportálás
                    </button>
                </div>
            </div>

            <!-- Overview Section -->
            <div id="overview-section" class="invoices-section active">
                <div class="overview-cards">
                    <div class="overview-card revenue">
                        <div class="card-icon">
                            <i class="fas fa-euro-sign"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="todayRevenue">€0.00</h3>
                            <p>Mai bevétel</p>
                            <div class="trend neutral">
                                <span id="todayInvoicesCount">0 számla</span>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card orders">
                        <div class="card-icon">
                            <i class="fas fa-calendar-month"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="monthlyRevenue">€0.00</h3>
                            <p>Havi bevétel</p>
                            <div class="trend positive">
                                <span id="monthlyInvoicesCount">0 számla</span>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card avg-order">
                        <div class="card-icon">
                            <i class="fas fa-credit-card"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="cardPaymentPercentage">0%</h3>
                            <p>Kártyás fizetés</p>
                            <div class="trend neutral">
                                <span id="cardPaymentCount">0 számla</span>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card prep-time">
                        <div class="card-icon">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="cashPaymentPercentage">0%</h3>
                            <p>Készpénzes fizetés</p>
                            <div class="trend neutral">
                                <span id="cashPaymentCount">0 számla</span>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card storno">
                        <div class="card-icon">
                            <i class="fas fa-ban"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="stornoCount">0</h3>
                            <p>Stornó számlák</p>
                            <div class="trend neutral">
                                <span>Ez hónapban</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="recent-invoices-section">
                    <div class="section-header">
                        <h3>
                            <i class="fas fa-history"></i>
                            Legutóbbi számlák
                        </h3>
                        <button class="btn-secondary" id="viewAllInvoicesBtn">
                            Összes megtekintése
                        </button>
                    </div>
                    
                    <div class="recent-invoices-list" id="recentInvoicesList">
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                            Számlák betöltése...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Management Section -->
            <div id="management-section" class="invoices-section">
                <div class="management-header">
                    <h3>
                        <i class="fas fa-list"></i>
                        Számlák kezelése
                    </h3>
                    
                    <div class="management-controls">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" 
                                   id="invoiceSearch" 
                                   placeholder="Keresés számla száma, ügyfél neve alapján...">
                        </div>
                        
                        <select id="dateRangeFilter" class="filter-select">
                            <option value="today">Ma</option>
                            <option value="week">Ez a hét</option>
                            <option value="month" selected>Ez a hónap</option>
                            <option value="year">Ez az év</option>
                            <option value="custom">Egyedi időszak</option>
                        </select>
                        
                        <select id="paymentMethodFilter" class="filter-select">
                            <option value="all">Minden fizetési mód</option>
                            <option value="CASH">Készpénz</option>
                            <option value="CARD">Kártya</option>
                        </select>
                        
                        <select id="orderTypeFilter" class="filter-select">
                            <option value="all">Minden rendelés típus</option>
                            <option value="DELIVERY">Szállítás</option>
                            <option value="PICKUP">Elvitel</option>
                        </select>

                        <select id="invoiceTypeFilter" class="filter-select">
                            <option value="all">Minden számla típus</option>
                            <option value="NORMAL">Normál számlák</option>
                            <option value="STORNO">Stornó számlák</option>
                        </select>                        
                        
                        <div class="date-range-inputs" id="customDateRange" style="display: none;">
                            <input type="date" id="startDate" class="date-input">
                            <span>-</span>
                            <input type="date" id="endDate" class="date-input">
                        </div>
                    </div>
                </div>

                <div class="invoices-table-container">
                    <div class="table-controls">
                        <div class="invoices-count">
                            <span id="invoicesCount">0 számla</span>
                        </div>
                        
                        <div class="sort-controls">
                            <select id="sortBy" class="sort-select">
                                <option value="createdAt">Dátum szerint</option>
                                <option value="invoiceNumber">Számla szám szerint</option>
                                <option value="customerName">Ügyfél szerint</option>
                                <option value="totalGross">Összeg szerint</option>
                            </select>
                            
                            <button class="btn-sort" id="sortOrder" data-order="desc">
                                <i class="fas fa-sort-amount-down"></i>
                            </button>
                        </div>
                        
                        <div class="bulk-actions">
                            <button class="btn-info" id="bulkDownloadBtn" disabled>
                                <i class="fas fa-download"></i>
                                Kijelöltek letöltése
                            </button>
                            <button class="btn-success" id="bulkEmailBtn" disabled>
                                <i class="fas fa-envelope"></i>
                                Kijelöltek emailezése
                            </button>
                        </div>
                    </div>

                    <div class="invoices-table" id="invoicesTable">
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                            Számlák betöltése...
                        </div>
                    </div>

                    <div class="pagination-container" id="paginationContainer">
                        <!-- Pagination will be rendered here -->
                    </div>
                </div>
            </div>

            <!-- Reports Section -->
            <div id="reports-section" class="invoices-section">
                <div class="reports-header">
                    <h3>
                        <i class="fas fa-download"></i>
                        Havi jelentések és exportálás
                    </h3>
                    <p>Havi számlák exportálása könyveléshez és jelentések készítése</p>
                </div>

                <div class="export-options">
                    <div class="export-card">
                        <div class="export-icon">
                            <i class="fas fa-file-excel"></i>
                        </div>
                        <div class="export-content">
                            <h4>Havi Excel export</h4>
                            <p>Teljes havi számla lista Excel formátumban könyveléshez</p>
                            <div class="export-controls">
                                <select id="exportMonth" class="export-select">
                                    <!-- Will be populated with months -->
                                </select>
                                <select id="exportYear" class="export-select">
                                    <!-- Will be populated with years -->
                                </select>
                                <button class="btn-primary" id="exportMonthlyBtn">
                                    <i class="fas fa-download"></i>
                                    Letöltés
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="export-card">
                        <div class="export-icon">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <div class="export-content">
                            <h4>ÁFA összefoglaló</h4>
                            <p>Havi ÁFA jelentés adóhivatal számára</p>
                            <div class="export-controls">
                                <select id="vatReportMonth" class="export-select">
                                    <!-- Will be populated with months -->
                                </select>
                                <select id="vatReportYear" class="export-select">
                                    <!-- Will be populated with years -->
                                </select>
                                <button class="btn-success" id="vatReportBtn">
                                    <i class="fas fa-file-pdf"></i>
                                    Jelentés
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="export-card">
                        <div class="export-icon">
                            <i class="fas fa-filter"></i>
                        </div>
                        <div class="export-content">
                            <h4>Egyedi export</h4>
                            <p>Szűrt számlák exportálása egyedi időszakra</p>
                            <div class="export-controls">
                                <input type="date" id="customExportStart" class="date-input">
                                <input type="date" id="customExportEnd" class="date-input">
                                <button class="btn-warning" id="customExportBtn">
                                    <i class="fas fa-download"></i>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Invoice Detail Modal -->
            <div class="modal" id="invoiceModal">
                <div class="modal-backdrop"></div>
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3 id="invoiceModalTitle">Számla részletei</h3>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="invoicePreview">
                            <!-- Invoice details will be rendered here -->
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" id="closeInvoiceModalBtn">
                            Bezárás
                        </button>
                        <button class="btn-info" id="downloadInvoiceBtn">
                            <i class="fas fa-download"></i>
                            PDF letöltés
                        </button>
                        <button class="btn-primary" id="emailInvoiceBtn">
                            <i class="fas fa-envelope"></i>
                            Email küldés
                        </button>
                        <button class="btn-success" id="viewOrderBtn">
                            <i class="fas fa-shopping-cart"></i>
                            Rendelés megtekintése
                        </button>
                    </div>
                </div>
            </div>

            <!-- Loading Overlay -->
            <div class="loading-overlay" id="invoicesLoading" style="display: none;">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Feldolgozás...</p>
                </div>
            </div>
        `;

        // Set initial section
        this.showSection(this.state.currentSection);
    }

    async loadInitialData() {
        try {
            this.showLoading();
            
            // Load overview data and recent invoices in parallel
            await Promise.all([
                this.loadOverviewData(),
                this.loadInvoices(),
                this.setupDateSelectors()
            ]);
            
            this.renderCurrentSection();
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Nem sikerült betölteni az adatokat', 'error');
            this.hideLoading();
        }
    }

    async loadOverviewData() {
        try {
            const response = await this.apiCall('/invoices/overview');
            if (response.success) {
                this.state.overview = response.data;
                this.updateOverviewCards();
            }
        } catch (error) {
            console.error('Failed to load overview data:', error);
            // Set default values if API fails
            this.state.overview = {
                todayInvoices: 0,
                monthlyInvoices: 0,
                todayRevenue: 0,
                monthlyRevenue: 0,
                paymentBreakdown: { CASH: 0, CARD: 0 }
            };
        }
    }

    async loadInvoices() {
        try {
            const params = new URLSearchParams({
                page: this.state.currentPage,
                limit: this.config.itemsPerPage,
                search: this.state.searchQuery,
                dateRange: this.state.filters.dateRange,
                paymentMethod: this.state.filters.paymentMethod,
                orderType: this.state.filters.orderType,
                invoiceType: this.state.filters.invoiceType,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder
            });

            // Add custom date range if selected
            if (this.state.filters.startDate) {
                params.append('startDate', this.state.filters.startDate);
            }
            if (this.state.filters.endDate) {
                params.append('endDate', this.state.filters.endDate);
            }

            const response = await this.apiCall(`/invoices?${params}`);
            
            if (response.success) {
                this.state.invoices = response.data.invoices || [];
                this.state.totalInvoices = response.data.pagination?.total || 0;
            } else {
                throw new Error(response.error || 'Failed to load invoices');
            }

        } catch (error) {
            console.error('Failed to load invoices:', error);
            this.showNotification('Nem sikerült betölteni a számlákat', 'error');
            this.state.invoices = [];
            this.state.totalInvoices = 0;
        }
    }

    setupEventListeners() {
        // Section tabs
        document.querySelectorAll('.invoices-section-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });

        // Overview section
        this.setupOverviewListeners();
        
        // Management section
        this.setupManagementListeners();
        
        // Reports section
        this.setupReportsListeners();
    }

    setupOverviewListeners() {
        const viewAllBtn = document.getElementById('viewAllInvoicesBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.switchSection('management');
            });
        }
    }

    setupManagementListeners() {
        // Search
        const searchInput = document.getElementById('invoiceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.state.searchQuery = e.target.value;
                this.state.currentPage = 1;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            }, 500));
        }

        // Filters
        const dateRangeFilter = document.getElementById('dateRangeFilter');
        const paymentMethodFilter = document.getElementById('paymentMethodFilter');
        const orderTypeFilter = document.getElementById('orderTypeFilter');

        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.state.filters.dateRange = e.target.value;
                this.state.currentPage = 1;
                
                // Show/hide custom date inputs
                const customDateRange = document.getElementById('customDateRange');
                if (customDateRange) {
                    customDateRange.style.display = e.target.value === 'custom' ? 'flex' : 'none';
                }
                
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }

        if (paymentMethodFilter) {
            paymentMethodFilter.addEventListener('change', (e) => {
                this.state.filters.paymentMethod = e.target.value;
                this.state.currentPage = 1;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }

        if (orderTypeFilter) {
            orderTypeFilter.addEventListener('change', (e) => {
                this.state.filters.orderType = e.target.value;
                this.state.currentPage = 1;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }

        const invoiceTypeFilter = document.getElementById('invoiceTypeFilter');
        if (invoiceTypeFilter) {
            invoiceTypeFilter.addEventListener('change', (e) => {
                this.state.filters.invoiceType = e.target.value;
                this.state.currentPage = 1;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }        

        // Custom date range
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');

        if (startDate) {
            startDate.addEventListener('change', (e) => {
                this.state.filters.startDate = e.target.value;
                this.state.currentPage = 1;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }

        if (endDate) {
            endDate.addEventListener('change', (e) => {
                this.state.filters.endDate = e.target.value;
                this.state.currentPage = 1;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }

        // Sort controls
        const sortBy = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');

        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.state.sortBy = e.target.value;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }

        if (sortOrder) {
            sortOrder.addEventListener('click', (e) => {
                const currentOrder = e.target.dataset.order;
                const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
                
                e.target.dataset.order = newOrder;
                e.target.innerHTML = newOrder === 'desc' ? 
                    '<i class="fas fa-sort-amount-down"></i>' : 
                    '<i class="fas fa-sort-amount-up"></i>';
                
                this.state.sortOrder = newOrder;
                this.loadInvoices().then(() => this.renderInvoicesTable());
            });
        }

        // Bulk actions
        const bulkDownloadBtn = document.getElementById('bulkDownloadBtn');
        const bulkEmailBtn = document.getElementById('bulkEmailBtn');

        if (bulkDownloadBtn) {
            bulkDownloadBtn.addEventListener('click', () => {
                this.bulkDownloadInvoices();
            });
        }

        if (bulkEmailBtn) {
            bulkEmailBtn.addEventListener('click', () => {
                this.bulkEmailInvoices();
            });
        }
    }

    setupReportsListeners() {
        // Monthly export
        const exportMonthlyBtn = document.getElementById('exportMonthlyBtn');
        if (exportMonthlyBtn) {
            exportMonthlyBtn.addEventListener('click', () => {
                const month = document.getElementById('exportMonth').value;
                const year = document.getElementById('exportYear').value;
                this.exportMonthlyReport(year, month);
            });
        }

        // VAT report
        const vatReportBtn = document.getElementById('vatReportBtn');
        if (vatReportBtn) {
            vatReportBtn.addEventListener('click', () => {
                const month = document.getElementById('vatReportMonth').value;
                const year = document.getElementById('vatReportYear').value;
                this.generateVATReport(year, month);
            });
        }

        // Custom export
        const customExportBtn = document.getElementById('customExportBtn');
        if (customExportBtn) {
            customExportBtn.addEventListener('click', () => {
                const startDate = document.getElementById('customExportStart').value;
                const endDate = document.getElementById('customExportEnd').value;
                this.exportCustomRange(startDate, endDate);
            });
        }
    }

    switchSection(section) {
        // Update state
        this.state.currentSection = section;

        // Update tab buttons
        document.querySelectorAll('.invoices-section-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });

        // Show section
        this.showSection(section);
        this.renderCurrentSection();
    }

    showSection(section) {
        document.querySelectorAll('.invoices-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}-section`);
        });
    }

    renderCurrentSection() {
        switch (this.state.currentSection) {
            case 'overview':
                this.renderOverview();
                break;
            case 'management':
                this.renderInvoicesTable();
                break;
            case 'reports':
                this.renderReportsSection();
                break;
        }
    }

    updateOverviewCards() {
        const { overview } = this.state;
        
        // Today revenue
        const todayRevenueEl = document.getElementById('todayRevenue');
        if (todayRevenueEl) {
            todayRevenueEl.textContent = this.formatCurrency(overview.todayRevenue || 0);
        }

        // Today invoices count
        const todayInvoicesEl = document.getElementById('todayInvoicesCount');
        if (todayInvoicesEl) {
            todayInvoicesEl.textContent = `${overview.todayInvoices || 0} számla`;
        }

        // Monthly revenue
        const monthlyRevenueEl = document.getElementById('monthlyRevenue');
        if (monthlyRevenueEl) {
            monthlyRevenueEl.textContent = this.formatCurrency(overview.monthlyRevenue || 0);
        }

        // Monthly invoices count
        const monthlyInvoicesEl = document.getElementById('monthlyInvoicesCount');
        if (monthlyInvoicesEl) {
            monthlyInvoicesEl.textContent = `${overview.monthlyInvoices || 0} számla`;
        }

        // Payment method breakdown
        const totalPayments = (overview.paymentBreakdown?.CASH || 0) + (overview.paymentBreakdown?.CARD || 0);
        
        if (totalPayments > 0) {
            const cardPercentage = Math.round((overview.paymentBreakdown?.CARD || 0) / totalPayments * 100);
            const cashPercentage = 100 - cardPercentage;

            const cardPercentageEl = document.getElementById('cardPaymentPercentage');
            const cashPercentageEl = document.getElementById('cashPaymentPercentage');
            const cardCountEl = document.getElementById('cardPaymentCount');
            const cashCountEl = document.getElementById('cashPaymentCount');

            if (cardPercentageEl) cardPercentageEl.textContent = `${cardPercentage}%`;
            if (cashPercentageEl) cashPercentageEl.textContent = `${cashPercentage}%`;
            if (cardCountEl) cardCountEl.textContent = `${overview.paymentBreakdown?.CARD || 0} számla`;
            if (cashCountEl) cashCountEl.textContent = `${overview.paymentBreakdown?.CASH || 0} számla`;
        }

        const stornoCountEl = document.getElementById('stornoCount');
        if (stornoCountEl) {
            stornoCountEl.textContent = overview.monthlyStornoCount || 0;
        }

    }

    renderOverview() {
        this.updateOverviewCards();
        this.renderRecentInvoices();
    }

    renderRecentInvoices() {
        const container = document.getElementById('recentInvoicesList');
        if (!container) return;

        // Take first 5 invoices for recent list
        const recentInvoices = this.state.invoices.slice(0, 5);

        if (recentInvoices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <h3>Nincsenek számlák</h3>
                    <p>Még nincsenek kiállított számlák.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentInvoices.map(invoice => `
            <div class="invoice-item" onclick="invoicesApp.viewInvoiceDetails(${invoice.id})">
                <div class="invoice-info">
                    <h4>${invoice.invoiceNumber}</h4>
                    <p>${this.escapeHtml(invoice.customerName)} • ${this.formatCurrency(invoice.totalGross)} • ${this.formatDate(invoice.createdAt)}</p>
                </div>
                <div class="invoice-badges">
                    <span class="payment-method-badge ${invoice.paymentMethod.toLowerCase()}">
                        <i class="fas fa-${invoice.paymentMethod === 'CARD' ? 'credit-card' : 'money-bill-wave'}"></i>
                        ${invoice.paymentMethod === 'CARD' ? 'Kártya' : 'Készpénz'}
                    </span>
                    <span class="order-type-badge ${invoice.orderType?.toLowerCase() || 'pickup'}">
                        <i class="fas fa-${invoice.orderType === 'DELIVERY' ? 'truck' : 'store'}"></i>
                        ${invoice.orderType === 'DELIVERY' ? 'Szállítás' : 'Elvitel'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderInvoicesTable() {
        const container = document.getElementById('invoicesTable');
        const countContainer = document.getElementById('invoicesCount');
    
        if (!container) return;
    
        // Update count
        if (countContainer) {
            countContainer.textContent = `${this.state.totalInvoices} számla`;
        }
    
        if (this.state.invoices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Nincsenek találatok</h3>
                    <p>Próbálja meg módosítani a szűrési feltételeket.</p>
                </div>
            `;
            return;
        }
    
        container.innerHTML = `
            <div class="invoices-table-wrapper">
                <table class="invoices-table">
                    <thead>
                        <tr>
                            <th>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="selectAllInvoices">
                                    <span class="checkbox-custom"></span>
                                </label>
                            </th>
                            <th>Számla száma</th>
                            <th>Dátum</th>
                            <th>Ügyfél</th>
                            <th>Rendelés típus</th>
                            <th>Fizetési mód</th>
                            <th>Összeg</th>
                            <th>Művelet</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.invoices.map(invoice => `
                            <!-- ✅ CHANGED: Added storno-invoice class -->
                            <tr class="invoice-row ${invoice.invoiceType === 'STORNO' ? 'storno-invoice' : ''}">
                                <td>
                                    <label class="checkbox-label">
                                        <input type="checkbox" 
                                               class="invoice-checkbox" 
                                               value="${invoice.id}">
                                        <span class="checkbox-custom"></span>
                                    </label>
                                </td>
                                <td>
                                    <a href="#" onclick="invoicesApp.viewInvoiceDetails(${invoice.id}); return false;" 
                                       class="invoice-number-link">
                                        ${invoice.invoiceNumber}
                                        <!-- ✅ NEW: Storno badge -->
                                        ${invoice.invoiceType === 'STORNO' ? '<span class="storno-badge">STORNO</span>' : ''}
                                        <!-- ✅ NEW: Cancelled badge -->
                                        ${invoice.isCancelled ? '<span class="cancelled-badge">ÉRVÉNYTELEN</span>' : ''}
                                    </a>
                                    <!-- ✅ NEW: Original invoice reference -->
                                    ${invoice.originalInvoiceNumber ? `<div class="invoice-reference">Eredeti: ${invoice.originalInvoiceNumber}</div>` : ''}
                                </td>
                                <td>${this.formatDate(invoice.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                <td>${this.escapeHtml(invoice.customerName)}</td>
                                <td>
                                    <span class="order-type-badge ${invoice.orderType?.toLowerCase() || 'pickup'}">
                                        <i class="fas fa-${invoice.orderType === 'DELIVERY' ? 'truck' : 'store'}"></i>
                                        ${invoice.orderType === 'DELIVERY' ? 'Szállítás' : 'Elvitel'}
                                    </span>
                                </td>
                                <td>
                                    <span class="payment-method-badge ${invoice.paymentMethod.toLowerCase()}">
                                        <i class="fas fa-${invoice.paymentMethod === 'CARD' ? 'credit-card' : 'money-bill-wave'}"></i>
                                        ${invoice.paymentMethod === 'CARD' ? 'Kártya' : 'Készpénz'}
                                    </span>
                                </td>
                                <td class="amount-cell">${this.formatCurrency(invoice.totalGross)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-icon btn-info" 
                                                onclick="invoicesApp.viewInvoiceDetails(${invoice.id})"
                                                title="Megtekintés">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-icon btn-primary" 
                                                onclick="invoicesApp.downloadInvoice(${invoice.id})"
                                                title="PDF letöltés">
                                            <i class="fas fa-download"></i>
                                        </button>
                                        <button class="btn-icon btn-success" 
                                                onclick="invoicesApp.emailInvoice(${invoice.id})"
                                                title="Email küldés">
                                            <i class="fas fa-envelope"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
                        
        // Setup table interactions
        this.setupTableInteractions();
        this.renderPagination();
    }

    setupTableInteractions() {
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllInvoices');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.invoice-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    if (e.target.checked) {
                        this.state.selectedInvoices.add(parseInt(checkbox.value));
                    } else {
                        this.state.selectedInvoices.delete(parseInt(checkbox.value));
                    }
                });
                this.updateBulkActionButtons();
            });
        }

        // Individual checkboxes
        document.querySelectorAll('.invoice-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const invoiceId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.state.selectedInvoices.add(invoiceId);
                } else {
                    this.state.selectedInvoices.delete(invoiceId);
                }
                this.updateBulkActionButtons();
                
                // Update select all checkbox
                const selectAllCheckbox = document.getElementById('selectAllInvoices');
                if (selectAllCheckbox) {
                    const allCheckboxes = document.querySelectorAll('.invoice-checkbox');
                    const checkedCheckboxes = document.querySelectorAll('.invoice-checkbox:checked');
                    selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length;
                    selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
                }
            });
        });
    }

    updateBulkActionButtons() {
        const selectedCount = this.state.selectedInvoices.size;
        const bulkDownloadBtn = document.getElementById('bulkDownloadBtn');
        const bulkEmailBtn = document.getElementById('bulkEmailBtn');

        if (bulkDownloadBtn) {
            bulkDownloadBtn.disabled = selectedCount === 0;
            bulkDownloadBtn.textContent = selectedCount > 0 ? 
                `${selectedCount} kijelölt letöltése` : 'Kijelöltek letöltése';
        }

        if (bulkEmailBtn) {
            bulkEmailBtn.disabled = selectedCount === 0;
            bulkEmailBtn.textContent = selectedCount > 0 ? 
                `${selectedCount} kijelölt emailezése` : 'Kijelöltek emailezése';
        }
    }

    renderPagination() {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        const totalPages = Math.ceil(this.state.totalInvoices / this.config.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const currentPage = this.state.currentPage;
        let paginationHTML = '<div class="pagination">';

        // Previous button
        if (currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="invoicesApp.goToPage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="invoicesApp.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="invoicesApp.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="invoicesApp.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" onclick="invoicesApp.goToPage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        paginationHTML += '</div>';
        container.innerHTML = paginationHTML;
    }

    async goToPage(page) {
        this.state.currentPage = page;
        await this.loadInvoices();
        this.renderInvoicesTable();
    }

    setupDateSelectors() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        // Month options
        const months = [
            'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
            'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
        ];

        // Populate export month selectors
        const exportMonthSelectors = ['exportMonth', 'vatReportMonth'];
        exportMonthSelectors.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = months.map((month, index) => 
                    `<option value="${index + 1}" ${index === currentMonth ? 'selected' : ''}>
                        ${month}
                    </option>`
                ).join('');
            }
        });

        // Populate year selectors
        const yearSelectors = ['exportYear', 'vatReportYear'];
        yearSelectors.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const years = [];
                for (let year = currentYear; year >= currentYear - 5; year--) {
                    years.push(`<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`);
                }
                select.innerHTML = years.join('');
            }
        });
    }

    renderReportsSection() {
        // Reports section is already rendered in the main render method
        // This method can be used for dynamic updates if needed
        console.log('Reports section is ready');
    }

    // Invoice Detail Methods
    async viewInvoiceDetails(invoiceId) {
        try {
            this.showLoading();
            
            const response = await this.apiCall(`/invoices/${invoiceId}`);
            
            if (response.success) {
                this.renderInvoiceModal(response.data);
                this.showInvoiceModal();
            } else {
                throw new Error(response.error || 'Failed to load invoice details');
            }
            
        } catch (error) {
            console.error('Failed to load invoice details:', error);
            this.showNotification('Nem sikerült betölteni a számla részleteit', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderInvoiceModal(invoice) {
        const modalTitle = document.getElementById('invoiceModalTitle');
        const invoicePreview = document.getElementById('invoicePreview');

        if (modalTitle) {
            modalTitle.textContent = `Számla részletei - ${invoice.invoiceNumber}`;
        }

        if (invoicePreview) {
            invoicePreview.innerHTML = `
                <div class="invoice-details">
                    <div class="invoice-header-info">
                        <div class="invoice-meta">
                            <h4>Alapadatok</h4>
                            <div class="meta-grid">
                                <div class="meta-item">
                                    <label>Számla száma:</label>
                                    <span>${invoice.invoiceNumber}</span>
                                </div>
                                <div class="meta-item">
                                    <label>Kiállítás dátuma:</label>
                                    <span>${this.formatDate(invoice.createdAt)}</span>
                                </div>
                                <div class="meta-item">
                                    <label>Esedékesség:</label>
                                    <span>${this.formatDate(invoice.dueDate || invoice.createdAt)}</span>
                                </div>
                                <div class="meta-item">
                                    <label>Rendelés típus:</label>
                                    <span class="order-type-badge ${invoice.orderType?.toLowerCase() || 'pickup'}">
                                        <i class="fas fa-${invoice.orderType === 'DELIVERY' ? 'truck' : 'store'}"></i>
                                        ${invoice.orderType === 'DELIVERY' ? 'Szállítás' : 'Elvitel'}
                                    </span>
                                </div>
                                <div class="meta-item">
                                    <label>Fizetési mód:</label>
                                    <span class="payment-method-badge ${invoice.paymentMethod.toLowerCase()}">
                                        <i class="fas fa-${invoice.paymentMethod === 'CARD' ? 'credit-card' : 'money-bill-wave'}"></i>
                                        ${invoice.paymentMethod === 'CARD' ? 'Kártya' : 'Készpénz'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="customer-info">
                            <h4>Ügyfél adatok</h4>
                            <div class="customer-details">
                                <p><strong>Név:</strong> ${this.escapeHtml(invoice.customerName)}</p>
                                ${invoice.customerEmail ? `<p><strong>Email:</strong> ${this.escapeHtml(invoice.customerEmail)}</p>` : ''}
                                ${invoice.customerPhone ? `<p><strong>Telefon:</strong> ${this.escapeHtml(invoice.customerPhone)}</p>` : ''}
                                ${invoice.customerAddress ? `<p><strong>Cím:</strong> ${this.escapeHtml(invoice.customerAddress)}</p>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="invoice-items">
                        <h4>Rendelés tételek</h4>
                        <div class="items-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Termék</th>
                                        <th>Mennyiség</th>
                                        <th>Egységár</th>
                                        <th>Összeg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${invoice.items?.map(item => `
                                        <tr>
                                            <td>
                                                <div class="item-details">
                                                    <strong>${this.escapeHtml(item.name)}</strong>
                                                    ${item.customizations?.length ? `
                                                        <div class="customizations">
                                                            ${item.customizations.map(custom => 
                                                                `<span class="customization">${this.escapeHtml(custom.name)}</span>`
                                                            ).join('')}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </td>
                                            <td>${item.quantity}</td>
                                            <td>${this.formatCurrency(item.price)}</td>
                                            <td>${this.formatCurrency(item.quantity * item.price)}</td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="4">Nincsenek tételek</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="invoice-totals">
                        <div class="totals-section">
                            ${invoice.subtotal ? `
                                <div class="total-row">
                                    <span>Részösszeg (tételek):</span>
                                    <span>${this.formatCurrency(invoice.subtotal)}</span>
                                </div>
                            ` : ''}
                            ${invoice.deliveryFee && invoice.deliveryFee > 0 ? `
                                <div class="total-row">
                                    <span>Szállítási díj:</span>
                                    <span>${this.formatCurrency(invoice.deliveryFee)}</span>
                                </div>
                            ` : ''}
                            ${invoice.packagingFee > 0 ? `
                                <div class="total-row">
                                    <span>Csomagolási díj:</span>
                                    <span>${this.formatCurrency(invoice.packagingFee)}</span>
                                </div>
                            ` : ''}
                            <div class="total-row subtotal-line">
                                <span>Nettó összeg:</span>
                                <span>${this.formatCurrency(invoice.totalNet || 0)}</span>
                            </div>
                            <div class="total-row">
                                <span>ÁFA (${invoice.vatRate || 27}%):</span>
                                <span>${this.formatCurrency(invoice.totalVat || 0)}</span>
                            </div>
                            <div class="total-row final-total">
                                <span><strong>Végösszeg:</strong></span>
                                <span><strong>${this.formatCurrency(invoice.totalGross)}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Setup modal action buttons
        this.setupInvoiceModalActions(invoice);
    }

    setupInvoiceModalActions(invoice) {
        // Clean up existing listeners
        this.cleanupModalListeners();

        const downloadBtn = document.getElementById('downloadInvoiceBtn');
        const emailBtn = document.getElementById('emailInvoiceBtn');
        const viewOrderBtn = document.getElementById('viewOrderBtn');
        const closeBtn = document.getElementById('closeInvoiceModalBtn');
        const modalCloseBtn = document.querySelector('#invoiceModal .modal-close');
        const modalBackdrop = document.querySelector('#invoiceModal .modal-backdrop');

        // Download action
        if (downloadBtn) {
            const downloadHandler = () => this.downloadInvoice(invoice.id);
            downloadBtn.addEventListener('click', downloadHandler);
            this.modalEventListeners.push({ element: downloadBtn, event: 'click', handler: downloadHandler });
        }

        // Email action
        if (emailBtn) {
            const emailHandler = () => this.emailInvoice(invoice.id);
            emailBtn.addEventListener('click', emailHandler);
            this.modalEventListeners.push({ element: emailBtn, event: 'click', handler: emailHandler });
        }

        // View order action
        if (viewOrderBtn) {
            const viewOrderHandler = () => this.viewRelatedOrder(invoice.orderId);
            viewOrderBtn.addEventListener('click', viewOrderHandler);
            this.modalEventListeners.push({ element: viewOrderBtn, event: 'click', handler: viewOrderHandler });
        }

        // Close actions
        const closeHandler = () => this.hideInvoiceModal();
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeHandler);
            this.modalEventListeners.push({ element: closeBtn, event: 'click', handler: closeHandler });
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeHandler);
            this.modalEventListeners.push({ element: modalCloseBtn, event: 'click', handler: closeHandler });
        }

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeHandler);
            this.modalEventListeners.push({ element: modalBackdrop, event: 'click', handler: closeHandler });
        }
    }

    showInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hideInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        this.cleanupModalListeners();
    }

    cleanupModalListeners() {
        this.modalEventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.modalEventListeners = [];
    }

    // Action Methods
    async downloadInvoice(invoiceId) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.config.apiUrl}/invoices/${invoiceId}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download invoice');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showNotification('Számla sikeresen letöltve', 'success');

        } catch (error) {
            console.error('Failed to download invoice:', error);
            this.showNotification('Nem sikerült letölteni a számlát', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async emailInvoice(invoiceId) {
        try {
            this.showLoading();
            
            const response = await this.apiCall(`/invoices/${invoiceId}/email`, {
                method: 'POST'
            });

            if (response.success) {
                this.showNotification('Email sikeresen elküldve', 'success');
            } else {
                throw new Error(response.error || 'Failed to send email');
            }

        } catch (error) {
            console.error('Failed to send invoice email:', error);
            this.showNotification('Nem sikerült elküldeni az emailt', 'error');
        } finally {
            this.hideLoading();
        }
    }

    viewRelatedOrder(orderId) {
        if (orderId && window.adminDashboard) {
            this.hideInvoiceModal();
            window.adminDashboard.loadApp('orders');
            // If orders app has a method to view specific order
            setTimeout(() => {
                if (window.ordersApp && window.ordersApp.viewOrderDetails) {
                    window.ordersApp.viewOrderDetails(orderId);
                }
            }, 500);
        }
    }

    // Bulk Actions
    async bulkDownloadInvoices() {
        if (this.state.selectedInvoices.size === 0) {
            this.showNotification('Kérjük válasszon ki számlákat', 'warning');
            return;
        }

        try {
            this.showLoading();
            
            const invoiceIds = Array.from(this.state.selectedInvoices);
            const response = await this.apiCall('/invoices/bulk-download', {
                method: 'POST',
                body: JSON.stringify({ invoiceIds })
            });

            if (response.success && response.data.downloadUrl) {
                // Download the ZIP file
                const a = document.createElement('a');
                a.href = response.data.downloadUrl;
                a.download = `invoices-${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                this.showNotification('Számlák sikeresen letöltve', 'success');
            } else {
                throw new Error(response.error || 'Failed to download invoices');
            }

        } catch (error) {
            console.error('Failed to bulk download invoices:', error);
            this.showNotification('Nem sikerült letölteni a számlákat', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async bulkEmailInvoices() {
        if (this.state.selectedInvoices.size === 0) {
            this.showNotification('Kérjük válasszon ki számlákat', 'warning');
            return;
        }

        try {
            this.showLoading();
            
            const invoiceIds = Array.from(this.state.selectedInvoices);
            const response = await this.apiCall('/invoices/bulk-email', {
                method: 'POST',
                body: JSON.stringify({ invoiceIds })
            });

            if (response.success) {
                this.showNotification(`${invoiceIds.length} számla sikeresen elküldve`, 'success');
            } else {
                throw new Error(response.error || 'Failed to send emails');
            }

        } catch (error) {
            console.error('Failed to bulk email invoices:', error);
            this.showNotification('Nem sikerült elküldeni az emaileket', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Export Methods
    async exportMonthlyReport(year, month) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.config.apiUrl}/invoices/export/monthly?year=${year}&month=${month}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export monthly report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `monthly-report-${year}-${month.toString().padStart(2, '0')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showNotification('Havi jelentés sikeresen letöltve', 'success');

        } catch (error) {
            console.error('Failed to export monthly report:', error);
            this.showNotification('Nem sikerült exportálni a havi jelentést', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async generateVATReport(year, month) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.config.apiUrl}/invoices/vat-report?year=${year}&month=${month}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate VAT report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vat-report-${year}-${month.toString().padStart(2, '0')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showNotification('ÁFA jelentés sikeresen letöltve', 'success');

        } catch (error) {
            console.error('Failed to generate VAT report:', error);
            this.showNotification('Nem sikerült generálni az ÁFA jelentést', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async exportCustomRange(startDate, endDate) {
        if (!startDate || !endDate) {
            this.showNotification('Kérjük adja meg a kezdő és végső dátumot', 'warning');
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`${this.config.apiUrl}/invoices/export/custom?startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export custom range');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `custom-export-${startDate}-${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showNotification('Egyedi export sikeresen letöltve', 'success');

        } catch (error) {
            console.error('Failed to export custom range:', error);
            this.showNotification('Nem sikerült exportálni az egyedi időszakot', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Utility Methods
    showLoading() {
        const loading = document.getElementById('invoicesLoading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('invoicesLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

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

    async refresh() {
        await this.loadInitialData();
    }

    destroy() {
        this.cleanupModalListeners();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        super.destroy();
    }
}

// Make globally available for onclick handlers
window.InvoicesApp = InvoicesApp;
//window.invoicesApp = null; // Will be set when app is created                                


/**
 * Content App (Placeholder)
 * Will be expanded later for content management
 */
class ContentApp extends BaseApp {
    constructor() {
        super('content');
    }

    async initialize() {
        console.log('✏️ Content App placeholder initialized');
    }
}

/**
 * Settings App (Placeholder)
 * Will be expanded later for system settings
 */
class SettingsApp extends BaseApp {
    constructor() {
        super('settings');
    }

    async initialize() {
        console.log('⚙️ Settings App placeholder initialized');
    }
}

/**
 * User Management App
 * For SUPER_ADMIN to manage users
 */
class UsersApp extends BaseApp {
    constructor() {
        super('users');
        this.state = {
            users: [],
            isCreating: false
        };
    }

    async initialize() {
        console.log('👥 Initializing User Management App...');
        
        // Check permissions
        if (!this.canAccess()) {
            this.renderAccessDenied();
            return;
        }
        
        this.render();
        await this.loadUsers();
        this.setupEventListeners();
    }

    canAccess() {
        return window.adminDashboard?.state.user?.role === 'SUPER_ADMIN';
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="users-header">
                <div class="users-title">
                    <h2>👥 Felhasználó kezelés</h2>
                    <p>Adminisztrátorok és személyzet kezelése</p>
                </div>
                <button class="btn-primary" id="addUserBtn">
                    <i class="fas fa-plus"></i>
                    Új felhasználó
                </button>
            </div>

            <div class="users-list" id="usersList">
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin"></i>
                    Felhasználók betöltése...
                </div>
            </div>

            <!-- Create User Modal -->
            <div class="modal" id="createUserModal">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Új felhasználó létrehozása</h3>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="createUserForm">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="userEmail">Email cím *</label>
                                    <input type="email" id="userEmail" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label for="userFirstName">Keresztnév *</label>
                                    <input type="text" id="userFirstName" name="firstName" required>
                                </div>
                                <div class="form-group">
                                    <label for="userLastName">Családnév *</label>
                                    <input type="text" id="userLastName" name="lastName" required>
                                </div>
                                <div class="form-group">
                                    <label for="userRole">Szerepkör *</label>
                                    <select id="userRole" name="role" required>
                                        <option value="">Válasszon szerepkört</option>
                                        <option value="DELIVERY_USER">Futár</option>
                                        <option value="RESTAURANT_USER">Étterem kezelő</option>
                                        <option value="SUPER_ADMIN">Főadmin</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="userPassword">Jelszó *</label>
                                    <input type="password" id="userPassword" name="password" required minlength="6" autocomplete="new-password">
                                </div>
                                <div class="form-group">
                                    <label for="userPasswordConfirm">Jelszó megerősítése *</label>
                                    <input type="password" id="userPasswordConfirm" name="passwordConfirm" required autocomplete="new-password">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" id="cancelCreateBtn">
                            Mégse
                        </button>
                        <button class="btn-primary" id="saveUserBtn">
                            <i class="fas fa-save"></i>
                            Létrehozás
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderAccessDenied() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="access-denied">
                <i class="fas fa-lock"></i>
                <h2>Hozzáférés megtagadva</h2>
                <p>Nincs jogosultsága a felhasználó kezeléshez.</p>
            </div>
        `;
    }

    async loadUsers() {
        try {
            const response = await this.apiCall('/users');
            if (response.success) {
                this.state.users = response.data;
                this.renderUsersList();
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.showNotification('Nem sikerült betölteni a felhasználókat', 'error');
        }
    }

    renderUsersList() {
        const container = document.getElementById('usersList');
        if (!container) return;

        if (this.state.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Nincsenek felhasználók</h3>
                    <p>Hozzon létre új felhasználókat a rendszer kezeléséhez.</p>
                </div>
            `;
            return;
        }

        const usersHtml = this.state.users.map(user => `
            <div class="user-card">
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-details">
                        <h4>${this.escapeHtml(user.firstName)} ${this.escapeHtml(user.lastName)}</h4>
                        <p class="user-email">${this.escapeHtml(user.email)}</p>
                        <span class="user-role role-${user.role.toLowerCase()}">${this.getRoleDisplayName(user.role)}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-icon btn-info" onclick="usersApp.editUser(${user.id})" title="Szerkesztés">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.id !== window.adminDashboard.state.user.id ? `
                        <button class="btn-icon btn-danger" onclick="usersApp.deleteUser(${user.id})" title="Törlés">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = usersHtml;
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'SUPER_ADMIN': 'Főadmin',
            'RESTAURANT_USER': 'Étterem kezelő',
            'DELIVERY_USER': 'Futár'
        };
        return roleNames[role] || role;
    }

    setupEventListeners() {
        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showCreateUserModal();
            });
        }

        // Modal close
        const modal = document.getElementById('createUserModal');
        const closeBtn = modal?.querySelector('.modal-close');
        const backdrop = modal?.querySelector('.modal-backdrop');
        const cancelBtn = document.getElementById('cancelCreateBtn');

        [closeBtn, backdrop, cancelBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.hideCreateUserModal();
                });
            }
        });

        // Form submit
        const saveBtn = document.getElementById('saveUserBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createUser();
            });
        }
    }

    showCreateUserModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideCreateUserModal() {
        const modal = document.getElementById('createUserModal');
        const form = document.getElementById('createUserForm');
        
        if (modal) {
            modal.classList.remove('active');
        }
        
        if (form) {
            form.reset();
        }
    }

    async createUser() {
        const form = document.getElementById('createUserForm');
        const formData = new FormData(form);
        
        const userData = {
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            role: formData.get('role'),
            password: formData.get('password')
        };

        // Validate passwords match
        const passwordConfirm = formData.get('passwordConfirm');
        if (userData.password !== passwordConfirm) {
            this.showNotification('A jelszavak nem egyeznek', 'error');
            return;
        }

        try {
            const response = await this.apiCall('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success) {
                this.showNotification('Felhasználó sikeresen létrehozva', 'success');
                this.hideCreateUserModal();
                await this.loadUsers();
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            this.showNotification('Nem sikerült létrehozni a felhasználót', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Biztosan törölni szeretné ezt a felhasználót?')) {
            return;
        }

        try {
            const response = await this.apiCall(`/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showNotification('Felhasználó törölve', 'success');
                await this.loadUsers();
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            this.showNotification('Nem sikerült törölni a felhasználót', 'error');
        }
    }

    editUser(userId) {
        // TODO: Implement edit functionality
        this.showNotification('Szerkesztés funkció fejlesztés alatt', 'info');
    }

    async refresh() {
        await this.loadUsers();
    }
}

// Make app classes available globally for debugging
window.DashboardApps = {
    DashboardOverview,
    OrdersApp,
    MenuApp,
    StatsApp,
    ContentApp,
    SettingsApp,
    UsersApp
};