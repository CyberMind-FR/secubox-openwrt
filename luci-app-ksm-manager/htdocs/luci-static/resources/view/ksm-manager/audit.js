'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require ui';
'require ksm-manager/api as KSM';

return view.extend({
	load: function() {
		return KSM.getAuditLogs(100, 0, '');
	},

	pollLogs: function() {
		return KSM.getAuditLogs(100, 0, '').then(L.bind(function(data) {
			var container = document.getElementById('audit-logs-container');
			if (container) {
				container.innerHTML = '';
				container.appendChild(this.renderLogsTable(data.logs || []));
			}
		}, this));
	},

	render: function(data) {
		var logs = data.logs || [];

		poll.add(L.bind(this.pollLogs, this), 15);

		return E([], [
			E('h2', {}, _('Audit Logs')),
			E('p', {}, _('Review all key management activities and access events.')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-section-node' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleExportLogs, this)
					}, _('Export Logs (CSV)')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': function() { window.location.reload(); }
					}, _('Refresh'))
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Activity Timeline')),
				E('div', { 'class': 'cbi-section-node', 'id': 'audit-logs-container' }, [
					this.renderLogsTable(logs)
				])
			])
		]);
	},

	renderLogsTable: function(logs) {
		if (!logs || logs.length === 0) {
			return E('div', { 'class': 'cbi-value' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('em', {}, _('No audit logs available.'))
			]);
		}

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Timestamp')),
				E('th', { 'class': 'th' }, _('User')),
				E('th', { 'class': 'th' }, _('Action')),
				E('th', { 'class': 'th' }, _('Resource')),
				E('th', { 'class': 'th center' }, _('Status'))
			])
		]);

		logs.forEach(function(log) {
			var statusColor = log.status === 'success' ? 'green' : 'red';
			var actionColor = 'blue';

			if (log.action && log.action.indexOf('delete') >= 0) {
				actionColor = 'red';
			} else if (log.action && log.action.indexOf('generate') >= 0) {
				actionColor = 'green';
			} else if (log.action && log.action.indexOf('retrieve') >= 0 || log.action && log.action.indexOf('view') >= 0) {
				actionColor = 'orange';
			}

			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, KSM.formatTimestamp(log.timestamp)),
				E('td', { 'class': 'td' }, log.user || _('Unknown')),
				E('td', { 'class': 'td' }, [
					E('span', { 'style': 'color: ' + actionColor }, log.action || _('Unknown'))
				]),
				E('td', { 'class': 'td' }, log.resource || _('Unknown')),
				E('td', { 'class': 'td center' }, [
					E('span', { 'style': 'color: ' + statusColor }, log.status || _('Unknown'))
				])
			]));
		});

		return table;
	},

	handleExportLogs: function() {
		KSM.getAuditLogs(1000, 0, '').then(function(data) {
			var logs = data.logs || [];

			if (logs.length === 0) {
				ui.addNotification(null, E('p', _('No logs to export')), 'info');
				return;
			}

			// Create CSV
			var csv = 'Timestamp,User,Action,Resource,Status\n';
			logs.forEach(function(log) {
				csv += [
					log.timestamp || '',
					log.user || '',
					log.action || '',
					log.resource || '',
					log.status || ''
				].join(',') + '\n';
			});

			// Download
			var blob = new Blob([csv], { type: 'text/csv' });
			var url = window.URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = 'ksm-audit-logs-' + new Date().toISOString().split('T')[0] + '.csv';
			a.click();
			window.URL.revokeObjectURL(url);

			ui.addNotification(null, E('p', _('Logs exported successfully')), 'info');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
