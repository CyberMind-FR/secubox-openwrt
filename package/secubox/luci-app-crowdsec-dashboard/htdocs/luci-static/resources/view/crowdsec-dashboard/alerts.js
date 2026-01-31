'use strict';
'require view';
'require dom';
'require poll';
'require crowdsec-dashboard.api as api';

return view.extend({
	alerts: [],

	load: function() {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(link);
		return api.getAlerts(100).catch(function() { return []; });
	},

	render: function(data) {
		var self = this;
		this.alerts = Array.isArray(data) ? data : (data.alerts || []);

		var view = E('div', { 'class': 'cs-view' }, [
			E('div', { 'class': 'cs-header' }, [
				E('div', { 'class': 'cs-title' }, 'CrowdSec Alerts'),
				E('div', { 'class': 'cs-status' }, [
					E('span', { 'class': 'cs-badge ' + (this.alerts.length > 0 ? 'warning' : 'success') },
						this.alerts.length + ' alerts')
				])
			]),
			this.renderNav('alerts'),
			E('div', { 'class': 'cs-stats' }, this.renderStats()),
			E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					'Security Alerts',
					E('input', {
						'type': 'text', 'class': 'cs-input', 'id': 'alert-search',
						'placeholder': 'Search...', 'style': 'width: 150px;',
						'keyup': function() { self.filterAlerts(); }
					})
				]),
				E('div', { 'class': 'cs-card-body', 'id': 'alerts-list' }, this.renderAlerts(this.alerts))
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
				'href': L.url('admin/secubox/services/crowdsec/' + t.id),
				'class': active === t.id ? 'active' : ''
			}, t.label);
		}));
	},

	renderStats: function() {
		var scenarios = {}, countries = {};
		this.alerts.forEach(function(a) {
			var s = a.scenario || 'unknown';
			scenarios[s] = (scenarios[s] || 0) + 1;
			var c = (a.source && (a.source.cn || a.source.country)) || 'Unknown';
			countries[c] = (countries[c] || 0) + 1;
		});

		var topScenario = Object.entries(scenarios).sort(function(a, b) { return b[1] - a[1]; })[0];

		return [
			E('div', { 'class': 'cs-stat warning' }, [
				E('div', { 'class': 'cs-stat-value' }, String(this.alerts.length)),
				E('div', { 'class': 'cs-stat-label' }, 'Total Alerts')
			]),
			E('div', { 'class': 'cs-stat' }, [
				E('div', { 'class': 'cs-stat-value' }, String(Object.keys(scenarios).length)),
				E('div', { 'class': 'cs-stat-label' }, 'Scenarios')
			]),
			E('div', { 'class': 'cs-stat' }, [
				E('div', { 'class': 'cs-stat-value' }, String(Object.keys(countries).length)),
				E('div', { 'class': 'cs-stat-label' }, 'Countries')
			]),
			E('div', { 'class': 'cs-stat danger' }, [
				E('div', { 'class': 'cs-stat-value' }, topScenario ? api.parseScenario(topScenario[0]).split(' ')[0] : '-'),
				E('div', { 'class': 'cs-stat-label' }, 'Top Threat')
			])
		];
	},

	renderAlerts: function(alerts) {
		if (!alerts.length) {
			return E('div', { 'class': 'cs-empty' }, 'No alerts');
		}
		return E('table', { 'class': 'cs-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source'),
				E('th', {}, 'Country'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'Events')
			])),
			E('tbody', {}, alerts.slice(0, 50).map(function(a) {
				var src = a.source || {};
				var country = src.cn || src.country || '';
				return E('tr', {}, [
					E('td', { 'class': 'cs-time' }, api.formatRelativeTime(a.created_at)),
					E('td', {}, E('span', { 'class': 'cs-ip' }, src.ip || '-')),
					E('td', {}, [
						E('span', { 'class': 'cs-flag' }, api.getCountryFlag(country)),
						' ', country
					]),
					E('td', {}, E('span', { 'class': 'cs-scenario' }, api.parseScenario(a.scenario))),
					E('td', {}, String(a.events_count || 0))
				]);
			}))
		]);
	},

	filterAlerts: function() {
		var query = (document.getElementById('alert-search').value || '').toLowerCase();
		var filtered = this.alerts.filter(function(a) {
			if (!query) return true;
			var src = a.source || {};
			var fields = [src.ip, a.scenario, src.country, src.cn].join(' ').toLowerCase();
			return fields.includes(query);
		});
		var el = document.getElementById('alerts-list');
		if (el) dom.content(el, this.renderAlerts(filtered));
	},

	pollData: function() {
		var self = this;
		return api.getAlerts(100).then(function(data) {
			self.alerts = Array.isArray(data) ? data : (data.alerts || []);
			var el = document.getElementById('alerts-list');
			if (el) dom.content(el, self.renderAlerts(self.alerts));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
