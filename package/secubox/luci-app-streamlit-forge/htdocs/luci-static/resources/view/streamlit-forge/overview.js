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
var callNfoRead = rpc.declare({ object: 'luci.streamlit-forge', method: 'nfo_read', params: ['name'], expect: {} });
var callNfoWrite = rpc.declare({ object: 'luci.streamlit-forge', method: 'nfo_write', params: ['name', 'data'], expect: {} });
var callNfoValidate = rpc.declare({ object: 'luci.streamlit-forge', method: 'nfo_validate', params: ['name'], expect: {} });

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
				'class': 'kiss-btn kiss-btn-purple',
				'style': 'padding: 4px 10px; font-size: 11px;',
				'click': ui.createHandlerFn(this, 'handleNfo', app.name),
				'title': 'Edit NFO Manifest'
			}, 'NFO'),
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
	},

	handleNfo: function(name) {
		var self = this;
		ui.showModal('Loading NFO...', [E('p', { 'class': 'spinning' }, 'Loading manifest for ' + name + '...')]);

		return Promise.all([
			callNfoRead(name),
			callNfoValidate(name)
		]).then(function(results) {
			var nfoData = results[0] || {};
			var validation = results[1] || {};

			ui.hideModal();
			self.showNfoEditor(name, nfoData, validation);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error loading NFO: ' + err.message));
		});
	},

	showNfoEditor: function(name, nfoData, validation) {
		var self = this;
		var hasNfo = nfoData.exists !== false && nfoData.identity;

		// Build form fields
		var formFields = [];

		// Identity section
		formFields.push(E('div', { 'style': 'margin-bottom: 16px;' }, [
			E('h4', { 'style': 'margin: 0 0 12px 0; color: var(--kiss-purple);' }, 'Identity'),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;' }, [
				E('div', {}, [
					E('label', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Name'),
					E('input', {
						'id': 'nfo-name',
						'type': 'text',
						'value': (nfoData.identity && nfoData.identity.name) || name,
						'style': 'width: 100%; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px; border-radius: 4px;'
					})
				]),
				E('div', {}, [
					E('label', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Version'),
					E('input', {
						'id': 'nfo-version',
						'type': 'text',
						'value': (nfoData.identity && nfoData.identity.version) || '1.0.0',
						'style': 'width: 100%; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px; border-radius: 4px;'
					})
				])
			])
		]));

		// Description section
		formFields.push(E('div', { 'style': 'margin-bottom: 16px;' }, [
			E('h4', { 'style': 'margin: 0 0 12px 0; color: var(--kiss-cyan);' }, 'Description'),
			E('div', {}, [
				E('label', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Short Description'),
				E('input', {
					'id': 'nfo-short',
					'type': 'text',
					'value': (nfoData.description && nfoData.description.short) || '',
					'placeholder': 'Brief description of your app',
					'style': 'width: 100%; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px; border-radius: 4px;'
				})
			])
		]));

		// Tags section
		formFields.push(E('div', { 'style': 'margin-bottom: 16px;' }, [
			E('h4', { 'style': 'margin: 0 0 12px 0; color: var(--kiss-green);' }, 'Classification'),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;' }, [
				E('div', {}, [
					E('label', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Category'),
					E('select', {
						'id': 'nfo-category',
						'style': 'width: 100%; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px; border-radius: 4px;'
					}, [
						E('option', { 'value': 'dashboard', 'selected': (nfoData.tags && nfoData.tags.category) === 'dashboard' }, 'Dashboard'),
						E('option', { 'value': 'analytics', 'selected': (nfoData.tags && nfoData.tags.category) === 'analytics' }, 'Analytics'),
						E('option', { 'value': 'data', 'selected': (nfoData.tags && nfoData.tags.category) === 'data' }, 'Data'),
						E('option', { 'value': 'visualization', 'selected': (nfoData.tags && nfoData.tags.category) === 'visualization' }, 'Visualization'),
						E('option', { 'value': 'utility', 'selected': (nfoData.tags && nfoData.tags.category) === 'utility' }, 'Utility'),
						E('option', { 'value': 'administration', 'selected': (nfoData.tags && nfoData.tags.category) === 'administration' }, 'Administration'),
						E('option', { 'value': 'other', 'selected': (nfoData.tags && nfoData.tags.category) === 'other' }, 'Other')
					])
				]),
				E('div', {}, [
					E('label', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Keywords (comma-separated)'),
					E('input', {
						'id': 'nfo-keywords',
						'type': 'text',
						'value': (nfoData.tags && nfoData.tags.keywords) || '',
						'placeholder': 'dashboard, monitoring, charts',
						'style': 'width: 100%; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px; border-radius: 4px;'
					})
				])
			])
		]));

		// AI Dynamics section
		formFields.push(E('div', { 'style': 'margin-bottom: 16px;' }, [
			E('h4', { 'style': 'margin: 0 0 12px 0; color: var(--kiss-orange);' }, 'AI Context'),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Capabilities (comma-separated)'),
				E('input', {
					'id': 'nfo-capabilities',
					'type': 'text',
					'value': (nfoData.dynamics && nfoData.dynamics.capabilities) || '',
					'placeholder': 'data-visualization, export, real-time',
					'style': 'width: 100%; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px; border-radius: 4px;'
				})
			])
		]));

		// Validation status
		var validationEl = '';
		if (validation) {
			var scoreColor = (validation.completeness >= 80) ? 'var(--kiss-green)' :
			                 (validation.completeness >= 50) ? 'var(--kiss-orange)' : 'var(--kiss-red)';
			validationEl = E('div', {
				'style': 'background: var(--kiss-bg2); padding: 12px; border-radius: 6px; margin-bottom: 16px;'
			}, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('span', { 'style': 'font-weight: 600;' }, 'Validation'),
					validation.completeness !== undefined ?
						E('span', { 'style': 'color: ' + scoreColor + '; font-weight: 600;' }, validation.completeness + '% Complete') :
						E('span', { 'style': 'color: ' + (validation.valid ? 'var(--kiss-green)' : 'var(--kiss-red)') }, validation.valid ? 'Valid' : 'Issues Found')
				]),
				validation.has_ai_context !== undefined ?
					E('div', { 'style': 'font-size: 11px; margin-top: 8px; color: var(--kiss-muted);' },
						validation.has_ai_context ? '\u2713 Has AI context' : '\u26A0 No AI context defined'
					) : ''
			]);
		}

		ui.showModal('NFO Manifest - ' + name, [
			E('div', { 'style': 'max-height: 70vh; overflow-y: auto;' }, [
				validationEl,
				E('div', {}, formFields)
			]),
			E('div', { 'style': 'display: flex; justify-content: space-between; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--kiss-line);' }, [
				E('div', {}, [
					!hasNfo ? E('span', { 'style': 'color: var(--kiss-orange); font-size: 11px;' }, 'New NFO will be created') : ''
				]),
				E('div', { 'style': 'display: flex; gap: 8px;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() {
							self.saveNfo(name);
						}
					}, 'Save')
				])
			])
		]);
	},

	saveNfo: function(name) {
		var self = this;

		// Collect form values
		var nfoData = {
			identity: {
				id: name,
				name: document.getElementById('nfo-name').value.trim() || name,
				version: document.getElementById('nfo-version').value.trim() || '1.0.0'
			},
			description: {
				short: document.getElementById('nfo-short').value.trim()
			},
			tags: {
				category: document.getElementById('nfo-category').value,
				keywords: document.getElementById('nfo-keywords').value.trim()
			},
			dynamics: {
				capabilities: document.getElementById('nfo-capabilities').value.trim()
			}
		};

		ui.hideModal();
		ui.showModal('Saving NFO...', [E('p', { 'class': 'spinning' }, 'Updating manifest...')]);

		callNfoWrite(name, JSON.stringify(nfoData)).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'NFO manifest saved'));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.message || 'Failed to save')));
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message));
		});
	}
});
