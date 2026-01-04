'use strict';
'require view';
'require secubox-admin.api as API';
'require poll';

return view.extend({
	selectedService: 'system',

	load: function() {
		return API.getLogs(this.selectedService, 100);
	},

	render: function(logsData) {
		var self = this;
		var logs = logsData.logs || '';

		var container = E('div', { 'class': 'secubox-logs' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('h2', {}, 'System Logs'),
			E('p', {}, 'View logs from system services and applications'),

			E('div', { 'class': 'logs-controls' }, [
				E('select', {
					'class': 'service-selector',
					'change': function(ev) {
						self.changeService(ev.target.value);
					}
				}, [
					E('option', { 'value': 'system' }, 'System'),
					E('option', { 'value': 'kernel' }, 'Kernel'),
					E('option', { 'value': 'dockerd' }, 'Docker'),
					E('option', { 'value': 'dnsmasq' }, 'DNS'),
					E('option', { 'value': 'firewall' }, 'Firewall')
				]),
				E('button', {
					'class': 'btn btn-primary',
					'click': function() { self.refreshLogs(); }
				}, 'Refresh'),
				E('button', {
					'class': 'btn',
					'click': function() { self.downloadLogs(); }
				}, 'Download')
			]),

			E('div', { 'class': 'logs-viewer card' }, [
				E('pre', { 'id': 'log-content', 'class': 'log-content' }, logs || 'No logs available')
			])
		]);

		// Auto-refresh every 10 seconds
		poll.add(L.bind(this.pollLogs, this), 10);

		return container;
	},

	changeService: function(service) {
		this.selectedService = service;
		this.refreshLogs();
	},

	refreshLogs: function() {
		var self = this;
		API.getLogs(this.selectedService, 100).then(function(logsData) {
			var logContent = document.getElementById('log-content');
			if (logContent) {
				logContent.textContent = logsData.logs || 'No logs available';
				// Scroll to bottom
				logContent.scrollTop = logContent.scrollHeight;
			}
		});
	},

	pollLogs: function() {
		return API.getLogs(this.selectedService, 100).then(L.bind(function(logsData) {
			var logContent = document.getElementById('log-content');
			if (logContent) {
				logContent.textContent = logsData.logs || 'No logs available';
			}
		}, this));
	},

	downloadLogs: function() {
		var logContent = document.getElementById('log-content');
		if (logContent) {
			var blob = new Blob([logContent.textContent], { type: 'text/plain' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = this.selectedService + '-logs.txt';
			a.click();
			URL.revokeObjectURL(url);
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
