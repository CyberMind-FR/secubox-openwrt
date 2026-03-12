'use strict';
'require view';
'require poll';
'require ui';
'require ksm-manager/api as KSM';
'require secubox/kiss-theme';

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

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Audit Logs'),
					KissTheme.badge('Security', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Review all key management activities and access events')
			]),

			// Actions
			E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': L.bind(this.handleExportLogs, this)
				}, 'Export Logs (CSV)'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line);',
					'click': function() { window.location.reload(); }
				}, 'Refresh')
			]),

			// Logs Card
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Activity Timeline'),
					KissTheme.badge(logs.length + ' events', 'blue')
				]),
				E('div', { 'id': 'audit-logs-container' }, this.renderLogsTable(logs))
			)
		];

		return KissTheme.wrap(content, 'admin/secubox/ksm/audit');
	},

	renderLogsTable: function(logs) {
		if (!logs || logs.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
				'No audit logs available.');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', { 'style': 'padding: 10px 12px;' }, _('Timestamp')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('User')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Action')),
				E('th', { 'style': 'padding: 10px 12px;' }, _('Resource')),
				E('th', { 'style': 'padding: 10px 12px; text-align: center;' }, _('Status'))
			])),
			E('tbody', {}, logs.map(function(log) {
				var statusColor = log.status === 'success' ? 'green' : 'red';
				var actionColor = 'blue';

				if (log.action && log.action.indexOf('delete') >= 0) {
					actionColor = 'red';
				} else if (log.action && log.action.indexOf('generate') >= 0) {
					actionColor = 'green';
				} else if ((log.action && log.action.indexOf('retrieve') >= 0) || (log.action && log.action.indexOf('view') >= 0)) {
					actionColor = 'orange';
				}

				return E('tr', {}, [
					E('td', { 'style': 'padding: 10px 12px; font-family: monospace; font-size: 12px;' }, KSM.formatTimestamp(log.timestamp)),
					E('td', { 'style': 'padding: 10px 12px;' }, log.user || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px;' }, KissTheme.badge(log.action || 'Unknown', actionColor)),
					E('td', { 'style': 'padding: 10px 12px;' }, log.resource || 'Unknown'),
					E('td', { 'style': 'padding: 10px 12px; text-align: center;' }, KissTheme.badge(log.status || 'Unknown', statusColor))
				]);
			}))
		]);
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
