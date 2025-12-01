/**
 * Palace Cafe & Bar - Statistics & Analytics App
 * Advanced statistics dashboard with modern visualizations
 * 
 * Uses Chart.js for modern, responsive charts
 */

'use strict';

class StatsApp extends BaseApp {
    constructor() {
        super('analytics');
        
        // Chart instances for cleanup
        this.chartInstances = new Map();
        
        // Data cache
        this.statsData = {
            overview: null,
            revenueTrends: null,
            topItems: null,
            orderTiming: null,
            paymentMethods: null
        };
        
        // Current filters
        this.filters = {
            period: 'month',
            startDate: null,
            endDate: null,
            groupBy: 'day'
        };
        
        // Chart colors (matching brand)
        this.chartColors = {
            primary: '#D4AF37',
            secondary: '#2c3e50',
            success: '#27ae60',
            warning: '#f39c12',
            danger: '#e74c3c',
            info: '#3498db',
            gradients: {
                gold: ['#D4AF37', '#E8C547'],
                blue: ['#3498db', '#2980b9'],
                green: ['#27ae60', '#229954'],
                red: ['#e74c3c', '#c0392b']
            }
        };
    }

    async initialize() {
        console.log('📊 Initializing Statistics App...');
        
        // Render the main interface
        this.render();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadAllStatistics();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        console.log('✅ Statistics App initialized');
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="stats-header">
                <div class="stats-title">
                    <h2>📊 Statisztikák & Elemzések</h2>
                    <p>Részletes betekintés az üzleti teljesítménybe</p>
                </div>
                
                <div class="stats-filters">
                    <div class="filter-group">
                        <label>Időszak:</label>
                        <select id="periodFilter" class="period-select">
                            <option value="today">Ma</option>
                            <option value="week">Ez a hét</option>
                            <option value="month" selected>Ez a hónap</option>
                            <option value="year">Ez az év</option>
                            <option value="custom">Egyedi</option>
                        </select>
                    </div>
                    
                    <div class="date-range-group" id="dateRangeGroup" style="display: none;">
                        <input type="date" id="startDate" class="date-input">
                        <span>-</span>
                        <input type="date" id="endDate" class="date-input">
                    </div>
                    
                    <button class="btn-refresh" id="refreshStats">
                        <i class="fas fa-sync"></i>
                        Frissítés
                    </button>
                </div>
            </div>

            <!-- Overview Cards -->
            <section class="overview-section">
                <div class="overview-cards">
                    <div class="overview-card revenue">
                        <div class="card-icon">
                            <i class="fas fa-euro-sign"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="totalRevenue">--</h3>
                            <p>Összes bevétel</p>
                            <span class="trend" id="revenueTrend">
                                <i class="fas fa-arrow-up"></i>
                                +0%
                            </span>
                        </div>
                    </div>

                    <div class="overview-card orders">
                        <div class="card-icon">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="totalOrders">--</h3>
                            <p>Összes rendelés</p>
                            <span class="trend" id="ordersTrend">
                                <i class="fas fa-arrow-up"></i>
                                +0%
                            </span>
                        </div>
                    </div>

                    <div class="overview-card avg-order">
                        <div class="card-icon">
                            <i class="fas fa-calculator"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="avgOrderValue">--</h3>
                            <p>Átlagos rendelésérték</p>
                            <span class="trend" id="avgTrend">
                                <i class="fas fa-arrow-up"></i>
                                +0%
                            </span>
                        </div>
                    </div>

                    <div class="overview-card prep-time">
                        <div class="card-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="card-content">
                            <h3 id="avgPrepTime">--</h3>
                            <p>Átl. előkészítési idő</p>
                            <span class="trend" id="prepTimeTrend">
                                <i class="fas fa-arrow-down"></i>
                                -0%
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Charts Grid -->
            <section class="charts-section">
                <!-- Revenue Trends Chart -->
                <div class="chart-container revenue-trends">
                    <div class="chart-header">
                        <h3>
                            <i class="fas fa-chart-line"></i>
                            Bevétel alakulása
                        </h3>
                        <div class="chart-controls">
                            <select id="revenueGroupBy" class="chart-select">
                                <option value="hour">Óránként</option>
                                <option value="day" selected>Naponta</option>
                                <option value="week">Hetente</option>
                                <option value="month">Havonta</option>
                            </select>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="revenueTrendsChart"></canvas>
                    </div>
                </div>

                <!-- Top Items Chart -->
                <div class="chart-container top-items">
                    <div class="chart-header">
                        <h3>
                            <i class="fas fa-trophy"></i>
                            Legnépszerűbb termékek
                        </h3>
                        <div class="chart-controls">
                            <select id="topItemsSort" class="chart-select">
                                <option value="revenue" selected>Bevétel szerint</option>
                                <option value="quantity">Mennyiség szerint</option>
                            </select>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="topItemsChart"></canvas>
                    </div>
                </div>

                <!-- Order Types Chart -->
                <div class="chart-container order-types">
                    <div class="chart-header">
                        <h3>
                            <i class="fas fa-truck"></i>
                            Rendelés típusok
                        </h3>
                    </div>
                    <div class="chart-content">
                        <canvas id="orderTypesChart"></canvas>
                    </div>
                </div>

                <!-- Payment Methods Chart -->
                <div class="chart-container payment-methods">
                    <div class="chart-header">
                        <h3>
                            <i class="fas fa-credit-card"></i>
                            Fizetési módok
                        </h3>
                    </div>
                    <div class="chart-content">
                        <canvas id="paymentMethodsChart"></canvas>
                    </div>
                </div>

                <!-- Peak Hours Heatmap -->
                <div class="chart-container peak-hours full-width">
                    <div class="chart-header">
                        <h3>
                            <i class="fas fa-fire"></i>
                            Csúcsórák hőtérképe
                        </h3>
                        <div class="chart-controls">
                            <button class="btn-secondary" id="toggleHeatmapView">
                                <i class="fas fa-th"></i>
                                Nézet váltása
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <div id="peakHoursHeatmap"></div>
                    </div>
                </div>
            </section>

            <!-- Detailed Tables Section -->
            <section class="tables-section">
                <div class="table-container">
                    <div class="table-header">
                        <h3>
                            <i class="fas fa-list"></i>
                            Részletes adatok
                        </h3>
                        <div class="table-tabs">
                            <button class="tab-btn active" data-tab="items">Termékek</button>
                            <button class="tab-btn" data-tab="hours">Óránkénti</button>
                            <button class="tab-btn" data-tab="summary">Összegzés</button>
                        </div>
                    </div>
                    <div class="table-content">
                        <div id="itemsTable" class="table-view active">
                            <!-- Items table will be rendered here -->
                        </div>
                        <div id="hoursTable" class="table-view">
                            <!-- Hours table will be rendered here -->
                        </div>
                        <div id="summaryTable" class="table-view">
                            <!-- Summary table will be rendered here -->
                        </div>
                    </div>
                </div>
            </section>

            <!-- Loading Overlay -->
            <div class="stats-loading" id="statsLoading">
                <div class="loading-spinner">
                    <i class="fas fa-chart-line fa-spin"></i>
                    <p>Statisztikák betöltése...</p>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Period filter change
        const periodFilter = document.getElementById('periodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.handlePeriodChange(e.target.value);
            });
        }

        // Date range inputs
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate && endDate) {
            startDate.addEventListener('change', () => this.handleDateRangeChange());
            endDate.addEventListener('change', () => this.handleDateRangeChange());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshStats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAllStatistics();
            });
        }

        // Chart controls
        this.setupChartControls();

        // Table tabs
        this.setupTableTabs();
    }

    setupChartControls() {
        // Revenue grouping change
        const revenueGroupBy = document.getElementById('revenueGroupBy');
        if (revenueGroupBy) {
            revenueGroupBy.addEventListener('change', async (e) => {
                this.filters.groupBy = e.target.value;
                await this.loadRevenueTrends();
                this.renderRevenueTrendsChart(); // Re-render chart after data loads
            });
        }

        // Top items sorting change
        const topItemsSort = document.getElementById('topItemsSort');
        if (topItemsSort) {
            topItemsSort.addEventListener('change', (e) => {
                this.loadTopItems(e.target.value);
                this.renderTopItemsChart();
            });
        }

        // Heatmap view toggle
        const heatmapToggle = document.getElementById('toggleHeatmapView');
        if (heatmapToggle) {
            heatmapToggle.addEventListener('click', () => {
                this.toggleHeatmapView();
            });
        }
    }

    setupTableTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTable(tab);
            });
        });
    }

    // ============================================
    // DATA LOADING METHODS
    // ============================================

    async loadAllStatistics() {
        this.showLoading();

        try {
            await Promise.all([
                this.loadOverviewStats(),
                this.loadRevenueTrends(),
                this.loadTopItems(),
                this.loadOrderTiming(),
                this.loadPaymentMethods()
            ]);

            this.updateUI();
        } catch (error) {
            console.error('Failed to load statistics:', error);
            this.showNotification('Hiba a statisztikák betöltésénél', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadOverviewStats() {
        try {
            const params = new URLSearchParams({
                period: this.filters.period
            });

            if (this.filters.startDate && this.filters.endDate) {
                params.append('startDate', this.filters.startDate);
                params.append('endDate', this.filters.endDate);
            }

            const response = await this.apiCall(`/stats/overview?${params}`);

            if (response.success) {
                this.statsData.overview = response.data;
                console.log('✅ Overview stats loaded:', this.statsData.overview);
            }
        } catch (error) {
            console.error('Failed to load overview stats:', error);
            // Set fallback data
            this.statsData.overview = {
                totalRevenue: 0,
                totalOrders: 0,
                avgOrderValue: 0,
                revenueByType: [],
                ordersByStatus: []
            };
        }
    }

    async loadRevenueTrends() {
        try {
            const params = new URLSearchParams({
                period: this.filters.period,
                groupBy: this.filters.groupBy
            });

            if (this.filters.startDate && this.filters.endDate) {
                params.append('startDate', this.filters.startDate);
                params.append('endDate', this.filters.endDate);
            }

            const response = await this.apiCall(`/stats/revenue-trends?${params}`);

            if (response.success) {
                this.statsData.revenueTrends = response.data.trends || [];
                console.log('✅ Revenue trends loaded:', this.statsData.revenueTrends);
            }
        } catch (error) {
            console.error('Failed to load revenue trends:', error);
            this.statsData.revenueTrends = [];
        }
    }

    async loadTopItems(sortBy = 'revenue') {
        try {
            const params = new URLSearchParams({
                period: this.filters.period,
                sortBy: sortBy,
                limit: 10
            });

            if (this.filters.startDate && this.filters.endDate) {
                params.append('startDate', this.filters.startDate);
                params.append('endDate', this.filters.endDate);
            }

            const response = await this.apiCall(`/stats/top-items?${params}`);

            if (response.success) {
                this.statsData.topItems = response.data.items || [];
                console.log('✅ Top items loaded:', this.statsData.topItems);
            }
        } catch (error) {
            console.error('Failed to load top items:', error);
            this.statsData.topItems = [];
        }
    }

    async loadOrderTiming() {
        try {
            const params = new URLSearchParams({
                period: this.filters.period
            });

            const response = await this.apiCall(`/stats/order-timing?${params}`);

            if (response.success) {
                this.statsData.orderTiming = response.data;
                console.log('✅ Order timing loaded:', this.statsData.orderTiming);
            }
        } catch (error) {
            console.error('Failed to load order timing:', error);
            this.statsData.orderTiming = {
                avgPrepTimes: [],
                peakHours: []
            };
        }
    }

    async loadPaymentMethods() {
        try {
            const params = new URLSearchParams({
                period: this.filters.period
            });

            if (this.filters.startDate && this.filters.endDate) {
                params.append('startDate', this.filters.startDate);
                params.append('endDate', this.filters.endDate);
            }

            const response = await this.apiCall(`/stats/payment-methods?${params}`);

            if (response.success) {
                this.statsData.paymentMethods = response.data.paymentMethods || [];
                console.log('✅ Payment methods loaded:', this.statsData.paymentMethods);
            }
        } catch (error) {
            console.error('Failed to load payment methods:', error);
            this.statsData.paymentMethods = [];
        }
    }

    // ============================================
    // CHART RENDERING METHODS
    // ============================================

    renderRevenueTrendsChart() {        
        this.destroyChart('revenueTrends');

        let ctx = document.getElementById('revenueTrendsChart');
        // Get or restore canvas element
        const container = document.querySelector('.revenue-trends .chart-content');
        if (!container) return;

        // Restore canvas if it was replaced with empty state
        if (!ctx) {
            container.innerHTML = '<canvas id="revenueTrendsChart"></canvas>';
            ctx = document.getElementById('revenueTrendsChart');
        }

        // Show empty state if no data available
        if (!this.statsData.revenueTrends || this.statsData.revenueTrends.length === 0) {
            container.innerHTML = '<div class="chart-empty">Nincs elérhető adat</div>';
            return;
        }


        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.statsData.revenueTrends.map(item => this.formatDateLabel(item.date)),
                datasets: [{
                    label: 'Bevétel',
                    data: this.statsData.revenueTrends.map(item => item.revenue),
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.createGradient(ctx.getContext('2d'), this.chartColors.gradients.gold),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => `Bevétel: ${this.formatCurrency(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: { callback: (value) => this.formatCurrency(value) }
                    },
                    x: { grid: { display: false } }
                }
            }
        });

        this.chartInstances.set('revenueTrends', chart);
    }

    renderTopItemsChart() {
        this.destroyChart('topItems');


        let ctx = document.getElementById('topItemsChart');
        
        // Get or restore canvas element
        const container = document.querySelector('.top-items .chart-content');
        if (!container) return;

        // Restore canvas if it was replaced with empty state
        if (!ctx) {
            container.innerHTML = '<canvas id="topItemsChart"></canvas>';
            ctx = document.getElementById('topItemsChart');
        }

        // Show empty state if no data available
        if (!this.statsData.topItems || this.statsData.topItems.length === 0) {
            container.innerHTML = '<div class="chart-empty">Nincs elérhető adat</div>';
            return;
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.statsData.topItems.map(item => item.name),
                datasets: [{
                    label: 'Bevétel',
                    data: this.statsData.topItems.map(item => item.totalRevenue),
                    backgroundColor: this.statsData.topItems.map((_, index) => 
                        `rgba(52, 152, 219, ${0.9 - index * 0.1})`
                    ),
                    borderColor: this.chartColors.info,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: (context) => {
                                const item = this.statsData.topItems[context.dataIndex];
                                return [
                                    `Bevétel: ${this.formatCurrency(item.totalRevenue)}`,
                                    `Mennyiség: ${item.totalQuantity} db`,
                                    `Rendelések: ${item.orderCount} db`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: { callback: (value) => this.formatCurrency(value) }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 45 }
                    }
                }
            }
        });

        this.chartInstances.set('topItems', chart);
    }

    renderOrderTypesChart() {
        this.destroyChart('orderTypes');

        const ctx = document.getElementById('orderTypesChart');
        // Exit early if chart element doesn't exist in DOM
        if (!ctx) return;

        // Show empty state if no data available
        if (!this.statsData.overview || !this.statsData.overview.revenueByType) {
            ctx.parentElement.innerHTML = '<div class="chart-empty">Nincs elérhető adat</div>';
            return;
        }

        const revenueByType = this.statsData.overview.revenueByType;

        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: revenueByType.map(item => 
                    item.orderType === 'DELIVERY' ? 'Szállítás' : 'Elvitel'
                ),
                datasets: [{
                    data: revenueByType.map(item => item._sum.total || 0),
                    backgroundColor: [this.chartColors.info, this.chartColors.success],
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, usePointStyle: true, font: { size: 14 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: (context) => {
                                const item = revenueByType[context.dataIndex];
                                return [
                                    `Bevétel: ${this.formatCurrency(item._sum.total || 0)}`,
                                    `Rendelések: ${item._count} db`
                                ];
                            }
                        }
                    }
                }
            }
        });

        this.chartInstances.set('orderTypes', chart);
    }

    renderPaymentMethodsChart() {
        this.destroyChart('paymentMethods');

        let ctx = document.getElementById('paymentMethodsChart');
        
        // Get or restore canvas element
        const container = document.querySelector('.payment-methods .chart-content');
        if (!container) return;

        // Restore canvas if it was replaced with empty state
        if (!ctx) {
            container.innerHTML = '<canvas id="paymentMethodsChart"></canvas>';
            ctx = document.getElementById('paymentMethodsChart');
        }

        // Show empty state if no data available
        if (!this.statsData.paymentMethods || this.statsData.paymentMethods.length === 0) {
            container.innerHTML = '<div class="chart-empty">Nincs elérhető adat</div>';
            return;
        }

        const paymentMethodLabels = {
            'CASH': 'Készpénz',
            'CARD': 'Kártya',
            'ONLINE': 'Online'
        };

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.statsData.paymentMethods.map(item => 
                    paymentMethodLabels[item.paymentMethod] || item.paymentMethod
                ),
                datasets: [{
                    data: this.statsData.paymentMethods.map(item => item._sum.total || 0),
                    backgroundColor: [
                        this.chartColors.warning,
                        this.chartColors.primary,
                        this.chartColors.info
                    ],
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, usePointStyle: true, font: { size: 14 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: (context) => {
                                const item = this.statsData.paymentMethods[context.dataIndex];
                                return [
                                    `Bevétel: ${this.formatCurrency(item._sum.total || 0)}`,
                                    `Rendelések: ${item._count} db`
                                ];
                            }
                        }
                    }
                }
            }
        });

        this.chartInstances.set('paymentMethods', chart);
    }

    renderPeakHoursHeatmap() {
        const container = document.getElementById('peakHoursHeatmap');
        if (!container) return;
        
        if (!this.statsData.orderTiming || !this.statsData.orderTiming.peakHours) {
            container.innerHTML = '<div class="chart-empty">Nincs elérhető adat</div>';
            return;
        }

        const peakHours = this.statsData.orderTiming.peakHours;

        // Create data grid only for open days (Wed=3, Thu=4, Fri=5, Sat=6)
        // Using object to map dayOfWeek to our display order
        const openDays = [
            { dayOfWeek: 3, name: 'Szerda' },
            { dayOfWeek: 4, name: 'Csütörtök' },
            { dayOfWeek: 5, name: 'Péntek' },
            { dayOfWeek: 6, name: 'Szombat' }
        ];

        // Initialize heatmap data for 4 days x 24 hours
        const heatmapData = openDays.map(day => ({
            name: day.name,
            dayOfWeek: day.dayOfWeek,
            hours: Array(24).fill(0)
        }));

        // Fill in the order counts
        peakHours.forEach(entry => {
            const dayIndex = heatmapData.findIndex(d => d.dayOfWeek === entry.dayOfWeek);
            if (dayIndex !== -1 && entry.hour >= 0 && entry.hour < 24) {
                heatmapData[dayIndex].hours[entry.hour] = entry.orderCount;
            }
        });

        // Find max orders for color scaling
        const maxOrders = Math.max(...peakHours.map(h => h.orderCount), 1);

        container.innerHTML = `
            <div class="heatmap-grid">
                <div class="heatmap-header">
                    <div class="day-spacer"></div>
                    <div class="hour-labels">
                        ${Array.from({length: 24}, (_, i) => 
                            `<div class="hour-label">${i.toString().padStart(2, '0')}:00</div>`
                        ).join('')}
                    </div>
                </div>
                <div class="heatmap-body">
                    ${heatmapData.map(dayData => `
                        <div class="heatmap-row">
                            <div class="day-label">${dayData.name}</div>
                            <div class="hour-cells">
                                ${dayData.hours.map((orderCount, hourIndex) => `
                                    <div class="heatmap-cell" 
                                         style="background-color: ${this.getHeatmapColor(orderCount, maxOrders)}"
                                         data-orders="${orderCount}"
                                         data-day="${dayData.name}"
                                         data-hour="${hourIndex}"
                                         title="${orderCount} rendelés ${hourIndex}:00-kor">
                                        ${orderCount > 0 ? orderCount : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="heatmap-legend">
                <span>0</span>
                <div class="legend-gradient"></div>
                <span>${maxOrders}</span>
            </div>
        `;
    }

    // Helper methods
    formatDateLabel(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('hu-HU', { 
            month: 'short', 
            day: 'numeric'
        });
    }

    getHeatmapColor(orderCount, maxOrders) {
        if (orderCount === 0) return '#f8f9fa';

        const intensity = orderCount / maxOrders;
        const colors = [
            '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', 
            '#42a5f5', '#2196f3', '#1976d2', '#0d47a1'
        ];

        const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
        return colors[index];
    }

    // Update the updateUI method to handle empty data
    updateUI() {
        this.updateOverviewCards();
        this.renderAllCharts();
        this.renderItemsTable(); // Default table

        // Hide loading and show content
        this.hideLoading();
    }

    // ============================================
    // TABLE RENDERING METHODS
    // ============================================


    renderItemsTable() {
        const container = document.getElementById('itemsTable');
        if (!container) return;

        if (!this.statsData.topItems || this.statsData.topItems.length === 0) {
            container.innerHTML = `
                <div class="table-empty">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Nincs elérhető adat</h3>
                    <p>A kiválasztott időszakban nincsenek termék adatok.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-header-row">
                <h4>Részletes termék statisztikák</h4>
                <div class="table-controls">
                    <button class="btn-export" onclick="window.statsApp.exportItemsData()">
                        <i class="fas fa-download"></i>
                        Exportálás
                    </button>
                </div>
            </div>

            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Rang</th>
                            <th>Termék neve</th>
                            <th>Összes bevétel</th>
                            <th>Eladott mennyiség</th>
                            <th>Rendelések száma</th>
                            <th>Átlagos ár</th>
                            <th>Teljesítmény</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.statsData.topItems.map((item, index) => {
                            const avgPrice = item.totalQuantity > 0 ? item.totalRevenue / item.totalQuantity : 0;
                            const maxRevenue = this.statsData.topItems[0]?.totalRevenue || 1;
                            const performance = Math.round((item.totalRevenue / maxRevenue) * 100);

                            return `
                                <tr class="table-row">
                                    <td>
                                        <div class="rank-badge rank-${index < 3 ? 'top' : 'normal'}">
                                            ${index + 1}
                                            ${index === 0 ? '<i class="fas fa-crown"></i>' : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="item-info">
                                            <span class="item-name">${this.escapeHtml(item.name)}</span>
                                            <span class="item-id">#${item.id}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="revenue-amount">${this.formatCurrency(item.totalRevenue)}</span>
                                    </td>
                                    <td>
                                        <span class="quantity-amount">${item.totalQuantity.toLocaleString()} db</span>
                                    </td>
                                    <td>
                                        <span class="order-count">${item.orderCount.toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <span class="avg-price">${this.formatCurrency(avgPrice)}</span>
                                    </td>
                                    <td>
                                        <div class="performance-indicator">
                                            <div class="performance-bar">
                                                <div class="performance-fill" style="width: ${performance}%"></div>
                                            </div>
                                            <span class="performance-text">${performance}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderHoursTable() {
        const container = document.getElementById('hoursTable');
        if (!container) return;

        if (!this.statsData.orderTiming || !this.statsData.orderTiming.peakHours || this.statsData.orderTiming.peakHours.length === 0) {
            container.innerHTML = `
                <div class="table-empty">
                    <i class="fas fa-clock"></i>
                    <h3>Nincs elérhető adat</h3>
                    <p>A kiválasztott időszakban nincsenek óránkénti adatok.</p>
                </div>
            `;
            return;
        }

        // Process peak hours data into hourly breakdown
        const hourlyBreakdown = this.processHourlyData(this.statsData.orderTiming.peakHours);

        container.innerHTML = `
            <div class="table-header-row">
                <h4>Óránkénti teljesítmény elemzés</h4>
                <div class="table-controls">
                    <button class="btn-export" onclick="window.statsApp.exportHoursData()">
                        <i class="fas fa-download"></i>
                        Exportálás
                    </button>
                </div>
            </div>

            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Óra</th>
                            <th>Rendelések száma</th>
                            <th>Átlagos bevétel</th>
                            <th>Hétköznap</th>
                            <th>Hétvége</th>
                            <th>Csúcsidő</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hourlyBreakdown.map(hour => `
                            <tr class="table-row">
                                <td>
                                    <div class="time-period">
                                        <span class="time-main">${hour.hour.toString().padStart(2, '0')}:00</span>
                                        <span class="time-sub">${hour.period}</span>
                                    </div>
                                </td>
                                <td>
                                    <span class="order-count">${hour.totalOrders.toLocaleString()}</span>
                                </td>
                                <td>
                                    <span class="revenue-amount">${this.formatCurrency(hour.avgRevenue)}</span>
                                </td>
                                <td>
                                    <span class="weekday-orders">${hour.weekdayOrders.toLocaleString()}</span>
                                </td>
                                <td>
                                    <span class="weekend-orders">${hour.weekendOrders.toLocaleString()}</span>
                                </td>
                                <td>
                                    <div class="peak-indicator ${hour.isPeak ? 'peak' : 'normal'}">
                                        ${hour.isPeak ? '<i class="fas fa-fire"></i> Csúcs' : '<i class="fas fa-minus"></i> Normál'}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderSummaryTable() {
        const container = document.getElementById('summaryTable');
        if (!container) return;

        if (!this.statsData.overview) {
            container.innerHTML = `
                <div class="table-empty">
                    <i class="fas fa-chart-pie"></i>
                    <h3>Nincs elérhető adat</h3>
                    <p>A kiválasztott időszakban nincsenek összegző adatok.</p>
                </div>
            `;
            return;
        }

        const summaryStats = this.calculateSummaryStats();

        container.innerHTML = `
            <div class="table-header-row">
                <h4>Összegző statisztikák</h4>
                <div class="table-controls">
                    <button class="btn-export" onclick="window.statsApp.exportSummaryData()">
                        <i class="fas fa-download"></i>
                        Exportálás
                    </button>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-section">
                    <h5><i class="fas fa-chart-line"></i> Bevétel elemzés</h5>
                    <div class="summary-items">
                        ${summaryStats.revenue.map(item => `
                            <div class="summary-item">
                                <span class="summary-label">${item.label}</span>
                                <span class="summary-value">${item.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="summary-section">
                    <h5><i class="fas fa-shopping-cart"></i> Rendelés elemzés</h5>
                    <div class="summary-items">
                        ${summaryStats.orders.map(item => `
                            <div class="summary-item">
                                <span class="summary-label">${item.label}</span>
                                <span class="summary-value">${item.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="summary-section">
                    <h5><i class="fas fa-credit-card"></i> Fizetési módok</h5>
                    <div class="summary-items">
                        ${summaryStats.payments.map(item => `
                            <div class="summary-item">
                                <span class="summary-label">${item.label}</span>
                                <span class="summary-value">${item.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="summary-section">
                    <h5><i class="fas fa-truck"></i> Rendelés típusok</h5>
                    <div class="summary-items">
                        ${summaryStats.orderTypes.map(item => `
                            <div class="summary-item">
                                <span class="summary-label">${item.label}</span>
                                <span class="summary-value">${item.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Helper methods for processing real data
    processHourlyData(peakHoursData) {
        const hourlyStats = Array.from({length: 24}, (_, hour) => ({
            hour,
            period: this.getTimePeriod(hour),
            totalOrders: 0,
            weekdayOrders: 0,
            weekendOrders: 0,
            avgRevenue: 0,
            isPeak: false
        }));

        // Process peak hours data
        peakHoursData.forEach(entry => {
            const hourIndex = entry.hour;
            if (hourIndex >= 0 && hourIndex < 24) {
                hourlyStats[hourIndex].totalOrders += entry.orderCount;

                // Separate weekday/weekend (assuming dayOfWeek: 0=Sunday, 6=Saturday)
                if (entry.dayOfWeek === 0 || entry.dayOfWeek === 6) {
                    hourlyStats[hourIndex].weekendOrders += entry.orderCount;
                } else {
                    hourlyStats[hourIndex].weekdayOrders += entry.orderCount;
                }

                // Calculate average revenue (you'd need to add this to the API)
                hourlyStats[hourIndex].avgRevenue = entry.avgRevenue || 0;
            }
        });

        // Determine peak hours (top 25% of order volume)
        const maxOrders = Math.max(...hourlyStats.map(h => h.totalOrders));
        const peakThreshold = maxOrders * 0.75;

        hourlyStats.forEach(hour => {
            hour.isPeak = hour.totalOrders >= peakThreshold && hour.totalOrders > 0;
        });

        return hourlyStats.filter(hour => hour.totalOrders > 0);
    }

    getTimePeriod(hour) {
        if (hour >= 6 && hour < 11) return 'Reggel';
        if (hour >= 11 && hour < 14) return 'Ebéd';
        if (hour >= 14 && hour < 17) return 'Délután';
        if (hour >= 17 && hour < 22) return 'Vacsora';
        return 'Éjszaka';
    }

    calculateSummaryStats() {
        const overview = this.statsData.overview;
        const revenueByType = overview.revenueByType || [];
        const paymentMethods = this.statsData.paymentMethods || [];

        // Calculate revenue stats
        const revenue = [
            { label: 'Összes bevétel', value: this.formatCurrency(overview.totalRevenue) },
            { label: 'Átlagos rendelésérték', value: this.formatCurrency(overview.avgOrderValue) },
            { label: 'Rendelések száma', value: overview.totalOrders.toLocaleString() }
        ];

        // Calculate order stats
        const totalOrdersByType = revenueByType.reduce((sum, type) => sum + type._count, 0);
        const orders = [
            { label: 'Összes rendelés', value: overview.totalOrders.toLocaleString() },
            { label: 'Átlagos napi', value: Math.round(overview.totalOrders / this.getDaysInPeriod()).toLocaleString() }
        ];

        // Calculate payment method percentages
        const totalPaymentRevenue = paymentMethods.reduce((sum, method) => sum + (method._sum.total || 0), 0);
        const payments = paymentMethods.map(method => ({
            label: this.getPaymentMethodName(method.paymentMethod),
            value: totalPaymentRevenue > 0 ? 
                `${Math.round((method._sum.total / totalPaymentRevenue) * 100)}%` : '0%'
        }));

        // Calculate order type percentages
        const totalTypeRevenue = revenueByType.reduce((sum, type) => sum + (type._sum.total || 0), 0);
        const orderTypes = revenueByType.map(type => ({
            label: type.orderType === 'DELIVERY' ? 'Szállítás' : 'Elvitel',
            value: totalTypeRevenue > 0 ? 
                `${Math.round((type._sum.total / totalTypeRevenue) * 100)}%` : '0%'
        }));

        return { revenue, orders, payments, orderTypes };
    }

    getPaymentMethodName(method) {
        const names = {
            'CASH': 'Készpénz',
            'CARD': 'Kártya', 
            'ONLINE': 'Online'
        };
        return names[method] || method;
    }

    getDaysInPeriod() {
        // Calculate days based on current filter period
        switch (this.filters.period) {
            case 'today': return 1;
            case 'week': return 7;
            case 'month': return 30;
            case 'custom':
                if (this.filters.startDate && this.filters.endDate) {
                    const start = new Date(this.filters.startDate);
                    const end = new Date(this.filters.endDate);
                    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                }
                return 30;
            default: return 30;
        }
    }

    // Export methods - implement actual export functionality
    exportItemsData() {
        const csvData = this.generateItemsCSV();
        this.downloadCSV(csvData, 'termek_statisztikak.csv');
    }

    exportHoursData() {
        const csvData = this.generateHoursCSV();
        this.downloadCSV(csvData, 'orankenti_adatok.csv');
    }

    exportSummaryData() {
        const csvData = this.generateSummaryCSV();
        this.downloadCSV(csvData, 'osszegzo_statisztikak.csv');
    }

    generateItemsCSV() {
        if (!this.statsData.topItems) return '';

        const headers = ['Rang', 'Termék neve', 'ID', 'Összes bevétel', 'Eladott mennyiség', 'Rendelések száma', 'Átlagos ár'];
        const rows = this.statsData.topItems.map((item, index) => [
            index + 1,
            item.name,
            item.id,
            item.totalRevenue,
            item.totalQuantity,
            item.orderCount,
            item.totalQuantity > 0 ? item.totalRevenue / item.totalQuantity : 0
        ]);

        return this.arrayToCSV([headers, ...rows]);
    }

    generateHoursCSV() {
        if (!this.statsData.orderTiming?.peakHours) return '';

        const headers = ['Óra', 'Rendelések száma', 'Nap típus'];
        const rows = this.statsData.orderTiming.peakHours.map(entry => [
            entry.hour,
            entry.orderCount,
            entry.dayOfWeek === 0 || entry.dayOfWeek === 6 ? 'Hétvége' : 'Hétköznap'
        ]);

        return this.arrayToCSV([headers, ...rows]);
    }

    generateSummaryCSV() {
        const stats = this.calculateSummaryStats();
        const allData = [
            ...stats.revenue,
            ...stats.orders,
            ...stats.payments,
            ...stats.orderTypes
        ];

        const headers = ['Kategória', 'Érték'];
        const rows = allData.map(item => [item.label, item.value]);

        return this.arrayToCSV([headers, ...rows]);
    }

    arrayToCSV(data) {
        return data.map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification(`${filename} sikeresen letöltve`, 'success');
        }
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    handlePeriodChange(period) {
        this.filters.period = period;
        
        const dateRangeGroup = document.getElementById('dateRangeGroup');
        if (period === 'custom') {
            dateRangeGroup.style.display = 'flex';
        } else {
            dateRangeGroup.style.display = 'none';
            this.filters.startDate = null;
            this.filters.endDate = null;
            this.loadAllStatistics();
        }
    }

    handleDateRangeChange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
            this.filters.startDate = startDate;
            this.filters.endDate = endDate;
            this.loadAllStatistics();
        }
    }

    switchTable(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update table views
        document.querySelectorAll('.table-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${tab}Table`).classList.add('active');

        // Load appropriate data
        switch (tab) {
            case 'items':
                this.renderItemsTable();
                break;
            case 'hours':
                this.renderHoursTable();
                break;
            case 'summary':
                this.renderSummaryTable();
                break;
        }
    }

    toggleHeatmapView() {
        const container = document.getElementById('peakHoursHeatmap');
        if (!container) return;
        
        const button = document.getElementById('toggleHeatmapView');
        if (!button) return;
        
        const isTableView = container.classList.contains('table-view');
        
        if (isTableView) {
            // Switch to heatmap view
            container.classList.remove('table-view');
            button.innerHTML = '<i class="fas fa-table"></i> Táblázat nézet';
            this.renderPeakHoursHeatmap();
        } else {
            // Switch to table view
            container.classList.add('table-view');
            button.innerHTML = '<i class="fas fa-th"></i> Hőtérkép nézet';
            this.renderPeakHoursTable();
        }
    }
    
    renderPeakHoursTable() {
        const container = document.getElementById('peakHoursHeatmap');
        if (!container) return;
        
        if (!this.statsData.orderTiming || !this.statsData.orderTiming.peakHours) {
            container.innerHTML = '<div class="chart-empty">Nincs elérhető adat</div>';
            return;
        }
    
        const peakHours = this.statsData.orderTiming.peakHours;
        
        // Only show open days (Wed=3, Thu=4, Fri=5, Sat=6)
        const openDayNumbers = [3, 4, 5, 6];
        const dayNames = {
            3: 'Szerda',
            4: 'Csütörtök',
            5: 'Péntek',
            6: 'Szombat'
        };
        
        // Filter to only open days and sort by day then hour
        const filteredHours = peakHours
            .filter(entry => openDayNumbers.includes(entry.dayOfWeek))
            .sort((a, b) => {
                if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                return a.hour - b.hour;
            });
        
        container.innerHTML = `
            <div class="peak-hours-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nap</th>
                            <th>Óra</th>
                            <th>Rendelések száma</th>
                            <th>Csúcsidő</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredHours.map(entry => `
                            <tr>
                                <td>${dayNames[entry.dayOfWeek]}</td>
                                <td>${entry.hour.toString().padStart(2, '0')}:00</td>
                                <td>${entry.orderCount}</td>
                                <td>
                                    <div class="peak-indicator ${entry.orderCount > 5 ? 'peak' : 'normal'}">
                                        ${entry.orderCount > 5 ? '<i class="fas fa-fire"></i> Csúcs' : '<i class="fas fa-minus"></i> Normál'}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ============================================
    // UI UPDATE METHODS
    // ============================================

    updateUI() {
        this.updateOverviewCards();
        this.renderAllCharts();
        this.renderItemsTable(); // Default table
    }

    updateOverviewCards() {
        if (!this.statsData.overview) return;

        const { totalRevenue, totalOrders, avgOrderValue } = this.statsData.overview;

        // Update total revenue
        const totalRevenueEl = document.getElementById('totalRevenue');
        if (totalRevenueEl) {
            totalRevenueEl.textContent = this.formatCurrency(totalRevenue);
        }

        // Update total orders
        const totalOrdersEl = document.getElementById('totalOrders');
        if (totalOrdersEl) {
            totalOrdersEl.textContent = totalOrders.toLocaleString();
        }

        // Update average order value
        const avgOrderValueEl = document.getElementById('avgOrderValue');
        if (avgOrderValueEl) {
            avgOrderValueEl.textContent = this.formatCurrency(avgOrderValue);
        }

        // Update average preparation time
        const avgPrepTimeEl = document.getElementById('avgPrepTime');
        if (avgPrepTimeEl && this.statsData.orderTiming) {
            const avgPrepTimes = this.statsData.orderTiming.avgPrepTimes || [];
            if (avgPrepTimes.length > 0) {
                // Calculate average prep time in minutes
                const totalPrepTime = avgPrepTimes.reduce((sum, item) => sum + item.prepTime, 0);
                const avgMinutes = Math.round(totalPrepTime / avgPrepTimes.length);
                avgPrepTimeEl.textContent = `${avgMinutes} perc`;
            } else {
                avgPrepTimeEl.textContent = '--';
            }
        }

        // TODO: Calculate and display trends (we'll implement this in step 2)
        console.log('📊 Overview cards updated');
    }

    renderAllCharts() {
        this.renderRevenueTrendsChart();
        this.renderTopItemsChart();
        this.renderOrderTypesChart();
        this.renderPaymentMethodsChart();
        this.renderPeakHoursHeatmap();
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    setupAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadAllStatistics();
        }, 5 * 60 * 1000);
    }

    showLoading() {
        const loading = document.getElementById('statsLoading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('statsLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    destroyChart(chartId) {
        if (this.chartInstances.has(chartId)) {
            this.chartInstances.get(chartId).destroy();
            this.chartInstances.delete(chartId);
        }
    }

    createGradient(ctx, colorPair) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorPair[0]);
        gradient.addColorStop(1, colorPair[1]);
        return gradient;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    formatPercentage(value) {
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    }

    exportStats() {
        // Create comprehensive statistics export
        this.showNotification('Statisztikák exportálása...', 'info');

        try {
            const exportData = this.generateFullStatsExport();
            this.downloadCSV(exportData, `teljes_statisztikak_${this.getCurrentDateString()}.csv`);
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Hiba az exportálás során', 'error');
        }
    }

    generateFullStatsExport() {
        const overview = this.statsData.overview;
        const topItems = this.statsData.topItems || [];
        const paymentMethods = this.statsData.paymentMethods || [];

        let csvContent = '';

        // Overview section
        csvContent += 'ÁTTEKINTÉS\n';
        csvContent += 'Kategória,Érték\n';
        csvContent += `Összes bevétel,${overview.totalRevenue}\n`;
        csvContent += `Összes rendelés,${overview.totalOrders}\n`;
        csvContent += `Átlagos rendelésérték,${overview.avgOrderValue}\n`;
        csvContent += `Időszak,${this.filters.period}\n\n`;

        // Top items section
        if (topItems.length > 0) {
            csvContent += 'TOP TERMÉKEK\n';
            csvContent += 'Rang,Termék neve,Bevétel,Mennyiség,Rendelések\n';
            topItems.forEach((item, index) => {
                csvContent += `${index + 1},"${item.name}",${item.totalRevenue},${item.totalQuantity},${item.orderCount}\n`;
            });
            csvContent += '\n';
        }

        // Payment methods section
        if (paymentMethods.length > 0) {
            csvContent += 'FIZETÉSI MÓDOK\n';
            csvContent += 'Módszer,Bevétel,Rendelések száma\n';
            paymentMethods.forEach(method => {
                const methodName = this.getPaymentMethodName(method.paymentMethod);
                csvContent += `"${methodName}",${method._sum.total || 0},${method._count}\n`;
            });
        }

        return csvContent;
    }

    getCurrentDateString() {
        const now = new Date();
        return now.toISOString().slice(0, 10).replace(/-/g, '_');
    }

    async refresh() {
        await this.loadAllStatistics();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '0, 0, 0';
    }

    destroy() {
        // Destroy all chart instances
        this.chartInstances.forEach(chart => chart.destroy());
        this.chartInstances.clear();
        
        // Clear auto-refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        super.destroy();
    }
}

// Make globally available
window.StatsApp = StatsApp;
window.statsApp = null; // For export functions