'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require uci';
'require crowdsec-dashboard.api as api';

/**
 * CrowdSec SOC Dashboard - Overview
 * SOC-compliant design with GeoIP
 * Version 1.2.0
 */

return view.extend({
	title: _('CrowdSec SOC'),

	load: function() {
		return Promise.all([
			api.getOverview().catch(function() { return {}; })
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};

		// Apply dashboard class
		document.body.classList.add('cs-fullwidth');

		var view = E('div', { 'class': 'cs-dashboard cs-theme-classic' }, [
			this.renderHeader(status),
			this.renderNav('overview'),
			E('div', { 'id': 'cs-stats' }, this.renderStats(status)),
			E('div', { 'class': 'cs-grid-2' }, [
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, ['Recent Alerts', E('span', { 'class': 'cs-time' }, 'Last 24h')]),
					E('div', { 'class': 'cs-card-body', 'id': 'recent-alerts' }, this.renderAlerts(status.alerts || []))
				]),
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'Threat Origins'),
					E('div', { 'class': 'cs-card-body', 'id': 'geo-dist' }, this.renderGeo(status.countries || {}))
				])
			]),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					'System Health',
					E('button', { 'class': 'cs-btn cs-btn-sm', 'click': function() { self.runHealthCheck(); } }, 'Test')
				]),
				E('div', { 'class': 'cs-card-body', 'id': 'health-check' }, this.renderHealth(status))
			]),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, 'Threat Types Blocked'),
				E('div', { 'class': 'cs-card-body' }, this.renderThreatTypes(status.top_scenarios_raw))
			])
		]);

		poll.add(L.bind(this.pollData, this), 30);
		return view;
	},

	renderHeader: function(s) {
		return E('div', { 'class': 'cs-header' }, [
			E('div', { 'class': 'cs-title' }, [
				E('svg', { 'viewBox': '0 0 24 24' }, [
					E('path', { 'd': 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z' })
				]),
				'CrowdSec Security Operations'
			]),
			E('div', { 'class': 'cs-status' }, [
				E('span', { 'class': 'cs-status-dot ' + (s.crowdsec === 'running' ? 'online' : 'offline') }),
				s.crowdsec === 'running' ? 'OPERATIONAL' : 'OFFLINE'
			])
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ id: 'overview', label: 'Overview' },
			{ id: 'alerts', label: 'Alerts' },
			{ id: 'decisions', label: 'Decisions' },
			{ id: 'bouncers', label: 'Bouncers' },
			{ id: 'settings', label: 'Settings' }
		];
		return E('div', { 'class': 'cs-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t.id),
				'class': active === t.id ? 'active' : ''
			}, t.label);
		}));
	},

	renderStats: function(d) {
		var totalBans = d.active_bans || d.total_decisions || 0;
		var droppedPkts = parseInt(d.dropped_packets || 0);
		var droppedBytes = parseInt(d.dropped_bytes || 0);
		var stats = [
			{ label: 'Active Bans', value: this.formatNumber(totalBans), type: totalBans > 0 ? 'success' : '' },
			{ label: 'Blocked Packets', value: this.formatNumber(droppedPkts), type: droppedPkts > 0 ? 'danger' : '' },
			{ label: 'Blocked Traffic', value: this.formatBytes(droppedBytes), type: droppedBytes > 0 ? 'danger' : '' },
			{ label: 'Alerts (24h)', value: d.alerts_24h || 0, type: (d.alerts_24h || 0) > 10 ? 'warning' : '' },
			{ label: 'Local Bans', value: d.local_decisions || 0, type: (d.local_decisions || 0) > 0 ? 'warning' : '' },
			{ label: 'Bouncers', value: d.bouncer_count || 0, type: (d.bouncer_count || 0) > 0 ? 'success' : 'warning' }
		];
		return E('div', { 'class': 'cs-stats' }, stats.map(function(s) {
			return E('div', { 'class': 'cs-stat ' + s.type }, [
				E('div', { 'class': 'cs-stat-value' }, String(s.value)),
				E('div', { 'class': 'cs-stat-label' }, s.label)
			]);
		}));
	},

	formatNumber: function(n) {
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return String(n);
	},

	formatBytes: function(bytes) {
		if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
		if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
		if (bytes >= 1024) return (bytes / 1024).toFixed(1) + 'KB';
		return bytes + 'B';
	},

	renderAlerts: function(alerts) {
		if (!alerts || !alerts.length) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '\u2713'),
				'No recent alerts'
			]);
		}
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'Country')
			])),
			E('tbody', {}, alerts.slice(0, 10).map(function(a) {
				var src = a.source || {};
				var ip = src.ip || a.source_ip || 'N/A';
				var country = src.cn || src.country || '';
				return E('tr', {}, [
					E('td', { 'class': 'cs-time' }, api.formatRelativeTime(a.created_at)),
					E('td', {}, E('span', { 'class': 'cs-ip' }, ip)),
					E('td', {}, E('span', { 'class': 'cs-scenario' }, api.parseScenario(a.scenario))),
					E('td', { 'class': 'cs-geo' }, [
						E('span', { 'class': 'cs-flag' }, api.getCountryFlag(country)),
						E('span', { 'class': 'cs-country' }, country)
					])
				]);
			}))
		]);
	},

	renderGeo: function(countries) {
		var entries = Object.entries(countries || {});
		if (!entries.length) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '\u{1F30D}'),
				'No geographic data'
			]);
		}
		entries.sort(function(a, b) { return b[1] - a[1]; });
		return E('div', { 'class': 'cs-geo-grid' }, entries.slice(0, 12).map(function(e) {
			return E('div', { 'class': 'cs-geo-item' }, [
				E('span', { 'class': 'cs-flag' }, api.getCountryFlag(e[0])),
				E('span', { 'class': 'cs-geo-count' }, String(e[1])),
				E('span', { 'class': 'cs-country' }, e[0])
			]);
		}));
	},

	renderHealth: function(d) {
		var checks = [
			{ label: 'CrowdSec', value: d.crowdsec === 'running' ? 'Running' : 'Stopped', ok: d.crowdsec === 'running' },
			{ label: 'LAPI', value: d.lapi_status === 'available' ? 'OK' : 'Down', ok: d.lapi_status === 'available' },
			{ label: 'CAPI', value: d.capi_enrolled ? 'Connected' : 'Disconnected', ok: d.capi_enrolled },
			{ label: 'Bouncer', value: (d.bouncer_count || 0) > 0 ? 'Active' : 'None', ok: (d.bouncer_count || 0) > 0 },
			{ label: 'GeoIP', value: d.geoip_enabled ? 'Enabled' : 'Disabled', ok: d.geoip_enabled },
			{ label: 'Acquisition', value: (d.acquisition_count || 0) + ' sources', ok: (d.acquisition_count || 0) > 0 }
		];
		return E('div', { 'class': 'cs-health' }, checks.map(function(c) {
			return E('div', { 'class': 'cs-health-item' }, [
				E('div', { 'class': 'cs-health-icon ' + (c.ok ? 'ok' : 'error') }, c.ok ? '\u2713' : '\u2717'),
				E('div', {}, [
					E('div', { 'class': 'cs-health-label' }, c.label),
					E('div', { 'class': 'cs-health-value' }, c.value)
				])
			]);
		}));
	},

	renderScenarios: function(scenarios) {
		if (!scenarios || !scenarios.length) {
			return E('div', { 'class': 'cs-empty' }, 'No scenarios loaded');
		}
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Scenario'),
				E('th', {}, 'Status'),
				E('th', {}, 'Type')
			])),
			E('tbody', {}, scenarios.slice(0, 12).map(function(s) {
				var name = s.name || s;
				var enabled = !s.status || s.status.includes('enabled');
				var isLocal = s.status && s.status.includes('local');
				return E('tr', {}, [
					E('td', {}, E('span', { 'class': 'cs-scenario' }, api.parseScenario(name))),
					E('td', {}, E('span', { 'class': 'cs-severity ' + (enabled ? 'low' : 'medium') }, enabled ? 'ENABLED' : 'DISABLED')),
					E('td', { 'class': 'cs-time' }, isLocal ? 'Local' : 'Hub')
				]);
			}))
		]);
	},

	renderThreatTypes: function(rawJson) {
		var self = this;
		var threats = [];
		if (rawJson) {
			try { threats = JSON.parse(rawJson); } catch(e) {}
		}
		if (!threats || !threats.length) {
			return E('div', { 'class': 'cs-empty' }, [
				E('div', { 'class': 'cs-empty-icon' }, '\u{1F6E1}'),
				'No threats blocked yet'
			]);
		}
		var total = threats.reduce(function(sum, t) { return sum + (t.count || 0); }, 0);
		return E('div', { 'class': 'cs-threat-types' }, [
			E('table', { 'class': 'cs-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'Threat Type'),
					E('th', {}, 'Blocked'),
					E('th', { 'style': 'width:40%' }, 'Distribution')
				])),
				E('tbody', {}, threats.map(function(t) {
					var pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
					var severity = t.scenario.includes('bruteforce') ? 'high' :
					               t.scenario.includes('exploit') ? 'critical' :
					               t.scenario.includes('scan') ? 'medium' : 'low';
					return E('tr', {}, [
						E('td', {}, [
							E('span', { 'class': 'cs-threat-icon ' + severity }, self.getThreatIcon(t.scenario)),
							E('span', { 'class': 'cs-scenario' }, t.scenario)
						]),
						E('td', { 'class': 'cs-threat-count' }, self.formatNumber(t.count)),
						E('td', {}, E('div', { 'class': 'cs-bar-wrap' }, [
							E('div', { 'class': 'cs-bar ' + severity, 'style': 'width:' + pct + '%' }),
							E('span', { 'class': 'cs-bar-pct' }, pct + '%')
						]))
					]);
				}))
			]),
			E('div', { 'class': 'cs-threat-total' }, 'Total blocked: ' + self.formatNumber(total))
		]);
	},

	getThreatIcon: function(scenario) {
		if (scenario.includes('bruteforce')) return '\u{1F510}';
		if (scenario.includes('exploit')) return '\u{1F4A3}';
		if (scenario.includes('scan')) return '\u{1F50D}';
		if (scenario.includes('http')) return '\u{1F310}';
		return '\u26A0';
	},

	pollData: function() {
		var self = this;
		return api.getOverview().then(function(data) {
			var el = document.getElementById('cs-stats');
			if (el) dom.content(el, self.renderStats(data));
			el = document.getElementById('recent-alerts');
			if (el) dom.content(el, self.renderAlerts(data.alerts || []));
			el = document.getElementById('geo-dist');
			if (el) dom.content(el, self.renderGeo(data.countries || {}));
		});
	},

	runHealthCheck: function() {
		var self = this;
		var el = document.getElementById('health-check');
		if (el) dom.content(el, E('div', { 'class': 'cs-loading' }, [E('div', { 'class': 'cs-spinner' }), 'Testing...']));
		return api.getHealthCheck().then(function(r) {
			if (el) dom.content(el, self.renderHealth(r));
			self.showToast('Health check completed', 'success');
		}).catch(function(e) {
			self.showToast('Health check failed', 'error');
		});
	},

	showToast: function(msg, type) {
		var t = document.querySelector('.cs-toast');
		if (t) t.remove();
		t = E('div', { 'class': 'cs-toast ' + type }, msg);
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
