'use strict';
'require baseclass';

/**
 * SecuBox KISS Theme - Shared styling for all LuCI dashboards
 *
 * Usage in any LuCI view:
 *   'require secubox/kiss-theme';
 *   return view.extend({
 *       render: function() {
 *           KissTheme.apply();  // Injects CSS and hides LuCI chrome
 *           return E('div', { 'class': 'kiss-root' }, [...]);
 *       }
 *   });
 */

var KissThemeClass = baseclass.extend({
	// Navigation config - shared across all views
	nav: [
		{ cat: 'Main', items: [
			{ icon: '🏠', name: 'Home', path: 'admin/secubox-home' },
			{ icon: '📊', name: 'System Hub', path: 'admin/secubox/system/system-hub' }
		]},
		{ cat: 'Security', items: [
			{ icon: '🧙', name: 'InterceptoR', path: 'admin/secubox/interceptor/overview' },
			{ icon: '🛡️', name: 'CrowdSec', path: 'admin/secubox/security/crowdsec/overview' },
			{ icon: '🔍', name: 'mitmproxy', path: 'admin/secubox/security/mitmproxy/status' },
			{ icon: '🌐', name: 'DNS Guard', path: 'admin/secubox/security/dnsguard' }
		]},
		{ cat: 'Services', items: [
			{ icon: '📡', name: 'IoT Guard', path: 'admin/secubox/services/iot-guard' },
			{ icon: '💾', name: 'CDN Cache', path: 'admin/services/cdn-cache' },
			{ icon: '🔗', name: 'HAProxy', path: 'admin/services/haproxy' },
			{ icon: '🔒', name: 'WireGuard', path: 'admin/services/wireguard' }
		]},
		{ cat: 'Navigate', items: [
			{ icon: '🌳', name: 'LuCI Tree', path: 'admin/secubox/luci-tree' }
		]}
	],

	// Core palette
	colors: {
		bg: '#0a0e17',
		bg2: '#111827',
		card: '#161e2e',
		cardHover: '#1c2640',
		line: '#1e293b',
		text: '#e2e8f0',
		muted: '#94a3b8',
		green: '#00C853',
		greenGlow: '#00E676',
		red: '#FF1744',
		blue: '#2979FF',
		blueGlow: '#448AFF',
		cyan: '#22d3ee',
		purple: '#a78bfa',
		orange: '#fb923c',
		pink: '#f472b6',
		yellow: '#fbbf24'
	},

	// CSS generation
	generateCSS: function() {
		var c = this.colors;
		return `
/* SecuBox KISS Theme */
:root {
	--kiss-bg: ${c.bg}; --kiss-bg2: ${c.bg2}; --kiss-card: ${c.card};
	--kiss-line: ${c.line}; --kiss-text: ${c.text}; --kiss-muted: ${c.muted};
	--kiss-green: ${c.green}; --kiss-red: ${c.red}; --kiss-blue: ${c.blue};
	--kiss-cyan: ${c.cyan}; --kiss-purple: ${c.purple}; --kiss-orange: ${c.orange};
	--kiss-yellow: ${c.yellow};
}
.kiss-root {
	background: var(--kiss-bg); color: var(--kiss-text);
	font-family: 'Outfit', 'Segoe UI', sans-serif;
	min-height: 100vh; padding: 20px;
}
.kiss-root * { box-sizing: border-box; }
/* Cards */
.kiss-card {
	background: var(--kiss-card); border: 1px solid var(--kiss-line);
	border-radius: 12px; padding: 20px; margin-bottom: 16px;
	transition: all 0.2s;
}
.kiss-card:hover { border-color: rgba(0,200,83,0.2); }
.kiss-card-title {
	font-weight: 700; font-size: 16px; margin-bottom: 12px;
	display: flex; align-items: center; gap: 8px;
}
/* Grid */
.kiss-grid { display: grid; gap: 16px; }
.kiss-grid-2 { grid-template-columns: repeat(2, 1fr); }
.kiss-grid-3 { grid-template-columns: repeat(3, 1fr); }
.kiss-grid-4 { grid-template-columns: repeat(4, 1fr); }
.kiss-grid-auto { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
/* Stats */
.kiss-stat {
	background: var(--kiss-card); border: 1px solid var(--kiss-line);
	border-radius: 10px; padding: 16px; text-align: center;
}
.kiss-stat-value {
	font-family: 'Orbitron', monospace; font-weight: 700;
	font-size: 28px; color: var(--kiss-green);
}
.kiss-stat-label {
	font-size: 11px; color: var(--kiss-muted); text-transform: uppercase;
	letter-spacing: 1px; margin-top: 4px;
}
/* Buttons */
.kiss-btn {
	padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
	cursor: pointer; border: 1px solid var(--kiss-line); background: var(--kiss-bg2);
	color: var(--kiss-text); transition: all 0.2s; display: inline-flex;
	align-items: center; gap: 6px; text-decoration: none;
}
.kiss-btn:hover { border-color: rgba(0,200,83,0.3); background: rgba(0,200,83,0.05); }
.kiss-btn-green { border-color: var(--kiss-green); color: var(--kiss-green); }
.kiss-btn-red { border-color: var(--kiss-red); color: var(--kiss-red); }
.kiss-btn-blue { border-color: var(--kiss-blue); color: var(--kiss-blue); }
/* Status badges */
.kiss-badge {
	font-family: monospace; font-size: 10px; letter-spacing: 1px;
	padding: 4px 10px; border-radius: 4px; display: inline-block;
}
.kiss-badge-green { color: var(--kiss-green); background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.25); }
.kiss-badge-red { color: var(--kiss-red); background: rgba(255,23,68,0.1); border: 1px solid rgba(255,23,68,0.25); }
.kiss-badge-blue { color: var(--kiss-blue); background: rgba(41,121,255,0.1); border: 1px solid rgba(41,121,255,0.25); }
.kiss-badge-yellow { color: var(--kiss-yellow); background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25); }
/* Tables */
.kiss-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.kiss-table th {
	text-align: left; padding: 10px 16px; font-size: 11px; letter-spacing: 1px;
	text-transform: uppercase; color: var(--kiss-muted); font-family: monospace;
	border-bottom: 1px solid var(--kiss-line);
}
.kiss-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.kiss-table tr:hover td { background: rgba(255,255,255,0.02); }
/* Progress bars */
.kiss-progress { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.kiss-progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--kiss-green), var(--kiss-cyan)); }
/* Panels with border accent */
.kiss-panel-green { border-left: 3px solid var(--kiss-green); }
.kiss-panel-red { border-left: 3px solid var(--kiss-red); }
.kiss-panel-blue { border-left: 3px solid var(--kiss-blue); }
.kiss-panel-orange { border-left: 3px solid var(--kiss-orange); }
/* Sidebar layout */
.kiss-with-sidebar { display: flex; }
.kiss-sidebar {
	position: fixed; left: 0; top: 0; bottom: 0; width: 200px;
	background: linear-gradient(180deg, #0d1321 0%, var(--kiss-bg) 100%);
	border-right: 1px solid var(--kiss-line); z-index: 100;
	display: flex; flex-direction: column; overflow-y: auto;
}
.kiss-sidebar-logo {
	padding: 16px; border-bottom: 1px solid var(--kiss-line); text-align: center;
}
.kiss-logo-text { font-weight: 900; font-size: 24px; letter-spacing: -1px; }
.kiss-logo-sub { font-size: 9px; color: var(--kiss-muted); letter-spacing: 2px; margin-top: 4px; }
.kiss-nav { flex: 1; padding: 8px 0; }
.kiss-nav-section {
	padding: 8px 12px 4px; font-size: 9px; letter-spacing: 2px;
	text-transform: uppercase; color: var(--kiss-muted);
}
.kiss-nav-item {
	display: flex; align-items: center; gap: 10px; padding: 8px 16px;
	text-decoration: none; font-size: 13px; color: var(--kiss-muted);
	transition: all 0.2s; border-left: 2px solid transparent;
}
.kiss-nav-item:hover { background: rgba(255,255,255,0.03); color: var(--kiss-text); }
.kiss-nav-item.active { color: var(--kiss-green); background: rgba(0,200,83,0.05); border-left-color: var(--kiss-green); }
.kiss-nav-icon { font-size: 16px; width: 20px; text-align: center; }
.kiss-main { margin-left: 200px; padding: 20px; flex: 1; min-height: 100vh; }
/* Toggle */
#kiss-toggle {
	position: fixed; top: 10px; right: 10px; z-index: 99999;
	font-size: 32px; cursor: pointer; opacity: 0.7; transition: all 0.3s;
	background: rgba(0,0,0,0.5); border-radius: 50%; width: 50px; height: 50px;
	display: flex; align-items: center; justify-content: center;
}
#kiss-toggle:hover { opacity: 1; transform: scale(1.1); }
/* Responsive */
@media (max-width: 768px) {
	.kiss-grid-2, .kiss-grid-3, .kiss-grid-4 { grid-template-columns: 1fr; }
	.kiss-sidebar { width: 60px; }
	.kiss-sidebar-logo, .kiss-nav-section { display: none; }
	.kiss-nav-item { padding: 12px; justify-content: center; }
	.kiss-nav-item span:last-child { display: none; }
	.kiss-main { margin-left: 60px; }
}
@media (max-width: 480px) {
	.kiss-sidebar { display: none; }
	.kiss-main { margin-left: 0; }
}
`;
	},

	// State
	isKissMode: true,

	// Apply theme to page
	apply: function(options) {
		options = options || {};

		// Inject CSS if not already done
		if (!document.querySelector('#kiss-theme-css')) {
			var style = document.createElement('style');
			style.id = 'kiss-theme-css';
			style.textContent = this.generateCSS();
			document.head.appendChild(style);
		}

		// Add toggle button
		this.addToggle();

		// Hide LuCI chrome if requested (default: true)
		if (options.hideChrome !== false) {
			this.hideChrome();
		}
	},

	// Add eye toggle button
	addToggle: function() {
		var self = this;
		if (document.querySelector('#kiss-toggle')) return;

		var toggle = document.createElement('div');
		toggle.id = 'kiss-toggle';
		toggle.innerHTML = '👁️';
		toggle.title = 'Toggle KISS/LuCI mode';
		toggle.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;' +
			'font-size:32px;cursor:pointer;opacity:0.7;transition:all 0.3s;' +
			'background:rgba(0,0,0,0.5);border-radius:50%;width:50px;height:50px;' +
			'display:flex;align-items:center;justify-content:center;';

		toggle.onmouseover = function() { this.style.opacity = '1'; this.style.transform = 'scale(1.1)'; };
		toggle.onmouseout = function() { this.style.opacity = '0.7'; this.style.transform = 'scale(1)'; };
		toggle.onclick = function() { self.toggleMode(); };

		document.body.appendChild(toggle);
	},

	// Toggle between KISS and LuCI mode
	toggleMode: function() {
		this.isKissMode = !this.isKissMode;
		var toggle = document.getElementById('kiss-toggle');

		if (this.isKissMode) {
			// KISS mode - hide chrome
			toggle.innerHTML = '👁️';
			this.hideChrome();
			document.body.classList.add('kiss-mode');
		} else {
			// LuCI mode - show chrome
			toggle.innerHTML = '👁️‍🗨️';
			this.showChrome();
			document.body.classList.remove('kiss-mode');
		}
	},

	// Show LuCI chrome
	showChrome: function() {
		[
			'#mainmenu', '.main-left', 'header.main-header', 'header',
			'nav[role="navigation"]', 'aside', 'footer', '.container > header',
			'.pull-right', '#indicators', '.brand', '#topmenu', '#tabmenu'
		].forEach(function(sel) {
			var el = document.querySelector(sel);
			if (el) el.style.display = '';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent') || document.querySelector('.container');
		if (main) {
			main.style.marginLeft = '';
			main.style.marginTop = '';
			main.style.width = '';
			main.style.padding = '';
			main.style.maxWidth = '';
		}
		document.body.style.padding = '';
		document.body.style.margin = '';
	},

	// Hide LuCI navigation chrome
	hideChrome: function() {
		document.body.classList.add('kiss-mode');
		[
			'#mainmenu', '.main-left', 'header.main-header', 'header',
			'nav[role="navigation"]', 'aside', 'footer', '.container > header',
			'.pull-right', '#indicators', '.brand', '#topmenu', '#tabmenu'
		].forEach(function(sel) {
			var el = document.querySelector(sel);
			if (el) el.style.display = 'none';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent') || document.querySelector('.container');
		if (main) {
			main.style.marginLeft = '0';
			main.style.marginTop = '0';
			main.style.width = '100%';
			main.style.padding = '0';
			main.style.maxWidth = 'none';
		}
		document.body.style.padding = '0';
		document.body.style.margin = '0';
	},

	// Helper: Create element with KISS classes
	E: function(tag, attrs, children) {
		var el = document.createElement(tag);
		if (attrs) {
			for (var k in attrs) {
				if (k === 'class') {
					el.className = attrs[k];
				} else if (k.startsWith('on') && typeof attrs[k] === 'function') {
					el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
				} else {
					el.setAttribute(k, attrs[k]);
				}
			}
		}
		if (children) {
			(Array.isArray(children) ? children : [children]).forEach(function(c) {
				if (c == null) return;
				el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
			});
		}
		return el;
	},

	// Component helpers
	card: function(title, content) {
		return this.E('div', { 'class': 'kiss-card' }, [
			title ? this.E('div', { 'class': 'kiss-card-title' }, title) : null,
			this.E('div', {}, content)
		]);
	},

	stat: function(value, label, color) {
		var style = color ? 'color:' + color : '';
		return this.E('div', { 'class': 'kiss-stat' }, [
			this.E('div', { 'class': 'kiss-stat-value', 'style': style }, String(value)),
			this.E('div', { 'class': 'kiss-stat-label' }, label)
		]);
	},

	badge: function(text, type) {
		return this.E('span', { 'class': 'kiss-badge kiss-badge-' + (type || 'green') }, text);
	},

	btn: function(label, onClick, type) {
		return this.E('button', {
			'class': 'kiss-btn' + (type ? ' kiss-btn-' + type : ''),
			'onClick': onClick
		}, label);
	},

	// Render sidebar navigation
	renderSidebar: function(activePath) {
		var self = this;
		var currentPath = activePath || window.location.pathname.replace('/cgi-bin/luci/', '');
		var navItems = [];

		this.nav.forEach(function(cat) {
			navItems.push(self.E('div', { 'class': 'kiss-nav-section' }, cat.cat));
			cat.items.forEach(function(item) {
				var isActive = currentPath.indexOf(item.path) !== -1;
				navItems.push(self.E('a', {
					'href': '/cgi-bin/luci/' + item.path,
					'class': 'kiss-nav-item' + (isActive ? ' active' : '')
				}, [
					self.E('span', { 'class': 'kiss-nav-icon' }, item.icon),
					self.E('span', {}, item.name)
				]));
			});
		});

		return this.E('nav', { 'class': 'kiss-sidebar' }, [
			this.E('div', { 'class': 'kiss-sidebar-logo' }, [
				this.E('div', { 'class': 'kiss-logo-text' }, [
					this.E('span', { 'style': 'color: var(--kiss-green);' }, 'C'),
					this.E('span', { 'style': 'color: var(--kiss-red); font-size: 14px; vertical-align: super;' }, '3'),
					this.E('span', { 'style': 'color: var(--kiss-blue);' }, 'B'),
					this.E('span', { 'style': 'color: #37474F;' }, 'O'),
					this.E('span', { 'style': 'color: var(--kiss-green);' }, 'X')
				]),
				this.E('div', { 'class': 'kiss-logo-sub' }, 'SECUBOX')
			]),
			this.E('div', { 'class': 'kiss-nav' }, navItems)
		]);
	},

	// Create full page with sidebar
	wrap: function(content, activePath) {
		this.apply();
		return this.E('div', { 'class': 'kiss-root kiss-with-sidebar' }, [
			this.renderSidebar(activePath),
			this.E('div', { 'class': 'kiss-main' }, Array.isArray(content) ? content : [content])
		]);
	}
});

// Create singleton instance and expose globally for convenience
var KissTheme = new KissThemeClass();
window.KissTheme = KissTheme;

return KissThemeClass;
