'use strict';
'require baseclass';

/**
 * SecuBox Shared Header
 * Provides consistent navigation across all SecuBox pages
 * Include this in any SecuBox view to show the unified header
 */

// CSS to inject for hiding LuCI elements and styling the header
var headerCSS = `
/* Hide OpenWrt/LuCI header and sidebar in SecuBox mode - AGGRESSIVE */
body.secubox-mode header:not(.sb-global-header),
body.secubox-mode .main-header,
body.secubox-mode #mainmenu,
body.secubox-mode .main-left,
body.secubox-mode .main > .main-left,
body.secubox-mode nav[role="navigation"],
body.secubox-mode #navigation,
body.secubox-mode .luci-sidebar,
body.secubox-mode aside,
body.secubox-mode .container > header,
body.secubox-mode #header,
body.secubox-mode .brand,
body.secubox-mode header.brand,
body.secubox-mode .header-brand,
body.secubox-mode > header:first-child,
header:has(+ .secubox-page-wrapper),
header:has(~ .secubox-page-wrapper),
.main > header,
body > header:not(.sb-global-header),
#maincontent > header,
.container > header:first-child {
	display: none !important;
}

/* Force hide the blue OpenWrt header specifically - target cyan/blue background */
header[style*="background"],
.brand[style*="background"],
header.brand,
div.brand,
body.secubox-mode .showSide,
body.secubox-mode .darkMask,
body.secubox-mode .main > header:first-of-type,
body.secubox-mode .main header:first-child,
.main > header:not(.sb-global-header),
header[class]:not(.sb-global-header):not([class*="sb-"]) {
	display: none !important;
}

/* Hide OpenWrt header that uses background-color */
body.secubox-mode header:first-of-type:not(.sb-global-header) {
	display: none !important;
	visibility: hidden !important;
	height: 0 !important;
	overflow: hidden !important;
}

/* Make main content full width */
body.secubox-mode .main > .main-right,
body.secubox-mode #maincontent,
body.secubox-mode .main-right,
body.secubox-mode main[role="main"],
body.secubox-mode .container {
	margin-left: 0 !important;
	padding-left: 0 !important;
	width: 100% !important;
	max-width: 100% !important;
}

/* Hide breadcrumbs */
body.secubox-mode .cbi-breadcrumb,
body.secubox-mode ol.breadcrumb,
body.secubox-mode .breadcrumb {
	display: none !important;
}

/* Hide LuCI view tabs / submenu tabs */
body.secubox-mode .cbi-tabmenu,
body.secubox-mode ul.tabs,
body.secubox-mode .tabs,
body.secubox-mode ul.cbi-tabmenu,
body.secubox-mode .view-tabs,
body.secubox-mode #viewtabs,
body.secubox-mode .cbi-section-node > ul:first-child,
.cbi-tabmenu:has(~ .secubox-page-wrapper),
ul.tabs:has(~ .secubox-page-wrapper),
#maincontent > ul.tabs,
#maincontent > .cbi-tabmenu,
.container > ul.tabs,
.main-right > ul.tabs:first-child,
.main-right > .cbi-tabmenu:first-child {
	display: none !important;
}

/* SecuBox Header Styles */
.sb-global-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 1.5rem;
	height: 56px;
	background: linear-gradient(180deg, #1a1a24 0%, #141419 100%);
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	position: sticky;
	top: 0;
	z-index: 1000;
	margin: -20px -20px 20px -20px;
	width: calc(100% + 40px);
}

.sb-header-brand {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.sb-header-logo {
	width: 32px;
	height: 32px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 1rem;
	color: white;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.sb-header-title {
	font-size: 1.125rem;
	font-weight: 600;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.sb-header-version {
	font-size: 0.7rem;
	color: #71717a;
	margin-left: 0.5rem;
}

.sb-header-nav {
	display: flex;
	gap: 0.25rem;
}

.sb-header-nav-item {
	padding: 0.5rem 0.875rem;
	font-size: 0.8125rem;
	font-weight: 500;
	color: #a1a1aa;
	background: transparent;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	text-decoration: none;
}

.sb-header-nav-item:hover {
	color: #e4e4e7;
	background: rgba(255, 255, 255, 0.05);
}

.sb-header-nav-item.active {
	color: white;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.sb-header-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.sb-header-switcher {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 3px;
}

.sb-header-switch-btn {
	padding: 0.375rem 0.75rem;
	font-size: 0.75rem;
	font-weight: 500;
	color: #a1a1aa;
	background: transparent;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.2s ease;
}

.sb-header-switch-btn:hover {
	color: #e4e4e7;
	background: rgba(255, 255, 255, 0.08);
}

.sb-header-switch-btn.active {
	color: white;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

@media (max-width: 900px) {
	.sb-global-header {
		flex-wrap: wrap;
		height: auto;
		padding: 0.5rem 1rem;
		gap: 0.5rem;
	}
	.sb-header-nav {
		order: 3;
		width: 100%;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}
	.sb-header-nav-item {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		white-space: nowrap;
	}
}
`;

var sections = [
	{ id: 'portal', name: 'Portal', icon: '\ud83c\udfe0', path: 'admin/secubox/portal' },
	{ id: 'hub', name: 'Hub', icon: '\ud83d\ude80', path: 'admin/secubox/dashboard' },
	{ id: 'admin', name: 'Admin', icon: '\ud83c\udfdb\ufe0f', path: 'admin/secubox/admin/dashboard' },
	{ id: 'security', name: 'Security', icon: '\ud83d\udee1\ufe0f', path: 'admin/secubox/security' },
	{ id: 'network', name: 'Network', icon: '\ud83c\udf10', path: 'admin/secubox/network' },
	{ id: 'monitoring', name: 'Monitoring', icon: '\ud83d\udcca', path: 'admin/secubox/monitoring' },
	{ id: 'system', name: 'System', icon: '\u2699\ufe0f', path: 'admin/secubox/system' }
];

function injectCSS() {
	if (document.getElementById('sb-header-styles')) return;
	var style = document.createElement('style');
	style.id = 'sb-header-styles';
	style.textContent = headerCSS;
	document.head.appendChild(style);
}

function hideOpenWrtUI() {
	document.body.classList.add('secubox-mode');

	// Direct element hiding for immediate effect - hide ALL headers, nav, and tabs
	var selectors = [
		'header', '.main-header', '#mainmenu', '.main-left',
		'nav[role="navigation"]', '#navigation', '.luci-sidebar', 'aside', '#header',
		'.brand', 'header.brand', 'div.brand', '.header-brand',
		'.cbi-tabmenu', 'ul.tabs', '.tabs', '#viewtabs', '.view-tabs',
		'.showSide', '.darkMask'
	];
	selectors.forEach(function(sel) {
		document.querySelectorAll(sel).forEach(function(el) {
			// Don't hide our SecuBox header
			if (!el.classList.contains('sb-global-header') && !el.closest('.sb-global-header')) {
				el.style.display = 'none';
				el.style.visibility = 'hidden';
				el.style.height = '0';
				el.style.overflow = 'hidden';
			}
		});
	});

	// Specifically hide ALL headers that are not SecuBox header
	document.querySelectorAll('header').forEach(function(el) {
		if (!el.classList.contains('sb-global-header') && !el.closest('.sb-global-header') && !el.closest('.secubox-page-wrapper')) {
			el.style.display = 'none';
			el.style.visibility = 'hidden';
			el.style.height = '0';
			el.style.overflow = 'hidden';
		}
	});

	// Specifically hide the first header in document (usually OpenWrt header)
	var firstHeader = document.querySelector('body > header, #maincontent > header, .container > header, .main > header');
	if (firstHeader && !firstHeader.classList.contains('sb-global-header')) {
		firstHeader.style.display = 'none';
		firstHeader.style.visibility = 'hidden';
		firstHeader.style.height = '0';
	}

	// Hide any element with cyan/blue background (OpenWrt header color)
	var allHeaders = document.querySelectorAll('header, .brand, div[class*="header"]');
	allHeaders.forEach(function(el) {
		if (el.classList.contains('sb-global-header') || el.closest('.sb-global-header')) return;
		var style = window.getComputedStyle(el);
		var bg = style.backgroundColor || '';
		// Cyan/blue colors used by OpenWrt
		if (bg.indexOf('rgb(0,') === 0 || bg.indexOf('rgb(0 ') === 0 || bg.indexOf('#0') === 0 || bg.indexOf('cyan') !== -1) {
			el.style.display = 'none';
			el.style.visibility = 'hidden';
			el.style.height = '0';
		}
	});

	// Expand main content
	var main = document.querySelector('.main-right') || document.querySelector('#maincontent') || document.querySelector('.container');
	if (main) {
		main.style.marginLeft = '0';
		main.style.width = '100%';
		main.style.maxWidth = '100%';
		main.style.paddingLeft = '0';
	}
}

function detectActiveSection() {
	var path = window.location.pathname;
	// Admin Control Panel
	if (path.indexOf('/secubox/admin/') !== -1) return 'admin';
	// Security section
	if (path.indexOf('/secubox/security') !== -1) return 'security';
	if (path.indexOf('/secubox/crowdsec') !== -1) return 'security';
	if (path.indexOf('/secubox/auth-guardian') !== -1) return 'security';
	if (path.indexOf('/secubox/client-guardian') !== -1) return 'security';
	// Network section
	if (path.indexOf('/secubox/network') !== -1) return 'network';
	if (path.indexOf('/secubox/bandwidth') !== -1) return 'network';
	if (path.indexOf('/secubox/wireguard') !== -1) return 'network';
	if (path.indexOf('/secubox/traffic') !== -1) return 'network';
	// Monitoring section
	if (path.indexOf('/secubox/monitoring') !== -1) return 'monitoring';
	if (path.indexOf('/secubox/ndpid') !== -1) return 'monitoring';
	if (path.indexOf('/secubox/netifyd') !== -1) return 'monitoring';
	if (path.indexOf('/secubox/netdata') !== -1) return 'monitoring';
	if (path.indexOf('/secubox/mediaflow') !== -1) return 'monitoring';
	// System section
	if (path.indexOf('/secubox/system') !== -1) return 'system';
	if (path.indexOf('/secubox/system-hub') !== -1) return 'system';
	// Hub (main SecuBox app)
	if (path.indexOf('/secubox/dashboard') !== -1) return 'hub';
	if (path.indexOf('/secubox/modules') !== -1) return 'hub';
	if (path.indexOf('/secubox/wizard') !== -1) return 'hub';
	if (path.indexOf('/secubox/alerts') !== -1) return 'hub';
	if (path.indexOf('/secubox/apps') !== -1) return 'hub';
	if (path.indexOf('/secubox/help') !== -1) return 'hub';
	if (path.indexOf('/secubox/settings') !== -1) return 'hub';
	// Portal (default)
	if (path.indexOf('/secubox/portal') !== -1) return 'portal';
	return 'portal';
}

return baseclass.extend({
	/**
	 * Initialize SecuBox mode - call this in your view's render()
	 */
	init: function() {
		injectCSS();
		hideOpenWrtUI();
	},

	/**
	 * Render the SecuBox header bar
	 * @returns {Element} The header DOM element
	 */
	render: function() {
		injectCSS();
		hideOpenWrtUI();

		var activeSection = detectActiveSection();

		return E('div', { 'class': 'sb-global-header' }, [
			// Brand
			E('div', { 'class': 'sb-header-brand' }, [
				E('div', { 'class': 'sb-header-logo' }, 'S'),
				E('span', { 'class': 'sb-header-title' }, 'SecuBox'),
				E('span', { 'class': 'sb-header-version' }, 'v0.14.0')
			]),
			// Navigation
			E('nav', { 'class': 'sb-header-nav' },
				sections.map(function(section) {
					return E('a', {
						'class': 'sb-header-nav-item' + (section.id === activeSection ? ' active' : ''),
						'href': L.url(section.path)
					}, [
						E('span', {}, section.icon),
						section.name
					]);
				})
			),
			// UI Switcher
			E('div', { 'class': 'sb-header-actions' }, [
				E('div', { 'class': 'sb-header-switcher' }, [
					E('a', {
						'class': 'sb-header-switch-btn active',
						'href': L.url('admin/secubox/portal'),
						'title': 'SecuBox Interface'
					}, 'SecuBox'),
					E('a', {
						'class': 'sb-header-switch-btn',
						'href': L.url('admin/status/overview'),
						'title': 'Standard LuCI'
					}, 'LuCI')
				])
			])
		]);
	}
});
