'use strict';
'require view';
'require dom';
'require ui';
'require secubox-crowdsec/api as api';

return view.extend({
	api: null,

	load: function() {
		this.api = new api();
		return this.api.getAlerts(100, '7d');
	},

	formatDate: function(timestamp) {
		if (!timestamp) return '-';
		try {
			var date = new Date(timestamp);
			return date.toLocaleString();
		} catch(e) {
			return timestamp;
		}
	},

	renderAlertsTable: function(alerts) {
		var self = this;

		if (!alerts || alerts.length === 0) {
			return E('p', { 'class': 'alert-message' }, 'No alerts in the selected period');
		}

		var rows = alerts.map(function(a) {
			var sourceIp = '-';
			if (a.source && a.source.ip) {
				sourceIp = a.source.ip;
			} else if (a.source_ip) {
				sourceIp = a.source_ip;
			}

			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, self.formatDate(a.created_at || a.timestamp)),
				E('td', { 'class': 'td' }, sourceIp),
				E('td', { 'class': 'td' }, a.scenario || '-'),
				E('td', { 'class': 'td' }, String(a.events_count || a.events || 0)),
				E('td', { 'class': 'td' }, a.message || '-')
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Time'),
				E('th', { 'class': 'th' }, 'Source IP'),
				E('th', { 'class': 'th' }, 'Scenario'),
				E('th', { 'class': 'th' }, 'Events'),
				E('th', { 'class': 'th' }, 'Message')
			])
		].concat(rows));
	},

	render: function(data) {
		var alerts = data.alerts || [];
		var self = this;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'CrowdSec Alerts'),
			E('div', { 'class': 'cbi-map-descr' }, 'Security alerts detected by CrowdSec'),

			// Filter Controls
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Filter'),
				E('div', { 'style': 'margin-bottom: 15px;' }, [
					E('label', {}, 'Time Period: '),
					E('select', { 'id': 'alert-period', 'class': 'cbi-input-select', 'style': 'margin-right: 15px;' }, [
						E('option', { 'value': '1h' }, 'Last hour'),
						E('option', { 'value': '24h' }, 'Last 24 hours'),
						E('option', { 'value': '7d', 'selected': 'selected' }, 'Last 7 days'),
						E('option', { 'value': '30d' }, 'Last 30 days')
					]),
					E('label', {}, 'Limit: '),
					E('select', { 'id': 'alert-limit', 'class': 'cbi-input-select', 'style': 'margin-right: 15px;' }, [
						E('option', { 'value': '25' }, '25'),
						E('option', { 'value': '50' }, '50'),
						E('option', { 'value': '100', 'selected': 'selected' }, '100'),
						E('option', { 'value': '200' }, '200')
					]),
					E('button', {
						'class': 'btn cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, function() {
							var period = document.getElementById('alert-period').value;
							var limit = parseInt(document.getElementById('alert-limit').value);

							return this.api.getAlerts(limit, period).then(function(res) {
								var table = self.renderAlertsTable(res.alerts || []);
								var container = document.getElementById('alerts-table');
								dom.content(container, table);
								var title = document.getElementById('alerts-count');
								if (title) title.textContent = 'Alerts (' + (res.alerts ? res.alerts.length : 0) + ')';
							});
						})
					}, 'Refresh')
				])
			]),

			// Alerts Table
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title', 'id': 'alerts-count' }, 'Alerts (' + alerts.length + ')'),
				E('div', { 'id': 'alerts-table' }, this.renderAlertsTable(alerts))
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
