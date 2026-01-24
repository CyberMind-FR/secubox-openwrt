'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require gitea.api as api';

return view.extend({
	usersData: null,
	statusData: null,

	load: function() {
		var self = this;
		return Promise.all([
			api.getStatus(),
			api.listUsers()
		]).then(function(results) {
			self.statusData = results[0] || {};
			self.usersData = results[1] || [];
			return results;
		});
	},

	render: function() {
		var self = this;

		// Inject CSS
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('gitea/dashboard.css')
		});

		var container = E('div', { 'class': 'gitea-dashboard' }, [
			cssLink,
			this.renderHeader(),
			this.renderContent()
		]);

		// Poll for updates
		poll.add(function() {
			return api.listUsers().then(function(data) {
				self.usersData = data;
				self.updateUserList();
			});
		}, 30);

		return container;
	},

	renderHeader: function() {
		var self = this;
		var users = this.usersData || [];

		return E('div', { 'class': 'gt-header' }, [
			E('div', { 'class': 'gt-header-content' }, [
				E('div', { 'class': 'gt-logo' }, '\uD83D\uDC65'),
				E('div', {}, [
					E('h1', { 'class': 'gt-title' }, _('USER MANAGEMENT')),
					E('p', { 'class': 'gt-subtitle' }, _('Gitea User Administration'))
				]),
				E('div', { 'class': 'gt-status-badge running' }, [
					E('span', {}, '\uD83D\uDC65'),
					' ' + users.length + ' ' + _('Users')
				])
			])
		]);
	},

	renderContent: function() {
		var self = this;
		var status = this.statusData;
		var users = this.usersData || [];

		if (!status.installed) {
			return E('div', { 'class': 'gt-card' }, [
				E('div', { 'class': 'gt-card-body' }, [
					E('div', { 'class': 'gt-empty' }, [
						E('div', { 'class': 'gt-empty-icon' }, '\uD83D\uDC65'),
						E('div', {}, _('Gitea is not installed')),
						E('p', {}, _('Install Gitea from the Overview page to manage users.'))
					])
				])
			]);
		}

		if (!status.running) {
			return E('div', { 'class': 'gt-card' }, [
				E('div', { 'class': 'gt-card-body' }, [
					E('div', { 'class': 'gt-empty' }, [
						E('div', { 'class': 'gt-empty-icon' }, '\u26A0\uFE0F'),
						E('div', {}, _('Gitea is not running')),
						E('p', {}, _('Start Gitea to manage users.'))
					])
				])
			]);
		}

		return E('div', { 'class': 'gt-main-grid' }, [
			this.renderCreateAdminCard(),
			this.renderUserListCard(users)
		]);
	},

	renderCreateAdminCard: function() {
		var self = this;

		return E('div', { 'class': 'gt-card' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83D\uDC64'),
					' ' + _('Create Admin User')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('Username')),
					E('input', {
						'type': 'text',
						'class': 'gt-form-input',
						'id': 'new-username',
						'placeholder': 'admin'
					})
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('Password')),
					E('input', {
						'type': 'password',
						'class': 'gt-form-input',
						'id': 'new-password',
						'placeholder': '********'
					})
				]),
				E('div', { 'class': 'gt-form-group' }, [
					E('label', { 'class': 'gt-form-label' }, _('Email')),
					E('input', {
						'type': 'email',
						'class': 'gt-form-input',
						'id': 'new-email',
						'placeholder': 'admin@localhost'
					})
				]),
				E('button', {
					'class': 'gt-btn gt-btn-success',
					'click': function() { self.handleCreateAdmin(); }
				}, [E('span', {}, '\u2795'), ' ' + _('Create Admin')])
			])
		]);
	},

	renderUserListCard: function(users) {
		if (users.length === 0) {
			return E('div', { 'class': 'gt-card' }, [
				E('div', { 'class': 'gt-card-header' }, [
					E('div', { 'class': 'gt-card-title' }, [
						E('span', {}, '\uD83D\uDC65'),
						' ' + _('User List')
					])
				]),
				E('div', { 'class': 'gt-card-body' }, [
					E('div', { 'class': 'gt-empty' }, [
						E('div', { 'class': 'gt-empty-icon' }, '\uD83D\uDC64'),
						E('div', {}, _('No users found')),
						E('p', {}, _('Create your first admin user above, or through the Gitea web interface.'))
					])
				])
			]);
		}

		return E('div', { 'class': 'gt-card' }, [
			E('div', { 'class': 'gt-card-header' }, [
				E('div', { 'class': 'gt-card-title' }, [
					E('span', {}, '\uD83D\uDC65'),
					' ' + _('User List')
				])
			]),
			E('div', { 'class': 'gt-card-body' }, [
				E('table', { 'class': 'gt-table', 'id': 'user-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('Username')),
							E('th', {}, _('Email')),
							E('th', {}, _('Role')),
							E('th', {}, _('Created'))
						])
					]),
					E('tbody', {},
						users.map(function(user) {
							var created = user.created ? new Date(user.created * 1000).toLocaleDateString() : '-';
							return E('tr', {}, [
								E('td', { 'class': 'gt-repo-name' }, user.name),
								E('td', {}, user.email || '-'),
								E('td', {}, [
									user.is_admin ?
										E('span', { 'class': 'gt-badge gt-badge-admin' }, 'Admin') :
										E('span', { 'class': 'gt-badge gt-badge-user' }, 'User')
								]),
								E('td', {}, created)
							]);
						})
					)
				])
			])
		]);
	},

	updateUserList: function() {
		var table = document.getElementById('user-table');
		if (!table) return;

		var users = this.usersData || [];
		var tbody = table.querySelector('tbody');
		if (!tbody) return;

		tbody.innerHTML = '';
		users.forEach(function(user) {
			var created = user.created ? new Date(user.created * 1000).toLocaleDateString() : '-';
			var row = E('tr', {}, [
				E('td', { 'class': 'gt-repo-name' }, user.name),
				E('td', {}, user.email || '-'),
				E('td', {}, [
					user.is_admin ?
						E('span', { 'class': 'gt-badge gt-badge-admin' }, 'Admin') :
						E('span', { 'class': 'gt-badge gt-badge-user' }, 'User')
				]),
				E('td', {}, created)
			]);
			tbody.appendChild(row);
		});
	},

	handleCreateAdmin: function() {
		var self = this;
		var username = document.getElementById('new-username').value;
		var password = document.getElementById('new-password').value;
		var email = document.getElementById('new-email').value;

		if (!username || !password || !email) {
			ui.addNotification(null, E('p', {}, _('Please fill in all fields')), 'error');
			return;
		}

		api.createAdmin(username, password, email).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Admin user created: ') + username), 'success');
				// Clear form
				document.getElementById('new-username').value = '';
				document.getElementById('new-password').value = '';
				document.getElementById('new-email').value = '';
				// Refresh user list
				return api.listUsers().then(function(data) {
					self.usersData = data;
					self.updateUserList();
				});
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to create user')), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', {}, _('Failed to create user: ') + err.message), 'error');
		});
	}
});
