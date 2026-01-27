'use strict';
'require view';
'require dom';
'require poll';
'require crowdsec-dashboard.api as api';

/**
 * CrowdSec SOC - Alerts View
 * Security alerts timeline with GeoIP
 */

return view.extend({
	title: _('Alerts'),
	alerts: [],

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/soc.css');
		document.head.appendChild(link);
		document.body.classList.add('cs-soc-fullwidth');
		return api.getAlerts(100);
	},

	render: function(data) {
		var self = this;
		this.alerts = (data && data.alerts) || data || [];

		return E('div', { 'class': 'soc-dashboard' }, [
			this.renderHeader(),
			this.renderNav('alerts'),
			E('div', { 'class': 'soc-stats', 'style': 'margin-bottom: 20px;' }, this.renderAlertStats()),
			E('div', { 'class': 'soc-card' }, [
				E('div', { 'class': 'soc-card-header' }, [
					'Security Alerts (' + this.alerts.length + ')',
					E('input', {
						'type': 'text',
						'class': 'soc-btn',
						'placeholder': 'Search...',
						'id': 'alert-search',
						'style': 'width: 200px;',
						'keyup': function() { self.filterAlerts(); }
					})
				]),
				E('div', { 'class': 'soc-card-body', 'id': 'alerts-list' }, this.renderAlerts(this.alerts))
			])
		]);
	},

	renderHeader: function() {
		return E('div', { 'class': 'soc-header' }, [
			E('div', { 'class': 'soc-title' }, [
				E('svg', { 'viewBox': '0 0 24 24' }, [E('path', { 'd': 'M12 2L2 7v10l10 5 10-5V7L12 2z' })]),
				'CrowdSec Security Operations'
			]),
			E('div', { 'class': 'soc-status' }, [E('span', { 'class': 'soc-status-dot online' }), 'ALERTS'])
		]);
	},

	renderNav: function(active) {
		var tabs = ['overview', 'alerts', 'decisions', 'bouncers', 'settings'];
		return E('div', { 'class': 'soc-nav' }, tabs.map(function(t) {
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t),
				'class': active === t ? 'active' : ''
			}, t.charAt(0).toUpperCase() + t.slice(1));
		}));
	},

	renderAlertStats: function() {
		var scenarios = {}, countries = {};
		this.alerts.forEach(function(a) {
			var s = a.scenario || 'unknown';
			scenarios[s] = (scenarios[s] || 0) + 1;
			var c = a.source?.cn || a.source?.country || 'Unknown';
			countries[c] = (countries[c] || 0) + 1;
		});

		var topScenario = Object.entries(scenarios).sort(function(a, b) { return b[1] - a[1]; })[0];
		var topCountry = Object.entries(countries).sort(function(a, b) { return b[1] - a[1]; })[0];

		return [
			E('div', { 'class': 'soc-stat' }, [
				E('div', { 'class': 'soc-stat-value' }, String(this.alerts.length)),
				E('div', { 'class': 'soc-stat-label' }, 'Total Alerts')
			]),
			E('div', { 'class': 'soc-stat' }, [
				E('div', { 'class': 'soc-stat-value' }, String(Object.keys(scenarios).length)),
				E('div', { 'class': 'soc-stat-label' }, 'Scenarios')
			]),
			E('div', { 'class': 'soc-stat' }, [
				E('div', { 'class': 'soc-stat-value' }, String(Object.keys(countries).length)),
				E('div', { 'class': 'soc-stat-label' }, 'Countries')
			]),
			E('div', { 'class': 'soc-stat danger' }, [
				E('div', { 'class': 'soc-stat-value' }, topScenario ? api.parseScenario(topScenario[0]).split(' ')[0] : '-'),
				E('div', { 'class': 'soc-stat-label' }, 'Top Threat')
			])
		];
	},

	renderAlerts: function(alerts) {
		if (!alerts.length) {
			return E('div', { 'class': 'soc-empty' }, [
				E('div', { 'class': 'soc-empty-icon' }, '\u2713'),
				'No alerts'
			]);
		}

		return E('table', { 'class': 'soc-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source IP'),
				E('th', {}, 'Country'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'Events'),
				E('th', {}, 'Severity')
			])),
			E('tbody', {}, alerts.slice(0, 50).map(function(a) {
				var src = a.source || {};
				var country = src.cn || src.country || '';
				var severity = a.scenario?.includes('bf') ? 'high' :
				               a.scenario?.includes('cve') ? 'critical' : 'medium';
				return E('tr', {}, [
					E('td', { 'class': 'soc-time' }, api.formatRelativeTime(a.created_at)),
					E('td', {}, E('span', { 'class': 'soc-ip' }, src.ip || 'N/A')),
					E('td', { 'class': 'soc-geo' }, [
						E('span', { 'class': 'soc-flag' }, api.getCountryFlag(country)),
						E('span', { 'class': 'soc-country' }, country)
					]),
					E('td', {}, E('span', { 'class': 'soc-scenario' }, api.parseScenario(a.scenario))),
					E('td', {}, String(a.events_count || 0)),
					E('td', {}, E('span', { 'class': 'soc-severity ' + severity }, severity.toUpperCase()))
				]);
			}))
		]);
	},

	filterAlerts: function() {
		var query = (document.getElementById('alert-search')?.value || '').toLowerCase();
		var filtered = this.alerts.filter(function(a) {
			if (!query) return true;
			var fields = [a.source?.ip, a.scenario, a.source?.country, a.source?.cn].join(' ').toLowerCase();
			return fields.includes(query);
		});
		var el = document.getElementById('alerts-list');
		if (el) dom.content(el, this.renderAlerts(filtered));
	},

	handleSaveApply: null, handleSave: null, handleReset: null
});
