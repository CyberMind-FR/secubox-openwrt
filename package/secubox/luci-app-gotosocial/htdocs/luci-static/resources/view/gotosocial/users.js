'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callUsers = rpc.declare({
	object: 'luci.gotosocial',
	method: 'users',
	expect: {}
});

var callCreateUser = rpc.declare({
	object: 'luci.gotosocial',
	method: 'create_user',
	params: ['username', 'email', 'password', 'admin'],
	expect: {}
});

var callDeleteUser = rpc.declare({
	object: 'luci.gotosocial',
	method: 'delete_user',
	params: ['username'],
	expect: {}
});

var callPromoteUser = rpc.declare({
	object: 'luci.gotosocial',
	method: 'promote_user',
	params: ['username'],
	expect: {}
});

var callDemoteUser = rpc.declare({
	object: 'luci.gotosocial',
	method: 'demote_user',
	params: ['username'],
	expect: {}
});

return view.extend({
	users: [],

	load: function() {
		return callUsers();
	},

	pollUsers: function() {
		return callUsers().then(L.bind(function(res) {
			this.users = res.users || [];
			this.updateUserTable();
		}, this));
	},

	updateUserTable: function() {
		var tbody = document.getElementById('users-tbody');
		if (!tbody) return;

		while (tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		if (this.users.length === 0) {
			tbody.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td', 'colspan': '5', 'style': 'text-align:center' }, _('No users found'))
			]));
			return;
		}

		this.users.forEach(L.bind(function(user) {
			var row = E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, user.username || '-'),
				E('td', { 'class': 'td' }, user.email || '-'),
				E('td', { 'class': 'td' }, user.admin ?
					E('span', { 'class': 'badge success' }, _('Admin')) :
					E('span', { 'class': 'badge' }, _('User'))
				),
				E('td', { 'class': 'td' }, user.confirmed ?
					E('span', { 'class': 'badge success' }, _('Confirmed')) :
					E('span', { 'class': 'badge warning' }, _('Pending'))
				),
				E('td', { 'class': 'td' }, [
					user.admin ?
						E('button', {
							'class': 'btn cbi-button-neutral',
							'click': ui.createHandlerFn(this, this.handleDemote, user.username)
						}, _('Demote')) :
						E('button', {
							'class': 'btn cbi-button-action',
							'click': ui.createHandlerFn(this, this.handlePromote, user.username)
						}, _('Promote')),
					' ',
					E('button', {
						'class': 'btn cbi-button-negative',
						'click': ui.createHandlerFn(this, this.handleDelete, user.username)
					}, _('Delete'))
				])
			]);
			tbody.appendChild(row);
		}, this));
	},

	handleCreate: function() {
		return ui.showModal(_('Create User'), [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Username')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'text', 'id': 'new-username', 'class': 'cbi-input-text', 'placeholder': 'johndoe' })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Email')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'email', 'id': 'new-email', 'class': 'cbi-input-text', 'placeholder': 'john@example.com' })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Password')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'password', 'id': 'new-password', 'class': 'cbi-input-text' })
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Admin')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', { 'type': 'checkbox', 'id': 'new-admin' }),
					' ', _('Grant admin privileges')
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': ui.createHandlerFn(this, function() {
						var username = document.getElementById('new-username').value;
						var email = document.getElementById('new-email').value;
						var password = document.getElementById('new-password').value;
						var admin = document.getElementById('new-admin').checked;

						if (!username || !email || !password) {
							ui.addNotification(null, E('p', _('All fields are required')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Creating User...'), [
							E('p', { 'class': 'spinning' }, _('Creating user...'))
						]);

						return callCreateUser(username, email, password, admin).then(L.bind(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', res.message || _('User created successfully')), 'success');
								return this.pollUsers();
							} else {
								ui.addNotification(null, E('p', res.error || _('Failed to create user')), 'error');
							}
						}, this));
					})
				}, _('Create'))
			])
		]);
	},

	handleDelete: function(username) {
		return ui.showModal(_('Delete User'), [
			E('p', _('Are you sure you want to delete user "%s"?').format(username)),
			E('p', { 'class': 'alert-message warning' }, _('This action cannot be undone. All posts and data will be lost.')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': ui.createHandlerFn(this, function() {
						ui.hideModal();
						return callDeleteUser(username).then(L.bind(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', res.message || _('User deleted')), 'success');
								return this.pollUsers();
							} else {
								ui.addNotification(null, E('p', res.error || _('Failed to delete user')), 'error');
							}
						}, this));
					})
				}, _('Delete'))
			])
		]);
	},

	handlePromote: function(username) {
		return callPromoteUser(username).then(L.bind(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', res.message || _('User promoted')), 'success');
				return this.pollUsers();
			} else {
				ui.addNotification(null, E('p', res.error || _('Failed to promote user')), 'error');
			}
		}, this));
	},

	handleDemote: function(username) {
		return callDemoteUser(username).then(L.bind(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', res.message || _('User demoted')), 'success');
				return this.pollUsers();
			} else {
				ui.addNotification(null, E('p', res.error || _('Failed to demote user')), 'error');
			}
		}, this));
	},

	render: function(data) {
		this.users = data.users || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', _('GoToSocial Users')),
			E('div', { 'class': 'cbi-map-descr' }, _('Manage user accounts for your Fediverse instance.')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'margin-bottom:10px' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, this.handleCreate)
					}, _('Create User'))
				]),

				E('table', { 'class': 'table' }, [
					E('thead', {}, [
						E('tr', { 'class': 'tr' }, [
							E('th', { 'class': 'th' }, _('Username')),
							E('th', { 'class': 'th' }, _('Email')),
							E('th', { 'class': 'th' }, _('Role')),
							E('th', { 'class': 'th' }, _('Status')),
							E('th', { 'class': 'th' }, _('Actions'))
						])
					]),
					E('tbody', { 'id': 'users-tbody' })
				])
			]),

			E('style', {}, `
				.badge { padding: 2px 8px; border-radius: 3px; background: #666; color: white; }
				.badge.success { background: #4CAF50; }
				.badge.warning { background: #FF9800; }
			`)
		]);

		this.updateUserTable();
		poll.add(L.bind(this.pollUsers, this), 10);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
