/**
 * Palace Cafe & Bar - Updated Checkout Page JavaScript
 * Professional checkout system integrated with backend API
 * 
 * Features:
 * - Cart management connected to order page
 * - Backend API integration for drinks suggestions
 * - Sticky payment section
 * - Order type selection (pickup/delivery)
 * - Time scheduling system
 * - Form validation and sanitization
 * - GDPR compliant data handling
 * - Security measures against XSS and injection attacks
 */

class PalaceCheckout {
    constructor() {

        // ===== ALLOWED DELIVERY POSTAL CODES =====
        // Only these postal codes are eligible for delivery
        this.allowedPostalCodes = ['94501', '94504'];
        // =========================================


        // Configuration
        this.config = {
            packagingFee: 0.50,
            deliveryFee: 2.50,
            minOrderAmount: 5.00,
            maxDeliveryDistance: 15, // km from restaurant
            restaurantLocation: { lat: 47.7648, lng: 18.1281 }, // Komárno coordinates
            operatingHours: {
                'wednesday': { open: '11:00', close: '20:00' },
                'thursday': { open: '11:00', close: '20:00' },
                'friday': { open: '11:00', close: '22:00' },
                'saturday': { open: '11:00', close: '22:00' }
            },
            timeSlotInterval: 15, // minutes
            apiBaseUrl: 'https://palace-cafe-backend-production.up.railway.app/api' // Adjust based on your backend setup
        };

        this.customizationOptions = null; // Will be loaded from API
        this.currentItem = null;

        // Stripe initialization
        this.stripe = null;
        this.stripeElements = null;
        this.cardElement = null;

        // State management
        this.state = {
            cart: [],
            orderType: 'pickup',
            selectedTime: 'asap',
            paymentMethod: 'cash',
            currentEditingItem: null,
            formData: {},
            addedDrinks: [],
            nonAlcoholicDrinks: []
        };

        // Security: CSRF token placeholder (will be set by backend)
        this.csrfToken = this.generateCSRFToken();

        this.init();
    }

    /**
     * Initialize the checkout system
     */
    async init() {
        try {
            console.log('🚀 Initializing Palace Checkout system...');
            
            // Load cart data from order page
            await this.loadCartData();

            await this.loadCustomizationOptions();

            // Initialize order type to pickup
            this.state.orderType = 'pickup';
            const pickupRadio = document.querySelector('input[name="orderType"][value="pickup"]');
            if (pickupRadio) {
                pickupRadio.checked = true;
            }
            const deliverySection = document.getElementById('deliverySection');
            if (deliverySection) {
                deliverySection.style.display = 'none';
            }            
            
            // Setup event listeners
            this.setupEventListeners();

            // Initialize time selection to ASAP
            this.state.selectedTime = 'asap';
            const asapRadio = document.querySelector('input[name="timeType"][value="asap"]');
            if (asapRadio) {
                asapRadio.checked = true;
            }
            const scheduledTime = document.getElementById('scheduledTime');
            if (scheduledTime) {
                scheduledTime.style.display = 'none';
            }            
            
            // Generate time slots
            this.generateTimeSlots();
            
            await this.loadDrinkSuggestions();

            // Load drink suggestions from backend
            await this.loadDrinkSuggestions();
            this.displayDrinkSuggestions();
            
            // Update displays
            this.updateCartDisplay();
            this.updateOrderSummary();
            this.validateForm();

            // Initialize Stripe (non-blocking)
            this.initializeStripe().catch(error => {
                console.warn('Stripe initialization failed, card payments disabled:', error);
            });            
            
            
            console.log('✅ Palace Checkout system initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize checkout:', error);
            this.showNotification('Hiba történt az oldal betöltésekor. Kérjük, frissítsd az oldalt!', 'error');
        }
    }

    /**
     * Generate a temporary CSRF token for security
     */
    generateCSRFToken() {
        const array = new Uint32Array(1);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(array);
            return array[0].toString(36);
        }
        return Math.random().toString(36).substring(2, 15);
    }

    /**
     * Initialize Stripe
     */
    async initializeStripe() {
        try {
            console.log('🔄 Initializing Stripe...');

            // Wait for Stripe library to load
            await this.waitForStripe();

            console.log('API URL:', `${this.config.apiBaseUrl}/stripe/config`);

            // Get Stripe config from your backend
            const response = await fetch(`${this.config.apiBaseUrl}/stripe/config`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const config = await response.json();
            console.log('📦 Stripe config received:', config);

            if (config.success && config.data?.publishableKey) {
                this.stripe = Stripe(config.data.publishableKey);
                console.log('✅ Stripe initialized successfully');
                return true;
            } else {
                throw new Error(`Invalid config response: ${JSON.stringify(config)}`);
            }
        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
            this.showNotification('Card payment temporarily unavailable', 'error');
            return false;
        }
    }

    /**
     * Wait for Stripe library to load
     */
    async waitForStripe(maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            if (typeof Stripe !== 'undefined') {
                console.log('✅ Stripe library loaded');
                return true;
            }
            console.log(`⏳ Waiting for Stripe library... attempt ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error('Stripe library failed to load');
    }

    /**
     * Load cart data from localStorage (from order page)
     */
    async loadCartData() {
        try {
            const storedData = localStorage.getItem('palace_order_cart');
            if (storedData) {
                const cartData = JSON.parse(storedData);
                
                // Validate that cart data is recent (within 4 hours)
                const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
                if (cartData.timestamp && cartData.timestamp > fourHoursAgo) {
                    this.state.cart = cartData.items || [];
                    console.log('📦 Loaded cart from localStorage:', this.state.cart.length, 'items');
                } else {
                    console.log('⏰ Cart data expired, redirecting to order page');
                    this.redirectToOrderPage();
                    return;
                }
            } else {
                console.log('🛒 No cart data found, redirecting to order page');
                this.redirectToOrderPage();
                return;
            }

            // If cart is empty, redirect to order page
            if (this.state.cart.length === 0) {
                this.redirectToOrderPage();
            }
        } catch (error) {
            console.error('❌ Error loading cart data:', error);
            this.redirectToOrderPage();
        }
    }

    /**
     * Redirect to order page if no valid cart data
     */
    redirectToOrderPage() {
        this.showNotification('A kosár üres. Átirányítunk a rendelési oldalra...', 'info');
        setTimeout(() => {
            window.location.href = 'order.html'; // Adjust path as needed
        }, 2000);
    }

    /**
     * Load drink suggestions from NonAlcoholic API
     */
    async loadDrinkSuggestions() {
        const drinkSection = document.getElementById('drinkSuggestions');
        const drinkLoading = document.getElementById('drinkLoading');
        const drinkError = document.getElementById('drinkError');
        const drinkOptions = document.getElementById('drinkOptions');

        try {
            // Show loading state
            if (drinkLoading) drinkLoading.style.display = 'block';
            if (drinkError) drinkError.style.display = 'none';
            if (drinkOptions) drinkOptions.style.display = 'none';

            console.log('🥤 Loading drink suggestions from API...');

            const response = await fetch(`${this.config.apiBaseUrl}/menu?lang=hu`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 API Response:', data);

            if (data.success && data.data) {
                // Find NonAlcoholic category - it might be translated
                let nonAlcoholicCategory = null;

                // Look for the category by checking for 'nonalcoholic' slug
                Object.keys(data.data).forEach(categoryName => {
                    const category = data.data[categoryName];
                    if (category.slug === 'nonalcoholic') {
                        nonAlcoholicCategory = category;
                        console.log(`✅ Found NonAlcoholic category: ${categoryName}`);
                    }
                });

                if (nonAlcoholicCategory && nonAlcoholicCategory.items) {
                    this.state.nonAlcoholicDrinks = nonAlcoholicCategory.items;

                    if (this.state.nonAlcoholicDrinks.length > 0) {
                        this.displayDrinkSuggestions();
                        console.log('✅ Loaded', this.state.nonAlcoholicDrinks.length, 'drink suggestions');
                    } else {
                        throw new Error('No drinks available in NonAlcoholic category');
                    }
                } else {
                    console.log('Available categories:', Object.keys(data.data));
                    throw new Error('NonAlcoholic category not found');
                }
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            console.error('❌ Error loading drink suggestions:', error);
            this.showDrinkError();
        } finally {
            // Hide loading state
            if (drinkLoading) drinkLoading.style.display = 'none';
        }
    }

    /**
     * Load customization options from API
     */
    async loadCustomizationOptions() {
        try {
            console.log('🎛️ Loading customization options from API...');

            const response = await fetch(`${this.config.apiBaseUrl}/customization?lang=hu`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                this.customizationOptions = data.data;
                console.log('✅ Loaded customization options:', this.customizationOptions);
            } else {
                throw new Error('Invalid customization API response');
            }
        } catch (error) {
            console.error('❌ Error loading customization options:', error);
            // Fallback to basic options if API fails
            this.customizationOptions = {
                sauces: [{ slug: 'ketchup', name: 'Ketchup', isDefault: true }],
                friesOptions: [{ slug: 'regular', name: 'Normál sültkrimpli', priceAddon: 0, isDefault: true }],
                extras: []
            };
        }
    }


    /**
     * Display drink suggestions with dynamic quantity controls
     */
    displayDrinkSuggestions() {
        const drinkOptionsContainer = document.getElementById('drinkOptions');
        const drinkSection = document.getElementById('drinkSuggestions');

        if (!drinkOptionsContainer || !this.state.nonAlcoholicDrinks.length) {
            this.showDrinkError();
            return;
        }

        // Show the options container
        drinkOptionsContainer.style.display = 'grid';

        // Take first 4 drinks for suggestions
        const suggestedDrinks = this.state.nonAlcoholicDrinks.slice(0, 4);

        drinkOptionsContainer.innerHTML = suggestedDrinks.map(drink => {
            const imgSrc = drink.imageUrl || drink.image || 'photos/default-drink.jpg';
            const safeName = this.sanitizeInput(drink.name || 'Unnamed Drink');
            const safePrice = parseFloat(drink.price || 0).toFixed(2);
            const safeId = drink.id || `drink-${Math.random().toString(36).substr(2, 9)}`;

            // Get current quantity from cart
            const currentQuantity = this.getDrinkQuantityFromCart(safeId);

            return `
                <div class="drink-suggestion" data-drink-id="${safeId}">
                    <div class="drink-image-container">
                        <img src="${imgSrc}" 
                             alt="${safeName}" 
                             class="drink-image" 
                             onerror="if (!this.dataset.fallback) { this.dataset.fallback = 'true'; this.src='photos/default-drink.jpg'; }">
                    </div>
                    <div class="drink-info">
                        <div class="drink-name">${safeName}</div>
                        <div class="drink-price">€${safePrice}</div>
                    </div>
                    <div class="drink-button-container" id="drink-controls-${safeId}">
                        ${this.generateDrinkButtonHTML(safeId, safeName, drink.price, imgSrc, currentQuantity)}
                    </div>
                </div>
            `;
        }).join('');

        // Show the section
        if (drinkSection) drinkSection.style.display = 'block';
    }

    /**
     * Generate dynamic button HTML based on quantity
     */
    generateDrinkButtonHTML(drinkId, name, price, imageUrl, quantity = 0) {
        if (quantity === 0) {
            // Show single "Hozzáadás" button
            return `
                <button class="add-drink-btn" 
                        onclick="checkout.addDrinkToOrder('${drinkId}', '${name}', ${price}, '${imageUrl}')">
                    Hozzáadás
                </button>
            `;
        } else {
            // Show quantity controls
            return `
                <div class="drink-quantity-controls">
                    <button class="drink-qty-btn decrease" 
                            onclick="checkout.decreaseDrinkQuantity('${drinkId}', '${name}', ${price}, '${imageUrl}')">
                        -
                    </button>
                    <span class="drink-quantity-display">${quantity}</span>
                    <button class="drink-qty-btn increase" 
                            onclick="checkout.increaseDrinkQuantity('${drinkId}', '${name}', ${price}, '${imageUrl}')">
                        +
                    </button>
                </div>
            `;
        }
    }

    /**
     * Get current quantity of a drink from cart
     */
    getDrinkQuantityFromCart(drinkId) {
        const cartItem = this.state.cart.find(item => 
            item.category === 'drink' && item.originalId === drinkId
        );
        return cartItem ? cartItem.quantity : 0;
    }

    /**
     * Increase drink quantity
     */
    increaseDrinkQuantity(drinkId, name, price, imageUrl) {
        const cartItem = this.state.cart.find(item => 
            item.category === 'drink' && item.originalId === drinkId
        );

        if (cartItem && cartItem.quantity < 10) { // Max quantity limit
            cartItem.quantity += 1;

            // Update displays
            this.updateDrinkButtonDisplay(drinkId, name, price, imageUrl);
            this.updateCartDisplay();
            this.updateOrderSummary();
            this.saveCartToStorage();
        }
    }

    /**
     * Decrease drink quantity
     */
    decreaseDrinkQuantity(drinkId, name, price, imageUrl) {
        const cartItem = this.state.cart.find(item => 
            item.category === 'drink' && item.originalId === drinkId
        );

        if (cartItem) {
            if (cartItem.quantity > 1) {
                cartItem.quantity -= 1;
                this.updateDrinkButtonDisplay(drinkId, name, price, imageUrl);
            } else {
                // Remove item from cart when quantity reaches 0
                const itemIndex = this.state.cart.findIndex(item => item.id === cartItem.id);
                if (itemIndex !== -1) {
                    this.state.cart.splice(itemIndex, 1);

                    // Remove from addedDrinks tracking
                    const addedIndex = this.state.addedDrinks.indexOf(drinkId);
                    if (addedIndex !== -1) {
                        this.state.addedDrinks.splice(addedIndex, 1);
                    }
                }
                this.updateDrinkButtonDisplay(drinkId, name, price, imageUrl);
            }

            // Update displays
            this.updateCartDisplay();
            this.updateOrderSummary();
            this.saveCartToStorage();

            // Check if cart is now empty
            if (this.state.cart.length === 0) {
                this.redirectToOrderPage();
            }
        }
    }

    /**
     * Update drink button display based on current quantity
     */
    updateDrinkButtonDisplay(drinkId, name, price, imageUrl) {
        const buttonContainer = document.getElementById(`drink-controls-${drinkId}`);
        if (!buttonContainer) return;

        const currentQuantity = this.getDrinkQuantityFromCart(drinkId);
        buttonContainer.innerHTML = this.generateDrinkButtonHTML(drinkId, name, price, imageUrl, currentQuantity);
    }

    /**
     * Show drink error state
     */
    showDrinkError() {
        const drinkError = document.getElementById('drinkError');
        const drinkOptions = document.getElementById('drinkOptions');
        const drinkSection = document.getElementById('drinkSuggestions');

        if (drinkError) drinkError.style.display = 'block';
        if (drinkOptions) drinkOptions.style.display = 'none';

        // Still show the section so user knows there should be drinks
        if (drinkSection) drinkSection.style.display = 'block';
    }


    hideDrinkSuggestions() {
        const drinkSection = document.getElementById('drinkSuggestions');
        if (drinkSection) {
            drinkSection.style.display = 'none';
        }
    }

    /**
     * Add drink to order
     */
    addDrinkToOrder(drinkId, name, price, imageUrl) {
        const drinkItem = {
            id: `drink-${Date.now()}`,
            originalId: drinkId,
            name: this.sanitizeInput(name),
            description: 'Ital',
            price: parseFloat(price),
            quantity: 1,
            image: imageUrl || 'photos/default-drink.jpg',
            specialNotes: '',
            category: 'drink'
        };

        this.state.cart.push(drinkItem);

        // Update displays
        this.updateDrinkButtonDisplay(drinkId, name, price, imageUrl);
        this.updateCartDisplay();
        this.updateOrderSummary();
        this.saveCartToStorage();

        this.showNotification('Ital hozzáadva a rendeléshez!', 'success');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Order type selection
        const orderTypeRadios = document.querySelectorAll('input[name="orderType"]');
        orderTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.handleOrderTypeChange(e.target.value));
        });

        // Locate me button
        const locateMeBtn = document.getElementById('locateMeBtn');
        if (locateMeBtn) {
            locateMeBtn.addEventListener('click', () => this.handleLocateMe());
        }

        // Time type selection
        const timeTypeRadios = document.querySelectorAll('input[name="timeType"]');
        timeTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.handleTimeTypeChange(e.target.value));
        });

        // Payment method selection
        const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                console.log('💳 Payment method changed to:', e.target.value);
                this.handlePaymentChange(e.target.value);
            });
        });

        // Form validation
        this.setupFormValidation();

        // Legal checkboxes
        const legalCheckboxes = document.querySelectorAll('.legal-checkboxes input[type="checkbox"]');
        legalCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.validateForm.bind(this));
        });

        // Place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', this.handlePlaceOrder.bind(this));
        }

        // Modal controls
        this.setupModalControls();

        // Security: Add input sanitization
        this.setupInputSanitization();

        // Handle page unload
        window.addEventListener('beforeunload', (event) => {
            if (this.state.cart.length > 0) {
                const message = 'Rendelésedet még nincs leadva. Biztosan elhagyod az oldalt?';
                event.returnValue = message;
                return message;
            }
        });
    }

    /**
     * Handle order type change (pickup/delivery)
     */
    handleOrderTypeChange(type) {
        this.state.orderType = type;

        // Update UI
        const orderOptions = document.querySelectorAll('.order-option');
        orderOptions.forEach(option => {
            option.classList.remove('active');
        });

        const selectedOption = document.querySelector(`[data-type="${type}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        // Show/hide delivery section with animation
        const deliverySection = document.getElementById('deliverySection');
        if (deliverySection) {
            if (type === 'delivery') {
                deliverySection.classList.add('show');
                deliverySection.style.display = 'block';
                // Force reflow to ensure animation triggers
                void deliverySection.offsetWidth;
                deliverySection.classList.add('visible');
                this.showDeliveryFee();
            } else {
                deliverySection.classList.remove('visible');
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    if (this.state.orderType !== 'delivery') {
                        deliverySection.style.display = 'none';
                        deliverySection.classList.remove('show');
                    }
                }, 300); // Match transition duration in CSS
                this.hideDeliveryFee();
            }
        }

        // Clear delivery fields when switching to pickup
        if (type === 'pickup') {
            const deliveryFields = ['street', 'city', 'postalCode', 'deliveryNotes'];
            deliveryFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = field.id === 'city' ? 'Komárno' : ''; // Preserve default city
                    this.clearFieldError(field);
                }
            });
            const validationMessage = document.getElementById('locationValidationMessage');
            if (validationMessage) {
                validationMessage.textContent = '';
                validationMessage.classList.remove('show', 'success', 'error');
            }
        }

        this.updateOrderSummary();
        this.validateForm();
        this.saveCartToStorage();
    }

    /**
     * Handle locate me button click
     */
    async handleLocateMe() {
        const validationMessage = document.getElementById('locationValidationMessage');
        const streetInput = document.getElementById('street');
        const cityInput = document.getElementById('city');
        const postalCodeInput = document.getElementById('postalCode');

        if (!navigator.geolocation) {
            if (validationMessage) {
                validationMessage.textContent = 'A geolokáció nem támogatott ebben a böngészőben';
                validationMessage.classList.add('show', 'error');
            }
            this.showNotification('A geolokáció nem támogatott. Kérjük, add meg a címet manuálisan!', 'error');
            return;
        }

        const locateMeBtn = document.getElementById('locateMeBtn');
        if (locateMeBtn) {
            locateMeBtn.disabled = true;
            locateMeBtn.textContent = 'Keresés...';
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;

            // Check if location is within Komárno (approx. 15km radius)
            const distance = this.calculateDistance(
                latitude,
                longitude,
                this.config.restaurantLocation.lat,
                this.config.restaurantLocation.lng
            );

            if (distance > this.config.maxDeliveryDistance) {
                if (validationMessage) {
                    validationMessage.textContent = 'Sajnos a jelenlegi helyed kívül esik a kiszállítási területen (Komárno)';
                    validationMessage.classList.add('show', 'error');
                }
                this.showNotification('A kiszállítás csak Komárno területére lehetséges!', 'error');
                return;
            }

            // Reverse geocode using OpenStreetMap Nominatim API
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await response.json();

            if (data.address) {
                const { road, house_number, city, postcode } = data.address;
                streetInput.value = this.sanitizeInput(`${road || ''} ${house_number || ''}`.trim());
                cityInput.value = this.sanitizeInput(city || 'Komárno');
                postalCodeInput.value = this.sanitizeInput((postcode || '').replace(/\s/g, ''));

                if (validationMessage) {
                    validationMessage.textContent = 'Helyszín sikeresen megtalálva!';
                    validationMessage.classList.add('show', 'success');
                }
                this.showNotification('Helyszín sikeresen megtalálva!', 'success');

                // Validate fields
                this.validateField(streetInput);
                this.validateField(cityInput);
                this.validateField(postalCodeInput);
            } else {
                if (validationMessage) {
                    validationMessage.textContent = 'Nem sikerült címet találni. Kérjük, add meg manuálisan!';
                    validationMessage.classList.add('show', 'error');
                }
                this.showNotification('Nem sikerült címet találni. Kérjük, add meg manuálisan!', 'error');
            }
        } catch (error) {
            console.error('Geolocation error:', error);
            if (validationMessage) {
                validationMessage.textContent = 'Hiba történt a helymeghatározás során. Kérjük, add meg a címet manuálisan!';
                validationMessage.classList.add('show', 'error');
            }
            this.showNotification('Hiba történt a helymeghatározás során!', 'error');
        } finally {
            if (locateMeBtn) {
                locateMeBtn.disabled = false;
                locateMeBtn.textContent = 'Találj meg';
            }
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    /**
     * Show delivery fee in cart summary
     */
    showDeliveryFee() {
        const deliveryFeeRow = document.querySelector('.delivery-fee');
        if (deliveryFeeRow) {
            deliveryFeeRow.style.display = 'flex';
        }
    }

    /**
     * Hide delivery fee in cart summary
     */
    hideDeliveryFee() {
        const deliveryFeeRow = document.querySelector('.delivery-fee');
        if (deliveryFeeRow) {
            deliveryFeeRow.style.display = 'none';
        }
    }
    /**
     * Handle time type change (ASAP vs scheduled)
     */
    handleTimeTypeChange(type) {
        this.state.selectedTime = type;
        const scheduledTime = document.getElementById('scheduledTime');

            if (scheduledTime){
                if (type == 'scheduled') {
                    scheduledTime.style.display = 'block';
                    this.setupTimeInput();
                    this.displayOperatingHours(); 
                } else {
                    scheduledTime.style.display = 'none';
                }
            }
        
        this.saveCartToStorage();
    }
    
    /**
     * Setup time input functionality with validation
     */
    setupTimeInput() {
        const timeInput = document.getElementById('orderTimeInput');
        if (!timeInput) return;
        
        // Format time as user types
        timeInput.addEventListener('input', (e) => {
            this.formatTimeInput(e);
            this.validateTimeInput(e.target.value);
        });
        
        // Validate on blur
        timeInput.addEventListener('blur', (e) => {
            this.validateTimeInput(e.target.value);
        });
    }
    
    /**
     * Format time input as user types
     */
    formatTimeInput(event) {
        let value = event.target.value.replace(/[^\d]/g, ''); // Remove non-digits
        
        if (value.length >= 3) {
            // Format as HH:MM
            value = value.substring(0, 2) + ':' + value.substring(2, 4);
        }
        
        event.target.value = value;
    }
    
    /**
     * Validate time input
     */
    validateTimeInput(timeValue) {
        const timeInput = document.getElementById('orderTimeInput');
        const validationMessage = document.getElementById('timeValidationMessage');

        // Clear previous states
        timeInput.classList.remove('valid', 'invalid');
        if (validationMessage) {
            validationMessage.classList.remove('show', 'success', 'error');
            validationMessage.textContent = '';
        }

        if (!timeValue || timeValue.length < 5) {
            // Clear stored time if input is empty
            this.state.scheduledTime = null;
            return;
        }

        const validation = this.isValidTime(timeValue);

        if (validation.isValid) {
            timeInput.classList.add('valid');
            if (validationMessage) {
                validationMessage.textContent = `Időpont elfogadva: ${timeValue}`;
                validationMessage.classList.add('show', 'success');
            }

            // Save valid time - CREATE ISO STRING FROM TIME INPUT
            const scheduledDateTime = this.createDateFromTime(timeValue, true);
            this.state.scheduledTime = scheduledDateTime;

            console.log('🕐 Scheduled time saved:', scheduledDateTime);
            console.log('🕐 State scheduled time:', this.state.scheduledTime);

            this.saveCartToStorage();

        } else {
            timeInput.classList.add('invalid');
            if (validationMessage) {
                validationMessage.textContent = validation.message;
                validationMessage.classList.add('show', 'error');
            }
            // Clear stored time if validation fails
            this.state.scheduledTime = null;
        }
    }
    
    /**
     * Validate if time is valid according to business rules
     */
    isValidTime(timeString) {
        // Check format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeString)) {
            return {
                isValid: false,
                message: 'Helytelen formátum. Használd: ÓÓ:PP (pl. 14:30)'
            };
        }

        const [hours, minutes] = timeString.split(':').map(Number);
        const now = new Date();
        const today = new Date(now);

        // Get operating hours for today
        const operatingHours = this.getOperatingHours();
        const todayHours = operatingHours[today.getDay()];

        if (!todayHours) {
            return {
                isValid: false,
                message: 'Ma nincs nyitvatartási idő'
            };
        }

        // Create requested time
        const requestedTimeToday = new Date(today);
        requestedTimeToday.setHours(hours, minutes, 0, 0);

        // Check if within today's operating hours
        const [openHour, openMin] = todayHours.open.split(':').map(Number);
        const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        const requestedTime = hours * 60 + minutes;

        if (requestedTime < openTime || requestedTime >= closeTime) {
            return {
                isValid: false,
                message: `Ma ${todayHours.open}-${todayHours.close} között vagyunk nyitva`
            };
        }

        // Check if time is at least 30 minutes from now
        const minTime = new Date(now.getTime() + 30 * 60000);
        if (requestedTimeToday < minTime) {
            const minTimeStr = minTime.toLocaleTimeString('hu-HU', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
            return {
                isValid: false,
                message: `A rendeléshez legalább 30 perccel későbbi időpontot válassz (legkorábbi: ${minTimeStr})`
            };
        }

        return {
            isValid: true,
            message: '',
            isToday: true
        };
    }
    
    /**
     * Get operating hours
     */
    getOperatingHours() {
        return {
            0: null, // Sunday - closed
            1: { open: '11:00', close: '20:00' }, // Monday
            2: { open: '11:00', close: '20:00' }, // Tuesday  
            3: { open: '11:00', close: '20:00' }, // Wednesday
            4: { open: '11:00', close: '20:00' }, // Thursday
            5: { open: '11:00', close: '22:00' }, // Friday
            6: { open: '11:00', close: '22:00' }, // Saturday
        };
    }
    
    /**
     * Display operating hours information
     */
    displayOperatingHours() {
        const todayHoursEl = document.getElementById('todayHours');
        const tomorrowHoursEl = document.getElementById('tomorrowHours');
        
        if (!todayHoursEl || !tomorrowHoursEl) return;
        
        const now = new Date();
        const today = new Date(now);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const operatingHours = this.getOperatingHours();
        const todayHours = operatingHours[today.getDay()];
        const tomorrowHours = operatingHours[tomorrow.getDay()];
        
        const todayName = today.toLocaleDateString('hu-HU', { weekday: 'long' });
        const tomorrowName = tomorrow.toLocaleDateString('hu-HU', { weekday: 'long' });
        
        todayHoursEl.textContent = todayHours 
            ? `Ma (${todayName}): ${todayHours.open} - ${todayHours.close}`
            : `Ma (${todayName}): Zárva`;
            
        tomorrowHoursEl.textContent = tomorrowHours 
            ? `Holnap (${tomorrowName}): ${tomorrowHours.open} - ${tomorrowHours.close}`
            : `Holnap (${tomorrowName}): Zárva`;
    }
    
    /**
     * Create date object from time string
     */
    createDateFromTime(timeString, isToday) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        
        if (!isToday) {
            date.setDate(date.getDate() + 1);
        }
        
        date.setHours(hours, minutes, 0, 0);
        return date.toISOString();
    }
    
    // Temporary test method
    testStripe() {
        console.log('🧪 Testing Stripe setup...');
        console.log('Stripe object:', this.stripe);
        console.log('Elements object:', this.stripeElements);
        console.log('Card element:', this.cardElement);
        console.log('Card container:', document.getElementById('card-element'));

        if (this.stripe && this.cardElement) {
            console.log('✅ Stripe is working!');
            this.showNotification('Stripe setup successful!', 'success');
        } else {
            console.log('❌ Stripe setup failed');
            this.showNotification('Stripe setup failed', 'error');
        }
    }

    /**
     * Setup Stripe Elements
     */
    setupStripeElements(clientSecret = null) {
        console.log('🔧 Setting up Stripe Payment Element...');

        if (!this.stripe) {
            console.error('❌ Stripe not initialized');
            this.showNotification('Card payment not available', 'error');
            return;
        }

        const cardElementContainer = document.getElementById('card-element');
        if (!cardElementContainer) {
            console.error('❌ Card element container not found');
            return;
        }

        // Clear existing elements
        if (this.paymentElement) {
            this.paymentElement.destroy();
            this.paymentElement = null;
        }
        if (this.stripeElements) {
            this.stripeElements = null;
        }

        // If no clientSecret provided, create elements with amount (for initial display)
        if (!clientSecret) {
            const totalInEuros = this.calculateTotal();
            const totalInCents = Math.round(totalInEuros * 100);

            console.log(`💰 Total: €${totalInEuros} = ${totalInCents} cents`);

            if (totalInCents < 50) {
                console.error('❌ Amount below Stripe minimum');
                this.showNotification('Order total must be at least €0.50', 'error');
                return;
            }

            // Create elements instance with Payment Element
            this.stripeElements = this.stripe.elements({
                mode: 'payment',
                amount: totalInCents,
                currency: 'eur',
                appearance: {
                    theme: 'stripe',
                },
            });
        } else {
            // Create elements with actual clientSecret
            console.log('🔑 Using clientSecret for Payment Element');
            this.stripeElements = this.stripe.elements({
                clientSecret: clientSecret,
                appearance: {
                    theme: 'stripe',
                },
            });
        }

        // Create Payment Element
        this.paymentElement = this.stripeElements.create('payment');

        // Mount payment element
        this.paymentElement.mount('#card-element');
        console.log('✅ Payment element mounted');

        // Handle errors
        this.paymentElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (displayError) {
                if (event.error) {
                    displayError.textContent = event.error.message;
                    displayError.style.display = 'block';
                } else {
                    displayError.textContent = '';
                    displayError.style.display = 'none';
                }
            }
        });

        // Handle element ready
        this.paymentElement.on('ready', () => {
            console.log('✅ Stripe payment element ready');
        });
    }

    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const deliveryFee = this.state.orderType === 'delivery' ? this.config.deliveryFee : 0;
        return subtotal + deliveryFee;
    }

    /**
     * Update Stripe Payment Element amount when cart changes
     */
    updateStripeAmount() {
        if (!this.stripeElements || !this.paymentElement) {
            return;
        }

        const totalInEuros = this.calculateTotal();
        const totalInCents = Math.round(totalInEuros * 100);

        console.log(`🔄 Updating Stripe amount: €${totalInEuros} = ${totalInCents} cents`);

        // Update the elements with new amount
        this.stripeElements.update({
            amount: totalInCents,
        });
    }
    
    /**
     * Handle payment method change
     */
    handlePaymentChange(method) {
        console.log('🔄 Handling payment change to:', method);
        this.state.paymentMethod = method;

        // Update UI
        const paymentOptions = document.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.classList.remove('active');
        });

        const selectedOption = document.querySelector(`[data-payment="${method}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        // Show/hide card payment section
        const cardSection = document.getElementById('cardPaymentSection');
        if (cardSection) {
            if (method === 'stripe') {
                if (!this.stripe) {
                    this.showNotification('Card payment is not available yet. Please try again in a moment.', 'warning');
                    // Switch back to cash
                    const cashOption = document.querySelector('input[name="paymentMethod"][value="cash"]');
                    if (cashOption) {
                        cashOption.checked = true;
                        this.handlePaymentChange('cash');
                    }
                    return;
                }

                console.log('📱 Showing Stripe card section');
                cardSection.style.display = 'block';

                setTimeout(() => {
                    this.setupStripeElements();
                }, 100);
            } else {
                console.log('💵 Hiding card section');
                cardSection.style.display = 'none';
            }
        }
    }

    /**
     * Generate available time slots based on operating hours
     */
    generateTimeSlots() {
        const today = new Date();
        const timeSlots = [];

        // Generate time slots for the next 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const hours = this.config.operatingHours[dayName];
            
            if (hours) {
                const slots = this.generateDayTimeSlots(date, hours);
                timeSlots.push(...slots);
            }
        }

        this.availableTimeSlots = timeSlots;
    }

    /**
     * Generate time slots for a specific day
     */
    generateDayTimeSlots(date, hours) {
        const slots = [];
        const [openHour, openMin] = hours.open.split(':').map(Number);
        const [closeHour, closeMin] = hours.close.split(':').map(Number);
        
        const openTime = new Date(date);
        openTime.setHours(openHour, openMin, 0, 0);
        
        const closeTime = new Date(date);
        closeTime.setHours(closeHour, closeMin, 0, 0);
        
        const now = new Date();
        const minTime = date.toDateString() === now.toDateString() 
            ? new Date(now.getTime() + 30 * 60000) // 30 minutes from now
            : openTime;
        
        const startTime = new Date(Math.max(openTime.getTime(), minTime.getTime()));
        
        for (let time = new Date(startTime); time < closeTime; time.setMinutes(time.getMinutes() + this.config.timeSlotInterval)) {
            slots.push({
                date: new Date(date),
                time: new Date(time),
                display: time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
            });
        }
        
        return slots;
    }

    /**
     * Populate date options in the select dropdown
     */
    populateDateOptions() {
        const dateSelect = document.getElementById('orderDate');
        const timeSelect = document.getElementById('orderTime');
        
        if (!dateSelect || !timeSelect) return;
        
        // Clear existing options
        dateSelect.innerHTML = '<option value="">Válassz dátumot</option>';
        timeSelect.innerHTML = '<option value="">Válassz időpontot</option>';
        
        // Group time slots by date
        const dateGroups = {};
        this.availableTimeSlots.forEach(slot => {
            const dateKey = slot.date.toDateString();
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = [];
            }
            dateGroups[dateKey].push(slot);
        });
        
        // Add date options
        Object.keys(dateGroups).forEach(dateKey => {
            const date = new Date(dateKey);
            const option = document.createElement('option');
            option.value = dateKey;
            option.textContent = date.toLocaleDateString('hu-HU', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
            });
            dateSelect.appendChild(option);
        });
        
        // Handle date selection
        dateSelect.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            timeSelect.innerHTML = '<option value="">Válassz időpontot</option>';
            
            if (selectedDate && dateGroups[selectedDate]) {
                dateGroups[selectedDate].forEach(slot => {
                    const option = document.createElement('option');
                    option.value = slot.time.toISOString();
                    option.textContent = slot.display;
                    timeSelect.appendChild(option);
                });
            }
        });
    }

    /**
     * Setup form validation with real-time feedback
     */
    setupFormValidation() {
        const allFields = ['firstName', 'lastName', 'phone', 'email', 'street', 'city', 'postalCode'];
    
        allFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Validate on blur (when user leaves field)
                field.addEventListener('blur', () => {
                    this.validateField(field);
                    this.validateForm(); // Update summary
                });
                
                // Clear error as user types
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                    field.classList.remove('invalid', 'valid');
                    
                    // Auto-validate after short delay
                    clearTimeout(field.validationTimeout);
                    field.validationTimeout = setTimeout(() => {
                        if (field.value.trim()) {
                            this.validateField(field);
                            this.validateForm();
                        }
                    }, 500);
                });
            }
        });
    
        // Validate checkboxes on change
        ['termsAccept', 'privacyAccept'].forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', () => this.validateForm());
            }
        });
    
        // Validate payment method on change
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', () => this.validateForm());
        });
    
        // Phone number formatting (keep your existing one)
        const phoneField = document.getElementById('phone');
        if (phoneField) {
            phoneField.addEventListener('input', this.formatPhoneNumber.bind(this));
        }
    
        // Postal code validation
        const postalCodeField = document.getElementById('postalCode');
        if (postalCodeField) {
            postalCodeField.addEventListener('input', this.validatePostalCode.bind(this));
        }
    }

    /**
     * Setup input sanitization to prevent XSS attacks
     */
    setupInputSanitization() {
        const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
        textInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = this.sanitizeInput(e.target.value);
            });
        });
    }

    /**
     * Sanitize user input to prevent XSS
     */
    sanitizeInput(input) {
        if (!input) return '';
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocols
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }

    /**
     * Generate customization text for checkout display - same as order page
     */
    getItemCustomizationsText(item) {
        const customizations = [];

        if (item.customization?.sauce && this.customizationOptions?.sauces) {
            const sauce = this.customizationOptions.sauces.find(s => s.slug === item.customization.sauce);
            if (sauce) customizations.push(`Szósz: ${sauce.name}`);
        }

        if (item.customization?.fries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === item.customization.fries);
            if (friesOption) {
                if (item.includesSides) {
                    // Items WITH sides included - only show price for non-regular fries
                    if (friesOption.slug !== 'regular-fries' && friesOption.priceAddon > 0) {
                        customizations.push(`${friesOption.name} (+€${friesOption.priceAddon.toFixed(2)})`);
                    } else if (friesOption.slug === 'regular-fries') {
                        // Don't show price for regular fries when sides are included
                        customizations.push(`${friesOption.name}`);
                    }
                } else {
                    // Items WITHOUT sides included - show price for all fries
                    if (friesOption.priceAddon > 0) {
                        customizations.push(`${friesOption.name} (+€${friesOption.priceAddon.toFixed(2)})`);
                    }
                }
            }
        }

        // Fixed extras display - removed the API dependency check and use hardcoded price
        if (item.customization?.extras?.length > 0) {
            const extraPrice = 0.30; // Hardcoded price matching your order page

            // Mapping of English slugs to Hungarian names
            const extraTranslations = {
                'bacon': 'Extra Bacon',
                'cheese': 'Extra Sajt', 
                'tomato': 'Extra Paradicsom',
                'onion': 'Extra Hagyma',
                'lettuce': 'Extra Saláta',
                'pickle': 'Extra Savanyúság'
            };

            const extraLabels = item.customization.extras.map(extra => {
                // Try to get name from API first, then fallback to translation map, then slug
                let extraName = extra;
                if (this.customizationOptions?.extras) {
                    const extraData = this.customizationOptions.extras.find(e => e.slug === extra);
                    extraName = extraData ? extraData.name : (extraTranslations[extra] || extra);
                } else {
                    extraName = extraTranslations[extra] || extra;
                }
                return `${extraName} (+€${extraPrice.toFixed(2)})`;
            });
            customizations.push(`Extrák: ${extraLabels.join(', ')}`);
        }

        if (item.customization?.removeInstructions) {
            customizations.push(`Eltávolítás: ${item.customization.removeInstructions}`);
        }

        if (item.customization?.specialInstructions) {
            customizations.push(`Megjegyzés: ${item.customization.specialInstructions}`);
        }

        return customizations.join(' • ');
    }

    /**
     * Calculate item total
     */
    calculateItemTotal(item) {
        let total = item.price * item.quantity;
        console.log(`Calculating total for ${item.name}: base = €${total.toFixed(2)}`);

        // Handle fries pricing
        if (item.customization?.fries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === item.customization.fries);
            if (friesOption) {
                if (item.includesSides) {
                    // Items WITH sides included - regular fries are FREE, only charge for upgrades
                    // Check for both possible regular fries slugs
                    if (friesOption.slug !== 'regular-fries' && friesOption.slug !== 'regular' && friesOption.priceAddon > 0) {
                        const friesAddon = friesOption.priceAddon * item.quantity;
                        total += friesAddon;
                        console.log(`  + fries upgrade: €${friesAddon.toFixed(2)} (${friesOption.name})`);
                    } else {
                        console.log(`  + fries: €0.00 (regular fries included)`);
                    }
                } else {
                    // Items WITHOUT sides included - charge full price for any fries
                    if (item.customization.fries !== 'none' && friesOption.priceAddon > 0) {
                        const friesAddon = friesOption.priceAddon * item.quantity;
                        total += friesAddon;
                        console.log(`  + fries addon: €${friesAddon.toFixed(2)} (${friesOption.name})`);
                    }
                }
            }
        }

        // Handle extras pricing - use hardcoded price
        if (item.customization?.extras?.length > 0) {
            const extraPrice = 0.30; // Hardcoded to match order page
            const extrasAddon = item.customization.extras.length * extraPrice * item.quantity;
            total += extrasAddon;
            console.log(`  + extras: €${extrasAddon.toFixed(2)} (${item.customization.extras.length} items)`);
        }

        console.log(`  = TOTAL: €${total.toFixed(2)}`);
        return total;
    }

    /**
     * Update cart display 
     */
    updateCartDisplay() {
        const cartContainer = document.getElementById('cartItems');
        if (!cartContainer) return;

        if (this.state.cart.length === 0) {
            cartContainer.innerHTML = '<p class="empty-cart">A kosár üres</p>';
            return;
        }

        console.log('=== CART DISPLAY UPDATE ===');

        cartContainer.innerHTML = this.state.cart.map(item => {
            const imgSrc = item.image || item.imageUrl || 'photos/default-food.jpg';
            const safeName = this.sanitizeInput(item.name);

            // Generate customization text
            const customizationText = this.getItemCustomizationsText(item);

            // IMPORTANT: Use the same calculateItemTotal method
            const itemTotal = this.calculateItemTotal(item);

            const safeNotes = item.specialNotes ? `<p class="item-special-notes">${this.sanitizeInput(item.specialNotes)}</p>` : '';
        
            const nonCustomizableCategories = ['sides', 'nonalcoholic', 'sauces', 'drink'];

            // Check if item should have edit button
            const itemCategory = this.getItemCategory(item.originalId || item.id);

            // ADD DEBUGGING HERE
            console.log(`Item: ${item.name}, ID: ${item.originalId || item.id}, Category: ${itemCategory}, Item object:`, item);

            const canBeCustomized = !nonCustomizableCategories.includes(itemCategory) && itemCategory !== 'drink';

            console.log(`Can be customized: ${canBeCustomized}`);

            return `
                <div class="cart-item-checkout-js" data-item-id="${item.id}">
                    <img src="${imgSrc}" 
                         alt="${safeName}" 
                         class="cart-item-image-checkout-js"
                         onerror="if (!this.dataset.fallback) { this.dataset.fallback = 'true'; this.src='photos/default-food.jpg'; }">
                    <div class="item-details-checkout-js">
                        <h4 class="item-name-checkout-js">${safeName}</h4>
                        ${customizationText ? `<p class="item-description-checkout-js">${customizationText}</p>` : ''}
                        ${safeNotes}
                    </div>
                    <div class="item-quantity-price-checkout-js">
                        <span class="item-quantity-checkout-js">${item.quantity}x</span>
                        <span class="item-price-checkout-js">€${itemTotal.toFixed(2)}</span>
                    </div>
                    <div class="item-actions-checkout-js">
                        ${canBeCustomized ? `<button class="edit-item-btn-checkout-js" onclick="checkout.editItem('${item.id}')">Szerkesztés</button>` : ''}
                        <button class="remove-item-btn-checkout-js" onclick="checkout.removeItemFromCart('${item.id}')">Eltávolítás</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get the category slug for a given item ID (same as order page)
     */
    getItemCategory(itemId) {
        console.log('Getting category for itemId:', itemId);
        
        // Handle drink items added from suggestions (these work correctly)
        if (typeof itemId === 'string' && itemId.includes('drink')) {
            console.log('Detected as drink from ID pattern');
            return 'nonalcoholic';
        }
    
        // Find the item in cart and get its stored category
        const item = this.state.cart.find(cartItem => 
            cartItem.id === itemId || 
            cartItem.originalId === itemId || 
            cartItem.originalId == itemId ||
            cartItem.id == itemId
        );
    
        if (item && item.category) {
            console.log('Found category from stored item:', item.category);
            return item.category;
        }
    
        console.log('No category found, returning null');
        return null;
    }

    /**
     * Update order summary using consistent calculations
     */
    updateOrderSummary() {
        const subtotal = this.calculateSubtotal();
        const packagingFee = this.config.packagingFee;
        const deliveryFee = this.state.orderType === 'delivery' ? this.config.deliveryFee : 0;
        const total = subtotal + packagingFee + deliveryFee;

        console.log('=== ORDER SUMMARY ===');
        console.log(`Subtotal: €${subtotal.toFixed(2)}`);
        console.log(`Packaging: €${packagingFee.toFixed(2)}`);
        console.log(`Delivery: €${deliveryFee.toFixed(2)}`);
        console.log(`Total: €${total.toFixed(2)}`);

        // Update display elements
        const subtotalEl = document.getElementById('subtotal');
        const packagingFeeEl = document.getElementById('packagingFee');
        const deliveryFeeEl = document.getElementById('deliveryFee');
        const totalAmountEl = document.getElementById('totalAmount');
        const finalAmountEl = document.getElementById('finalAmount');

        if (subtotalEl) subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
        if (packagingFeeEl) packagingFeeEl.textContent = `€${packagingFee.toFixed(2)}`;
        if (deliveryFeeEl) deliveryFeeEl.textContent = `€${deliveryFee.toFixed(2)}`;
        if (totalAmountEl) totalAmountEl.textContent = `€${total.toFixed(2)}`;
        if (finalAmountEl) finalAmountEl.textContent = `€${total.toFixed(2)}`;

        // Update Stripe amount if payment method is stripe
        if (this.state.paymentMethod === 'stripe') {
            this.updateStripeAmount();
        }
    }


    /**
     * Calculate subtotal using the same calculateItemTotal method
     */
    calculateSubtotal() {
        return this.state.cart.reduce((sum, item) => {
            return sum + this.calculateItemTotal(item);
        }, 0);
    }

    /**
     * Setup modal controls for item editing
     */
    setupModalControls() {
        const modal = document.getElementById('customizationModal');
        const closeBtn = document.getElementById('closeCustomizationModal');
        const saveBtn = document.getElementById('addToCartModalBtn');
        const increaseBtn = document.getElementById('increaseQuantity');
        const decreaseBtn = document.getElementById('decreaseQuantity');
    
        if (closeBtn) closeBtn.addEventListener('click', this.closeModal.bind(this));
        if (saveBtn) saveBtn.addEventListener('click', this.saveItemChanges.bind(this));
        if (increaseBtn) increaseBtn.addEventListener('click', () => this.updateQuantity(1));
        if (decreaseBtn) decreaseBtn.addEventListener('click', () => this.updateQuantity(-1));
    
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    /**
     * Edit cart item
     */
    editItem(itemId) {
        const item = this.state.cart.find(i => i.id === itemId);
        if (!item) return;

        this.openCustomizationModal(item);
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('customizationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.currentItem = null;
    }

    /**
     * Increase quantity in modal
     */
    increaseQuantity() {
        const qtyDisplay = document.getElementById('currentQty');
        if (qtyDisplay) {
            const currentQty = parseInt(qtyDisplay.textContent);
            if (currentQty < 10) { // Max quantity limit
                qtyDisplay.textContent = currentQty + 1;
            }
        }
    }

    /**
     * Decrease quantity in modal
     */
    decreaseQuantity() {
        const qtyDisplay = document.getElementById('currentQty');
        if (qtyDisplay) {
            const currentQty = parseInt(qtyDisplay.textContent);
            if (currentQty > 1) {
                qtyDisplay.textContent = currentQty - 1;
            }
        }
    }

    /**
     * Save item changes
     */
    saveItemChanges() {
        if (!this.currentItem) return;

        // Get the current item in cart
        const cartItem = this.state.cart.find(item => item.id === this.currentItem.id);
        if (!cartItem) return;

        // Update quantity from modal
        const quantityDisplay = document.getElementById('quantityDisplay');
        if (quantityDisplay) {
            cartItem.quantity = parseInt(quantityDisplay.textContent) || 1;
        }

        //Always update customizations for all items (no category restrictions)
        cartItem.customization = {
            sauce: document.querySelector('input[name="sauce"]:checked')?.value || null,
            fries: document.querySelector('input[name="fries"]:checked')?.value || null,
            extras: Array.from(document.querySelectorAll('input[name="extras"]:checked')).map(input => input.value),
            removeInstructions: document.getElementById('removeInstructions')?.value.trim() || '',
            specialInstructions: document.getElementById('specialInstructions')?.value.trim() || ''
        };

        // Update displays
        this.updateCartDisplay();
        this.updateOrderSummary();
        this.saveCartToStorage();
        this.closeModal();

        this.showNotification('Tétel frissítve!', 'success');
    }

    /**
     * Remove item from cart
     */
    removeItemFromCart(itemId) {
        if (itemId === undefined && this.state.currentEditingItem) {
            itemId = this.state.currentEditingItem.id;
        }

        if (confirm('Biztosan eltávolítod ezt a tételt a kosárból?')) {
            // Find and remove item
            const itemIndex = this.state.cart.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                const removedItem = this.state.cart[itemIndex];
                this.state.cart.splice(itemIndex, 1);
                
                // If it was a drink, remove from added drinks
                if (removedItem.category === 'drink' && removedItem.originalId) {
                    const drinkIndex = this.state.addedDrinks.indexOf(removedItem.originalId);
                    if (drinkIndex !== -1) {
                        this.state.addedDrinks.splice(drinkIndex, 1);
                        
                        // Update drink suggestion UI
                        const drinkSuggestion = document.querySelector(`[data-drink-id="${removedItem.originalId}"]`);
                        if (drinkSuggestion) {
                            drinkSuggestion.classList.remove('selected');
                            const btn = drinkSuggestion.querySelector('.add-drink-btn');
                            if (btn) {
                                btn.textContent = 'Hozzáadás';
                                btn.disabled = false;
                            }
                        }
                    }
                }
            }

            this.updateCartDisplay();
            this.updateOrderSummary();
            this.validateForm();
            this.saveCartToStorage();
            this.closeModal();

            // Check if cart is now empty
            if (this.state.cart.length === 0) {
                this.redirectToOrderPage();
            } else {
                this.showNotification('Tétel eltávolítva!', 'success');
            }
        }
    }

    // ============================================
    // CUSTOMIZATION MODAL METHODS
    // ============================================

    openCustomizationModal(item) {
        if (!item) {
            console.error('Item not found');
            this.showNotification('Étel nem található!', 'error');
            return;
        }

        // Check if modal exists first
        const modal = document.getElementById('customizationModal');
        if (!modal) {
            console.error('Customization modal not found in HTML');
            this.showNotification('A szerkesztési ablak nem található!', 'error');
            return;
        }

        this.currentItem = {
            ...item,
            quantity: item.quantity || 1,
            customization: item.customization || {
                sauce: null,
                fries: item.includesSides ? 'regular-fries' : 'none',
                extras: [],
                removeInstructions: '',
                specialInstructions: ''
            }
        };

        // Populate modal header info
        const modalFoodName = document.getElementById('modalFoodName');
        const modalFoodDescription = document.getElementById('modalFoodDescription');
        const modalFoodPrice = document.getElementById('modalFoodPrice');
        const modalFoodImage = document.getElementById('modalFoodImage');

        if (modalFoodName) modalFoodName.textContent = item.name;
        if (modalFoodDescription) modalFoodDescription.textContent = item.description || '';
        if (modalFoodPrice) modalFoodPrice.textContent = `€${item.price.toFixed(2)}`;

        if (modalFoodImage && (item.image || item.imageUrl)) {
            modalFoodImage.src = item.image || item.imageUrl;
            modalFoodImage.alt = item.name;
        }

        const sauceSection = document.getElementById('sauceSection');
        const friesSection = document.getElementById('friesSection');
        const extrasSection = document.getElementById('extrasSection');

        // Check that sections exist
        if (!sauceSection || !friesSection || !extrasSection) {
            console.error('Modal sections not found in HTML');
            this.showNotification('A szerkesztési űrlap nem található!', 'error');
            return;
        }

        // NEW LOGIC: Flexible customization sections

        // 1. EXTRAS: Always available for all items
        extrasSection.style.display = 'block';
        this.renderExtrasOptions();
        console.log('✅ Extras section shown for all items');

        // 2. FRIES: Available for most items (pricing logic handled in calculation)
        friesSection.style.display = 'block';
        this.renderFriesOptions();
        console.log('✅ Fries section shown for all items');

        // 3. SAUCE: Only for items with includesSides = true
        if (item.includesSides) {
            sauceSection.style.display = 'block';
            this.renderSauceOptions();
            console.log('✅ Sauce section shown for includesSides item:', item.name);
        } else {
            sauceSection.style.display = 'none';
            console.log('❌ Sauce section hidden for non-includesSides item:', item.name);
        }

        // Setup form validation AFTER rendering options
        this.setupModalFormValidation();

        // Populate existing customization data
        this.populateExistingCustomization();

        // Reset form to clean state
        this.resetCustomizationForm();

        // Update total after DOM is ready
        setTimeout(() => {
            this.updateModalTotal();
        }, 50);

        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Focus handling - focus first available input
        setTimeout(() => {
            if (item.includesSides) {
                // Focus sauce selection for items with sides
                const firstSauceOption = document.querySelector('input[name="sauce"]');
                if (firstSauceOption) {
                    firstSauceOption.focus();
                }
            } else {
                // Focus fries selection for items without sides
                const firstFriesOption = document.querySelector('input[name="fries"]');
                if (firstFriesOption) {
                    firstFriesOption.focus();
                }
            }
        }, 300);
    }

    renderSauceOptions() {
        const sauceContainer = document.getElementById('sauceOptions');
        if (!sauceContainer || !this.customizationOptions?.sauces) return;

        sauceContainer.innerHTML = this.customizationOptions.sauces.map(sauce => `
            <label class="sauce-option">
                <input type="radio" name="sauce" value="${sauce.slug}" ${sauce.isDefault ? 'checked' : ''} required>
                <span class="sauce-label">${sauce.name}</span>
            </label>
        `).join('');
    }

    renderFriesOptions() {
        const friesContainer = document.getElementById('friesOptions');
        if (!friesContainer || !this.customizationOptions?.friesOptions) return;

        let optionsHTML = '';

        if (this.currentItem.includesSides) {
            // Items WITH sides included - regular fries free, others show addon price
            optionsHTML = this.customizationOptions.friesOptions.map(option => {
                const isRegularFries = option.slug === 'regular-fries';
                const priceLabel = isRegularFries ? 'Alapár' : `+€${option.priceAddon.toFixed(2)}`;
                const isChecked = isRegularFries ? 'checked' : '';

                return `
                    <label class="upgrade-option">
                        <input type="radio" name="fries" value="${option.slug}" ${isChecked}>
                        <span class="upgrade-label">
                            <span class="upgrade-name">${option.name}</span>
                            <span class="upgrade-price">${priceLabel}</span>
                        </span>
                    </label>
                `;
            }).join('');
        } else {
            // Items WITHOUT sides included - add "no sides" option + full prices for fries
            optionsHTML = `
                <label class="upgrade-option">
                    <input type="radio" name="fries" value="none" checked>
                    <span class="upgrade-label">
                        <span class="upgrade-name">Nem kérek köretet</span>
                        <span class="upgrade-price">Alapár</span>
                    </span>
                </label>
            `;

            // Add all fries options with their full addon prices
            optionsHTML += this.customizationOptions.friesOptions.map(option => `
                <label class="upgrade-option">
                    <input type="radio" name="fries" value="${option.slug}">
                    <span class="upgrade-label">
                        <span class="upgrade-name">${option.name}</span>
                        <span class="upgrade-price">+€${option.priceAddon.toFixed(2)}</span>
                    </span>
                </label>
            `).join('');
        }

        friesContainer.innerHTML = optionsHTML;
    }

    renderExtrasOptions() {
        const extrasContainer = document.getElementById('extrasOptions');
        if (!extrasContainer) return;

        // If API has extras, use them
        if (this.customizationOptions?.extras && this.customizationOptions.extras.length > 0) {
            extrasContainer.innerHTML = this.customizationOptions.extras.map(extra => `
                <label class="extra-option">
                    <input type="checkbox" name="extras" value="${extra.slug}">
                    <span class="extra-label">
                        <span class="extra-name">${extra.name}</span>
                        <span class="extra-price">+€${extra.price.toFixed(2)}</span>
                    </span>
                </label>
            `).join('');
        } else {
            // Fallback to hardcoded extras (same as order page)
            extrasContainer.innerHTML = `
                <label class="extra-option">
                    <input type="checkbox" name="extras" value="bacon">
                    <span class="extra-label">
                        <span class="extra-name">Extra Bacon</span>
                        <span class="extra-price">+€0.30</span>
                    </span>
                </label>
                <label class="extra-option">
                    <input type="checkbox" name="extras" value="cheese">
                    <span class="extra-label">
                        <span class="extra-name">Extra Sajt</span>
                        <span class="extra-price">+€0.30</span>
                    </span>
                </label>
                <label class="extra-option">
                    <input type="checkbox" name="extras" value="tomato">
                    <span class="extra-label">
                        <span class="extra-name">Extra Paradicsom</span>
                        <span class="extra-price">+€0.30</span>
                    </span>
                </label>
                <label class="extra-option">
                    <input type="checkbox" name="extras" value="onion">
                    <span class="extra-label">
                        <span class="extra-name">Extra Hagyma</span>
                        <span class="extra-price">+€0.30</span>
                    </span>
                </label>
                <label class="extra-option">
                    <input type="checkbox" name="extras" value="lettuce">
                    <span class="extra-label">
                        <span class="extra-name">Extra Saláta</span>
                        <span class="extra-price">+€0.30</span>
                    </span>
                </label>
                <label class="extra-option">
                    <input type="checkbox" name="extras" value="pickle">
                    <span class="extra-label">
                        <span class="extra-name">Extra Savanyúság</span>
                        <span class="extra-price">+€0.30</span>
                    </span>
                </label>
            `;
        }
    }

    populateExistingCustomization() {
        if (!this.currentItem.customization) return;

        document.getElementById('quantityDisplay').textContent = this.currentItem.quantity;

        if (this.currentItem.customization.sauce) {
            const sauceInput = document.querySelector(`input[name="sauce"][value="${this.currentItem.customization.sauce}"]`);
            if (sauceInput) sauceInput.checked = true;
        }

        if (this.currentItem.customization.fries) {
            const friesInput = document.querySelector(`input[name="fries"][value="${this.currentItem.customization.fries}"]`);
            if (friesInput) friesInput.checked = true;
        }

        if (this.currentItem.customization.extras) {
            this.currentItem.customization.extras.forEach(extra => {
                const extraInput = document.querySelector(`input[name="extras"][value="${extra}"]`);
                if (extraInput) extraInput.checked = true;
            });
        }

        document.getElementById('removeInstructions').value = this.currentItem.customization.removeInstructions || '';
        document.getElementById('specialInstructions').value = this.currentItem.customization.specialInstructions || '';
    }

    resetCustomizationForm() {
        document.getElementById('quantityDisplay').textContent = this.currentItem.quantity;

        document.querySelectorAll('input[name="extras"]').forEach(input => {
            input.checked = false;
        });

        const sauceInputs = document.querySelectorAll('input[name="sauce"]');
        sauceInputs.forEach(input => input.checked = input.hasAttribute('checked'));

        const regularFries = document.querySelector('input[name="fries"][value="regular"]');
        if (regularFries) regularFries.checked = true;

        this.updateQuantityButtons();
        this.updateAddToCartButtonState();
    }

    updateModalTotal() {
        if (!this.currentItem) return;

        let total = this.currentItem.price * this.currentItem.quantity;

        const selectedFries = document.querySelector('input[name="fries"]:checked');
        if (selectedFries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === selectedFries.value);
            if (friesOption) {
                if (this.currentItem.includesSides) {
                    // Items WITH sides included - regular fries are FREE, only charge for upgrades
                    if (friesOption.slug !== 'regular-fries' && friesOption.priceAddon > 0) {
                        total += friesOption.priceAddon * this.currentItem.quantity;
                    }
                    // Regular fries add €0.00 - they're included for free
                } else {
                    // Items WITHOUT sides included - charge full price for any fries
                    if (selectedFries.value !== 'none' && friesOption.priceAddon > 0) {
                        total += friesOption.priceAddon * this.currentItem.quantity;
                    }
                }
            }
        }

        const selectedExtras = document.querySelectorAll('input[name="extras"]:checked');
        if (selectedExtras.length > 0) {
            const extraPrice = 0.30;
            total += selectedExtras.length * extraPrice * this.currentItem.quantity;
        }

        document.getElementById('modalTotalPrice').textContent = `€${total.toFixed(2)}`;
    }

    updateAddToCartButtonState() {
        const addToCartBtn = document.getElementById('addToCartModalBtn');
        const sauceSelected = document.querySelector('input[name="sauce"]:checked');

        if (addToCartBtn) {
            if (this.currentItem?.includesSides) {
                addToCartBtn.disabled = !sauceSelected;
            } else {
                addToCartBtn.disabled = false;
            }
        }
    }

    setupModalFormValidation() {
        const modalContainer = document.getElementById('customizationModal');
        
        // Add null check to prevent error
        if (!modalContainer) {
            console.error('Customization modal not found in DOM');
            return;
        }
        
        modalContainer.addEventListener('change', (e) => {
            if (e.target.matches('input[name="sauce"], input[name="fries"], input[name="extras"]')) {
                this.updateModalTotal();
                this.updateAddToCartButtonState();
            }
        });
    }

    updateQuantityButtons() {
        const decreaseBtn = document.getElementById('decreaseQuantity');
        const increaseBtn = document.getElementById('increaseQuantity');

        if (decreaseBtn) decreaseBtn.disabled = this.currentItem.quantity <= 1;
        if (increaseBtn) increaseBtn.disabled = this.currentItem.quantity >= 10;
    }

    updateQuantity(change) {
        if (!this.currentItem) return;

        const newQuantity = Math.max(1, this.currentItem.quantity + change);
        this.currentItem.quantity = newQuantity;

        document.getElementById('quantityDisplay').textContent = newQuantity;
        this.updateQuantityButtons();
        this.updateModalTotal();
    }


    /**
     * Validate individual form field
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        if (field.required && !value) {
            isValid = false;
            errorMessage = 'Ez a mező kötelező';
        } else {
            switch (field.type) {
                case 'email':
                    if (value && !this.isValidEmail(value)) {
                        isValid = false;
                        errorMessage = 'Érvénytelen email cím';
                    }
                    break;
                case 'tel':
                    if (value && !this.isValidPhone(value)) {
                        isValid = false;
                        errorMessage = 'Érvénytelen telefonszám';
                    }
                    break;
            }

            // Postal code validation for Slovakia
            if (field.id === 'postalCode' && value && !this.isValidSlovakPostalCode(value)) {
                isValid = false;
                errorMessage = 'Érvénytelen szlovákiai irányítószám';
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = 'var(--rustic-red)';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorElement);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Format phone number as user types
     */
    formatPhoneNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        
        // Slovak phone number format: +421 xxx xxx xxx
        if (value.startsWith('421')) {
            value = value.substring(3);
        }
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `+421 ${value}`;
            } else if (value.length <= 6) {
                value = `+421 ${value.substring(0, 3)} ${value.substring(3)}`;
            } else {
                value = `+421 ${value.substring(0, 3)} ${value.substring(3, 6)} ${value.substring(6, 9)}`;
            }
        }
        
        event.target.value = value;
    }

    /**
     * Validate email format
     */
    validateEmail(event) {
        const email = event.target.value;
        const isValid = this.isValidEmail(email);
        
        if (email && !isValid) {
            this.showFieldError(event.target, 'Érvénytelen email formátum');
        } else {
            this.clearFieldError(event.target);
        }
    }

    /**
     * Check if email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if phone number is valid (Slovak format)
     */
    isValidPhone(phone) {
        const phoneRegex = /^\+421\s\d{3}\s\d{3}\s\d{3}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Validate Slovak postal code
     */
    validatePostalCode(event) {
        const postalCode = event.target.value;
        const isValid = this.isValidSlovakPostalCode(postalCode);

        if (postalCode && !isValid) {
            // Check if it's 5 digits but not in delivery area
            const isFiveDigits = /^\d{5}$/.test(postalCode);
            if (isFiveDigits) {
                // Valid format but wrong delivery area
                this.showFieldError(
                    event.target, 
                    `Sajnáljuk, jelenleg csak ${this.allowedPostalCodes.join(' és ')} irányítószámokba szállítunk`
                );
            } else {
                // Invalid format
                this.showFieldError(event.target, 'Érvénytelen irányítószám formátum (5 számjegy szükséges)');
            }
        } else {
            this.clearFieldError(event.target);
        }
    }

    /**
     * Check if Slovak postal code is valid
     */
    isValidSlovakPostalCode(postalCode) {
        // First check: Must be 5 digits
        const slovakPostalRegex = /^\d{5}$/;
        if (!slovakPostalRegex.test(postalCode)) {
            return false;
        }

        // Second check: Must be in allowed delivery area
        return this.allowedPostalCodes.includes(postalCode);
    }

    /**
     * Enhanced form validation with detailed feedback
     */
    validateForm() {
        const validationIssues = [];
        let isValid = true;

        // 1. Check cart
        if (this.state.cart.length === 0) {
            validationIssues.push({
                field: 'cart',
                message: 'A kosár üres',
                isValid: false
            });
            isValid = false;
        } else {
            validationIssues.push({
                field: 'cart',
                message: 'Kosár rendben',
                isValid: true
            });
        }

        // 2. Check minimum order amount
        const subtotal = this.calculateSubtotal();
        if (subtotal < this.config.minOrderAmount) {
            validationIssues.push({
                field: 'minOrder',
                message: `Minimum rendelési összeg: €${this.config.minOrderAmount.toFixed(2)}`,
                isValid: false
            });
            isValid = false;
        }

        // 3. Validate customer information fields
        const customerFields = [
            { id: 'firstName', label: 'Keresztnév', required: true },
            { id: 'lastName', label: 'Vezetéknév', required: true },
            { id: 'phone', label: 'Telefonszám', required: true, type: 'phone' },
            { id: 'email', label: 'Email cím', required: true, type: 'email' }
        ];

        customerFields.forEach(fieldConfig => {
            const field = document.getElementById(fieldConfig.id);
            if (!field) return;

            const value = field.value.trim();
            let fieldValid = true;
            let errorMessage = '';

            // Check if required and empty
            if (fieldConfig.required && !value) {
                fieldValid = false;
                errorMessage = `${fieldConfig.label} kötelező`;
            } 
            // Validate specific field types
            else if (value) {
                if (fieldConfig.type === 'email' && !this.isValidEmail(value)) {
                    fieldValid = false;
                    errorMessage = 'Érvénytelen email formátum (példa@domain.com)';
                } else if (fieldConfig.type === 'phone' && !this.isValidPhone(value)) {
                    fieldValid = false;
                    errorMessage = 'Telefonszám formátum: +421 XXX XXX XXX';
                }
            }

            // Update field UI
            if (!fieldValid) {
                this.showFieldError(field, errorMessage);
                field.classList.add('invalid');
                field.classList.remove('valid');
                validationIssues.push({
                    field: fieldConfig.id,
                    message: errorMessage,
                    isValid: false
                });
                isValid = false;
            } else if (value) {
                this.clearFieldError(field);
                this.showFieldSuccess(field);
                field.classList.add('valid');
                field.classList.remove('invalid');
            }
        });

        // 4. Validate delivery fields (only if delivery selected)
        if (this.state.orderType === 'delivery') {
            const deliveryFields = [
                { id: 'street', label: 'Utca és házszám', required: true },
                { id: 'city', label: 'Város', required: true },
                { id: 'postalCode', label: 'Irányítószám', required: true, type: 'postal' }
            ];

            deliveryFields.forEach(fieldConfig => {
                const field = document.getElementById(fieldConfig.id);
                if (!field) return;

                const value = field.value.trim();
                let fieldValid = true;
                let errorMessage = '';

                if (fieldConfig.required && !value) {
                    fieldValid = false;
                    errorMessage = `${fieldConfig.label} kötelező szállításhoz`;
                } else if (value && fieldConfig.type === 'postal') {
                    if (!this.isValidSlovakPostalCode(value)) {
                        fieldValid = false;
                        errorMessage = `Csak ${this.allowedPostalCodes.join(' és ')} irányítószámokba szállítunk`;
                    }
                }

                if (!fieldValid) {
                    this.showFieldError(field, errorMessage);
                    field.classList.add('invalid');
                    field.classList.remove('valid');
                    validationIssues.push({
                        field: fieldConfig.id,
                        message: errorMessage,
                        isValid: false
                    });
                    isValid = false;
                } else if (value) {
                    this.clearFieldError(field);
                    this.showFieldSuccess(field);
                    field.classList.add('valid');
                    field.classList.remove('invalid');
                }
            });
        }

        // 5. Check payment method selection
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethod) {
            validationIssues.push({
                field: 'payment',
                message: 'Válassz fizetési módot',
                isValid: false
            });
            isValid = false;
        } else {
            validationIssues.push({
                field: 'payment',
                message: 'Fizetési mód kiválasztva',
                isValid: true
            });
        }

        // 6. Check legal checkboxes
        const termsAccept = document.getElementById('termsAccept');
        const privacyAccept = document.getElementById('privacyAccept');

        if (!termsAccept?.checked) {
            validationIssues.push({
                field: 'terms',
                message: 'Általános Szerződési Feltételek elfogadása kötelező',
                isValid: false
            });
            isValid = false;
        }

        if (!privacyAccept?.checked) {
            validationIssues.push({
                field: 'privacy',
                message: 'Adatvédelmi Tájékoztató elfogadása kötelező',
                isValid: false
            });
            isValid = false;
        }

        // Update validation summary display
        this.updateValidationSummary(validationIssues);

        // Update place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = !isValid;
        }

        return isValid;
    }

    /**
     * Show field success indicator
     */
    showFieldSuccess(field) {
        // Remove existing success message
        const existingSuccess = field.parentNode.querySelector('.field-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        // Add success checkmark
        const successElement = document.createElement('div');
        successElement.className = 'field-success';
        successElement.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>Rendben</span>
        `;

        field.parentNode.appendChild(successElement);
    }

    /**
     * Update validation summary display
     */
    updateValidationSummary(issues) {
        const summaryContainer = document.getElementById('validationSummary');
        const validationList = document.getElementById('validationList');

        if (!summaryContainer || !validationList) return;

        // Filter to show only invalid issues
        const invalidIssues = issues.filter(issue => !issue.isValid);

        if (invalidIssues.length === 0) {
            summaryContainer.style.display = 'none';
            return;
        }

        // Show summary
        summaryContainer.style.display = 'block';

        // Build list HTML
        validationList.innerHTML = invalidIssues.map(issue => `
            <li class="invalid">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>${this.sanitizeInput(issue.message)}</span>
            </li>
        `).join('');
    }

    /**
     * Handle place order
     */
    async handlePlaceOrder() {
        if (!this.validateForm()) {
            this.showNotification('Kérjük, töltsd ki az összes kötelező mezőt!', 'error');
            return;
        }

        // Check payment method and route accordingly
        if (this.state.paymentMethod === 'stripe') {
            await this.processStripePayment();
        } else {
            await this.processCashOrder();
        }
    }

    /**
     * Process Stripe payment
     */
    async processStripePayment() {
        if (!this.stripe || !this.paymentElement) {
            this.showNotification('Card payment not available', 'error');
            return;
        }

        this.setLoadingState(true);

        try {
            const orderData = this.prepareOrderData();
            const total = this.calculateTotal();

            console.log('💰 Processing payment for total:', total);

            // Step 1: Submit the payment element
            console.log('📤 Submitting payment element...');
            const {error: submitError} = await this.stripeElements.submit();

            if (submitError) {
                console.error('❌ Payment element submission error:', submitError);
                throw new Error(submitError.message);
            }

            // Step 2: Create payment intent
            console.log('📤 Creating payment intent...');
            const paymentIntentResponse = await fetch(`${this.config.apiBaseUrl}/stripe/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: total,
                    currency: 'eur',
                    orderData: {
                        customerName: orderData.customerName,
                        customerEmail: orderData.customerEmail,
                        customerPhone: orderData.customerPhone,
                        orderType: orderData.orderType,
                        deliveryAddress: orderData.deliveryAddress
                    }
                })
            });

            const paymentIntent = await paymentIntentResponse.json();

            if (!paymentIntent.success) {
                throw new Error(paymentIntent.error || 'Failed to create payment intent');
            }

            // Step 3: Confirm payment WITHOUT redirect
            console.log('🔐 Confirming payment...');
            const {error: confirmError, paymentIntent: confirmedPI} = await this.stripe.confirmPayment({
                elements: this.stripeElements,
                clientSecret: paymentIntent.data.clientSecret,
                redirect: 'if_required', // This prevents automatic redirect
                confirmParams: {
                    return_url: `${window.location.origin}/order-confirmation.html`
                }
            });

            if (confirmError) {
                console.error('❌ Payment confirmation error:', confirmError);
                throw new Error(confirmError.message);
            }

            // Check payment status
            if (confirmedPI && confirmedPI.status === 'succeeded') {
                console.log('✅ Payment confirmed successfully!');
            } else {
                console.log('⚠️ Payment status:', confirmedPI?.status);
            }

            // Step 4: Create order (this should now execute)
            console.log('📋 Creating order...');
            const confirmResponse = await fetch(`${this.config.apiBaseUrl}/stripe/confirm-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentIntentId: paymentIntent.data.paymentIntentId,
                    orderData: orderData
                })
            });

            console.log('📋 Response status:', confirmResponse.status);

            if (!confirmResponse.ok) {
                const errorText = await confirmResponse.text();
                console.error('📋 Response error:', errorText);
                throw new Error(`Order creation failed: ${confirmResponse.status}`);
            }

            const confirmResult = await confirmResponse.json();
            console.log('📋 Order creation response:', confirmResult);

            if (confirmResult.success) {
                console.log('🎉 Order created successfully!');
                this.clearCartFromStorage();
                window.location.href = `/order-confirmation.html?order=${confirmResult.data.orderNumber}`;
            } else {
                throw new Error(confirmResult.error || 'Failed to create order');
            }

        } catch (error) {
            console.error('❌ Stripe payment error:', error);
            this.showNotification(error.message || 'Payment failed. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Process cash order 
     */
    async processCashOrder() {
        const orderData = this.prepareOrderData();

        this.setLoadingState(true);

        try {
            const response = await this.submitOrder(orderData);

            if (response.success) {
                this.clearCartFromStorage();
                window.location.href = `/order-confirmation.html?order=${response.data.orderNumber}`;
            } else {
                throw new Error(response.message || 'Hiba történt a rendelés leadásakor');
            }
        } catch (error) {
            console.error('Order submission error:', error);
            this.showNotification('Hiba történt a rendelés leadásakor. Kérjük, próbáld újra!', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Prepare order data for submission
     */
    prepareOrderData() {
        const formData = this.collectFormData();

        return {
            // Customer information (backend format)
            customerName: `${this.sanitizeInput(formData.firstName)} ${this.sanitizeInput(formData.lastName)}`.trim(),
            customerPhone: formData.phone,
            customerEmail: formData.email || null,

            // Order type and payment
            orderType: this.state.orderType.toUpperCase(), // 'PICKUP' or 'DELIVERY'
            paymentMethod: this.state.paymentMethod.toUpperCase(), // 'CASH' or 'CARD' (for future)

            // Delivery information (only if delivery)
            deliveryAddress: this.state.orderType === 'delivery' ? 
                `${this.sanitizeInput(formData.street)}, ${this.sanitizeInput(formData.city)} ${formData.postalCode}`.trim() : null,
            deliveryNotes: this.state.orderType === 'delivery' ? 
                this.sanitizeInput(formData.deliveryNotes || '') || null : null,

            // Scheduled time (if not ASAP)
            scheduledFor: this.getScheduledDateTime(),

            // Order items (backend format)
            items: this.state.cart.map(item => {
                // Extract menu item ID (remove any prefixes like 'drink-')
                let menuItemId = item.originalId || item.id;
                if (typeof menuItemId === 'string' && menuItemId.includes('-')) {
                    // Try to extract numeric ID from strings like 'drink-123' or 'PCB-123-456'
                    const numericMatch = menuItemId.match(/\d+/);
                    menuItemId = numericMatch ? parseInt(numericMatch[0]) : parseInt(menuItemId);
                }

                return {
                    menuItemId: parseInt(menuItemId),
                    quantity: item.quantity,
                    selectedSauce: item.customization?.sauce || null,
                    friesUpgrade: item.customization?.fries === 'regular' ? null : item.customization?.fries || null,
                    extras: item.customization?.extras || [],
                    removeItems: item.customization?.removeInstructions ? 
                        [item.customization.removeInstructions] : [],
                    specialNotes: this.sanitizeInput(
                        item.customization?.specialInstructions || 
                        item.specialNotes || 
                        ''
                    ) || null
                };
            }),

            // General order notes
            specialNotes: null // Can be used for overall order notes if needed
        };
    }

    /**
     * Collect form data
     */
    collectFormData() {
        const formFields = ['firstName', 'lastName', 'phone', 'email', 'street', 'city', 'postalCode', 'deliveryNotes'];
        const data = {};
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                data[fieldId] = field.value.trim();
            }
        });
        
        return data;
    }

    /**
     * Get scheduled date time if selected
     */
    getScheduledDateTime() {
        if (this.state.selectedTime !== 'scheduled') return null;

        // Get the time input element (this exists in your HTML)
        const timeInput = document.getElementById('orderTimeInput');

        if (timeInput?.value && timeInput.value.length === 5) {
            // Use the stored scheduledTime from state (set in validateTimeInput)
            if (this.state.scheduledTime) {
                return this.state.scheduledTime;
            }

            // Fallback: create date from input value
            const timeValue = timeInput.value.trim();
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

            if (timeRegex.test(timeValue)) {
                return this.createDateFromTime(timeValue, true);
            }
        }

        return null;
    }

    /**
     * Generate unique order ID
     */
    generateOrderId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `PCB-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * Submit order to backend
     */
    async submitOrder(orderData) {
        try {
            console.log('Submitting order:', orderData);
            
            const response = await fetch(`${this.config.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error submitting order:', error);
            throw error;
        }
    }

    /**
     * Set loading state for place order button
     */
    setLoadingState(isLoading) {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const btnText = placeOrderBtn?.querySelector('.btn-text');
        const btnIcon = placeOrderBtn?.querySelector('.btn-icon');
        
        if (placeOrderBtn) {
            placeOrderBtn.disabled = isLoading;
            
            if (isLoading) {
                if (btnText) btnText.textContent = 'Rendelés leadása...';
                if (btnIcon) btnIcon.style.display = 'none';
                placeOrderBtn.classList.add('loading');
            } else {
                if (btnText) btnText.textContent = 'Rendelés leadása';
                if (btnIcon) btnIcon.style.display = 'block';
                placeOrderBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${this.sanitizeInput(message)}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            right: 2rem;
            background: ${type === 'error' ? 'var(--rustic-red)' : type === 'success' ? 'var(--eucalyptus-green)' : 'var(--blackwash)'};
            color: var(--cream-white);
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Save cart data to localStorage
     */
    saveCartToStorage() {
        try {
            const cartData = {
                items: this.state.cart,
                orderType: this.state.orderType,
                selectedTime: this.state.selectedTime,
                timestamp: Date.now()
            };
            localStorage.setItem('palace_order_cart', JSON.stringify(cartData));
        } catch (error) {
            console.warn('Could not save cart to localStorage:', error);
        }
    }

    /**
     * Clear cart from storage
     */
    clearCartFromStorage() {
        try {
            localStorage.removeItem('palace_order_cart');
        } catch (error) {
            console.warn('Could not clear cart from localStorage:', error);
        }
    }
}

// Initialize checkout system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.checkout = new PalaceCheckout();
        
        // Save cart periodically
        setInterval(() => {
            if (window.checkout) {
                window.checkout.saveCartToStorage();
            }
        }, 30000); // Every 30 seconds
        
    } catch (error) {
        console.error('Failed to initialize Palace Checkout:', error);
        
        // Fallback notification
        const fallbackNotification = document.createElement('div');
        fallbackNotification.innerHTML = `
            <div style="position: fixed; top: 120px; right: 2rem; background: #dc3545; color: white; padding: 1rem; border-radius: 5px; z-index: 10000;">
                Hiba történt az oldal betöltésekor. Kérjük, frissítsd az oldalt!
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; float: right; cursor: pointer;">×</button>
            </div>
        `;
        document.body.appendChild(fallbackNotification);
    }
});

// Add notification animations to head
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .place-order-btn.loading {
        position: relative;
        overflow: hidden;
    }
    
    .place-order-btn.loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        animation: loading-shimmer 1.5s infinite;
    }
    
    @keyframes loading-shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
    }
`;

document.head.appendChild(notificationStyles);