'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard.api as api';

/**
 * CrowdSec SOC Dashboard - Overview
 * Minimal SOC-compliant design with GeoIP
 * Version 1.0.0
 */

return view.extend({
	title: _('CrowdSec SOC'),

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/soc.css');
		document.head.appendChild(link);
		document.body.classList.add('cs-soc-fullwidth');

		return api.getOverview().catch(function() { return {}; });
	},

	render: function(data) {
		var self = this;
		var status = data || {};

		var view = E('div', { 'class': 'soc-dashboard' }, [
			this.renderHeader(status),
			this.renderNav('overview'),
			E('div', { 'id': 'soc-stats' }, this.renderStats(status)),
			E('div', { 'class': 'soc-grid-2' }, [
				E('div', { 'class': 'soc-card' }, [
					E('div', { 'class': 'soc-card-header' }, ['Recent Alerts', E('span', { 'class': 'soc-time' }, 'Last 24h')]),
					E('div', { 'class': 'soc-card-body', 'id': 'recent-alerts' }, this.renderAlerts(status.alerts || []))
				]),
				E('div', { 'class': 'soc-card' }, [
					E('div', { 'class': 'soc-card-header' }, 'Threat Origins'),
					E('div', { 'class': 'soc-card-body', 'id': 'geo-dist' }, this.renderGeo(status.countries || {}))
				])
			]),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, [
					'System Health',
					E('button', { 'class': 'soc-btn soc-btn-sm', 'click': function() { self.runHealthCheck(); } }, 'Test')
				]),
				E('div', { 'class': 'soc-card-body', 'id': 'health-check' }, this.renderHealth(status))
			]),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, 'Active Scenarios'),
				E('div', { 'class': 'soc-card-body' }, this.renderScenarios(status.scenarios || []))
			])
		]);

		poll.add(L.bind(this.pollData, this), 30);
		return view;
	},

	renderHeader: function(s) {
		return E('div', { 'class': 'soc-header' }, [
			E('div', { 'class': 'soc-title' }, [
				E('svg', { 'viewBox': '0 0 24 24' }, [
					E('path', { 'd': 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z' })
				]),
				'CrowdSec Security Operations'
			]),
			E('div', { 'class': 'soc-status' }, [
				E('span', { 'class': 'soc-status-dot ' + (s.crowdsec === 'running' ? 'online' : 'offline') }),
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
		return E('div', { 'class': 'soc-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t.id),
				'class': active === t.id ? 'active' : ''
			}, t.label);
		}));
	},

	renderStats: function(d) {
		var totalBans = (d.total_decisions || 0) + (d.capi_decisions || 0) + (d.local_decisions || 0);
		// Use total_decisions if set, otherwise sum capi + local
		if (d.total_decisions > 0) totalBans = d.total_decisions;
		var stats = [
			{ label: 'CAPI Blocklist', value: d.capi_decisions || 0, type: (d.capi_decisions || 0) > 0 ? 'success' : '' },
			{ label: 'Local Bans', value: d.local_decisions || 0, type: (d.local_decisions || 0) > 0 ? 'danger' : '' },
			{ label: 'Alerts (24h)', value: d.alerts_24h || 0, type: (d.alerts_24h || 0) > 10 ? 'warning' : '' },
			{ label: 'Scenarios', value: d.scenario_count || 0, type: 'success' },
			{ label: 'Bouncers', value: d.bouncer_count || 0, type: (d.bouncer_count || 0) > 0 ? 'success' : 'warning' },
			{ label: 'Countries', value: Object.keys(d.countries || {}).length, type: '' }
		];
		return E('div', { 'class': 'soc-stats' }, stats.map(function(s) {
			return E('div', { 'class': 'soc-stat ' + s.type }, [
				E('div', { 'class': 'soc-stat-value' }, String(s.value)),
				E('div', { 'class': 'soc-stat-label' }, s.label)
			]);
		}));
	},

	renderAlerts: function(alerts) {
		if (!alerts || !alerts.length) {
			return E('div', { 'class': 'soc-empty' }, [
				E('div', { 'class': 'soc-empty-icon' }, '\u2713'),
				'No recent alerts'
			]);
		}
		return E('table', { 'class': 'soc-table' }, [
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
					E('td', { 'class': 'soc-time' }, api.formatRelativeTime(a.created_at)),
					E('td', {}, E('span', { 'class': 'soc-ip' }, ip)),
					E('td', {}, E('span', { 'class': 'soc-scenario' }, api.parseScenario(a.scenario))),
					E('td', { 'class': 'soc-geo' }, [
						E('span', { 'class': 'soc-flag' }, api.getCountryFlag(country)),
						E('span', { 'class': 'soc-country' }, country)
					])
				]);
			}))
		]);
	},

	renderGeo: function(countries) {
		var entries = Object.entries(countries || {});
		if (!entries.length) {
			return E('div', { 'class': 'soc-empty' }, [
				E('div', { 'class': 'soc-empty-icon' }, '\u{1F30D}'),
				'No geographic data'
			]);
		}
		entries.sort(function(a, b) { return b[1] - a[1]; });
		return E('div', { 'class': 'soc-geo-grid' }, entries.slice(0, 12).map(function(e) {
			return E('div', { 'class': 'soc-geo-item' }, [
				E('span', { 'class': 'soc-flag' }, api.getCountryFlag(e[0])),
				E('span', { 'class': 'soc-geo-count' }, String(e[1])),
				E('span', { 'class': 'soc-country' }, e[0])
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
		return E('div', { 'class': 'soc-health' }, checks.map(function(c) {
			return E('div', { 'class': 'soc-health-item' }, [
				E('div', { 'class': 'soc-health-icon ' + (c.ok ? 'ok' : 'error') }, c.ok ? '\u2713' : '\u2717'),
				E('div', {}, [
					E('div', { 'class': 'soc-health-label' }, c.label),
					E('div', { 'class': 'soc-health-value' }, c.value)
				])
			]);
		}));
	},

	renderScenarios: function(scenarios) {
		if (!scenarios || !scenarios.length) {
			return E('div', { 'class': 'soc-empty' }, 'No scenarios loaded');
		}
		return E('table', { 'class': 'soc-table' }, [
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
					E('td', {}, E('span', { 'class': 'soc-scenario' }, api.parseScenario(name))),
					E('td', {}, E('span', { 'class': 'soc-severity ' + (enabled ? 'low' : 'medium') }, enabled ? 'ENABLED' : 'DISABLED')),
					E('td', { 'class': 'soc-time' }, isLocal ? 'Local' : 'Hub')
				]);
			}))
		]);
	},

	pollData: function() {
		var self = this;
		return api.getOverview().then(function(data) {
			var el = document.getElementById('soc-stats');
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
		if (el) dom.content(el, E('div', { 'class': 'soc-loading' }, [E('div', { 'class': 'soc-spinner' }), 'Testing...']));
		return api.getHealthCheck().then(function(r) {
			if (el) dom.content(el, self.renderHealth(r));
			self.showToast('Health check completed', 'success');
		}).catch(function(e) {
			self.showToast('Health check failed', 'error');
		});
	},

	showToast: function(msg, type) {
		var t = document.querySelector('.soc-toast');
		if (t) t.remove();
		t = E('div', { 'class': 'soc-toast ' + type }, msg);
		document.body.appendChild(t);
		setTimeout(function() { t.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
