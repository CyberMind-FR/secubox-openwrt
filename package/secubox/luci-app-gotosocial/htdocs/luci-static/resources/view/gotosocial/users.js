'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

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

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/gotosocial/overview' },
			{ name: 'Users', path: 'admin/services/gotosocial/users' },
			{ name: 'Settings', path: 'admin/services/gotosocial/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	updateUserTable: function() {
		var tbody = document.getElementById('users-tbody');
		if (!tbody) return;

		while (tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		if (this.users.length === 0) {
			tbody.appendChild(E('tr', {}, [
				E('td', { 'colspan': '5', 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No users found')
			]));
			return;
		}

		var self = this;
		this.users.forEach(function(user) {
			var row = E('tr', {}, [
				E('td', { 'style': 'font-family: monospace;' }, user.username || '-'),
				E('td', {}, user.email || '-'),
				E('td', {}, [
					user.admin ?
						KissTheme.badge('Admin', 'purple') :
						KissTheme.badge('User', 'blue')
				]),
				E('td', {}, [
					user.confirmed ?
						KissTheme.badge('Confirmed', 'green') :
						KissTheme.badge('Pending', 'orange')
				]),
				E('td', {}, [
					E('div', { 'style': 'display: flex; gap: 6px;' }, [
						user.admin ?
							E('button', {
								'class': 'kiss-btn',
								'style': 'padding: 4px 10px; font-size: 11px;',
								'click': ui.createHandlerFn(self, self.handleDemote, user.username)
							}, 'Demote') :
							E('button', {
								'class': 'kiss-btn kiss-btn-blue',
								'style': 'padding: 4px 10px; font-size: 11px;',
								'click': ui.createHandlerFn(self, self.handlePromote, user.username)
							}, 'Promote'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 11px;',
							'click': ui.createHandlerFn(self, self.handleDelete, user.username)
						}, 'Delete')
					])
				])
			]);
			tbody.appendChild(row);
		});
	},

	handleCreate: function() {
		var self = this;
		return ui.showModal('Create User', [
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Username'),
					E('input', {
						'type': 'text',
						'id': 'new-username',
						'placeholder': 'johndoe',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Email'),
					E('input', {
						'type': 'email',
						'id': 'new-email',
						'placeholder': 'john@example.com',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Password'),
					E('input', {
						'type': 'password',
						'id': 'new-password',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					E('input', { 'type': 'checkbox', 'id': 'new-admin' }),
					E('label', { 'for': 'new-admin', 'style': 'font-size: 12px;' }, 'Grant admin privileges')
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var username = document.getElementById('new-username').value;
						var email = document.getElementById('new-email').value;
						var password = document.getElementById('new-password').value;
						var admin = document.getElementById('new-admin').checked;

						if (!username || !email || !password) {
							ui.addNotification(null, E('p', 'All fields are required'), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal('Creating User...', [
							E('p', { 'class': 'spinning' }, 'Creating user...')
						]);

						return callCreateUser(username, email, password, admin).then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', res.message || 'User created successfully'), 'success');
								return self.pollUsers();
							} else {
								ui.addNotification(null, E('p', res.error || 'Failed to create user'), 'error');
							}
						});
					}
				}, 'Create')
			])
		]);
	},

	handleDelete: function(username) {
		var self = this;
		return ui.showModal('Delete User', [
			E('p', {}, 'Are you sure you want to delete user "' + username + '"?'),
			E('p', { 'style': 'color: var(--kiss-red); font-size: 12px;' }, 'This action cannot be undone. All posts and data will be lost.'),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						return callDeleteUser(username).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', res.message || 'User deleted'), 'success');
								return self.pollUsers();
							} else {
								ui.addNotification(null, E('p', res.error || 'Failed to delete user'), 'error');
							}
						});
					}
				}, 'Delete')
			])
		]);
	},

	handlePromote: function(username) {
		var self = this;
		return callPromoteUser(username).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', res.message || 'User promoted'), 'success');
				return self.pollUsers();
			} else {
				ui.addNotification(null, E('p', res.error || 'Failed to promote user'), 'error');
			}
		});
	},

	handleDemote: function(username) {
		var self = this;
		return callDemoteUser(username).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', res.message || 'User demoted'), 'success');
				return self.pollUsers();
			} else {
				ui.addNotification(null, E('p', res.error || 'Failed to demote user'), 'error');
			}
		});
	},

	renderUsersTable: function() {
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Username'),
					E('th', {}, 'Email'),
					E('th', {}, 'Role'),
					E('th', {}, 'Status'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', { 'id': 'users-tbody' })
		]);
	},

	render: function(data) {
		this.users = data.users || [];

		poll.add(L.bind(this.pollUsers, this), 10);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'GoToSocial Users'),
					KissTheme.badge(this.users.length + ' USERS', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Manage user accounts for your Fediverse instance')
			]),

			// Navigation
			this.renderNav('users'),

			// Actions
			E('div', { 'style': 'margin: 20px 0;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': ui.createHandlerFn(this, this.handleCreate)
				}, 'Create User')
			]),

			// Users table
			KissTheme.card('Users', this.renderUsersTable())
		];

		var view = KissTheme.wrap(content, 'admin/services/gotosocial/users');

		// Populate table after render
		setTimeout(L.bind(this.updateUserTable, this), 0);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
