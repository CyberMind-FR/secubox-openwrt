'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

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

	pollStatus: function() {
		return callStatus().then(L.bind(function(status) {
			this.status = status;
			this.updateStatusDisplay(status);
		}, this));
	},

	updateStatusDisplay: function(status) {
		var containerEl = document.getElementById('container-status');
		var serviceEl = document.getElementById('service-status');
		var versionEl = document.getElementById('gts-version');
		var hostEl = document.getElementById('gts-host');
		var exposureEl = document.getElementById('exposure-status');

		if (containerEl) {
			if (status.container_running) {
				containerEl.textContent = 'Running';
				containerEl.className = 'badge success';
			} else if (status.installed) {
				containerEl.textContent = 'Stopped';
				containerEl.className = 'badge warning';
			} else {
				containerEl.textContent = 'Not Installed';
				containerEl.className = 'badge danger';
			}
		}

		if (serviceEl) {
			if (status.service_running) {
				serviceEl.textContent = 'Running';
				serviceEl.className = 'badge success';
			} else {
				serviceEl.textContent = 'Stopped';
				serviceEl.className = 'badge warning';
			}
		}

		if (versionEl) {
			versionEl.textContent = status.version || '-';
		}

		if (hostEl) {
			hostEl.textContent = status.host || '-';
		}

		if (exposureEl) {
			var channels = [];
			if (status.tor_enabled) channels.push('Tor');
			if (status.dns_enabled) channels.push('DNS/SSL');
			if (status.mesh_enabled) channels.push('Mesh');
			exposureEl.textContent = channels.length > 0 ? channels.join(', ') : 'None';
		}

		// Update button states
		var installBtn = document.getElementById('btn-install');
		var startBtn = document.getElementById('btn-start');
		var stopBtn = document.getElementById('btn-stop');
		var restartBtn = document.getElementById('btn-restart');

		if (installBtn) installBtn.disabled = status.installed;
		if (startBtn) startBtn.disabled = !status.installed || status.container_running;
		if (stopBtn) stopBtn.disabled = !status.container_running;
		if (restartBtn) restartBtn.disabled = !status.container_running;
	},

	handleInstall: function() {
		return ui.showModal(_('Install GoToSocial'), [
			E('p', _('This will download and install GoToSocial in an LXC container. This may take several minutes.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action important',
					'click': ui.createHandlerFn(this, function() {
						ui.hideModal();
						ui.showModal(_('Installing...'), [
							E('p', { 'class': 'spinning' }, _('Installing GoToSocial, please wait...'))
						]);
						return callInstall().then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', _('GoToSocial installed successfully')), 'success');
							} else {
								ui.addNotification(null, E('p', res.error || _('Installation failed')), 'error');
							}
							return callStatus();
						}).then(L.bind(function(status) {
							this.updateStatusDisplay(status);
						}, this));
					})
				}, _('Install'))
			])
		]);
	},

	handleStart: function() {
		ui.showModal(_('Starting...'), [
			E('p', { 'class': 'spinning' }, _('Starting GoToSocial...'))
		]);
		return callStart().then(L.bind(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', res.message || _('GoToSocial started')), 'success');
			return this.pollStatus();
		}, this));
	},

	handleStop: function() {
		return callStop().then(L.bind(function(res) {
			ui.addNotification(null, E('p', res.message || _('GoToSocial stopped')), 'info');
			return this.pollStatus();
		}, this));
	},

	handleRestart: function() {
		ui.showModal(_('Restarting...'), [
			E('p', { 'class': 'spinning' }, _('Restarting GoToSocial...'))
		]);
		return callRestart().then(L.bind(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', res.message || _('GoToSocial restarted')), 'success');
			return this.pollStatus();
		}, this));
	},

	handleEmancipate: function() {
		var domain = this.status && this.status.host ? this.status.host : '';

		return ui.showModal(_('Expose Service'), [
			E('p', _('Configure exposure channels for your Fediverse instance.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Domain')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'text', 'id': 'emancipate-domain', 'class': 'cbi-input-text', 'value': domain })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Channels')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('label', { 'style': 'display:block' }, [
						E('input', { 'type': 'checkbox', 'id': 'emancipate-tor' }), ' ', _('Tor (.onion)')
					]),
					E('label', { 'style': 'display:block' }, [
						E('input', { 'type': 'checkbox', 'id': 'emancipate-dns', 'checked': true }), ' ', _('DNS/SSL (HTTPS)')
					]),
					E('label', { 'style': 'display:block' }, [
						E('input', { 'type': 'checkbox', 'id': 'emancipate-mesh' }), ' ', _('Mesh Network')
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': ui.createHandlerFn(this, function() {
						var domain = document.getElementById('emancipate-domain').value;
						var tor = document.getElementById('emancipate-tor').checked;
						var dns = document.getElementById('emancipate-dns').checked;
						var mesh = document.getElementById('emancipate-mesh').checked;

						ui.hideModal();
						ui.showModal(_('Exposing...'), [
							E('p', { 'class': 'spinning' }, _('Setting up exposure channels...'))
						]);

						return callEmancipate(domain, tor, dns, mesh).then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', res.message || _('Service exposed successfully')), 'success');
							} else {
								ui.addNotification(null, E('p', res.error || _('Exposure failed')), 'error');
							}
						});
					})
				}, _('Expose'))
			])
		]);
	},

	handleRevoke: function() {
		return ui.showModal(_('Revoke Exposure'), [
			E('p', _('This will remove all exposure channels for GoToSocial. The service will no longer be accessible externally.')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': ui.createHandlerFn(this, function() {
						ui.hideModal();
						return callRevoke().then(function(res) {
							ui.addNotification(null, E('p', res.message || _('Exposure revoked')), 'info');
						});
					})
				}, _('Revoke'))
			])
		]);
	},

	handleBackup: function() {
		ui.showModal(_('Creating Backup...'), [
			E('p', { 'class': 'spinning' }, _('Creating backup...'))
		]);
		return callBackup().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', res.message || _('Backup created')), 'success');
			} else {
				ui.addNotification(null, E('p', res.error || _('Backup failed')), 'error');
			}
		});
	},

	handleViewLogs: function() {
		return callLogs(100).then(function(res) {
			var logs = res.logs || [];
			ui.showModal(_('GoToSocial Logs'), [
				E('div', { 'style': 'max-height:400px; overflow-y:auto; font-family:monospace; font-size:12px; background:#111; color:#0f0; padding:10px; white-space:pre-wrap;' },
					logs.join('\n') || _('No logs available')
				),
				E('div', { 'class': 'right', 'style': 'margin-top:10px' }, [
					E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close'))
				])
			]);
		});
	},

	render: function(status) {
		this.status = status;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', _('GoToSocial Fediverse Server')),
			E('div', { 'class': 'cbi-map-descr' }, _('Lightweight ActivityPub social network server for the Fediverse.')),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', _('Status')),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'width': '200px' }, _('Container')),
						E('td', { 'class': 'td' }, E('span', { 'id': 'container-status', 'class': 'badge' }, '-'))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, _('Service')),
						E('td', { 'class': 'td' }, E('span', { 'id': 'service-status', 'class': 'badge' }, '-'))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, _('Version')),
						E('td', { 'class': 'td' }, E('span', { 'id': 'gts-version' }, '-'))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, _('Domain')),
						E('td', { 'class': 'td' }, E('span', { 'id': 'gts-host' }, '-'))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, _('Exposure')),
						E('td', { 'class': 'td' }, E('span', { 'id': 'exposure-status' }, '-'))
					])
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', _('Actions')),
				E('div', { 'class': 'cbi-value' }, [
					E('button', {
						'id': 'btn-install',
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, this.handleInstall)
					}, _('Install')),
					' ',
					E('button', {
						'id': 'btn-start',
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, this.handleStart)
					}, _('Start')),
					' ',
					E('button', {
						'id': 'btn-stop',
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.handleStop)
					}, _('Stop')),
					' ',
					E('button', {
						'id': 'btn-restart',
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.handleRestart)
					}, _('Restart'))
				]),
				E('div', { 'class': 'cbi-value', 'style': 'margin-top:10px' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, this.handleEmancipate)
					}, _('Expose Service')),
					' ',
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.handleRevoke)
					}, _('Revoke Exposure')),
					' ',
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.handleBackup)
					}, _('Backup')),
					' ',
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.handleViewLogs)
					}, _('View Logs'))
				])
			]),

			E('style', {}, `
				.badge { padding: 2px 8px; border-radius: 3px; font-weight: bold; }
				.badge.success { background: #4CAF50; color: white; }
				.badge.warning { background: #FF9800; color: white; }
				.badge.danger { background: #f44336; color: white; }
			`)
		]);

		this.updateStatusDisplay(status);
		poll.add(L.bind(this.pollStatus, this), 5);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
