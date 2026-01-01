'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require netdata-dashboard/api as API';
'require secubox-theme/theme as Theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return Promise.all([
			API.getNetdataStatus(),
			API.getNetdataAlarms(),
			API.getStats(),
			API.getSecuboxLogs()
		]);
	},

	render: function(data) {
		var netdataStatus = data[0] || {};
		var alarms = data[1] || {};
		var stats = data[2] || {};
		var logs = (data[3] && data[3].entries) || [];

		var isRunning = netdataStatus.running || false;
		var netdataUrl = netdataStatus.url || 'http://127.0.0.1:19999';
		var alarmCount = this.countAlarms(alarms);

		var view = E('div', { 'class': 'netdata-dashboard secubox-netdata' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('netdata-dashboard/dashboard.css') }),
			this.renderHeader(netdataStatus, stats),
			this.renderControls(isRunning),
			this.renderQuickStats(stats),
			this.renderAlarmCard(alarmCount, netdataUrl),
			this.renderLogCard(logs),
			this.renderEmbed(isRunning, netdataUrl)
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return Promise.all([
				API.getNetdataStatus(),
				API.getStats(),
				API.getSecuboxLogs()
			]).then(L.bind(function(refreshData) {
				// Update quick stats/logs in place if needed
			}, this));
		}, this), 5);

		return view;
	},

	countAlarms: function(alarms) {
		var count = 0;
		if (alarms.alarms && typeof alarms.alarms === 'object') {
			Object.keys(alarms.alarms).forEach(function(key) {
				var alarm = alarms.alarms[key];
				if (alarm.status && alarm.status !== 'CLEAR')
					count++;
			});
		}
		return count;
	},

	renderHeader: function(status, stats) {
		return E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '📊'),
					_('Netdata Monitoring')
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					_('Real-time analytics for CPU, memory, disk, and services.'))
			]),
			E('div', { 'class': 'sh-header-meta' }, [
				this.renderHeaderChip(_('Status'), status.running ? _('Online') : _('Offline'),
					status.running ? 'success' : 'warn'),
				this.renderHeaderChip(_('Version'), status.version || _('Unknown')),
				this.renderHeaderChip(_('Uptime'), API.formatUptime(stats.uptime || 0))
			])
		]);
	},

	renderHeaderChip: function(label, value, tone) {
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-label' }, label),
			E('strong', {}, value)
		]);
	},

	renderControls: function(isRunning) {
		return E('div', { 'class': 'nd-control-bar' }, [
			E('button', {
				'class': 'sh-btn-primary',
				'click': L.bind(this.handleStart, this),
				'disabled': isRunning
			}, ['▶️ ', _('Start')]),
			E('button', {
				'class': 'sh-btn-secondary',
				'click': L.bind(this.handleRestart, this),
				'disabled': !isRunning
			}, ['🔁 ', _('Restart')]),
			E('button', {
				'class': 'sh-btn-secondary',
				'click': L.bind(this.handleStop, this),
				'disabled': !isRunning
			}, ['⏹ ', _('Stop')])
		]);
	},

	renderQuickStats: function(stats) {
		return E('div', { 'class': 'nd-quick-stats' }, [
			this.renderStatCard(_('CPU'), (stats.cpu_percent || 0) + '%'),
			this.renderStatCard(_('Memory'), (stats.memory_percent || 0) + '%'),
			this.renderStatCard(_('Disk'), (stats.disk_percent || 0) + '%'),
			this.renderStatCard(_('Load'), stats.load || '0.00'),
			this.renderStatCard(_('Temp'), (stats.temperature || 0) + '°C'),
			this.renderStatCard(_('Clients'), stats.clients || 0)
		]);
	},

	renderStatCard: function(label, value) {
		return E('div', { 'class': 'nd-stat-card' }, [
			E('span', { 'class': 'nd-stat-label' }, label),
			E('strong', { 'class': 'nd-stat-value' }, value)
		]);
	},

	renderAlarmCard: function(count, url) {
		return E('div', { 'class': 'nd-card nd-alarms' }, [
			E('div', { 'class': 'nd-card-header' }, [
				E('div', { 'class': 'nd-card-title' }, ['🚨', _('Netdata alarms')]),
				E('span', { 'class': 'nd-chip' + (count > 0 ? ' danger' : '') }, count + ' ' + _('active'))
			]),
			count > 0 ? E('p', { 'class': 'nd-card-text' },
				_('Netdata reports %d active alarms. Open the dashboard to investigate.').format(count)) :
				E('p', { 'class': 'nd-card-text' }, _('No active alarms detected.')),
			E('div', { 'class': 'nd-card-actions' }, [
				E('a', { 'href': url + '#menu_alarms', 'class': 'sh-btn-secondary', 'target': '_blank' }, ['🔍 ', _('View alarms')])
			])
		]);
	},

	renderLogCard: function(entries) {
		return E('div', { 'class': 'nd-card nd-logs' }, [
			E('div', { 'class': 'nd-card-header' }, [
				E('div', { 'class': 'nd-card-title' }, ['🗒️', _('SecuBox Log Tail')]),
				E('button', {
					'class': 'sh-btn-secondary',
					'click': L.bind(this.handleSnapshot, this)
				}, ['📎 ', _('Add snapshot')])
			]),
			entries && entries.length ? E('pre', { 'class': 'nd-log-output' },
				entries.join('\n')) : E('p', { 'class': 'nd-card-text' }, _('Log file empty.'))
		]);
	},

	renderEmbed: function(isRunning, url) {
		if (!isRunning) {
			return E('div', { 'class': 'nd-card nd-embed off' }, [
				E('div', { 'class': 'nd-card-title' }, ['⚠️ ', _('Netdata is offline')]),
				E('p', { 'class': 'nd-card-text' }, _('Start the service to access real-time charts.'))
			]);
		}

		return E('div', { 'class': 'nd-card nd-embed' }, [
			E('div', { 'class': 'nd-card-header' }, [
				E('div', { 'class': 'nd-card-title' }, ['📈', _('Live dashboard')]),
				E('a', { 'href': url, 'target': '_blank', 'class': 'sh-btn-secondary' }, _('Open in tab'))
			]),
			E('div', { 'class': 'nd-iframe-wrapper' }, [
				E('iframe', {
					'src': url,
					'frameborder': '0',
					'allow': 'fullscreen'
				})
			])
		]);
	},

	handleStart: function(ev) {
		var btn = ev.target;
		btn.disabled = true;
		btn.textContent = _('Starting...');

		API.startNetdata().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('Netdata started successfully')), 'info');
				setTimeout(function() {
					window.location.reload();
				}, 2000);
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to start Netdata')), 'error');
				btn.disabled = false;
				btn.textContent = _('Start Netdata');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			btn.disabled = false;
			btn.textContent = _('Start Netdata');
		});
	},

	handleStop: function(ev) {
		ui.showModal(_('Stop Netdata'), [
			E('p', {}, _('Are you sure you want to stop Netdata monitoring?')),
			E('p', { 'style': 'color: #856404; background: #fff3cd; padding: 0.75em; border-radius: 4px;' },
				_('This will stop all real-time monitoring and data collection.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						this.doStop(ev.target);
					}, this)
				}, _('Stop Netdata'))
			])
		]);
	},

	doStop: function(btn) {
		btn.disabled = true;
		btn.textContent = _('Stopping...');

		API.stopNetdata().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('Netdata stopped')), 'info');
				setTimeout(function() {
					window.location.reload();
				}, 1500);
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to stop Netdata')), 'error');
				btn.disabled = false;
				btn.textContent = _('Stop Netdata');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			btn.disabled = false;
			btn.textContent = _('Stop Netdata');
		});
	},

	handleRestart: function(ev) {
		var btn = ev.target;
		btn.disabled = true;
		btn.textContent = _('Restarting...');

		API.restartNetdata().then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('Netdata restarted successfully')), 'info');
				setTimeout(function() {
					window.location.reload();
				}, 3000);
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to restart Netdata')), 'error');
				btn.disabled = false;
				btn.textContent = _('Restart Netdata');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			btn.disabled = false;
			btn.textContent = _('Restart Netdata');
		});
	},

	handleSnapshot: function() {
		var self = this;
		ui.showModal(_('Collecting snapshot'), [
			E('p', {}, _('Aggregating dmesg and logread into SecuBox log…')),
			E('div', { 'class': 'spinning' })
		]);
		API.collectDebugSnapshot().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Snapshot appended to /var/log/seccubox.log.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, (result && result.error) || _('Failed to collect snapshot.')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
