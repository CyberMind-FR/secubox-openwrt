'use strict';
'require view';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callGetStatus = rpc.declare({
	object: 'luci.interceptor',
	method: 'status',
	expect: {}
});

var PILLARS = [
	{ id: 'wpad', name: 'WPAD', icon: '🌐', desc: 'Auto-proxy discovery' },
	{ id: 'mitm', name: 'MITM Proxy', icon: '🛡️', desc: 'External WAF' },
	{ id: 'insider_waf', name: 'Insider WAF', icon: '🔒', desc: 'LAN threat detection' },
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

		if (!data || !data.success) {
			return KissTheme.wrap([
				E('div', { 'class': 'kiss-card kiss-panel-red' }, [
					E('div', { 'class': 'kiss-card-title' }, '⚠️ InterceptoR Status Unavailable'),
					E('p', { 'style': 'color: var(--kiss-muted);' }, 'Failed to load status. Check if RPCD service is running.')
				])
			], 'admin/secubox/interceptor/overview');
		}

		var summary = data.summary || {};
		var score = summary.health_score || 0;
		var pillarsActive = summary.pillars_active || 0;

		var content = [
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
		];

		return KissTheme.wrap(content, 'admin/secubox/interceptor/overview');
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
			case 'insider_waf':
				stats.push('Insider threats: ' + (data.insider_threats || 0));
				stats.push('Blocked: ' + (data.blocked_clients || 0));
				if (data.exfil_attempts > 0) stats.push('⚠️ Exfil: ' + data.exfil_attempts);
				if (data.dns_anomalies > 0) stats.push('DNS: ' + data.dns_anomalies);
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

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
