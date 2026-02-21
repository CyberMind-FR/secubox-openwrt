'use strict';
'require view';
'require ui';
'require poll';
'require streamlit.api as api';
'require secubox/kiss-theme';

return view.extend({
	status: {},
	apps: [],
	instances: [],

	load: function() {
		return this.refresh();
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			api.getStatus(),
			api.listApps(),
			api.listInstances()
		]).then(function(r) {
			self.status = r[0] || {};
			self.apps = (r[1] && r[1].apps) || [];
			self.instances = r[2] || [];
		});
	},

	render: function() {
		var self = this;
		var s = this.status;
		var running = s.running;
		var installed = s.installed;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Streamlit Platform')),
			E('div', { 'class': 'cbi-map-descr' }, _('Python data app hosting')),

			// Status Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Status')),
				E('table', { 'class': 'table', 'id': 'status-table' }, [
					E('tr', {}, [
						E('td', { 'style': 'width:120px' }, _('Service')),
						E('td', { 'id': 'svc-status' },
							!installed ? E('em', { 'style': 'color:#999' }, _('Not installed')) :
							running ? E('span', { 'style': 'color:#0a0' }, '\u25CF ' + _('Running')) :
							E('span', { 'style': 'color:#a00' }, '\u25CB ' + _('Stopped'))
						)
					]),
					E('tr', {}, [
						E('td', {}, _('Apps')),
						E('td', {}, this.apps.length.toString())
					]),
					E('tr', {}, [
						E('td', {}, _('Instances')),
						E('td', {}, this.instances.length.toString())
					]),
					E('tr', {}, [
						E('td', {}, _('Web URL')),
						E('td', {},
							s.web_url ? E('a', { 'href': s.web_url, 'target': '_blank' }, s.web_url) : '-')
					])
				]),
				E('div', { 'style': 'margin-top:12px' }, this.renderControls(installed, running))
			]),

			// Instances Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Instances')),
				E('div', { 'id': 'instances-table' }, this.renderInstancesTable()),
				E('div', { 'style': 'margin-top:12px' }, this.renderAddInstanceForm())
			]),

			// Apps Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Apps')),
				E('div', { 'id': 'apps-table' }, this.renderAppsTable()),
				E('div', { 'style': 'margin-top:12px' }, this.renderUploadForm())
			])
		]);

		poll.add(function() {
			return self.refresh().then(function() {
				self.updateStatus();
			});
		}, 5);

		return KissTheme.wrap(view, 'admin/secubox/services/streamlit/dashboard');
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
					'class': 'cbi-button',
					'style': 'margin-left:8px',
					'click': function() { self.doRestart(); }
				}, _('Restart')));
			} else {
				btns.push(E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() { self.doStart(); }
				}, _('Start')));
			}
			btns.push(E('button', {
				'class': 'cbi-button cbi-button-remove',
				'style': 'margin-left:8px',
				'click': function() { self.doUninstall(); }
			}, _('Uninstall')));
		}

		return btns;
	},

	renderInstancesTable: function() {
		var self = this;
		var instances = this.instances;

		if (!instances.length) {
			return E('em', {}, _('No instances. Add one below.'));
		}

		var rows = instances.map(function(inst) {
			var status = inst.enabled ?
				E('span', { 'style': 'color:#0a0' }, '\u25CF') :
				E('span', { 'style': 'color:#999' }, '\u25CB');

			return E('tr', {}, [
				E('td', {}, [status, ' ', E('strong', {}, inst.id)]),
				E('td', {}, inst.app || '-'),
				E('td', {}, ':' + inst.port),
				E('td', {}, [
					inst.enabled ?
						E('button', {
							'class': 'cbi-button',
							'click': function() { self.disableInstance(inst.id); }
						}, _('Disable')) :
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'click': function() { self.enableInstance(inst.id); }
						}, _('Enable')),
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'style': 'margin-left:4px',
						'click': function() { self.emancipateInstance(inst.id, inst.app, inst.port); }
					}, _('Expose')),
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'style': 'margin-left:4px',
						'click': function() { self.deleteInstance(inst.id); }
					}, _('Delete'))
				])
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Instance')),
				E('th', { 'class': 'th' }, _('App')),
				E('th', { 'class': 'th' }, _('Port')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		].concat(rows));
	},

	renderAddInstanceForm: function() {
		var self = this;
		var appOptions = [E('option', { 'value': '' }, _('-- Select App --'))];

		this.apps.forEach(function(app) {
			var id = app.id || app.name;
			appOptions.push(E('option', { 'value': id }, app.name));
		});

		// Next available port
		var usedPorts = this.instances.map(function(i) { return i.port; });
		var nextPort = 8501;
		while (usedPorts.indexOf(nextPort) !== -1) nextPort++;

		return E('div', { 'style': 'display:flex; gap:8px; align-items:center; flex-wrap:wrap' }, [
			E('input', { 'type': 'text', 'id': 'new-inst-id', 'class': 'cbi-input-text',
				'placeholder': _('ID'), 'style': 'width:100px' }),
			E('select', { 'id': 'new-inst-app', 'class': 'cbi-input-select' }, appOptions),
			E('input', { 'type': 'number', 'id': 'new-inst-port', 'class': 'cbi-input-text',
				'value': nextPort, 'min': '1024', 'max': '65535', 'style': 'width:80px' }),
			E('button', {
				'class': 'cbi-button cbi-button-positive',
				'click': function() { self.addInstance(); }
			}, _('Add'))
		]);
	},

	renderAppsTable: function() {
		var self = this;
		var apps = this.apps;

		if (!apps.length) {
			return E('em', {}, _('No apps. Upload one below.'));
		}

		var rows = apps.map(function(app) {
			var id = app.id || app.name;
			return E('tr', {}, [
				E('td', {}, E('strong', {}, app.name)),
				E('td', {}, app.path ? app.path.split('/').pop() : '-'),
				E('td', {}, [
					E('button', {
						'class': 'cbi-button',
						'click': function() { self.editApp(id); }
					}, _('Edit')),
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'style': 'margin-left:4px',
						'click': function() { self.deleteApp(id); }
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

	renderUploadForm: function() {
		var self = this;
		return E('div', { 'style': 'display:flex; gap:8px; align-items:center' }, [
			E('input', { 'type': 'file', 'id': 'upload-file', 'accept': '.py,.zip' }),
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function() { self.uploadApp(); }
			}, _('Upload'))
		]);
	},

	updateStatus: function() {
		var s = this.status;
		var statusEl = document.getElementById('svc-status');
		var appsEl = document.getElementById('apps-table');
		var instancesEl = document.getElementById('instances-table');

		if (statusEl) {
			statusEl.innerHTML = '';
			if (!s.installed) {
				statusEl.appendChild(E('em', { 'style': 'color:#999' }, _('Not installed')));
			} else if (s.running) {
				statusEl.appendChild(E('span', { 'style': 'color:#0a0' }, '\u25CF ' + _('Running')));
			} else {
				statusEl.appendChild(E('span', { 'style': 'color:#a00' }, '\u25CB ' + _('Stopped')));
			}
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

	// Actions
	doStart: function() {
		var self = this;
		api.start().then(function(r) {
			if (r && r.success)
				ui.addNotification(null, E('p', {}, _('Service started')), 'info');
			self.refresh();
		});
	},

	doStop: function() {
		var self = this;
		api.stop().then(function(r) {
			if (r && r.success)
				ui.addNotification(null, E('p', {}, _('Service stopped')), 'info');
			self.refresh();
		});
	},

	doRestart: function() {
		var self = this;
		api.restart().then(function(r) {
			if (r && r.success)
				ui.addNotification(null, E('p', {}, _('Service restarted')), 'info');
			self.refresh();
		});
	},

	doInstall: function() {
		var self = this;
		ui.showModal(_('Installing'), [
			E('p', { 'class': 'spinning' }, _('Installing Streamlit...'))
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
					ui.addNotification(null, E('p', {}, _('Installed')), 'success');
					self.refresh();
					location.reload();
				} else if (r.status === 'error') {
					ui.hideModal();
					ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
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
			E('p', {}, _('Uninstall Streamlit?')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-left:8px',
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

		if (!id || !app || !port) {
			ui.addNotification(null, E('p', {}, _('Fill all fields')), 'error');
			return;
		}

		api.addInstance(id, id, app, port).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Instance added')), 'success');
				document.getElementById('new-inst-id').value = '';
				document.getElementById('new-inst-app').value = '';
				self.refresh().then(function() { self.updateStatus(); });
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
			}
		});
	},

	enableInstance: function(id) {
		var self = this;
		api.enableInstance(id).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Enabled')), 'success');
				self.refresh().then(function() { self.updateStatus(); });
			}
		});
	},

	disableInstance: function(id) {
		var self = this;
		api.disableInstance(id).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Disabled')), 'success');
				self.refresh().then(function() { self.updateStatus(); });
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
					'style': 'margin-left:8px',
					'click': function() {
						ui.hideModal();
						api.removeInstance(id).then(function(r) {
							if (r && r.success)
								ui.addNotification(null, E('p', {}, _('Deleted')), 'info');
							self.refresh().then(function() { self.updateStatus(); });
						});
					}
				}, _('Delete'))
			])
		]);
	},

	emancipateInstance: function(id, app, port) {
		var self = this;
		ui.showModal(_('Expose: ') + id, [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Domain')),
				E('div', { 'class': 'cbi-value-field' },
					E('input', { 'type': 'text', 'id': 'expose-domain', 'class': 'cbi-input-text',
						'placeholder': id + '.gk2.secubox.in' }))
			]),
			E('div', { 'style': 'margin:12px 0; padding:8px; background:#f5f5f5; border-radius:4px' }, [
				E('small', {}, _('Creates DNS + HAProxy vhost + SSL certificate'))
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'margin-left:8px',
					'click': function() {
						var domain = document.getElementById('expose-domain').value.trim();
						ui.hideModal();
						ui.showModal(_('Exposing...'), [
							E('p', { 'class': 'spinning' }, _('Setting up exposure...'))
						]);
						api.emancipate(app, domain).then(function(r) {
							ui.hideModal();
							if (r && r.success) {
								ui.addNotification(null, E('p', {}, _('Exposed at: ') + (r.domain || domain)), 'success');
							} else {
								ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
							}
						});
					}
				}, _('Expose'))
			])
		]);
	},

	deleteApp: function(name) {
		var self = this;
		ui.showModal(_('Confirm'), [
			E('p', {}, _('Delete app: ') + name + '?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-left:8px',
					'click': function() {
						ui.hideModal();
						api.removeApp(name).then(function(r) {
							if (r && r.success)
								ui.addNotification(null, E('p', {}, _('Deleted')), 'info');
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
			ui.addNotification(null, E('p', {}, _('Select a file')), 'error');
			return;
		}

		var file = fileInput.files[0];
		var name = file.name.replace(/\.(py|zip)$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
		var reader = new FileReader();

		reader.onload = function(e) {
			var bytes = new Uint8Array(e.target.result);
			var chunks = [];
			for (var i = 0; i < bytes.length; i += 8192) {
				chunks.push(String.fromCharCode.apply(null, bytes.slice(i, i + 8192)));
			}
			var content = btoa(chunks.join(''));

			poll.stop();
			ui.showModal(_('Uploading'), [
				E('p', { 'class': 'spinning' }, _('Uploading ') + file.name + '...')
			]);

			var uploadFn = content.length > 40000 ?
				api.chunkedUpload(name, content, file.name.endsWith('.zip')) :
				api.uploadApp(name, content);

			uploadFn.then(function(r) {
				poll.start();
				ui.hideModal();
				if (r && r.success) {
					ui.addNotification(null, E('p', {}, _('Uploaded: ') + name), 'success');
					fileInput.value = '';
					self.refresh().then(function() { self.updateStatus(); });
				} else {
					ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
				}
			}).catch(function(err) {
				poll.start();
				ui.hideModal();
				ui.addNotification(null, E('p', {}, _('Error: ') + (err.message || err)), 'error');
			});
		};

		reader.readAsArrayBuffer(file);
	},

	editApp: function(id) {
		var self = this;
		ui.showModal(_('Loading...'), [
			E('p', { 'class': 'spinning' }, _('Loading source...'))
		]);

		api.getSource(id).then(function(r) {
			if (!r || !r.content) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
				return;
			}

			var source;
			try { source = atob(r.content); }
			catch (e) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, _('Decode error')), 'error');
				return;
			}

			ui.hideModal();
			ui.showModal(_('Edit: ') + id, [
				E('textarea', {
					'id': 'edit-source',
					'style': 'width:100%; height:300px; font-family:monospace; font-size:12px;',
					'spellcheck': 'false'
				}, source),
				E('div', { 'class': 'right', 'style': 'margin-top:12px' }, [
					E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'style': 'margin-left:8px',
						'click': function() {
							var newSource = document.getElementById('edit-source').value;
							var encoded = btoa(newSource);
							ui.hideModal();
							api.saveSource(id, encoded).then(function(sr) {
								if (sr && sr.success)
									ui.addNotification(null, E('p', {}, _('Saved')), 'success');
								else
									ui.addNotification(null, E('p', {}, sr.message || _('Failed')), 'error');
							});
						}
					}, _('Save'))
				])
			]);
		});
	}
});
