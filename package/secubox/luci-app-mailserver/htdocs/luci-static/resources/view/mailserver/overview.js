'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

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
		var self = this;
		var status = data[0] || {};
		var users = (data[1] || {}).users || [];
		var aliases = (data[2] || {}).aliases || [];
		var webmail = data[3] || {};

		// Start polling for status updates
		poll.add(function() {
			return callStatus().then(function(s) {
				self.updateStats(s);
			});
		}, 10);

		var isRunning = status.state === 'running';
		var ports = status.ports || {};

		var content = [
			// Header with title
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;' }, [
					E('span', {}, '\u2709\ufe0f'),
					'Mail Server'
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
					status.fqdn || 'Postfix + Dovecot LXC Mail Server')
			]),

			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' }, [
				this.statCard('Status', isRunning ? 'Running' : 'Stopped',
					isRunning ? 'var(--kiss-green)' : 'var(--kiss-red)', 'status'),
				this.statCard('Users', users.length || 0, 'var(--kiss-cyan)', 'users'),
				this.statCard('Storage', status.storage || '0', 'var(--kiss-purple)', 'storage'),
				this.statCard('SSL', status.ssl_valid ? 'Valid' : 'Missing',
					status.ssl_valid ? 'var(--kiss-green)' : 'var(--kiss-yellow)', 'ssl')
			]),

			// Controls Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\u26a1 Controls']),
				E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
					E('button', {
						'class': isRunning ? 'kiss-btn kiss-btn-red' : 'kiss-btn kiss-btn-green',
						'click': ui.createHandlerFn(this, isRunning ? this.doStop : this.doStart)
					}, isRunning ? '\u23f9 Stop' : '\u25b6 Start'),
					E('button', {
						'class': 'kiss-btn',
						'click': ui.createHandlerFn(this, this.doDnsSetup)
					}, '\ud83c\udf10 DNS Setup'),
					E('button', {
						'class': 'kiss-btn',
						'click': ui.createHandlerFn(this, this.doSslSetup)
					}, '\ud83d\udd12 SSL Setup'),
					E('button', {
						'class': 'kiss-btn',
						'click': ui.createHandlerFn(this, this.doFixPorts)
					}, '\ud83d\udd0c Fix Ports'),
					E('button', {
						'class': 'kiss-btn',
						'click': ui.createHandlerFn(this, this.doMeshBackup)
					}, '\ud83d\udcbe Backup')
				])
			]),

			// Port Status Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\ud83d\udce1 Ports']),
				this.renderPortStatus(ports)
			]),

			// Two Column Layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Users Card
				E('div', { 'class': 'kiss-card' }, [
					E('div', { 'class': 'kiss-card-title', 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, '\ud83d\udc65 Mail Users'),
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'padding: 6px 12px; font-size: 12px;',
							'click': ui.createHandlerFn(this, this.showAddUserModal)
						}, '+ Add')
					]),
					this.renderUserTable(users)
				]),

				// Aliases Card
				E('div', { 'class': 'kiss-card' }, [
					E('div', { 'class': 'kiss-card-title', 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, '\ud83d\udd00 Aliases'),
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'padding: 6px 12px; font-size: 12px;',
							'click': ui.createHandlerFn(this, this.showAddAliasModal)
						}, '+ Add')
					]),
					this.renderAliasTable(aliases)
				])
			]),

			// Webmail Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\ud83d\udcec Webmail (Roundcube)']),
				E('div', { 'style': 'display: flex; gap: 16px; align-items: center;' }, [
					E('span', {
						'class': webmail.running ? 'kiss-badge kiss-badge-green' : 'kiss-badge kiss-badge-red'
					}, webmail.running ? 'RUNNING' : 'STOPPED'),
					webmail.running ? E('span', { 'style': 'color: var(--kiss-muted);' },
						'Port ' + (webmail.port || 8026)) : null,
					E('button', {
						'class': 'kiss-btn',
						'click': ui.createHandlerFn(this, this.doWebmailConfigure)
					}, '\u2699\ufe0f Configure'),
					webmail.running ? E('a', {
						'href': 'http://' + window.location.hostname + ':' + (webmail.port || 8026),
						'target': '_blank',
						'class': 'kiss-btn kiss-btn-blue'
					}, '\ud83d\udd17 Open Webmail') : null
				])
			]),

			// Connection Info Card
			E('div', { 'class': 'kiss-card kiss-panel-blue' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\ud83d\udcd6 Connection Info']),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'IMAP Server'),
						E('div', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, status.fqdn || 'mail.example.com'),
						E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Port 993 (SSL) / 143')
					]),
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'SMTP Server'),
						E('div', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, status.fqdn || 'mail.example.com'),
						E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Port 587 (STARTTLS) / 465 (SSL)')
					]),
					E('div', {}, [
						E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'Domain'),
						E('div', { 'style': 'font-family: monospace; color: var(--kiss-purple);' }, status.domain || 'example.com')
					])
				])
			])
		];

		return KissTheme.wrap(content, 'admin/services/mailserver');
	},

	statCard: function(label, value, color, dataAttr) {
		return E('div', { 'class': 'kiss-stat' }, [
			E('div', {
				'class': 'kiss-stat-value',
				'style': 'color: ' + color,
				'data-stat': dataAttr
			}, String(value)),
			E('div', { 'class': 'kiss-stat-label' }, label)
		]);
	},

	updateStats: function(status) {
		var statusEl = document.querySelector('[data-stat="status"]');
		var storageEl = document.querySelector('[data-stat="storage"]');
		var sslEl = document.querySelector('[data-stat="ssl"]');

		if (statusEl) {
			var isRunning = status.state === 'running';
			statusEl.textContent = isRunning ? 'Running' : 'Stopped';
			statusEl.style.color = isRunning ? 'var(--kiss-green)' : 'var(--kiss-red)';
		}
		if (storageEl) {
			storageEl.textContent = status.storage || '0';
		}
		if (sslEl) {
			var valid = status.ssl_valid;
			sslEl.textContent = valid ? 'Valid' : 'Missing';
			sslEl.style.color = valid ? 'var(--kiss-green)' : 'var(--kiss-yellow)';
		}
	},

	renderPortStatus: function(ports) {
		var portList = [
			{ port: '25', name: 'SMTP', desc: 'Inbound mail' },
			{ port: '587', name: 'Submission', desc: 'Authenticated send' },
			{ port: '465', name: 'SMTPS', desc: 'SSL/TLS send' },
			{ port: '993', name: 'IMAPS', desc: 'SSL/TLS receive' },
			{ port: '143', name: 'IMAP', desc: 'Plain receive' }
		];

		return E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' },
			portList.map(function(p) {
				var isOpen = ports[p.port];
				return E('div', {
					'style': 'padding: 8px 16px; border-radius: 8px; background: ' +
						(isOpen ? 'rgba(0,200,83,0.1)' : 'rgba(255,23,68,0.1)') +
						'; border: 1px solid ' +
						(isOpen ? 'rgba(0,200,83,0.3)' : 'rgba(255,23,68,0.3)') +
						'; min-width: 100px;'
				}, [
					E('div', { 'style': 'font-weight: 600; font-size: 14px; color: ' +
						(isOpen ? 'var(--kiss-green)' : 'var(--kiss-red)') }, p.name),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' },
						'Port ' + p.port + ' ' + (isOpen ? '\u2713' : '\u2717'))
				]);
			})
		);
	},

	renderUserTable: function(users) {
		if (!users || users.length === 0) {
			return E('div', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No mail users configured');
		}

		var self = this;
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Email'),
					E('th', {}, 'Size'),
					E('th', {}, 'Msgs'),
					E('th', { 'style': 'width: 120px;' }, 'Actions')
				])
			]),
			E('tbody', {}, users.map(function(u) {
				return E('tr', {}, [
					E('td', { 'style': 'font-family: monospace;' }, u.email),
					E('td', {}, u.size || '0'),
					E('td', {}, String(u.messages || 0)),
					E('td', {}, [
						E('button', {
							'class': 'kiss-btn',
							'style': 'padding: 4px 8px; font-size: 11px; margin-right: 4px;',
							'click': ui.createHandlerFn(self, self.showResetPasswordModal, u.email)
						}, '\ud83d\udd11'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 8px; font-size: 11px;',
							'click': ui.createHandlerFn(self, self.doDeleteUser, u.email)
						}, '\ud83d\uddd1')
					])
				]);
			}))
		]);
	},

	renderAliasTable: function(aliases) {
		if (!aliases || aliases.length === 0) {
			return E('div', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
				'No aliases configured');
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Alias'),
					E('th', { 'style': 'width: 30px;' }, ''),
					E('th', {}, 'Target')
				])
			]),
			E('tbody', {}, aliases.map(function(a) {
				return E('tr', {}, [
					E('td', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, a.alias),
					E('td', { 'style': 'color: var(--kiss-muted);' }, '\u2192'),
					E('td', { 'style': 'font-family: monospace;' }, a.target)
				]);
			}))
		]);
	},

	showAddUserModal: function() {
		var self = this;
		var emailInput, passwordInput;

		ui.showModal('Add Mail User', [
			E('div', { 'style': 'padding: 16px;' }, [
				E('p', { 'style': 'margin-bottom: 16px; color: var(--kiss-muted);' },
					'Create a new mail account'),
				E('div', { 'style': 'margin-bottom: 12px;' }, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Email Address'),
					emailInput = E('input', {
						'type': 'email',
						'placeholder': 'user@domain.com',
						'style': 'width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'margin-bottom: 16px;' }, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Password'),
					passwordInput = E('input', {
						'type': 'password',
						'placeholder': 'Secure password',
						'style': 'width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'display: flex; gap: 8px; justify-content: flex-end;' }, [
					E('button', {
						'class': 'kiss-btn',
						'click': ui.hideModal
					}, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() {
							var email = emailInput.value.trim();
							var password = passwordInput.value;
							if (!email || !password) {
								ui.addNotification(null, E('p', 'Email and password required'), 'error');
								return;
							}
							ui.hideModal();
							self.doAddUser(email, password);
						}
					}, 'Add User')
				])
			])
		]);
	},

	showAddAliasModal: function() {
		var self = this;
		var aliasInput, targetInput;

		ui.showModal('Add Email Alias', [
			E('div', { 'style': 'padding: 16px;' }, [
				E('p', { 'style': 'margin-bottom: 16px; color: var(--kiss-muted);' },
					'Forward email from one address to another'),
				E('div', { 'style': 'margin-bottom: 12px;' }, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Alias Address'),
					aliasInput = E('input', {
						'type': 'email',
						'placeholder': 'info@domain.com',
						'style': 'width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'margin-bottom: 16px;' }, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Forward To'),
					targetInput = E('input', {
						'type': 'email',
						'placeholder': 'user@domain.com',
						'style': 'width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'display: flex; gap: 8px; justify-content: flex-end;' }, [
					E('button', {
						'class': 'kiss-btn',
						'click': ui.hideModal
					}, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() {
							var alias = aliasInput.value.trim();
							var target = targetInput.value.trim();
							if (!alias || !target) {
								ui.addNotification(null, E('p', 'Alias and target required'), 'error');
								return;
							}
							ui.hideModal();
							self.doAddAlias(alias, target);
						}
					}, 'Add Alias')
				])
			])
		]);
	},

	showResetPasswordModal: function(email) {
		var self = this;
		var passwordInput, confirmInput;

		ui.showModal('Reset Password', [
			E('div', { 'style': 'padding: 16px;' }, [
				E('p', { 'style': 'margin-bottom: 16px;' }, [
					'New password for: ',
					E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, email)
				]),
				E('div', { 'style': 'margin-bottom: 12px;' }, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'New Password'),
					passwordInput = E('input', {
						'type': 'password',
						'style': 'width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'margin-bottom: 16px;' }, [
					E('label', { 'style': 'display: block; font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Confirm Password'),
					confirmInput = E('input', {
						'type': 'password',
						'style': 'width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'display: flex; gap: 8px; justify-content: flex-end;' }, [
					E('button', {
						'class': 'kiss-btn',
						'click': ui.hideModal
					}, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() {
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
							self.doResetPassword(email, password);
						}
					}, 'Reset Password')
				])
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
			E('p', { 'class': 'spinning' }, 'Creating mailbox for ' + email + '...')
		]);
		return callUserAdd(email, password).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'User added: ' + email), 'success');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.output || res.error)), 'error');
			}
			window.location.reload();
		});
	},

	doDeleteUser: function(email) {
		if (!confirm('Delete user ' + email + ' and all their mail?')) return;

		ui.showModal('Deleting User', [
			E('p', { 'class': 'spinning' }, 'Removing ' + email + '...')
		]);
		return callUserDel(email).then(function() {
			ui.hideModal();
			window.location.reload();
		});
	},

	doAddAlias: function(alias, target) {
		ui.showModal('Adding Alias', [
			E('p', { 'class': 'spinning' }, 'Creating alias ' + alias + '...')
		]);
		return callAliasAdd(alias, target).then(function() {
			ui.hideModal();
			window.location.reload();
		});
	},

	doResetPassword: function(email, password) {
		ui.showModal('Resetting Password', [
			E('p', { 'class': 'spinning' }, 'Updating password for ' + email + '...')
		]);
		return callUserPasswd(email, password).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Password updated for ' + email), 'success');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || res.output)), 'error');
			}
		});
	},

	doDnsSetup: function() {
		ui.showModal('DNS Setup', [
			E('p', { 'class': 'spinning' }, 'Creating MX, SPF, DKIM, DMARC records...')
		]);
		return callDnsSetup().then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'DNS records created successfully'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output || 'Check dnsctl configuration'), 'warning');
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
				ui.addNotification(null, E('p', res.output || 'Certificate request failed'), 'error');
			}
			window.location.reload();
		});
	},

	doWebmailConfigure: function() {
		ui.showModal('Configuring Webmail', [
			E('p', { 'class': 'spinning' }, 'Setting up Roundcube connection...')
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
				ui.addNotification(null, E('p', 'Backup created successfully'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output || 'Backup failed'), 'error');
			}
		});
	},

	doFixPorts: function() {
		ui.showModal('Fixing Ports', [
			E('p', { 'class': 'spinning' }, 'Enabling submission (587), SMTPS (465), POP3S (995)...')
		]);
		return callFixPorts().then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Ports enabled successfully'), 'success');
			} else {
				ui.addNotification(null, E('p', res.output || 'Some ports may not be listening'), 'warning');
			}
			window.location.reload();
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
