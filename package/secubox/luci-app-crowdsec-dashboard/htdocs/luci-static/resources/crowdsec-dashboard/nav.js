'use strict';
'require baseclass';

/**
 * CrowdSec Dashboard Navigation
 * SecuBox themed navigation tabs
 */

// Immediately inject CSS to hide LuCI tabs before page renders
(function() {
	if (typeof document === 'undefined') return;
	if (document.getElementById('crowdsec-early-hide')) return;
	var style = document.createElement('style');
	style.id = 'crowdsec-early-hide';
	style.textContent = 'body[data-page*="crowdsec"] ul.tabs, body[data-page*="crowdsec"] .tabs:not(.cs-nav-tabs) { display: none !important; }';
	(document.head || document.documentElement).appendChild(style);
})();

var tabs = [
	{ id: 'overview', icon: '📊', label: _('Overview'), path: ['admin', 'secubox', 'services', 'crowdsec', 'overview'] },
	{ id: 'wizard', icon: '🚀', label: _('Wizard'), path: ['admin', 'secubox', 'services', 'crowdsec', 'wizard'] },
	{ id: 'decisions', icon: '⛔', label: _('Decisions'), path: ['admin', 'secubox', 'services', 'crowdsec', 'decisions'] },
	{ id: 'alerts', icon: '⚠️', label: _('Alerts'), path: ['admin', 'secubox', 'services', 'crowdsec', 'alerts'] },
	{ id: 'bouncers', icon: '🛡️', label: _('Bouncers'), path: ['admin', 'secubox', 'services', 'crowdsec', 'bouncers'] },
	{ id: 'waf', icon: '🔥', label: _('WAF/AppSec'), path: ['admin', 'secubox', 'services', 'crowdsec', 'waf'] },
	{ id: 'metrics', icon: '📈', label: _('Metrics'), path: ['admin', 'secubox', 'services', 'crowdsec', 'metrics'] },
	{ id: 'settings', icon: '⚙️', label: _('Settings'), path: ['admin', 'secubox', 'services', 'crowdsec', 'settings'] }
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
			if (!el.classList.contains('cs-nav-tabs')) {
				el.style.display = 'none';
				// Also try removing from DOM after a brief delay
				setTimeout(function() {
					if (el.parentNode && !el.classList.contains('cs-nav-tabs')) {
						el.style.display = 'none';
					}
				}, 100);
			}
		});

		if (document.getElementById('crowdsec-tabstyle'))
			return;
		var style = document.createElement('style');
		style.id = 'crowdsec-tabstyle';
		style.textContent = `
/* Hide default LuCI tabs for CrowdSec - aggressive selectors */
/* Target any ul.tabs in the page */
ul.tabs {
	display: none !important;
}

/* Be more specific for pages that need tabs elsewhere */
body:not([data-page*="crowdsec"]) ul.tabs {
	display: block !important;
}

/* All possible LuCI tab selectors */
body[data-page^="admin-secubox-services-crowdsec"] .tabs,
body[data-page^="admin-secubox-services-crowdsec"] #tabmenu,
body[data-page^="admin-secubox-services-crowdsec"] .cbi-tabmenu,
body[data-page^="admin-secubox-services-crowdsec"] .nav-tabs,
body[data-page^="admin-secubox-services-crowdsec"] ul.cbi-tabmenu,
body[data-page*="crowdsec"] ul.tabs,
body[data-page*="crowdsec"] .tabs,
/* Fallback: hide any tabs that appear before our custom nav */
.crowdsec-dashboard .tabs,
.crowdsec-dashboard + .tabs,
.crowdsec-dashboard ~ .tabs,
.cbi-map > .tabs:first-child,
#maincontent > .container > .tabs,
#maincontent > .container > ul.tabs,
#view > .tabs,
#view > ul.tabs,
.view > .tabs,
.view > ul.tabs,
div.tabs:has(+ .crowdsec-dashboard),
div.tabs:has(+ .wizard-container),
/* Direct sibling of CrowdSec content */
.wizard-container ~ .tabs,
.cs-nav-tabs ~ .tabs,
/* LuCI 24.x specific */
.luci-app-crowdsec-dashboard .tabs,
#cbi-crowdsec .tabs {
	display: none !important;
}

/* Hide tabs container when our nav is present */
.cs-nav-tabs ~ ul.tabs,
.cs-nav-tabs + ul.tabs {
	display: none !important;
}

/* CrowdSec Nav Tabs */
.cs-nav-tabs {
	display: flex;
	gap: 4px;
	margin-bottom: 24px;
	padding: 6px;
	background: var(--cs-bg-secondary);
	border-radius: var(--cs-radius-lg);
	border: 1px solid var(--cs-border);
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.cs-nav-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: var(--cs-radius);
	background: transparent;
	border: none;
	color: var(--cs-text-secondary);
	font-weight: 500;
	font-size: 13px;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.2s ease;
	white-space: nowrap;
}

.cs-nav-tab:hover {
	color: var(--cs-text-primary);
	background: var(--cs-bg-tertiary);
}

.cs-nav-tab.active {
	color: var(--cs-accent-green);
	background: var(--cs-bg-tertiary);
	box-shadow: inset 0 -2px 0 var(--cs-accent-green);
}

.cs-tab-icon {
	font-size: 16px;
	line-height: 1;
}

.cs-tab-label {
	font-family: var(--cs-font-sans);
}

@media (max-width: 768px) {
	.cs-nav-tabs {
		padding: 4px;
	}
	.cs-nav-tab {
		padding: 8px 12px;
		font-size: 12px;
	}
	.cs-tab-label {
		display: none;
	}
	.cs-tab-icon {
		font-size: 18px;
	}
}
		`;
		document.head && document.head.appendChild(style);
	},

	renderTabs: function(active) {
		this.ensureLuCITabsHidden();
		return E('div', { 'class': 'cs-nav-tabs' },
			this.getTabs().map(function(tab) {
				return E('a', {
					'class': 'cs-nav-tab' + (tab.id === active ? ' active' : ''),
					'href': L.url.apply(L, tab.path)
				}, [
					E('span', { 'class': 'cs-tab-icon' }, tab.icon),
					E('span', { 'class': 'cs-tab-label' }, tab.label)
				]);
			})
		);
	}
});
