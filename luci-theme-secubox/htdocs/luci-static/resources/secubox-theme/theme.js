'use strict';
'require baseclass';

/**
 * SecuBox CyberMood Theme Controller
 * Provides Theme.init(), Theme.apply(), Theme.setLanguage(), Theme.t(), and UI helpers.
 */

return baseclass.extend({
	currentTheme: 'dark',
	currentLanguage: 'en',
	translations: {},
	availableThemes: ['dark', 'light', 'cyberpunk', 'ocean', 'sunset', 'forest', 'minimal', 'contrast'],

	init: function(options) {
		var opts = options || {};
		var lang = opts.language || this._detectLanguage();
		var theme = this._isValidTheme(opts.theme) ? opts.theme : this._detectPreferredTheme();

		this.apply(theme);
		return this.setLanguage(lang);
	},

	apply: function(theme) {
		if (!this._isValidTheme(theme))
			theme = this._detectPreferredTheme();

		this.currentTheme = theme || 'dark';

		if (document.documentElement)
			document.documentElement.setAttribute('data-secubox-theme', this.currentTheme);
		if (document.body)
			document.body.setAttribute('data-secubox-theme', this.currentTheme);
	},

	setPreferredTheme: function(theme) {
		if (!this._isValidTheme(theme))
			return;

		try {
			window.localStorage.setItem('secubox.theme', theme);
		} catch (err) { /* ignore private mode */ }

		this.apply(theme);
	},

	setLanguage: function(lang) {
		var self = this;
		this.currentLanguage = lang || 'en';

		if (self.translations[self.currentLanguage]) {
			return Promise.resolve(self.translations[self.currentLanguage]);
		}

		var url = L.resource('secubox-theme/i18n/' + this.currentLanguage + '.json');
		return fetch(url).then(function(res) {
			if (!res.ok)
				throw new Error('Unable to load translations for ' + self.currentLanguage);
			return res.json();
		}).then(function(dict) {
			self.translations[self.currentLanguage] = dict;
			return dict;
		}).catch(function(err) {
			console.error('Translation error:', err);
			self.translations[self.currentLanguage] = self.translations.en || {};
			return self.translations[self.currentLanguage];
		});
	},

	t: function(key, params) {
		params = params || {};
		var dict = this.translations[this.currentLanguage] ||
			this.translations.en || {};
		var str = dict[key] || key;
		Object.keys(params).forEach(function(k) {
			str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
		});
		return str;
	},

	createCard: function(options) {
		var opts = options || {};
		return E('div', { 'class': 'cyber-card' }, [
			opts.hideHeader ? null : E('div', { 'class': 'cyber-card-header' }, [
				E('div', { 'class': 'cyber-card-title' }, [
					opts.icon ? E('span', { 'style': 'margin-right: 0.35rem;' }, opts.icon) : null,
					opts.title || ''
				]),
				opts.badge || null
			]),
			E('div', { 'class': 'cyber-card-body' }, opts.content || [])
		]);
	},

	createButton: function(options) {
		var opts = options || {};
		var classes = ['cyber-btn'];
		if (opts.variant === 'secondary') classes.push('cyber-btn--secondary');
		if (opts.variant === 'danger') classes.push('cyber-btn--danger');
		if (opts.variant === 'ghost') classes.push('cyber-btn--ghost');

		return E('button', Object.assign({
			'class': classes.join(' ')
		}, opts.attrs || {}), [
			opts.icon ? E('span', {}, opts.icon) : null,
			opts.label || ''
		]);
	},

	createBadge: function(text, variant) {
		var classes = ['cyber-badge'];
		if (variant) classes.push('cyber-badge--' + variant);
		return E('span', { 'class': classes.join(' ') }, text);
	},

	createPage: function(options) {
		var opts = options || {};
		return E('div', { 'class': 'cyber-container' }, [
			opts.header || null,
			E('div', { 'class': 'cyber-stack' }, opts.cards || [])
		]);
	},

	/**
	 * Animate page transitions
	 * @param {HTMLElement} oldContent - Element being removed
	 * @param {HTMLElement} newContent - Element being added
	 * @param {Object} options - Animation options
	 */
	animatePageTransition: function(oldContent, newContent, options) {
		var opts = options || {};
		var duration = opts.duration || 400;
		var exitDuration = opts.exitDuration || 300;

		return new Promise(function(resolve) {
			// If no old content, just animate in new content
			if (!oldContent || !oldContent.parentNode) {
				if (newContent) {
					newContent.classList.add('cyber-page-transition-enter');
					setTimeout(function() {
						newContent.classList.remove('cyber-page-transition-enter');
						resolve();
					}, duration);
				} else {
					resolve();
				}
				return;
			}

			// Animate out old content
			oldContent.classList.add('cyber-page-transition-exit');

			setTimeout(function() {
				// Remove old content
				if (oldContent.parentNode) {
					oldContent.parentNode.removeChild(oldContent);
				}

				// Animate in new content
				if (newContent) {
					newContent.classList.add('cyber-page-transition-enter');
					setTimeout(function() {
						newContent.classList.remove('cyber-page-transition-enter');
						resolve();
					}, duration);
				} else {
					resolve();
				}
			}, exitDuration);
		});
	},

	/**
	 * Apply entrance animation to element
	 * @param {HTMLElement} element
	 * @param {String} animationType - Type of animation (fade, zoom, slide, bounce, etc.)
	 */
	animateEntrance: function(element, animationType) {
		if (!element) return;

		var animClass = 'cyber-animate-' + (animationType || 'fade-in');
		element.classList.add(animClass);

		// Remove animation class after completion to allow re-triggering
		element.addEventListener('animationend', function handler() {
			element.classList.remove(animClass);
			element.removeEventListener('animationend', handler);
		});
	},

	/**
	 * Apply micro-interaction to element
	 * @param {HTMLElement} element
	 * @param {String} interactionType - Type of interaction (shake, wobble, tada, etc.)
	 */
	applyMicroInteraction: function(element, interactionType) {
		if (!element) return;

		var animations = {
			shake: 'cyber-shake',
			wobble: 'cyber-wobble',
			tada: 'cyber-tada',
			jello: 'cyber-jello',
			swing: 'cyber-swing',
			flash: 'cyber-flash',
			heartbeat: 'cyber-heartbeat',
			rubberBand: 'cyber-rubber-band'
		};

		var animClass = animations[interactionType] || 'cyber-shake';
		element.style.animation = animClass + ' 0.5s ease-out';

		setTimeout(function() {
			element.style.animation = '';
		}, 500);
	},

	_detectLanguage: function() {
		if (typeof L !== 'undefined' && L.env && L.env.lang)
			return L.env.lang;
		if (document.documentElement && document.documentElement.getAttribute('lang'))
			return document.documentElement.getAttribute('lang');
		if (navigator.language)
			return navigator.language.split('-')[0];
		return this.currentLanguage;
	},

	_detectPreferredTheme: function() {
		var stored;

		try {
			stored = window.localStorage.getItem('secubox.theme');
		} catch (err) {
			stored = null;
		}

		if (this._isValidTheme(stored))
			return stored;

		if (typeof L !== 'undefined' && L.env && L.env.media_url_base) {
			var media = L.env.media_url_base || '';
			if (/(openwrt|dark|argon|opentwenty|opentop)/i.test(media))
				return 'dark';
			if (/bootstrap|material|simple|freifunk/i.test(media))
				return 'light';
		}

		var attr = (document.documentElement && document.documentElement.getAttribute('data-theme')) ||
			(document.body && document.body.getAttribute('data-theme'));
		if (attr) {
			if (/cyber/i.test(attr))
				return 'cyberpunk';
			if (/light/i.test(attr))
				return 'light';
			if (/dark|secubox/i.test(attr))
				return 'dark';
		}

		if (document.body && document.body.className) {
			if (/\bluci-theme-[a-z0-9]+/i.test(document.body.className)) {
				if (/\b(light|bootstrap|material)\b/i.test(document.body.className))
					return 'light';
				if (/\b(openwrt2020|argon|dark)\b/i.test(document.body.className))
					return 'dark';
			}
		}

		if (window.matchMedia) {
			try {
				if (window.matchMedia('(prefers-color-scheme: light)').matches)
					return 'light';
			} catch (err) { /* ignore */ }
		}

		return this.currentTheme;
	},

	_isValidTheme: function(theme) {
		return this.availableThemes.indexOf(theme) !== -1;
	}
});
