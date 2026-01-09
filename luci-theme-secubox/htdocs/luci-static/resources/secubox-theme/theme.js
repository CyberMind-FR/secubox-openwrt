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
	 * Set the current app context for theming
	 * @param {String} appName - App identifier (crowdsec, bandwidth, guardian, media, network, system, etc.)
	 */
	setApp: function(appName) {
		if (document.body) {
			document.body.setAttribute('data-secubox-app', appName);
		}
		if (document.documentElement) {
			document.documentElement.setAttribute('data-secubox-app', appName);
		}
	},

	/**
	 * Create navigation tabs for SecuBox apps
	 * @param {Array} tabs - Array of tab objects with {id, label, icon, path}
	 * @param {String} activeId - Currently active tab ID
	 * @param {Object} options - Optional configuration
	 * @returns {HTMLElement}
	 */
	renderNavTabs: function(tabs, activeId, options) {
		var opts = options || {};
		var baseUrl = opts.baseUrl || '';
		var onTabClick = opts.onTabClick || null;

		var navTabs = E('div', {
			'class': 'sb-nav-tabs',
			'style': 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; padding: 0.5rem; background: var(--cyber-bg-secondary, #151932); border-radius: var(--cyber-radius-md, 12px);'
		});

		tabs.forEach(function(tab) {
			var isActive = tab.id === activeId;
			var tabEl = E('a', {
				'href': tab.path ? (baseUrl + tab.path) : '#',
				'class': 'sb-nav-tab' + (isActive ? ' active' : ''),
				'data-tab': tab.id,
				'style': [
					'display: inline-flex',
					'align-items: center',
					'gap: 0.5rem',
					'padding: 0.75rem 1.25rem',
					'text-decoration: none',
					'color: ' + (isActive ? '#fff' : 'var(--cyber-text-secondary, #94a3b8)'),
					'background: ' + (isActive ? 'var(--sb-accent-gradient, var(--cyber-gradient-primary))' : 'transparent'),
					'border-radius: var(--cyber-radius-sm, 8px)',
					'font-size: 0.9rem',
					'font-weight: ' + (isActive ? '600' : '500'),
					'transition: all 0.2s ease',
					'cursor: pointer',
					isActive ? 'box-shadow: 0 4px 12px var(--sb-accent-glow, rgba(102, 126, 234, 0.3))' : ''
				].join('; '),
				'click': onTabClick ? function(ev) {
					ev.preventDefault();
					onTabClick(tab.id, tab);
				} : null
			}, [
				tab.icon ? E('span', { 'class': 'sb-nav-icon' }, tab.icon) : null,
				E('span', { 'class': 'sb-nav-label' }, tab.label)
			]);

			// Add hover effect for non-active tabs
			if (!isActive) {
				tabEl.addEventListener('mouseenter', function() {
					this.style.background = 'var(--cyber-bg-tertiary, #1e2139)';
					this.style.color = 'var(--cyber-text-primary, #e2e8f0)';
				});
				tabEl.addEventListener('mouseleave', function() {
					this.style.background = 'transparent';
					this.style.color = 'var(--cyber-text-secondary, #94a3b8)';
				});
			}

			navTabs.appendChild(tabEl);
		});

		return navTabs;
	},

	/**
	 * Create a stat card component
	 * @param {Object} options - {value, label, icon, trend, color}
	 * @returns {HTMLElement}
	 */
	createStatCard: function(options) {
		var opts = options || {};
		var trendIcon = '';
		var trendColor = '';

		if (opts.trend) {
			if (opts.trend > 0) {
				trendIcon = String.fromCodePoint(0x2191); // ↑
				trendColor = 'var(--cyber-success, #10b981)';
			} else if (opts.trend < 0) {
				trendIcon = String.fromCodePoint(0x2193); // ↓
				trendColor = 'var(--cyber-danger, #ef4444)';
			}
		}

		return E('div', {
			'class': 'sb-stat-card',
			'style': [
				'background: var(--cyber-bg-secondary, #151932)',
				'border: var(--cyber-border)',
				'border-radius: var(--cyber-radius-md, 12px)',
				'padding: 1.25rem',
				'display: flex',
				'flex-direction: column',
				'gap: 0.5rem'
			].join('; ')
		}, [
			E('div', { 'style': 'display: flex; align-items: center; justify-content: space-between;' }, [
				opts.icon ? E('span', {
					'style': 'font-size: 1.5rem; opacity: 0.8;'
				}, opts.icon) : null,
				trendIcon ? E('span', {
					'style': 'font-size: 0.85rem; color: ' + trendColor
				}, trendIcon + ' ' + Math.abs(opts.trend) + '%') : null
			]),
			E('div', {
				'style': 'font-size: 2rem; font-weight: 700; color: ' + (opts.color || 'var(--sb-accent-primary, var(--cyber-accent-primary))') + ';'
			}, String(opts.value !== undefined ? opts.value : 0)),
			E('div', {
				'style': 'font-size: 0.85rem; color: var(--cyber-text-secondary, #94a3b8);'
			}, opts.label || '')
		]);
	},

	/**
	 * Create a mini chart (sparkline) using SVG
	 * @param {Array} data - Array of numeric values
	 * @param {Object} options - {width, height, color, fill}
	 * @returns {HTMLElement}
	 */
	createMiniChart: function(data, options) {
		var opts = options || {};
		var width = opts.width || 100;
		var height = opts.height || 30;
		var color = opts.color || 'var(--sb-accent-primary, #667eea)';
		var fill = opts.fill !== false;

		if (!data || data.length < 2) {
			return E('div', { 'style': 'width: ' + width + 'px; height: ' + height + 'px;' });
		}

		var max = Math.max.apply(null, data);
		var min = Math.min.apply(null, data);
		var range = max - min || 1;

		var points = data.map(function(val, i) {
			var x = (i / (data.length - 1)) * width;
			var y = height - ((val - min) / range) * height;
			return x + ',' + y;
		});

		var pathD = 'M ' + points.join(' L ');
		var fillPath = fill ? pathD + ' L ' + width + ',' + height + ' L 0,' + height + ' Z' : '';

		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
		svg.style.display = 'block';

		if (fill) {
			var fillEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			fillEl.setAttribute('d', fillPath);
			fillEl.setAttribute('fill', color);
			fillEl.setAttribute('fill-opacity', '0.2');
			svg.appendChild(fillEl);
		}

		var lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		lineEl.setAttribute('d', pathD);
		lineEl.setAttribute('stroke', color);
		lineEl.setAttribute('stroke-width', '2');
		lineEl.setAttribute('fill', 'none');
		svg.appendChild(lineEl);

		return svg;
	},

	/**
	 * Show a toast notification
	 * @param {String} message - Message to display
	 * @param {String} type - Type: success, error, warning, info
	 * @param {Number} duration - Duration in ms (default 4000)
	 */
	showToast: function(message, type, duration) {
		var colors = {
			success: 'var(--cyber-success, #10b981)',
			error: 'var(--cyber-danger, #ef4444)',
			warning: 'var(--cyber-warning, #f59e0b)',
			info: 'var(--cyber-info, #06b6d4)'
		};

		// Remove existing toast
		var existing = document.querySelector('.sb-toast');
		if (existing) existing.remove();

		var toast = E('div', {
			'class': 'sb-toast',
			'style': [
				'position: fixed',
				'bottom: 20px',
				'right: 20px',
				'padding: 1rem 1.5rem',
				'background: var(--cyber-bg-secondary, #151932)',
				'border-left: 4px solid ' + (colors[type] || colors.info),
				'border-radius: var(--cyber-radius-sm, 8px)',
				'color: var(--cyber-text-primary, #e2e8f0)',
				'font-size: 0.9rem',
				'box-shadow: var(--cyber-shadow)',
				'z-index: var(--cyber-z-toast, 1200)',
				'animation: cyber-slide-in-right 0.3s ease-out'
			].join('; ')
		}, message);

		document.body.appendChild(toast);

		setTimeout(function() {
			toast.style.animation = 'cyber-fade-out 0.3s ease-out forwards';
			setTimeout(function() { toast.remove(); }, 300);
		}, duration || 4000);
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
