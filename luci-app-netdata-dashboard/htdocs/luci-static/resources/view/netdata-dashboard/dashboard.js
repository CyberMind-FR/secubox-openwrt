'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require netdata-dashboard/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getNetdataStatus(),
			API.getNetdataAlarms(),
			API.getStats()
		]);
	},

	render: function(data) {
		var netdataStatus = data[0] || {};
		var alarms = data[1] || {};
		var stats = data[2] || {};

		var isRunning = netdataStatus.running || false;
		var netdataUrl = netdataStatus.url || 'http://127.0.0.1:19999';

		// Count active alarms
		var alarmCount = 0;
		if (alarms.alarms && typeof alarms.alarms === 'object') {
			Object.keys(alarms.alarms).forEach(function(key) {
				var alarm = alarms.alarms[key];
				if (alarm.status && alarm.status !== 'CLEAR') {
					alarmCount++;
				}
			});
		}

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Netdata Dashboard')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Real-time system monitoring and performance metrics powered by Netdata.')),

			// Control Panel
			E('div', { 'class': 'cbi-section', 'style': 'margin-bottom: 1em;' }, [
				E('div', { 'style': 'display: grid; grid-template-columns: 2fr 1fr; gap: 1em;' }, [
					// Status Card
					E('div', {
						'style': 'background: ' + (isRunning ? '#d4edda' : '#f8d7da') + '; border-left: 4px solid ' + (isRunning ? '#28a745' : '#dc3545') + '; padding: 1em; border-radius: 4px;'
					}, [
						E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
							E('div', {}, [
								E('div', { 'style': 'font-size: 0.9em; color: #666; margin-bottom: 0.25em;' }, _('Service Status')),
								E('div', { 'style': 'font-size: 1.5em; font-weight: bold; color: ' + (isRunning ? '#155724' : '#721c24') + ';' },
									isRunning ? _('RUNNING') : _('STOPPED'))
							]),
							E('div', { 'style': 'text-align: right;' }, [
								E('div', { 'style': 'font-size: 0.9em; color: #666; margin-bottom: 0.25em;' }, _('Version')),
								E('div', { 'style': 'font-size: 1.1em; font-weight: bold;' }, netdataStatus.version || 'Unknown')
							]),
							E('div', { 'style': 'text-align: right;' }, [
								E('div', { 'style': 'font-size: 0.9em; color: #666; margin-bottom: 0.25em;' }, _('Port')),
								E('div', { 'style': 'font-size: 1.1em; font-weight: bold;' }, (netdataStatus.port || 19999).toString())
							])
						])
					]),

					// Control Buttons
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 0.5em;' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': L.bind(this.handleStart, this),
							'disabled': isRunning,
							'style': 'flex: 1;'
						}, _('Start Netdata')),
						E('button', {
							'class': 'cbi-button cbi-button-reset',
							'click': L.bind(this.handleRestart, this),
							'disabled': !isRunning,
							'style': 'flex: 1;'
						}, _('Restart Netdata')),
						E('button', {
							'class': 'cbi-button cbi-button-negative',
							'click': L.bind(this.handleStop, this),
							'disabled': !isRunning,
							'style': 'flex: 1;'
						}, _('Stop Netdata'))
					])
				])
			]),

			// Alarms Card
			alarmCount > 0 ? E('div', {
				'class': 'cbi-section',
				'style': 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 1em; margin-bottom: 1em;'
			}, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 1em;' }, [
					E('div', { 'style': 'font-size: 2em;' }, '⚠️'),
					E('div', { 'style': 'flex: 1;' }, [
						E('strong', {}, _('Active Alarms: %d').format(alarmCount)),
						E('p', { 'style': 'margin: 0.25em 0 0 0; color: #666;' },
							_('Netdata has detected %d active alarm(s). Check the dashboard for details.').format(alarmCount))
					]),
					E('a', {
						'href': netdataUrl + '#menu_alarms',
						'target': '_blank',
						'class': 'cbi-button cbi-button-action'
					}, _('View Alarms'))
				])
			]) : null,

			// Quick Stats Preview
			E('div', { 'class': 'cbi-section', 'style': 'margin-bottom: 1em;' }, [
				E('h3', { 'style': 'margin-top: 0;' }, _('Quick Stats')),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1em;' }, [
					this.renderStatCard(_('CPU'), stats.cpu_percent + '%', '#0088cc'),
					this.renderStatCard(_('Memory'), stats.memory_percent + '%', '#17a2b8'),
					this.renderStatCard(_('Disk'), stats.disk_percent + '%', '#6610f2'),
					this.renderStatCard(_('Load'), stats.load || '0.00', '#e83e8c'),
					this.renderStatCard(_('Temp'), stats.temperature + '°C', '#fd7e14'),
					this.renderStatCard(_('Uptime'), API.formatUptime(stats.uptime || 0), '#28a745')
				])
			]),

			// Netdata Dashboard Iframe
			isRunning ? E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'style': 'margin-top: 0;' }, _('Netdata Real-Time Dashboard')),
				E('div', {
					'style': 'position: relative; width: 100%; height: 0; padding-bottom: 75%; background: #f5f5f5; border-radius: 4px; overflow: hidden;'
				}, [
					E('iframe', {
						'src': netdataUrl,
						'style': 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;',
						'frameborder': '0',
						'allow': 'fullscreen'
					})
				]),
				E('div', { 'style': 'margin-top: 1em; padding: 0.75em; background: #e8f4f8; border-radius: 4px;' }, [
					E('strong', {}, _('Tip:')),
					' ',
					_('Use the Netdata interface above for detailed real-time monitoring. Click '),
					E('a', { 'href': netdataUrl, 'target': '_blank' }, _('here')),
					_(' to open in a new window.')
				])
			]) : E('div', { 'class': 'cbi-section' }, [
				E('div', {
					'style': 'text-align: center; padding: 3em; background: #f8d7da; border-radius: 4px; border-left: 4px solid #dc3545;'
				}, [
					E('div', { 'style': 'font-size: 3em; margin-bottom: 0.5em;' }, '⚠️'),
					E('h3', {}, _('Netdata is not running')),
					E('p', { 'style': 'color: #666; margin-bottom: 1.5em;' },
						_('Start the Netdata service to access real-time monitoring dashboards.')),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'font-size: 1.1em; padding: 0.75em 2em;',
						'click': L.bind(this.handleStart, this)
					}, _('Start Netdata Now'))
				])
			])
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return Promise.all([
				API.getNetdataStatus(),
				API.getStats()
			]).then(L.bind(function(refreshData) {
				// Could update stats display here
			}, this));
		}, this), 5);

		return view;
	},

	renderStatCard: function(label, value, color) {
		return E('div', {
			'style': 'background: white; border-left: 4px solid ' + color + '; padding: 1em; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'
		}, [
			E('div', { 'style': 'font-size: 0.85em; color: #666; margin-bottom: 0.25em;' }, label),
			E('div', { 'style': 'font-size: 1.5em; font-weight: bold; color: ' + color + ';' }, value)
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

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
