// Modern JavaScript for Palace Cafe & Bar Website
class PalaceCafeWebsite {
    constructor() {
        this.currentHeroSlide = 0;
        this.currentFoodCategory = 0;
        this.heroTexts = [
            {
                title: "Ez nem csak egy burger. Ez a MI burgerünk.",
                subtitle: "Fedezd fel a saját recept alapján készült kedvencünket – friss, szaftos, felejthetetlen."
            },
            {
                title: "Kortyolj bele a nyárba!",
                subtitle: "Kézműves limonádék, koktélok és hűsítő italok – nálunk mindig friss a hangulat!"
            },
            {
                title: "Street food, ahogy szeretnéd.",
                subtitle: "Tökéletes falatok, egyedi fűszerezéssel – gyors, finom, ütős!"
            }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.initHeroSlider();
        this.initFoodCategoryCarousel();
        this.setupScrollEffects();
        this.preloadCriticalPages();
        
        console.log('Palace Cafe & Bar website initialized successfully!');
    }

    setupEventListeners() {
        // Scroll to top button
        const scrollToTopBtn = document.getElementById('scrollToTop');
        scrollToTopBtn?.addEventListener('click', () => this.scrollToTop());

        // Mobile menu toggle
        const mobileMenuIcon = document.getElementById('mobileMenuIcon');
        const mobileMenu = document.getElementById('mobileMenu');
        
        mobileMenuIcon?.addEventListener('click', () => {
            mobileMenuIcon.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuIcon?.contains(e.target) && !mobileMenu?.contains(e.target)) {
                mobileMenuIcon?.classList.remove('active');
                mobileMenu?.classList.remove('active');
            }
        });    

        // Food category indicators
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.changeFoodCategory(index));
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Window scroll events
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousHeroSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextHeroSlide();
            }
        });
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        // Observe elements for animations
        const animatedElements = [
            '#welcomeTitle',
            '#storyContainer',
            '.location-maps-container',
            '.story-continuation',
            '.gallery-title',
            '.gallery-grid',
            '.palace-logo-large'
        ];

        animatedElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                observer.observe(element);
            }
        });
    }

    initHeroSlider() {
        //const slides = document.querySelectorAll('.hero-slide');
        //const titleElement = document.getElementById('heroTitle');
        //const subtitleElement = document.getElementById('heroSubtitle');
//
        //if (slides.length === 0) return;
//
        //// Auto-advance slides and text together
        //setInterval(() => {
        //    this.nextHeroSlide();
        //}, 6000);
//
        //// Initial text setup
        //this.updateHeroText();
        return;
    }

    nextHeroSlide() {
        this.currentHeroSlide = (this.currentHeroSlide + 1) % 3;
        this.updateHeroSlide();
        // Delay text change to match slide transition
        setTimeout(() => {
            this.updateHeroText();
        }, 1000);
    }

    previousHeroSlide() {
        this.currentHeroSlide = (this.currentHeroSlide - 1 + 3) % 3;
        this.updateHeroSlide();
        this.updateHeroText();
    }

    updateHeroSlide() {
        const slides = document.querySelectorAll('.hero-slide');
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentHeroSlide);
        });
    }

    updateHeroText() {
        const titleElement = document.getElementById('heroTitle');
        const subtitleElement = document.getElementById('heroSubtitle');
        const currentText = this.heroTexts[this.currentHeroSlide];
        
        if (titleElement && subtitleElement && currentText) {
            // Instant change to new text (no fade out)
            titleElement.style.transition = 'opacity 2s ease-in-out';
            subtitleElement.style.transition = 'opacity 2s ease-in-out';
            titleElement.style.opacity = '0';
            subtitleElement.style.opacity = '0';
            
            // Change text immediately
            titleElement.textContent = currentText.title;
            subtitleElement.textContent = currentText.subtitle;
            
            // Fade in new text (takes 2 seconds)
            setTimeout(() => {
                titleElement.style.opacity = '1';
                subtitleElement.style.opacity = '1';
            }, 50); // Small delay to ensure text change happens first
        }
    }

    initFoodCategoryCarousel() {
        const categoryItems = document.querySelectorAll('.category-item');
        
        if (categoryItems.length === 0) return;

        // Auto-advance categories
        setInterval(() => {
            this.nextFoodCategory();
        }, 4000);
    }

    nextFoodCategory() {
        this.currentFoodCategory = (this.currentFoodCategory + 1) % 3;
        this.updateFoodCategory();
    }

    changeFoodCategory(index) {
        this.currentFoodCategory = index;
        this.updateFoodCategory();
    }

    updateFoodCategory() {
        const categoryItems = document.querySelectorAll('.category-item');
        const indicators = document.querySelectorAll('.indicator');

        categoryItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentFoodCategory);
        });

        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentFoodCategory);
        });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        // Happy hour bar hide/show
        this.handleHappyHourBar(scrollY);
        
        // Main header scroll effect
        this.handleMainHeaderScroll(scrollY);
        
        // Scroll to top button visibility
        this.handleScrollToTopButton(scrollY);
        
        // Parallax effects
        this.handleParallaxEffects(scrollY);
    }

    handleHappyHourBar(scrollY) {
        const happyHourBar = document.getElementById('happyHourBar');
        if (happyHourBar) {
            happyHourBar.classList.toggle('hidden', scrollY > 50);
        }
    }
    
    handleMainHeaderScroll(scrollY) {
        const mainHeader = document.getElementById('mainHeader');
        if (mainHeader) {
            mainHeader.classList.toggle('scrolled', scrollY > 50);
        }
    
        const categoryNav = document.querySelector('.category-nav'); // ← Fixed: properly get the element
        if (categoryNav) {
            categoryNav.classList.toggle('scrolled', scrollY > 50);
        }
    }

    handleScrollToTopButton(scrollY) {
        const scrollToTopBtn = document.getElementById('scrollToTop');
        if (scrollToTopBtn) {
            scrollToTopBtn.classList.toggle('visible', scrollY > 500);
        }
    }

    handleParallaxEffects(scrollY) {
        // Subtle parallax effect for hero section
        const heroSection = document.getElementById('heroSection');
        if (heroSection && scrollY < window.innerHeight) {
            const parallaxSpeed = scrollY * 0.3;
            heroSection.style.transform = `translateY(${parallaxSpeed}px)`;
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    setupScrollEffects() {
        // Add smooth scrolling enhancement
        const style = document.createElement('style');
        style.textContent = `
            html {
                scroll-behavior: smooth;
            }
            
            @media (prefers-reduced-motion: reduce) {
                html {
                    scroll-behavior: auto;
                }
                
                *,
                *::before,
                *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    preloadCriticalPages() {
        // Preload menu and ordering pages for faster navigation
        const criticalPages = ['/menu', '/rendeles'];
        
        criticalPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });

        // Preload critical fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
        fontLink.as = 'style';
        fontLink.onload = function() { this.rel = 'stylesheet'; };
        document.head.appendChild(fontLink);
    }

    // Performance optimization methods
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

    // Utility methods for future enhancements
    addToCart(itemId, quantity = 1) {
        // Future implementation for ordering system
        console.log(`Adding item ${itemId} to cart, quantity: ${quantity}`);
    }

    toggleLanguage(language) {
        // Future implementation for language switching
        console.log(`Switching to language: ${language}`);
    }

    showNotification(message, type = 'info') {
        // Future implementation for user notifications
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Palace Cafe & Bar - Order Page Script
 * Combines API-driven menu loading with enhanced cart and UI functionality
 */

class OrderSystem {
    constructor() {
        this.apiUrl = 'https://palace-cafe-backend-production.up.railway.app/api';
        this.cart = [];
        this.currentItem = null;
        this.customizationOptions = null;
        this.deliveryFee = 2.50;
        this.menuData = null;
        this.operatingHours = {
            0: null, // Sunday - CLOSED
            1: { open: '11:00', close: '19:30' },//null, // Monday - CLOSED
            2: null, // Tuesday - CLOSED
            3: { open: '11:00', close: '19:30' }, // Wednesday
            4: { open: '11:00', close: '19:30' }, // Thursday
            5: { open: '11:00', close: '21:00' }, // Friday
            6: { open: '11:00', close: '21:00' }  // Saturday
        };

        this.isAcceptingOrders = true;
        this.orderStatusCheckTimer = null;
        this.refreshCountdown = 60;
        this.countdownInterval = null;
        this.socket = null;

        this.init();
    }

    /**
     * Build dynamic category mapping from API response
     * This maps category slugs to translated names
     */
    buildCategoryMapping(menuData) {
        this.categoryMapping = {};

        Object.keys(menuData).forEach(translatedCategoryName => {
            const categoryData = menuData[translatedCategoryName];

            // Map both by slug and by translated name for flexibility
            this.categoryMapping[categoryData.slug] = translatedCategoryName;
            this.categoryMapping[translatedCategoryName] = categoryData.slug;

            console.log(`Category mapping: ${categoryData.slug} ↔ ${translatedCategoryName}`);
        });
    }

    async init() {
        console.log('🚀 Palace Order System initializing...');

        try {
            this.showLoading();
            // Check if restaurant is open
            if (!this.isRestaurantOpen()) {
                this.hideLoading();
                this.showClosedOverlay();
                return; // Stop initialization if closed
            }
        
            await this.initOrderStatusCheck();

            this.clearCart();

            // Load menu and customization options
            await Promise.all([
                this.loadMenu(),
                this.loadCustomizationOptions(),
                this.loadAllergenData()
            ]);

            this.setupEventListeners();
            this.setupCartItemEventListeners();
            this.loadCartFromStorage();

            this.hideLoading();
            console.log('✅ Order System ready!');
        } catch (error) {
            console.error('❌ Failed to initialize order system:', error);
            this.showError('Hiba történt az oldal betöltésekor. Kérjük frissítse az oldalt.');
        }
    }

    // ============================================
    // API METHODS
    // ============================================

    async loadMenu() {
        try {
            const response = await fetch(`${this.apiUrl}/menu/deliverable?lang=hu`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to load menu');
            }

            console.log('Menu loaded:', result.data);
            this.menuData = result.data;

            // Build dynamic category mapping based on API response
            this.buildCategoryMapping(result.data);

            this.renderMenu(result.data);
            this.renderCategoryNavigation(result.data);

        } catch (error) {
            console.error('Menu loading error:', error);
            throw error;
        }
    }

    async loadCustomizationOptions() {
        try {
            const response = await fetch(`${this.apiUrl}/customization?lang=hu`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to load customization options');
            }

            console.log('🎛️ Customization options loaded:', result.data);
            this.customizationOptions = result.data;

        } catch (error) {
            console.error('❌ Customization loading error:', error);
            throw error;
        }
    }

    async loadAllergenData() {
        try {
            const response = await fetch(`${this.apiUrl}/allergens?lang=hu`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to load allergen data');
            }

            console.log('🏷️ Allergen data loaded:', result.data);
            this.allergenData = result.data;

        } catch (error) {
            console.error('❌ Allergen loading error:', error);
            // Don't throw - allergens are optional
            this.allergenData = [];
        }
    }

    async submitOrder() {
        if (this.cart.length === 0) {
            this.showErrorToast('A kosár üres!');
            return;
        }

        try {
            this.showLoading();
            const orderData = {
                items: this.cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    customizations: item.customization
                })),
                subtotal: this.calculateSubtotal(),
                deliveryFee: this.deliveryFee,
                total: this.calculateSubtotal() + this.deliveryFee,
                timestamp: new Date().toISOString()
            };

            const response = await fetch(`${this.apiUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCsrfToken()
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to submit order');
            }

            this.showSuccessToast('Rendelés leadva! Hamarosan felvesszük Önnel a kapcsolatot.');
            this.clearCart();
            this.closeCart();

            return result;

        } catch (error) {
            console.error('❌ Order submission error:', error);
            this.showErrorToast('Hiba történt a rendelés leadása közben. Kérjük próbálja újra.');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

/**
     * Check if restaurant is currently open
     */
    isRestaurantOpen() {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const todayHours = this.operatingHours[currentDay];
        
        // If no hours defined for today, restaurant is closed
        if (!todayHours) {
            console.log('❌ Restaurant closed today (no operating hours)');
            return false;
        }
        
        // Check if current time is within operating hours
        const isOpen = currentTime >= todayHours.open && currentTime < todayHours.close;
        
        console.log(`⏰ Current time: ${currentTime}`);
        console.log(`📅 Today's hours: ${todayHours.open} - ${todayHours.close}`);
        console.log(`🏪 Restaurant is: ${isOpen ? 'OPEN' : 'CLOSED'}`);
        
        return isOpen;
    }

    /**
     * Calculate next opening time
     */
    getNextOpening() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
        
        // Check if we open later today
        const todayHours = this.operatingHours[currentDay];
        if (todayHours && currentTime < todayHours.open) {
            return `Ma ${todayHours.open}-kor`;
        }
        
        // Check next 7 days
        for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            const hours = this.operatingHours[checkDay];
            
            if (hours) {
                const dayName = dayNames[checkDay];
                if (i === 1) {
                    return `Holnap (${dayName}) ${hours.open}-kor`;
                } else {
                    return `${dayName} ${hours.open}-kor`;
                }
            }
        }
        
        return 'Hamarosan'; // Fallback
    }

    /**
     * Get appropriate closed message based on time/day
     */
    getClosedMessage() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();
        
        // Monday or Tuesday (closed days)
        if (currentDay === 1 || currentDay === 2) {
            return {
                icon: '🌴',
                message: 'A szakács pihenőnapja! Szerda-tól várunk újra.'
            };
        }
        
        // Sunday
        if (currentDay === 0) {
            return {
                icon: '😴',
                message: 'Vasárnap zárva tartunk. Szerda-től várunk szeretettel!'
            };
        }
        
        // Late night (after 20:00 on Wed-Thu, after 22:00 on Fri-Sat)
        if (currentHour >= 20) {
            return {
                icon: '🌙',
                message: 'Mára zárva! Holnap újra szeretettel várunk.'
            };
        }
        
        // Early morning (before 11:00)
        if (currentHour < 11) {
            return {
                icon: '☕',
                message: 'Még készülünk a nyitásra. Hamarosan indulunk!'
            };
        }
        
        // Default
        return {
            icon: '🍔',
            message: 'Jelenleg zárva vagyunk.'
        };
    }

    /**
     * Show the closed overlay
     */
    showClosedOverlay() {
        // Check if overlay already exists
        let overlay = document.getElementById('closedOverlay');
        
        if (!overlay) {
            const closedInfo = this.getClosedMessage();
            const nextOpening = this.getNextOpening();
            
            overlay = document.createElement('div');
            overlay.id = 'closedOverlay';
            overlay.className = 'restaurant-closed-overlay';
            overlay.innerHTML = `
                <div class="closed-content">
                    <div class="closed-icon">${closedInfo.icon}</div>
                    <h2 class="closed-title">Jelenleg zárva vagyunk</h2>
                    <p class="closed-message">${closedInfo.message}</p>
                    <div class="next-opening">
                        📅 Nyitás: ${nextOpening}
                    </div>
                    <div class="closed-actions">
                        <button class="hours-button" onclick="orderSystem.showHoursModal()">
                            📋 Nyitvatartási idő
                        </button>
                        <a href="menu.html" class="browse-menu-btn" style="display: inline-block; text-decoration: none;">
                            👀 Menü böngészése
                        </a>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
        }
        
        // Show overlay
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
        
        // Disable all add-to-cart buttons
        this.disableOrdering();
    }

    /**
     * Hide the closed overlay (for browsing only)
     */
    hideClosedOverlay() {
        const overlay = document.getElementById('closedOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Keep ordering disabled
        this.showBrowseOnlyMessage();
    }

    /**
     * Show browse-only message at top of page
     */
    showBrowseOnlyMessage() {
        const orderMain = document.getElementById('orderMain');
        if (orderMain && !document.getElementById('browseOnlyBanner')) {
            const banner = document.createElement('div');
            banner.id = 'browseOnlyBanner';
            banner.style.cssText = `
                background: rgba(255, 193, 7, 0.9);
                color: #000;
                padding: 1rem 2rem;
                text-align: center;
                font-weight: 600;
                font-size: 1.1rem;
                border-radius: 10px;
                margin-bottom: 2rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            `;
            banner.innerHTML = '⚠️ Böngészési mód: Jelenleg nem fogadunk rendeléseket';
            orderMain.insertBefore(banner, orderMain.firstChild);
        }
    }

    /**
     * Disable all ordering functionality
     */
    disableOrdering() {
        // Disable all add-to-cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Jelenleg zárva vagyunk';
        });
        
        // Hide cart buttons
        const cartButtons = document.querySelectorAll('#cartToggleBtn, #mobileCartBtn');
        cartButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
        
        console.log('🚫 Ordering functionality disabled');
    }

    /**
     * Show operating hours modal
     */
    showHoursModal() {
        let modal = document.getElementById('hoursModal');
        
        if (!modal) {
            const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
            const today = new Date().getDay();
            
            let hoursHTML = '';
            for (let i = 0; i < 7; i++) {
                const hours = this.operatingHours[i];
                const isToday = i === today;
                const hoursText = hours ? `${hours.open} - ${hours.close}` : 'Zárva';
                const closedClass = hours ? '' : 'closed';
                
                hoursHTML += `
                    <li ${isToday ? 'class="today"' : ''}>
                        <span class="day-name">${dayNames[i]}</span>
                        <span class="day-hours ${closedClass}">${hoursText}</span>
                    </li>
                `;
            }
            
            modal = document.createElement('div');
            modal.id = 'hoursModal';
            modal.className = 'hours-modal';
            modal.innerHTML = `
                <div class="hours-modal-content">
                    <div class="hours-modal-header">
                        <h3 class="hours-modal-title">Nyitvatartás</h3>
                        <button class="hours-close" onclick="orderSystem.hideHoursModal()">×</button>
                    </div>
                    <ul class="hours-list">
                        ${hoursHTML}
                    </ul>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideHoursModal();
                }
            });
        }
        
        modal.classList.add('active');
    }

    /**
     * Hide operating hours modal
     */
    hideHoursModal() {
        const modal = document.getElementById('hoursModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // ============================================
    // RENDERING METHODS
    // ============================================

    renderCategoryNavigation(menuData) {
        const navScroll = document.getElementById('categoryNavScroll');
        if (!navScroll) return;

        navScroll.innerHTML = '';

        // Use the actual category names from the API response (already translated)
        Object.keys(menuData).forEach((categoryName, index) => {
            const category = menuData[categoryName];
            const button = document.createElement('button');
            button.className = `category-nav-item ${index === 0 ? 'active' : ''}`;
            button.dataset.category = category.slug; // Use slug for navigation
            button.innerHTML = `<span>${categoryName}</span>`; // Use translated name for display

            button.addEventListener('click', () => this.scrollToCategory(category.slug));

            navScroll.appendChild(button);
        });
    }

    renderMenu(menuData) {
        const orderMain = document.getElementById('orderMain');
        if (!orderMain) return;

        orderMain.innerHTML = '';

        // Use the actual category names from the API response (already translated)
        Object.keys(menuData).forEach(categoryName => {
            const category = menuData[categoryName];

            const section = document.createElement('section');
            section.className = 'food-category';
            section.id = category.slug; // Use slug for ID
            section.dataset.category = category.slug;

            section.innerHTML = `
                <div class="category-header">
                    <h2 class="category-title">${categoryName}</h2>
                    <p class="category-description">Válassz a ${categoryName.toLowerCase()} kategóriából</p>
                </div>
                <div class="food-grid" id="${category.slug}-grid">
                    ${this.renderCategoryItems(category.items)}
                </div>
            `;

            orderMain.appendChild(section);
        });
    }

    renderCategoryItems(items) {
        return items.map(item => {
            const badge = item.badge ? `<div class="food-badge ${item.badge.toLowerCase()}">${item.badge}</div>` : '';
            const image = item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy">` : '<div class="no-image">Kép nincs</div>';

            return `
                <div class="food-card" data-item-id="${item.id}">
                    <div class="food-image">
                        ${image}
                        ${badge}
                    </div>
                    <div class="food-info">
                        <h3 class="food-name">${item.name}</h3>
                        <p class="food-description">${item.description || ''}</p>
                        ${this.renderAllergenBadges(item.allergens || [])}
                        <div class="food-price-row">
                            <span class="food-price">€${item.price.toFixed(2)}</span>
                            <button class="add-to-cart-btn" onclick="orderSystem.handleAddToCartClick(event, ${item.id})">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                Kosárba
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render allergen badges for a menu item
     */
    renderAllergenBadges(allergenCodes) {
        if (!allergenCodes || allergenCodes.length === 0) {
            return '';
        }

        const badges = allergenCodes.map(code => 
            `<span class="allergen-badge" data-allergen="${code}" onclick="orderSystem.showAllergenModal('${code}')">${code}</span>`
        ).join('');

        return `<div class="allergen-badges">${badges}</div>`;
    }

    /**
     * Show allergen information modal
     */
    showAllergenModal(allergenCode) {
        if (!this.allergenData) return;

        const allergen = this.allergenData.find(a => a.code === allergenCode);
        if (!allergen) return;

        // Check if modal already exists
        let modal = document.getElementById('allergenModal');

        if (!modal) {
            // Create modal HTML
            modal = document.createElement('div');
            modal.id = 'allergenModal';
            modal.className = 'modal-overlay allergen-modal';
            modal.innerHTML = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 class="modal-title">Allergén információ</h3>
                        <button class="modal-close" onclick="orderSystem.closeAllergenModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="allergen-info">
                            <div class="allergen-code" id="allergenCode"></div>
                            <div class="allergen-name" id="allergenName"></div>
                            <div class="allergen-description">
                                Ez az allergén információ az EU szabályozás szerint.
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllergenModal();
            });
        }

        // Update content
        document.getElementById('allergenCode').textContent = allergenCode;
        document.getElementById('allergenName').textContent = allergen.name;

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close allergen modal
     */
    closeAllergenModal() {
        const modal = document.getElementById('allergenModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // CUSTOMIZATION MODAL
    // ============================================

    openCustomizationModal(itemId) {
        const item = this.findItemById(itemId);
        if (!item) {
            console.error('Item not found:', itemId);
            this.showErrorToast('Étel nem található!');
            return;
        }

        this.currentItem = {
            ...item,
            quantity: 1,
            customization: {
                sauce: null,
                fries: item.includesSides ? 'regular-fries' : 'none',
                extras: [],
                removeInstructions: '',
                specialInstructions: ''
            }
        };

        document.getElementById('modalFoodName').textContent = item.name;
        document.getElementById('modalFoodDescription').textContent = item.description || '';
        document.getElementById('modalFoodPrice').textContent = `€${item.price.toFixed(2)}`;

        if (item.imageUrl) {
            document.getElementById('modalFoodImage').src = item.imageUrl;
            document.getElementById('modalFoodImage').alt = item.name;
        }

        const sauceSection = document.getElementById('sauceSection');
        const friesSection = document.getElementById('friesSection');
        const extrasSection = document.getElementById('extrasSection');

        // Always show fries section - content will differ based on includesSides
        friesSection.style.display = 'block';
        this.renderFriesOptions();

        if (item.includesSides) {
            // Show sauce and extras for items with sides included
            sauceSection.style.display = 'block';
            extrasSection.style.display = 'block';
            this.renderSauceOptions();
            this.renderExtrasOptions();
        } else {
            // Hide sauce and extras for items without sides
            sauceSection.style.display = 'none';
            
        }

        // IMPORTANT: Setup form validation AFTER rendering options
        this.setupFormValidation();

        this.resetCustomizationForm();

        // Update total after a small delay to ensure DOM is ready
        setTimeout(() => {
            this.updateModalTotal();
        }, 50);

        const modal = document.getElementById('customizationModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus handling - only focus sauce if it's visible
        if (item.includesSides) {
            const firstSauceOption = document.querySelector('input[name="sauce"]');
            if (firstSauceOption) {
                setTimeout(() => firstSauceOption.focus(), 300);
            }
        } else {
            const firstFriesOption = document.querySelector('input[name="fries"]');
            if (firstFriesOption) {
                setTimeout(() => firstFriesOption.focus(), 300);
            }
        }
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
                const isRegularFries = option.slug === 'regular-fries'; // Fixed: was 'regular'
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
        if (!extrasContainer || !this.customizationOptions?.extras) return;

        extrasContainer.innerHTML = this.customizationOptions.extras.map(extra => `
            <label class="extra-option">
                <input type="checkbox" name="extras" value="${extra.slug}">
                <span class="extra-label">
                    <span class="extra-name">${extra.name}</span>
                    <span class="extra-price">+€${extra.price.toFixed(2)}</span>
                </span>
            </label>
        `).join('');
    }

    closeModal() {
        const modal = document.getElementById('customizationModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentItem = null;
        }
    }

    resetCustomizationForm() {
        document.getElementById('quantityDisplay').textContent = '1';
        document.getElementById('removeInstructions').value = '';
        document.getElementById('specialInstructions').value = '';

        // Reset extras
        document.querySelectorAll('input[name="extras"]').forEach(input => {
            input.checked = false;
        });

        // Reset sauce selection
        const sauceInputs = document.querySelectorAll('input[name="sauce"]');
        sauceInputs.forEach(input => input.checked = input.hasAttribute('checked'));

        // Reset fries selection based on item type
        if (this.currentItem.includesSides) {
            // Items WITH sides included - default to regular fries
            const regularFries = document.querySelector('input[name="fries"][value="regular-fries"]');
            if (regularFries) {
                regularFries.checked = true;
            }
        } else {
            // Items WITHOUT sides included - default to no sides
            const noSides = document.querySelector('input[name="fries"][value="none"]');
            if (noSides) {
                noSides.checked = true;
            }
        }

        this.updateQuantityButtons();
        this.updateAddToCartButtonState();
    }

    updateModalTotal() {
        if (!this.currentItem) return;

        let total = this.currentItem.price * this.currentItem.quantity;
        console.log('Base total:', total);

        const selectedFries = document.querySelector('input[name="fries"]:checked');
        console.log('Selected fries value:', selectedFries?.value);

        if (selectedFries && this.customizationOptions?.friesOptions) {
            if (this.currentItem.includesSides) {
                // Items WITH sides included - regular fries are FREE, only charge for upgrades
                if (selectedFries.value === 'regular-fries') {
                    // Regular fries are free when sides are included - add nothing
                    console.log('Regular fries selected for item with sides included: +€0.00');
                } else if (selectedFries.value !== 'none') {
                    // Any other fries option - charge the addon price
                    const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === selectedFries.value);
                    if (friesOption) {
                        console.log('Adding upgrade fries price:', friesOption.priceAddon);
                        total += friesOption.priceAddon * this.currentItem.quantity;
                    }
                }
            } else {
                // Items WITHOUT sides included - charge full price for any fries, nothing for "none"
                if (selectedFries.value === 'none') {
                    console.log('No sides selected, adding €0.00');
                    // Add nothing - no sides means no extra cost
                } else {
                    // Any fries option - charge the full addon price
                    const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === selectedFries.value);
                    if (friesOption) {
                        console.log('Adding full fries price for item without sides:', friesOption.priceAddon);
                        total += friesOption.priceAddon * this.currentItem.quantity;
                    }
                }
            }
        }

        // Handle extras pricing (unchanged from original)
        const selectedExtras = document.querySelectorAll('input[name="extras"]:checked');
        if (selectedExtras.length > 0) {
            const extraPrice = 0.30; // You might want to get this from customizationOptions.extras
            total += selectedExtras.length * extraPrice * this.currentItem.quantity;
            console.log('Adding extras:', selectedExtras.length, 'x', extraPrice);
        }

        console.log('Final total:', total);
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

    // ============================================
    // CART FUNCTIONALITY
    // ============================================

    handleAddToCartClick(e, itemId) {
        e.preventDefault();
        e.stopPropagation();

        const item = this.findItemById(itemId);
        if (!item) {
            this.showErrorToast('Étel nem található!');
            return;
        }

        // Get the category for this item
        const itemCategory = this.getItemCategory(itemId);
        console.log('Item category:', itemCategory, 'for item:', item.name);

        // Categories that should bypass customization modal
        const directAddCategories = ['sides', 'nonalcoholic', 'sauces'];

        if (directAddCategories.includes(itemCategory)) {
            // Add directly to cart without customization
            const cartItem = {
                ...item,
                quantity: 1,
                customization: {
                    sauce: null,
                    fries: 'none',
                    extras: [],
                    removeInstructions: '',
                    specialInstructions: ''
                }
            };

            this.addItemToCart(cartItem);
            this.showSuccessToast(`${item.name} kosárba helyezve!`);
        } else {
            // Open customization modal for other categories
            this.openCustomizationModal(itemId);
        }
    }

    /**
     * Get the category slug for a given item ID
     */
    getItemCategory(itemId) {
        if (!this.menuData) return null;

        for (const categoryName of Object.keys(this.menuData)) {
            const category = this.menuData[categoryName];
            const item = category.items.find(i => i.id == itemId);
            if (item) {
                return category.slug;
            }
        }
        return null;
    }

    addToCartFromModal() {
        if (!this.currentItem) return;

        if (this.currentItem.includesSides) {
            const selectedSauce = document.querySelector('input[name="sauce"]:checked');
            if (!selectedSauce) {
                this.showErrorToast('Kérjük válassz szószt!');
                return;
            }
        }

        const customization = {
            sauce: document.querySelector('input[name="sauce"]:checked')?.value || null,
            fries: document.querySelector('input[name="fries"]:checked')?.value || null,
            extras: Array.from(document.querySelectorAll('input[name="extras"]:checked')).map(input => input.value),
            removeInstructions: document.getElementById('removeInstructions').value.trim(),
            specialInstructions: document.getElementById('specialInstructions').value.trim()
        };

        this.currentItem.customization = customization;
        this.addItemToCart(this.currentItem);
        this.closeModal();
        this.showSuccessToast(`${this.currentItem.name} kosárba helyezve!`);
    }

    addItemToCart(item) {
        console.log('🛒 Adding item to cart:', item);

        const cartItemId = this.generateCartItemId(item);
        console.log('Generated cart item ID:', cartItemId);

        const existingItemIndex = this.cart.findIndex(cartItem => cartItem.id === cartItemId);

        if (existingItemIndex >= 0) {
            console.log('Found existing item, increasing quantity');
            this.cart[existingItemIndex].quantity += item.quantity;
        } else {
            const itemCategory = this.getItemCategory(item.id);

            const cartItem = {
                id: cartItemId,
                originalId: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                imageUrl: item.imageUrl,
                includesSides: item.includesSides, 
                quantity: item.quantity,
                customization: item.customization,
                category: itemCategory,
                addedAt: new Date().toISOString()
            };

            console.log('Adding new cart item:', cartItem);
            this.cart.push(cartItem);
        }

        this.updateCartUI();
        this.saveCartToStorage();
        this.trackAddToCart(item);
    }

    generateCartItemId(item) {
        // Use a counter to ensure uniqueness even for same item with different customizations
        const timestamp = Date.now();
        const components = [
            item.id || item.originalId, // Original food ID
            item.customization?.sauce || '',
            item.customization?.fries || '',
            (item.customization?.extras || []).sort().join(','),
            item.customization?.removeInstructions || '',
            item.customization?.specialInstructions || '',
            timestamp // Ensures uniqueness
        ];

        // Create a string and hash it for a stable, unique ID
        const componentString = components.join('|');
        // Simple hash function to avoid base64 issues
        let hash = 0;
        for (let i = 0; i < componentString.length; i++) {
            hash = ((hash << 5) - hash) + componentString.charCodeAt(i);
            hash = hash >>> 0; // Convert to unsigned 32-bit integer
        }

        const uniqueId = `${item.id || item.originalId}-${hash}-${timestamp}`;
        console.log('🆔 Generating cart ID:', {
            item: item.name,
            components,
            uniqueId
        });

        return uniqueId;
    }

    updateCartUI() {
        this.updateCartCounts();
        this.updateCartItems();
        this.updateCartSummary();
        this.updateMobileCartButton();
    }

    updateCartCounts() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.calculateSubtotal();

        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        const mobileCartCount = document.getElementById('mobileCartCount');
        const mobileCartTotal = document.getElementById('mobileCartTotal');

        if (cartCount) cartCount.textContent = totalItems;
        if (cartTotal) cartTotal.textContent = `€${subtotal.toFixed(2)}`;
        if (mobileCartCount) mobileCartCount.textContent = totalItems;
        if (mobileCartTotal) mobileCartTotal.textContent = `€${subtotal.toFixed(2)}`;
    }

    updateCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartFooter = document.getElementById('cartFooter');

        if (!cartItemsContainer || !cartEmpty || !cartFooter) return;

        if (this.cart.length === 0) {
            cartItemsContainer.style.display = 'none';
            cartEmpty.style.display = 'block';
            cartFooter.style.display = 'none';
            cartItemsContainer.innerHTML = '';
            return;
        }

        cartItemsContainer.style.display = 'block';
        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'block';

        cartItemsContainer.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');
        
    }

    createCartItemHTML(item) {
        const itemTotal = this.calculateItemTotal(item);
        const customizations = this.getItemCustomizationsText(item);

        console.log('🏗️ Creating HTML for cart item:', {
            name: item.name,
            cartId: item.id,
            quantity: item.quantity
        });

        return `
            <div class="cart-item" data-cart-id="${item.id}">
                <img src="${item.imageUrl || '/placeholder.jpg'}" alt="${item.name}" class="cart-item-image" loading="lazy">
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${this.escapeHtml(item.name)}</h4>
                    ${customizations ? `<div class="cart-item-customizations">${customizations}</div>` : ''}
                    <div class="cart-item-price-row">
                        <span class="cart-item-price">€${itemTotal.toFixed(2)}</span>
                        <div class="cart-item-controls">
                            <button class="cart-quantity-btn decrease-btn" data-action="decrease">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <span class="cart-item-quantity">${item.quantity}</span>
                            <button class="cart-quantity-btn increase-btn" data-action="increase">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <button class="cart-remove-btn" data-action="remove">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 6H5H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getItemCustomizationsText(item) {
        const customizations = [];
    
        if (item.customization.sauce && this.customizationOptions?.sauces) {
            const sauce = this.customizationOptions.sauces.find(s => s.slug === item.customization.sauce);
            if (sauce) customizations.push(`Szósz: ${sauce.name}`);
        }
    
        if (item.customization.fries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === item.customization.fries);
            if (friesOption) {
                if (item.includesSides) {
                    // Items WITH sides included - only show price for non-regular fries
                    if (friesOption.slug !== 'regular-fries' && friesOption.priceAddon > 0) {  // ← FIXED
                        customizations.push(`${friesOption.name} (+€${friesOption.priceAddon.toFixed(2)})`);
                    } else if (friesOption.slug === 'regular-fries') {  // ← FIXED
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
    
        if (item.customization.extras?.length > 0) {
            const extraPrice = 0.30; // Hardcoded price matching your calculateItemTotal
            const extraLabels = item.customization.extras.map(extra => {
                // Try to get name from API first, fallback to slug
                const extraData = this.customizationOptions?.extras?.find(e => e.slug === extra);
                const extraName = extraData ? extraData.name : extra;
                return `${extraName} (+€${extraPrice.toFixed(2)})`;
            });
            customizations.push(`Extrák: ${extraLabels.join(', ')}`);
        }

        if (item.customization.removeInstructions) {
            customizations.push(`Eltávolítás: ${item.customization.removeInstructions}`);
        }

        if (item.customization.specialInstructions) {
            customizations.push(`Megjegyzés: ${item.customization.specialInstructions}`);
        }

        return customizations.join(' • ');
    }

    calculateItemTotal(item) {
        let total = item.price * item.quantity;

        if (item.customization.fries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === item.customization.fries);
            if (friesOption) {
                if (item.includesSides) {
                    // Items WITH sides included - regular fries are FREE, only charge for upgrades
                    if (friesOption.slug !== 'regular-fries') {  // ← FIXED: was 'regular'
                        // Only add cost for non-regular fries (sweet potato, etc.)
                        total += friesOption.priceAddon * item.quantity;
                    }
                    // Regular fries add €0.00 - they're included for free
                } else {
                    // Items WITHOUT sides included - charge full price for any fries
                    if (item.customization.fries !== 'none') {
                        total += friesOption.priceAddon * item.quantity;
                    }
                }
            }
        }

        if (item.customization.extras?.length > 0) {
            const extraPrice = 0.30; // Hardcoded €0.30 per extra
            total += item.customization.extras.length * extraPrice * item.quantity;
        }

        return total;
    }

    calculateSubtotal() {
        return this.cart.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
    }

    updateCartSummary() {
        const subtotal = this.calculateSubtotal();
        const grandTotal = subtotal + this.deliveryFee;

        const cartSubtotal = document.getElementById('cartSubtotal');
        const deliveryFee = document.getElementById('deliveryFee');
        const cartGrandTotal = document.getElementById('cartGrandTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartSubtotal) cartSubtotal.textContent = `€${subtotal.toFixed(2)}`;
        //if (deliveryFee) deliveryFee.style.display = 'none';
        if (cartGrandTotal) cartGrandTotal.textContent = `€${subtotal.toFixed(2)}`;

        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
        }
    }

    updateMobileCartButton() {
        const mobileCartButton = document.getElementById('mobileCartButton');
        console.log('📱 Updating mobile cart button, items in cart:', this.cart.length);

        if (mobileCartButton) {
            const shouldShow = this.cart.length > 0;
            mobileCartButton.style.display = shouldShow ? 'block' : 'none';
            console.log('📱 Mobile cart button display:', shouldShow ? 'visible' : 'hidden');
        } else {
            console.log('❌ Mobile cart button element not found');
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        document.querySelectorAll('.category-nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleCategoryClick(e));
        });

        const cartToggleBtn = document.getElementById('cartToggleBtn');
        const mobileCartBtn = document.getElementById('mobileCartBtn');
        const cartClose = document.getElementById('cartClose');
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('customizationModal');
        const decreaseBtn = document.getElementById('decreaseQuantity');
        const increaseBtn = document.getElementById('increaseQuantity');
        const addToCartModalBtn = document.getElementById('addToCartModalBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartToggleBtn) cartToggleBtn.addEventListener('click', () => this.toggleCart());
        if (mobileCartBtn) mobileCartBtn.addEventListener('click', () => this.toggleCart());
        if (cartClose) cartClose.addEventListener('click', () => this.closeCart());
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.closeModal();
            });
        }
        if (decreaseBtn) decreaseBtn.addEventListener('click', () => this.updateQuantity(-1));
        if (increaseBtn) increaseBtn.addEventListener('click', () => this.updateQuantity(1));
        if (addToCartModalBtn) addToCartModalBtn.addEventListener('click', () => this.addToCartFromModal());
        if (checkoutBtn) checkoutBtn.addEventListener('click', () => this.handleCheckout());

        this.setupFormValidation();
        this.setupScrollSpy();

        // Mobile cart button listener (order page specific)
        if (mobileCartBtn) {
            console.log('🔧 Mobile cart button found, adding event listener');
            
            // Remove any existing listeners first (prevent duplicates)
            const newMobileCartBtn = mobileCartBtn.cloneNode(true);
            mobileCartBtn.parentNode.replaceChild(newMobileCartBtn, mobileCartBtn);
            
            // Add the click listener
            newMobileCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📱 Mobile cart button clicked!');
                this.toggleCart();
            });
            
            console.log('✅ Mobile cart button listener attached successfully');
        } else {
            console.log('❌ Mobile cart button not found in DOM');
        }      

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeCart();
            }
        });
    }

    handleCategoryClick(e) {
        e.preventDefault();
        const category = e.target.closest('.category-nav-item').dataset.category;

        document.querySelectorAll('.category-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.target.closest('.category-nav-item').classList.add('active');

        this.scrollToCategory(category);
    }

    setupScrollSpy() {
        const categoryNavItems = document.querySelectorAll('.category-nav-item');
        const categories = document.querySelectorAll('.food-category');

        if (categories.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const categoryId = entry.target.id;
                    categoryNavItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.dataset.category === categoryId) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '-20% 0px -80% 0px'
        });

        categories.forEach(category => observer.observe(category));
    }

    setupFormValidation() {
        const sauceInputs = document.querySelectorAll('input[name="sauce"]');
        const friesInputs = document.querySelectorAll('input[name="fries"]');
        const extraInputs = document.querySelectorAll('input[name="extras"]');
        const textInputs = document.querySelectorAll('#removeInstructions, #specialInstructions');

        sauceInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateAddToCartButtonState();
                this.updateModalTotal();
            });
        });

        friesInputs.forEach(input => {
            input.addEventListener('change', () => this.updateModalTotal());
        });

        extraInputs.forEach(input => {
            input.addEventListener('change', () => this.updateModalTotal());
        });

        textInputs.forEach(input => {
            input.addEventListener('input', (e) => this.sanitizeTextInput(e));
        });
    }

    setupCartItemEventListeners() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        // Use delegation: Listen for clicks on the container and handle based on target
        cartItemsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.cart-quantity-btn, .cart-remove-btn');
            if (!button) return; // Not a relevant button, ignore

            const action = button.dataset.action;
            const cartItem = button.closest('.cart-item');
            if (!cartItem) return; // Safety check

            const cartId = cartItem.dataset.cartId;

            if (action === 'decrease') {
                this.updateCartItemQuantity(cartId, -1);
            } else if (action === 'increase') {
                this.updateCartItemQuantity(cartId, 1);
            } else if (action === 'remove') {
                this.removeCartItem(cartId);
            }
        });
    }

    updateQuantity(change) {
        if (!this.currentItem) return;

        const newQuantity = Math.max(1, this.currentItem.quantity + change);
        this.currentItem.quantity = newQuantity;

        document.getElementById('quantityDisplay').textContent = newQuantity;
        this.updateQuantityButtons();
        this.updateModalTotal();
    }

    updateQuantityButtons() {
        const decreaseBtn = document.getElementById('decreaseQuantity');
        const increaseBtn = document.getElementById('increaseQuantity');

        if (decreaseBtn) decreaseBtn.disabled = this.currentItem.quantity <= 1;
        if (increaseBtn) increaseBtn.disabled = this.currentItem.quantity >= 10;
    }

    updateCartItemQuantity(cartId, change) {
        console.log(`📝 Updating cart item ${cartId} by ${change}`);
        console.log('🛒 Current cart contents:', JSON.stringify(this.cart, null, 2));
        console.log('🔍 Cart item IDs:', this.cart.map(item => ({ id: item.id, name: item.name })));

        const itemIndex = this.cart.findIndex(item => item.id === cartId);
        console.log(`Found item at index: ${itemIndex}`);

        if (itemIndex >= 0) {
            const oldQuantity = this.cart[itemIndex].quantity;
            const newQuantity = oldQuantity + change;

            console.log(`Quantity change: ${oldQuantity} → ${newQuantity}`);

            if (newQuantity <= 0) {
                // Remove the item if quantity would be 0 or less
                const removedItem = this.cart.splice(itemIndex, 1)[0];
                this.updateCartUI();
                this.saveCartToStorage();
                this.showSuccessToast(`${removedItem.name} eltávolítva a kosárból`);
            } else {
                // Update quantity if still positive
                this.cart[itemIndex].quantity = newQuantity;
                this.updateCartUI();
                this.saveCartToStorage();
                this.showSuccessToast(`Mennyiség frissítve: ${newQuantity}`);
            }
        } else {
            console.error(`Cart item not found: ${cartId}`);
            console.error('Available cart item IDs:', this.cart.map(item => item.id));
            this.showErrorToast('Nem sikerült frissíteni a mennyiséget!');
        }
    }

    removeCartItem(cartId) {
        const itemIndex = this.cart.findIndex(item => item.id === cartId);

        if (itemIndex >= 0) {
            const removedItem = this.cart.splice(itemIndex, 1)[0];
            this.updateCartUI();
            this.saveCartToStorage();
            this.showSuccessToast(`${removedItem.name} eltávolítva a kosárból`);
        }
    }

    clearCart() {
        this.cart = [];
        this.updateCartUI();
        this.saveCartToStorage();
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.toggle('active');
            document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
        }
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    findItemById(itemId) {
        if (!this.menuData) return null;

        for (const categoryName of Object.keys(this.menuData)) {
            const category = this.menuData[categoryName];
            const item = category.items.find(i => i.id == itemId);
            if (item) {
                return {
                    id: item.id,
                    name: item.name,
                    description: item.description || '',
                    price: item.price,
                    imageUrl: item.imageUrl || null,
                    includesSides: item.includesSides !== undefined ? item.includesSides : (category.slug !== 'sides')
                };
            }
        }
        return null;
    }

    scrollToCategory(categorySlug) {
        const section = document.getElementById(categorySlug);
        if (section) {
            const headerHeight = document.querySelector('.category-nav')?.offsetHeight + 100 || 120;
            const offsetTop = section.offsetTop - headerHeight;

            window.scrollTo({ top: offsetTop, behavior: 'smooth' });

            document.querySelectorAll('.category-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-category="${categorySlug}"]`)?.classList.add('active');
        }
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.add('active');
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }

    showError(message) {
        const orderMain = document.getElementById('orderMain');
        if (orderMain) {
            orderMain.innerHTML = `
                <div class="error-message">
                    <h2>⚠️ ${message}</h2>
                    <button onclick="location.reload()">Oldal újratöltése</button>
                </div>
            `;
        }
    }

    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const toastMessage = document.getElementById('toastMessage');

        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = `toast ${type}-toast show`;
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }

    sanitizeTextInput(e) {
        const input = e.target;
        let value = input.value;
        value = value.replace(/[<>]/g, '');
        if (value.length > 200) {
            value = value.substring(0, 200);
        }
        input.value = value;
    }

    saveCartToStorage() {
        try {
            const cartData = {
                items: this.cart,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('cartData', JSON.stringify(cartData));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    saveCartForCheckout() {
        try {
            const cartData = {
                items: this.cart,
                orderType: 'pickup', // default
                selectedTime: 'asap', // default  
                timestamp: Date.now()
            };
            localStorage.setItem('palace_order_cart', JSON.stringify(cartData));
            console.log('Cart data saved for checkout:', cartData);
            return true;
        } catch (error) {
            console.error('Error saving cart for checkout:', error);
            this.showErrorToast('Hiba történt a kosár mentésekor');
            return false;
        }
    }
    
    handleCheckout() {
        if (this.cart.length === 0) {
            this.showErrorToast('A kosár üres!');
            return;
        }

        // Save cart data for checkout page
        if (this.saveCartForCheckout()) {
            // Navigate to checkout page
            window.location.href = 'checkout.html';
        }
    }    

    loadCartFromStorage() {
        try {
            const cartData = JSON.parse(localStorage.getItem('cartData'));
            if (cartData && cartData.items) {
                const cartAge = new Date() - new Date(cartData.timestamp);
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                if (cartAge < maxAge) {
                    this.cart = cartData.items;
                    this.updateCartUI();
                }
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    trackAddToCart(item) {
        console.log('Analytics: Item added to cart', {
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            category: item.category
        });
    }

    getCsrfToken() {
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        return csrfMeta ? csrfMeta.getAttribute('content') : '';
    }

    formatPrice(price) {
        return `€${price.toFixed(2)}`;
    }

    // ============================================
    // KITCHEN ON FIRE FEATURE - ORDER STATUS CHECK
    // ============================================

    /**
     * Initialize order status checking
     */
    async initOrderStatusCheck() {
        console.log('🔍 Initializing Kitchen On Fire feature...');

        // Check immediately on page load
        await this.checkOrderStatus();

        // Then check every 60 seconds
        this.startOrderStatusPolling();

        // Listen for real-time updates via Socket.io (if available)
        this.setupOrderStatusSocketListener();
    }

    /**
     * Check if restaurant is accepting orders
     */
    async checkOrderStatus() {
        try {
            console.log('📡 Checking if restaurant is accepting orders...');

            const response = await fetch(`${this.apiUrl}/restaurant/accepting-orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Order status response:', result);

            if (result.success) {
                const isAccepting = result.data.acceptingOrders;
                this.isAcceptingOrders = isAccepting;

                if (isAccepting) {
                    this.hideKitchenFireOverlay();
                    this.enableOrderFeatures();
                } else {
                    this.showKitchenFireOverlay();
                    this.disableOrderFeatures();
                }
            }

        } catch (error) {
            console.error('❌ Error checking order status:', error);
            // On error, default to accepting orders (fail-safe)
            this.isAcceptingOrders = true;
            this.hideKitchenFireOverlay();
        }
    }

    /**
     * Show the Kitchen On Fire overlay
     */
    showKitchenFireOverlay() {
        console.log('🔥 Showing Kitchen On Fire overlay...');

        const overlay = document.getElementById('kitchenFireOverlay');
        if (overlay) {
            overlay.style.display = 'flex';

            // Start countdown timer
            this.startRefreshCountdown();

            // Prevent scrolling on body
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide the Kitchen On Fire overlay
     */
    hideKitchenFireOverlay() {
        console.log('✅ Hiding Kitchen On Fire overlay...');

        const overlay = document.getElementById('kitchenFireOverlay');
        if (overlay) {
            overlay.style.display = 'none';

            // Stop countdown timer
            this.stopRefreshCountdown();

            // Re-enable scrolling
            document.body.style.overflow = '';
        }
    }

    /**
     * Disable ordering features when kitchen is closed
     */
    disableOrderFeatures() {
        console.log('🚫 Disabling order features...');

        // Disable all "Add to Cart" buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'A rendelés jelenleg nem elérhető';
        });
    }

    /**
     * Enable ordering features when kitchen is open
     */
    enableOrderFeatures() {
        console.log('✅ Enabling order features...');

        // Re-enable all "Add to Cart" buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = 'Kosárba';
        });
    }

    /**
     * Start polling for order status every 60 seconds
     */
    startOrderStatusPolling() {
        console.log('⏰ Starting order status polling (every 60 seconds)...');

        // Clear any existing timer
        if (this.orderStatusCheckTimer) {
            clearInterval(this.orderStatusCheckTimer);
        }

        // Check every 60 seconds
        this.orderStatusCheckTimer = setInterval(() => {
            this.checkOrderStatus();
        }, 60000);
    }

    /**
     * Stop polling
     */
    stopOrderStatusPolling() {
        if (this.orderStatusCheckTimer) {
            clearInterval(this.orderStatusCheckTimer);
            this.orderStatusCheckTimer = null;
        }
    }

    /**
     * Start the refresh countdown timer (60 seconds)
     */
    startRefreshCountdown() {
        this.refreshCountdown = 60;
        const countdownElement = document.getElementById('refreshCountdown');

        if (!countdownElement) return;

        // Update immediately
        countdownElement.textContent = this.refreshCountdown;

        // Clear any existing countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // Update every second
        this.countdownInterval = setInterval(() => {
            this.refreshCountdown--;
            countdownElement.textContent = this.refreshCountdown;

            if (this.refreshCountdown <= 0) {
                // Auto-refresh the page
                console.log('⏰ Auto-refresh triggered');
                window.location.reload();
            }
        }, 1000);
    }

    /**
     * Stop the refresh countdown
     */
    stopRefreshCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    /**
     * Setup Socket.io listener for real-time order status updates
     */
    setupOrderStatusSocketListener() {
        // Check if Socket.io is available
        if (typeof io === 'undefined') {
            console.warn('⚠️ Socket.io not available, using polling only');
            return;
        }

        try {
            console.log('🔌 Connecting to Socket.io for real-time updates...');

            this.socket = io('https://palace-cafe-backend-production.up.railway.app', {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 10
            });

            this.socket.on('connect', () => {
                console.log('✅ Socket.io connected');
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 Socket.io disconnected');
            });

            // Listen for order status changes
            this.socket.on('orderStatusChanged', (data) => {
                console.log('🔔 Real-time order status update:', data);

                const isAccepting = data.acceptingOrders;
                this.isAcceptingOrders = isAccepting;

                if (isAccepting) {
                    this.hideKitchenFireOverlay();
                    this.enableOrderFeatures();
                    this.showSuccessToast('✅ Rendelések újra elérhetők!');
                } else {
                    this.showKitchenFireOverlay();
                    this.disableOrderFeatures();
                }
            });

            this.socket.on('error', (error) => {
                console.error('❌ Socket.io error:', error);
            });

        } catch (error) {
            console.error('❌ Failed to setup Socket.io:', error);
        }
    }

    /**
     * Cleanup when page unloads
     */
    cleanup() {
        this.stopOrderStatusPolling();
        this.stopRefreshCountdown();

        if (this.socket) {
            this.socket.disconnect();
        }
    }

}

window.addEventListener('beforeunload', () => {
    if (window.orderSystem) {
        window.orderSystem.cleanup();
    }
});

/**
 * Menu Page API Integration - Debug Version
 * Loads real menu data and populates the category grids
 */
class MenuDataLoader {
    constructor() {
        this.apiUrl = 'https://palace-cafe-backend-production.up.railway.app/api';
        
        // Only run on menu page
        if (document.querySelector('.menu-main')) {
            this.init();
        }
    }

    init() {
        console.log('🍔 Menu data loader starting...');
        this.loadMenuData();
    }

    /**
     * Load menu data from API with detailed debugging
     */
    async loadMenuData() {
        try {
            // Show loading state
            this.showLoading();
            
            console.log('🔍 Testing API connection...');
            
            // Test if we can reach the server at all
            const testUrl = `${this.apiUrl}/health`;
            console.log(`Testing: ${testUrl}`);
            
            const response = await fetch(testUrl);
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`Health check failed with status ${response.status}`);
            }
            
            const healthCheck = await response.json();
            console.log('✅ Health check result:', healthCheck);
            
            // Now try to get menu
            console.log('📡 Fetching menu data...');
            const menuResponse = await fetch(`${this.apiUrl}/menu`);
            console.log('Menu response status:', menuResponse.status);
            console.log('Menu response ok:', menuResponse.ok);
            
            if (!menuResponse.ok) {
                throw new Error(`Menu fetch failed with status ${menuResponse.status}`);
            }
            
            const result = await menuResponse.json();
            console.log('📦 Raw menu response:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'API returned unsuccessful response');
            }
            
            console.log('✅ Menu data received:', result.data);
            this.populateMenuSections(result.data);
            
        } catch (error) {
            console.error('❌ Full error details:', error);
            console.error('❌ Error type:', error.constructor.name);
            console.error('❌ Error message:', error.message);
            this.showError(`Connection failed: ${error.message}`);
        }
    }

    /**
     * Show loading state in all menu grids
     */
    showLoading() {
        const grids = document.querySelectorAll('.menu-items-grid');
        console.log(`📋 Found ${grids.length} menu grids to populate`);
        grids.forEach(grid => {
            grid.classList.add('loading');
            grid.innerHTML = '<div class="menu-loading">Menü betöltése...</div>';
        });
    }

    /**
     * Show error in all menu grids
     */
    showError(message) {
        const grids = document.querySelectorAll('.menu-items-grid');
        grids.forEach(grid => {
            grid.classList.remove('loading');
            grid.innerHTML = `<div class="menu-error">${message}</div>`;
        });
    }

    /**
     * Populate menu sections with real data
     */
    populateMenuSections(menuData) {
        console.log('🎯 Starting to populate menu sections...');
        console.log('📊 Available categories in data:', Object.keys(menuData));

        // Map your HTML section IDs to API category names
        const htmlToSlugMapping = {
            'smashburgers-items': 'smashburgers',
            'hamburgers-items': 'hamburgers', 
            'qurritos-items': 'qurritos',
            'mediterranean-items': 'mediterranean',
            'sides-items': 'sides',
            'desserts-items': 'desserts',
            'sauces-items': 'sauces',
            'nonalcoholic-items': 'nonalcoholic',
            'cocktails-items': 'cocktails',
            'alcohol-items': 'alcohol',
            'coffees-items': 'coffees',
            'specialty-items': 'specialty',
            'lemonades-items': 'lemonades',
            'shots-items': 'shots'
        };

        // Populate each section
        Object.keys(htmlToSlugMapping).forEach(gridId => {
            const targetSlug = htmlToSlugMapping[gridId];
            const grid = document.getElementById(gridId);
            
            console.log(`🔍 Processing ${gridId} -> looking for slug: ${targetSlug}`);
            console.log(`🎯 Grid element found:`, !!grid);
            
            if (grid) {
                // Find the category by slug instead of by translated name
                const categoryData = this.findCategoryBySlug(menuData, targetSlug);
                
                if (categoryData && categoryData.items && categoryData.items.length > 0) {
                    console.log(`✅ Rendering ${categoryData.items.length} items for ${categoryData.name} (${targetSlug})`);
                    this.renderCategoryItems(grid, categoryData);
                } else {
                    console.log(`⚠️ No items found for slug: ${targetSlug}`);
                    grid.innerHTML = `<div class="menu-loading">Nincs elérhető tétel: ${targetSlug}</div>`;
                }
            } else {
                console.warn(`❌ Grid element not found: ${gridId}`);
            }
        });
    }

    /**
     * Find category by slug in the menu data
     */
    findCategoryBySlug(menuData, targetSlug) {
        for (const [translatedName, categoryData] of Object.entries(menuData)) {
            if (categoryData.slug === targetSlug) {
                return {
                    name: translatedName,
                    slug: categoryData.slug,
                    items: categoryData.items
                };
            }
        }
        return null;
    }

    /**
     * Render items in a category grid
     */
    renderCategoryItems(grid, categoryData) {
        grid.classList.remove('loading');
        grid.innerHTML = ''; // Clear loading message
        
        categoryData.items.forEach((item, index) => {
            console.log(`📝 Creating card for item ${index + 1}: ${item.name}`);
            const itemCard = this.createMenuItemCard(item);
            grid.appendChild(itemCard);
        });
        
        console.log(`✅ Successfully rendered ${categoryData.items.length} items for ${categoryData.name}`);
    }

    /**
     * Create menu item card HTML element
     */
    createMenuItemCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-item-card';
        card.dataset.itemId = item.id;
        
        // Create the card structure to match your CSS
        card.innerHTML = `
            <div class="menu-item-header">
                <h3 class="menu-item-name">${this.escapeHtml(item.name)}</h3>
                <div class="price-dots"></div>
                <div class="menu-item-price">€${item.price.toFixed(2)}</div>
            </div>
            ${item.description ? `<p class="menu-item-description">${this.escapeHtml(item.description)}</p>` : ''}
            ${this.renderAllergenBadgesMenu(item.allergens || [])}
        `;
        
        return card;
    }

    /**
     * Render allergen badges for menu page
     */
    renderAllergenBadgesMenu(allergenCodes) {
        if (!allergenCodes || allergenCodes.length === 0) {
            return '';
        }

        const badges = allergenCodes.map(code => 
            `<span class="allergen-badge" data-allergen="${code}" onclick="menuLoader.showAllergenModal('${code}')">${code}</span>`
        ).join('');

        return `<div class="allergen-badges">${badges}</div>`;
    }

    /**
     * Show allergen modal for menu page
     */
    async showAllergenModal(allergenCode) {
        // Load allergen data if not already loaded
        if (!this.allergenData) {
            try {
                const response = await fetch(`${this.apiUrl}/allergens?lang=hu`);
                const result = await response.json();
                this.allergenData = result.success ? result.data : [];
            } catch (error) {
                console.error('Failed to load allergen data:', error);
                return;
            }
        }

        const allergen = this.allergenData.find(a => a.code === allergenCode);
        if (!allergen) return;

        // Same modal creation logic as order page
        let modal = document.getElementById('allergenModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'allergenModal';
            modal.className = 'modal-overlay allergen-modal';
            modal.innerHTML = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 class="modal-title">Allergén információ</h3>
                        <button class="modal-close" onclick="menuLoader.closeAllergenModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="allergen-info">
                            <div class="allergen-code" id="allergenCode"></div>
                            <div class="allergen-name" id="allergenName"></div>
                            <div class="allergen-description">
                                Ez az allergén információ az EU szabályozás szerint.
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllergenModal();
            });
        }

        document.getElementById('allergenCode').textContent = allergenCode;
        document.getElementById('allergenName').textContent = allergen.name;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close allergen modal for menu page
     */
    closeAllergenModal() {
        const modal = document.getElementById('allergenModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Escape HTML to prevent XSS attacks
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Category Navigation with Dropdown Support
 */
class CategoryNavigation {
    constructor() {
        this.navItems = document.querySelectorAll('.category-nav-item:not(.dropdown)');
        this.dropdownItems = document.querySelectorAll('.dropdown-menu a');
        this.sections = document.querySelectorAll('.menu-category-section');
        
        if (this.sections.length > 0) {
            this.init();
        }
    }

    init() {
        this.setupClickHandlers();
        this.setupDropdownHandlers();
        this.setupScrollSpy();
        console.log('🧭 Category navigation with dropdowns initialized');
    }

    setupClickHandlers() {
        // Main navigation items
        this.navItems.forEach(item => {
            const link = item.querySelector('a');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const targetId = item.dataset.target;
                    if (targetId) {
                        this.scrollToSection(targetId);
                        this.updateActiveState(item);
                    }
                });
            }
        });
    }

    setupDropdownHandlers() {
        // Clear any existing handlers first to prevent duplicates
        this.cleanupAllHandlers();

        // Initialize handler storage
        this.mobileDropdownHandlers = this.mobileDropdownHandlers || new Map();
        this.desktopDropdownHandlers = this.desktopDropdownHandlers || new Map();

        // Dropdown menu items (existing functionality)
        this.dropdownItems.forEach(item => {
            const handler = (e) => {
                e.preventDefault();
                const targetId = item.dataset.target;
                if (targetId) {
                    this.scrollToSection(targetId);
                    this.updateActiveState(item.closest('.dropdown'));
                }
            };

            item.addEventListener('click', handler);
        });

        // Initial responsive setup
        this.setupResponsiveDropdowns();

        // Handle window resize (remove existing listener first)
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => {
            this.setupResponsiveDropdowns();
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    cleanupAllHandlers() {
        // Remove mobile handlers
        if (this.mobileDropdownHandlers) {
            this.mobileDropdownHandlers.forEach((handler, button) => {
                button.removeEventListener('click', handler);
            });
            this.mobileDropdownHandlers.clear();
        }
        
        // Remove desktop handlers
        if (this.desktopDropdownHandlers) {
            this.desktopDropdownHandlers.forEach((handler, button) => {
                button.removeEventListener('click', handler);
            });
            this.desktopDropdownHandlers.clear();
        }
        
        // Remove resize handler
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        // Remove outside click handler
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }
        
        // Remove any existing panels
        this.removeMobileSubcategoryPanels();
        
        // Remove mobile-open classes
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('mobile-open');
        });
    }
    
    setupResponsiveDropdowns() {
        // Only clean dropdown-specific handlers, not all
        this.cleanupDropdownHandlers();
        
        if (window.innerWidth <= 768) {
            this.setupMobileSubcategories();
        } else {
            this.setupDesktopDropdowns();
        }
    }
    
    cleanupDropdownHandlers() {
        // Remove mobile handlers
        this.mobileDropdownHandlers.forEach((handler, button) => {
            button.removeEventListener('click', handler);
        });
        this.mobileDropdownHandlers.clear();
        
        // Remove desktop handlers
        this.desktopDropdownHandlers.forEach((handler, button) => {
            button.removeEventListener('click', handler);
        });
        this.desktopDropdownHandlers.clear();
        
        // Remove panels
        this.removeMobileSubcategoryPanels();
        
        // Remove mobile-open classes
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('mobile-open');
        });
    }

    destroy() {
        this.cleanupAllHandlers();
        // Remove any intersection observers if they exist
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }
    }    
    
    setupMobileSubcategories() {
        // Remove desktop hover functionality
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('mobile-open');
        });
        
        // Add mobile click handlers
        document.querySelectorAll('.dropdown > a').forEach(dropdownBtn => {
            // Remove existing listeners
            dropdownBtn.removeEventListener('click', this.mobileDropdownHandler);
            
            // Add new listener
            this.mobileDropdownHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showMobileSubcategoryPanel(dropdownBtn);
            };
            
            dropdownBtn.addEventListener('click', this.mobileDropdownHandler);
        });
    }
    
    setupDesktopDropdowns() {
        // Remove mobile click handlers
        document.querySelectorAll('.dropdown > a').forEach(dropdownBtn => {
            if (this.mobileDropdownHandler) {
                dropdownBtn.removeEventListener('click', this.mobileDropdownHandler);
            }
        });
        
        // Desktop hover functionality (existing code)
        document.querySelectorAll('.dropdown > a').forEach(dropdownBtn => {
            dropdownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = dropdownBtn.closest('.dropdown');
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown').forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('mobile-open');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('mobile-open');
            });
        });
    
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('mobile-open');
                });
            }
        });
    }
    
    showMobileSubcategoryPanel(button) {
        const dropdown = button.closest('.dropdown');
        const subcategories = dropdown.querySelectorAll('.dropdown-menu a');
        
        if (subcategories.length === 0) return;
        
        // Create mobile panel
        const panel = document.createElement('div');
        panel.className = 'mobile-subcategory-panel';
        panel.innerHTML = `
            <div class="subcategory-content">
                <div class="subcategory-header">
                    <h3 class="subcategory-title">${button.textContent.trim()}</h3>
                    <button class="subcategory-close" aria-label="Close">&times;</button>
                </div>
                <div class="subcategory-options">
                    ${Array.from(subcategories).map(item => 
                        `<a href="#" class="subcategory-option" data-target="${item.dataset.target || ''}">
                            ${item.textContent.trim()}
                        </a>`
                    ).join('')}
                </div>
            </div>
        `;
                
        document.body.appendChild(panel);
                
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
                
        // Show panel with animation
        requestAnimationFrame(() => {
            panel.classList.add('active');
        });
        
        // Close button handler
        const closeBtn = panel.querySelector('.subcategory-close');
        closeBtn.addEventListener('click', () => {
            this.closeMobileSubcategoryPanel(panel);
        });
        
        // Background click handler
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.closeMobileSubcategoryPanel(panel);
            }
        });
        
        // Option click handlers
        panel.querySelectorAll('.subcategory-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = option.dataset.target;
                if (targetId) {
                    this.scrollToSection(targetId);
                    this.updateActiveState(dropdown);
                    this.closeMobileSubcategoryPanel(panel);
                }
            });
        });
        
        // ESC key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeMobileSubcategoryPanel(panel);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    closeMobileSubcategoryPanel(panel) {
        if (!panel || !panel.parentNode) return;
        
        panel.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Remove panel after animation
        setTimeout(() => {
            if (panel.parentNode) {
                panel.parentNode.removeChild(panel);
            }
        }, 300);
    }
    
    removeMobileSubcategoryPanels() {
        // Remove any existing mobile panels
        document.querySelectorAll('.mobile-subcategory-panel').forEach(panel => {
            this.closeMobileSubcategoryPanel(panel);
        });
    }
    
    scrollToSection(targetId) {
        const section = document.getElementById(targetId);
        if (section) {
            const headerHeight = document.querySelector('.main-header')?.offsetHeight || 110;
            const navHeight = document.querySelector('.menu-page-nav')?.offsetHeight || 60;
            const totalOffset = headerHeight + navHeight + 20;
            
            const offsetTop = section.offsetTop - totalOffset;
            
            window.scrollTo({
                top: Math.max(0, offsetTop),
                behavior: 'smooth'
            });
        }
    }
    
    updateActiveState(activeDropdown) {
        // Remove active state from all navigation items
        document.querySelectorAll('.category-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active state to current item
        if (activeDropdown) {
            activeDropdown.classList.add('active');
        }
    }

    updateActiveState(activeItem) {
        // Remove active from all main nav items
        document.querySelectorAll('.category-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active to the selected item
        activeItem.classList.add('active');
    }

    scrollToSection(targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            const headerHeight = document.querySelector('.main-header')?.offsetHeight || 80;
            const navHeight = document.querySelector('.category-nav')?.offsetHeight || 55;
            const offsetTop = targetSection.offsetTop - headerHeight - navHeight - 20;

            window.scrollTo({
                top: Math.max(0, offsetTop),
                behavior: 'smooth'
            });
        }
    }

    setupScrollSpy() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.highlightActiveSection(sectionId);
                }
            });
        }, options);

        this.sections.forEach(section => {
            if (section.id) {
                observer.observe(section);
            }
        });
    }

    highlightActiveSection(sectionId) {
        // Define which sections belong to which main nav items
        const sectionMapping = {
            'smashburgers': 'smashburgers',
            'hamburgers': 'smashburgers', // Group with burgers
            'qurritos': 'qurritos',
            'mediterranean': 'mediterranean',
            'nonalcoholic': 'drinks',
            'coffees': 'drinks',
            'lemonades': 'drinks',
            'specialty': 'drinks',
            'cocktails': 'drinks',
            'alcohol': 'drinks',
            'shots': 'drinks',
            'sides': 'extras',
            'desserts': 'extras',
            'sauces': 'extras'
        };

        const mainCategory = sectionMapping[sectionId];
        if (mainCategory) {
            // Find the nav item for this main category
            let targetNavItem;
            
            if (mainCategory === 'drinks') {
                targetNavItem = document.querySelector('.dropdown');
            } else if (mainCategory === 'extras') {
                targetNavItem = document.querySelectorAll('.dropdown')[1]; // Second dropdown
            } else {
                targetNavItem = document.querySelector(`[data-target="${mainCategory}"]`);
            }
            
            if (targetNavItem) {
                this.updateActiveState(targetNavItem);
            }
        }
    }
}

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.palaceCafeInitialized) {
        console.log('Palace Cafe already initialized, skipping...');
        return;
    }
    
    window.palaceCafeInitialized = true;
    window.palaceCafe = new PalaceCafeWebsite();

    // Initialize page-specific systems
    if (document.querySelector('.order-main')) {
        window.orderSystem = new OrderSystem();
        window.palaceCafe.foodOrdering = window.orderSystem;
    }
    if (document.querySelector('.menu-main')) {
        window.menuDataLoader = new MenuDataLoader();
        window.menuLoader = window.menuDataLoader;
        window.categoryNavigation = new CategoryNavigation();
    }
});

// Expose useful methods globally for debugging and future enhancements
window.PalaceCafeAPI = {
    scrollToTop: () => window.palaceCafe?.scrollToTop(),
    changeFoodCategory: (index) => window.palaceCafe?.changeFoodCategory(index),
    nextHeroSlide: () => window.palaceCafe?.nextHeroSlide(),
    previousHeroSlide: () => window.palaceCafe?.previousHeroSlide()
};

// Service Worker registration for future PWA features
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Analytics and performance monitoring setup
window.addEventListener('load', () => {
    // Performance monitoring
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    
    // Future Google Analytics or other analytics integration
    // gtag('config', 'GA_MEASUREMENT_ID');
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    // Future error reporting to analytics service
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    // Future error reporting to analytics service
});



