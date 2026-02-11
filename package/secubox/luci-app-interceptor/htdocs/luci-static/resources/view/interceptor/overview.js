'use strict';
'require view';
'require rpc';
'require poll';

var callGetStatus = rpc.declare({
	object: 'luci.interceptor',
	method: 'status',
	expect: {}
});

var PILLARS = [
	{ id: 'wpad', name: 'WPAD', icon: '🌐', desc: 'Auto-proxy discovery' },
	{ id: 'mitm', name: 'MITM Proxy', icon: '🛡️', desc: 'Traffic inspection' },
	{ id: 'cdn_cache', name: 'CDN Cache', icon: '💾', desc: 'Content caching' },
	{ id: 'cookie_tracker', name: 'Cookies', icon: '🍪', desc: 'Tracker detection' },
	{ id: 'api_failover', name: 'API Failover', icon: '⚡', desc: 'Graceful degradation' }
];

var QUICK_LINKS = [
	{ name: 'Network Tweaks', path: 'admin/network/network-tweaks', icon: '🌐' },
	{ name: 'mitmproxy', path: 'admin/secubox/security/mitmproxy/status', icon: '🔍' },
	{ name: 'CDN Cache', path: 'admin/services/cdn-cache', icon: '💾' },
	{ name: 'CrowdSec', path: 'admin/secubox/security/crowdsec/overview', icon: '🛡️' }
];

return view.extend({
	load: function() {
		return callGetStatus().catch(function() {
			return { success: false };
		});
	},

	render: function(data) {
		var self = this;

		// Inject KISS CSS
		this.injectCSS();

		if (!data || !data.success) {
			return E('div', { 'class': 'kiss-root' }, [
				E('div', { 'class': 'kiss-card kiss-panel-red' }, [
					E('div', { 'class': 'kiss-card-title' }, '⚠️ InterceptoR Status Unavailable'),
					E('p', { 'style': 'color: var(--kiss-muted);' }, 'Failed to load status. Check if RPCD service is running.')
				])
			]);
		}

		var summary = data.summary || {};
		var score = summary.health_score || 0;
		var pillarsActive = summary.pillars_active || 0;

		return E('div', { 'class': 'kiss-root' }, [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0 0 8px 0;' }, '🧙 InterceptoR'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'The Gandalf Proxy — Transparent traffic interception')
			]),

			// Health Score Card
			E('div', { 'class': 'kiss-card', 'style': 'text-align: center; padding: 30px; margin-bottom: 20px;' }, [
				E('div', { 'style': 'font-size: 56px; font-weight: 900; color: ' + this.scoreColor(score) + ';' }, score + '%'),
				E('div', { 'style': 'font-size: 14px; color: var(--kiss-muted); margin-top: 8px;' }, 'Health Score'),
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-cyan); margin-top: 4px;' },
					pillarsActive + ' of 5 pillars active')
			]),

			// Pillars Grid
			E('div', { 'class': 'kiss-grid kiss-grid-auto', 'style': 'margin-bottom: 24px;' },
				PILLARS.map(function(p) {
					return self.renderPillar(p, data[p.id] || {});
				})
			),

			// Quick Links
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, '🔗 Quick Links'),
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 10px;' },
					QUICK_LINKS.map(function(link) {
						return E('a', {
							'href': '/cgi-bin/luci/' + link.path,
							'class': 'kiss-btn',
							'style': 'text-decoration: none;'
						}, link.icon + ' ' + link.name);
					})
				)
			])
		]);
	},

	renderPillar: function(pillar, data) {
		var enabled = data.enabled || false;
		var running = data.running !== undefined ? data.running : enabled;
		var statusColor = running ? 'var(--kiss-green)' : 'var(--kiss-red)';
		var statusText = running ? 'Active' : 'Inactive';

		var stats = [];
		switch(pillar.id) {
			case 'mitm':
				stats.push('Threats: ' + (data.threats_today || 0));
				stats.push('Connections: ' + (data.active_connections || 0));
				break;
			case 'cdn_cache':
				stats.push('Hit Ratio: ' + (data.hit_ratio || 0) + '%');
				if (data.offline_mode) stats.push('⚠️ OFFLINE');
				break;
			case 'cookie_tracker':
				stats.push('Cookies: ' + (data.total_cookies || 0));
				stats.push('Trackers: ' + (data.trackers_detected || 0));
				break;
			case 'wpad':
				if (data.dhcp_configured) stats.push('DHCP: ✓');
				if (data.enforce_enabled) stats.push('Enforce: ✓');
				break;
			case 'api_failover':
				stats.push('Stale serves: ' + (data.stale_serves || 0));
				break;
		}

		return E('div', { 'class': 'kiss-card', 'style': 'text-align: center; border-left: 3px solid ' + statusColor + ';' }, [
			E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, pillar.icon),
			E('div', { 'style': 'font-weight: 700; font-size: 14px;' }, pillar.name),
			E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-bottom: 8px;' }, pillar.desc),
			E('div', { 'style': 'font-size: 11px; color: ' + statusColor + '; font-weight: 600;' }, statusText),
			stats.length ? E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); margin-top: 8px;' },
				stats.join(' • ')) : null
		]);
	},

	scoreColor: function(score) {
		if (score >= 80) return 'var(--kiss-green)';
		if (score >= 50) return 'var(--kiss-yellow)';
		return 'var(--kiss-red)';
	},

	kissMode: true,

	injectCSS: function() {
		var self = this;
		if (document.querySelector('#kiss-interceptor-css')) return;

		var css = `
:root {
	--kiss-bg: #0a0e17; --kiss-bg2: #111827; --kiss-card: #161e2e;
	--kiss-line: #1e293b; --kiss-text: #e2e8f0; --kiss-muted: #94a3b8;
	--kiss-green: #00C853; --kiss-red: #FF1744; --kiss-blue: #2979FF;
	--kiss-cyan: #22d3ee; --kiss-yellow: #fbbf24;
}
.kiss-root {
	background: var(--kiss-bg); color: var(--kiss-text);
	font-family: 'Segoe UI', sans-serif; min-height: 100vh; padding: 20px;
}
.kiss-card {
	background: var(--kiss-card); border: 1px solid var(--kiss-line);
	border-radius: 12px; padding: 20px; margin-bottom: 16px;
}
.kiss-card-title { font-weight: 700; font-size: 16px; margin-bottom: 12px; }
.kiss-grid { display: grid; gap: 16px; }
.kiss-grid-auto { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
.kiss-btn {
	padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
	cursor: pointer; border: 1px solid var(--kiss-line); background: var(--kiss-bg2);
	color: var(--kiss-text); transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
}
.kiss-btn:hover { border-color: rgba(0,200,83,0.3); background: rgba(0,200,83,0.05); }
.kiss-panel-red { border-left: 3px solid var(--kiss-red); }
#kiss-toggle {
	position: fixed; top: 10px; right: 10px; z-index: 99999;
	font-size: 32px; cursor: pointer; opacity: 0.7; transition: all 0.3s;
	background: rgba(0,0,0,0.5); border-radius: 50%; width: 50px; height: 50px;
	display: flex; align-items: center; justify-content: center;
}
#kiss-toggle:hover { opacity: 1; transform: scale(1.1); }
@media (max-width: 600px) { .kiss-grid-auto { grid-template-columns: 1fr 1fr; } }
`;
		var style = document.createElement('style');
		style.id = 'kiss-interceptor-css';
		style.textContent = css;
		document.head.appendChild(style);

		// Add toggle button
		if (!document.querySelector('#kiss-toggle')) {
			var toggle = document.createElement('div');
			toggle.id = 'kiss-toggle';
			toggle.innerHTML = '👁️';
			toggle.title = 'Toggle KISS/LuCI mode';
			toggle.onclick = function() { self.toggleMode(); };
			document.body.appendChild(toggle);
		}

		// Hide LuCI chrome
		this.hideChrome();
	},

	hideChrome: function() {
		document.body.style.background = 'var(--kiss-bg)';
		['#mainmenu', '.main-left', 'header', 'footer', '#topmenu', '#tabmenu'].forEach(function(sel) {
			var el = document.querySelector(sel);
			if (el) el.style.display = 'none';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent');
		if (main) { main.style.marginLeft = '0'; main.style.padding = '0'; main.style.maxWidth = 'none'; }
	},

	showChrome: function() {
		document.body.style.background = '';
		['#mainmenu', '.main-left', 'header', 'footer', '#topmenu', '#tabmenu'].forEach(function(sel) {
			var el = document.querySelector(sel);
			if (el) el.style.display = '';
		});
		var main = document.querySelector('.main-right') || document.querySelector('#maincontent');
		if (main) { main.style.marginLeft = ''; main.style.padding = ''; main.style.maxWidth = ''; }
	},

	toggleMode: function() {
		this.kissMode = !this.kissMode;
		var toggle = document.getElementById('kiss-toggle');
		if (this.kissMode) {
			toggle.innerHTML = '👁️';
			this.hideChrome();
		} else {
			toggle.innerHTML = '👁️‍🗨️';
			this.showChrome();
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
