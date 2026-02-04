'use strict';
'require view';
'require ui';
'require poll';
'require streamlit.api as api';

return view.extend({
	status: {},
	apps: [],
	instances: [],
	activeApp: '',
	giteaConfig: {},

	load: function() {
		return this.refresh();
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			api.getStatus(),
			api.listApps(),
			api.listInstances(),
			api.getGiteaConfig().catch(function() { return {}; })
		]).then(function(r) {
			self.status = r[0] || {};
			self.apps = (r[1] && r[1].apps) || [];
			self.activeApp = (r[1] && r[1].active_app) || '';
			self.instances = r[2] || [];
			self.giteaConfig = r[3] || {};
		});
	},

	render: function() {
		var self = this;
		var s = this.status;
		var running = s.running;
		var installed = s.installed;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Streamlit Platform')),
			E('div', { 'class': 'cbi-map-descr' }, _('Python data app hosting with multi-instance support')),

			// Status Section
			E('div', { 'class': 'cbi-section', 'id': 'status-section' }, [
				E('h3', {}, _('Service Status')),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Status')),
					E('div', { 'class': 'cbi-value-field', 'id': 'svc-status' },
						!installed ? E('em', { 'style': 'color:#999' }, _('Not installed')) :
						running ? E('span', { 'style': 'color:#0a0' }, _('Running')) :
						E('span', { 'style': 'color:#a00' }, _('Stopped'))
					)
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Active App')),
					E('div', { 'class': 'cbi-value-field', 'id': 'active-app' },
						this.activeApp || E('em', {}, '-'))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Web URL')),
					E('div', { 'class': 'cbi-value-field' },
						s.web_url ? E('a', { 'href': s.web_url, 'target': '_blank' }, s.web_url) : '-')
				]),
				E('div', { 'class': 'cbi-page-actions' }, this.renderControls(installed, running))
			]),

			// Instances Section
			E('div', { 'class': 'cbi-section', 'id': 'instances-section' }, [
				E('h3', {}, _('Running Instances')),
				E('div', { 'id': 'instances-table' }, this.renderInstancesTable())
			]),

			// Add Instance Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Add Instance')),
				this.renderAddInstanceForm()
			]),

			// Apps Section
			E('div', { 'class': 'cbi-section', 'id': 'apps-section' }, [
				E('h3', {}, _('Applications')),
				E('div', { 'id': 'apps-table' }, this.renderAppsTable())
			]),

			// Upload Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Upload App')),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('File')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'file', 'id': 'upload-file', 'accept': '.py,.zip' }),
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'style': 'margin-left: 8px',
							'click': function() { self.uploadApp(); }
						}, _('Upload'))
					]),
					E('div', { 'class': 'cbi-value-description' }, _('Accepts .py files or .zip archives'))
				])
			]),

			// Gitea Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Clone from Gitea')),
				this.renderGiteaSection()
			])
		]);

		poll.add(function() {
			return self.refresh().then(function() {
				self.updateStatus();
			});
		}, 5);

		return view;
	},

	renderControls: function(installed, running) {
		var self = this;
		var btns = [];

		if (!installed) {
			btns.push(E('button', {
				'class': 'cbi-button cbi-button-positive',
				'click': function() { self.doInstall(); }
			}, _('Install')));
		} else {
			if (running) {
				btns.push(E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() { self.doStop(); }
				}, _('Stop')));
				btns.push(E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'margin-left: 8px',
					'click': function() { self.doRestart(); }
				}, _('Restart')));
			} else {
				btns.push(E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() { self.doStart(); }
				}, _('Start')));
			}
			btns.push(E('button', {
				'class': 'cbi-button',
				'style': 'margin-left: 8px',
				'click': function() { self.doUninstall(); }
			}, _('Uninstall')));
		}

		return btns;
	},

	renderInstancesTable: function() {
		var self = this;
		var instances = this.instances;

		if (!instances.length) {
			return E('em', {}, _('No instances configured. Add one below.'));
		}

		var rows = instances.map(function(inst) {
			var statusIcon = inst.enabled ?
				E('span', { 'style': 'color:#0a0' }, '\u25CF') :
				E('span', { 'style': 'color:#999' }, '\u25CB');

			return E('tr', {}, [
				E('td', {}, [
					E('strong', {}, inst.id),
					inst.name && inst.name !== inst.id ?
						E('span', { 'style': 'color:#666; margin-left:4px' }, '(' + inst.name + ')') : ''
				]),
				E('td', {}, inst.app || '-'),
				E('td', {}, ':' + inst.port),
				E('td', { 'style': 'text-align:center' }, [
					statusIcon,
					E('span', { 'style': 'margin-left:4px' }, inst.enabled ? _('Enabled') : _('Disabled'))
				]),
				E('td', {}, [
					E('button', {
						'class': 'cbi-button',
						'click': function() { self.renameInstance(inst.id, inst.name); }
					}, _('Rename')),
					inst.enabled ?
						E('button', {
							'class': 'cbi-button',
							'style': 'margin-left: 4px',
							'click': function() { self.disableInstance(inst.id); }
						}, _('Disable')) :
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'style': 'margin-left: 4px',
							'click': function() { self.enableInstance(inst.id); }
						}, _('Enable')),
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'style': 'margin-left: 4px',
						'click': function() { self.deleteInstance(inst.id); }
					}, _('Delete'))
				])
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('ID')),
				E('th', { 'class': 'th' }, _('App')),
				E('th', { 'class': 'th' }, _('Port')),
				E('th', { 'class': 'th', 'style': 'text-align:center' }, _('Status')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		].concat(rows));
	},

	renderAddInstanceForm: function() {
		var self = this;
		var appOptions = [E('option', { 'value': '' }, _('-- Select App --'))];

		this.apps.forEach(function(app) {
			var appId = app.id || app.name;
			var label = app.name !== appId ? app.name + ' (' + appId + ')' : app.name;
			appOptions.push(E('option', { 'value': appId }, label));
		});

		// Calculate next available port
		var usedPorts = this.instances.map(function(i) { return i.port; });
		var nextPort = 8501;
		while (usedPorts.indexOf(nextPort) !== -1) {
			nextPort++;
		}

		return E('div', {}, [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Instance ID')),
				E('div', { 'class': 'cbi-value-field' },
					E('input', { 'type': 'text', 'id': 'new-inst-id', 'class': 'cbi-input-text', 'placeholder': _('myapp') })
				)
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('App')),
				E('div', { 'class': 'cbi-value-field' },
					E('select', { 'id': 'new-inst-app', 'class': 'cbi-input-select' }, appOptions)
				)
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Port')),
				E('div', { 'class': 'cbi-value-field' },
					E('input', { 'type': 'number', 'id': 'new-inst-port', 'class': 'cbi-input-text',
						'value': nextPort, 'min': '1024', 'max': '65535' })
				)
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() { self.addInstance(); }
				}, _('Add Instance'))
			])
		]);
	},

	renderAppsTable: function() {
		var self = this;
		var apps = this.apps;

		if (!apps.length) {
			return E('em', {}, _('No apps found'));
		}

		var rows = apps.map(function(app) {
			var appId = app.id || app.name;
			var isActive = appId === self.activeApp;
			return E('tr', { 'class': isActive ? 'cbi-rowstyle-2' : '' }, [
				E('td', {}, [
					E('strong', {}, app.name),
					app.id && app.id !== app.name ?
						E('span', { 'style': 'color:#666; margin-left:4px' }, '(' + app.id + ')') : '',
					isActive ? E('span', { 'style': 'color:#0a0; margin-left:8px' }, _('(active)')) : ''
				]),
				E('td', {}, app.path ? app.path.split('/').pop() : '-'),
				E('td', {}, [
					E('button', {
						'class': 'cbi-button',
						'click': function() { self.renameApp(appId, app.name); }
					}, _('Rename')),
					!isActive ? E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'margin-left: 4px',
						'click': function() { self.activateApp(appId); }
					}, _('Activate')) : '',
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'style': 'margin-left: 4px',
						'click': function() { self.deleteApp(appId); }
					}, _('Delete'))
				])
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Name')),
				E('th', { 'class': 'th' }, _('File')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		].concat(rows));
	},

	renderGiteaSection: function() {
		var self = this;
		var cfg = this.giteaConfig;
		var enabled = cfg.enabled;

		return E('div', {}, [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Status')),
				E('div', { 'class': 'cbi-value-field' },
					enabled ?
						E('span', { 'style': 'color:#0a0' }, _('Configured')) :
						E('span', { 'style': 'color:#999' }, _('Not configured'))
				)
			]),
			enabled ? E('div', {}, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Repository')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'gitea-repo', 'class': 'cbi-input-text',
							'placeholder': _('owner/repo or full URL') })
					)
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('App Name')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'gitea-name', 'class': 'cbi-input-text',
							'placeholder': _('myapp') })
					)
				]),
				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': function() { self.giteaClone(); }
					}, _('Clone'))
				])
			]) : E('div', { 'class': 'cbi-value-description' },
				_('Configure Gitea in Settings to enable cloning'))
		]);
	},

	updateStatus: function() {
		var s = this.status;
		var statusEl = document.getElementById('svc-status');
		var activeEl = document.getElementById('active-app');
		var appsEl = document.getElementById('apps-table');
		var instancesEl = document.getElementById('instances-table');

		if (statusEl) {
			statusEl.innerHTML = '';
			if (!s.installed) {
				statusEl.appendChild(E('em', { 'style': 'color:#999' }, _('Not installed')));
			} else if (s.running) {
				statusEl.appendChild(E('span', { 'style': 'color:#0a0' }, _('Running')));
			} else {
				statusEl.appendChild(E('span', { 'style': 'color:#a00' }, _('Stopped')));
			}
		}

		if (activeEl) {
			activeEl.textContent = this.activeApp || '-';
		}

		if (appsEl) {
			appsEl.innerHTML = '';
			appsEl.appendChild(this.renderAppsTable());
		}

		if (instancesEl) {
			instancesEl.innerHTML = '';
			instancesEl.appendChild(this.renderInstancesTable());
		}
	},

	doStart: function() {
		var self = this;
		api.start().then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Service started')), 'info');
			}
			self.refresh();
		});
	},

	doStop: function() {
		var self = this;
		api.stop().then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Service stopped')), 'info');
			}
			self.refresh();
		});
	},

	doRestart: function() {
		var self = this;
		api.restart().then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Service restarted')), 'info');
			}
			self.refresh();
		});
	},

	doInstall: function() {
		var self = this;
		ui.showModal(_('Installing'), [
			E('p', { 'class': 'spinning' }, _('Installing Streamlit platform...'))
		]);
		api.install().then(function(r) {
			if (r && r.started) {
				self.pollInstall();
			} else {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, r.message || _('Install failed')), 'error');
			}
		});
	},

	pollInstall: function() {
		var self = this;
		var check = function() {
			api.getInstallProgress().then(function(r) {
				if (r.status === 'completed') {
					ui.hideModal();
					ui.addNotification(null, E('p', {}, _('Installation complete')), 'success');
					self.refresh();
					location.reload();
				} else if (r.status === 'error') {
					ui.hideModal();
					ui.addNotification(null, E('p', {}, r.message || _('Install failed')), 'error');
				} else {
					setTimeout(check, 3000);
				}
			});
		};
		setTimeout(check, 2000);
	},

	doUninstall: function() {
		var self = this;
		ui.showModal(_('Confirm'), [
			E('p', {}, _('Uninstall Streamlit platform?')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-left: 8px',
					'click': function() {
						ui.hideModal();
						api.uninstall().then(function() {
							ui.addNotification(null, E('p', {}, _('Uninstalled')), 'info');
							self.refresh();
							location.reload();
						});
					}
				}, _('Uninstall'))
			])
		]);
	},

	addInstance: function() {
		var self = this;
		var id = document.getElementById('new-inst-id').value.trim();
		var app = document.getElementById('new-inst-app').value;
		var port = parseInt(document.getElementById('new-inst-port').value, 10);

		if (!id) {
			ui.addNotification(null, E('p', {}, _('Please enter an instance ID')), 'error');
			return;
		}

		if (!/^[a-zA-Z0-9_]+$/.test(id)) {
			ui.addNotification(null, E('p', {}, _('ID can only contain letters, numbers, and underscores')), 'error');
			return;
		}

		if (!app) {
			ui.addNotification(null, E('p', {}, _('Please select an app')), 'error');
			return;
		}

		if (!port || port < 1024 || port > 65535) {
			ui.addNotification(null, E('p', {}, _('Please enter a valid port (1024-65535)')), 'error');
			return;
		}

		api.addInstance(id, id, app, port).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Instance added: ') + id), 'success');
				document.getElementById('new-inst-id').value = '';
				document.getElementById('new-inst-app').value = '';
				self.refresh().then(function() { self.updateStatus(); });
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Failed to add instance')), 'error');
			}
		});
	},

	enableInstance: function(id) {
		var self = this;
		api.enableInstance(id).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Instance enabled: ') + id), 'success');
				self.refresh().then(function() { self.updateStatus(); });
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
			}
		});
	},

	disableInstance: function(id) {
		var self = this;
		api.disableInstance(id).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Instance disabled: ') + id), 'success');
				self.refresh().then(function() { self.updateStatus(); });
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
			}
		});
	},

	deleteInstance: function(id) {
		var self = this;
		ui.showModal(_('Confirm'), [
			E('p', {}, _('Delete instance: ') + id + '?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-left: 8px',
					'click': function() {
						ui.hideModal();
						api.removeInstance(id).then(function(r) {
							if (r && r.success) {
								ui.addNotification(null, E('p', {}, _('Instance deleted')), 'info');
							}
							self.refresh().then(function() { self.updateStatus(); });
						});
					}
				}, _('Delete'))
			])
		]);
	},

	activateApp: function(name) {
		var self = this;
		var hasInstance = this.instances.some(function(inst) { return inst.app === name; });

		api.setActiveApp(name).then(function(r) {
			if (r && r.success) {
				if (!hasInstance) {
					// Auto-create instance with next available port
					var usedPorts = self.instances.map(function(i) { return i.port; });
					var port = 8501;
					while (usedPorts.indexOf(port) !== -1) { port++; }
					return api.addInstance(name, name, name, port).then(function() {
						ui.addNotification(null, E('p', {}, _('App activated with new instance on port ') + port), 'info');
						return api.restart();
					});
				} else {
					ui.addNotification(null, E('p', {}, _('App activated: ') + name), 'info');
					return api.restart();
				}
			}
		}).then(function() {
			self.refresh().then(function() { self.updateStatus(); });
		});
	},

	deleteApp: function(name) {
		var self = this;
		ui.showModal(_('Confirm'), [
			E('p', {}, _('Delete app: ') + name + '?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-left: 8px',
					'click': function() {
						ui.hideModal();
						api.removeApp(name).then(function(r) {
							if (r && r.success) {
								ui.addNotification(null, E('p', {}, _('App deleted')), 'info');
							} else {
								ui.addNotification(null, E('p', {}, (r && r.message) || _('Delete failed')), 'error');
							}
							self.refresh().then(function() { self.updateStatus(); });
						});
					}
				}, _('Delete'))
			])
		]);
	},

	uploadApp: function() {
		var self = this;
		var fileInput = document.getElementById('upload-file');
		if (!fileInput || !fileInput.files.length) {
			ui.addNotification(null, E('p', {}, _('Select a file first')), 'error');
			return;
		}

		var file = fileInput.files[0];
		var name = file.name.replace(/\.(py|zip)$/, '').replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
		var isZip = file.name.endsWith('.zip');
		var reader = new FileReader();

		reader.onload = function(e) {
			var content;
			if (isZip) {
				var binary = e.target.result;
				var bytes = new Uint8Array(binary);
				var chunks = [];
				for (var i = 0; i < bytes.length; i += 8192) {
					chunks.push(String.fromCharCode.apply(null, bytes.slice(i, i + 8192)));
				}
				content = btoa(chunks.join(''));
			} else {
				content = btoa(e.target.result);
			}

			var uploadFn = isZip ? api.uploadZip(name, content, null) : api.uploadApp(name, content);

			uploadFn.then(function(r) {
				if (r && r.success) {
					ui.addNotification(null, E('p', {}, _('App uploaded: ') + name), 'success');
					fileInput.value = '';
					self.refresh().then(function() { self.updateStatus(); });
				} else {
					var msg = (r && r.message) ? r.message : _('Upload failed');
					ui.addNotification(null, E('p', {}, msg), 'error');
				}
			}).catch(function(err) {
				ui.addNotification(null, E('p', {},
					_('Upload error: ') + (err.message || err)), 'error');
			});
		};

		if (isZip) {
			reader.readAsArrayBuffer(file);
		} else {
			reader.readAsText(file);
		}
	},

	renameApp: function(id, currentName) {
		var self = this;
		if (!currentName) currentName = id;

		ui.showModal(_('Rename App'), [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Name')),
				E('div', { 'class': 'cbi-value-field' },
					E('input', { 'type': 'text', 'id': 'rename-input', 'class': 'cbi-input-text', 'value': currentName }))
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'margin-left: 8px',
					'click': function() {
						var newName = document.getElementById('rename-input').value.trim();
						if (!newName) return;
						ui.hideModal();
						api.renameApp(id, newName).then(function(r) {
							if (r && r.success)
								ui.addNotification(null, E('p', {}, _('App renamed')), 'info');
							self.refresh().then(function() { self.updateStatus(); });
						});
					}
				}, _('Save'))
			])
		]);
	},

	renameInstance: function(id, currentName) {
		var self = this;

		ui.showModal(_('Rename Instance'), [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Name')),
				E('div', { 'class': 'cbi-value-field' },
					E('input', { 'type': 'text', 'id': 'rename-input', 'class': 'cbi-input-text', 'value': currentName || id }))
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'margin-left: 8px',
					'click': function() {
						var newName = document.getElementById('rename-input').value.trim();
						if (!newName) return;
						ui.hideModal();
						api.renameInstance(id, newName).then(function(r) {
							if (r && r.success)
								ui.addNotification(null, E('p', {}, _('Instance renamed')), 'info');
							self.refresh().then(function() { self.updateStatus(); });
						});
					}
				}, _('Save'))
			])
		]);
	},

	giteaClone: function() {
		var self = this;
		var repo = document.getElementById('gitea-repo').value.trim();
		var name = document.getElementById('gitea-name').value.trim();

		if (!repo) {
			ui.addNotification(null, E('p', {}, _('Please enter a repository')), 'error');
			return;
		}

		if (!name) {
			// Extract name from repo
			name = repo.split('/').pop().replace(/\.git$/, '');
		}

		ui.showModal(_('Cloning'), [
			E('p', { 'class': 'spinning' }, _('Cloning ') + repo + '...')
		]);

		api.giteaClone(name, repo).then(function(r) {
			ui.hideModal();
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Clone started: ') + name), 'success');
				document.getElementById('gitea-repo').value = '';
				document.getElementById('gitea-name').value = '';
				setTimeout(function() {
					self.refresh().then(function() { self.updateStatus(); });
				}, 3000);
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Clone failed')), 'error');
			}
		});
	}
});
