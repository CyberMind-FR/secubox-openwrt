'use strict';
'require view';
'require dom';
'require poll';
'require crowdsec-dashboard.api as api';

return view.extend({
	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(link);
		return api.getOverview().catch(function() { return {}; });
	},

	parseCountries: function(data) {
		var countries = {};
		// Handle top_countries_raw (JSON string array)
		if (data.top_countries_raw) {
			try {
				var arr = typeof data.top_countries_raw === 'string'
					? JSON.parse(data.top_countries_raw)
					: data.top_countries_raw;
				if (Array.isArray(arr)) {
					arr.forEach(function(item) {
						if (item.country) countries[item.country] = item.count || 0;
					});
				}
			} catch (e) {}
		}
		// Also handle direct countries object if present
		if (data.countries && typeof data.countries === 'object') {
			for (var k in data.countries) countries[k] = data.countries[k];
		}
		return countries;
	},

	parseAlerts: function(data) {
		var alerts = [];
		// Handle alerts_raw (JSON string array)
		if (data.alerts_raw) {
			try {
				alerts = typeof data.alerts_raw === 'string'
					? JSON.parse(data.alerts_raw)
					: data.alerts_raw;
			} catch (e) {}
		}
		// Also handle direct alerts array if present
		if (Array.isArray(data.alerts) && data.alerts.length > 0) {
			alerts = data.alerts;
		}
		return Array.isArray(alerts) ? alerts : [];
	},

	render: function(data) {
		var self = this;
		var s = data || {};
		s.countries = this.parseCountries(s);
		s.alerts = this.parseAlerts(s);

		var view = E('div', { 'class': 'cs-view' }, [
			// Header
			E('div', { 'class': 'cs-header' }, [
				E('div', { 'class': 'cs-title' }, 'CrowdSec Dashboard'),
				E('div', { 'class': 'cs-status' }, [
					E('span', { 'class': 'cs-dot ' + (s.crowdsec === 'running' ? 'online' : 'offline') }),
					s.crowdsec === 'running' ? 'Running' : 'Stopped'
				])
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats
			E('div', { 'class': 'cs-stats', 'id': 'cs-stats' }, this.renderStats(s)),

			// Two column layout
			E('div', { 'class': 'cs-grid-2' }, [
				// Alerts card
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'Recent Alerts'),
					E('div', { 'class': 'cs-card-body', 'id': 'cs-alerts' }, this.renderAlerts(s.alerts))
				]),
				// Health card
				E('div', { 'class': 'cs-card' }, [
					E('div', { 'class': 'cs-card-header' }, 'System Health'),
					E('div', { 'class': 'cs-card-body' }, this.renderHealth(s))
				])
			]),

			// Geo card
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, 'Threat Origins'),
				E('div', { 'class': 'cs-card-body', 'id': 'cs-geo' }, this.renderGeo(s.countries))
			])
		]);

		poll.add(L.bind(this.pollData, this), 30);
		return view;
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

	renderStats: function(s) {
		var stats = [
			{ label: 'Active Bans', value: s.active_bans || 0, type: (s.active_bans || 0) > 0 ? 'success' : '' },
			{ label: 'Alerts (24h)', value: s.alerts_24h || 0, type: (s.alerts_24h || 0) > 10 ? 'warning' : '' },
			{ label: 'Blocked Packets', value: this.fmt(s.dropped_packets || 0), type: (s.dropped_packets || 0) > 0 ? 'danger' : '' },
			{ label: 'Bouncers', value: s.bouncer_count || 0, type: (s.bouncer_count || 0) > 0 ? 'success' : 'warning' }
		];
		return stats.map(function(st) {
			return E('div', { 'class': 'cs-stat ' + st.type }, [
				E('div', { 'class': 'cs-stat-value' }, String(st.value)),
				E('div', { 'class': 'cs-stat-label' }, st.label)
			]);
		});
	},

	renderAlerts: function(alerts) {
		alerts = Array.isArray(alerts) ? alerts : [];
		if (!alerts.length) {
			return E('div', { 'class': 'cs-empty' }, 'No recent alerts');
		}
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source'),
				E('th', {}, 'Scenario')
			])),
			E('tbody', {}, alerts.slice(0, 8).map(function(a) {
				var src = a.source || {};
				return E('tr', {}, [
					E('td', { 'class': 'cs-time' }, api.formatRelativeTime(a.created_at)),
					E('td', {}, E('span', { 'class': 'cs-ip' }, src.ip || a.source_ip || '-')),
					E('td', {}, E('span', { 'class': 'cs-scenario' }, api.parseScenario(a.scenario)))
				]);
			}))
		]);
	},

	renderHealth: function(s) {
		var checks = [
			{ label: 'CrowdSec', ok: s.crowdsec === 'running' },
			{ label: 'LAPI', ok: s.lapi_status === 'available' },
			{ label: 'CAPI', ok: s.capi_enrolled },
			{ label: 'Bouncer', ok: (s.bouncer_count || 0) > 0 },
			{ label: 'GeoIP', ok: s.geoip_enabled }
		];
		return E('div', { 'class': 'cs-health' }, checks.map(function(c) {
			return E('div', { 'class': 'cs-health-item' }, [
				E('div', { 'class': 'cs-health-icon ' + (c.ok ? 'ok' : 'error') }, c.ok ? '\u2713' : '\u2717'),
				E('div', {}, [
					E('div', { 'class': 'cs-health-label' }, c.label),
					E('div', { 'class': 'cs-health-value' }, c.ok ? 'OK' : 'Error')
				])
			]);
		}));
	},

	renderGeo: function(countries) {
		var entries = Object.entries(countries || {});
		if (!entries.length) {
			return E('div', { 'class': 'cs-empty' }, 'No geographic data');
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

	fmt: function(n) {
		if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
		return String(n);
	},

	pollData: function() {
		var self = this;
		return api.getOverview().then(function(s) {
			s.countries = self.parseCountries(s);
			s.alerts = self.parseAlerts(s);
			var el = document.getElementById('cs-stats');
			if (el) dom.content(el, self.renderStats(s));
			el = document.getElementById('cs-alerts');
			if (el) dom.content(el, self.renderAlerts(s.alerts));
			el = document.getElementById('cs-geo');
			if (el) dom.content(el, self.renderGeo(s.countries));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
