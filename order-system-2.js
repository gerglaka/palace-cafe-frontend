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
        const scrollToTopBtn = document.getElementById('scrollToTop');
        scrollToTopBtn?.addEventListener('click', () => this.scrollToTop());

        const mobileMenuIcon = document.getElementById('mobileMenuIcon');
        const mobileMenu = document.getElementById('mobileMenu');
        
        mobileMenuIcon?.addEventListener('click', () => {
            mobileMenuIcon.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!mobileMenuIcon?.contains(e.target) && !mobileMenu?.contains(e.target)) {
                mobileMenuIcon?.classList.remove('active');
                mobileMenu?.classList.remove('active');
            }
        });    

        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.changeFoodCategory(index));
        });

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
        return;
    }

    nextHeroSlide() {
        this.currentHeroSlide = (this.currentHeroSlide + 1) % 3;
        this.updateHeroSlide();
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
            titleElement.style.transition = 'opacity 2s ease-in-out';
            subtitleElement.style.transition = 'opacity 2s ease-in-out';
            titleElement.style.opacity = '0';
            subtitleElement.style.opacity = '0';
            
            titleElement.textContent = currentText.title;
            subtitleElement.textContent = currentText.subtitle;
            
            setTimeout(() => {
                titleElement.style.opacity = '1';
                subtitleElement.style.opacity = '1';
            }, 50);
        }
    }

    initFoodCategoryCarousel() {
        const categoryItems = document.querySelectorAll('.category-item');
        
        if (categoryItems.length === 0) return;

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
        
        this.handleHappyHourBar(scrollY);
        this.handleMainHeaderScroll(scrollY);
        this.handleScrollToTopButton(scrollY);
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
    
        const categoryNav = document.querySelector('.category-nav');
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
        const criticalPages = ['/menu', '/rendeles'];
        
        criticalPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });

        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
        fontLink.as = 'style';
        fontLink.onload = function() { this.rel = 'stylesheet'; };
        document.head.appendChild(fontLink);
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

    addToCart(itemId, quantity = 1) {
        console.log(`Adding item ${itemId} to cart, quantity: ${quantity}`);
    }

    toggleLanguage(language) {
        console.log(`Switching to language: ${language}`);
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

class OrderSystem {
    constructor() {
        this.apiUrl = window.API_BASE_URL;
        this.cart = [];
        this.currentItem = null;
        this.customizationOptions = null;
        this.deliveryFee = 2.50;
        this.menuData = null;
        this.operatingHours = {
            0: null,
            1: null,
            2: null,
            3: { open: '11:00', close: '19:30' },
            4: { open: '11:00', close: '19:30' },
            5: { open: '11:00', close: '21:00' },
            6: { open: '11:00', close: '21:00' }
        };

        this.isAcceptingOrders = true;
        this.orderStatusCheckTimer = null;
        this.refreshCountdown = 60;
        this.allergenData = null;
        this.currentModalQuantity = 1;
        
        this.init();
    }

    /**
     * Translation helper function
     * @param {string} key - Translation key (e.g., 'cart.item')
     * @param {object} vars - Variables to replace in translation
     * @returns {string} Translated text
     */
    t(key, vars = {}) {
        if (typeof window.i18n === 'undefined' || typeof window.i18n.t !== 'function') {
            console.warn('i18n not loaded, returning key:', key);
            return key;
        }
        return window.i18n.t(key, vars);
    }

    async init() {
        this.showLoadingOverlay();
        
        const orderAccepted = await this.checkOrderAcceptance();
        
        if (!orderAccepted) {
            this.hideLoadingOverlay();
            this.showKitchenFireOverlay();
            return;
        }

        try {
            await this.loadMenu();
            await this.loadAllergens();
            await this.loadCustomizationOptions();
            
            this.setupEventListeners();
            this.loadCartFromStorage();
            this.updateCartUI();
            
            this.hideLoadingOverlay();
            
            console.log('Order system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize order system:', error);
            this.hideLoadingOverlay();
            alert(this.t('errors.general'));
        }
    }

    async checkOrderAcceptance() {
        try {
            const response = await fetch(`${this.apiUrl}/orders/status`);
            const data = await response.json();
            
            this.isAcceptingOrders = data.acceptingOrders;
            
            return this.isAcceptingOrders;
        } catch (error) {
            console.error('Failed to check order status:', error);
            return true;
        }
    }

    showKitchenFireOverlay() {
        const overlay = document.getElementById('kitchenFireOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            
            this.startRefreshCountdown();
        }
    }

    startRefreshCountdown() {
        const countdownElement = document.getElementById('refreshCountdown');
        
        if (this.orderStatusCheckTimer) {
            clearInterval(this.orderStatusCheckTimer);
        }
        
        this.refreshCountdown = 60;
        
        this.orderStatusCheckTimer = setInterval(() => {
            this.refreshCountdown--;
            
            if (countdownElement) {
                countdownElement.textContent = this.refreshCountdown;
            }
            
            if (this.refreshCountdown <= 0) {
                window.location.reload();
            }
        }, 1000);
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    async loadMenu() {
        try {
            const response = await fetch(`${this.apiUrl}/menu`);
            if (!response.ok) throw new Error('Failed to load menu');
            
            this.menuData = await response.json();
            
            this.renderCategoryNavigation(this.menuData);
            this.renderMenu(this.menuData);
            
            console.log('Menu loaded successfully');
        } catch (error) {
            console.error('Error loading menu:', error);
            throw error;
        }
    }

    async loadAllergens() {
        try {
            const response = await fetch(`${this.apiUrl}/allergens`);
            if (!response.ok) throw new Error('Failed to load allergens');
            
            this.allergenData = await response.json();
            
            console.log('Allergens loaded successfully');
        } catch (error) {
            console.error('Error loading allergens:', error);
        }
    }

    async loadCustomizationOptions() {
        try {
            const response = await fetch(`${this.apiUrl}/customization-options`);
            if (!response.ok) throw new Error('Failed to load customization options');
            
            this.customizationOptions = await response.json();
            
            console.log('Customization options loaded successfully');
        } catch (error) {
            console.error('Error loading customization options:', error);
            throw error;
        }
    }

    getOperatingHoursText() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const todayHours = this.operatingHours[dayOfWeek];
        
        if (!todayHours) {
            return this.t('orderPage.closedInfo');
        }
        
        const [openHour, openMin] = todayHours.open.split(':').map(Number);
        const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        
        if (currentTime < openTime) {
            return `${this.t('orderPage.opensAt')} ${todayHours.open}`;
        } else if (currentTime > closeTime) {
            return this.t('orderPage.closedInfo');
        } else {
            return `${this.t('orderPage.openUntil')} ${todayHours.close}`;
        }
    }

    showHoursModal() {
        let modal = document.getElementById('hoursModal');
        
        if (!modal) {
            const dayNames = [
                this.t('orderPage.sunday'),
                this.t('orderPage.monday'),
                this.t('orderPage.tuesday'),
                this.t('orderPage.wednesday'),
                this.t('orderPage.thursday'),
                this.t('orderPage.friday'),
                this.t('orderPage.saturday')
            ];
            
            const today = new Date().getDay();
            let hoursHTML = '';
            
            for (let i = 0; i < 7; i++) {
                const hours = this.operatingHours[i];
                const isToday = i === today;
                const hoursText = hours ? `${hours.open} - ${hours.close}` : this.t('orderPage.closed');
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
                        <h3 class="hours-modal-title">${this.t('homepage.openingHours')}</h3>
                        <button class="hours-close" onclick="orderSystem.hideHoursModal()">×</button>
                    </div>
                    <ul class="hours-list">
                        ${hoursHTML}
                    </ul>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideHoursModal();
                }
            });
        }
        
        modal.classList.add('active');
    }

    hideHoursModal() {
        const modal = document.getElementById('hoursModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    renderCategoryNavigation(menuData) {
        const navScroll = document.getElementById('categoryNavScroll');
        if (!navScroll) return;

        navScroll.innerHTML = '';

        Object.keys(menuData).forEach((categoryName, index) => {
            const category = menuData[categoryName];
            const button = document.createElement('button');
            button.className = `category-nav-item ${index === 0 ? 'active' : ''}`;
            button.dataset.category = category.slug;
            button.innerHTML = `<span>${categoryName}</span>`;

            button.addEventListener('click', () => this.scrollToCategory(category.slug));

            navScroll.appendChild(button);
        });
    }

    renderMenu(menuData) {
        const orderMain = document.getElementById('orderMain');
        if (!orderMain) return;

        orderMain.innerHTML = '';

        Object.keys(menuData).forEach(categoryName => {
            const category = menuData[categoryName];

            const section = document.createElement('section');
            section.className = 'food-category';
            section.id = category.slug;
            section.dataset.category = category.slug;

            section.innerHTML = `
                <div class="category-header">
                    <h2 class="category-title">${categoryName}</h2>
                    <p class="category-description">${this.t('orderPage.selectFrom')} ${categoryName.toLowerCase()}</p>
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
            const image = item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy">` : `<div class="no-image">${this.t('orderPage.noImage')}</div>`;

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
                                ${this.t('order.addToCart')}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAllergenBadges(allergenCodes) {
        if (!allergenCodes || allergenCodes.length === 0) {
            return '';
        }

        const badges = allergenCodes.map(code => 
            `<span class="allergen-badge" data-allergen="${code}" onclick="orderSystem.showAllergenModal('${code}')">${code}</span>`
        ).join('');

        return `<div class="allergen-badges">${badges}</div>`;
    }

    showAllergenModal(allergenCode) {
        if (!this.allergenData) return;

        const allergen = this.allergenData.find(a => a.code === allergenCode);
        if (!allergen) return;

        let modal = document.getElementById('allergenModal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'allergenModal';
            modal.className = 'modal-overlay allergen-modal';
            modal.innerHTML = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 class="modal-title">${this.t('orderPage.allergenInfo')}</h3>
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
                                ${this.t('orderPage.allergenEUInfo')}
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

    closeAllergenModal() {
        const modal = document.getElementById('allergenModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    scrollToCategory(categorySlug) {
        const section = document.getElementById(categorySlug);
        if (section) {
            const navHeight = document.querySelector('.category-nav')?.offsetHeight || 0;
            const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
            const offset = navHeight + headerHeight + 20;
            
            const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }

        document.querySelectorAll('.category-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeButton = document.querySelector(`[data-category="${categorySlug}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    handleAddToCartClick(event, itemId) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Add to cart clicked for item:', itemId);
        
        const item = this.findItemById(itemId);
        if (!item) {
            console.error('Item not found:', itemId);
            return;
        }

        if (item.hasCustomization) {
            this.openCustomizationModal(item);
        } else {
            this.addToCart(item, 1, {
                sauce: null,
                fries: null,
                extras: [],
                removeInstructions: null,
                specialInstructions: null
            });
        }
    }

    findItemById(itemId) {
        if (!this.menuData) return null;

        for (const categoryName in this.menuData) {
            const category = this.menuData[categoryName];
            const item = category.items.find(i => i.id === itemId);
            if (item) return item;
        }

        return null;
    }
    
    openCustomizationModal(item) {
        this.currentItem = { ...item };
        this.currentModalQuantity = 1;
        
        const modal = document.getElementById('customizationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalFoodImage = document.getElementById('modalFoodImage');
        const modalFoodName = document.getElementById('modalFoodName');
        const modalFoodDescription = document.getElementById('modalFoodDescription');
        const modalFoodPrice = document.getElementById('modalFoodPrice');
        const quantityInput = document.getElementById('quantityInput');
        
        if (modalTitle) modalTitle.textContent = this.t('customization.title');
        if (modalFoodImage) modalFoodImage.src = item.imageUrl || '/placeholder.jpg';
        if (modalFoodName) modalFoodName.textContent = item.name;
        if (modalFoodDescription) modalFoodDescription.textContent = item.description || '';
        if (modalFoodPrice) modalFoodPrice.textContent = `€${item.price.toFixed(2)}`;
        if (quantityInput) quantityInput.value = this.currentModalQuantity;
        
        this.renderSauceOptions(item);
        this.renderFriesOptions(item);
        
        this.updateModalTotal();
        
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    renderSauceOptions(item) {
        const sauceSection = document.getElementById('sauceSection');
        const sauceOptions = document.getElementById('sauceOptions');
        
        if (!item.allowsSauceChoice || !this.customizationOptions?.sauces) {
            if (sauceSection) sauceSection.style.display = 'none';
            return;
        }
        
        if (sauceSection) sauceSection.style.display = 'block';
        
        if (sauceOptions) {
            sauceOptions.innerHTML = this.customizationOptions.sauces.map((sauce, index) => `
                <label class="sauce-option">
                    <input type="radio" name="sauce" value="${sauce.slug}" ${index === 0 ? 'checked' : ''}>
                    <span class="sauce-label">
                        <span class="sauce-name">${sauce.name}</span>
                        ${sauce.priceAddon > 0 ? `<span class="sauce-price">+€${sauce.priceAddon.toFixed(2)}</span>` : ''}
                    </span>
                </label>
            `).join('');
        }
    }

    renderFriesOptions(item) {
        const friesSection = document.getElementById('friesSection');
        const friesOptions = document.getElementById('friesOptions');
        
        if (!this.customizationOptions?.friesOptions) {
            if (friesSection) friesSection.style.display = 'none';
            return;
        }
        
        if (friesSection) friesSection.style.display = 'block';
        
        if (friesOptions) {
            friesOptions.innerHTML = this.customizationOptions.friesOptions.map((fries, index) => {
                let priceText = '';
                if (item.includesSides) {
                    if (fries.slug === 'regular-fries') {
                        priceText = `<span class="fries-price-included">${this.t('customization.included')}</span>`;
                    } else if (fries.priceAddon > 0) {
                        priceText = `<span class="fries-price">+€${fries.priceAddon.toFixed(2)}</span>`;
                    }
                } else {
                    if (fries.priceAddon > 0) {
                        priceText = `<span class="fries-price">+€${fries.priceAddon.toFixed(2)}</span>`;
                    }
                }
                
                return `
                    <label class="fries-option">
                        <input type="radio" name="fries" value="${fries.slug}" ${index === 0 ? 'checked' : ''}>
                        <span class="fries-label">
                            <span class="fries-name">${fries.name}</span>
                            ${priceText}
                        </span>
                    </label>
                `;
            }).join('');
        }
    }

    updateQuantity(delta) {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;
        
        let newQuantity = this.currentModalQuantity + delta;
        if (newQuantity < 1) newQuantity = 1;
        if (newQuantity > 99) newQuantity = 99;
        
        this.currentModalQuantity = newQuantity;
        quantityInput.value = newQuantity;
        
        this.updateModalTotal();
    }

    updateModalTotal() {
        if (!this.currentItem) return;
        
        let total = this.currentItem.price;
        
        const selectedFries = document.querySelector('input[name="fries"]:checked');
        if (selectedFries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === selectedFries.value);
            if (friesOption) {
                if (this.currentItem.includesSides) {
                    if (friesOption.slug !== 'regular-fries') {
                        total += friesOption.priceAddon;
                    }
                } else {
                    if (selectedFries.value !== 'none') {
                        total += friesOption.priceAddon;
                    }
                }
            }
        }
        
        const selectedExtras = document.querySelectorAll('input[name="extras"]:checked');
        if (selectedExtras.length > 0) {
            const extraPrice = 0.30;
            total += selectedExtras.length * extraPrice;
        }
        
        total *= this.currentModalQuantity;
        
        const modalTotalPrice = document.getElementById('modalTotalPrice');
        if (modalTotalPrice) {
            modalTotalPrice.textContent = `€${total.toFixed(2)}`;
        }
    }

    addToCartFromModal() {
        if (!this.currentItem) return;
        
        const selectedSauce = document.querySelector('input[name="sauce"]:checked')?.value || null;
        const selectedFries = document.querySelector('input[name="fries"]:checked')?.value || null;
        const selectedExtras = Array.from(document.querySelectorAll('input[name="extras"]:checked')).map(cb => cb.value);
        const selectedRemoveItems = Array.from(document.querySelectorAll('input[name="remove"]:checked')).map(cb => cb.value);
        const specialNotes = document.getElementById('specialNotesInput')?.value || '';
        
        const customization = {
            sauce: selectedSauce,
            fries: selectedFries,
            extras: selectedExtras,
            removeInstructions: selectedRemoveItems.length > 0 ? selectedRemoveItems.join(', ') : null,
            specialInstructions: specialNotes || null
        };
        
        this.addToCart(this.currentItem, this.currentModalQuantity, customization);
        this.closeModal();
    }

    closeModal() {
        const modal = document.getElementById('customizationModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        this.currentItem = null;
        this.currentModalQuantity = 1;
        
        document.querySelectorAll('input[name="sauce"]').forEach(input => input.checked = false);
        document.querySelectorAll('input[name="fries"]').forEach(input => input.checked = false);
        document.querySelectorAll('input[name="extras"]').forEach(input => input.checked = false);
        document.querySelectorAll('input[name="remove"]').forEach(input => input.checked = false);
        
        const specialNotesInput = document.getElementById('specialNotesInput');
        if (specialNotesInput) specialNotesInput.value = '';
    }

    addToCart(item, quantity, customization) {
        const cartItem = {
            id: this.generateCartItemId(item, customization),
            originalId: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            quantity: quantity,
            includesSides: item.includesSides || false,
            customization: customization
        };

        console.log('Adding to cart:', {
            name: cartItem.name,
            cartId: cartItem.id,
            quantity: cartItem.quantity,
            customization: cartItem.customization
        });

        const existingItemIndex = this.cart.findIndex(i => i.id === cartItem.id);

        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += quantity;
            console.log('Updated existing item quantity:', this.cart[existingItemIndex]);
        } else {
            this.cart.push(cartItem);
            console.log('Added new item to cart');
        }

        this.saveCartToStorage();
        this.updateCartUI();
        
        this.showNotification(this.t('notifications.addedToCart'), 'success');
    }

    generateCartItemId(item, customization) {
        const timestamp = Date.now();
        const components = [
            item.id || item.originalId,
            customization?.sauce || '',
            customization?.fries || '',
            (customization?.extras || []).sort().join(','),
            customization?.removeInstructions || '',
            customization?.specialInstructions || '',
            timestamp
        ];

        const componentString = components.join('|');
        let hash = 0;
        for (let i = 0; i < componentString.length; i++) {
            hash = ((hash << 5) - hash) + componentString.charCodeAt(i);
            hash = hash >>> 0;
        }

        const uniqueId = `${item.id || item.originalId}-${hash}-${timestamp}`;
        console.log('Generated cart ID:', {
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
        const emptyCartMessage = document.getElementById('emptyCartMessage');
        const cartSidebarFooter = document.querySelector('.cart-sidebar-footer');

        if (!cartItemsContainer) return;

        if (this.cart.length === 0) {
            cartItemsContainer.style.display = 'none';
            if (emptyCartMessage) emptyCartMessage.style.display = 'flex';
            if (cartSidebarFooter) cartSidebarFooter.style.display = 'none';
            cartItemsContainer.innerHTML = '';
            return;
        }

        cartItemsContainer.style.display = 'block';
        if (emptyCartMessage) emptyCartMessage.style.display = 'none';
        if (cartSidebarFooter) cartSidebarFooter.style.display = 'block';

        cartItemsContainer.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');
        
        this.setupCartItemEventListeners();
    }

    createCartItemHTML(item) {
        const itemTotal = this.calculateItemTotal(item);
        const customizations = this.getItemCustomizationsText(item);

        console.log('Creating HTML for cart item:', {
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
            if (sauce) customizations.push(`${this.t('customization.sauce')}: ${sauce.name}`);
        }
    
        if (item.customization.fries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === item.customization.fries);
            if (friesOption) {
                if (item.includesSides) {
                    if (friesOption.slug !== 'regular-fries' && friesOption.priceAddon > 0) {
                        customizations.push(`${friesOption.name} (+€${friesOption.priceAddon.toFixed(2)})`);
                    } else if (friesOption.slug === 'regular-fries') {
                        customizations.push(`${friesOption.name}`);
                    }
                } else {
                    if (friesOption.priceAddon > 0) {
                        customizations.push(`${friesOption.name} (+€${friesOption.priceAddon.toFixed(2)})`);
                    }
                }
            }
        }
    
        if (item.customization.extras?.length > 0) {
            const extraPrice = 0.30;
            const extraLabels = item.customization.extras.map(extra => {
                const extraData = this.customizationOptions?.extras?.find(e => e.slug === extra);
                const extraName = extraData ? extraData.name : extra;
                return `${extraName} (+€${extraPrice.toFixed(2)})`;
            });
            customizations.push(`${this.t('customization.extras')}: ${extraLabels.join(', ')}`);
        }

        if (item.customization.removeInstructions) {
            customizations.push(`${this.t('customization.remove')}: ${item.customization.removeInstructions}`);
        }

        if (item.customization.specialInstructions) {
            customizations.push(`${this.t('customization.specialNotes')}: ${item.customization.specialInstructions}`);
        }

        return customizations.join(' • ');
    }
    calculateItemTotal(item) {
        let total = item.price * item.quantity;

        if (item.customization.fries && this.customizationOptions?.friesOptions) {
            const friesOption = this.customizationOptions.friesOptions.find(f => f.slug === item.customization.fries);
            if (friesOption) {
                if (item.includesSides) {
                    if (friesOption.slug !== 'regular-fries') {
                        total += friesOption.priceAddon * item.quantity;
                    }
                } else {
                    if (item.customization.fries !== 'none') {
                        total += friesOption.priceAddon * item.quantity;
                    }
                }
            }
        }

        if (item.customization.extras?.length > 0) {
            const extraPrice = 0.30;
            total += item.customization.extras.length * extraPrice * item.quantity;
        }

        return total;
    }

    calculateSubtotal() {
        return this.cart.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
    }

    updateCartSummary() {
        const subtotal = this.calculateSubtotal();
        const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value;
        const actualDeliveryFee = deliveryType === 'pickup' ? 0 : this.deliveryFee;
        const grandTotal = subtotal + actualDeliveryFee;

        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartDeliveryFee = document.getElementById('cartDeliveryFee');
        const cartTotalPrice = document.getElementById('cartTotalPrice');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const minimumOrderNotice = document.getElementById('minimumOrderNotice');

        if (cartSubtotal) cartSubtotal.textContent = `€${subtotal.toFixed(2)}`;
        if (cartDeliveryFee) cartDeliveryFee.textContent = `€${actualDeliveryFee.toFixed(2)}`;
        if (cartTotalPrice) cartTotalPrice.textContent = `€${grandTotal.toFixed(2)}`;

        const minimumOrderAmount = 12.00;
        const meetsMinimum = subtotal >= minimumOrderAmount;

        if (minimumOrderNotice) {
            if (!meetsMinimum && this.cart.length > 0) {
                minimumOrderNotice.style.display = 'flex';
                const noticeText = minimumOrderNotice.querySelector('[data-i18n="order.minimumNotMet"]');
                if (noticeText && window.i18n) {
                    noticeText.textContent = this.t('order.minimumNotMet', { amount: minimumOrderAmount.toFixed(2) });
                }
            } else {
                minimumOrderNotice.style.display = 'none';
            }
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0 || !meetsMinimum;
        }
    }

    updateMobileCartButton() {
        const mobileCartButton = document.getElementById('mobileCartButton');
        console.log('Updating mobile cart button, items in cart:', this.cart.length);

        if (mobileCartButton) {
            const shouldShow = this.cart.length > 0;
            mobileCartButton.style.display = shouldShow ? 'block' : 'none';
            console.log('Mobile cart button display:', shouldShow ? 'visible' : 'hidden');
        } else {
            console.log('Mobile cart button element not found');
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.category-nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleCategoryClick(e));
        });

        const cartToggleBtn = document.getElementById('cartToggleBtn');
        const mobileCartBtn = document.getElementById('mobileCartBtn');
        const cartSidebarClose = document.getElementById('cartSidebarClose');
        const modalClose = document.getElementById('modalClose');
        const customizationModal = document.getElementById('customizationModal');
        const decreaseQty = document.getElementById('decreaseQty');
        const increaseQty = document.getElementById('increaseQty');
        const addToCartBtn = document.getElementById('addToCartBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartToggleBtn) cartToggleBtn.addEventListener('click', () => this.toggleCart());
        if (mobileCartBtn) mobileCartBtn.addEventListener('click', () => this.toggleCart());
        if (cartSidebarClose) cartSidebarClose.addEventListener('click', () => this.closeCart());
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        
        if (customizationModal) {
            customizationModal.addEventListener('click', (e) => {
                if (e.target === customizationModal) this.closeModal();
            });
        }
        
        if (decreaseQty) decreaseQty.addEventListener('click', () => this.updateQuantity(-1));
        if (increaseQty) increaseQty.addEventListener('click', () => this.updateQuantity(1));
        if (addToCartBtn) addToCartBtn.addEventListener('click', () => this.addToCartFromModal());
        if (checkoutBtn) checkoutBtn.addEventListener('click', () => this.handleCheckout());

        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                let value = parseInt(e.target.value);
                if (isNaN(value) || value < 1) value = 1;
                if (value > 99) value = 99;
                this.currentModalQuantity = value;
                e.target.value = value;
                this.updateModalTotal();
            });
        }

        document.querySelectorAll('input[name="sauce"], input[name="fries"], input[name="extras"]').forEach(input => {
            input.addEventListener('change', () => this.updateModalTotal());
        });

        const deliveryTypeInputs = document.querySelectorAll('input[name="deliveryType"]');
        deliveryTypeInputs.forEach(input => {
            input.addEventListener('change', () => this.updateCartSummary());
        });

        this.setupScrollSpy();

        if (mobileCartBtn) {
            console.log('Mobile cart button found, adding event listener');
            
            const newMobileCartBtn = mobileCartBtn.cloneNode(true);
            mobileCartBtn.parentNode.replaceChild(newMobileCartBtn, mobileCartBtn);
            
            newMobileCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Mobile cart button clicked!');
                this.toggleCart();
            });
            
            console.log('Mobile cart button listener attached successfully');
        } else {
            console.log('Mobile cart button not found in DOM');
        }      

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeCart();
            }
        });
    }

    setupCartItemEventListeners() {
        document.querySelectorAll('.cart-item').forEach(cartItemElement => {
            const cartId = cartItemElement.dataset.cartId;
            
            const decreaseBtn = cartItemElement.querySelector('.decrease-btn');
            const increaseBtn = cartItemElement.querySelector('.increase-btn');
            const removeBtn = cartItemElement.querySelector('.cart-remove-btn');
            
            if (decreaseBtn) {
                decreaseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.updateCartItemQuantity(cartId, -1);
                });
            }
            
            if (increaseBtn) {
                increaseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.updateCartItemQuantity(cartId, 1);
                });
            }
            
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFromCart(cartId);
                });
            }
        });
    }

    handleCategoryClick(e) {
        e.preventDefault();
        const category = e.target.closest('.category-nav-item').dataset.category;
        this.scrollToCategory(category);
    }

    setupScrollSpy() {
        const sections = document.querySelectorAll('.food-category');
        const navItems = document.querySelectorAll('.category-nav-item');

        if (sections.length === 0 || navItems.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const categorySlug = entry.target.dataset.category;
                    
                    navItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.dataset.category === categorySlug) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            const isOpen = cartSidebar.classList.contains('active');
            
            if (isOpen) {
                this.closeCart();
            } else {
                this.openCart();
            }
        }
    }

    openCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    updateCartItemQuantity(cartId, delta) {
        console.log('Updating cart item quantity:', { cartId, delta });
        
        const itemIndex = this.cart.findIndex(item => item.id === cartId);
        
        if (itemIndex === -1) {
            console.error('Cart item not found:', cartId);
            return;
        }

        this.cart[itemIndex].quantity += delta;

        if (this.cart[itemIndex].quantity <= 0) {
            this.cart.splice(itemIndex, 1);
            console.log('Item removed from cart (quantity reached 0)');
        } else {
            console.log('Updated item quantity:', this.cart[itemIndex].quantity);
        }

        this.saveCartToStorage();
        this.updateCartUI();
    }

    removeFromCart(cartId) {
        console.log('Removing item from cart:', cartId);
        
        const itemIndex = this.cart.findIndex(item => item.id === cartId);
        
        if (itemIndex === -1) {
            console.error('Cart item not found:', cartId);
            return;
        }

        this.cart.splice(itemIndex, 1);
        console.log('Item removed from cart');

        this.saveCartToStorage();
        this.updateCartUI();
        
        this.showNotification(this.t('notifications.removedFromCart'), 'info');
    }

    handleCheckout() {
        if (this.cart.length === 0) {
            alert(this.t('validation.cartEmpty'));
            return;
        }

        const subtotal = this.calculateSubtotal();
        const minimumOrderAmount = 12.00;

        if (subtotal < minimumOrderAmount) {
            alert(this.t('validation.minimumOrder', { amount: minimumOrderAmount.toFixed(2) }));
            return;
        }

        this.saveCartToStorage();
        
        window.location.href = 'checkout.html';
    }

    saveCartToStorage() {
        try {
            localStorage.setItem('palaceCafeCart', JSON.stringify(this.cart));
            console.log('Cart saved to localStorage');
        } catch (error) {
            console.error('Failed to save cart to localStorage:', error);
        }
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('palaceCafeCart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
                console.log('Cart loaded from localStorage:', this.cart.length, 'items');
            }
        } catch (error) {
            console.error('Failed to load cart from localStorage:', error);
            this.cart = [];
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartUI();
        this.showNotification(this.t('notifications.cartCleared'), 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let orderSystem;
let palaceCafeWebsite;

document.addEventListener('DOMContentLoaded', () => {
    const isOrderPage = document.getElementById('orderMain') !== null;
    
    if (isOrderPage) {
        orderSystem = new OrderSystem();
        window.orderSystem = orderSystem;
    } else {
        palaceCafeWebsite = new PalaceCafeWebsite();
    }
});