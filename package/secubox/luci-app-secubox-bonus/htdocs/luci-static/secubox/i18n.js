/**
 * SecuBox Multi-Language System
 * Supports automatic detection and manual language selection
 */

const I18N = {
    // Supported languages
    languages: {
        'fr': { name: 'Français', flag: '🇫🇷', rtl: false },
        'en': { name: 'English', flag: '🇬🇧', rtl: false },
        'de': { name: 'Deutsch', flag: '🇩🇪', rtl: false },
        'es': { name: 'Español', flag: '🇪🇸', rtl: false },
        'it': { name: 'Italiano', flag: '🇮🇹', rtl: false },
        'pt': { name: 'Português', flag: '🇵🇹', rtl: false },
        'nl': { name: 'Nederlands', flag: '🇳🇱', rtl: false },
        'zh': { name: '中文', flag: '🇨🇳', rtl: false },
        'ja': { name: '日本語', flag: '🇯🇵', rtl: false },
        'ar': { name: 'العربية', flag: '🇸🇦', rtl: true },
        'ru': { name: 'Русский', flag: '🇷🇺', rtl: false },
        'th': { name: 'ไทย', flag: '🇹🇭', rtl: false },
        'ko': { name: '한국어', flag: '🇰🇷', rtl: false },
        'hi': { name: 'हिन्दी', flag: '🇮🇳', rtl: false },
        'tr': { name: 'Türkçe', flag: '🇹🇷', rtl: false },
        'uk': { name: 'Українська', flag: '🇺🇦', rtl: false },
        'he': { name: 'עברית', flag: '🇮🇱', rtl: true }
    },

    currentLang: 'fr',
    translations: {},

    /**
     * Initialize i18n system
     */
    async init() {
        // Detect language from localStorage, browser, or default to French
        this.currentLang = this.detectLanguage();

        // Load translations
        await this.loadTranslations(this.currentLang);

        // Apply translations
        this.applyTranslations();

        // Apply RTL if needed
        this.applyRTL();

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;

        // Create language selector
        this.createLanguageSelector();

        // Setup language change listeners
        this.setupListeners();
    },

    /**
     * Detect user's preferred language
     */
    detectLanguage() {
        // Check localStorage
        const saved = localStorage.getItem('secubox-lang');
        if (saved && this.languages[saved]) {
            return saved;
        }

        // Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.languages[urlLang]) {
            return urlLang;
        }

        // Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();
        if (this.languages[langCode]) {
            return langCode;
        }

        // Default to French
        return 'fr';
    },

    /**
     * Load translation file for a language
     */
    async loadTranslations(lang) {
        try {
            const response = await fetch(`/i18n/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error(`Error loading translations for ${lang}:`, error);
            // Fallback to French if loading fails
            if (lang !== 'fr') {
                const response = await fetch('/i18n/fr.json');
                this.translations = await response.json();
            }
        }
    },

    /**
     * Get translation by key (supports array indices like "features[0]")
     */
    t(key, fallback = '') {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            // Check if key contains array index like "features[0]"
            const arrayMatch = k.match(/^(.+)\[(\d+)\]$/);

            if (arrayMatch) {
                // Extract array name and index
                const [, arrayName, index] = arrayMatch;

                // Access the array
                if (value && typeof value === 'object' && arrayName in value) {
                    value = value[arrayName];

                    // Access the array element
                    if (Array.isArray(value) && parseInt(index) < value.length) {
                        value = value[parseInt(index)];
                    } else {
                        return fallback || key;
                    }
                } else {
                    return fallback || key;
                }
            } else {
                // Normal object property access
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return fallback || key;
                }
            }
        }

        return value || fallback || key;
    },

    /**
     * Apply translations to DOM elements
     */
    applyTranslations() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate elements with data-i18n-html attribute (for HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const translation = this.t(key);
            element.innerHTML = translation;
        });

        // Translate meta tags
        this.updateMetaTags();
    },

    /**
     * Update meta tags for SEO
     */
    updateMetaTags() {
        const title = this.t('meta.title');
        const description = this.t('meta.description');
        const keywords = this.t('meta.keywords');

        if (title) document.title = title;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && description) metaDesc.content = description;

        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords && keywords) metaKeywords.content = keywords;

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && title) ogTitle.content = title;

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && description) ogDesc.content = description;
    },

    /**
     * Apply RTL styling if needed
     */
    applyRTL() {
        const isRTL = this.languages[this.currentLang]?.rtl || false;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.body.classList.toggle('rtl', isRTL);
    },

    /**
     * Create language selector UI
     */
    createLanguageSelector() {
        const nav = document.querySelector('nav .nav-container');
        if (!nav) return;

        // Remove existing selector if present
        const existing = document.getElementById('lang-selector');
        if (existing) existing.remove();

        const selector = document.createElement('div');
        selector.id = 'lang-selector';
        selector.className = 'lang-selector';
        selector.innerHTML = `
            <button class="lang-button" id="lang-button">
                <span class="lang-flag">${this.languages[this.currentLang].flag}</span>
                <span class="lang-name">${this.languages[this.currentLang].name}</span>
                <span class="lang-arrow">▼</span>
            </button>
            <div class="lang-dropdown" id="lang-dropdown">
                ${Object.entries(this.languages).map(([code, lang]) => `
                    <button class="lang-option ${code === this.currentLang ? 'active' : ''}" data-lang="${code}">
                        <span class="lang-flag">${lang.flag}</span>
                        <span class="lang-name">${lang.name}</span>
                    </button>
                `).join('')}
            </div>
        `;

        // Insert before nav-cta or at the end
        const navCta = nav.querySelector('.nav-cta');
        if (navCta) {
            navCta.parentNode.insertBefore(selector, navCta);
        } else {
            nav.appendChild(selector);
        }

        // Add styles
        this.addLanguageSelectorStyles();

        // Setup dropdown toggle
        this.setupDropdown();
    },

    /**
     * Add CSS styles for language selector
     */
    addLanguageSelectorStyles() {
        if (document.getElementById('lang-selector-styles')) return;

        const style = document.createElement('style');
        style.id = 'lang-selector-styles';
        style.textContent = `
            .lang-selector {
                position: relative;
                z-index: 1001;
            }

            .lang-button {
                display: flex;
                align-items: center;
                gap: 8px;
                background: var(--card, #1e293b);
                border: 1px solid var(--border, #334155);
                border-radius: 8px;
                padding: 8px 12px;
                color: var(--text, #f1f5f9);
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }

            .lang-button:hover {
                background: var(--card-hover, #334155);
                border-color: var(--primary, #6366f1);
            }

            .lang-flag {
                font-size: 18px;
                line-height: 1;
            }

            .lang-name {
                font-weight: 500;
            }

            .lang-arrow {
                font-size: 10px;
                transition: transform 0.2s;
            }

            .lang-selector.open .lang-arrow {
                transform: rotate(180deg);
            }

            .lang-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                background: var(--card, #1e293b);
                border: 1px solid var(--border, #334155);
                border-radius: 12px;
                padding: 8px;
                min-width: 200px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s;
            }

            .lang-selector.open .lang-dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .lang-option {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                padding: 10px 12px;
                color: var(--text, #f1f5f9);
                cursor: pointer;
                transition: background 0.2s;
                font-size: 14px;
                text-align: left;
            }

            .lang-option:hover {
                background: var(--card-hover, #334155);
            }

            .lang-option.active {
                background: var(--primary, #6366f1);
                color: white;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .lang-name {
                    display: none;
                }

                .lang-dropdown {
                    right: auto;
                    left: 0;
                }
            }

            /* RTL support */
            .rtl .lang-dropdown {
                right: auto;
                left: 0;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Setup dropdown toggle functionality
     */
    setupDropdown() {
        const button = document.getElementById('lang-button');
        const selector = document.getElementById('lang-selector');
        const dropdown = document.getElementById('lang-dropdown');

        if (!button || !selector || !dropdown) return;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                selector.classList.remove('open');
            }
        });

        // Handle language selection
        dropdown.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-lang');
                await this.changeLanguage(lang);
                selector.classList.remove('open');
            });
        });
    },

    /**
     * Change language
     */
    async changeLanguage(lang) {
        if (!this.languages[lang] || lang === this.currentLang) return;

        this.currentLang = lang;
        localStorage.setItem('secubox-lang', lang);

        // Reload translations
        await this.loadTranslations(lang);

        // Apply translations
        this.applyTranslations();

        // Apply RTL
        this.applyRTL();

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Recreate language selector with new active language
        this.createLanguageSelector();

        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    },

    /**
     * Setup event listeners
     */
    setupListeners() {
        // Listen for dynamic content updates
        window.addEventListener('contentUpdated', () => {
            this.applyTranslations();
        });
    }
};

// Auto-initialize when DOM is ready (unless manual init is requested)
if (!window.I18N_MANUAL_INIT) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => I18N.init());
    } else {
        I18N.init();
    }
}

// Export for use in other scripts
window.I18N = I18N;
