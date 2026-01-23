'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.status(),
			api.getLogs(100)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var logsData = data[1] || {};

		var statsUrl = 'http://' + window.location.hostname + ':' + (status.stats_port || 8404) + '/stats';
		var statsEnabled = status.stats_enabled;
		var haproxyRunning = status.haproxy_running;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Statistics'),
			E('p', {}, 'View HAProxy statistics and logs.'),

			// Stats dashboard
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'HAProxy Stats Dashboard'),
				statsEnabled && haproxyRunning
					? E('div', {}, [
						E('p', {}, [
							'Stats dashboard available at: ',
							E('a', { 'href': statsUrl, 'target': '_blank' }, statsUrl)
						]),
						E('iframe', {
							'class': 'haproxy-stats-frame',
							'src': statsUrl,
							'frameborder': '0'
						})
					])
					: E('div', { 'style': 'padding: 2rem; text-align: center; color: #666' }, [
						E('p', {}, haproxyRunning
							? 'Stats dashboard is disabled. Enable it in Settings.'
							: 'HAProxy is not running. Start the service to view statistics.')
					])
			]),

			// Logs section
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Logs'),
				E('div', { 'style': 'margin-bottom: 1rem' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { self.refreshLogs(); }
					}, 'Refresh Logs'),
					E('select', {
						'id': 'log-lines',
						'class': 'cbi-input-select',
						'style': 'margin-left: 1rem; width: auto',
						'change': function() { self.refreshLogs(); }
					}, [
						E('option', { 'value': '50' }, 'Last 50 lines'),
						E('option', { 'value': '100', 'selected': true }, 'Last 100 lines'),
						E('option', { 'value': '200' }, 'Last 200 lines'),
						E('option', { 'value': '500' }, 'Last 500 lines')
					])
				]),
				E('div', {
					'id': 'logs-container',
					'class': 'haproxy-logs'
				}, logsData.logs || 'No logs available')
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
		`);
		view.insertBefore(style, view.firstChild);

		return view;
	},

	refreshLogs: function() {
		var lines = parseInt(document.getElementById('log-lines').value) || 100;
		var container = document.getElementById('logs-container');

		container.textContent = 'Loading logs...';

		return api.getLogs(lines).then(function(data) {
			container.textContent = data.logs || 'No logs available';
			container.scrollTop = container.scrollHeight;
		}).catch(function(err) {
			container.textContent = 'Error loading logs: ' + err.message;
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
