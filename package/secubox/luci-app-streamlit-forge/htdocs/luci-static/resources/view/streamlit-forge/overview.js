'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require poll';

var callList = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'list',
	expect: {}
});

var callStatus = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'status',
	expect: {}
});

var callTemplates = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'templates',
	expect: {}
});

var callCreate = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'create',
	params: ['name', 'template'],
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'start',
	params: ['name'],
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'stop',
	params: ['name'],
	expect: {}
});

var callDelete = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'delete',
	params: ['name'],
	expect: {}
});

var callExpose = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'expose',
	params: ['name', 'domain'],
	expect: {}
});

var callPublish = rpc.declare({
	object: 'luci.streamlit-forge',
	method: 'publish',
	params: ['name'],
	expect: {}
});

return view.extend({
	apps: [],
	templates: [],
	status: {},

	load: function() {
		return Promise.all([
			callList(),
			callStatus(),
			callTemplates()
		]);
	},

	render: function(data) {
		var self = this;
		this.apps = (data[0] && data[0].apps) || [];
		this.status = data[1] || {};
		this.templates = (data[2] && data[2].templates) || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Streamlit Forge'),
			E('div', { 'class': 'cbi-map-descr' },
				'Create, manage, and publish Streamlit applications.'),

			// Status cards
			E('div', { 'class': 'sh-stats', 'style': 'display:flex;gap:1rem;margin:1rem 0;flex-wrap:wrap;' }, [
				this.renderStatCard('Running', this.status.running || 0, '#4caf50'),
				this.renderStatCard('Total Apps', this.status.total || 0, '#2196f3'),
				this.renderStatCard('LXC Container', this.status.lxc_status || 'unknown',
					this.status.lxc_status === 'running' ? '#4caf50' : '#ff9800')
			]),

			// Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Actions'),
				E('div', { 'style': 'display:flex;gap:0.5rem;flex-wrap:wrap;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-add',
						'click': ui.createHandlerFn(this, 'handleCreate')
					}, '+ Create App'),
					E('button', {
						'class': 'cbi-button',
						'click': ui.createHandlerFn(this, 'handleRefresh')
					}, 'Refresh')
				])
			]),

			// Apps table
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Applications'),
				this.renderAppsTable()
			])
		]);

		poll.add(L.bind(this.pollStatus, this), 10);

		return view;
	},

	renderStatCard: function(label, value, color) {
		return E('div', {
			'style': 'background:#1a1a2e;border-left:4px solid ' + color + ';padding:1rem;min-width:120px;border-radius:4px;'
		}, [
			E('div', { 'style': 'font-size:1.5rem;font-weight:bold;color:' + color }, String(value)),
			E('div', { 'style': 'color:#888;font-size:0.85rem;' }, label)
		]);
	},

	renderAppsTable: function() {
		if (!this.apps.length) {
			return E('p', { 'class': 'cbi-value-description' },
				'No apps found. Click "Create App" to get started.');
		}

		var rows = this.apps.map(L.bind(function(app) {
			var isRunning = app.status === 'running';
			var statusBadge = E('span', {
				'class': 'badge',
				'style': 'background:' + (isRunning ? '#4caf50' : '#666') + ';color:#fff;padding:2px 8px;border-radius:10px;font-size:0.8rem;'
			}, isRunning ? 'Running' : 'Stopped');

			var actions = E('div', { 'style': 'display:flex;gap:4px;flex-wrap:wrap;' }, [
				isRunning ?
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'style': 'padding:4px 8px;font-size:0.8rem;',
						'click': ui.createHandlerFn(this, 'handleStop', app.name)
					}, 'Stop') :
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'style': 'padding:4px 8px;font-size:0.8rem;',
						'click': ui.createHandlerFn(this, 'handleStart', app.name)
					}, 'Start'),
				isRunning && app.port ?
					E('a', {
						'class': 'cbi-button',
						'style': 'padding:4px 8px;font-size:0.8rem;text-decoration:none;',
						'href': 'http://' + window.location.hostname + ':' + app.port,
						'target': '_blank'
					}, 'Open') : '',
				!app.domain ?
					E('button', {
						'class': 'cbi-button',
						'style': 'padding:4px 8px;font-size:0.8rem;',
						'click': ui.createHandlerFn(this, 'handleExpose', app.name)
					}, 'Expose') : '',
				E('button', {
					'class': 'cbi-button',
					'style': 'padding:4px 8px;font-size:0.8rem;',
					'click': ui.createHandlerFn(this, 'handlePublish', app.name)
				}, 'Publish'),
				E('button', {
					'class': 'cbi-button cbi-button-remove',
					'style': 'padding:4px 8px;font-size:0.8rem;',
					'click': ui.createHandlerFn(this, 'handleDelete', app.name)
				}, 'Delete')
			]);

			return E('tr', {}, [
				E('td', {}, app.name),
				E('td', {}, statusBadge),
				E('td', {}, app.port || '-'),
				E('td', {}, app.domain ? E('a', { 'href': 'https://' + app.domain, 'target': '_blank' }, app.domain) : '-'),
				E('td', {}, app.created || '-'),
				E('td', {}, actions)
			]);
		}, this));

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Name'),
				E('th', { 'class': 'th' }, 'Status'),
				E('th', { 'class': 'th' }, 'Port'),
				E('th', { 'class': 'th' }, 'Domain'),
				E('th', { 'class': 'th' }, 'Created'),
				E('th', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
	},

	pollStatus: function() {
		var self = this;
		return Promise.all([callList(), callStatus()]).then(function(data) {
			self.apps = (data[0] && data[0].apps) || [];
			self.status = data[1] || {};

			var container = document.querySelector('.cbi-map');
			if (container) {
				var statsDiv = container.querySelector('.sh-stats');
				if (statsDiv) {
					statsDiv.innerHTML = '';
					statsDiv.appendChild(self.renderStatCard('Running', self.status.running || 0, '#4caf50'));
					statsDiv.appendChild(self.renderStatCard('Total Apps', self.status.total || 0, '#2196f3'));
					statsDiv.appendChild(self.renderStatCard('LXC Container', self.status.lxc_status || 'unknown',
						self.status.lxc_status === 'running' ? '#4caf50' : '#ff9800'));
				}

				var tableSection = container.querySelectorAll('.cbi-section')[1];
				if (tableSection) {
					var oldTable = tableSection.querySelector('table, p');
					if (oldTable) {
						oldTable.replaceWith(self.renderAppsTable());
					}
				}
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
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'App Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'new-app-name', 'class': 'cbi-input-text', 'placeholder': 'myapp' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Template'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'new-app-template', 'class': 'cbi-input-select' }, templateOptions)
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var name = document.getElementById('new-app-name').value.trim();
						var template = document.getElementById('new-app-template').value;

						if (!name) {
							ui.addNotification(null, E('p', 'Please enter an app name'));
							return;
						}

						if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
							ui.addNotification(null, E('p', 'Invalid app name. Use letters, numbers, underscore, hyphen.'));
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
		ui.showModal('Starting App...', [
			E('p', { 'class': 'spinning' }, 'Starting ' + name + '...')
		]);

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
		if (!confirm('Delete app "' + name + '"? This cannot be undone.')) {
			return;
		}

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
		var domain = prompt('Enter domain for ' + name + ' (leave empty for auto):', name + '.apps.secubox.in');
		if (domain === null) return;

		ui.showModal('Exposing App...', [
			E('p', { 'class': 'spinning' }, 'Creating vhost and SSL certificate...')
		]);

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

	handlePublish: function(name) {
		var self = this;
		ui.showModal('Publishing...', [
			E('p', { 'class': 'spinning' }, 'Publishing to mesh catalog...')
		]);

		return callPublish(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'App published to mesh catalog'));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed to publish')));
			}
			return self.pollStatus();
		});
	}
});
