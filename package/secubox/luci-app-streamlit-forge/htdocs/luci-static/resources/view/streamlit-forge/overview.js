'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callList = rpc.declare({ object: 'luci.streamlit-forge', method: 'list', expect: {} });
var callStatus = rpc.declare({ object: 'luci.streamlit-forge', method: 'status', expect: {} });
var callTemplates = rpc.declare({ object: 'luci.streamlit-forge', method: 'templates', expect: {} });
var callCreate = rpc.declare({ object: 'luci.streamlit-forge', method: 'create', params: ['name', 'template'], expect: {} });
var callStart = rpc.declare({ object: 'luci.streamlit-forge', method: 'start', params: ['name'], expect: {} });
var callStop = rpc.declare({ object: 'luci.streamlit-forge', method: 'stop', params: ['name'], expect: {} });
var callDelete = rpc.declare({ object: 'luci.streamlit-forge', method: 'delete', params: ['name'], expect: {} });
var callExpose = rpc.declare({ object: 'luci.streamlit-forge', method: 'expose', params: ['name', 'domain'], expect: {} });
var callGiteaStatus = rpc.declare({ object: 'luci.streamlit-forge', method: 'gitea_status', expect: {} });
var callEdit = rpc.declare({ object: 'luci.streamlit-forge', method: 'edit', params: ['name'], expect: {} });
var callPull = rpc.declare({ object: 'luci.streamlit-forge', method: 'pull', params: ['name'], expect: {} });

return view.extend({
	apps: [],
	templates: [],
	status: {},
	giteaStatus: {},

	load: function() {
		return Promise.all([
			callList(),
			callStatus(),
			callTemplates(),
			callGiteaStatus().catch(function() { return {}; })
		]);
	},

	renderStats: function(status, giteaStatus) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.running || 0, 'Running', c.green),
			KissTheme.stat(status.total || 0, 'Total Apps', c.blue),
			KissTheme.stat(status.lxc_status === 'running' ? 'UP' : 'DOWN', 'LXC', status.lxc_status === 'running' ? c.green : c.orange),
			KissTheme.stat(giteaStatus.gitea_available === 'true' ? 'v' + (giteaStatus.gitea_version || '?') : 'OFF', 'Gitea', giteaStatus.gitea_available === 'true' ? c.purple : c.red)
		];
	},

	renderAppCard: function(app) {
		var self = this;
		var isRunning = app.status === 'running';

		var actions = E('div', { 'style': 'display: flex; gap: 6px; flex-wrap: wrap;' }, [
			isRunning ?
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, 'handleStop', app.name)
				}, 'Stop') :
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, 'handleStart', app.name)
				}, 'Start'),
			isRunning && app.port ? E('a', {
				'class': 'kiss-btn kiss-btn-blue',
				'style': 'padding: 4px 10px; font-size: 11px; text-decoration: none;',
				'href': 'http://' + window.location.hostname + ':' + app.port,
				'target': '_blank'
			}, 'Open') : '',
			E('button', {
				'class': 'kiss-btn',
				'style': 'padding: 4px 10px; font-size: 11px;',
				'click': ui.createHandlerFn(this, 'handleEdit', app.name)
			}, 'Edit'),
			E('button', {
				'class': 'kiss-btn',
				'style': 'padding: 4px 10px; font-size: 11px;',
				'click': ui.createHandlerFn(this, 'handlePull', app.name)
			}, 'Pull'),
			!app.domain ? E('button', {
				'class': 'kiss-btn',
				'style': 'padding: 4px 10px; font-size: 11px;',
				'click': ui.createHandlerFn(this, 'handleExpose', app.name)
			}, 'Expose') : '',
			E('button', {
				'class': 'kiss-btn kiss-btn-red',
				'style': 'padding: 4px 10px; font-size: 11px;',
				'click': ui.createHandlerFn(this, 'handleDelete', app.name)
			}, 'Delete')
		]);

		return E('div', {
			'style': 'background: var(--kiss-bg2); border-radius: 8px; padding: 16px; border-left: 3px solid ' + (isRunning ? 'var(--kiss-green)' : 'var(--kiss-muted)') + ';'
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600; font-size: 14px;' }, app.name),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Port: ' + (app.port || '-'))
				]),
				KissTheme.badge(isRunning ? 'RUNNING' : 'STOPPED', isRunning ? 'green' : 'red')
			]),
			app.domain ? E('div', { 'style': 'font-size: 11px; margin-bottom: 8px;' }, [
				E('a', { 'href': 'https://' + app.domain, 'target': '_blank', 'style': 'color: var(--kiss-cyan);' }, app.domain)
			]) : '',
			E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); margin-bottom: 10px;' }, 'Created: ' + (app.created || '-')),
			actions
		]);
	},

	render: function(data) {
		var self = this;
		this.apps = (data[0] && data[0].apps) || [];
		this.status = data[1] || {};
		this.templates = (data[2] && data[2].templates) || [];
		this.giteaStatus = data[3] || {};

		poll.add(L.bind(this.pollStatus, this), 10);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Streamlit Forge'),
					KissTheme.badge(this.apps.length + ' APPS', 'purple')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Create and manage Streamlit applications')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'forge-stats', 'style': 'margin: 20px 0;' }, this.renderStats(this.status, this.giteaStatus)),

			// Actions
			E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': ui.createHandlerFn(this, 'handleCreate')
				}, '+ Create App'),
				E('button', {
					'class': 'kiss-btn',
					'click': ui.createHandlerFn(this, 'handleRefresh')
				}, 'Refresh')
			]),

			// Apps grid
			KissTheme.card('Applications (' + this.apps.length + ')',
				this.apps.length > 0 ?
					E('div', { 'id': 'apps-container', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;' },
						this.apps.map(function(app) { return self.renderAppCard(app); })
					) :
					E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
						'No apps found. Click "Create App" to get started.')
			)
		];

		return KissTheme.wrap(content, 'admin/services/streamlit-forge/overview');
	},

	pollStatus: function() {
		var self = this;
		return Promise.all([callList(), callStatus()]).then(function(data) {
			self.apps = (data[0] && data[0].apps) || [];
			self.status = data[1] || {};

			var statsEl = document.getElementById('forge-stats');
			if (statsEl) {
				statsEl.innerHTML = '';
				self.renderStats(self.status, self.giteaStatus).forEach(function(el) { statsEl.appendChild(el); });
			}

			var appsContainer = document.getElementById('apps-container');
			if (appsContainer) {
				appsContainer.innerHTML = '';
				self.apps.forEach(function(app) {
					appsContainer.appendChild(self.renderAppCard(app));
				});
			}
		});
	},

	handleRefresh: function() {
		return this.pollStatus();
	},

	handleCreate: function() {
		var self = this;
		var templates = this.templates;

		var templateOptions = templates.map(function(t) {
			return E('option', { 'value': t.name }, t.name + ' - ' + (t.description || 'No description'));
		});

		ui.showModal('Create New App', [
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'App Name'),
					E('input', {
						'type': 'text',
						'id': 'new-app-name',
						'placeholder': 'myapp',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Template'),
					E('select', {
						'id': 'new-app-template',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					}, templateOptions)
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var name = document.getElementById('new-app-name').value.trim();
						var template = document.getElementById('new-app-template').value;

						if (!name) {
							ui.addNotification(null, E('p', 'Please enter an app name'));
							return;
						}

						if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
							ui.addNotification(null, E('p', 'Invalid name. Use letters, numbers, underscore, hyphen.'));
							return;
						}

						ui.hideModal();
						ui.showModal('Creating App...', [
							E('p', { 'class': 'spinning' }, 'Creating ' + name + ' from ' + template + ' template...')
						]);

						callCreate(name, template).then(function(res) {
							ui.hideModal();
							if (res.code === 0) {
								ui.addNotification(null, E('p', 'App created successfully!'));
								self.pollStatus();
							} else {
								ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Unknown error')));
							}
						});
					}
				}, 'Create')
			])
		]);
	},

	handleStart: function(name) {
		var self = this;
		ui.showModal('Starting App...', [E('p', { 'class': 'spinning' }, 'Starting ' + name + '...')]);

		return callStart(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'App started!'));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed to start')));
			}
			return self.pollStatus();
		});
	},

	handleStop: function(name) {
		var self = this;
		return callStop(name).then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'App stopped'));
			}
			return self.pollStatus();
		});
	},

	handleDelete: function(name) {
		var self = this;
		if (!confirm('Delete app "' + name + '"? This cannot be undone.')) return;

		return callDelete(name).then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'App deleted'));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed to delete')));
			}
			return self.pollStatus();
		});
	},

	handleExpose: function(name) {
		var self = this;
		var domain = prompt('Enter domain for ' + name + ':', name + '.apps.secubox.in');
		if (domain === null) return;

		ui.showModal('Exposing App...', [E('p', { 'class': 'spinning' }, 'Creating vhost and SSL certificate...')]);

		return callExpose(name, domain || '').then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'App exposed at ' + (domain || 'auto-domain')));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed to expose')));
			}
			return self.pollStatus();
		});
	},

	handleEdit: function(name) {
		ui.showModal('Opening Editor...', [E('p', { 'class': 'spinning' }, 'Setting up Gitea repository...')]);

		return callEdit(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0 && res.edit_url) {
				ui.showModal('Edit in Gitea', [
					E('p', {}, 'Your app is ready for editing in Gitea:'),
					E('p', {}, [
						E('a', { 'href': res.edit_url, 'target': '_blank', 'style': 'color: var(--kiss-purple);' }, res.edit_url)
					]),
					E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px;' },
						'After editing, click "Pull" to sync changes to this device.'),
					E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
						E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close'),
						E('a', {
							'class': 'kiss-btn kiss-btn-purple',
							'href': res.edit_url,
							'target': '_blank',
							'style': 'text-decoration: none;'
						}, 'Open Editor')
					])
				]);
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed to open editor')));
			}
		});
	},

	handlePull: function(name) {
		var self = this;
		ui.showModal('Pulling Changes...', [E('p', { 'class': 'spinning' }, 'Pulling latest from Gitea...')]);

		return callPull(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Changes pulled successfully'));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed to pull')));
			}
			return self.pollStatus();
		});
	}
});
