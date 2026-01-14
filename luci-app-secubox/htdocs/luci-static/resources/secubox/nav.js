'use strict';
'require baseclass';

/**
 * SecuBox Main Navigation
 * SecuBox themed navigation tabs
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

var tabs = [
	{ id: 'dashboard', icon: '📊', label: _('Dashboard'), path: ['admin', 'secubox', 'dashboard'] },
	{ id: 'wizard', icon: '✨', label: _('Wizard'), path: ['admin', 'secubox', 'wizard'] },
	{ id: 'modules', icon: '🧩', label: _('Modules'), path: ['admin', 'secubox', 'modules'] },
	{ id: 'apps', icon: '🛒', label: _('App Store'), path: ['admin', 'secubox', 'apps'] },
	{ id: 'monitoring', icon: '📡', label: _('Monitoring'), path: ['admin', 'secubox', 'monitoring'] },
	{ id: 'alerts', icon: '⚠️', label: _('Alerts'), path: ['admin', 'secubox', 'alerts'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'settings'] },
	{ id: 'help', icon: '🎁', label: _('Bonus'), path: ['admin', 'secubox', 'help'] }
];

return baseclass.extend({
	getTabs: function() {
		return tabs.slice();
	},

	ensureLuCITabsHidden: function() {
		if (typeof document === 'undefined')
			return;

		// Actively remove LuCI tabs from DOM
		var luciTabs = document.querySelectorAll('.cbi-tabmenu, ul.tabs, div.tabs, .nav-tabs');
		luciTabs.forEach(function(el) {
			// Don't remove our own tabs
			if (!el.classList.contains('sb-nav-tabs')) {
				el.style.display = 'none';
				// Also try removing from DOM after a brief delay
				setTimeout(function() {
					if (el.parentNode && !el.classList.contains('sb-nav-tabs')) {
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
body:not([data-page^="admin-secubox"]) ul.tabs {
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
/* LuCI 24.x specific */
.luci-app-secubox .tabs,
#cbi-secubox .tabs {
	display: none !important;
}

/* Hide tabs container when our nav is present */
.sb-nav-tabs ~ ul.tabs,
.sb-nav-tabs + ul.tabs {
	display: none !important;
}

/* SecuBox Nav Tabs */
.sb-nav-tabs {
	display: flex;
	gap: 4px;
	margin-bottom: 24px;
	padding: 6px;
	background: var(--sb-bg-secondary);
	border-radius: var(--sb-radius-lg);
	border: 1px solid var(--sb-border);
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.sb-nav-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: var(--sb-radius);
	background: transparent;
	border: none;
	color: var(--sb-text-secondary);
	font-weight: 500;
	font-size: 13px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.2s ease;
	white-space: nowrap;
}

.sb-nav-tab:hover {
	color: var(--sb-text-primary);
	background: var(--sb-bg-tertiary);
}

.sb-nav-tab.active {
	color: var(--sb-accent);
	background: var(--sb-bg-tertiary);
	box-shadow: inset 0 -2px 0 var(--sb-accent);
}

.sb-tab-icon {
	font-size: 16px;
	line-height: 1;
}

.sb-tab-label {
	font-family: var(--sb-font-sans);
}

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
}
		`;
		document.head && document.head.appendChild(style);
	},

	renderTabs: function(active) {
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
	}
});
