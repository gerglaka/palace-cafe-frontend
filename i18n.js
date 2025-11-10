/**
 * Palace Cafe & Bar - Internationalization (i18n) System
 * Handles multi-language support for the entire website
 * 
 * Supported languages: Hungarian (hu), Slovak (sk), English (en)
 * Default language: Hungarian (hu)
 * 
 * @author Palace Development Team
 * @version 1.0.0
 */

'use strict';

// ============================================
// CONFIGURATION
// ============================================

const I18N_CONFIG = {
    defaultLanguage: 'hu',
    supportedLanguages: ['hu', 'sk', 'en'],
    translationsPath: '/translations/',
    storageKey: 'palace_language'
};

// ============================================
// GLOBAL STATE
// ============================================

let currentLanguage = I18N_CONFIG.defaultLanguage;
let translations = {};
let isInitialized = false;

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Initialize the i18n system
 * Loads translations and sets up language from localStorage or default
 */
async function initI18n() {
    console.log('🌍 Initializing i18n system...');
    
    try {
        // Get language from localStorage or use default
        const savedLanguage = localStorage.getItem(I18N_CONFIG.storageKey);
        currentLanguage = savedLanguage && I18N_CONFIG.supportedLanguages.includes(savedLanguage) 
            ? savedLanguage 
            : I18N_CONFIG.defaultLanguage;
        
        console.log(`📝 Current language: ${currentLanguage}`);
        
        // Load translations for current language
        await loadTranslations(currentLanguage);
        
        // Apply translations to the page
        translatePage();
        
        // Set up language switcher buttons
        setupLanguageSwitcher();
        
        // Mark active language flag
        updateActiveLanguageFlag();
        
        isInitialized = true;
        console.log('✅ i18n system initialized successfully');
        
        // Dispatch custom event for other scripts to know i18n is ready
        window.dispatchEvent(new CustomEvent('i18nReady', { 
            detail: { language: currentLanguage } 
        }));
        
    } catch (error) {
        console.error('❌ Failed to initialize i18n:', error);
        // Fallback to default language if initialization fails
        currentLanguage = I18N_CONFIG.defaultLanguage;
    }
}

/**
 * Load translation JSON file for specified language
 * @param {string} lang - Language code (hu, sk, en)
 */
async function loadTranslations(lang) {
    try {
        console.log(`📥 Loading translations for: ${lang}`);
        
        const response = await fetch(`${I18N_CONFIG.translationsPath}${lang}.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to load translations: ${response.status}`);
        }
        
        translations = await response.json();
        console.log(`✅ Translations loaded for ${lang}:`, Object.keys(translations).length, 'sections');
        
    } catch (error) {
        console.error(`❌ Error loading translations for ${lang}:`, error);
        throw error;
    }
}

/**
 * Get translation for a key with optional variable interpolation
 * @param {string} key - Translation key (e.g., 'menu.title' or 'validation.minLength')
 * @param {object} variables - Optional variables for interpolation (e.g., {amount: 10})
 * @returns {string} - Translated text or the key if not found
 * 
 * @example
 * t('menu.title') // Returns: "Menü" (if language is Hungarian)
 * t('validation.minLength', {min: 5}) // Returns: "Minimum 5 karakter szükséges"
 */
function t(key, variables = {}) {
    if (!key) {
        console.warn('⚠️ Translation key is empty');
        return '';
    }
    
    // Split key by dots to access nested properties (e.g., 'menu.title' -> ['menu', 'title'])
    const keys = key.split('.');
    let translation = translations;
    
    // Navigate through nested object
    for (const k of keys) {
        if (translation && typeof translation === 'object' && k in translation) {
            translation = translation[k];
        } else {
            console.warn(`⚠️ Translation not found for key: ${key}`);
            return key; // Return the key itself if translation not found
        }
    }
    
    // If translation is not a string, something went wrong
    if (typeof translation !== 'string') {
        console.warn(`⚠️ Translation for key "${key}" is not a string:`, translation);
        return key;
    }
    
    // Replace variables in translation (e.g., {{amount}} -> 10)
    let result = translation;
    for (const [varKey, varValue] of Object.entries(variables)) {
        const placeholder = `{{${varKey}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), varValue);
    }
    
    return result;
}

/**
 * Translate all elements on the page with data-i18n attribute
 * This handles static HTML content
 */
function translatePage() {
    console.log('🔄 Translating page...');
    
    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    
    console.log(`📝 Found ${elements.length} elements to translate`);
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translatedText = t(key);
        
        // Update element text content
        // Check if element has children that should be preserved
        if (element.children.length === 0) {
            element.textContent = translatedText;
        } else {
            // If element has children, only update text nodes
            updateTextNodes(element, translatedText);
        }
    });
    
    // Also translate placeholder attributes
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // Translate title attributes (tooltips)
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });
    
    console.log('✅ Page translation complete');
}

/**
 * Update text nodes of an element while preserving child elements
 * @param {HTMLElement} element - The element to update
 * @param {string} text - The new text
 */
function updateTextNodes(element, text) {
    // Find all text nodes
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue.trim()) {
            textNodes.push(node);
        }
    }
    
    // Update first non-empty text node
    if (textNodes.length > 0) {
        textNodes[0].nodeValue = text;
    }
}

/**
 * Change the current language and reload translations
 * @param {string} lang - Language code to switch to
 */
async function changeLanguage(lang) {
    if (!I18N_CONFIG.supportedLanguages.includes(lang)) {
        console.error(`❌ Unsupported language: ${lang}`);
        return;
    }
    
    if (lang === currentLanguage) {
        console.log(`ℹ️ Language is already set to ${lang}`);
        return;
    }
    
    console.log(`🔄 Changing language from ${currentLanguage} to ${lang}`);
    
    try {
        // Save language preference
        localStorage.setItem(I18N_CONFIG.storageKey, lang);
        currentLanguage = lang;
        
        // Load new translations
        await loadTranslations(lang);
        
        // Re-translate the page
        translatePage();
        
        // Update active flag styling
        updateActiveLanguageFlag();
        
        // Dispatch language change event for other scripts
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
        
        console.log(`✅ Language changed to ${lang}`);
        
        // Reload menu data with new language (if on menu/order page)
        if (window.orderSystem && typeof window.orderSystem.loadMenu === 'function') {
            console.log('🔄 Reloading menu with new language...');
            await window.orderSystem.loadMenu();
        }
        
    } catch (error) {
        console.error(`❌ Error changing language to ${lang}:`, error);
    }
}

/**
 * Set up event listeners for language switcher buttons
 * Assumes HTML has buttons with data-lang attribute
 */
function setupLanguageSwitcher() {
    const languageButtons = document.querySelectorAll('[data-lang]');
    
    console.log(`🎯 Setting up ${languageButtons.length} language switcher buttons`);
    
    languageButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const lang = button.getAttribute('data-lang');
            await changeLanguage(lang);
        });
    });
}

/**
 * Update active language flag styling
 * Adds 'active' class to current language button
 */
function updateActiveLanguageFlag() {
    const languageButtons = document.querySelectorAll('[data-lang]');
    
    languageButtons.forEach(button => {
        const lang = button.getAttribute('data-lang');
        if (lang === currentLanguage) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * Get current language code
 * @returns {string} - Current language code
 */
function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Check if i18n system is initialized
 * @returns {boolean}
 */
function isI18nReady() {
    return isInitialized;
}

// ============================================
// AUTO-INITIALIZE ON DOM READY
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    // DOM already loaded, initialize immediately
    initI18n();
}

// ============================================
// EXPORT FUNCTIONS (Available globally)
// ============================================

// Make functions available globally
window.i18n = {
    t,
    changeLanguage,
    getCurrentLanguage,
    isReady: isI18nReady,
    init: initI18n
};

// Also make 't' function available directly for convenience
window.t = t;

console.log('📦 i18n module loaded');