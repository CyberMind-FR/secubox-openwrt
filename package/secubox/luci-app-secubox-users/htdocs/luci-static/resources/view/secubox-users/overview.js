'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.secubox-users',
	method: 'status',
	expect: { }
});

var callUsers = rpc.declare({
	object: 'luci.secubox-users',
	method: 'users',
	expect: { }
});

var callAddUser = rpc.declare({
	object: 'luci.secubox-users',
	method: 'add',
	params: ['username', 'password', 'services'],
	expect: { }
});

var callDeleteUser = rpc.declare({
	object: 'luci.secubox-users',
	method: 'delete',
	params: ['username'],
	expect: { }
});

var callPasswd = rpc.declare({
	object: 'luci.secubox-users',
	method: 'passwd',
	params: ['username', 'password'],
	expect: { }
});

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callStatus(),
			callUsers()
		]);
	},

	renderStats: function(status, userCount) {
		var c = KissTheme.colors;
		var services = status.services || {};
		var activeServices = Object.keys(services).filter(function(s) { return services[s]; }).length;
		return [
			KissTheme.stat(userCount, 'Users', c.blue),
			KissTheme.stat(activeServices, 'Services', c.green),
			KissTheme.stat(status.domain || 'N/A', 'Domain', c.purple)
		];
	},

	renderServices: function(services) {
		var serviceNames = ['nextcloud', 'peertube', 'matrix', 'jabber', 'email', 'gitea', 'jellyfin'];
		var badges = serviceNames.map(function(name) {
			var running = services[name];
			return KissTheme.badge(name.charAt(0).toUpperCase() + name.slice(1), running ? 'green' : 'muted');
		});
		return E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' }, badges);
	},

	renderUserRow: function(user) {
		var self = this;
		var services = (user.services || []).map(function(s) {
			return E('span', {
				'style': 'display: inline-block; padding: 2px 6px; margin: 2px; border-radius: 4px; background: var(--kiss-bg); color: var(--kiss-cyan); font-size: 11px;'
			}, s);
		});

		var lastLogin = user.last_login || 'never';
		var loginSuccess = user.login_success || 0;
		var loginFailure = user.login_failure || 0;
		var failColor = loginFailure > 10 ? 'var(--kiss-red)' : (loginFailure > 0 ? 'var(--kiss-orange)' : 'var(--kiss-green)');

		return E('tr', {}, [
			E('td', { 'style': 'font-weight: 600;' }, user.username),
			E('td', { 'style': 'color: var(--kiss-muted);' }, user.email),
			E('td', { 'style': 'color: var(--kiss-muted);' }, lastLogin),
			E('td', { 'style': 'text-align: center;' }, [
				E('span', { 'style': 'color: var(--kiss-green); font-weight: 600;' }, String(loginSuccess)),
				E('span', { 'style': 'color: var(--kiss-muted);' }, ' / '),
				E('span', { 'style': 'color: ' + failColor + '; font-weight: 600;' }, String(loginFailure))
			]),
			E('td', {}, services),
			E('td', { 'style': 'width: 180px;' }, [
				E('div', { 'style': 'display: flex; gap: 8px;' }, [
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() { self.handlePasswd(user.username); }
					}, 'Password'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() { self.handleDelete(user.username); }
					}, 'Delete')
				])
			])
		]);
	},

	renderUsersTable: function(users) {
		var self = this;
		if (!users || users.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' }, 'No users configured. Click "Add User" to create one.');
		}

		var rows = users.map(function(u) { return self.renderUserRow(u); });

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Username'),
					E('th', {}, 'Email'),
					E('th', {}, 'Last Login'),
					E('th', { 'style': 'text-align: center;' }, 'OK / Fail'),
					E('th', {}, 'Services'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	handleAdd: function() {
		var self = this;

		ui.showModal('Add User', [
			E('div', { 'style': 'padding: 16px;' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Username'),
						E('input', {
							'type': 'text',
							'id': 'new-username',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						})
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Password'),
						E('input', {
							'type': 'password',
							'id': 'new-password',
							'placeholder': 'Leave empty to generate',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						})
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Services'),
						E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 12px;' }, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-nextcloud', 'checked': true }), 'Nextcloud']),
							E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-peertube', 'checked': true }), 'PeerTube']),
							E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-jabber', 'checked': true }), 'Jabber']),
							E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-matrix', 'checked': true }), 'Matrix']),
							E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-email', 'checked': true }), 'Email']),
							E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-gitea', 'checked': true }), 'Gitea']),
							E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-jellyfin', 'checked': true }), 'Jellyfin'])
						])
					])
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; padding: 16px; border-top: 1px solid var(--kiss-line);' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var username = document.getElementById('new-username').value;
						var password = document.getElementById('new-password').value;
						var services = [];
						if (document.getElementById('svc-nextcloud').checked) services.push('nextcloud');
						if (document.getElementById('svc-peertube').checked) services.push('peertube');
						if (document.getElementById('svc-jabber').checked) services.push('jabber');
						if (document.getElementById('svc-matrix').checked) services.push('matrix');
						if (document.getElementById('svc-email').checked) services.push('email');
						if (document.getElementById('svc-gitea').checked) services.push('gitea');
						if (document.getElementById('svc-jellyfin').checked) services.push('jellyfin');

						if (!username) {
							ui.addNotification(null, E('p', 'Username required'), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal('Creating User...', [
							E('p', { 'class': 'spinning' }, 'Please wait...')
						]);

						callAddUser(username, password, services.join(',')).then(function(res) {
							ui.hideModal();
							if (res && res.success) {
								ui.showModal('User Created', [
									E('div', { 'style': 'padding: 20px;' }, [
										E('p', {}, 'User created successfully!'),
										E('div', { 'style': 'margin: 16px 0; padding: 12px; background: var(--kiss-bg); border-radius: 6px;' }, [
											E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 8px;' }, [
												E('span', { 'style': 'color: var(--kiss-muted);' }, 'Username:'),
												E('span', { 'style': 'font-weight: 600;' }, res.username)
											]),
											E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 8px;' }, [
												E('span', { 'style': 'color: var(--kiss-muted);' }, 'Password:'),
												E('span', { 'style': 'font-family: monospace; background: var(--kiss-bg2); padding: 4px 8px; border-radius: 4px;' }, res.password)
											]),
											E('div', { 'style': 'display: flex; gap: 12px;' }, [
												E('span', { 'style': 'color: var(--kiss-muted);' }, 'Email:'),
												E('span', {}, res.email)
											])
										])
									]),
									E('div', { 'style': 'display: flex; justify-content: flex-end; padding: 16px;' }, [
										E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() { ui.hideModal(); location.reload(); } }, 'OK')
									])
								]);
							} else {
								ui.addNotification(null, E('p', 'Error: ' + (res.error || 'Unknown error')), 'error');
							}
						});
					}
				}, 'Create User')
			])
		]);
	},

	handleDelete: function(username) {
		if (!confirm('Delete user "' + username + '" from all services?')) {
			return;
		}

		ui.showModal('Deleting...', [
			E('p', { 'class': 'spinning' }, 'Please wait...')
		]);

		callDeleteUser(username).then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', 'User deleted'), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handlePasswd: function(username) {
		ui.showModal('Change Password', [
			E('div', { 'style': 'padding: 16px;' }, [
				E('p', {}, 'Change password for: ' + username),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-top: 16px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'New Password'),
					E('input', {
						'type': 'password',
						'id': 'new-passwd',
						'placeholder': 'Leave empty to generate',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
					})
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; padding: 16px; border-top: 1px solid var(--kiss-line);' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() {
						var password = document.getElementById('new-passwd').value;
						ui.hideModal();
						ui.showModal('Updating...', [
							E('p', { 'class': 'spinning' }, 'Please wait...')
						]);

						callPasswd(username, password).then(function(res) {
							ui.hideModal();
							if (res && res.success) {
								ui.showModal('Password Updated', [
									E('div', { 'style': 'padding: 20px;' }, [
										E('p', {}, 'Password updated for all services!'),
										E('p', { 'style': 'font-family: monospace; background: var(--kiss-bg); padding: 12px; margin: 12px 0; border-radius: 6px;' }, res.password)
									]),
									E('div', { 'style': 'display: flex; justify-content: flex-end; padding: 16px;' }, [
										E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': ui.hideModal }, 'OK')
									])
								]);
							} else {
								ui.addNotification(null, E('p', 'Error updating password'), 'error');
							}
						});
					}
				}, 'Update')
			])
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var usersData = data[1] || {};
		var users = usersData.users || [];
		var services = status.services || {};

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'SecuBox User Management'),
					KissTheme.badge(users.length + ' Users', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Manage unified user accounts across all SecuBox services')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(status, users.length)),

			// Services
			KissTheme.card('Available Services', this.renderServices(services)),

			// Users
			KissTheme.card(
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, 'Users'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 6px 14px;',
						'click': function() { self.handleAdd(); }
					}, 'Add User')
				]),
				this.renderUsersTable(users)
			)
		];

		return KissTheme.wrap(content, 'admin/system/secubox-users/overview');
	}
});
