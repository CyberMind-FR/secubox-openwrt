'use strict';
'require view';
'require rpc';
'require poll';

var callGetStatus = rpc.declare({
	object: 'luci.interceptor',
	method: 'status',
	expect: {}
});

var PILLAR_ICONS = {
	wpad: '&#x1F310;',      // Globe for WPAD
	mitm: '&#x1F6E1;',      // Shield for mitmproxy
	cdn_cache: '&#x1F4BE;', // Disk for CDN Cache
	cookie_tracker: '&#x1F36A;', // Cookie for Cookie Tracker
	api_failover: '&#x26A1;'    // Lightning for API Failover
};

var PILLAR_NAMES = {
	wpad: 'WPAD Redirector',
	mitm: 'MITM Proxy',
	cdn_cache: 'CDN Cache',
	cookie_tracker: 'Cookie Tracker',
	api_failover: 'API Failover'
};

return view.extend({
	load: function() {
		return callGetStatus();
	},

	renderHealthScore: function(data) {
		var summary = data.summary || {};
		var score = summary.health_score || 0;
		var pillars_active = summary.pillars_active || 0;
		var pillars_total = summary.pillars_total || 5;

		var scoreColor = score >= 80 ? '#4caf50' : score >= 50 ? '#ff9800' : '#f44336';

		return E('div', { 'class': 'cbi-section', 'style': 'text-align: center; padding: 30px;' }, [
			E('div', { 'style': 'font-size: 64px; margin-bottom: 10px;' }, [
				E('span', { 'style': 'color: ' + scoreColor + '; font-weight: bold;' }, score + '%')
			]),
			E('div', { 'style': 'font-size: 18px; color: #888;' },
				'InterceptoR Health Score'),
			E('div', { 'style': 'font-size: 14px; color: #666; margin-top: 10px;' },
				pillars_active + ' of ' + pillars_total + ' pillars active')
		]);
	},

	renderPillarCard: function(id, data, name, icon) {
		var pillarData = data[id] || {};
		var enabled = pillarData.enabled || false;
		var running = pillarData.running !== undefined ? pillarData.running : enabled;

		var statusColor = running ? '#4caf50' : '#f44336';
		var statusText = running ? 'Active' : 'Inactive';

		var statsHtml = [];

		// Build stats based on pillar type
		switch(id) {
			case 'wpad':
				if (pillarData.dhcp_configured) {
					statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
						'DHCP: Configured'));
				}
				if (pillarData.enforce_enabled) {
					statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #4caf50;' },
						'Enforcement: ON'));
				}
				break;

			case 'mitm':
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
					'Threats Today: ' + (pillarData.threats_today || 0)));
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
					'Active: ' + (pillarData.active_connections || 0)));
				break;

			case 'cdn_cache':
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
					'Hit Ratio: ' + (pillarData.hit_ratio || 0) + '%'));
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
					'Saved: ' + (pillarData.saved_mb || 0) + ' MB'));
				if (pillarData.offline_mode) {
					statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #ff9800;' },
						'OFFLINE MODE'));
				}
				break;

			case 'cookie_tracker':
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
					'Cookies: ' + (pillarData.total_cookies || 0)));
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #f44336;' },
					'Trackers: ' + (pillarData.trackers_detected || 0)));
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
					'Blocked: ' + (pillarData.blocked || 0)));
				break;

			case 'api_failover':
				statsHtml.push(E('div', { 'style': 'font-size: 12px; color: #888;' },
					'Stale Serves: ' + (pillarData.stale_serves || 0)));
				break;
		}

		return E('div', {
			'style': 'background: #222; border-radius: 8px; padding: 20px; margin: 10px; ' +
				'min-width: 200px; flex: 1; text-align: center; ' +
				'border-left: 4px solid ' + statusColor + ';'
		}, [
			E('div', { 'style': 'font-size: 32px; margin-bottom: 10px;' }, icon),
			E('div', { 'style': 'font-size: 16px; font-weight: bold; margin-bottom: 5px;' }, name),
			E('div', { 'style': 'font-size: 12px; color: ' + statusColor + '; margin-bottom: 10px;' },
				statusText),
			E('div', {}, statsHtml)
		]);
	},

	render: function(data) {
		if (!data || !data.success) {
			return E('div', { 'class': 'alert-message warning' },
				'Failed to load InterceptoR status');
		}

		var pillars = [
			{ id: 'wpad', name: PILLAR_NAMES.wpad, icon: PILLAR_ICONS.wpad },
			{ id: 'mitm', name: PILLAR_NAMES.mitm, icon: PILLAR_ICONS.mitm },
			{ id: 'cdn_cache', name: PILLAR_NAMES.cdn_cache, icon: PILLAR_ICONS.cdn_cache },
			{ id: 'cookie_tracker', name: PILLAR_NAMES.cookie_tracker, icon: PILLAR_ICONS.cookie_tracker },
			{ id: 'api_failover', name: PILLAR_NAMES.api_failover, icon: PILLAR_ICONS.api_failover }
		];

		var cards = pillars.map(function(p) {
			return this.renderPillarCard(p.id, data, p.name, p.icon);
		}, this);

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'style': 'margin-bottom: 5px;' }, 'SecuBox InterceptoR'),
			E('p', { 'style': 'color: #888; margin-bottom: 20px;' },
				'The Gandalf Proxy - Transparent traffic interception and protection'),

			// Health Score
			this.renderHealthScore(data),

			// Pillars Grid
			E('h3', { 'style': 'margin-top: 30px;' }, 'Interception Pillars'),
			E('div', {
				'style': 'display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 15px;'
			}, cards),

			// Quick Links
			E('h3', { 'style': 'margin-top: 30px;' }, 'Quick Links'),
			E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;' }, [
				E('a', {
					'href': '/cgi-bin/luci/admin/secubox/network-tweaks',
					'class': 'cbi-button',
					'style': 'text-decoration: none;'
				}, 'Network Tweaks (WPAD)'),
				E('a', {
					'href': '/cgi-bin/luci/admin/secubox/mitmproxy/overview',
					'class': 'cbi-button',
					'style': 'text-decoration: none;'
				}, 'mitmproxy'),
				E('a', {
					'href': '/cgi-bin/luci/admin/secubox/cdn-cache/overview',
					'class': 'cbi-button',
					'style': 'text-decoration: none;'
				}, 'CDN Cache'),
				E('a', {
					'href': '/cgi-bin/luci/admin/secubox/crowdsec/overview',
					'class': 'cbi-button',
					'style': 'text-decoration: none;'
				}, 'CrowdSec')
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
