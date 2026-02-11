'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require uci';

var callStatus = rpc.declare({
	object: 'luci.mailserver',
	method: 'status',
	expect: {}
});

var callUserList = rpc.declare({
	object: 'luci.mailserver',
	method: 'user_list',
	expect: {}
});

var callAliasList = rpc.declare({
	object: 'luci.mailserver',
	method: 'alias_list',
	expect: {}
});

var callWebmailStatus = rpc.declare({
	object: 'luci.mailserver',
	method: 'webmail_status',
	expect: {}
});

var callInstall = rpc.declare({
	object: 'luci.mailserver',
	method: 'install',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.mailserver',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.mailserver',
	method: 'stop',
	expect: {}
});

var callUserAdd = rpc.declare({
	object: 'luci.mailserver',
	method: 'user_add',
	params: ['email', 'password'],
	expect: {}
});

var callUserDel = rpc.declare({
	object: 'luci.mailserver',
	method: 'user_del',
	params: ['email'],
	expect: {}
});

var callAliasAdd = rpc.declare({
	object: 'luci.mailserver',
	method: 'alias_add',
	params: ['alias', 'target'],
	expect: {}
});

var callUserPasswd = rpc.declare({
	object: 'luci.mailserver',
	method: 'user_passwd',
	params: ['email', 'password'],
	expect: {}
});

var callDnsSetup = rpc.declare({
	object: 'luci.mailserver',
	method: 'dns_setup',
	expect: {}
});

var callSslSetup = rpc.declare({
	object: 'luci.mailserver',
	method: 'ssl_setup',
	expect: {}
});

var callWebmailConfigure = rpc.declare({
	object: 'luci.mailserver',
	method: 'webmail_configure',
	expect: {}
});

var callMeshBackup = rpc.declare({
	object: 'luci.mailserver',
	method: 'mesh_backup',
	expect: {}
});

var callFixPorts = rpc.declare({
	object: 'luci.mailserver',
	method: 'fix_ports',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callUserList(),
			callAliasList(),
			callWebmailStatus()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var users = (data[1] || {}).users || [];
		var aliases = (data[2] || {}).aliases || [];
		var webmail = data[3] || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Mail Server'),

			// Status Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Server Status'),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'style': 'width:150px' }, 'Status'),
						E('td', { 'class': 'td' }, [
							E('span', { 'style': status.state === 'running' ? 'color:green' : 'color:red' },
								status.state === 'running' ? '● Running' : '○ Stopped')
						])
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Domain'),
						E('td', { 'class': 'td' }, status.fqdn || 'Not configured')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Users'),
						E('td', { 'class': 'td' }, String(status.users || 0))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Storage'),
						E('td', { 'class': 'td' }, status.storage || '0')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'SSL'),
						E('td', { 'class': 'td' }, status.ssl_valid ? '✓ Valid' : '✗ Not configured')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Webmail'),
						E('td', { 'class': 'td' }, webmail.running ? '● Running (port ' + webmail.port + ')' : '○ Stopped')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Mesh Backup'),
						E('td', { 'class': 'td' }, status.mesh_enabled ? '● Enabled' : '○ Disabled')
					])
				]),

				// Port Status
				E('h4', { 'style': 'margin-top:15px' }, 'Ports'),
				this.renderPortStatus(status.ports || {})
			]),

			// Quick Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Quick Actions'),
				E('div', { 'style': 'display:flex;gap:10px;flex-wrap:wrap' }, [
					status.state !== 'running' ?
						E('button', {
							'class': 'btn cbi-button-action',
							'click': ui.createHandlerFn(this, this.doStart)
						}, 'Start Server') :
						E('button', {
							'class': 'btn cbi-button-neutral',
							'click': ui.createHandlerFn(this, this.doStop)
						}, 'Stop Server'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.doDnsSetup)
					}, 'Setup DNS'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.doSslSetup)
					}, 'Setup SSL'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.doWebmailConfigure)
					}, 'Configure Webmail'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.doMeshBackup)
					}, 'Mesh Backup'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.doFixPorts)
					}, 'Fix Ports')
				])
			]),

			// Users Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Mail Users'),
				E('div', { 'style': 'margin-bottom:10px' }, [
					E('button', {
						'class': 'btn cbi-button-add',
						'click': ui.createHandlerFn(this, this.showAddUserModal)
					}, 'Add User')
				]),
				this.renderUserTable(users)
			]),

			// Aliases Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Email Aliases'),
				E('div', { 'style': 'margin-bottom:10px' }, [
					E('button', {
						'class': 'btn cbi-button-add',
						'click': ui.createHandlerFn(this, this.showAddAliasModal)
					}, 'Add Alias')
				]),
				this.renderAliasTable(aliases)
			])
		]);

		return view;
	},

	renderPortStatus: function(ports) {
		var portList = [
			{ port: '25', name: 'SMTP' },
			{ port: '587', name: 'Submission' },
			{ port: '465', name: 'SMTPS' },
			{ port: '993', name: 'IMAPS' },
			{ port: '995', name: 'POP3S' }
		];

		return E('div', { 'style': 'display:flex;gap:15px;flex-wrap:wrap' },
			portList.map(function(p) {
				var isOpen = ports[p.port];
				return E('span', {
					'style': 'padding:5px 10px;border-radius:4px;background:' + (isOpen ? '#d4edda' : '#f8d7da')
				}, p.name + ' (' + p.port + '): ' + (isOpen ? '✓' : '✗'));
			})
		);
	},

	renderUserTable: function(users) {
		if (!users || users.length === 0) {
			return E('p', { 'class': 'cbi-value-description' }, 'No mail users configured.');
		}

		var rows = users.map(L.bind(function(u) {
			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, u.email),
				E('td', { 'class': 'td' }, u.size || '0'),
				E('td', { 'class': 'td' }, String(u.messages || 0)),
				E('td', { 'class': 'td' }, [
					E('button', {
						'class': 'btn cbi-button-neutral',
						'style': 'padding:2px 8px;font-size:12px;margin-right:5px',
						'click': ui.createHandlerFn(this, this.showResetPasswordModal, u.email)
					}, 'Reset Password'),
					E('button', {
						'class': 'btn cbi-button-remove',
						'style': 'padding:2px 8px;font-size:12px',
						'click': ui.createHandlerFn(this, this.doDeleteUser, u.email)
					}, 'Delete')
				])
			]);
		}, this));

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Email'),
				E('th', { 'class': 'th' }, 'Size'),
				E('th', { 'class': 'th' }, 'Messages'),
				E('th', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
	},

	renderAliasTable: function(aliases) {
		if (!aliases || aliases.length === 0) {
			return E('p', { 'class': 'cbi-value-description' }, 'No aliases configured.');
		}

		var rows = aliases.map(function(a) {
			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, a.alias),
				E('td', { 'class': 'td' }, '→'),
				E('td', { 'class': 'td' }, a.target)
			]);
		});

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Alias'),
				E('th', { 'class': 'th' }, ''),
				E('th', { 'class': 'th' }, 'Target')
			])
		].concat(rows));
	},

	showAddUserModal: function() {
		var emailInput, passwordInput;

		ui.showModal('Add Mail User', [
			E('p', {}, 'Enter email address and password for the new user.'),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Email'),
				E('div', { 'class': 'cbi-value-field' }, [
					emailInput = E('input', { 'type': 'email', 'class': 'cbi-input-text', 'placeholder': 'user@domain.com' })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Password'),
				E('div', { 'class': 'cbi-value-field' }, [
					passwordInput = E('input', { 'type': 'password', 'class': 'cbi-input-text' })
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': ui.createHandlerFn(this, function() {
						var email = emailInput.value;
						var password = passwordInput.value;
						if (!email || !password) {
							ui.addNotification(null, E('p', 'Email and password required'), 'error');
							return;
						}
						ui.hideModal();
						return this.doAddUser(email, password);
					})
				}, 'Add User')
			])
		]);
	},

	showAddAliasModal: function() {
		var aliasInput, targetInput;

		ui.showModal('Add Email Alias', [
			E('p', {}, 'Create an alias that forwards to another address.'),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Alias'),
				E('div', { 'class': 'cbi-value-field' }, [
					aliasInput = E('input', { 'type': 'email', 'class': 'cbi-input-text', 'placeholder': 'info@domain.com' })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Forward To'),
				E('div', { 'class': 'cbi-value-field' }, [
					targetInput = E('input', { 'type': 'email', 'class': 'cbi-input-text', 'placeholder': 'user@domain.com' })
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': ui.createHandlerFn(this, function() {
						var alias = aliasInput.value;
						var target = targetInput.value;
						if (!alias || !target) {
							ui.addNotification(null, E('p', 'Alias and target required'), 'error');
							return;
						}
						ui.hideModal();
						return this.doAddAlias(alias, target);
					})
				}, 'Add Alias')
			])
		]);
	},

	showResetPasswordModal: function(email) {
		var passwordInput, confirmInput;

		ui.showModal('Reset Password', [
			E('p', {}, 'Enter new password for: ' + email),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'New Password'),
				E('div', { 'class': 'cbi-value-field' }, [
					passwordInput = E('input', { 'type': 'password', 'class': 'cbi-input-text' })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Confirm'),
				E('div', { 'class': 'cbi-value-field' }, [
					confirmInput = E('input', { 'type': 'password', 'class': 'cbi-input-text' })
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': ui.createHandlerFn(this, function() {
						var password = passwordInput.value;
						var confirm = confirmInput.value;
						if (!password) {
							ui.addNotification(null, E('p', 'Password required'), 'error');
							return;
						}
						if (password !== confirm) {
							ui.addNotification(null, E('p', 'Passwords do not match'), 'error');
							return;
						}
						ui.hideModal();
						return this.doResetPassword(email, password);
					})
				}, 'Reset Password')
			])
		]);
	},

	doStart: function() {
		ui.showModal('Starting Server', [
			E('p', { 'class': 'spinning' }, 'Starting mail server...')
		]);
		return callStart().then(function() {
			ui.hideModal();
			window.location.reload();
		});
	},

	doStop: function() {
		ui.showModal('Stopping Server', [
			E('p', { 'class': 'spinning' }, 'Stopping mail server...')
		]);
		return callStop().then(function() {
			ui.hideModal();
			window.location.reload();
		});
	},

	doAddUser: function(email, password) {
		ui.showModal('Adding User', [
			E('p', { 'class': 'spinning' }, 'Adding user: ' + email)
		]);
		return callUserAdd(email, password).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'User added: ' + email), 'success');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + res.output), 'error');
			}
			window.location.reload();
		});
	},

	doDeleteUser: function(email) {
		if (!confirm('Delete user ' + email + '?')) return;

		ui.showModal('Deleting User', [
			E('p', { 'class': 'spinning' }, 'Deleting user: ' + email)
		]);
		return callUserDel(email).then(function() {
			ui.hideModal();
			window.location.reload();
		});
	},

	doAddAlias: function(alias, target) {
		ui.showModal('Adding Alias', [
			E('p', { 'class': 'spinning' }, 'Adding alias: ' + alias)
		]);
		return callAliasAdd(alias, target).then(function() {
			ui.hideModal();
			window.location.reload();
		});
	},

	doResetPassword: function(email, password) {
		ui.showModal('Resetting Password', [
			E('p', { 'class': 'spinning' }, 'Resetting password for: ' + email)
		]);
		return callUserPasswd(email, password).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Password reset for: ' + email), 'success');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || res.output)), 'error');
			}
		});
	},

	doDnsSetup: function() {
		ui.showModal('DNS Setup', [
			E('p', { 'class': 'spinning' }, 'Creating MX, SPF, DMARC records...')
		]);
		return callDnsSetup().then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'DNS records created'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output), 'warning');
			}
		});
	},

	doSslSetup: function() {
		ui.showModal('SSL Setup', [
			E('p', { 'class': 'spinning' }, 'Obtaining SSL certificate via DNS-01...')
		]);
		return callSslSetup().then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'SSL certificate installed'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output), 'error');
			}
			window.location.reload();
		});
	},

	doWebmailConfigure: function() {
		ui.showModal('Configuring Webmail', [
			E('p', { 'class': 'spinning' }, 'Configuring Roundcube...')
		]);
		return callWebmailConfigure().then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Webmail configured. Restart webmail container to apply.'), 'success');
		});
	},

	doMeshBackup: function() {
		ui.showModal('Mesh Backup', [
			E('p', { 'class': 'spinning' }, 'Creating backup for mesh sync...')
		]);
		return callMeshBackup().then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Backup created'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output), 'error');
			}
		});
	},

	doFixPorts: function() {
		ui.showModal('Fixing Ports', [
			E('p', { 'class': 'spinning' }, 'Enabling submission (587), smtps (465), and POP3S (995) ports...')
		]);
		return callFixPorts().then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Ports enabled successfully'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output || 'Some ports may still not be listening'), 'warning');
			}
			window.location.reload();
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
