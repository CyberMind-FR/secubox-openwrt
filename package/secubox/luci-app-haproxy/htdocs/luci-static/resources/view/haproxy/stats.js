'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

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

		var content = E('div', { 'class': 'haproxy-dashboard' }, [
			// Page Header
			E('div', { 'class': 'hp-page-header' }, [
				E('div', {}, [
					E('h1', { 'class': 'hp-page-title' }, [
						E('span', { 'class': 'hp-page-title-icon' }, '\u{1F4CA}'),
						'Statistics'
					]),
					E('p', { 'class': 'hp-page-subtitle' }, 'View HAProxy statistics and logs')
				]),
				E('a', {
					'href': L.url('admin/services/haproxy/overview'),
					'class': 'hp-btn hp-btn-secondary'
				}, ['\u2190', ' Back to Overview'])
			]),

			// Stats dashboard
			E('div', { 'class': 'hp-card' }, [
				E('div', { 'class': 'hp-card-header' }, [
					E('div', { 'class': 'hp-card-title' }, [
						E('span', { 'class': 'hp-card-title-icon' }, '\u{1F4CA}'),
						'HAProxy Stats Dashboard'
					])
				]),
				E('div', { 'class': 'hp-card-body' },
					statsEnabled && haproxyRunning
						? [
							E('p', { 'style': 'margin-bottom: 16px;' }, [
								'Stats dashboard available at: ',
								E('a', { 'href': statsUrl, 'target': '_blank', 'class': 'hp-link' }, statsUrl)
							]),
							E('iframe', {
								'class': 'haproxy-stats-frame',
								'src': statsUrl,
								'frameborder': '0',
								'style': 'width: 100%; height: 600px; border: 1px solid var(--hp-border, #333); border-radius: 8px;'
							})
						]
						: [
							E('div', { 'class': 'hp-empty' }, [
								E('div', { 'class': 'hp-empty-icon' }, '\u{1F4CA}'),
								E('div', { 'class': 'hp-empty-text' },
									haproxyRunning
										? 'Stats dashboard is disabled'
										: 'HAProxy is not running'),
								E('div', { 'class': 'hp-empty-hint' },
									haproxyRunning
										? 'Enable it in Settings to view statistics'
										: 'Start the service to view statistics')
							])
						]
				)
			]),

			// Logs section
			E('div', { 'class': 'hp-card' }, [
				E('div', { 'class': 'hp-card-header' }, [
					E('div', { 'class': 'hp-card-title' }, [
						E('span', { 'class': 'hp-card-title-icon' }, '\u{1F4DD}'),
						'Logs'
					]),
					E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
						E('select', {
							'id': 'log-lines',
							'class': 'hp-form-input',
							'style': 'width: auto; padding: 6px 12px;',
							'change': function() { self.refreshLogs(); }
						}, [
							E('option', { 'value': '50' }, 'Last 50 lines'),
							E('option', { 'value': '100', 'selected': true }, 'Last 100 lines'),
							E('option', { 'value': '200' }, 'Last 200 lines'),
							E('option', { 'value': '500' }, 'Last 500 lines')
						]),
						E('button', {
							'class': 'hp-btn hp-btn-primary hp-btn-sm',
							'click': function() { self.refreshLogs(); }
						}, ['\u{1F504}', ' Refresh'])
					])
				]),
				E('div', { 'class': 'hp-card-body' }, [
					E('div', {
						'id': 'logs-container',
						'class': 'haproxy-logs',
						'style': 'background: #0d1117; color: #c9d1d9; font-family: monospace; font-size: 12px; padding: 16px; border-radius: 8px; max-height: 400px; overflow-y: auto; white-space: pre-wrap;'
					}, logsData.logs || 'No logs available')
				])
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
		`);
		content.insertBefore(style, content.firstChild);

		return KissTheme.wrap(content, 'admin/services/haproxy');
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
