'use strict';
'require view';
'require dom';
'require ui';
'require secubox-crowdsec/api as api';

return view.extend({
	api: null,

	load: function() {
		this.api = new api();
		return this.api.getDecisions();
	},

	renderDecisionsTable: function(decisions) {
		var self = this;

		if (!decisions || decisions.length === 0) {
			return E('p', { 'class': 'alert-message' }, 'No active decisions');
		}

		var rows = decisions.map(function(d) {
			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, d.value || d.ip || '-'),
				E('td', { 'class': 'td' }, d.type || 'ban'),
				E('td', { 'class': 'td' }, d.scope || 'ip'),
				E('td', { 'class': 'td' }, d.duration || '-'),
				E('td', { 'class': 'td' }, d.origin || '-'),
				E('td', { 'class': 'td' }, d.scenario || d.reason || '-'),
				E('td', { 'class': 'td' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-remove',
						'click': ui.createHandlerFn(self, function(ev) {
							return self.api.deleteDecision(d.value || d.ip, d.id).then(function(res) {
								if (res.success) {
									ui.addNotification(null, E('p', res.message), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', res.error), 'warning');
								}
							});
						})
					}, 'Delete')
				])
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'IP/Range'),
				E('th', { 'class': 'th' }, 'Type'),
				E('th', { 'class': 'th' }, 'Scope'),
				E('th', { 'class': 'th' }, 'Duration'),
				E('th', { 'class': 'th' }, 'Origin'),
				E('th', { 'class': 'th' }, 'Reason'),
				E('th', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
	},

	render: function(data) {
		var decisions = data.decisions || [];
		var self = this;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'CrowdSec Decisions'),
			E('div', { 'class': 'cbi-map-descr' }, 'Active bans and security decisions'),

			// Add Decision Form
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Add Manual Ban'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'IP Address'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'ban-ip', 'class': 'cbi-input-text', 'placeholder': '192.168.1.100' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Duration'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'ban-duration', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '1h' }, '1 hour'),
							E('option', { 'value': '4h' }, '4 hours'),
							E('option', { 'value': '24h', 'selected': 'selected' }, '24 hours'),
							E('option', { 'value': '7d' }, '7 days'),
							E('option', { 'value': '30d' }, '30 days'),
							E('option', { 'value': '365d' }, '1 year')
						])
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Reason'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'ban-reason', 'class': 'cbi-input-text', 'placeholder': 'Manual ban via LuCI', 'value': 'Manual ban via LuCI' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ' '),
					E('div', { 'class': 'cbi-value-field' }, [
						E('button', {
							'class': 'btn cbi-button cbi-button-apply',
							'click': ui.createHandlerFn(this, function() {
								var ip = document.getElementById('ban-ip').value;
								var duration = document.getElementById('ban-duration').value;
								var reason = document.getElementById('ban-reason').value;

								if (!ip) {
									ui.addNotification(null, E('p', 'Please enter an IP address'), 'warning');
									return;
								}

								return this.api.addDecision(ip, duration, reason, 'ban').then(function(res) {
									if (res.success) {
										ui.addNotification(null, E('p', res.message), 'info');
										window.location.reload();
									} else {
										ui.addNotification(null, E('p', res.error), 'warning');
									}
								});
							})
						}, 'Add Ban')
					])
				])
			]),

			// Active Decisions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Active Decisions (' + decisions.length + ')'),
				E('div', { 'id': 'decisions-table' }, this.renderDecisionsTable(decisions))
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
