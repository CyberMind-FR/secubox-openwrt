'use strict';
'require view';
'require ui';
'require poll';
'require dom';
'require voip.api as api';

return view.extend({
	load: function() {
		return api.getStatus();
	},

	renderStatusTable: function(status) {
		var containerState = status.container_state || 'not_installed';
		var running = status.running === 'true';
		var asteriskUp = status.asterisk === 'true';
		var trunkRegistered = status.trunk_registered === 'true';
		var activeCalls = parseInt(status.active_calls) || 0;
		var extensions = parseInt(status.extensions) || 0;

		var stateClass = running ? 'success' : (containerState === 'installed' ? 'warning' : 'danger');
		var stateText = running ? 'Running' : (containerState === 'installed' ? 'Stopped' : 'Not Installed');

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, 'Container Status'),
				E('td', { 'class': 'td' }, [
					E('span', { 'class': 'badge ' + stateClass }, stateText)
				])
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, 'Asterisk PBX'),
				E('td', { 'class': 'td' }, [
					E('span', { 'class': 'badge ' + (asteriskUp ? 'success' : 'danger') },
						asteriskUp ? 'Running' : 'Stopped')
				])
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, 'SIP Trunk'),
				E('td', { 'class': 'td' }, [
					E('span', { 'class': 'badge ' + (trunkRegistered ? 'success' : 'warning') },
						trunkRegistered ? 'Registered' : 'Not Registered')
				])
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, 'Active Calls'),
				E('td', { 'class': 'td' }, String(activeCalls))
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, 'Extensions'),
				E('td', { 'class': 'td' }, String(extensions))
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, 'SIP Port'),
				E('td', { 'class': 'td' }, status.sip_port || '5060')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, 'Domain'),
				E('td', { 'class': 'td' }, status.domain || '(not configured)')
			])
		]);
	},

	renderActions: function(status) {
		var self = this;
		var containerState = status.container_state || 'not_installed';
		var running = status.running === 'true';

		var buttons = [];

		if (containerState === 'not_installed') {
			buttons.push(E('button', {
				'class': 'btn cbi-button cbi-button-positive',
				'click': ui.createHandlerFn(this, function() {
					return this.handleInstall();
				})
			}, 'Install VoIP'));
		} else {
			if (running) {
				buttons.push(E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': ui.createHandlerFn(this, function() {
						return this.handleStop();
					})
				}, 'Stop'));
			} else {
				buttons.push(E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function() {
						return this.handleStart();
					})
				}, 'Start'));
			}

			buttons.push(' ');

			buttons.push(E('button', {
				'class': 'btn cbi-button cbi-button-remove',
				'click': ui.createHandlerFn(this, function() {
					return this.handleUninstall();
				})
			}, 'Uninstall'));
		}

		return E('div', { 'class': 'cbi-page-actions' }, buttons);
	},

	handleInstall: function() {
		var self = this;

		ui.showModal('Installing VoIP', [
			E('p', { 'class': 'spinning' }, 'Installing Asterisk PBX in LXC container... This may take several minutes.')
		]);

		return api.install().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', res.message || 'VoIP installed successfully'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Installation failed: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Installation failed: ' + e.message), 'error');
		});
	},

	handleStart: function() {
		var self = this;

		return api.start().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', 'VoIP started'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Start failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleStop: function() {
		return api.stop().then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', 'VoIP stopped'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Stop failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleUninstall: function() {
		if (!confirm('Are you sure you want to uninstall VoIP? All data will be lost.')) {
			return Promise.resolve();
		}

		ui.showModal('Uninstalling VoIP', [
			E('p', { 'class': 'spinning' }, 'Removing VoIP container...')
		]);

		return api.uninstall().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', 'VoIP uninstalled'), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Uninstall failed: ' + (res.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Uninstall failed: ' + e.message), 'error');
		});
	},

	renderLogs: function() {
		var logsContainer = E('pre', {
			'id': 'voip-logs',
			'style': 'max-height: 300px; overflow-y: auto; background: #1a1a1a; color: #0f0; padding: 10px; font-family: monospace; font-size: 12px;'
		}, 'Loading logs...');

		api.getLogs(50).then(function(res) {
			logsContainer.textContent = res.logs || 'No logs available';
		});

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Recent Logs'),
			logsContainer,
			E('button', {
				'class': 'btn cbi-button',
				'click': function() {
					api.getLogs(100).then(function(res) {
						document.getElementById('voip-logs').textContent = res.logs || 'No logs available';
					});
				}
			}, 'Refresh Logs')
		]);
	},

	render: function(status) {
		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'VoIP Overview'),
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Status'),
				this.renderStatusTable(status)
			]),
			this.renderActions(status),
			this.renderLogs()
		]);

		poll.add(L.bind(function() {
			return api.getStatus().then(L.bind(function(newStatus) {
				var table = this.renderStatusTable(newStatus);
				var oldTable = view.querySelector('.cbi-section table');
				if (oldTable) {
					dom.content(oldTable.parentNode, table);
				}
			}, this));
		}, this), 5);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
