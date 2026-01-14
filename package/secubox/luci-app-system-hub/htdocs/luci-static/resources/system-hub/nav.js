'use strict';
'require baseclass';

/**
 * System Hub Navigation
 * SecuBox themed navigation tabs
 */

// Immediately inject CSS to hide LuCI tabs before page renders
(function() {
	if (typeof document === 'undefined') return;
	if (document.getElementById('system-hub-early-hide')) return;
	var style = document.createElement('style');
	style.id = 'system-hub-early-hide';
	style.textContent = 'body[data-page*="system-hub"] ul.tabs, body[data-page*="system-hub"] .tabs:not(.sh-nav-tabs) { display: none !important; }';
	(document.head || document.documentElement).appendChild(style);
})();

var tabs = [
	{ id: 'overview', icon: '📊', label: _('Overview'), path: ['admin', 'secubox', 'system', 'system-hub', 'overview'] },
	{ id: 'services', icon: '🧩', label: _('Services'), path: ['admin', 'secubox', 'system', 'system-hub', 'services'] },
	{ id: 'logs', icon: '📜', label: _('Logs'), path: ['admin', 'secubox', 'system', 'system-hub', 'logs'] },
	{ id: 'backup', icon: '💾', label: _('Backup'), path: ['admin', 'secubox', 'system', 'system-hub', 'backup'] },
	{ id: 'components', icon: '🧱', label: _('Components'), path: ['admin', 'secubox', 'system', 'system-hub', 'components'] },
	{ id: 'diagnostics', icon: '🧪', label: _('Diagnostics'), path: ['admin', 'secubox', 'system', 'system-hub', 'diagnostics'] },
	{ id: 'health', icon: '❤️', label: _('Health'), path: ['admin', 'secubox', 'system', 'system-hub', 'health'] },
	{ id: 'debug', icon: '🐛', label: _('Debug'), path: ['admin', 'secubox', 'system', 'system-hub', 'debug'] },
	{ id: 'remote', icon: '📡', label: _('Remote'), path: ['admin', 'secubox', 'system', 'system-hub', 'remote'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'system', 'system-hub', 'settings'] }
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
			if (!el.classList.contains('sh-nav-tabs')) {
				el.style.display = 'none';
				// Also try removing from DOM after a brief delay
				setTimeout(function() {
					if (el.parentNode && !el.classList.contains('sh-nav-tabs')) {
						el.style.display = 'none';
					}
				}, 100);
			}
		});

		if (document.getElementById('system-hub-tabstyle'))
			return;
		var style = document.createElement('style');
		style.id = 'system-hub-tabstyle';
		style.textContent = `
/* Hide default LuCI tabs for System Hub - aggressive selectors */
/* Target any ul.tabs in the page */
ul.tabs {
	display: none !important;
}

/* Be more specific for pages that need tabs elsewhere */
body:not([data-page*="system-hub"]) ul.tabs {
	display: block !important;
}

/* All possible LuCI tab selectors */
body[data-page^="admin-secubox-system-system-hub"] .tabs,
body[data-page^="admin-secubox-system-system-hub"] #tabmenu,
body[data-page^="admin-secubox-system-system-hub"] .cbi-tabmenu,
body[data-page^="admin-secubox-system-system-hub"] .nav-tabs,
body[data-page^="admin-secubox-system-system-hub"] ul.cbi-tabmenu,
body[data-page*="system-hub"] ul.tabs,
body[data-page*="system-hub"] .tabs,
/* Fallback: hide any tabs that appear before our custom nav */
.system-hub-dashboard .tabs,
.system-hub-dashboard + .tabs,
.system-hub-dashboard ~ .tabs,
.cbi-map > .tabs:first-child,
#maincontent > .container > .tabs,
#maincontent > .container > ul.tabs,
#view > .tabs,
#view > ul.tabs,
.view > .tabs,
.view > ul.tabs,
div.tabs:has(+ .system-hub-dashboard),
/* Direct sibling of System Hub content */
.sh-nav-tabs ~ .tabs,
/* LuCI 24.x specific */
.luci-app-system-hub .tabs,
#cbi-system-hub .tabs {
	display: none !important;
}

/* Hide tabs container when our nav is present */
.sh-nav-tabs ~ ul.tabs,
.sh-nav-tabs + ul.tabs {
	display: none !important;
}

/* System Hub Nav Tabs */
.sh-nav-tabs {
	display: flex;
	gap: 4px;
	margin-bottom: 24px;
	padding: 6px;
	background: var(--sh-bg-secondary);
	border-radius: var(--sh-radius-lg);
	border: 1px solid var(--sh-border);
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.sh-nav-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: var(--sh-radius);
	background: transparent;
	border: none;
	color: var(--sh-text-secondary);
	font-weight: 500;
	font-size: 13px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.2s ease;
	white-space: nowrap;
}

.sh-nav-tab:hover {
	color: var(--sh-text-primary);
	background: var(--sh-bg-tertiary);
}

.sh-nav-tab.active {
	color: var(--sh-accent);
	background: var(--sh-bg-tertiary);
	box-shadow: inset 0 -2px 0 var(--sh-accent);
}

.sh-tab-icon {
	font-size: 16px;
	line-height: 1;
}

.sh-tab-label {
	font-family: var(--sh-font-sans);
}

@media (max-width: 768px) {
	.sh-nav-tabs {
		padding: 4px;
	}
	.sh-nav-tab {
		padding: 8px 12px;
		font-size: 12px;
	}
	.sh-tab-label {
		display: none;
	}
	.sh-tab-icon {
		font-size: 18px;
	}
}
		`;
		document.head && document.head.appendChild(style);
	},

	renderTabs: function(active) {
		this.ensureLuCITabsHidden();
		return E('div', { 'class': 'sh-nav-tabs' },
			this.getTabs().map(function(tab) {
				return E('a', {
					'class': 'sh-nav-tab' + (tab.id === active ? ' active' : ''),
					'href': L.url.apply(L, tab.path)
				}, [
					E('span', { 'class': 'sh-tab-icon' }, tab.icon),
					E('span', { 'class': 'sh-tab-label' }, tab.label)
				]);
			})
		);
	}
});
