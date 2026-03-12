'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.gotosocial',
	method: 'status',
	expect: {}
});

var callInstall = rpc.declare({
	object: 'luci.gotosocial',
	method: 'install',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.gotosocial',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.gotosocial',
	method: 'stop',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.gotosocial',
	method: 'restart',
	expect: {}
});

var callEmancipate = rpc.declare({
	object: 'luci.gotosocial',
	method: 'emancipate',
	params: ['domain', 'tor', 'dns', 'mesh'],
	expect: {}
});

var callRevoke = rpc.declare({
	object: 'luci.gotosocial',
	method: 'revoke',
	expect: {}
});

var callBackup = rpc.declare({
	object: 'luci.gotosocial',
	method: 'backup',
	expect: {}
});

var callLogs = rpc.declare({
	object: 'luci.gotosocial',
	method: 'logs',
	params: ['lines'],
	expect: {}
});

return view.extend({
	status: null,

	load: function() {
		return callStatus();
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/gotosocial/overview' },
			{ name: 'Settings', path: 'admin/services/gotosocial/settings' },
			{ name: 'Users', path: 'admin/services/gotosocial/users' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var containerOk = status.container_running;
		var serviceOk = status.service_running;

		return [
			KissTheme.stat(containerOk ? 'UP' : 'DOWN', 'Container', containerOk ? c.green : c.red),
			KissTheme.stat(serviceOk ? 'UP' : 'DOWN', 'Service', serviceOk ? c.green : c.red),
			KissTheme.stat(status.version || '-', 'Version', c.blue),
			KissTheme.stat(status.users || 0, 'Users', c.purple)
		];
	},

	renderHealth: function(status) {
		var checks = [
			{ label: 'Container', ok: status.container_running, value: status.container_running ? 'Running' : (status.installed ? 'Stopped' : 'Not Installed') },
			{ label: 'Service', ok: status.service_running, value: status.service_running ? 'Running' : 'Stopped' },
			{ label: 'Domain', ok: !!status.host, value: status.host || 'Not configured' },
			{ label: 'Exposure', ok: status.tor_enabled || status.dns_enabled || status.mesh_enabled, value: this.getExposureText(status) }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(c) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
					(c.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
					c.ok ? '\u2713' : '\u2717'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, c.label),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, c.value)
				])
			]);
		}));
	},

	getExposureText: function(status) {
		var channels = [];
		if (status.tor_enabled) channels.push('Tor');
		if (status.dns_enabled) channels.push('DNS/SSL');
		if (status.mesh_enabled) channels.push('Mesh');
		return channels.length > 0 ? channels.join(', ') : 'None';
	},

	renderControls: function(status) {
		var self = this;
		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				!status.installed ? E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleInstall(); }
				}, 'Install') : '',
				status.installed && !status.container_running ? E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleStart(); }
				}, 'Start') : '',
				status.container_running ? E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleStop(); }
				}, 'Stop') : '',
				status.container_running ? E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleRestart(); }
				}, 'Restart') : ''
			]),
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleEmancipate(); }
				}, 'Expose Service'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleRevoke(); }
				}, 'Revoke'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleBackup(); }
				}, 'Backup'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleViewLogs(); }
				}, 'Logs')
			])
		]);
	},

	handleInstall: function() {
		var self = this;
		ui.showModal('Install GoToSocial', [
			E('p', { 'style': 'color: var(--kiss-muted);' }, 'This will download and install GoToSocial in an LXC container. This may take several minutes.'),
			E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						ui.hideModal();
						ui.showModal('Installing...', [E('p', { 'class': 'spinning' }, 'Installing GoToSocial, please wait...')]);
						callInstall().then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', 'GoToSocial installed successfully'), 'success');
							} else {
								ui.addNotification(null, E('p', res.error || 'Installation failed'), 'error');
							}
							location.reload();
						});
					}
				}, 'Install')
			])
		]);
	},

	handleStart: function() {
		ui.showModal('Starting...', [E('p', { 'class': 'spinning' }, 'Starting GoToSocial...')]);
		callStart().then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', res.message || 'GoToSocial started'), 'success');
			location.reload();
		});
	},

	handleStop: function() {
		callStop().then(function(res) {
			ui.addNotification(null, E('p', res.message || 'GoToSocial stopped'), 'info');
			location.reload();
		});
	},

	handleRestart: function() {
		ui.showModal('Restarting...', [E('p', { 'class': 'spinning' }, 'Restarting GoToSocial...')]);
		callRestart().then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', res.message || 'GoToSocial restarted'), 'success');
			location.reload();
		});
	},

	handleEmancipate: function() {
		var self = this;
		var domain = self.status && self.status.host ? self.status.host : '';

		ui.showModal('Expose Service', [
			E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' }, 'Configure exposure channels for your Fediverse instance.'),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Domain'),
				E('input', {
					'type': 'text',
					'id': 'emancipate-domain',
					'value': domain,
					'style': 'width: 100%; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				})
			]),
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 8px;' }, 'Channels'),
				E('label', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;' }, [
					E('input', { 'type': 'checkbox', 'id': 'emancipate-tor' }), 'Tor (.onion)'
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;' }, [
					E('input', { 'type': 'checkbox', 'id': 'emancipate-dns', 'checked': true }), 'DNS/SSL (HTTPS)'
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					E('input', { 'type': 'checkbox', 'id': 'emancipate-mesh' }), 'Mesh Network'
				])
			]),
			E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var d = document.getElementById('emancipate-domain').value;
						var tor = document.getElementById('emancipate-tor').checked;
						var dns = document.getElementById('emancipate-dns').checked;
						var mesh = document.getElementById('emancipate-mesh').checked;
						ui.hideModal();
						ui.showModal('Exposing...', [E('p', { 'class': 'spinning' }, 'Setting up exposure channels...')]);
						callEmancipate(d, tor, dns, mesh).then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', res.message || 'Service exposed'), 'success');
							} else {
								ui.addNotification(null, E('p', res.error || 'Exposure failed'), 'error');
							}
						});
					}
				}, 'Expose')
			])
		]);
	},

	handleRevoke: function() {
		ui.showModal('Revoke Exposure', [
			E('p', { 'style': 'color: var(--kiss-muted);' }, 'This will remove all exposure channels. The service will no longer be accessible externally.'),
			E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						callRevoke().then(function(res) {
							ui.addNotification(null, E('p', res.message || 'Exposure revoked'), 'info');
						});
					}
				}, 'Revoke')
			])
		]);
	},

	handleBackup: function() {
		ui.showModal('Creating Backup...', [E('p', { 'class': 'spinning' }, 'Creating backup...')]);
		callBackup().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', res.message || 'Backup created'), 'success');
			} else {
				ui.addNotification(null, E('p', res.error || 'Backup failed'), 'error');
			}
		});
	},

	handleViewLogs: function() {
		callLogs(100).then(function(res) {
			var logs = res.logs || [];
			ui.showModal('GoToSocial Logs', [
				E('pre', {
					'style': 'max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 11px; background: var(--kiss-bg); color: var(--kiss-green); padding: 12px; border-radius: 6px; white-space: pre-wrap;'
				}, logs.join('\n') || 'No logs available'),
				E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 16px;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close')
				])
			]);
		});
	},

	render: function(status) {
		var self = this;
		this.status = status;
		var c = KissTheme.colors;

		var isRunning = status.container_running && status.service_running;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'GoToSocial'),
					KissTheme.badge(isRunning ? 'RUNNING' : (status.installed ? 'STOPPED' : 'NOT INSTALLED'),
						isRunning ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Lightweight ActivityPub social network server for the Fediverse')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats row
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'gts-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('System Health', this.renderHealth(status)),
				KissTheme.card('Controls', this.renderControls(status))
			])
		];

		poll.add(function() {
			return callStatus().then(function(s) {
				self.status = s;
				// Could update stats here
			});
		}, 5);

		return KissTheme.wrap(content, 'admin/services/gotosocial/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
