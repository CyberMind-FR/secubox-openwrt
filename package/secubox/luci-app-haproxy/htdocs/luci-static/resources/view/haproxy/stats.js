'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy Statistics & Logs - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

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
		var K = KissTheme;

		var statsUrl = 'http://' + window.location.hostname + ':' + (status.stats_port || 8404) + '/stats';
		var statsEnabled = status.stats_enabled;
		var haproxyRunning = status.haproxy_running;

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' }, [
				K.E('div', {}, [
					K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
						K.E('span', {}, '📊'),
						'Statistics'
					]),
					K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
						'View HAProxy statistics and logs')
				])
			]),

			// Stats dashboard
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['📊 ', 'HAProxy Stats Dashboard']),
				statsEnabled && haproxyRunning
					? K.E('div', {}, [
						K.E('p', { 'style': 'margin: 0 0 16px; font-size: 14px;' }, [
							'Stats dashboard available at: ',
							K.E('a', {
								'href': statsUrl,
								'target': '_blank',
								'style': 'color: var(--kiss-blue, #3b82f6); text-decoration: none;'
							}, statsUrl)
						]),
						K.E('iframe', {
							'src': statsUrl,
							'frameborder': '0',
							'style': 'width: 100%; height: 600px; border: 1px solid var(--kiss-line, #1e293b); border-radius: 8px; background: #fff;'
						})
					])
					: K.E('div', { 'style': 'text-align: center; padding: 40px 20px; color: var(--kiss-muted);' }, [
						K.E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '📊'),
						K.E('div', { 'style': 'font-size: 16px;' },
							haproxyRunning
								? 'Stats dashboard is disabled'
								: 'HAProxy is not running'),
						K.E('div', { 'style': 'font-size: 13px; margin-top: 6px;' },
							haproxyRunning
								? 'Enable it in Settings to view statistics'
								: 'Start the service to view statistics')
					])
			]),

			// Logs section
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;' }, [
					K.E('div', { 'class': 'kiss-card-title', 'style': 'margin: 0;' }, ['📝 ', 'Logs']),
					K.E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
						K.E('select', {
							'id': 'log-lines',
							'style': 'padding: 8px 12px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 13px;',
							'change': function() { self.refreshLogs(); }
						}, [
							K.E('option', { 'value': '50' }, 'Last 50 lines'),
							K.E('option', { 'value': '100', 'selected': true }, 'Last 100 lines'),
							K.E('option', { 'value': '200' }, 'Last 200 lines'),
							K.E('option', { 'value': '500' }, 'Last 500 lines')
						]),
						K.E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding: 8px 14px; font-size: 13px;',
							'click': function() { self.refreshLogs(); }
						}, '🔄 Refresh')
					])
				]),
				K.E('div', {
					'id': 'logs-container',
					'style': 'background: #0d1117; color: #c9d1d9; font-family: monospace; font-size: 12px; padding: 16px; border-radius: 8px; max-height: 400px; overflow-y: auto; white-space: pre-wrap; border: 1px solid var(--kiss-line, #1e293b);'
				}, logsData.logs || 'No logs available')
			])
		]);

		return KissTheme.wrap(content, 'admin/services/haproxy/stats');
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
