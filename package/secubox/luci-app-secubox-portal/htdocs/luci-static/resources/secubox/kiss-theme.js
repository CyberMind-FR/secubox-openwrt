'use strict';
'require baseclass';

/**
 * SecuBox KISS Theme v2.0 - Shared styling for all LuCI dashboards
 * Features: Top bar with logout, collapsible sidebar, responsive design, view tabs
 */

var KissThemeClass = baseclass.extend({
	// Navigation config - organized by category with collapsible sections
	// Items with `tabs` array show sub-navigation when active
	nav: [
		{ cat: 'Dashboard', icon: '📊', collapsed: false, items: [
			{ icon: '🏠', name: 'Home', path: 'admin/secubox-home' },
			{ icon: '📊', name: 'Dashboard', path: 'admin/secubox/dashboard' },
			{ icon: '🖥️', name: 'System Hub', path: 'admin/secubox/system/system-hub' }
		]},
		{ cat: 'Security', icon: '🛡️', collapsed: false, items: [
			{ icon: '🧙', name: 'InterceptoR', path: 'admin/secubox/interceptor', tabs: [
				{ name: 'Overview', path: 'admin/secubox/interceptor/overview' },
				{ name: 'Services', path: 'admin/secubox/interceptor/services' }
			]},
			{ icon: '🛡️', name: 'CrowdSec', path: 'admin/secubox/security/crowdsec', tabs: [
				{ name: 'Overview', path: 'admin/secubox/security/crowdsec/overview' },
				{ name: 'Decisions', path: 'admin/secubox/security/crowdsec/decisions' },
				{ name: 'Alerts', path: 'admin/secubox/security/crowdsec/alerts' },
				{ name: 'Bouncers', path: 'admin/secubox/security/crowdsec/bouncers' },
				{ name: 'Setup', path: 'admin/secubox/security/crowdsec/setup' }
			]},
			{ icon: '🔍', name: 'mitmproxy', path: 'admin/secubox/security/mitmproxy', tabs: [
				{ name: 'Status', path: 'admin/secubox/security/mitmproxy/status' },
				{ name: 'Settings', path: 'admin/secubox/security/mitmproxy/settings' }
			]},
			{ icon: '🚫', name: 'Vortex FW', path: 'admin/secubox/security/vortex-firewall' },
			{ icon: '👁️', name: 'Client Guard', path: 'admin/secubox/security/guardian', tabs: [
				{ name: 'Clients', path: 'admin/secubox/security/guardian/clients' },
				{ name: 'Settings', path: 'admin/secubox/security/guardian/settings' }
			]},
			{ icon: '🍪', name: 'Cookie Track', path: 'admin/secubox/interceptor/cookies' }
		]},
		{ cat: 'Network', icon: '🌐', collapsed: true, items: [
			{ icon: '⚖️', name: 'HAProxy', path: 'admin/services/haproxy', tabs: [
				{ name: 'Overview', path: 'admin/services/haproxy/overview' },
				{ name: 'Vhosts', path: 'admin/services/haproxy/vhosts' },
				{ name: 'Backends', path: 'admin/services/haproxy/backends' },
				{ name: 'Certs', path: 'admin/services/haproxy/certificates' },
				{ name: 'ACLs', path: 'admin/services/haproxy/acls' },
				{ name: 'Stats', path: 'admin/services/haproxy/stats' },
				{ name: 'Settings', path: 'admin/services/haproxy/settings' }
			]},
			{ icon: '🔒', name: 'WireGuard', path: 'admin/services/wireguard', tabs: [
				{ name: 'Wizard', path: 'admin/services/wireguard/wizard' },
				{ name: 'Overview', path: 'admin/services/wireguard/overview' },
				{ name: 'Peers', path: 'admin/services/wireguard/peers' },
				{ name: 'QR Codes', path: 'admin/services/wireguard/qrcodes' },
				{ name: 'Traffic', path: 'admin/services/wireguard/traffic' },
				{ name: 'Config', path: 'admin/services/wireguard/config' },
				{ name: 'Settings', path: 'admin/services/wireguard/settings' }
			]},
			{ icon: '🌍', name: 'Tor Shield', path: 'admin/services/tor-shield', tabs: [
				{ name: 'Overview', path: 'admin/services/tor-shield/overview' },
				{ name: 'Circuits', path: 'admin/services/tor-shield/circuits' },
				{ name: 'Hidden Svc', path: 'admin/services/tor-shield/hidden-services' },
				{ name: 'Bridges', path: 'admin/services/tor-shield/bridges' },
				{ name: 'Settings', path: 'admin/services/tor-shield/settings' }
			]},
			{ icon: '💾', name: 'CDN Cache', path: 'admin/services/cdn-cache', tabs: [
				{ name: 'Overview', path: 'admin/services/cdn-cache/overview' },
				{ name: 'Cache', path: 'admin/services/cdn-cache/cache' },
				{ name: 'Policies', path: 'admin/services/cdn-cache/policies' },
				{ name: 'Stats', path: 'admin/services/cdn-cache/statistics' },
				{ name: 'Maint.', path: 'admin/services/cdn-cache/maintenance' },
				{ name: 'Settings', path: 'admin/services/cdn-cache/settings' }
			]},
			{ icon: '📡', name: 'Bandwidth', path: 'admin/secubox/network/bandwidth-manager' },
			{ icon: '📶', name: 'Traffic Shaper', path: 'admin/secubox/network/traffic-shaper', tabs: [
				{ name: 'Overview', path: 'admin/secubox/network/traffic-shaper/overview' },
				{ name: 'Classes', path: 'admin/secubox/network/traffic-shaper/classes' },
				{ name: 'Rules', path: 'admin/secubox/network/traffic-shaper/rules' },
				{ name: 'Stats', path: 'admin/secubox/network/traffic-shaper/stats' },
				{ name: 'Presets', path: 'admin/secubox/network/traffic-shaper/presets' }
			]},
			{ icon: '🌐', name: 'Network Modes', path: 'admin/secubox/network/network-modes' },
			{ icon: '🔌', name: 'Interfaces', path: 'admin/network/network' }
		]},
		{ cat: 'AI & LLM', icon: '🤖', collapsed: true, items: [
			{ icon: '🧠', name: 'AI Insights', path: 'admin/secubox/ai/insights' },
			{ icon: '🦙', name: 'Ollama', path: 'admin/services/ollama', tabs: [
				{ name: 'Dashboard', path: 'admin/services/ollama/dashboard' },
				{ name: 'Models', path: 'admin/services/ollama/models' },
				{ name: 'Chat', path: 'admin/services/ollama/chat' },
				{ name: 'Settings', path: 'admin/services/ollama/settings' }
			]},
			{ icon: '🤖', name: 'LocalAI', path: 'admin/services/localai' }
		]},
		{ cat: 'Apps', icon: '📦', collapsed: true, items: [
			{ icon: '✉️', name: 'Mail Server', path: 'admin/services/mailserver' },
			{ icon: '☁️', name: 'Nextcloud', path: 'admin/services/nextcloud' },
			{ icon: '🎬', name: 'Media Flow', path: 'admin/services/media-flow' },
			{ icon: '🪞', name: 'MagicMirror', path: 'admin/services/magicmirror2' },
			{ icon: '📰', name: 'HexoJS', path: 'admin/services/hexojs' },
			{ icon: '📺', name: 'Netdata', path: 'admin/services/netdata-dashboard' },
			{ icon: '🏠', name: 'Vhost Manager', path: 'admin/services/vhost-manager' },
			{ icon: '📦', name: 'App Store', path: 'admin/secubox/apps' }
		]},
		{ cat: 'Streamlit', icon: '🎯', collapsed: true, items: [
			{ icon: '📺', name: 'France TV', url: 'http://192.168.255.1:8522/' },
			{ icon: '🔮', name: 'Yijing Oracle', url: 'http://192.168.255.1:8501/' },
			{ icon: '🏭', name: 'Fabricator', url: 'http://192.168.255.1:8520/' },
			{ icon: '☯️', name: 'Bazi Complete', url: 'http://192.168.255.1:8509/' },
			{ icon: '🎛️', name: 'SecuBox Control', url: 'http://192.168.255.1:8511/' }
		]},
		{ cat: 'P2P & Mesh', icon: '🔗', collapsed: true, items: [
			{ icon: '🔗', name: 'P2P Network', path: 'admin/services/secubox-p2p' },
			{ icon: '🌳', name: 'Netifyd', path: 'admin/services/secubox-netifyd' },
			{ icon: '📡', name: 'Exposure', path: 'admin/services/exposure' }
		]},
		{ cat: 'System', icon: '⚙️', collapsed: true, items: [
			{ icon: '⚙️', name: 'Settings', path: 'admin/system' },
			{ icon: '📊', name: 'Status', path: 'admin/status/overview' },
			{ icon: '🛠️', name: 'KSM Manager', path: 'admin/services/ksm-manager' },
			{ icon: '🔄', name: 'Cloner', path: 'admin/secubox/system/cloner' },
			{ icon: '🌳', name: 'LuCI Menu', path: 'admin/secubox/luci-tree' },
			{ icon: '🔧', name: 'Software', path: 'admin/system/opkg' }
		]}
	],

	// Track collapsed state per category
	collapsedState: {},

	// Core palette
	colors: {
		bg: '#0a0e17',
		bg2: '#111827',
		card: '#161e2e',
		line: '#1e293b',
		text: '#e2e8f0',
		muted: '#94a3b8',
		green: '#00C853',
		red: '#FF1744',
		blue: '#2979FF',
		cyan: '#22d3ee',
		purple: '#a78bfa',
		orange: '#fb923c',
		yellow: '#fbbf24'
	},

	// State
	isKissMode: true,
	sidebarOpen: false,

	// CSS generation
	generateCSS: function() {
		var c = this.colors;
		return `
/* SecuBox KISS Theme v2 */
:root {
	--kiss-bg: ${c.bg}; --kiss-bg2: ${c.bg2}; --kiss-card: ${c.card};
	--kiss-line: ${c.line}; --kiss-text: ${c.text}; --kiss-muted: ${c.muted};
	--kiss-green: ${c.green}; --kiss-red: ${c.red}; --kiss-blue: ${c.blue};
	--kiss-cyan: ${c.cyan}; --kiss-purple: ${c.purple}; --kiss-orange: ${c.orange};
	--kiss-yellow: ${c.yellow};
}

/* === Top Bar === */
.kiss-topbar {
	position: fixed; top: 0; left: 0; right: 0; height: 56px; z-index: 1000;
	background: linear-gradient(90deg, #0d1321 0%, ${c.bg} 100%);
	border-bottom: 1px solid ${c.line};
	display: flex; align-items: center; padding: 0 16px; gap: 12px;
}
.kiss-topbar-menu {
	width: 40px; height: 40px; border: none; background: transparent;
	color: ${c.text}; font-size: 24px; cursor: pointer; border-radius: 8px;
	display: flex; align-items: center; justify-content: center;
}
.kiss-topbar-menu:hover { background: rgba(255,255,255,0.1); }
.kiss-topbar-logo {
	font-weight: 900; font-size: 20px; display: flex; align-items: center; gap: 2px;
}
.kiss-topbar-logo .g { color: ${c.green}; }
.kiss-topbar-logo .r { color: ${c.red}; font-size: 12px; vertical-align: super; }
.kiss-topbar-logo .b { color: ${c.blue}; }
.kiss-topbar-logo .o { color: #546e7a; }
.kiss-topbar-breadcrumb {
	flex: 1; font-size: 13px; color: ${c.muted}; overflow: hidden;
	text-overflow: ellipsis; white-space: nowrap;
}
.kiss-topbar-breadcrumb a { color: ${c.cyan}; text-decoration: none; }
.kiss-topbar-actions { display: flex; gap: 8px; align-items: center; }
.kiss-topbar-btn {
	padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
	border: 1px solid ${c.line}; background: ${c.bg2}; color: ${c.text};
	cursor: pointer; display: flex; align-items: center; gap: 6px;
	text-decoration: none;
}
.kiss-topbar-btn:hover { border-color: ${c.green}; background: rgba(0,200,83,0.1); }
.kiss-topbar-btn.logout { border-color: ${c.red}; color: ${c.red}; }
.kiss-topbar-btn.logout:hover { background: rgba(255,23,68,0.1); }

/* === Sidebar === */
.kiss-sidebar {
	position: fixed; left: 0; top: 56px; bottom: 0; width: 220px;
	background: linear-gradient(180deg, #0d1321 0%, ${c.bg} 100%);
	border-right: 1px solid ${c.line}; z-index: 999;
	overflow-y: auto; overflow-x: hidden;
	transition: transform 0.3s ease;
}
.kiss-sidebar::-webkit-scrollbar { width: 4px; }
.kiss-sidebar::-webkit-scrollbar-thumb { background: ${c.line}; border-radius: 2px; }
.kiss-nav { padding: 8px 0; }
.kiss-nav-section {
	padding: 10px 16px 8px; font-size: 11px; letter-spacing: 0.5px;
	text-transform: uppercase; color: ${c.muted}; font-weight: 600;
	cursor: pointer; display: flex; align-items: center; gap: 8px;
	transition: all 0.2s; border-radius: 6px; margin: 2px 8px;
}
.kiss-nav-section:hover { background: rgba(255,255,255,0.05); color: ${c.text}; }
.kiss-nav-section-icon { font-size: 14px; }
.kiss-nav-section-arrow { margin-left: auto; font-size: 10px; transition: transform 0.2s; }
.kiss-nav-section.collapsed .kiss-nav-section-arrow { transform: rotate(-90deg); }
.kiss-nav-section.collapsed + .kiss-nav-items { display: none; }
.kiss-nav-items { overflow: hidden; transition: all 0.2s; }
.kiss-nav-item {
	display: flex; align-items: center; gap: 10px; padding: 8px 16px 8px 32px;
	text-decoration: none; font-size: 12px; color: ${c.muted};
	transition: all 0.2s; border-left: 3px solid transparent; margin: 1px 0;
}
.kiss-nav-item:hover { background: rgba(255,255,255,0.05); color: ${c.text}; }
.kiss-nav-item.active {
	color: ${c.green}; background: rgba(0,200,83,0.08);
	border-left-color: ${c.green};
}
.kiss-nav-item.has-tabs { padding-right: 8px; }
.kiss-nav-item .tab-arrow { margin-left: auto; font-size: 9px; opacity: 0.5; transition: transform 0.2s; }
.kiss-nav-item.expanded .tab-arrow { transform: rotate(90deg); }
.kiss-nav-icon { font-size: 14px; width: 20px; text-align: center; flex-shrink: 0; }

/* === Sub-tabs (nested under active items) === */
.kiss-nav-tabs {
	overflow: hidden; max-height: 0; transition: max-height 0.3s ease;
	background: rgba(0,0,0,0.15);
}
.kiss-nav-tabs.expanded { max-height: 500px; }
.kiss-nav-tab {
	display: flex; align-items: center; gap: 6px; padding: 6px 16px 6px 48px;
	text-decoration: none; font-size: 11px; color: ${c.muted};
	transition: all 0.15s; border-left: 2px solid transparent;
	position: relative;
}
.kiss-nav-tab::before {
	content: ''; position: absolute; left: 36px; top: 50%;
	width: 4px; height: 4px; border-radius: 50%;
	background: ${c.line}; transform: translateY(-50%);
}
.kiss-nav-tab:hover { background: rgba(255,255,255,0.03); color: ${c.text}; }
.kiss-nav-tab:hover::before { background: ${c.muted}; }
.kiss-nav-tab.active {
	color: ${c.cyan}; background: rgba(34,211,238,0.05);
	border-left-color: ${c.cyan};
}
.kiss-nav-tab.active::before { background: ${c.cyan}; }

/* === Main Content === */
.kiss-main {
	margin-left: 220px; margin-top: 56px; padding: 20px;
	min-height: calc(100vh - 56px); background: ${c.bg};
	width: calc(100% - 220px); max-width: none;
}
.kiss-main > * { max-width: 100%; }

/* === View Tabs (internal navigation) === */
.kiss-tabs {
	display: flex; gap: 4px; margin-bottom: 20px; padding-bottom: 12px;
	border-bottom: 1px solid ${c.line}; flex-wrap: wrap;
}
.kiss-tab {
	padding: 8px 16px; font-size: 13px; color: ${c.muted};
	text-decoration: none; border-radius: 6px; transition: all 0.2s;
	border: 1px solid transparent;
}
.kiss-tab:hover { color: ${c.text}; background: rgba(255,255,255,0.05); }
.kiss-tab.active {
	color: ${c.green}; background: rgba(0,200,83,0.1);
	border-color: rgba(0,200,83,0.3);
}

/* === Overlay for mobile === */
.kiss-overlay {
	position: fixed; top: 56px; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.6); z-index: 998; display: none;
}
.kiss-overlay.active { display: block; }

/* === Full Width Overrides === */
html, body { margin: 0; padding: 0; width: 100%; min-height: 100vh; background: ${c.bg}; }
body.kiss-mode { overflow-x: hidden; }
body.kiss-mode #maincontent,
body.kiss-mode .main-right,
body.kiss-mode .main {
	margin: 0 !important; padding: 0 !important;
	width: 100% !important; max-width: 100% !important;
	background: ${c.bg} !important;
}
body.kiss-mode .container,
body.kiss-mode .cbi-map,
body.kiss-mode #cbi-network,
body.kiss-mode .cbi-section { max-width: 100% !important; width: 100% !important; }

/* === Cards === */
.kiss-root {
	background: ${c.bg}; color: ${c.text}; font-family: 'Segoe UI', sans-serif;
	width: 100%; min-height: 100vh; position: relative;
}
.kiss-root * { box-sizing: border-box; }
.kiss-card {
	background: ${c.card}; border: 1px solid ${c.line};
	border-radius: 12px; padding: 20px; margin-bottom: 16px;
}
.kiss-card:hover { border-color: rgba(0,200,83,0.2); }
.kiss-card-title {
	font-weight: 700; font-size: 16px; margin-bottom: 12px;
	display: flex; align-items: center; gap: 8px;
}

/* === Grid === */
.kiss-grid { display: grid; gap: 16px; }
.kiss-grid-2 { grid-template-columns: repeat(2, 1fr); }
.kiss-grid-3 { grid-template-columns: repeat(3, 1fr); }
.kiss-grid-4 { grid-template-columns: repeat(4, 1fr); }

/* === Stats === */
.kiss-stat {
	background: ${c.card}; border: 1px solid ${c.line};
	border-radius: 10px; padding: 16px; text-align: center;
}
.kiss-stat-value { font-family: monospace; font-weight: 700; font-size: 28px; color: ${c.green}; }
.kiss-stat-label { font-size: 11px; color: ${c.muted}; text-transform: uppercase; margin-top: 4px; }

/* === Buttons === */
.kiss-btn {
	padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
	cursor: pointer; border: 1px solid ${c.line}; background: ${c.bg2};
	color: ${c.text}; display: inline-flex; align-items: center; gap: 6px;
}
.kiss-btn:hover { border-color: rgba(0,200,83,0.3); background: rgba(0,200,83,0.05); }
.kiss-btn-green { border-color: ${c.green}; color: ${c.green}; }
.kiss-btn-red { border-color: ${c.red}; color: ${c.red}; }
.kiss-btn-blue { border-color: ${c.blue}; color: ${c.blue}; }

/* === Badges === */
.kiss-badge {
	font-family: monospace; font-size: 10px; letter-spacing: 1px;
	padding: 4px 10px; border-radius: 4px; display: inline-block;
}
.kiss-badge-green { color: ${c.green}; background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.25); }
.kiss-badge-red { color: ${c.red}; background: rgba(255,23,68,0.1); border: 1px solid rgba(255,23,68,0.25); }
.kiss-badge-blue { color: ${c.blue}; background: rgba(41,121,255,0.1); border: 1px solid rgba(41,121,255,0.25); }
.kiss-badge-yellow { color: ${c.yellow}; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.25); }

/* === Tables === */
.kiss-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.kiss-table th {
	text-align: left; padding: 10px 16px; font-size: 11px;
	text-transform: uppercase; color: ${c.muted}; border-bottom: 1px solid ${c.line};
}
.kiss-table td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.kiss-table tr:hover td { background: rgba(255,255,255,0.02); }

/* === Progress === */
.kiss-progress { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.kiss-progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, ${c.green}, ${c.cyan}); }

/* === Panels === */
.kiss-panel-green { border-left: 3px solid ${c.green}; }
.kiss-panel-red { border-left: 3px solid ${c.red}; }
.kiss-panel-blue { border-left: 3px solid ${c.blue}; }

/* === Toggle Buttons === */
.kiss-toggles {
	position: fixed; bottom: 20px; right: 20px; z-index: 9999;
	display: flex; flex-direction: column; gap: 8px;
}
.kiss-toggle-btn {
	font-size: 20px; cursor: pointer; opacity: 0.7;
	background: ${c.card}; border: 1px solid ${c.line};
	border-radius: 50%; width: 44px; height: 44px;
	display: flex; align-items: center; justify-content: center;
	box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s;
}
.kiss-toggle-btn:hover { opacity: 1; transform: scale(1.1); border-color: ${c.green}; }
.kiss-toggle-btn.active { border-color: ${c.green}; background: rgba(0,200,83,0.15); }

/* === Minimized mode === */
.kiss-chrome-hidden .kiss-topbar,
.kiss-chrome-hidden .kiss-sidebar,
.kiss-chrome-hidden .kiss-overlay { display: none !important; }
.kiss-chrome-hidden .kiss-main {
	margin-left: 0 !important; margin-top: 0 !important;
	width: 100% !important; padding: 16px !important;
}

/* === Responsive === */
@media (max-width: 1024px) {
	.kiss-sidebar { transform: translateX(-100%); }
	.kiss-sidebar.open { transform: translateX(0); }
	.kiss-main { margin-left: 0; width: 100%; }
	.kiss-grid-3, .kiss-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
	.kiss-grid-2 { grid-template-columns: 1fr; }
	.kiss-topbar-breadcrumb { display: none; }
	.kiss-stat-value { font-size: 22px; }
	.kiss-main { padding: 12px; width: 100%; }
	.kiss-card { padding: 14px; }
	.kiss-table { font-size: 12px; }
	.kiss-table th, .kiss-table td { padding: 8px 10px; }
}
@media (max-width: 480px) {
	.kiss-topbar-logo span:not(.g) { display: none; }
	.kiss-topbar-btn span { display: none; }
	.kiss-tabs { gap: 2px; }
	.kiss-tab { padding: 6px 10px; font-size: 12px; }
	.kiss-main { padding: 8px; }
	.kiss-stat { padding: 10px; }
	.kiss-stat-value { font-size: 18px; }
}
`;
	},

	// Apply theme
	apply: function(options) {
		options = options || {};
		if (!document.querySelector('#kiss-theme-css')) {
			var style = document.createElement('style');
			style.id = 'kiss-theme-css';
			style.textContent = this.generateCSS();
			document.head.appendChild(style);
		}
		this.addToggle();
		if (options.hideChrome !== false) {
			this.hideChrome();
		}
	},

	chromeVisible: true,

	addToggle: function() {
		var self = this;
		if (document.querySelector('.kiss-toggles')) return;

		var container = document.createElement('div');
		container.className = 'kiss-toggles';

		// Toggle KISS chrome (sidebar/topbar)
		var chromeToggle = document.createElement('div');
		chromeToggle.className = 'kiss-toggle-btn active';
		chromeToggle.innerHTML = '📐';
		chromeToggle.title = 'Toggle sidebar & top bar';
		chromeToggle.onclick = function() { self.toggleChrome(); };

		// Toggle LuCI mode
		var modeToggle = document.createElement('div');
		modeToggle.id = 'kiss-mode-toggle';
		modeToggle.className = 'kiss-toggle-btn';
		modeToggle.innerHTML = '👁️';
		modeToggle.title = 'Switch to LuCI mode';
		modeToggle.onclick = function() { self.toggleMode(); };

		container.appendChild(chromeToggle);
		container.appendChild(modeToggle);
		document.body.appendChild(container);
	},

	toggleChrome: function() {
		this.chromeVisible = !this.chromeVisible;
		var btn = document.querySelector('.kiss-toggles .kiss-toggle-btn');
		var root = document.querySelector('.kiss-root');

		if (this.chromeVisible) {
			btn.classList.add('active');
			btn.innerHTML = '📐';
			if (root) root.classList.remove('kiss-chrome-hidden');
		} else {
			btn.classList.remove('active');
			btn.innerHTML = '📏';
			if (root) root.classList.add('kiss-chrome-hidden');
		}
	},

	toggleMode: function() {
		this.isKissMode = !this.isKissMode;
		var toggle = document.getElementById('kiss-mode-toggle');
		if (this.isKissMode) {
			toggle.innerHTML = '👁️';
			toggle.title = 'Switch to LuCI mode';
			this.hideChrome();
		} else {
			toggle.innerHTML = '👁️‍🗨️';
			toggle.title = 'Switch to KISS mode';
			this.showChrome();
		}
	},

	showChrome: function() {
		['#mainmenu', '.main-left', 'header', 'nav', 'aside', 'footer', '#topmenu', '#tabmenu', '.pull-right'].forEach(function(s) {
			var el = document.querySelector(s);
			if (el) el.style.display = '';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent');
		if (main) { main.style.marginLeft = ''; main.style.marginTop = ''; main.style.width = ''; }
		// Hide KISS elements
		var kissEl = document.querySelectorAll('.kiss-topbar, .kiss-sidebar, .kiss-overlay');
		kissEl.forEach(function(el) { el.style.display = 'none'; });
	},

	hideChrome: function() {
		document.body.classList.add('kiss-mode');
		// Hide LuCI chrome but KEEP #tabmenu for view tabs
		['#mainmenu', '.main-left', 'header', 'nav[role="navigation"]', 'aside', 'footer', '#topmenu', '.pull-right'].forEach(function(s) {
			var el = document.querySelector(s);
			if (el) el.style.display = 'none';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent');
		if (main) { main.style.marginLeft = '0'; main.style.marginTop = '0'; main.style.width = '100%'; }
		// Show KISS elements
		var kissEl = document.querySelectorAll('.kiss-topbar, .kiss-sidebar, .kiss-overlay');
		kissEl.forEach(function(el) { el.style.display = ''; });
	},

	toggleSidebar: function() {
		this.sidebarOpen = !this.sidebarOpen;
		var sidebar = document.querySelector('.kiss-sidebar');
		var overlay = document.querySelector('.kiss-overlay');
		if (sidebar) sidebar.classList.toggle('open', this.sidebarOpen);
		if (overlay) overlay.classList.toggle('active', this.sidebarOpen);
	},

	closeSidebar: function() {
		this.sidebarOpen = false;
		var sidebar = document.querySelector('.kiss-sidebar');
		var overlay = document.querySelector('.kiss-overlay');
		if (sidebar) sidebar.classList.remove('open');
		if (overlay) overlay.classList.remove('active');
	},

	E: function(tag, attrs, children) {
		var el = document.createElement(tag);
		if (attrs) {
			for (var k in attrs) {
				if (k === 'class') el.className = attrs[k];
				else if (k.startsWith('on') && typeof attrs[k] === 'function')
					el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
				else el.setAttribute(k, attrs[k]);
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

	card: function(title, content) {
		return this.E('div', { 'class': 'kiss-card' }, [
			title ? this.E('div', { 'class': 'kiss-card-title' }, title) : null,
			this.E('div', {}, content)
		]);
	},

	stat: function(value, label, color) {
		return this.E('div', { 'class': 'kiss-stat' }, [
			this.E('div', { 'class': 'kiss-stat-value', 'style': color ? 'color:' + color : '' }, String(value)),
			this.E('div', { 'class': 'kiss-stat-label' }, label)
		]);
	},

	badge: function(text, type) {
		return this.E('span', { 'class': 'kiss-badge kiss-badge-' + (type || 'green') }, text);
	},

	btn: function(label, onClick, type) {
		return this.E('button', { 'class': 'kiss-btn' + (type ? ' kiss-btn-' + type : ''), 'onClick': onClick }, label);
	},

	// Render top bar
	renderTopbar: function() {
		var self = this;
		var path = window.location.pathname.replace('/cgi-bin/luci/', '').split('/');
		var breadcrumb = path.map(function(p, i) {
			var href = '/cgi-bin/luci/' + path.slice(0, i + 1).join('/');
			return self.E('a', { 'href': href }, p);
		});

		return this.E('header', { 'class': 'kiss-topbar' }, [
			this.E('button', { 'class': 'kiss-topbar-menu', 'onClick': function() { self.toggleSidebar(); } }, '☰'),
			this.E('div', { 'class': 'kiss-topbar-logo' }, [
				this.E('span', { 'class': 'g' }, 'C'),
				this.E('span', { 'class': 'r' }, '3'),
				this.E('span', { 'class': 'b' }, 'B'),
				this.E('span', { 'class': 'o' }, 'O'),
				this.E('span', { 'class': 'g' }, 'X')
			]),
			this.E('div', { 'class': 'kiss-topbar-breadcrumb' }, breadcrumb),
			this.E('div', { 'class': 'kiss-topbar-actions' }, [
				this.E('a', { 'class': 'kiss-topbar-btn', 'href': '/cgi-bin/luci/admin/system' }, [
					'⚙️', this.E('span', {}, 'Settings')
				]),
				this.E('a', { 'class': 'kiss-topbar-btn logout', 'href': '/cgi-bin/luci/admin/logout' }, [
					'🚪', this.E('span', {}, 'Logout')
				])
			])
		]);
	},

	// Toggle category collapsed state
	toggleCategory: function(catName) {
		this.collapsedState[catName] = !this.collapsedState[catName];
		var section = document.querySelector('.kiss-nav-section[data-cat="' + catName + '"]');
		if (section) {
			section.classList.toggle('collapsed', this.collapsedState[catName]);
		}
	},

	// Render sidebar
	renderSidebar: function(activePath) {
		var self = this;
		var currentPath = activePath || window.location.pathname.replace('/cgi-bin/luci/', '');
		var navItems = [];

		// Initialize collapsed state from nav config
		this.nav.forEach(function(cat) {
			if (self.collapsedState[cat.cat] === undefined) {
				// Auto-expand if current path is in this category
				var hasActive = cat.items.some(function(item) {
					if (item.path && currentPath.indexOf(item.path) !== -1) return true;
					if (item.tabs) {
						return item.tabs.some(function(tab) {
							return currentPath === tab.path || currentPath.indexOf(tab.path) !== -1;
						});
					}
					return false;
				});
				self.collapsedState[cat.cat] = hasActive ? false : (cat.collapsed || false);
			}
		});

		this.nav.forEach(function(cat) {
			var isCollapsed = self.collapsedState[cat.cat];

			// Section header (clickable to expand/collapse)
			navItems.push(self.E('div', {
				'class': 'kiss-nav-section' + (isCollapsed ? ' collapsed' : ''),
				'data-cat': cat.cat,
				'onClick': function(e) {
					e.preventDefault();
					self.toggleCategory(cat.cat);
				}
			}, [
				self.E('span', { 'class': 'kiss-nav-section-icon' }, cat.icon || '📁'),
				self.E('span', {}, cat.cat),
				self.E('span', { 'class': 'kiss-nav-section-arrow' }, '▼')
			]));

			// Items container with sub-tabs
			var itemElements = [];
			cat.items.forEach(function(item) {
				var isExternal = !!item.url;
				var href = isExternal ? item.url : '/cgi-bin/luci/' + item.path;
				var hasTabs = item.tabs && item.tabs.length > 0;

				// Check if this item or any of its tabs is active
				var isItemActive = !isExternal && item.path && currentPath.indexOf(item.path) !== -1;
				var isTabActive = hasTabs && item.tabs.some(function(tab) {
					return currentPath === tab.path || currentPath.indexOf(tab.path) !== -1;
				});
				var isActive = isItemActive || isTabActive;

				// Main nav item
				itemElements.push(self.E('a', {
					'href': href,
					'class': 'kiss-nav-item' + (isActive ? ' active' : '') + (isExternal ? ' external' : '') + (hasTabs ? ' has-tabs' : '') + (isActive && hasTabs ? ' expanded' : ''),
					'target': isExternal ? '_blank' : '',
					'onClick': function() { self.closeSidebar(); }
				}, [
					self.E('span', { 'class': 'kiss-nav-icon' }, item.icon),
					self.E('span', {}, item.name),
					isExternal ? self.E('span', { 'style': 'margin-left:auto;font-size:10px;opacity:0.5;' }, '↗') : null,
					hasTabs ? self.E('span', { 'class': 'tab-arrow' }, '▶') : null
				]));

				// Sub-tabs (only rendered if item has tabs)
				if (hasTabs) {
					var tabsContainer = self.E('div', {
						'class': 'kiss-nav-tabs' + (isActive ? ' expanded' : '')
					}, item.tabs.map(function(tab) {
						var tabActive = currentPath === tab.path || currentPath.indexOf(tab.path) !== -1;
						return self.E('a', {
							'href': '/cgi-bin/luci/' + tab.path,
							'class': 'kiss-nav-tab' + (tabActive ? ' active' : ''),
							'onClick': function() { self.closeSidebar(); }
						}, tab.name);
					}));
					itemElements.push(tabsContainer);
				}
			});

			var itemsContainer = self.E('div', { 'class': 'kiss-nav-items' }, itemElements);
			navItems.push(itemsContainer);
		});

		return this.E('nav', { 'class': 'kiss-sidebar' }, [
			this.E('div', { 'class': 'kiss-nav' }, navItems)
		]);
	},

	// Render overlay for mobile
	renderOverlay: function() {
		var self = this;
		return this.E('div', { 'class': 'kiss-overlay', 'onClick': function() { self.closeSidebar(); } });
	},

	// Wrap content with theme
	wrap: function(content, activePath) {
		this.apply();
		return this.E('div', { 'class': 'kiss-root' }, [
			this.renderTopbar(),
			this.renderSidebar(activePath),
			this.renderOverlay(),
			this.E('div', { 'class': 'kiss-main' }, Array.isArray(content) ? content : [content])
		]);
	}
});

var KissTheme = new KissThemeClass();
window.KissTheme = KissTheme;

return KissThemeClass;
