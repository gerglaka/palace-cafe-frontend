/**
 * Palace Cafe & Bar - Orders Management App (Performance Optimized)
 * Real-time order management with instant UI feedback
 */

'use strict';

class OrdersApp extends BaseApp {
    constructor() {
        super('orders');
        this.socket = null;
        this.orders = [];
        this.lastUpdateTime = new Date();
        this.notificationSound = null;
        this.timers = new Map();
        this.connectionStatus = 'disconnected';
        this.modalEventListeners = []; // Track modal listeners for cleanup
        
        this.initNotificationSound();
    }

    async initialize() {
        console.log('🛒 Initializing Orders Management App...');
        
        this.setupWebSocket();
        await this.loadActiveOrders();
        this.render();
        this.setupEventListeners();
        
        console.log('✅ Orders App initialized');
    }

    initNotificationSound() {
        // Initialize Web Audio API context
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.notificationEnabled = true;
            console.log('✅ Notification sound system initialized');
        } catch (error) {
            console.warn('⚠️ Web Audio API not supported:', error);
            this.notificationEnabled = false;
        }
    }

    /**
     * Generate a pleasant notification chime sound
     */
    generateNotificationSound() {
        if (!this.audioContext || !this.notificationEnabled) return;

        try {
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            const duration = 0.6; // 600ms total duration

            // Create oscillators for a pleasant chime (two-tone)
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();

            // Create gain nodes for volume control
            const gainNode1 = this.audioContext.createGain();
            const gainNode2 = this.audioContext.createGain();
            const masterGain = this.audioContext.createGain();

            // Set frequencies (C6 and E6 - pleasant harmony)
            oscillator1.frequency.setValueAtTime(1047, now); // C6
            oscillator2.frequency.setValueAtTime(1319, now); // E6

            // Use sine waves for pleasant tone
            oscillator1.type = 'sine';
            oscillator2.type = 'sine';

            // Create envelope (attack-decay-release)
            const volume = 0.15; // Moderate volume

            // First tone envelope
            gainNode1.gain.setValueAtTime(0, now);
            gainNode1.gain.linearRampToValueAtTime(volume, now + 0.1);
            gainNode1.gain.exponentialRampToValueAtTime(0.01, now + duration);

            // Second tone envelope (slightly delayed and quieter)
            gainNode2.gain.setValueAtTime(0, now);
            gainNode2.gain.linearRampToValueAtTime(volume * 0.7, now + 0.05);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, now + duration);

            // Master gain
            masterGain.gain.setValueAtTime(1, now);

            // Connect audio graph
            oscillator1.connect(gainNode1);
            oscillator2.connect(gainNode2);
            gainNode1.connect(masterGain);
            gainNode2.connect(masterGain);
            masterGain.connect(this.audioContext.destination);

            // Start and stop oscillators
            oscillator1.start(now);
            oscillator2.start(now + 0.05); // Slight delay for harmony
            oscillator1.stop(now + duration);
            oscillator2.stop(now + duration);

        } catch (error) {
            console.error('Failed to generate notification sound:', error);
        }
    }

    /**
     * Play notification sound with user interaction check
     */
    async playNotificationSound() {
        if (!this.audioContext || !this.notificationEnabled) return;

        try {
            // Handle browser autoplay policy
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.generateNotificationSound();
        } catch (error) {
            console.warn('Could not play notification sound:', error);
            // Fallback: show a more prominent visual notification
            this.showVisualNotification();
        }
    }

    /**
     * Fallback visual notification when sound fails
     */
    showVisualNotification() {
        // Create a brief visual flash effect
        const flash = document.createElement('div');
        flash.className = 'notification-flash';
        flash.innerHTML = '🔔 Új rendelés!';

        flash.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            animation: flashNotification 2s ease-out;
            pointer-events: none;
        `;

        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 2000);

        // Add CSS animation if not exists
        if (!document.querySelector('#notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes flashNotification {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupWebSocket() {
        this.socket = io('https://palace-cafe-backend-production.up.railway.app');

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.connectionStatus = 'connected';
            this.updateConnectionStatus();
        });

        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.connectionStatus = 'disconnected';
            this.updateConnectionStatus();
            this.setupDisconnectedFallback();
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
            this.connectionStatus = 'error';
            this.updateConnectionStatus();
            this.setupDisconnectedFallback();
        });

        this.socket.on('newOrder', (orderData) => {
            console.log('📧 New order received:', orderData);
            this.handleNewOrder(orderData);
        });

        this.socket.on('orderStatusUpdate', (updateData) => {
            console.log('📊 Order status updated:', updateData);
            this.handleOrderUpdate(updateData);
        });

        this.socket.on('orderCompleted', (orderData) => {
            console.log('✅ Order completed:', orderData);
            this.handleOrderCompletion(orderData);
        });
    }

    setupDisconnectedFallback() {
        if (this.disconnectedFallbackInterval) {
            clearInterval(this.disconnectedFallbackInterval);
        }

        this.disconnectedFallbackInterval = setInterval(() => {
            if (this.connectionStatus !== 'connected') {
                console.log('🔄 WebSocket disconnected - performing periodic refresh');
                this.fallbackRefresh();
            } else {
                clearInterval(this.disconnectedFallbackInterval);
                this.disconnectedFallbackInterval = null;
            }
        }, 10000);
    }

    async loadActiveOrders() {
        try {
            const response = await this.apiCall('/orders/active');
            this.orders = response.data || [];
            this.lastUpdateTime = new Date();
        } catch (error) {
            console.error('Failed to load active orders:', error);
            this.showNotification('Failed to load orders', 'error');
            this.orders = [];
        }
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="orders-header">
                <div class="orders-title">
                    <h2>Aktív Rendelések</h2>
                    <div class="connection-status" id="connectionStatus">
                        <i class="fas fa-circle"></i>
                        <span>Kapcsolat</span>
                    </div>
                </div>
                <div class="orders-actions">
                    <button class="btn-refresh" id="refreshOrders">
                        <i class="fas fa-sync"></i>
                        Frissítés
                    </button>
                    <button class="btn-secondary" id="viewArchived">
                        <i class="fas fa-archive"></i>
                        Archívum
                    </button>
                </div>
            </div>

            <div class="orders-summary">
                <div class="summary-card">
                    <h3 id="pendingCount">0</h3>
                    <p>Várakozó</p>
                </div>
                <div class="summary-card">
                    <h3 id="preparingCount">0</h3>
                    <p>Készítés alatt</p>
                </div>
                <div class="summary-card">
                    <h3 id="readyCount">0</h3>
                    <p>Kész</p>
                </div>
            </div>

            <div class="orders-list" id="ordersList">
                <!-- Orders will be rendered here -->
            </div>

            <!-- Order Details Modal -->
            <div class="modal" id="orderModal">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">Rendelés részletei</h3>
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="modalBody">
                        <!-- Modal content will be rendered here -->
                    </div>
                </div>
            </div>
        `;
        
        this.updateConnectionStatus();
        this.renderOrdersList();
        this.updateSummary();
    }

    renderOrdersList() {
        const container = document.getElementById('ordersList');
        if (!container) return;
        
        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-inbox"></i>
                    <h3>Nincsenek aktív rendelések</h3>
                    <p>Az új rendelések automatikusan megjelennek itt.</p>
                </div>
            `;
            return;
        }
        
        const sortedOrders = [...this.orders].sort((a, b) => {
            const statusPriority = {
                'PENDING': 0,
                'CONFIRMED': 1,
                'PREPARING': 1,
                'READY': 2,
                'OUT_FOR_DELIVERY': 3
            };
            
            if (statusPriority[a.status] !== statusPriority[b.status]) {
                return statusPriority[a.status] - statusPriority[b.status];
            }
            
            if (a.estimatedTime && b.estimatedTime) {
                return new Date(a.estimatedTime) - new Date(b.estimatedTime);
            }
            
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        container.innerHTML = sortedOrders.map(order => `
            <div class="order-card ${order.status.toLowerCase()}" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-number">${order.orderNumber}</div>
                    <div class="order-status status-${order.status.toLowerCase()}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                                
                <div class="order-customer">
                    <i class="fas fa-user"></i>
                    <span>${this.escapeHtml(order.customerName)}</span>
                    <span class="order-type ${order.orderType.toLowerCase()}">
                        <i class="fas fa-${order.orderType === 'DELIVERY' ? 'truck' : 'store'}"></i>
                        ${order.orderType === 'DELIVERY' ? 'Szállítás' : 'Elvitel'}
                    </span>
                    ${this.getPaymentStatusBadge(order.paymentMethod)}
                </div>
                
                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => 
                        `<span class="item-tag">${item.quantity}x ${this.escapeHtml(item.name)}</span>`
                    ).join('')}
                    ${order.items.length > 3 ? `<span class="item-more">+${order.items.length - 3} további</span>` : ''}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">${this.formatCurrency(order.total)}</div>
                    <div class="order-time">
                        ${this.renderOrderTime(order)}
                    </div>
                </div>
            </div>
        `).join('');
        
        this.startTimers();

        container.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', () => {
                const orderId = parseInt(card.dataset.orderId);
                this.openOrderModal(orderId);
            });
        });
    }

    /**
     * Get payment status badge HTML
     */
    getPaymentStatusBadge(paymentMethod) {
        if (paymentMethod === 'CARD') {
            return `
                <span class="payment-status paid">
                    <i class="fas fa-credit-card"></i>
                    FIZETVE
                </span>
            `;
        } else {
            return `
                <span class="payment-status pending">
                    <i class="fas fa-money-bill-wave"></i>
                    KÉSZPÉNZ
                </span>
            `;
        }
    }

    renderOrderTime(order) {
        const now = new Date();
        const createdAt = new Date(order.createdAt);
        const estimatedTime = order.estimatedTime ? new Date(order.estimatedTime) : null;
        
        if (order.status === 'PENDING') {
            const elapsed = Math.floor((now - createdAt) / (1000 * 60));
            return `<span class="time-elapsed">${elapsed} perce érkezett</span>`;
        }
        
        if (order.status === 'CONFIRMED' && estimatedTime) {
            const remaining = Math.floor((estimatedTime - now) / (1000 * 60));
            if (remaining > 0) {
                return `<span class="time-remaining" id="timer-${order.id}">${remaining} perc van hátra</span>`;
            } else {
                return `<span class="time-overdue">Késésben van</span>`;
            }
        }
        
        if (order.status === 'READY') {
            return `<span class="time-ready">Kész az elvitelre</span>`;
        }
        
        return `<span class="time-status">${this.getStatusText(order.status)}</span>`;
    }

    startTimers() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
        
        this.orders.forEach(order => {
            if (order.status === 'CONFIRMED' && order.estimatedTime) {
                const timer = setInterval(() => {
                    this.updateTimer(order.id);
                }, 60000);
                
                this.timers.set(order.id, timer);
            }
        });
    }

    updateTimer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.estimatedTime) return;
        
        const now = new Date();
        const estimatedTime = new Date(order.estimatedTime);
        const remaining = Math.floor((estimatedTime - now) / (1000 * 60));
        
        const timerElement = document.getElementById(`timer-${orderId}`);
        if (timerElement) {
            if (remaining > 0) {
                timerElement.textContent = `${remaining} perc van hátra`;
                timerElement.className = 'time-remaining';
            } else {
                timerElement.textContent = 'Késésben van';
                timerElement.className = 'time-overdue';
            }
        }
    }

    openOrderModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const modal = document.getElementById('orderModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = `Rendelés ${order.orderNumber}`;
        modalBody.innerHTML = this.renderOrderModal(order);
        
        modal.classList.add('active');
        
        // Clean up previous listeners
        this.cleanupModalListeners();
        
        // Setup new listeners with cleanup tracking
        this.setupModalListeners(modal);
    }

    // NEW: Clean up modal event listeners
    cleanupModalListeners() {
        this.modalEventListeners.forEach(({ element, event, handler }) => {
            if (element) {
                element.removeEventListener(event, handler);
            }
        });
        this.modalEventListeners = [];
    }

    // NEW: Setup modal listeners with tracking
    setupModalListeners(modal) {
        const backdrop = modal.querySelector('.modal-backdrop');
        const closeBtn = modal.querySelector('.modal-close');
        
        const backdropHandler = () => this.closeModal();
        const closeBtnHandler = () => this.closeModal();
        
        backdrop.addEventListener('click', backdropHandler);
        closeBtn.addEventListener('click', closeBtnHandler);
        
        // Track listeners for cleanup
        this.modalEventListeners.push(
            { element: backdrop, event: 'click', handler: backdropHandler },
            { element: closeBtn, event: 'click', handler: closeBtnHandler }
        );

        // Setup action button listeners
        modal.querySelectorAll('[data-action]').forEach(button => {
            const actionHandler = (e) => {
                const action = e.target.dataset.action;
                const orderId = parseInt(e.target.dataset.orderId);
            
                // INSTANT UI FEEDBACK - Close modal immediately
                this.closeModal();
            
                // Show loading state
                this.showProcessingState(action, orderId);
            
                // Perform action
                this.handleModalAction(action, orderId);
            };
        
            button.addEventListener('click', actionHandler);
            this.modalEventListeners.push({ 
                element: button, 
                event: 'click', 
                handler: actionHandler 
            });
        });
    }

    // NEW: Show processing state immediately
    showProcessingState(action, orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const actionMessages = {
            'accept': 'Rendelés elfogadása...',
            'cancel': 'Rendelés törlése...',
            'ready': 'Kész állapot beállítása...',
            'delivery': 'Szállítás indítása...',
            'complete': 'Rendelés befejezése...'
        };

        this.showNotification(
            actionMessages[action] || 'Feldolgozás...', 
            'info',
            { duration: 2000 }
        );

        // Optimistically update UI
        this.optimisticUpdate(orderId, action);
    }

    // NEW: Optimistic UI updates
    optimisticUpdate(orderId, action) {
        const orderIndex = this.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return;

        const statusMap = {
            'accept': 'CONFIRMED',
            'cancel': 'CANCELLED',
            'ready': 'READY',
            'delivery': 'OUT_FOR_DELIVERY',
            'complete': 'DELIVERED'
        };

        const newStatus = statusMap[action];
        if (!newStatus) return;

        // Update local state optimistically
        if (newStatus === 'CANCELLED' || newStatus === 'DELIVERED') {
            // Remove from active orders
            this.orders.splice(orderIndex, 1);
        } else {
            // Update status
            this.orders[orderIndex].status = newStatus;
            if (newStatus === 'CONFIRMED') {
                this.orders[orderIndex].acceptedAt = new Date();
            } else if (newStatus === 'READY') {
                this.orders[orderIndex].readyAt = new Date();
            }
        }

        // Update UI immediately
        this.renderOrdersList();
        this.updateSummary();
    }

    // NEW: Handle modal actions without blocking UI
    async handleModalAction(action, orderId) {
        switch (action) {
            case 'accept':
                this.showTimeSelector(orderId);
                break;
            case 'cancel':
                if (confirm('Biztosan törölni szeretnéd ezt a rendelést?')) {
                    await this.cancelOrder(orderId);
                }
                break;
            case 'ready':
                await this.markOrderReady(orderId);
                break;
            case 'delivery':
                await this.markOrderDelivery(orderId);
                break;
            case 'complete':
                await this.completeOrder(orderId);
                break;
        }
    }

    renderOrderModal(order) {
        console.log('Rendering modal for order:', order);
        return `
            <div class="order-details">
                <div class="detail-section">
                    <h4>Ügyfel adatok</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Név:</label>
                            <span>${this.escapeHtml(order.customerName)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Telefon:</label>
                            <span>${this.escapeHtml(order.customerPhone)}</span>
                        </div>
                        ${order.customerEmail ? `
                            <div class="detail-item">
                                <label>Email:</label>
                                <span>${this.escapeHtml(order.customerEmail)}</span>
                            </div>
                        ` : ''}
                        ${order.orderType === 'DELIVERY' && order.deliveryAddress ? `
                            <div class="detail-item">
                                <label>Szállítási cím:</label>
                                <span>${this.escapeHtml(order.deliveryAddress)}</span>
                            </div>
                        ` : ''}
                        ${order.deliveryNotes && order.deliveryNotes.trim() ? `
                            <div class="detail-item delivery-notes">
                                <label>Szállítási megjegyzés:</label>
                                <span>${this.escapeHtml(order.deliveryNotes)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- NEW: Time Information Section -->
                <div class="detail-section">
                    <h4>Időpont információ</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Rendelés beérkezett:</label>
                            <span>${this.formatDate(order.createdAt, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}</span>
                        </div>
                        ${order.scheduledFor ? `
                            <div class="detail-item scheduled-time">
                                <label>Kért időpont:</label>
                                <span class="scheduled-time-value">
                                    <i class="fas fa-clock"></i>
                                    ${this.formatDate(order.scheduledFor, { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric', 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                    ${this.getScheduledTimeStatus(order.scheduledFor)}
                                </span>
                            </div>
                        ` : `
                            <div class="detail-item">
                                <label>Időpont:</label>
                                <span class="asap-time">
                                    <i class="fas fa-bolt"></i>
                                    Amilyen hamar csak lehet
                                </span>
                            </div>
                        `}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Rendelt tételek</h4>
                    <div class="order-items-detailed">
                        ${order.items.map(item => `
                            <div class="item-detailed">
                                <div class="item-header">
                                    <span class="item-name">${this.escapeHtml(item.name)}</span>
                                    <span class="item-quantity">×${item.quantity}</span>
                                    <span class="item-price">${this.formatCurrency(item.totalPrice)}</span>
                                </div>
                                ${this.renderItemCustomizations(item)}
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-total-detailed">
                        <strong>Összesen: ${this.formatCurrency(order.total)}</strong>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Rendelés állapot</h4>
                    <div class="status-timeline">
                        ${this.renderStatusTimeline(order)}
                    </div>
                </div>

                <div class="modal-actions">
                    ${this.renderModalActions(order)}
                </div>
            </div>
        `;
    }

    getScheduledTimeStatus(scheduledFor) {
        if (!scheduledFor) return '';

        const now = new Date();
        const scheduled = new Date(scheduledFor);
        const diffMinutes = Math.floor((scheduled - now) / (1000 * 60));

        if (diffMinutes < -5) {
            return '<span class="time-status late">(Késésben)</span>';
        } else if (diffMinutes < 15) {
            return '<span class="time-status soon">(Hamarosan)</span>';
        } else if (diffMinutes > 60) {
            return '<span class="time-status future">(Későbbre)</span>';
        }

        return '';
    }

    renderItemCustomizations(item) {
        const customizations = [];

        if (item.selectedSauce) {
            customizations.push(`<span class="custom-tag sauce">Szósz: ${this.escapeHtml(item.selectedSauce)}</span>`);
        }

        if (item.friesUpgrade) {
            customizations.push(`<span class="custom-tag fries">Krumpli: ${this.escapeHtml(item.friesUpgrade)}</span>`);
        }

        if (item.extras && item.extras.length > 0) {
            item.extras.forEach(extra => {
                customizations.push(`<span class="custom-tag extra">+${this.escapeHtml(extra)}</span>`);
            });
        }

        if (item.removeItems && item.removeItems.length > 0) {
            item.removeItems.forEach(removedItem => {
                customizations.push(`<span class="custom-tag remove">Elhagyva: ${this.escapeHtml(removedItem)}</span>`);
            });
        }

        if (item.specialNotes && item.specialNotes.trim()) {
            customizations.push(`<div class="special-notes">
                <i class="fas fa-sticky-note"></i>
                <span>Megjegyzés: ${this.escapeHtml(item.specialNotes)}</span>
            </div>`);
        }

        if (customizations.length > 0) {
            return `
                <div class="item-customizations">
                    ${customizations.join('')}
                </div>
            `;
        }

        return '';
    }

    renderStatusTimeline(order) {
        const statuses = [
            { key: 'PENDING', label: 'Beérkezett', icon: 'clock' },
            { key: 'CONFIRMED', label: 'Elfogadva', icon: 'check' },
            { key: 'READY', label: 'Kész', icon: 'utensils' },
            { key: 'OUT_FOR_DELIVERY', label: 'Szállítás alatt', icon: 'truck' },
            { key: 'DELIVERED', label: 'Kiszállítva', icon: 'check-circle' }
        ];

        return statuses.map(status => {
            const isActive = status.key === order.status;
            const isPast = this.isStatusPast(status.key, order.status);
            
            return `
                <div class="timeline-item ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}">
                    <div class="timeline-icon">
                        <i class="fas fa-${status.icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <span class="timeline-label">${status.label}</span>
                        ${this.getStatusTime(order, status.key)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderModalActions(order) {
        switch (order.status) {
            case 'PENDING':
                return `
                    <button class="btn-primary" data-action="accept" data-order-id="${order.id}">
                        <i class="fas fa-check"></i>
                        Rendelés elfogadása
                    </button>
                    <button class="btn-danger" data-action="cancel" data-order-id="${order.id}">
                        <i class="fas fa-times"></i>
                        Elutasítás
                    </button>
                `;
            
            case 'CONFIRMED':
                return `
                    <button class="btn-success" data-action="ready" data-order-id="${order.id}">
                        <i class="fas fa-utensils"></i>
                        Kész
                    </button>
                `;
            
            case 'READY':
                if (order.orderType === 'DELIVERY') {
                    return `
                        <button class="btn-info" data-action="delivery" data-order-id="${order.id}">
                            <i class="fas fa-truck"></i>
                            Szállítás
                        </button>
                    `;
                } else {
                    return `
                        <button class="btn-success" data-action="complete" data-order-id="${order.id}">
                            <i class="fas fa-check-circle"></i>
                            Elvitt
                        </button>
                    `;
                }
            
            case 'OUT_FOR_DELIVERY':
                return `
                    <button class="btn-success" data-action="complete" data-order-id="${order.id}">
                        <i class="fas fa-check-circle"></i>
                        Kiszállítva
                    </button>
                `;
            
            default:
                return '';
        }
    }

    closeModal() {
        const modal = document.getElementById('orderModal');
        if (modal) {
            modal.classList.remove('active');
            this.cleanupModalListeners();
        }
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshOrders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadActiveOrders().then(() => {
                    this.renderOrdersList();
                    this.updateSummary();
                });
            });
        }
        
        const archiveBtn = document.getElementById('viewArchived');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => {
                this.showArchivedOrders();
            });
        }
    }

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

    updateSummary() {
        const pending = this.orders.filter(o => o.status === 'PENDING').length;
        const preparing = this.orders.filter(o => ['CONFIRMED', 'PREPARING'].includes(o.status)).length;
        const ready = this.orders.filter(o => o.status === 'READY').length;

        const pendingEl = document.getElementById('pendingCount');
        const preparingEl = document.getElementById('preparingCount');
        const readyEl = document.getElementById('readyCount');

        if (pendingEl) pendingEl.textContent = pending;
        if (preparingEl) preparingEl.textContent = preparing;
        if (readyEl) readyEl.textContent = ready;
    }

    updateConnectionStatus() {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.className = `connection-status ${this.connectionStatus}`;
        }
    }

    handleNewOrder(orderData) {
        console.log('🔔 New order received:', orderData);
        
        // Play notification sound
        this.playNotificationSound();
        
        // Show text notification
        this.showNotification(`Új rendelés érkezett: ${orderData.orderNumber}`, 'info');
        
        this.loadActiveOrders().then(() => {
            this.renderOrdersList();
            this.updateSummary();
        });
    }
    
    handleOrderUpdate(updateData) {
        console.log('📡 WebSocket order update received:', updateData);

        const orderIndex = this.orders.findIndex(o => o.id === updateData.id);
        if (orderIndex >= 0) {
            console.log(`📡 Updating local order at index ${orderIndex}`);
            this.orders[orderIndex] = { ...this.orders[orderIndex], ...updateData };
            this.renderOrdersList();
            this.updateSummary();
        } else {
            console.log('📡 Order not found in local list, refreshing from server');
            this.fallbackRefresh();
        }
    }

    handleOrderCompletion(orderData) {
        console.log('📡 WebSocket order completion received:', orderData);

        const initialLength = this.orders.length;
        this.orders = this.orders.filter(o => o.id !== orderData.id);

        if (this.orders.length < initialLength) {
            console.log(`📡 Order ${orderData.id} removed from active list`);
            this.renderOrdersList();
            this.updateSummary();
            this.showNotification(`Rendelés befejezve: ${orderData.orderNumber}`, 'success');
        } else {
            console.log('📡 Order not found in local list for completion');
            this.fallbackRefresh();
        }
    }

    isStatusPast(status, currentStatus) {
        const statusOrder = ['PENDING', 'CONFIRMED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        return statusOrder.indexOf(status) < statusOrder.indexOf(currentStatus);
    }

    getStatusTime(order, status) {
        const timeField = {
            'PENDING': 'createdAt',
            'CONFIRMED': 'acceptedAt',
            'READY': 'readyAt',
            'DELIVERED': 'deliveredAt'
        }[status];
        
        if (timeField && order[timeField]) {
            return `<span class="timeline-time">${this.formatDate(order[timeField])}</span>`;
        }
        return '';
    }

    // SIMPLIFIED API CALLS - No blocking UI updates
    async acceptOrder(orderId, estimatedMinutes) {
        try {
            console.log(`📄 Accepting order ${orderId} with ${estimatedMinutes} minutes...`);

            const response = await this.apiCall(`/orders/${orderId}/accept`, {
                method: 'PUT',
                body: JSON.stringify({ estimatedMinutes })
            });

            if (response.success) {
                console.log(`✅ API confirmed order ${orderId} accepted`);
                this.showNotification(`Rendelés elfogadva - ${estimatedMinutes} perc`, 'success');
                
                // Sync with server without blocking
                setTimeout(() => this.syncWithServer(), 1000);
            } else {
                throw new Error(response.error || 'API returned success: false');
            }
        } catch (error) {
            console.error('Failed to accept order:', error);
            this.showNotification('Hiba a rendelés elfogadása során', 'error');
            
            // Revert optimistic update
            this.fallbackRefresh();
        }
    }

    async cancelOrder(orderId) {
        try {
            console.log(`📄 Cancelling order ${orderId}...`);

            const response = await this.apiCall(`/orders/${orderId}/cancel`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'CANCELLED' })
            });
        
            if (response.success) {
                console.log(`✅ API confirmed order ${orderId} cancelled`);
                this.showNotification('Rendelés elutasítva', 'success');
                
                setTimeout(() => this.syncWithServer(), 1000);
            } else {
                throw new Error(response.error || 'API returned success: false');
            }
        } catch (error) {
            console.error('Failed to cancel order:', error);
            this.showNotification('Hiba a rendelés elutasítása során', 'error');
            this.fallbackRefresh();
        }
    }

    async markOrderReady(orderId) {
        try {
            console.log(`📄 Marking order ${orderId} as ready...`);

            const response = await this.apiCall(`/orders/${orderId}/ready`, {
                method: 'PUT'
            });

            if (response.success) {
                console.log(`✅ API confirmed order ${orderId} marked as ready`);
                this.showNotification('Rendelés kész állapotra állítva', 'success');
                
                setTimeout(() => this.syncWithServer(), 1000);
            } else {
                throw new Error(response.error || 'API returned success: false');
            }
        } catch (error) {
            console.error('Failed to mark order as ready:', error);
            this.showNotification('Hiba a rendelés készre állítása során', 'error');
            this.fallbackRefresh();
        }
    }

    async markOrderDelivery(orderId) {
        try {
            console.log(`📄 Marking order ${orderId} for delivery...`);

            const response = await this.apiCall(`/orders/${orderId}/delivery`, {
                method: 'PUT'
            });

            if (response.success) {
                console.log(`✅ API confirmed order ${orderId} marked for delivery`);
                this.showNotification('Rendelés szállítás alatt állapotra állítva', 'success');
                
                setTimeout(() => this.syncWithServer(), 1000);
            } else {
                throw new Error(response.error || 'API returned success: false');
            }
        } catch (error) {
            console.error('Failed to mark order for delivery:', error);
            this.showNotification('Hiba a rendelés szállításra állítása során', 'error');
            this.fallbackRefresh();
        }
    }

    async completeOrder(orderId) {
        try {
            console.log(`📄 Completing order ${orderId}...`);

            const response = await this.apiCall(`/orders/${orderId}/complete`, {
                method: 'PUT'
            });
        
            if (response.success) {
                console.log(`✅ API confirmed order ${orderId} completed`);
                this.showNotification('Rendelés sikeresen befejezve', 'success');
            
                setTimeout(() => this.syncWithServer(), 1000);
            } else {
                throw new Error(response.error || 'API returned success: false');
            }
        } catch (error) {
            console.error('Failed to complete order:', error);
            this.showNotification('Hiba a rendelés befejezése során', 'error');
            this.fallbackRefresh();
        }
    }

    // NEW: Non-blocking server sync
    async syncWithServer() {
        try {
            await this.loadActiveOrders();
            this.renderOrdersList();
            this.updateSummary();
        } catch (error) {
            console.error('Failed to sync with server:', error);
        }
    }

    async fallbackRefresh() {
        console.log('🔄 Executing fallback refresh...');

        try {
            await this.loadActiveOrders();
            this.renderOrdersList();
            this.updateSummary();
            this.closeModal();

            console.log('✅ Fallback refresh completed');
        } catch (error) {
            console.error('❌ Fallback refresh failed:', error);
            this.showNotification('Hiba a frissítés során', 'error');
        }
    }

    showTimeSelector(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const overlay = document.createElement('div');
        overlay.className = 'time-selector-overlay';
        overlay.id = 'timeSelectorOverlay';

        overlay.innerHTML = `
            <div class="time-selector-modal">
                <div class="time-selector-header">
                    <h3>Rendelés elfogadása</h3>
                    <p>Mennyi időbe telik elkészíteni a rendelést?</p>
                </div>

                <div class="time-options">
                    <div class="time-option" data-minutes="10">10 perc</div>
                    <div class="time-option" data-minutes="15">15 perc</div>
                    <div class="time-option" data-minutes="20">20 perc</div>
                    <div class="time-option" data-minutes="25">25 perc</div>
                </div>

                <div class="custom-time-section">
                    <label class="custom-time-label">Egyedi idő:</label>
                    <div class="custom-time-input-group">
                        <input type="text" 
                               class="custom-time-input" 
                               id="customTimeInput" 
                               placeholder="30"
                               maxlength="3">
                        <span class="time-unit">perc</span>
                    </div>
                    <div class="time-error" id="timeError">
                        Az idő legalább 5 perc kell legyen
                    </div>
                </div>

                <div class="time-selector-actions">
                    <button class="btn-cancel-time" id="cancelTimeSelector">Mégse</button>
                    <button class="btn-confirm-time" id="confirmTimeSelector" disabled>Elfogadás</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.setupTimeSelectorListeners(overlay, orderId);
        overlay.classList.add('active');
    }

    setupTimeSelectorListeners(overlay, orderId) {
        let selectedMinutes = null;

        const timeOptions = overlay.querySelectorAll('.time-option');
        const customInput = overlay.querySelector('#customTimeInput');
        const confirmBtn = overlay.querySelector('#confirmTimeSelector');
        const cancelBtn = overlay.querySelector('#cancelTimeSelector');
        const errorDiv = overlay.querySelector('#timeError');

        timeOptions.forEach(option => {
            option.addEventListener('click', () => {
                timeOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedMinutes = parseInt(option.dataset.minutes);
                customInput.value = '';
                this.hideTimeError(customInput, errorDiv);
                confirmBtn.disabled = false;
            });
        });

        customInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            const value = parseInt(e.target.value);

            timeOptions.forEach(opt => opt.classList.remove('selected'));

            if (e.target.value === '') {
                selectedMinutes = null;
                confirmBtn.disabled = true;
                this.hideTimeError(customInput, errorDiv);
                return;
            }

            if (value < 5) {
                this.showTimeError(customInput, errorDiv, 'Az idő legalább 5 perc kell legyen');
                selectedMinutes = null;
                confirmBtn.disabled = true;
            } else if (value > 480) {
                this.showTimeError(customInput, errorDiv, 'Az idő maximum 480 perc (8 óra) lehet');
                selectedMinutes = null;
                confirmBtn.disabled = true;
            } else {
                this.hideTimeError(customInput, errorDiv);
                selectedMinutes = value;
                confirmBtn.disabled = false;
            }
        });

        cancelBtn.addEventListener('click', () => {
            this.closeTimeSelector();
        });

        confirmBtn.addEventListener('click', () => {
            if (selectedMinutes) {
                this.acceptOrder(orderId, selectedMinutes);
                this.closeTimeSelector();
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeTimeSelector();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTimeSelector();
            }
        });
    }

    showTimeError(input, errorDiv, message) {
        input.classList.add('error');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }

    hideTimeError(input, errorDiv) {
        input.classList.remove('error');
        errorDiv.classList.remove('show');
    }

    closeTimeSelector() {
        const overlay = document.getElementById('timeSelectorOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    showArchivedOrders() {
        const modal = document.createElement('div');
        modal.className = 'modal archived-modal';
        modal.id = 'archivedOrdersModal';

        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content archived-content">
                <div class="modal-header">
                    <h3>Archivált rendelések</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="archive-filters">
                        <div class="filter-group">
                            <label>Időszak szűrése:</label>
                            <div class="filter-buttons">
                                <button class="filter-btn active" data-period="today">Ma</button>
                                <button class="filter-btn" data-period="week">Ez a hét</button>
                                <button class="filter-btn" data-period="month">Ez a hónap</button>
                                <button class="filter-btn" data-period="all">Minden</button>
                            </div>
                        </div>
                    </div>

                    <div class="archive-stats" id="archiveStats">
                        <div class="stat-item">
                            <span class="stat-label">Összesen:</span>
                            <span class="stat-value" id="totalArchived">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Teljesített:</span>
                            <span class="stat-value delivered" id="deliveredCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Törölve:</span>
                            <span class="stat-value cancelled" id="cancelledCount">0</span>
                        </div>
                    </div>

                    <div class="archived-orders-list" id="archivedOrdersList">
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                            Archivált rendelések betöltése...
                        </div>
                    </div>

                    <div class="archive-pagination" id="archivePagination">
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        this.setupArchivedOrdersListeners(modal);
        this.loadArchivedOrders('today', 1);
    }

    setupArchivedOrdersListeners(modal) {
        modal.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                modal.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const period = e.target.dataset.period;
                this.loadArchivedOrders(period, 1);
            });
        });
    }

    async loadArchivedOrders(period = 'today', page = 1) {
        try {
            const container = document.getElementById('archivedOrdersList');
            if (container) {
                container.innerHTML = `
                    <div class="loading-placeholder">
                        <i class="fas fa-spinner fa-spin"></i>
                        Betöltés...
                    </div>
                `;
            }

            const response = await this.apiCall(`/orders/archived?period=${period}&page=${page}&limit=20`);

            if (response.success) {
                this.renderArchivedOrders(response.data);
                this.renderArchivePagination(response.data);
                this.updateArchiveStats(response.data.orders);
            }

        } catch (error) {
            console.error('Failed to load archived orders:', error);
            this.showNotification('Nem sikerült betölteni az archivált rendeléseket', 'error');

            const container = document.getElementById('archivedOrdersList');
            if (container) {
                container.innerHTML = `
                    <div class="error-placeholder">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Hiba történt a betöltés során</p>
                    </div>
                `;
            }
        }
    }

    renderArchivedOrders(data) {
        const container = document.getElementById('archivedOrdersList');
        if (!container) return;

        if (data.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-archive"></i>
                    <h3>Nincsenek archivált rendelések</h3>
                    <p>A kiválasztott időszakban nincsenek befejezett rendelések.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.orders.map(order => `
            <div class="archived-order-card ${order.status.toLowerCase()}" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-number">${order.orderNumber}</span>
                        <span class="order-date">${this.formatDate(order.createdAt, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}</span>
                    </div>
                    <div class="order-status status-${order.status.toLowerCase()}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                    
                <div class="order-details">
                    <div class="customer-info">
                        <i class="fas fa-user"></i>
                        <span>${this.escapeHtml(order.customerName)}</span>
                        <span class="order-type ${order.orderType.toLowerCase()}">
                            <i class="fas fa-${order.orderType === 'DELIVERY' ? 'truck' : 'store'}"></i>
                            ${order.orderType === 'DELIVERY' ? 'Szállítás' : 'Elvitel'}
                        </span>
                    </div>
                    
                    <div class="order-summary">
                        <span class="item-count">${order.items.length} tétel</span>
                        <span class="order-total">${this.formatCurrency(order.total)}</span>
                    </div>
                </div>
            </div>
        `).join('');
                    
        container.querySelectorAll('.archived-order-card').forEach(card => {
            card.addEventListener('click', () => {
                const orderId = parseInt(card.dataset.orderId);
                const order = data.orders.find(o => o.id === orderId);
                if (order) {
                    this.showArchivedOrderDetails(order);
                }
            });
        });
    }

    updateArchiveStats(orders) {
        const totalEl = document.getElementById('totalArchived');
        const deliveredEl = document.getElementById('deliveredCount');
        const cancelledEl = document.getElementById('cancelledCount');

        if (totalEl) totalEl.textContent = orders.length;
        if (deliveredEl) deliveredEl.textContent = orders.filter(o => o.status === 'DELIVERED').length;
        if (cancelledEl) cancelledEl.textContent = orders.filter(o => o.status === 'CANCELLED').length;
    }

    renderArchivePagination(data) {
        const container = document.getElementById('archivePagination');
        if (!container) return;

        const totalPages = Math.ceil(data.total / data.limit);
        const currentPage = data.page;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-buttons">';

        if (currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">Előző</button>`;
        }

        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">Következő</button>`;
        }

        paginationHTML += '</div>';
        paginationHTML += `<div class="pagination-info">Oldal ${currentPage}/${totalPages} (${data.total} rendelés)</div>`;

        container.innerHTML = paginationHTML;

        container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                const activePeriod = document.querySelector('.filter-btn.active').dataset.period;
                this.loadArchivedOrders(activePeriod, page);
            });
        });
    }

    showArchivedOrderDetails(order) {
        const modal = document.getElementById('orderModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = `Archivált rendelés ${order.orderNumber}`;
        modalBody.innerHTML = this.renderOrderModal(order);

        modal.classList.add('active');

        modal.querySelector('.modal-backdrop').onclick = () => this.closeModal();
        modal.querySelector('.modal-close').onclick = () => this.closeModal();
    }

    destroy() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
        
        if (this.disconnectedFallbackInterval) {
            clearInterval(this.disconnectedFallbackInterval);
            this.disconnectedFallbackInterval = null;
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.cleanupModalListeners();
        super.destroy();
    }
}

// Make globally available
window.OrdersApp = OrdersApp;