'use strict';
'require view';
'require ui';
'require poll';
'require streamlit.api as api';

return view.extend({
	status: {},
	apps: [],
	activeApp: '',

	load: function() {
		return this.refresh();
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			api.getStatus(),
			api.listApps()
		]).then(function(r) {
			self.status = r[0] || {};
			self.apps = (r[1] && r[1].apps) || [];
			self.activeApp = (r[1] && r[1].active_app) || '';
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

			// Apps Section
			E('div', { 'class': 'cbi-section', 'id': 'apps-section' }, [
				E('h3', {}, _('Applications')),
				E('div', { 'id': 'apps-table' }, this.renderAppsTable())
			]),

			// Upload Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Upload App')),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Python File')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'file', 'id': 'upload-file', 'accept': '.py' }),
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'style': 'margin-left: 8px',
							'click': function() { self.uploadApp(); }
						}, _('Upload'))
					])
				])
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

	renderAppsTable: function() {
		var self = this;
		var apps = this.apps;

		if (!apps.length) {
			return E('em', {}, _('No apps found'));
		}

		var rows = apps.map(function(app) {
			var isActive = app.name === self.activeApp;
			return E('tr', { 'class': isActive ? 'cbi-rowstyle-2' : '' }, [
				E('td', {}, [
					E('strong', {}, app.name),
					isActive ? E('span', { 'style': 'color:#0a0; margin-left:8px' }, _('(active)')) : ''
				]),
				E('td', {}, app.path ? app.path.split('/').pop() : '-'),
				E('td', {}, [
					!isActive ? E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() { self.activateApp(app.name); }
					}, _('Activate')) : '',
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'style': 'margin-left: 4px',
						'click': function() { self.deleteApp(app.name); }
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
		var activeEl = document.getElementById('active-app');
		var appsEl = document.getElementById('apps-table');

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

	activateApp: function(name) {
		var self = this;
		api.setActiveApp(name).then(function(r) {
			if (r && r.success) {
				ui.addNotification(null, E('p', {}, _('App activated: ') + name), 'info');
				return api.restart();
			}
		}).then(function() {
			self.refresh();
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
							}
							self.refresh();
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
		var name = file.name.replace(/\.py$/, '');
		var reader = new FileReader();

		reader.onload = function(e) {
			var content = btoa(e.target.result);
			api.uploadApp(name, content).then(function(r) {
				if (r && r.success) {
					ui.addNotification(null, E('p', {}, _('App uploaded: ') + name), 'success');
					fileInput.value = '';
					self.refresh();
				} else {
					ui.addNotification(null, E('p', {}, r.message || _('Upload failed')), 'error');
				}
			});
		};

		reader.readAsText(file);
	}
});
