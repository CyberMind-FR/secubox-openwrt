'use strict';
'require baseclass';
'require secubox-theme/theme as Theme';

/**
 * SecuBox Main Navigation Widget
 *
 * Unified navigation component that handles:
 * - Theme initialization (auto-calls Theme.init())
 * - CSS loading (idempotent)
 * - Main SecuBox tabs (dashboard, modules, settings, etc.)
 * - Compact variant for nested modules (CDN Cache, Network Modes, etc.)
 *
 * Usage:
 *   // Main SecuBox views - just call renderTabs(), no need to require Theme separately
 *   SecuNav.renderTabs('dashboard')
 *
 *   // Nested module views - use renderCompactTabs() with custom tab definitions
 *   SecuNav.renderCompactTabs('overview', [
 *     { id: 'overview', icon: '📦', label: 'Overview', path: ['admin', 'services', 'cdn-cache', 'overview'] },
 *     { id: 'cache', icon: '💾', label: 'Cache', path: ['admin', 'services', 'cdn-cache', 'cache'] }
 *   ])
 */

// Immediately inject CSS to hide LuCI tabs before page renders
(function() {
	if (typeof document === 'undefined') return;
	if (document.getElementById('secubox-early-hide')) return;
	var style = document.createElement('style');
	style.id = 'secubox-early-hide';
	style.textContent = 'body[data-page^="admin-secubox"] ul.tabs:not(.sb-nav-tabs), body[data-page^="admin-secubox"] .tabs:not(.sb-nav-tabs) { display: none !important; }';
	(document.head || document.documentElement).appendChild(style);
})();

var mainTabs = [
	{ id: 'dashboard', icon: '📊', label: _('Dashboard'), path: ['admin', 'secubox', 'dashboard'] },
	{ id: 'wizard', icon: '✨', label: _('Wizard'), path: ['admin', 'secubox', 'wizard'] },
	{ id: 'modules', icon: '🧩', label: _('Modules'), path: ['admin', 'secubox', 'modules'] },
	{ id: 'apps', icon: '🛒', label: _('App Store'), path: ['admin', 'secubox', 'apps'] },
	{ id: 'monitoring', icon: '📡', label: _('Monitoring'), path: ['admin', 'secubox', 'monitoring'] },
	{ id: 'alerts', icon: '⚠️', label: _('Alerts'), path: ['admin', 'secubox', 'alerts'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'settings'] },
	{ id: 'help', icon: '🎁', label: _('Bonus'), path: ['admin', 'secubox', 'help'] }
];

// Track initialization state
var _themeInitialized = false;
var _cssLoaded = false;

return baseclass.extend({
	/**
	 * Get main SecuBox tabs
	 * @returns {Array} Copy of main tabs array
	 */
	getTabs: function() {
		return mainTabs.slice();
	},

	/**
	 * Initialize theme and load CSS (idempotent)
	 * Called automatically by renderTabs/renderCompactTabs
	 */
	ensureThemeReady: function() {
		if (_themeInitialized) return;

		// Detect language
		var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
			(document.documentElement && document.documentElement.getAttribute('lang')) ||
			(navigator.language ? navigator.language.split('-')[0] : 'en');

		// Initialize theme
		Theme.init({ language: lang });
		_themeInitialized = true;
	},

	/**
	 * Load SecuBox CSS files (idempotent)
	 */
	ensureCSSLoaded: function() {
		if (_cssLoaded) return;
		if (typeof document === 'undefined') return;

		var cssFiles = [
			'secubox-theme/secubox-theme.css',
			'secubox-theme/themes/cyberpunk.css',
			'secubox-theme/core/variables.css',
			'secubox/common.css'
		];

		cssFiles.forEach(function(file) {
			var id = 'secubox-css-' + file.replace(/[\/\.]/g, '-');
			if (document.getElementById(id)) return;

			var link = document.createElement('link');
			link.id = id;
			link.rel = 'stylesheet';
			link.type = 'text/css';
			link.href = L.resource(file);
			document.head.appendChild(link);
		});

		_cssLoaded = true;
	},

	/**
	 * Hide default LuCI tabs
	 */
	ensureLuCITabsHidden: function() {
		if (typeof document === 'undefined')
			return;

		// Actively remove LuCI tabs from DOM
		var luciTabs = document.querySelectorAll('.cbi-tabmenu, ul.tabs, div.tabs, .nav-tabs');
		luciTabs.forEach(function(el) {
			// Don't remove our own tabs
			if (!el.classList.contains('sb-nav-tabs') && !el.classList.contains('sh-nav-tabs')) {
				el.style.display = 'none';
				// Also try removing from DOM after a brief delay
				setTimeout(function() {
					if (el.parentNode && !el.classList.contains('sb-nav-tabs') && !el.classList.contains('sh-nav-tabs')) {
						el.style.display = 'none';
					}
				}, 100);
			}
		});

		if (document.getElementById('secubox-tabstyle'))
			return;
		var style = document.createElement('style');
		style.id = 'secubox-tabstyle';
		style.textContent = `
/* Hide default LuCI tabs for SecuBox - aggressive selectors */
/* Target any ul.tabs in the page */
ul.tabs {
	display: none !important;
}

/* Be more specific for pages that need tabs elsewhere */
body:not([data-page^="admin-secubox"]):not([data-page*="cdn-cache"]):not([data-page*="network-modes"]) ul.tabs {
	display: block !important;
}

/* All possible LuCI tab selectors */
body[data-page^="admin-secubox-dashboard"] .tabs,
body[data-page^="admin-secubox-modules"] .tabs,
body[data-page^="admin-secubox-wizard"] .tabs,
body[data-page^="admin-secubox-apps"] .tabs,
body[data-page^="admin-secubox-monitoring"] .tabs,
body[data-page^="admin-secubox-alerts"] .tabs,
body[data-page^="admin-secubox-settings"] .tabs,
body[data-page^="admin-secubox-help"] .tabs,
body[data-page^="admin-secubox"] #tabmenu,
body[data-page^="admin-secubox"] .cbi-tabmenu,
body[data-page^="admin-secubox"] .nav-tabs,
body[data-page^="admin-secubox"] ul.cbi-tabmenu,
body[data-page^="admin-secubox"] ul.tabs,
/* Fallback: hide any tabs that appear before our custom nav */
.secubox-dashboard .tabs,
.secubox-dashboard + .tabs,
.secubox-dashboard ~ .tabs,
.cbi-map > .tabs:first-child,
#maincontent > .container > .tabs,
#maincontent > .container > ul.tabs,
#view > .tabs,
#view > ul.tabs,
.view > .tabs,
.view > ul.tabs,
div.tabs:has(+ .secubox-dashboard),
/* Direct sibling of SecuBox content */
.sb-nav-tabs ~ .tabs,
.sh-nav-tabs ~ .tabs,
/* LuCI 24.x specific */
.luci-app-secubox .tabs,
#cbi-secubox .tabs {
	display: none !important;
}

/* Hide tabs container when our nav is present */
.sb-nav-tabs ~ ul.tabs,
.sb-nav-tabs + ul.tabs,
.sh-nav-tabs ~ ul.tabs,
.sh-nav-tabs + ul.tabs {
	display: none !important;
}

/* ==================== Main SecuBox Nav Tabs ==================== */
.sb-nav-tabs {
	display: flex;
	gap: 4px;
	margin-bottom: 24px;
	padding: 6px;
	background: var(--sb-bg-secondary, var(--cyber-bg-secondary, #151932));
	border-radius: var(--sb-radius-lg, 12px);
	border: 1px solid var(--sb-border, var(--cyber-border-color, #2d2d5a));
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.sb-nav-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: var(--sb-radius, 8px);
	background: transparent;
	border: none;
	color: var(--sb-text-secondary, var(--cyber-text-secondary, #94a3b8));
	font-weight: 500;
	font-size: 13px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.2s ease;
	white-space: nowrap;
}

.sb-nav-tab:hover {
	color: var(--sb-text-primary, var(--cyber-text-primary, #e2e8f0));
	background: var(--sb-bg-tertiary, var(--cyber-bg-tertiary, #1e2139));
}

.sb-nav-tab.active {
	color: var(--sb-accent, var(--cyber-accent-primary, #667eea));
	background: var(--sb-bg-tertiary, var(--cyber-bg-tertiary, #1e2139));
	box-shadow: inset 0 -2px 0 var(--sb-accent, var(--cyber-accent-primary, #667eea));
}

.sb-tab-icon {
	font-size: 16px;
	line-height: 1;
}

.sb-tab-label {
	font-family: var(--sb-font-sans, system-ui, -apple-system, sans-serif);
}

/* ==================== Compact Nav Tabs (for nested modules) ==================== */
.sh-nav-tabs {
	display: flex;
	gap: 2px;
	margin-bottom: 16px;
	padding: 4px;
	background: var(--sb-bg-secondary, var(--cyber-bg-secondary, #151932));
	border-radius: var(--sb-radius, 8px);
	border: 1px solid var(--sb-border, var(--cyber-border-color, #2d2d5a));
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.sh-nav-tab {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	border-radius: 6px;
	background: transparent;
	border: none;
	color: var(--sb-text-secondary, var(--cyber-text-secondary, #94a3b8));
	font-weight: 500;
	font-size: 12px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.15s ease;
	white-space: nowrap;
}

.sh-nav-tab:hover {
	color: var(--sb-text-primary, var(--cyber-text-primary, #e2e8f0));
	background: var(--sb-bg-tertiary, var(--cyber-bg-tertiary, #1e2139));
}

.sh-nav-tab.active {
	color: #fff;
	background: var(--sb-accent, var(--cyber-accent-primary, #667eea));
}

.sh-tab-icon {
	font-size: 14px;
	line-height: 1;
}

.sh-tab-label {
	font-family: var(--sb-font-sans, system-ui, -apple-system, sans-serif);
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
	.sb-nav-tabs {
		padding: 4px;
	}
	.sb-nav-tab {
		padding: 8px 12px;
		font-size: 12px;
	}
	.sb-tab-label {
		display: none;
	}
	.sb-tab-icon {
		font-size: 18px;
	}

	.sh-nav-tabs {
		padding: 3px;
	}
	.sh-nav-tab {
		padding: 6px 10px;
		font-size: 11px;
	}
	.sh-tab-label {
		display: none;
	}
	.sh-tab-icon {
		font-size: 16px;
	}
}
		`;
		document.head && document.head.appendChild(style);
	},

	/**
	 * Render main SecuBox navigation tabs
	 * Automatically initializes theme and loads CSS
	 *
	 * @param {String} active - ID of the active tab
	 * @returns {HTMLElement} Navigation element
	 */
	renderTabs: function(active) {
		this.ensureThemeReady();
		this.ensureCSSLoaded();
		this.ensureLuCITabsHidden();

		return E('div', { 'class': 'sb-nav-tabs' },
			this.getTabs().map(function(tab) {
				return E('a', {
					'class': 'sb-nav-tab' + (tab.id === active ? ' active' : ''),
					'href': L.url.apply(L, tab.path)
				}, [
					E('span', { 'class': 'sb-tab-icon' }, tab.icon),
					E('span', { 'class': 'sb-tab-label' }, tab.label)
				]);
			})
		);
	},

	/**
	 * Render compact navigation tabs for nested modules
	 * Use this for sub-module navigation (CDN Cache, Network Modes, etc.)
	 *
	 * @param {String} active - ID of the active tab
	 * @param {Array} tabs - Array of tab objects: { id, icon, label, path }
	 * @param {Object} options - Optional configuration
	 * @param {String} options.className - Additional CSS class for the container
	 * @returns {HTMLElement} Navigation element
	 */
	renderCompactTabs: function(active, tabs, options) {
		var opts = options || {};

		this.ensureThemeReady();
		this.ensureCSSLoaded();
		this.ensureLuCITabsHidden();

		var className = 'sh-nav-tabs';
		if (opts.className) {
			className += ' ' + opts.className;
		}

		return E('div', { 'class': className },
			(tabs || []).map(function(tab) {
				return E('a', {
					'class': 'sh-nav-tab' + (tab.id === active ? ' active' : ''),
					'href': Array.isArray(tab.path) ? L.url.apply(L, tab.path) : tab.path
				}, [
					E('span', { 'class': 'sh-tab-icon' }, tab.icon || ''),
					E('span', { 'class': 'sh-tab-label' }, tab.label || tab.id)
				]);
			})
		);
	},

	/**
	 * Create a breadcrumb-style navigation back to SecuBox
	 * Useful for deeply nested module views
	 *
	 * @param {String} moduleName - Display name of the current module
	 * @param {String} moduleIcon - Emoji icon for the module
	 * @returns {HTMLElement} Breadcrumb element
	 */
	renderBreadcrumb: function(moduleName, moduleIcon) {
		this.ensureThemeReady();
		this.ensureCSSLoaded();

		return E('div', {
			'class': 'sh-breadcrumb',
			'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 13px; color: var(--sb-text-secondary, #94a3b8);'
		}, [
			E('a', {
				'href': L.url('admin', 'secubox', 'dashboard'),
				'style': 'color: var(--sb-accent, #667eea); text-decoration: none;'
			}, '📊 SecuBox'),
			E('span', { 'style': 'opacity: 0.5;' }, '›'),
			E('span', {}, [
				moduleIcon ? E('span', { 'style': 'margin-right: 4px;' }, moduleIcon) : null,
				moduleName
			])
		]);
	}
});
