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
                                        <input type="text" 
                                               id="allergens" 
                                               name="allergens"
                                               placeholder="pl: Glutén, Tej, Tojás">
                                        <small>Vesszővel elválasztva</small>
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
                this.loadAllItems()
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
            const response = await this.apiCall('/menu/deliverable-items');
            this.state.deliverableItems = response.data || {};
        } catch (error) {
            console.error('Failed to load deliverable items:', error);
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

    async loadAllItems() {
        try {
            const params = new URLSearchParams({
                page: this.state.currentPage,
                limit: this.state.itemsPerPage,
                search: this.state.searchQuery,
                categoryId: this.state.filterCategory,
                availability: this.state.filterAvailability,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder
            });

            const response = await this.apiCall(`/menu/items?${params}`);
            
            if (response.success) {
                this.state.allItems = response.data.items || [];
                this.state.totalItems = response.data.pagination?.total || 0;
            }
        } catch (error) {
            console.error('Failed to load all items:', error);
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
                            <tr class="item-row ${item.isAvailable ? 'available' : 'unavailable'}">
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
                                    </div>
                                </td>
                                <td>
                                    <span class="category-name">${this.escapeHtml(item.category.name)}</span>
                                </td>
                                <td>
                                    <span class="item-price">${this.formatCurrency(item.price)}</span>
                                </td>
                                <td>
                                    <span class="availability-status ${item.isAvailable ? 'available' : 'unavailable'}">
                                        <i class="fas fa-${item.isAvailable ? 'check-circle' : 'times-circle'}"></i>
                                        ${item.isAvailable ? 'Elérhető' : 'Letiltva'}
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
                if (item) {
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
            this.loadItemForEdit(itemId);
        } else {
            // Create mode
            modalTitle.textContent = 'Új termék hozzáadása';
            this.populateCategoryOptions();
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
                document.getElementById('allergens').value = Array.isArray(item.allergens) ? item.allergens.join(', ') : '';
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

            // Set focus to price addon field
            setTimeout(() => {
                document.getElementById('itemPriceAddon').focus();
            }, 100);
        } else {
            // Hide price addon field for other categories
            priceAddonGroup.style.display = 'none';
            document.getElementById('itemPriceAddon').required = false;
            document.getElementById('itemPriceAddon').value = '';
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
            { element: fileInput, event: 'change', handler: fileHandler },
            { element: categorySelect, event: 'change', handler: categoryHandler }
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

            const priceAddonGroup = document.getElementById('priceAddonGroup');
            if (priceAddonGroup) {
                priceAddonGroup.style.display =  'none';
            }
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