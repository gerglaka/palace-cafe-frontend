// js/i18n.js
class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = 'hu';
        this.defaultLang = 'hu';
        this.init();
    }

    async init() {
        // Load saved language or default to Hungarian
        const savedLang = localStorage.getItem('lang');
        this.currentLang = ['hu', 'sk', 'en'].includes(savedLang) ? savedLang : this.defaultLang;

        await this.loadTranslations(this.currentLang);
        this.applyTranslations();
        this.setupLanguageSwitcher();
        this.updateDocumentLang();
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`/translations/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
            this.translations[lang] = await response.json();
        } catch (error) {
            console.warn(`Could not load translations for ${lang}, falling back to default.`, error);
            if (lang !== this.defaultLang) {
                await this.loadTranslations(this.defaultLang);
            }
        }
    }

    t(key, fallback = '') {
        const keys = key.split('.');
        let value = this.translations[this.currentLang] || this.translations[this.defaultLang] || {};

        for (const k of keys) {
            value = value[k];
            if (value === undefined) break;
        }

        return value !== undefined ? value : (fallback || key);
    }

    applyTranslations() {
        // Translate all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key, el.textContent.trim());
            if (text) el.textContent = text;
        });

        // Translate attributes (alt, title, placeholder, aria-label)
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            el.setAttribute('alt', this.t(key, el.getAttribute('alt')));
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.setAttribute('title', this.t(key, el.getAttribute('title')));
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.setAttribute('placeholder', this.t(key, el.getAttribute('placeholder')));
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            el.setAttribute('aria-label', this.t(key, el.getAttribute('aria-label')));
        });
    }

    setupLanguageSwitcher() {
        document.querySelectorAll('[data-lang]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const lang = btn.getAttribute('data-lang');

                if (lang === this.currentLang) return;

                this.currentLang = lang;
                localStorage.setItem('lang', lang);

                // Update active flag
                document.querySelectorAll('[data-lang]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                await this.loadTranslations(lang);
                this.applyTranslations();
                this.updateDocumentLang();

                // Reload with lang param for backend
                const url = new URL(window.location);
                url.searchParams.set('lang', lang);
                window.history.replaceState({}, '', url);

                // Optional: reload to refresh API data
                // window.location.reload();
            });

            // Set active state on load
            if (btn.getAttribute('data-lang') === this.currentLang) {
                btn.classList.add('active');
            }
        });
    }

    updateDocumentLang() {
        document.documentElement.lang = this.currentLang;
    }
}

// Global function for JS dynamic strings
window.t = (key, fallback) => window.i18n?.t(key, fallback) || key;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});