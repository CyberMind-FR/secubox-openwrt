'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.secubox-users',
	method: 'status',
	expect: {}
});

var callUsers = rpc.declare({
	object: 'luci.secubox-users',
	method: 'users',
	expect: {}
});

var callAddUser = rpc.declare({
	object: 'luci.secubox-users',
	method: 'add',
	params: ['username', 'password', 'services'],
	expect: {}
});

var callDeleteUser = rpc.declare({
	object: 'luci.secubox-users',
	method: 'delete',
	params: ['username'],
	expect: {}
});

var callPasswd = rpc.declare({
	object: 'luci.secubox-users',
	method: 'passwd',
	params: ['username', 'password'],
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callUsers()
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var usersData = data[1] || {};
		var users = usersData.users || [];

		// Start polling
		poll.add(function() {
			return callUsers().then(function(data) {
				self.updateStats(data);
			});
		}, 30);

		var totalLogins = 0;
		var totalFailures = 0;
		users.forEach(function(u) {
			totalLogins += (u.login_success || 0);
			totalFailures += (u.login_failure || 0);
		});

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'margin: 0 0 8px 0; display: flex; align-items: center; gap: 12px;' }, [
					E('span', {}, '\uD83D\uDC65'),
					'SecuBox Users'
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
					'Unified user management across all SecuBox services')
			]),

			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' }, [
				this.statCard('Users', users.length, 'var(--kiss-cyan)', 'users'),
				this.statCard('Services', 6, 'var(--kiss-purple)', 'services'),
				this.statCard('Logins', totalLogins, 'var(--kiss-green)', 'logins'),
				this.statCard('Failures', totalFailures,
					totalFailures > 50 ? 'var(--kiss-red)' : 'var(--kiss-yellow)', 'failures')
			]),

			// Users Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title', 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', {}, '\uD83D\uDC65 User Accounts'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 6px 12px; font-size: 12px;',
						'click': ui.createHandlerFn(this, this.showAddUserModal)
					}, '+ Add User')
				]),
				this.renderUserTable(users)
			]),

			// Connected Services Card
			E('div', { 'class': 'kiss-card kiss-panel-blue' }, [
				E('div', { 'class': 'kiss-card-title' }, ['\uD83D\uDD17 Connected Services']),
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 16px;' }, [
					E('span', { 'class': 'kiss-badge kiss-badge-green' }, '\u2601 Nextcloud'),
					E('span', { 'class': 'kiss-badge kiss-badge-green' }, '\uD83C\uDFAC PeerTube'),
					E('span', { 'class': 'kiss-badge kiss-badge-green' }, '\uD83D\uDCAC Jabber'),
					E('span', { 'class': 'kiss-badge kiss-badge-green' }, '\uD83D\uDCE1 Matrix'),
					E('span', { 'class': 'kiss-badge kiss-badge-green' }, '\u2709 Email'),
					E('span', { 'class': 'kiss-badge kiss-badge-green' }, '\uD83D\uDCBB Gitea')
				]),
				E('p', { 'style': 'margin-top: 12px; color: var(--kiss-muted); font-size: 12px;' },
					'Users are automatically provisioned across all enabled services.')
			])
		];

		return KissTheme.wrap(content, 'admin/system/secubox-users');
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

	updateStats: function(data) {
		var users = (data.users || []);
		var usersEl = document.querySelector('[data-stat="users"]');
		var loginsEl = document.querySelector('[data-stat="logins"]');
		var failuresEl = document.querySelector('[data-stat="failures"]');

		if (usersEl) usersEl.textContent = users.length;

		var totalLogins = 0, totalFailures = 0;
		users.forEach(function(u) {
			totalLogins += (u.login_success || 0);
			totalFailures += (u.login_failure || 0);
		});

		if (loginsEl) loginsEl.textContent = totalLogins;
		if (failuresEl) {
			failuresEl.textContent = totalFailures;
			failuresEl.style.color = totalFailures > 50 ? 'var(--kiss-red)' : 'var(--kiss-yellow)';
		}
	},

	renderUserTable: function(users) {
		var self = this;

		if (!users.length) {
			return E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' }, [
				E('p', { 'style': 'font-size: 48px; margin: 0;' }, '\uD83D\uDC65'),
				E('p', {}, 'No users configured yet'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': ui.createHandlerFn(this, this.showAddUserModal)
				}, '+ Add First User')
			]);
		}

		var rows = users.map(function(user) {
			var services = (user.services || []).map(function(s) {
				return E('span', {
					'style': 'display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; background: rgba(0,200,83,0.15); color: var(--kiss-green); font-size: 11px;'
				}, s);
			});

			var failColor = (user.login_failure || 0) > 10 ? 'var(--kiss-red)' :
			                ((user.login_failure || 0) > 0 ? 'var(--kiss-yellow)' : 'var(--kiss-green)');

			return E('tr', {}, [
				E('td', { 'style': 'padding: 12px 8px;' }, [
					E('div', { 'style': 'font-weight: 600;' }, user.username),
					E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, user.email || '')
				]),
				E('td', { 'style': 'padding: 12px 8px; color: var(--kiss-muted);' }, user.last_login || 'Never'),
				E('td', { 'style': 'padding: 12px 8px; text-align: center;' }, [
					E('span', { 'style': 'color: var(--kiss-green); font-weight: 600;' }, String(user.login_success || 0)),
					E('span', { 'style': 'color: var(--kiss-muted);' }, ' / '),
					E('span', { 'style': 'color: ' + failColor + '; font-weight: 600;' }, String(user.login_failure || 0))
				]),
				E('td', { 'style': 'padding: 12px 8px;' }, services),
				E('td', { 'style': 'padding: 12px 8px; text-align: right;' }, [
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 4px 10px; font-size: 12px; margin-right: 6px;',
						'click': function() { self.showPasswdModal(user.username); }
					}, '\uD83D\uDD11 Password'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 12px;',
						'click': function() { self.showDeleteModal(user.username); }
					}, '\uD83D\uDDD1 Delete')
				])
			]);
		});

		return E('table', { 'style': 'width: 100%; border-collapse: collapse;' }, [
			E('thead', {}, [
				E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-border);' }, [
					E('th', { 'style': 'padding: 8px; text-align: left; color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'User'),
					E('th', { 'style': 'padding: 8px; text-align: left; color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'Last Login'),
					E('th', { 'style': 'padding: 8px; text-align: center; color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'Success / Fail'),
					E('th', { 'style': 'padding: 8px; text-align: left; color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'Services'),
					E('th', { 'style': 'padding: 8px; text-align: right; color: var(--kiss-muted); font-size: 11px; text-transform: uppercase;' }, 'Actions')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	showAddUserModal: function() {
		var self = this;

		ui.showModal(_('Add User'), [
			E('div', { 'style': 'min-width: 400px;' }, [
				E('div', { 'style': 'margin-bottom: 16px;' }, [
					E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Username'),
					E('input', {
						'type': 'text',
						'id': 'new-username',
						'placeholder': 'johndoe',
						'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'margin-bottom: 16px;' }, [
					E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Password'),
					E('input', {
						'type': 'password',
						'id': 'new-password',
						'placeholder': 'Leave empty to auto-generate',
						'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'margin-bottom: 16px;' }, [
					E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'Services'),
					E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 12px;' }, [
						E('label', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { 'type': 'checkbox', 'id': 'svc-nextcloud', 'checked': true }), 'Nextcloud'
						]),
						E('label', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { 'type': 'checkbox', 'id': 'svc-peertube', 'checked': true }), 'PeerTube'
						]),
						E('label', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { 'type': 'checkbox', 'id': 'svc-jabber', 'checked': true }), 'Jabber'
						]),
						E('label', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { 'type': 'checkbox', 'id': 'svc-matrix', 'checked': true }), 'Matrix'
						]),
						E('label', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { 'type': 'checkbox', 'id': 'svc-email', 'checked': true }), 'Email'
						]),
						E('label', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
							E('input', { 'type': 'checkbox', 'id': 'svc-gitea', 'checked': true }), 'Gitea'
						])
					])
				]),
				E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() { self.doAddUser(); }
					}, '\u2714 Create User')
				])
			])
		]);
	},

	doAddUser: function() {
		var username = document.getElementById('new-username').value.trim();
		var password = document.getElementById('new-password').value;

		if (!username) {
			ui.addNotification(null, E('p', _('Username required')), 'warning');
			return;
		}

		var services = [];
		['nextcloud', 'peertube', 'jabber', 'matrix', 'email', 'gitea'].forEach(function(s) {
			if (document.getElementById('svc-' + s).checked) services.push(s);
		});

		ui.hideModal();

		callAddUser(username, password, services.join(',')).then(function(res) {
			if (res.success) {
				var msg = 'User ' + username + ' created';
				if (res.password) msg += '. Password: ' + res.password;
				ui.addNotification(null, E('p', msg), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', res.error || 'Failed'), 'error');
			}
		});
	},

	showPasswdModal: function(username) {
		var self = this;

		ui.showModal(_('Change Password'), [
			E('div', { 'style': 'min-width: 350px;' }, [
				E('p', {}, 'Change password for: ' + E('strong', {}, username)),
				E('div', { 'style': 'margin: 16px 0;' }, [
					E('div', { 'style': 'color: var(--kiss-muted); font-size: 11px; text-transform: uppercase; margin-bottom: 6px;' }, 'New Password'),
					E('input', {
						'type': 'password',
						'id': 'change-password',
						'placeholder': 'Leave empty to auto-generate',
						'style': 'width: 100%; padding: 8px 12px; border: 1px solid var(--kiss-border); border-radius: 6px; background: var(--kiss-bg2); color: var(--kiss-text);'
					})
				]),
				E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': function() { self.doPasswd(username); }
					}, '\uD83D\uDD11 Change')
				])
			])
		]);
	},

	doPasswd: function(username) {
		var password = document.getElementById('change-password').value;
		ui.hideModal();

		callPasswd(username, password).then(function(res) {
			if (res.success) {
				var msg = 'Password changed for ' + username;
				if (res.password) msg += '. New: ' + res.password;
				ui.addNotification(null, E('p', msg), 'info');
			} else {
				ui.addNotification(null, E('p', res.error || 'Failed'), 'error');
			}
		});
	},

	showDeleteModal: function(username) {
		var self = this;

		ui.showModal(_('Delete User'), [
			E('div', { 'style': 'min-width: 300px;' }, [
				E('p', { 'style': 'color: var(--kiss-red);' },
					'Delete user: ' + E('strong', {}, username) + '?'),
				E('p', { 'style': 'color: var(--kiss-muted); font-size: 13px;' },
					'This removes the user from all services.'),
				E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'click': function() { self.doDelete(username); }
					}, '\uD83D\uDDD1 Delete')
				])
			])
		]);
	},

	doDelete: function(username) {
		ui.hideModal();

		callDeleteUser(username).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', 'User ' + username + ' deleted'), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', res.error || 'Failed'), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
