'use strict';
'require view';
'require dom';
'require ui';
'require rpc';

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
	load: function() {
		return Promise.all([
			callStatus(),
			callUsers()
		]);
	},

	renderServiceBadge: function(name, running) {
		var color = running ? '#4CAF50' : '#9e9e9e';
		return E('span', {
			'style': 'display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;color:#fff;background:' + color + ';font-size:0.85em;'
		}, name);
	},

	renderUserRow: function(user) {
		var self = this;
		var services = (user.services || []).map(function(s) {
			return E('span', {
				'style': 'display:inline-block;padding:1px 6px;margin:1px;border-radius:3px;background:#e3f2fd;font-size:0.8em;'
			}, s);
		});

		// Login stats
		var lastLogin = user.last_login || 'never';
		var loginSuccess = user.login_success || 0;
		var loginFailure = user.login_failure || 0;

		// Color code failures
		var failColor = loginFailure > 10 ? '#f44336' : (loginFailure > 0 ? '#ff9800' : '#4caf50');

		return E('tr', {}, [
			E('td', {}, user.username),
			E('td', {}, user.email),
			E('td', {}, lastLogin),
			E('td', { 'style': 'text-align:center;' }, [
				E('span', { 'style': 'color:#4caf50;font-weight:bold;' }, String(loginSuccess)),
				E('span', {}, ' / '),
				E('span', { 'style': 'color:' + failColor + ';font-weight:bold;' }, String(loginFailure))
			]),
			E('td', {}, services),
			E('td', {}, [
				E('button', {
					'class': 'btn cbi-button',
					'click': function() { self.handlePasswd(user.username); },
					'style': 'margin-right:5px;'
				}, _('Password')),
				E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'click': function() { self.handleDelete(user.username); }
				}, _('Delete'))
			])
		]);
	},

	handleAdd: function() {
		var self = this;

		ui.showModal(_('Add User'), [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Username')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'new-username', 'style': 'width:200px;' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Password')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'password', 'id': 'new-password', 'placeholder': _('Leave empty to generate'), 'style': 'width:200px;' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Services')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('label', {}, [E('input', { 'type': 'checkbox', 'id': 'svc-nextcloud', 'checked': true }), ' Nextcloud']),
						E('label', { 'style': 'margin-left:10px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-peertube', 'checked': true }), ' PeerTube']),
						E('label', { 'style': 'margin-left:10px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-jabber', 'checked': true }), ' Jabber']),
						E('label', { 'style': 'margin-left:10px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-matrix', 'checked': true }), ' Matrix']),
						E('label', { 'style': 'margin-left:10px;' }, [E('input', { 'type': 'checkbox', 'id': 'svc-email', 'checked': true }), ' Email'])
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						var username = document.getElementById('new-username').value;
						var password = document.getElementById('new-password').value;
						var services = [];
						if (document.getElementById('svc-nextcloud').checked) services.push('nextcloud');
						if (document.getElementById('svc-peertube').checked) services.push('peertube');
						if (document.getElementById('svc-jabber').checked) services.push('jabber');
						if (document.getElementById('svc-matrix').checked) services.push('matrix');
						if (document.getElementById('svc-email').checked) services.push('email');

						if (!username) {
							ui.addNotification(null, E('p', {}, _('Username required')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Creating User...'), [
							E('p', { 'class': 'spinning' }, _('Please wait...'))
						]);

						callAddUser(username, password, services.join(',')).then(function(res) {
							ui.hideModal();
							if (res && res.success) {
								ui.showModal(_('User Created'), [
									E('div', { 'style': 'padding:20px;' }, [
										E('p', {}, _('User created successfully!')),
										E('table', { 'style': 'margin:15px 0;' }, [
											E('tr', {}, [E('td', { 'style': 'padding:5px;font-weight:bold;' }, _('Username:')), E('td', { 'style': 'padding:5px;' }, res.username)]),
											E('tr', {}, [E('td', { 'style': 'padding:5px;font-weight:bold;' }, _('Password:')), E('td', { 'style': 'padding:5px;font-family:monospace;background:#f5f5f5;' }, res.password)]),
											E('tr', {}, [E('td', { 'style': 'padding:5px;font-weight:bold;' }, _('Email:')), E('td', { 'style': 'padding:5px;' }, res.email)])
										])
									]),
									E('div', { 'class': 'right' }, [
										E('button', { 'class': 'btn cbi-button-positive', 'click': function() { ui.hideModal(); location.reload(); } }, _('OK'))
									])
								]);
							} else {
								ui.addNotification(null, E('p', {}, _('Error: ') + (res.error || 'Unknown error')), 'error');
							}
						});
					},
					'style': 'margin-left:10px;'
				}, _('Create User'))
			])
		]);
	},

	handleDelete: function(username) {
		var self = this;

		if (!confirm(_('Delete user "%s" from all services?').format(username))) {
			return;
		}

		ui.showModal(_('Deleting...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		callDeleteUser(username).then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', {}, _('User deleted')), 'success');
				location.reload();
			} else {
				ui.addNotification(null, E('p', {}, _('Error: ') + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handlePasswd: function(username) {
		var self = this;

		ui.showModal(_('Change Password'), [
			E('div', { 'class': 'cbi-section' }, [
				E('p', {}, _('Change password for: %s').format(username)),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('New Password')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'password', 'id': 'new-passwd', 'placeholder': _('Leave empty to generate'), 'style': 'width:200px;' })
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						var password = document.getElementById('new-passwd').value;
						ui.hideModal();
						ui.showModal(_('Updating...'), [
							E('p', { 'class': 'spinning' }, _('Please wait...'))
						]);

						callPasswd(username, password).then(function(res) {
							ui.hideModal();
							if (res && res.success) {
								ui.showModal(_('Password Updated'), [
									E('div', { 'style': 'padding:20px;' }, [
										E('p', {}, _('Password updated for all services!')),
										E('p', { 'style': 'font-family:monospace;background:#f5f5f5;padding:10px;margin:10px 0;' }, res.password)
									]),
									E('div', { 'class': 'right' }, [
										E('button', { 'class': 'btn cbi-button-positive', 'click': ui.hideModal }, _('OK'))
									])
								]);
							} else {
								ui.addNotification(null, E('p', {}, _('Error updating password')), 'error');
							}
						});
					},
					'style': 'margin-left:10px;'
				}, _('Update'))
			])
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var usersData = data[1] || {};
		var users = usersData.users || [];
		var services = status.services || {};

		var content = [];

		// Header
		content.push(E('h2', {}, _('SecuBox User Management')));

		// Status Section
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Services')),
			E('div', { 'style': 'margin:10px 0;' }, [
				this.renderServiceBadge('Nextcloud', services.nextcloud),
				this.renderServiceBadge('PeerTube', services.peertube),
				this.renderServiceBadge('Matrix', services.matrix),
				this.renderServiceBadge('Jabber', services.jabber),
				this.renderServiceBadge('Email', services.email)
			]),
			E('p', { 'style': 'color:#666;' }, _('Domain: %s | Users: %d').format(status.domain, status.user_count))
		]));

		// Users Table
		var userRows = users.map(function(u) { return self.renderUserRow(u); });

		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Users')),
			E('div', { 'class': 'cbi-page-actions', 'style': 'margin-bottom:15px;' }, [
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() { self.handleAdd(); }
				}, _('Add User'))
			]),
			users.length > 0 ?
				E('table', { 'class': 'table cbi-section-table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Username')),
						E('th', { 'class': 'th' }, _('Email')),
						E('th', { 'class': 'th' }, _('Last Login')),
						E('th', { 'class': 'th', 'style': 'text-align:center;' }, _('OK / Fail')),
						E('th', { 'class': 'th' }, _('Services')),
						E('th', { 'class': 'th' }, _('Actions'))
					])
				].concat(userRows)) :
				E('p', { 'style': 'color:#666;' }, _('No users configured. Click "Add User" to create one.'))
		]));

		return E('div', { 'class': 'cbi-map' }, content);
	}
});
