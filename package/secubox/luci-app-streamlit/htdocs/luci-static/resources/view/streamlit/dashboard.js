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
	exposure: [],

	load: function() {
		return this.refresh();
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			api.getStatus(),
			api.listApps(),
			api.listInstances(),
			api.getExposureStatus().catch(function() { return []; })
		]).then(function(r) {
			self.status = r[0] || {};
			self.apps = (r[1] && r[1].apps) || [];
			self.instances = r[2] || [];
			self.exposure = r[3] || [];
		});
	},

	render: function() {
		var self = this;
		var s = this.status;
		var running = s.running;
		var installed = s.installed;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Streamlit Platform')),
			E('div', { 'class': 'cbi-map-descr' }, _('Python data apps - One-click deploy & expose')),

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
					])
				]),
				E('div', { 'style': 'margin-top:12px' }, this.renderControls(installed, running))
			]),

			// Instances Section - Main focus
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Instances & Exposure')),
				E('div', { 'id': 'instances-table' }, this.renderInstancesTable())
			]),

			// One-Click Deploy Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('One-Click Deploy')),
				E('p', { 'style': 'color:#666; margin-bottom:12px' },
					_('Upload a .py file to auto-create app + instance + start')),
				this.renderDeployForm()
			]),

			// Apps Section (compact)
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Apps Library')),
				E('div', { 'id': 'apps-table' }, this.renderAppsTable())
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
		}

		return btns;
	},

	getExposureInfo: function(id) {
		for (var i = 0; i < this.exposure.length; i++) {
			if (this.exposure[i].id === id)
				return this.exposure[i];
		}
		return null;
	},

	renderInstancesTable: function() {
		var self = this;
		var instances = this.instances;

		if (!instances.length) {
			return E('em', {}, _('No instances. Use One-Click Deploy below.'));
		}

		var rows = instances.map(function(inst) {
			var exp = self.getExposureInfo(inst.id) || {};
			var isExposed = exp.emancipated;
			var certValid = exp.cert_valid;
			var authRequired = exp.auth_required;

			// Status indicator
			var statusBadge;
			if (isExposed && certValid) {
				statusBadge = E('span', { 'style': 'background:#0a0; color:#fff; padding:2px 6px; border-radius:3px; font-size:11px' },
					'\u2713 ' + (exp.domain || 'Exposed'));
			} else if (isExposed) {
				statusBadge = E('span', { 'style': 'background:#f90; color:#fff; padding:2px 6px; border-radius:3px; font-size:11px' },
					'\u26A0 Cert pending');
			} else {
				statusBadge = E('span', { 'style': 'color:#999' }, _('Local only'));
			}

			// Running indicator
			var runStatus = inst.enabled ?
				E('span', { 'style': 'color:#0a0' }, '\u25CF') :
				E('span', { 'style': 'color:#999' }, '\u25CB');

			// Action buttons
			var actions = [];

			// Enable/Disable
			if (inst.enabled) {
				actions.push(E('button', {
					'class': 'cbi-button',
					'title': _('Disable'),
					'click': function() { self.disableInstance(inst.id); }
				}, '\u23F8'));
			} else {
				actions.push(E('button', {
					'class': 'cbi-button cbi-button-positive',
					'title': _('Enable'),
					'click': function() { self.enableInstance(inst.id); }
				}, '\u25B6'));
			}

			// Expose / Unpublish
			if (isExposed) {
				actions.push(E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-left:4px',
					'title': _('Unpublish'),
					'click': function() { self.unpublishInstance(inst.id, exp.domain); }
				}, '\u2715'));
			} else {
				actions.push(E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'margin-left:4px',
					'title': _('Expose (one-click)'),
					'click': function() { self.exposeInstance(inst.id); }
				}, '\u2197'));
			}

			// Auth toggle
			if (isExposed) {
				actions.push(E('button', {
					'class': authRequired ? 'cbi-button cbi-button-action' : 'cbi-button',
					'style': 'margin-left:4px',
					'title': authRequired ? _('Auth required - click to disable') : _('Public - click to require auth'),
					'click': function() { self.toggleAuth(inst.id, !authRequired); }
				}, authRequired ? '\uD83D\uDD12' : '\uD83D\uDD13'));
			}

			// Delete
			actions.push(E('button', {
				'class': 'cbi-button cbi-button-remove',
				'style': 'margin-left:4px',
				'title': _('Delete'),
				'click': function() { self.deleteInstance(inst.id); }
			}, '\u2212'));

			return E('tr', {}, [
				E('td', {}, [runStatus, ' ', E('strong', {}, inst.id)]),
				E('td', {}, inst.app || '-'),
				E('td', {}, ':' + inst.port),
				E('td', {}, statusBadge),
				E('td', {}, actions)
			]);
		});

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Instance')),
				E('th', { 'class': 'th' }, _('App')),
				E('th', { 'class': 'th' }, _('Port')),
				E('th', { 'class': 'th' }, _('Exposure')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		].concat(rows));
	},

	renderDeployForm: function() {
		var self = this;
		return E('div', { 'style': 'display:flex; gap:8px; align-items:center; flex-wrap:wrap' }, [
			E('input', { 'type': 'file', 'id': 'deploy-file', 'accept': '.py,.zip' }),
			E('button', {
				'class': 'cbi-button cbi-button-positive',
				'click': function() { self.oneClickDeploy(); }
			}, _('Deploy & Create Instance'))
		]);
	},

	renderAppsTable: function() {
		var self = this;
		var apps = this.apps;

		if (!apps.length) {
			return E('em', {}, _('No apps.'));
		}

		var rows = apps.map(function(app) {
			var id = app.id || app.name;
			return E('tr', {}, [
				E('td', {}, E('strong', {}, app.name)),
				E('td', {}, app.path ? app.path.split('/').pop() : '-'),
				E('td', {}, [
					E('button', {
						'class': 'cbi-button',
						'click': function() { self.createInstanceFromApp(id); }
					}, _('+ Instance')),
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
				ui.addNotification(null, E('p', {}, _('Started')), 'info');
			self.refresh();
		});
	},

	doStop: function() {
		var self = this;
		api.stop().then(function(r) {
			if (r && r.success)
				ui.addNotification(null, E('p', {}, _('Stopped')), 'info');
			self.refresh();
		});
	},

	doRestart: function() {
		var self = this;
		api.restart().then(function(r) {
			if (r && r.success)
				ui.addNotification(null, E('p', {}, _('Restarted')), 'info');
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
				ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
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

	// One-click deploy
	oneClickDeploy: function() {
		var self = this;
		var fileInput = document.getElementById('deploy-file');
		if (!fileInput || !fileInput.files.length) {
			ui.addNotification(null, E('p', {}, _('Select a file')), 'error');
			return;
		}

		var file = fileInput.files[0];
		var name = file.name.replace(/\.(py|zip)$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
		var isZip = file.name.endsWith('.zip');
		var reader = new FileReader();

		reader.onload = function(e) {
			var bytes = new Uint8Array(e.target.result);
			var chunks = [];
			for (var i = 0; i < bytes.length; i += 8192) {
				chunks.push(String.fromCharCode.apply(null, bytes.slice(i, i + 8192)));
			}
			var content = btoa(chunks.join(''));

			poll.stop();
			ui.showModal(_('Deploying'), [
				E('p', { 'class': 'spinning' }, _('Creating app + instance...'))
			]);

			api.uploadAndDeploy(name, content, isZip).then(function(r) {
				poll.start();
				ui.hideModal();
				if (r && r.success) {
					ui.addNotification(null, E('p', {}, _('Deployed: ') + name + ' on port ' + r.port), 'success');
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

	// Instance actions
	enableInstance: function(id) {
		var self = this;
		api.enableInstance(id).then(function(r) {
			if (r && r.success)
				ui.addNotification(null, E('p', {}, _('Enabled')), 'success');
			self.refresh().then(function() { self.updateStatus(); });
		});
	},

	disableInstance: function(id) {
		var self = this;
		api.disableInstance(id).then(function(r) {
			if (r && r.success)
				ui.addNotification(null, E('p', {}, _('Disabled')), 'success');
			self.refresh().then(function() { self.updateStatus(); });
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

	// One-click expose
	exposeInstance: function(id) {
		var self = this;
		ui.showModal(_('Exposing...'), [
			E('p', { 'class': 'spinning' }, _('Creating vhost + SSL certificate...'))
		]);

		api.emancipateInstance(id, '').then(function(r) {
			ui.hideModal();
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Exposed at: ') + r.url), 'success');
				self.refresh().then(function() { self.updateStatus(); });
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
			}
		});
	},

	// Unpublish
	unpublishInstance: function(id, domain) {
		var self = this;
		ui.showModal(_('Confirm'), [
			E('p', {}, _('Unpublish ') + domain + '?'),
			E('p', { 'style': 'color:#666' }, _('This removes the public URL and SSL certificate.')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'margin-left:8px',
					'click': function() {
						ui.hideModal();
						api.unpublish(id).then(function(r) {
							if (r && r.success)
								ui.addNotification(null, E('p', {}, _('Unpublished')), 'info');
							self.refresh().then(function() { self.updateStatus(); });
						});
					}
				}, _('Unpublish'))
			])
		]);
	},

	// Auth toggle
	toggleAuth: function(id, authRequired) {
		var self = this;
		api.setAuthRequired(id, authRequired).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {},
					authRequired ? _('Auth required') : _('Public access')), 'info');
				self.refresh().then(function() { self.updateStatus(); });
			}
		});
	},

	// Create instance from app
	createInstanceFromApp: function(appId) {
		var self = this;
		var usedPorts = this.instances.map(function(i) { return i.port; });
		var nextPort = 8501;
		while (usedPorts.indexOf(nextPort) !== -1) nextPort++;

		api.addInstance(appId, appId, appId, nextPort).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('Instance created on port ') + nextPort), 'success');
				self.refresh().then(function() { self.updateStatus(); });
			} else {
				ui.addNotification(null, E('p', {}, r.message || _('Failed')), 'error');
			}
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
	}
});
