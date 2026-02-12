'use strict';
'require view';
'require dom';
'require poll';
'require crowdsec-dashboard.api as api';
'require secubox/kiss-theme';

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
		// Handle countries field - can be array or object
		if (data.countries) {
			if (Array.isArray(data.countries)) {
				// Array of {country, count} objects
				data.countries.forEach(function(item) {
					if (item.country) countries[item.country] = item.count || 0;
				});
			} else if (typeof data.countries === 'object') {
				// Plain object {US: 10, FR: 5}
				for (var k in data.countries) countries[k] = data.countries[k];
			}
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

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'CrowdSec Dashboard'),
					KissTheme.badge(s.crowdsec === 'running' ? 'RUNNING' : 'STOPPED',
						s.crowdsec === 'running' ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Collaborative security engine')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'cs-stats', 'style': 'margin: 20px 0;' }, this.renderStats(s)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Alerts card
				KissTheme.card('Recent Alerts', E('div', { 'id': 'cs-alerts' }, this.renderAlerts(s.alerts))),
				// Health card
				KissTheme.card('System Health', this.renderHealth(s))
			]),

			// Geo card
			KissTheme.card('Threat Origins', E('div', { 'id': 'cs-geo' }, this.renderGeo(s.countries)))
		];

		poll.add(L.bind(this.pollData, this), 30);
		return KissTheme.wrap(content, 'admin/secubox/security/crowdsec/overview');
	},

	renderNav: function(active) {
		var tabs = [
			{ id: 'overview', label: 'Overview' },
			{ id: 'alerts', label: 'Alerts' },
			{ id: 'decisions', label: 'Decisions' },
			{ id: 'bouncers', label: 'Bouncers' },
			{ id: 'settings', label: 'Settings' }
		];
		return E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--kiss-line); padding-bottom: 12px;' }, tabs.map(function(t) {
			var isActive = active === t.id;
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t.id),
				'style': 'padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; ' +
					(isActive ? 'background: rgba(0,200,83,0.1); color: var(--kiss-green); border: 1px solid rgba(0,200,83,0.3);' :
						'color: var(--kiss-muted); border: 1px solid transparent;')
			}, t.label);
		}));
	},

	renderStats: function(s) {
		var c = KissTheme.colors;
		var stats = [
			{ label: 'Active Bans', value: s.active_bans || 0, color: (s.active_bans || 0) > 0 ? c.green : c.muted },
			{ label: 'Alerts (24h)', value: s.alerts_24h || 0, color: (s.alerts_24h || 0) > 10 ? c.orange : c.muted },
			{ label: 'WAF Threats', value: s.waf_threats_today || 0, color: (s.waf_threats_today || 0) > 0 ? c.orange : c.muted },
			{ label: 'WAF Auto-Bans', value: s.waf_bans_today || 0, color: (s.waf_bans_today || 0) > 0 ? c.red : c.muted }
		];
		return stats.map(function(st) {
			return KissTheme.stat(st.value, st.label, st.color);
		});
	},

	renderAlerts: function(alerts) {
		alerts = Array.isArray(alerts) ? alerts : [];
		if (!alerts.length) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No recent alerts');
		}
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source'),
				E('th', {}, 'Scenario')
			])),
			E('tbody', {}, alerts.slice(0, 8).map(function(a) {
				var src = a.source || {};
				return E('tr', {}, [
					E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, api.formatRelativeTime(a.created_at)),
					E('td', {}, E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, src.ip || a.source_ip || '-')),
					E('td', {}, E('span', { 'style': 'font-size: 12px;' }, api.parseScenario(a.scenario)))
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
			{ label: 'GeoIP', ok: s.geoip_enabled },
			{ label: 'WAF Auto-Ban', ok: s.waf_autoban_enabled, value: s.waf_sensitivity }
		];
		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(c) {
			var valueText = c.value ? c.value : (c.ok ? 'OK' : 'Disabled');
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);' }, [
				E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
					(c.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
					c.ok ? '\u2713' : '\u2717'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, c.label),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, valueText)
				])
			]);
		}));
	},

	renderGeo: function(countries) {
		var entries = Object.entries(countries || {});
		if (!entries.length) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No geographic data');
		}
		entries.sort(function(a, b) { return b[1] - a[1]; });
		return E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;' }, entries.slice(0, 12).map(function(e) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 6px;' }, [
				E('span', { 'style': 'font-size: 18px;' }, api.getCountryFlag(e[0])),
				E('span', { 'style': 'font-family: monospace; font-weight: 600; color: var(--kiss-orange);' }, String(e[1])),
				E('span', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, e[0])
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
