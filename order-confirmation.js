/**
 * Palace Cafe & Bar - Order Confirmation Page (FIXED)
 * Real-time order tracking with WebSocket integration
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

'use strict';

class OrderConfirmation {
    constructor() {
        this.config = {
            apiUrl: window.API_BASE_URL, 
            socketUrl: window.SOCKET_URL,
            refreshInterval: 30000, // 30 seconds
            maxRetries: 3,
            retryDelay: 2000
        };

        this.state = {
            orderNumber: null,
            orderData: null,
            isLoading: true,
            socket: null,
            retryCount: 0,
            lastUpdate: null
        };

        this.statusProgression = {
            PICKUP: [
                { key: 'PENDING', text: 'Elfogadásra vár', description: 'Rendelés feldolgozás alatt...' },
                { key: 'CONFIRMED', text: 'Elkészítés alatt', description: 'A konyhában készítjük...', hasTimer: true },
                { key: 'READY', text: 'Átvételre kész', description: 'Készen áll az átvételre!' },
                { key: 'DELIVERED', text: 'Sikeresen átvéve', description: 'Köszönjük a rendelést!' }
            ],
            DELIVERY: [
                { key: 'PENDING', text: 'Elfogadásra vár', description: 'Rendelés feldolgozás alatt...' },
                { key: 'CONFIRMED', text: 'Elkészítés alatt', description: 'A konyhában készítjük...', hasTimer: true },
                { key: 'READY', text: 'Kiszállításra kész', description: 'Becsomagolás és indulás...' },
                { key: 'OUT_FOR_DELIVERY', text: 'Úton van', description: 'A futár úton van hozzád!' },
                { key: 'DELIVERED', text: 'Sikeresen kiszállítva', description: 'Köszönjük a rendelést!' }
            ]
        };

        this.init();
    }

    /**
     * Initialize the order confirmation page
     */
    async init() {
        console.log('🚀 Initializing Order Confirmation...');
        
        try {
            // Get order number from URL
            this.getOrderNumberFromURL();
            
            if (!this.state.orderNumber) {
                this.showError('Rendelés szám nem található az URL-ben');
                return;
            }

            // Setup WebSocket connection for real-time updates
            this.setupWebSocket();

            this.initializeRollingStatus();
            
            // Load order data
            await this.loadOrderData();            

            // Setup periodic refresh as fallback
            this.setupPeriodicRefresh();
            
            console.log('✅ Order Confirmation initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Order Confirmation:', error);
            this.showError('Hiba történt az oldal betöltése során');
        }
    }

    /**
     * Extract order number from URL parameters
     */
    getOrderNumberFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        // Try both parameter names for compatibility
        this.state.orderNumber = urlParams.get('order') || 
                                 urlParams.get('orderNumber') ||
                                 urlParams.get('orderId');
        
        // Also check hash for order number
        if (!this.state.orderNumber && window.location.hash) {
            const hash = window.location.hash.substring(1);
            if (hash.startsWith('PCB-')) {
                this.state.orderNumber = hash;
            }
        }
        
        console.log('🔍 Order number from URL:', this.state.orderNumber);
    }

    /**
     * Setup WebSocket connection for real-time updates
     */
    setupWebSocket() {
        try {
            // Connect to Socket.io server
            this.state.socket = io(this.config.socketUrl);
            
            this.state.socket.on('connect', () => {
                console.log('🔌 WebSocket connected');
                this.updateConnectionStatus(true);
            });
            
            this.state.socket.on('disconnect', () => {
                console.log('🔌 WebSocket disconnected');
                this.updateConnectionStatus(false);
            });
            
            // Listen for order status updates
            this.state.socket.on('orderStatusUpdate', (updateData) => {
                console.log('📊 Order status update received:', updateData);
                this.handleOrderUpdate(updateData);
            });
            
            // Listen for order completion
            this.state.socket.on('orderCompleted', (orderData) => {
                console.log('✅ Order completion received:', orderData);
                this.handleOrderCompletion(orderData);
            });
            
        } catch (error) {
            console.warn('⚠️ WebSocket setup failed:', error);
            // Continue without WebSocket - will use periodic refresh
        }
    }

    /**
     * Load order data from API
     */
    async loadOrderData() {
        try {
            this.state.isLoading = true;
            this.showLoadingState();
            
            console.log('🔄 Loading order data for:', this.state.orderNumber);
            
            const response = await this.apiCall(`/orders/${this.state.orderNumber}/status`);
            
            console.log('📦 API Response:', response);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load order data');
            }
            
            this.state.orderData = response.data;
            this.state.lastUpdate = new Date();
            this.state.retryCount = 0; // Reset retry count on success
            
            console.log('📦 Order data loaded:', this.state.orderData);
            
            // Render the order information
            this.renderOrderData();
            
            this.state.isLoading = false;
            
        } catch (error) {
            console.error('❌ Failed to load order data:', error);
            this.handleLoadError(error);
        }
    }

    /**
     * Handle order status updates from WebSocket
     */
    handleOrderUpdate(updateData) {
        console.log('📊 WebSocket update received:', updateData);
        console.log('📊 Current order number:', this.state.orderNumber);

        // More robust order matching - check multiple possible field names
        const updateOrderNumber = updateData.orderNumber || updateData.order_number || updateData.id;
        const currentOrderNumber = this.state.orderNumber;

        console.log('📊 Comparing:', updateOrderNumber, 'vs', currentOrderNumber);

        // Match by orderNumber (preferred) or by ID as fallback
        const isMatchingOrder = updateOrderNumber === currentOrderNumber || 
                               updateData.id === this.state.orderData?.id ||
                               updateData.orderNumber === currentOrderNumber;

        if (isMatchingOrder) {
            console.log('✅ Order matches! Updating local data...');

            // Update local order data if we have it
            if (this.state.orderData) {
                // Update status
                if (updateData.status) {
                    this.state.orderData.status = updateData.status;
                    console.log('📊 Status updated to:', updateData.status);
                }

                // Update estimated time
                if (updateData.estimatedTime) {
                    this.state.orderData.estimatedTime = updateData.estimatedTime;
                    console.log('📊 Estimated time updated to:', updateData.estimatedTime);
                }

                // Update confirmation time
                if (updateData.confirmedAt) {
                    this.state.orderData.confirmedAt = updateData.confirmedAt;
                }

                // Update ready time
                if (updateData.readyAt) {
                    this.state.orderData.readyAt = updateData.readyAt;
                }

                // Update delivered time
                if (updateData.deliveredAt) {
                    this.state.orderData.deliveredAt = updateData.deliveredAt;
                }

                // Update last update timestamp
                this.state.lastUpdate = new Date();

                // Re-render status-related elements
                this.updateOrderStatus();
                this.updateTrackingInfo();

                // UPDATE THE ROLLING STATUS 
                this.updateRollingStatus();

                // Show appropriate toast message
                if (updateData.status === 'DELIVERED') {
                    this.showToast('Rendelés sikeresen teljesítve!', 'success');
                } else {
                    this.showToast('Rendelés állapot frissítve', 'success');
                }

            } else {
                // If we don't have order data yet, load it from API
                console.log('📊 No local order data, loading from API...');
                this.loadOrderData();
            }
        } else {
            console.log('❌ Order does not match. Ignoring update.');
            console.log('❌ Update order number:', updateOrderNumber);
            console.log('❌ Current order number:', currentOrderNumber);
        }
    }

    /**
     * Handle order completion
     */
    handleOrderCompletion(orderData) {
        console.log('🎉 Order completion received:', orderData);
        console.log('🎉 Current order number:', this.state.orderNumber);

        // More robust order matching for completion events too
        const completionOrderNumber = orderData.orderNumber || orderData.order_number || orderData.id;
        const currentOrderNumber = this.state.orderNumber;

        const isMatchingOrder = completionOrderNumber === currentOrderNumber || 
                               orderData.id === this.state.orderData?.id ||
                               orderData.orderNumber === currentOrderNumber;

        if (isMatchingOrder) {
            console.log('✅ Completion matches our order!');

            if (this.state.orderData) {
                this.state.orderData.status = 'DELIVERED';
                this.state.orderData.deliveredAt = orderData.deliveredAt;
                this.state.lastUpdate = new Date();

                this.updateOrderStatus();

                // ADD THIS LINE - Update the rolling status for completion
                this.updateRollingStatus();

                this.updateTrackingInfo();

                this.showToast('Rendelés sikeresen teljesítve!', 'success');
            } else {
                console.log('🎉 No local order data, loading from API...');
                this.loadOrderData();
            }
        } else {
            console.log('❌ Completion does not match our order. Ignoring.');
        }
    }

    /**
     * Render all order data to the page
     */
    renderOrderData() {
        if (!this.state.orderData) return;

        const order = this.state.orderData;

        // Update order number
        this.updateOrderNumber(order.orderNumber);

        // Update status and progress
        this.updateOrderStatus();

        // Render order items
        this.renderOrderItems(order.items);

        // Update totals
        this.updateOrderTotals(order);

        // Update delivery/pickup information
        this.updateDeliveryPickupInfo(order);

        // Update customer information
        this.updateCustomerInfo(order);

        // Update payment information
        this.updatePaymentInfo(order);

        // Update tracking information
        this.updateTrackingInfo();

        // Setup rolling status 
        this.setupRollingStatusItems();

        // Update the rolling status to show current state
        this.updateRollingStatus();

        // Hide loading state
        this.hideLoadingState();
    }

    /**
     * Update order number display
     */
    updateOrderNumber(orderNumber) {
        const orderNumberEl = document.getElementById('orderNumber');
        if (orderNumberEl) {
            orderNumberEl.textContent = `#${orderNumber}`;
        }
    }

    /**
     * Update order status badge and estimated time
     */
    updateOrderStatus() {
        if (!this.state.orderData) return;
        
        const order = this.state.orderData;
        const statusBadge = document.getElementById('statusBadge');
        const orderTime = document.getElementById('orderTime');
        const estimatedTime = document.getElementById('estimatedTime');
        
        // Update status badge
        if (statusBadge) {
            const statusText = this.getStatusText(order.status);
            statusBadge.textContent = statusText;
            statusBadge.className = `conf-status-badge conf-${order.status.toLowerCase()}`;
        }
        
        // Update order time
        if (orderTime) {
            const createdAt = new Date(order.createdAt);
            const timeString = this.formatTime(createdAt);
            orderTime.textContent = `Ma, ${timeString}`;
        }
        
        // Update estimated time
        if (estimatedTime) {
            if (order.status === 'PENDING') {
                estimatedTime.textContent = 'Elfogadásra vár';
            } else if (order.status === 'DELIVERED') {
                estimatedTime.textContent = 'Teljesítve';
            } else if (order.estimatedTime) {
                const estimated = new Date(order.estimatedTime);
                const now = new Date();
                const diffMinutes = Math.ceil((estimated - now) / (1000 * 60));
                
                if (diffMinutes > 0) {
                    estimatedTime.textContent = `${diffMinutes} perc`;
                } else {
                    estimatedTime.textContent = 'Hamarosan kész';
                }
            } else {
                estimatedTime.textContent = 'Számítás alatt';
            }
        }
    }

    /**
     * Initialize rolling status display elements
     */
    initializeRollingStatus() {
        this.statusRoller = document.getElementById('statusRoller');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerValue = document.getElementById('timerValue');
        this.statusDescription = document.getElementById('statusDescription');

        if (!this.statusRoller) {
            console.error('Status roller elements not found');
            return;
        }

        console.log('📱 Rolling status display initialized');
    }

    /**
     * Setup status items in the roller
     */
    setupRollingStatusItems() {
        if (!this.state.orderData || !this.statusRoller) return;

        const orderType = this.state.orderData.orderType || 'PICKUP';
        const statuses = this.statusProgression[orderType];

        console.log('📱 Setting up status items for:', orderType, 'Status count:', statuses.length);

        // Clear existing items
        this.statusRoller.innerHTML = '';

        // Create status items
        statuses.forEach((status, index) => {
            const statusItem = document.createElement('div');
            statusItem.className = 'conf-rolling-status-item';
            statusItem.dataset.status = status.key;
            statusItem.textContent = status.text;
            this.statusRoller.appendChild(statusItem);
            console.log('📱 Created item:', index, status.text);
        });

        console.log(`📱 Created ${statuses.length} status items for ${orderType} order`);

        // Immediately show the current status after creating items
        if (this.state.orderData.status) {
            this.updateRollingStatus();
        }
    }

    /**
     * Update the current rolling status display
     */
    updateRollingStatus() {
        if (!this.state.orderData || !this.statusRoller) {
            console.warn('📱 Cannot update rolling status - missing data or element');
            return;
        }

        const currentStatus = this.state.orderData.status;
        const orderType = this.state.orderData.orderType || 'PICKUP';
        const statuses = this.statusProgression[orderType];

        // DEBUG: Log the current status and available statuses
        console.log('🔍 DEBUG - Current status:', currentStatus);
        console.log('🔍 DEBUG - Order type:', orderType);
        console.log('🔍 DEBUG - Available statuses:', statuses.map(s => `${s.key}: "${s.text}"`));

        // Find current status index
        let statusIndex = statuses.findIndex(s => s.key === currentStatus);
        let currentStatusData;

        if (statusIndex === -1) {
            console.warn(`Status ${currentStatus} not found in progression`);
            // For DELIVERED status, force it to the last item
            if (currentStatus === 'DELIVERED') {
                statusIndex = statuses.length - 1;
                currentStatusData = statuses[statusIndex];
                console.log('🔍 Forcing DELIVERED to last status:', currentStatusData.text);
            } else {
                // For other unknown statuses, show first status
                statusIndex = 0;
                currentStatusData = statuses[0];
                console.log('🔍 Unknown status, showing first:', currentStatusData.text);
            }
        } else {
            currentStatusData = statuses[statusIndex];
            console.log('🔍 Found status:', currentStatusData.text, 'at index:', statusIndex);
        }

        this.state.currentStatusIndex = statusIndex;

        const statusItems = this.statusRoller.querySelectorAll('.conf-rolling-status-item');
        console.log('🔍 Found', statusItems.length, 'status items in roller');

        if (statusItems.length === 0) {
            console.error('🔍 No status items found! Re-creating...');
            this.setupRollingStatusItems();
            return; // setupRollingStatusItems will call updateRollingStatus again
        }

        this.rollToStatusIndex(statusIndex);

        // Update description
        if (this.statusDescription) {
            this.statusDescription.textContent = currentStatusData.description;
        }

        // Handle timer for preparation phase
        if (currentStatusData.hasTimer && currentStatus === 'CONFIRMED') {
            this.startRollingTimer();
        } else {
            this.hideRollingTimer();
        }

        console.log(`📱 Updated rolling status to: ${currentStatusData.text}`);
    }
    /**
     * Roll to specific status index with animation
     */
    rollToStatusIndex(targetIndex) {
        const statusItems = this.statusRoller.querySelectorAll('.conf-rolling-status-item');

        console.log('🎢 Rolling to index:', targetIndex, 'Total items:', statusItems.length);

        if (statusItems.length === 0) {
            console.warn('🎢 No status items found!');
            return;
        }

        // Ensure targetIndex is within bounds
        targetIndex = Math.max(0, Math.min(targetIndex, statusItems.length - 1));

        // Reset all items
        statusItems.forEach((item, index) => {
            item.classList.remove('conf-current', 'conf-previous', 'conf-next');

            if (index === targetIndex) {
                item.classList.add('conf-current');
                console.log('🎢 Setting current:', item.textContent);
            } else if (index === targetIndex - 1) {
                item.classList.add('conf-previous');
            } else if (index === targetIndex + 1) {
                item.classList.add('conf-next');
            }
        });

        // Calculate transform for rolling effect
        const itemHeight = window.innerWidth <= 480 ? 50 : (window.innerWidth <= 768 ? 60 : 80);
        const offset = -targetIndex * itemHeight;

        this.statusRoller.style.transform = `translateY(${offset}px)`;

        console.log(`🎢 Rolling to status index ${targetIndex}, offset: ${offset}px`);
    }

    /**
     * Start the preparation countdown timer
     */
    startRollingTimer() {
        if (!this.state.orderData.estimatedTime) return;

        const estimatedTime = new Date(this.state.orderData.estimatedTime);
        const now = new Date();

        if (estimatedTime <= now) {
            this.hideRollingTimer();
            return;
        }

        this.showRollingTimer();
        this.updateRollingTimer(estimatedTime);

        // Clear existing interval
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
        }

        // Start countdown - update every minute
        this.state.countdownInterval = setInterval(() => {
            this.updateRollingTimer(estimatedTime);
        }, 60000);

        console.log('⏰ Started rolling preparation timer');
    }

    /**
     * Update the countdown timer display
     */
    updateRollingTimer(estimatedTime) {
        const now = new Date();
        const timeDiff = estimatedTime - now;

        if (timeDiff <= 0) {
            this.hideRollingTimer();
            if (this.state.countdownInterval) {
                clearInterval(this.state.countdownInterval);
                this.state.countdownInterval = null;
            }
            return;
        }

        const minutes = Math.ceil(timeDiff / (1000 * 60));

        if (this.timerValue) {
            this.timerValue.textContent = `${minutes} perc`;

            // Add blinking effect when under 5 minutes
            if (minutes <= 5) {
                this.timerValue.style.animation = 'confTimerBlink 1s infinite';
            } else {
                this.timerValue.style.animation = '';
            }
        }
    }

    /**
     * Show the timer display
     */
    showRollingTimer() {
        if (this.timerDisplay) {
            this.timerDisplay.style.display = 'flex';
        }
    }

    /**
     * Hide the timer display
     */
    hideRollingTimer() {
        if (this.timerDisplay) {
            this.timerDisplay.style.display = 'none';
        }
        if (this.state.countdownInterval) {
            clearInterval(this.state.countdownInterval);
            this.state.countdownInterval = null;
        }
    }


    /**
     * Update progress steps based on order status
     */
    updateProgressSteps() {
        if (!this.state.orderData) return;
        
        const order = this.state.orderData;
        const isDelivery = order.orderType === 'DELIVERY';
        
        // Show/hide delivery step for delivery orders
        const deliveryStep = document.getElementById('step-delivery');
        const deliveryLine = document.getElementById('line-3');
        
        if (isDelivery) {
            if (deliveryStep) deliveryStep.style.display = 'flex';
            if (deliveryLine) deliveryLine.style.display = 'block';
            
            // Update final step label
            const finalStepLabel = document.getElementById('finalStepLabel');
            if (finalStepLabel) {
                finalStepLabel.textContent = 'Szállítás alatt';
            }
        } else {
            if (deliveryStep) deliveryStep.style.display = 'none';
            if (deliveryLine) deliveryLine.style.display = 'none';
            
            // Update final step label for pickup
            const finalStepLabel = document.getElementById('finalStepLabel');
            if (finalStepLabel) {
                finalStepLabel.textContent = 'Átvehető';
            }
        }
        
        // Update step states based on order status
        this.updateStepState('step-pending', 'PENDING', order.status);
        this.updateStepState('step-confirmed', 'CONFIRMED', order.status);
        this.updateStepState('step-ready', 'READY', order.status);
        
        if (isDelivery) {
            this.updateStepState('step-delivery', 'OUT_FOR_DELIVERY', order.status);
        }
        
        // Update progress lines
        this.updateProgressLines(order.status, isDelivery);
    }

    /**
     * Update individual step state
     */
    updateStepState(stepId, stepStatus, currentStatus) {
        const stepEl = document.getElementById(stepId);
        if (!stepEl) return;
        
        const statusOrder = ['PENDING', 'CONFIRMED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        const stepIndex = statusOrder.indexOf(stepStatus);
        const currentIndex = statusOrder.indexOf(currentStatus);
        
        stepEl.classList.remove('conf-completed', 'conf-active');
        
        if (currentIndex > stepIndex) {
            stepEl.classList.add('conf-completed');
        } else if (currentIndex === stepIndex) {
            stepEl.classList.add('conf-active');
        }
    }

    /**
     * Update progress lines between steps
     */
    updateProgressLines(status, isDelivery) {
        const lines = ['line-1', 'line-2'];
        if (isDelivery) lines.push('line-3');
        
        const statusOrder = ['PENDING', 'CONFIRMED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        const currentIndex = statusOrder.indexOf(status);
        
        lines.forEach((lineId, index) => {
            const lineEl = document.getElementById(lineId);
            if (lineEl) {
                lineEl.classList.remove('conf-active', 'conf-completed');
                
                if (currentIndex > index + 1) {
                    lineEl.classList.add('conf-completed');
                } else if (currentIndex === index + 1) {
                    lineEl.classList.add('conf-active');
                }
            }
        });
    }

    /**
     * Render order items
     */
    renderOrderItems(items) {
        const container = document.getElementById('orderItems');
        if (!container || !items) return;

        console.log('🔍 Debug - Items received:', items);

        const itemsHTML = items.map(item => {
            // Debug each item's image data
            console.log('🔍 Debug - Item:', item.name);
            console.log('🔍 Debug - displayImage:', item.displayImage);
            console.log('🔍 Debug - image:', item.image);
            console.log('🔍 Debug - imageUrl:', item.imageUrl);

            const imgSrc = item.displayImage || item.image || item.imageUrl || 'photos/default-food.jpg';
            console.log('🔍 Debug - imgSrc before conversion:', imgSrc);

            const webImageSrc = imgSrc.replace(/\\/g, '/');
            console.log('🔍 Debug - webImageSrc after conversion:', webImageSrc);

            const safeName = this.escapeHtml(item.displayName || item.name);
            const customizationText = item.displayCustomizations || this.getItemCustomizationsText(item);
            const itemTotal = item.displayPrice || this.calculateItemTotal(item);
        
            const safeNotes = item.specialNotes ? `<p class="item-special-notes">${this.sanitizeInput(item.specialNotes)}</p>` : '';
        
            return `
                <div class="conf-order-item">
                    <img src="${webImageSrc}" 
                         alt="${safeName}" 
                         class="conf-item-image"
                         onerror="console.error('Image failed to load:', '${webImageSrc}'); if (!this.dataset.fallback) { this.dataset.fallback = 'true'; this.src='photos/default-food.jpg'; }">
                    <div class="conf-item-details">
                        <h4 class="conf-item-name">${safeName}</h4>
                        ${customizationText ? `<p class="conf-item-description">${customizationText}</p>` : ''}
                        ${safeNotes}
                    </div>
                    <div class="conf-item-quantity">${item.quantity}x</div>
                    <div class="conf-item-price">${this.formatCurrency(itemTotal)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = itemsHTML;
    }

    /**
     * Sanitize user input to prevent XSS 
     */
    sanitizeInput(input) {
        if (!input) return '';
        return input
            .replace(/[<>]/g, '') 
            .replace(/javascript:/gi, '') 
            .replace(/on\w+=/gi, ''); 
    }

    /**
     * Calculate item total including customizations
     */
    calculateItemTotal(item) {
        // For order confirmation, the backend should already provide totalPrice
        // But fallback to basic calculation if not available
        if (item.totalPrice) {
            return item.totalPrice;
        }

        // Fallback calculation
        let total = item.price * item.quantity;

        // Add any upgrade costs if available
        if (item.upgradePrice) {
            total += item.upgradePrice * item.quantity;
        }

        return total;
    }    

    /**
     * Generate customization text for items - same logic as checkout
     */
    getItemCustomizationsText(item) {
        // If backend provides formatted customizations, use them
        if (item.displayCustomizations) {
            return item.displayCustomizations;
        }

        // Fallback for older orders without pre-formatted data
        const customizations = [];
        if (item.selectedSauce) customizations.push(`Szósz: ${item.selectedSauce}`);
        if (item.friesUpgrade) customizations.push(`Krumpli: ${item.friesUpgrade}`);
        if (item.extras?.length > 0) customizations.push(`Extrák: ${item.extras.join(', ')}`);
        if (item.specialNotes) customizations.push(`Megjegyzés: ${item.specialNotes}`);

        return customizations.join(' • ');
    }

    /**
     * Render item customizations - return as string for confirmation page
     */
    renderItemCustomizations(item) {
        const customizations = [];
        
        // Selected sauce
        if (item.selectedSauce) {
            customizations.push(`Szósz: ${this.escapeHtml(item.selectedSauce)}`);
        }
        
        // Fries upgrade
        if (item.friesUpgrade) {
            customizations.push(`Krumpli: ${this.escapeHtml(item.friesUpgrade)}`);
        }
        
        // Extras
        if (item.extras && item.extras.length > 0) {
            item.extras.forEach(extra => {
                customizations.push(`+${this.escapeHtml(extra)}`);
            });
        }
    
        // Remove items
        if (item.removeItems && item.removeItems.length > 0) {
            item.removeItems.forEach(removeItem => {
                customizations.push(`-${this.escapeHtml(removeItem)}`);
            });
        }
    
        // Special notes
        if (item.specialNotes) {
            customizations.push(`Megjegyzés: ${this.escapeHtml(item.specialNotes)}`);
        }
        
        return customizations.join(' • ');
    }

    /**
     * Update order totals
     */
    updateOrderTotals(order) {
        const subtotalEl = document.getElementById('subtotalAmount');
        const packagingFeeEl = document.getElementById('confPackagingFee');
        const deliveryFeeEl = document.getElementById('deliveryFeeAmount');
        const deliveryFeeRow = document.getElementById('deliveryFeeRow');
        const totalEl = document.getElementById('totalAmount');
        
        // Calculate subtotal from items
        const subtotal = order.items ? order.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0) : 0;
        
        if (subtotalEl) {
            subtotalEl.textContent = this.formatCurrency(subtotal);
        }

        const packagingFee = 0.50;
        if (packagingFeeEl) {
            packagingFeeEl.textContent = this.formatCurrency(packagingFee);
        }       
        
        // Show delivery fee if it's a delivery order
        if (order.orderType === 'DELIVERY') {
            const deliveryFee = order.deliveryFee || 2.50; // Use backend value or fallback
            if (deliveryFeeRow) deliveryFeeRow.style.display = 'flex';
            if (deliveryFeeEl) deliveryFeeEl.textContent = this.formatCurrency(deliveryFee);
        } else {
            if (deliveryFeeRow) deliveryFeeRow.style.display = 'none';
        }
        
        if (totalEl) {
            totalEl.textContent = this.formatCurrency(order.total);
        }
    }

    /**
     * Update delivery/pickup information
     */
    updateDeliveryPickupInfo(order) {
        const titleEl = document.getElementById('deliveryPickupTitle');
        const textEl = document.getElementById('deliveryPickupText');
        const iconEl = document.getElementById('deliveryPickupIcon');
        const detailsEl = document.getElementById('deliveryPickupDetails');
        
        if (order.orderType === 'DELIVERY') {
            // Delivery information
            if (textEl) textEl.textContent = 'Szállítás';
            
            if (iconEl) {
                iconEl.innerHTML = `
                    <path d="M14 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m13-4h-6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Z" stroke="currentColor" stroke-width="2"/>
                `;
            }
            
            if (detailsEl) {
                detailsEl.innerHTML = `
                    <div class="conf-delivery-item">
                        <div class="conf-info-icon">📍</div>
                        <div class="conf-info-content">
                            <div class="conf-info-label">Szállítási cím:</div>
                            <div class="conf-info-value">${this.escapeHtml(order.deliveryAddress || 'Nem megadva')}</div>
                        </div>
                    </div>
                    ${order.deliveryNotes ? `
                        <div class="conf-delivery-item">
                            <div class="conf-info-icon">📝</div>
                            <div class="conf-info-content">
                                <div class="conf-info-label">Megjegyzés:</div>
                                <div class="conf-info-value">${this.escapeHtml(order.deliveryNotes)}</div>
                            </div>
                        </div>
                    ` : ''}
                `;
            }
        } else {
            // Pickup information
            if (textEl) textEl.textContent = 'Átvétel';
            
            if (iconEl) {
                iconEl.innerHTML = `
                    <path d="M19 7h-3V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v7H3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1v1a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1H17a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-1V8a1 1 0 0 0-1-1zM6 7h8v1H6V7z" stroke="currentColor" stroke-width="2"/>
                `;
            }
            
            if (detailsEl) {
                detailsEl.innerHTML = `
                    <div class="conf-delivery-item">
                        <div class="conf-info-icon">🏪</div>
                        <div class="conf-info-content">
                            <div class="conf-info-label">Átvételi hely:</div>
                            <div class="conf-info-value">Palace Cafe & Bar<br>Komárno, Slovensko</div>
                        </div>
                    </div>
                    <div class="conf-delivery-item">
                        <div class="conf-info-icon">🕒</div>
                        <div class="conf-info-content">
                            <div class="conf-info-label">Nyitvatartás:</div>
                            <div class="conf-info-value">Sze-Csü: 11:00-20:00<br>Pé-Szo: 11:00-22:00</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    /**
     * Update customer information
     */
    updateCustomerInfo(order) {
        const container = document.getElementById('customerInfo');
        if (!container) return;
        
        container.innerHTML = `
            <div class="conf-customer-item">
                <div class="conf-customer-label">Név:</div>
                <div class="conf-customer-value">${this.escapeHtml(order.customerName || 'Ismeretlen')}</div>
            </div>
            <div class="conf-customer-item">
                <div class="conf-customer-label">Telefon:</div>
                <div class="conf-customer-value">${this.escapeHtml(order.customerPhone || 'Nem megadva')}</div>
            </div>
            ${order.customerEmail ? `
                <div class="conf-customer-item">
                    <div class="conf-customer-label">Email:</div>
                    <div class="conf-customer-value">${this.escapeHtml(order.customerEmail)}</div>
                </div>
            ` : ''}
        `;
    }

    /**
     * Update payment information
     */
    updatePaymentInfo(order) {
        const container = document.getElementById('paymentDetails');
        if (!container) return;
        
        const paymentMethods = {
            'CASH': 'Készpénz',
            'CARD': 'Bankkártya',
            'ONLINE': 'Online fizetés'
        };
        
        const paymentText = paymentMethods[order.paymentMethod] || order.paymentMethod || 'Készpénz';
        
        container.innerHTML = `
            <div class="conf-payment-method">
                <div class="conf-payment-icon">💳</div>
                <div class="conf-payment-info">
                    <div class="conf-payment-method-name">${paymentText}</div>
                    <div class="conf-payment-status">Fizetés helyben</div>
                </div>
            </div>
            <div class="conf-payment-note">
                <strong>Fizetés:</strong> A fizetés ${order.orderType === 'DELIVERY' ? 'szállításkor' : 'átvételkor'} történik.
            </div>
        `;
    }

    /**
     * Update tracking information
     */
    updateTrackingInfo() {
        if (!this.state.orderData) return;
        
        const order = this.state.orderData;
        const currentStepEl = document.getElementById('trackingCurrentStep');
        const finalStepEl = document.getElementById('trackingFinalStep');
        
        if (currentStepEl) {
            let currentText = '';
            switch (order.status) {
                case 'PENDING':
                    currentText = '📄 Elfogadásra vár';
                    break;
                case 'CONFIRMED':
                    currentText = '👨‍🍳 Elkészítés alatt';
                    break;
                case 'READY':
                    currentText = '✅ Kész';
                    break;
                case 'OUT_FOR_DELIVERY':
                    currentText = '🚚 Szállítás alatt';
                    break;
                case 'DELIVERED':
                    currentText = '✅ Teljesítve';
                    break;
                default:
                    currentText = '📄 Feldolgozás alatt';
            }
            currentStepEl.textContent = currentText;
            
            // Update class based on status
            currentStepEl.className = order.status === 'DELIVERED' ? 'conf-completed' : 'conf-active';
        }
        
        if (finalStepEl) {
            if (order.orderType === 'DELIVERY') {
                finalStepEl.textContent = '📦 Kiszállítva';
            } else {
                finalStepEl.textContent = '📦 Átvéve';
            }
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        // Loading is already shown by default in HTML
        console.log('⏳ Showing loading state');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingPlaceholders = document.querySelectorAll('.conf-loading-placeholder');
        loadingPlaceholders.forEach(placeholder => {
            placeholder.style.display = 'none';
        });
        console.log('✅ Loading state hidden');
    }

    /**
     * Handle loading errors with retry mechanism
     */
    handleLoadError(error) {
        console.error('Load error:', error);
        this.state.retryCount++;
        
        if (this.state.retryCount < this.config.maxRetries) {
            console.log(`Retrying... (${this.state.retryCount}/${this.config.maxRetries})`);
            setTimeout(() => {
                this.loadOrderData();
            }, this.config.retryDelay * this.state.retryCount);
        } else {
            this.showError('Nem sikerült betölteni a rendelés adatait. Kérjük, frissítse az oldalt.');
        }
    }

    /**
     * Setup periodic refresh as fallback
     */
    setupPeriodicRefresh() {
        setInterval(() => {
            if (!this.state.isLoading && this.state.orderData && this.state.orderData.status !== 'DELIVERED') {
                console.log('🔄 Periodic refresh...');
                this.loadOrderData();
            }
        }, this.config.refreshInterval);
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isConnected) {
        // Could add a visual indicator for connection status
        console.log(`🔌 Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorToast = document.getElementById('errorToast');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorToast && errorMessage) {
            errorMessage.textContent = message;
            errorToast.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorToast.style.display = 'none';
            }, 5000);
        }
        
        console.error('Error shown to user:', message);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('dynamicToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'dynamicToast';
            toast.className = 'conf-toast';
            document.body.appendChild(toast);
        }
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="conf-toast-content">
                <div class="conf-toast-icon conf-${type}">
                    ${icons[type] || icons.info}
                </div>
                <div class="conf-toast-message">${this.escapeHtml(message)}</div>
            </div>
        `;
        
        toast.style.display = 'block';
        toast.classList.add('conf-show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('conf-show');
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 3000);
    }

    /**
     * Get status text in Hungarian
     */
    getStatusText(status) {
        const statusTexts = {
            'PENDING': 'Várakozó',
            'CONFIRMED': 'Elfogadva',
            'PREPARING': 'Készítés alatt',
            'READY': 'Kész',
            'OUT_FOR_DELIVERY': 'Szállítás alatt',
            'DELIVERED': 'Kiszállítva',
            'CANCELLED': 'Törölve'
        };
        return statusTexts[status] || status;
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    /**
     * Format time
     */
    formatTime(date) {
        return new Intl.DateTimeFormat('hu-HU', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Make API calls
     */
    async apiCall(endpoint, options = {}) {
        const url = `${this.config.apiUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            console.log('🌐 API Call:', url, requestOptions);
            const response = await fetch(url, requestOptions);
            
            console.log('📡 Response Status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 Response Data:', data);
            return data;

        } catch (error) {
            console.error('❌ API call failed:', error);
            throw error;
        }
    }

    /**
     * Cleanup when page is unloaded
     */
    destroy() {
        if (this.state.socket) {
            this.state.socket.disconnect();
        }

        if (this.state.countdownInterval) {
            clearInterval(this.state,countdownInterval);
        }
        
        console.log('🧹 Order Confirmation cleanup completed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.orderConfirmation = new OrderConfirmation();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.orderConfirmation) {
        window.orderConfirmation.destroy();
    }
});


