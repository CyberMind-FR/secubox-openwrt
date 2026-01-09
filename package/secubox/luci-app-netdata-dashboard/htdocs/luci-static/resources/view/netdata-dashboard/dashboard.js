'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require netdata-dashboard/api as API';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

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
		var netdataPort = netdataStatus.port || 19999;
		// Use current browser hostname for iframe (not 127.0.0.1 which won't work)
		var netdataUrl = 'http://' + window.location.hostname + ':' + netdataPort;
		var alarmCount = this.countAlarms(alarms);

		// Main wrapper with SecuBox header
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());

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

		wrapper.appendChild(view);
		return wrapper;
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
		var headerStyle = 'margin-bottom: 1.5rem;';
		var titleStyle = 'display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem 0; font-size: 1.5rem;';
		var subtitleStyle = 'margin: 0; color: #8b949e; font-size: 0.9rem;';
		var metaStyle = 'display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem;';

		return E('div', { 'style': headerStyle }, [
			E('div', {}, [
				E('h2', { 'style': titleStyle }, [
					E('span', {}, '📊'),
					_('Netdata Monitoring')
				]),
				E('p', { 'style': subtitleStyle },
					_('Real-time analytics for CPU, memory, disk, and services.'))
			]),
			E('div', { 'style': metaStyle }, [
				this.renderHeaderChip(_('Status'), status.running ? _('Online') : _('Offline'),
					status.running ? 'success' : 'warn'),
				this.renderHeaderChip(_('Version'), status.version || _('unknown')),
				this.renderHeaderChip(_('Uptime'), API.formatUptime(stats.uptime || 0))
			])
		]);
	},

	renderHeaderChip: function(label, value, tone) {
		var chipStyle = 'display: flex; flex-direction: column; padding: 0.5rem 1rem; background: #161b22; border: 1px solid #30363d; border-radius: 8px; min-width: 100px;';
		var labelStyle = 'font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;';
		var valueStyle = 'font-size: 1rem; font-weight: 600;';

		if (tone === 'success') {
			valueStyle += ' color: #3fb950;';
		} else if (tone === 'warn') {
			valueStyle += ' color: #d29922;';
		} else {
			valueStyle += ' color: #f0f6fc;';
		}

		return E('div', { 'style': chipStyle }, [
			E('span', { 'style': labelStyle }, label),
			E('strong', { 'style': valueStyle }, value)
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
		var gridStyle = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;';

		return E('div', { 'style': gridStyle }, [
			this.renderStatCard(_('CPU'), (stats.cpu_percent || 0) + '%', stats.cpu_percent > 80 ? 'danger' : stats.cpu_percent > 50 ? 'warning' : 'good'),
			this.renderStatCard(_('Memory'), (stats.memory_percent || 0) + '%', stats.memory_percent > 80 ? 'danger' : stats.memory_percent > 50 ? 'warning' : 'good'),
			this.renderStatCard(_('Disk'), (stats.disk_percent || 0) + '%', stats.disk_percent > 80 ? 'danger' : stats.disk_percent > 50 ? 'warning' : 'info'),
			this.renderStatCard(_('Load'), stats.load || '0.00', 'info'),
			this.renderStatCard(_('Temp'), (stats.temperature || 0) + '°C', stats.temperature > 70 ? 'danger' : stats.temperature > 50 ? 'warning' : 'good'),
			this.renderStatCard(_('Clients'), stats.clients || 0, 'info')
		]);
	},

	renderStatCard: function(label, value, tone) {
		var cardStyle = 'display: flex; flex-direction: column; align-items: center; padding: 1rem; background: #161b22; border: 1px solid #30363d; border-radius: 8px; text-align: center;';
		var labelStyle = 'font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #6e7681; margin-bottom: 0.5rem;';
		var valueStyle = 'font-size: 1.5rem; font-weight: 700; font-family: monospace;';

		var colors = {
			'good': '#3fb950',
			'warning': '#d29922',
			'danger': '#f85149',
			'info': '#58a6ff'
		};
		valueStyle += ' color: ' + (colors[tone] || '#f0f6fc') + ';';

		return E('div', { 'style': cardStyle }, [
			E('span', { 'style': labelStyle }, label),
			E('strong', { 'style': valueStyle }, String(value))
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
