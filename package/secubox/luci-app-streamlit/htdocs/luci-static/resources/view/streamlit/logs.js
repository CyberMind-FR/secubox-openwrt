'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require streamlit.api as api';

return view.extend({
	logsData: null,
	autoScroll: true,

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return api.getLogs(200).then(function(logs) {
			self.logsData = logs || [];
			return logs;
		});
	},

	render: function() {
		var self = this;

		// Inject CSS
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('streamlit/dashboard.css')
		});

		var container = E('div', { 'class': 'streamlit-dashboard' }, [
			cssLink,
			this.renderHeader(),
			this.renderLogsCard()
		]);

		// Poll for updates
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateLogs();
			});
		}, 5);

		return container;
	},

	renderHeader: function() {
		var self = this;

		return E('div', { 'class': 'st-header' }, [
			E('div', { 'class': 'st-header-content' }, [
				E('div', { 'class': 'st-logo' }, '\uD83D\uDCDC'),
				E('div', {}, [
					E('h1', { 'class': 'st-title' }, _('SYSTEM LOGS')),
					E('p', { 'class': 'st-subtitle' }, _('Real-time container and application logs'))
				]),
				E('div', { 'class': 'st-btn-group' }, [
					E('button', {
						'class': 'st-btn st-btn-secondary',
						'id': 'btn-autoscroll',
						'click': function() { self.toggleAutoScroll(); }
					}, [E('span', {}, '\u2193'), ' ' + _('Auto-scroll: ON')]),
					E('button', {
						'class': 'st-btn st-btn-primary',
						'click': function() { self.refreshData().then(function() { self.updateLogs(); }); }
					}, [E('span', {}, '\uD83D\uDD04'), ' ' + _('Refresh')])
				])
			])
		]);
	},

	renderLogsCard: function() {
		var logs = this.logsData || [];

		var logsContent;
		if (logs.length > 0) {
			logsContent = E('div', {
				'class': 'st-logs',
				'id': 'logs-container',
				'style': 'max-height: 600px; font-size: 11px;'
			}, logs.map(function(line, idx) {
				return E('div', {
					'class': 'st-logs-line',
					'data-line': idx
				}, self.formatLogLine(line));
			}));
		} else {
			logsContent = E('div', { 'class': 'st-empty' }, [
				E('div', { 'class': 'st-empty-icon' }, '\uD83D\uDCED'),
				E('div', {}, _('No logs available yet')),
				E('p', { 'style': 'font-size: 13px; color: #64748b; margin-top: 8px;' },
					_('Logs will appear here once the Streamlit container is running'))
			]);
		}

		return E('div', { 'class': 'st-card' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83D\uDCBB'),
					' ' + _('Container Logs')
				]),
				E('div', { 'style': 'color: #94a3b8; font-size: 13px;' },
					logs.length + ' ' + _('lines'))
			]),
			E('div', { 'class': 'st-card-body' }, [
				logsContent
			])
		]);
	},

	formatLogLine: function(line) {
		if (!line) return '';

		// Add some color coding based on content
		var color = '#0ff';
		if (line.includes('ERROR') || line.includes('error') || line.includes('Error')) {
			color = '#f43f5e';
		} else if (line.includes('WARNING') || line.includes('warning') || line.includes('Warning')) {
			color = '#f59e0b';
		} else if (line.includes('INFO') || line.includes('info')) {
			color = '#10b981';
		} else if (line.includes('DEBUG') || line.includes('debug')) {
			color = '#64748b';
		}

		return E('span', { 'style': 'color: ' + color }, line);
	},

	updateLogs: function() {
		var self = this;
		var container = document.getElementById('logs-container');
		if (!container) return;

		var logs = this.logsData || [];

		container.innerHTML = '';
		logs.forEach(function(line, idx) {
			container.appendChild(E('div', {
				'class': 'st-logs-line',
				'data-line': idx
			}, self.formatLogLine(line)));
		});

		// Auto-scroll to bottom
		if (this.autoScroll) {
			container.scrollTop = container.scrollHeight;
		}
	},

	toggleAutoScroll: function() {
		this.autoScroll = !this.autoScroll;
		var btn = document.getElementById('btn-autoscroll');
		if (btn) {
			btn.innerHTML = '';
			btn.appendChild(E('span', {}, '\u2193'));
			btn.appendChild(document.createTextNode(' ' + _('Auto-scroll: ') + (this.autoScroll ? 'ON' : 'OFF')));
		}
	}
});
