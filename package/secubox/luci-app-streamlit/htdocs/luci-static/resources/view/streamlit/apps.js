'use strict';
'require view';
'require ui';
'require dom';
'require poll';
'require rpc';
'require streamlit.api as api';

// HAProxy RPC calls for publishing
var haproxyCreateBackend = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_backend',
	params: ['name', 'mode', 'balance', 'health_check', 'enabled'],
	expect: {}
});

var haproxyCreateServer = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_server',
	params: ['backend', 'name', 'address', 'port', 'weight', 'check', 'enabled'],
	expect: {}
});

var haproxyCreateVhost = rpc.declare({
	object: 'luci.haproxy',
	method: 'create_vhost',
	params: ['domain', 'backend', 'ssl', 'ssl_redirect', 'acme', 'enabled'],
	expect: {}
});

var haproxyListBackends = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_backends',
	expect: { backends: [] }
});

var haproxyReload = rpc.declare({
	object: 'luci.haproxy',
	method: 'reload',
	expect: {}
});

return view.extend({
	appsData: null,
	statusData: null,
	haproxyBackends: [],

	load: function() {
		return this.refreshData();
	},

	refreshData: function() {
		var self = this;
		return Promise.all([
			api.listApps(),
			api.getStatus(),
			haproxyListBackends().catch(function() { return { backends: [] }; })
		]).then(function(results) {
			self.appsData = results[0] || {};
			self.statusData = results[1] || {};
			var backendResult = results[2] || {};
			self.haproxyBackends = Array.isArray(backendResult) ? backendResult : (backendResult.backends || []);
			return results;
		});
	},

	render: function() {
		var self = this;

		// Inject CSS
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('streamlit/dashboard.css')
		});

		var container = E('div', { 'class': 'streamlit-dashboard' }, [
			cssLink,
			this.renderHeader(),
			this.renderAppsCard(),
			this.renderUploadCard()
		]);

		// Poll for updates
		poll.add(function() {
			return self.refreshData().then(function() {
				self.updateAppsTable();
			});
		}, 15);

		return container;
	},

	renderHeader: function() {
		return E('div', { 'class': 'st-header' }, [
			E('div', { 'class': 'st-header-content' }, [
				E('div', { 'class': 'st-logo' }, '\uD83D\uDCBB'),
				E('div', {}, [
					E('h1', { 'class': 'st-title' }, _('APP MANAGEMENT')),
					E('p', { 'class': 'st-subtitle' }, _('Deploy and manage your Streamlit applications'))
				])
			])
		]);
	},

	isAppPublished: function(appName) {
		var backendName = 'streamlit_' + appName;
		return this.haproxyBackends.some(function(b) {
			return b.name === backendName || b.id === backendName;
		});
	},

	renderAppsCard: function() {
		var self = this;
		var apps = this.appsData.apps || [];
		var activeApp = this.appsData.active_app || 'hello';

		var tableRows = apps.map(function(app) {
			var isActive = app.active || app.name === activeApp;
			var isPublished = self.isAppPublished(app.name);
			return E('tr', {}, [
				E('td', { 'class': isActive ? 'st-app-active' : '' }, [
					app.name,
					isActive ? E('span', { 'class': 'st-app-badge active', 'style': 'margin-left: 8px' }, _('ACTIVE')) : '',
					isPublished ? E('span', { 'class': 'st-app-badge', 'style': 'margin-left: 8px; background: #059669; color: #fff;' }, _('PUBLISHED')) : ''
				]),
				E('td', {}, app.path || '-'),
				E('td', {}, self.formatSize(app.size)),
				E('td', {}, [
					E('div', { 'class': 'st-btn-group' }, [
						!isActive ? E('button', {
							'class': 'st-btn st-btn-primary',
							'style': 'padding: 5px 10px; font-size: 12px;',
							'click': function() { self.handleActivate(app.name); }
						}, _('Activate')) : '',
						!isPublished ? E('button', {
							'class': 'st-btn',
							'style': 'padding: 5px 10px; font-size: 12px; background: #7c3aed; color: #fff;',
							'click': function() { self.showPublishWizard(app.name); }
						}, ['\uD83C\uDF10 ', _('Publish')]) : '',
						app.name !== 'hello' ? E('button', {
							'class': 'st-btn st-btn-danger',
							'style': 'padding: 5px 10px; font-size: 12px;',
							'click': function() { self.handleRemove(app.name); }
						}, _('Remove')) : ''
					])
				])
			]);
		});

		if (apps.length === 0) {
			tableRows = [
				E('tr', {}, [
					E('td', { 'colspan': '4', 'style': 'text-align: center; padding: 40px;' }, [
						E('div', { 'class': 'st-empty' }, [
							E('div', { 'class': 'st-empty-icon' }, '\uD83D\uDCE6'),
							E('div', {}, _('No apps deployed yet'))
						])
					])
				])
			];
		}

		return E('div', { 'class': 'st-card', 'style': 'margin-bottom: 24px;' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83D\uDCCB'),
					' ' + _('Deployed Apps')
				]),
				E('div', {}, [
					E('span', { 'style': 'color: #94a3b8; font-size: 13px;' },
						apps.length + ' ' + (apps.length === 1 ? _('app') : _('apps')))
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('table', { 'class': 'st-apps-table', 'id': 'apps-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('Name')),
							E('th', {}, _('Path')),
							E('th', {}, _('Size')),
							E('th', {}, _('Actions'))
						])
					]),
					E('tbody', { 'id': 'apps-tbody' }, tableRows)
				])
			])
		]);
	},

	renderUploadCard: function() {
		var self = this;

		return E('div', { 'class': 'st-card' }, [
			E('div', { 'class': 'st-card-header' }, [
				E('div', { 'class': 'st-card-title' }, [
					E('span', {}, '\uD83D\uDCE4'),
					' ' + _('Upload New App')
				])
			]),
			E('div', { 'class': 'st-card-body' }, [
				E('div', { 'class': 'st-form-group' }, [
					E('label', { 'class': 'st-form-label' }, _('App Name')),
					E('input', {
						'type': 'text',
						'class': 'st-form-input',
						'id': 'upload-name',
						'placeholder': _('myapp (without .py extension)')
					})
				]),
				E('div', {
					'class': 'st-upload-area',
					'id': 'upload-area',
					'click': function() { document.getElementById('upload-file').click(); },
					'dragover': function(e) {
						e.preventDefault();
						this.classList.add('dragover');
					},
					'dragleave': function(e) {
						e.preventDefault();
						this.classList.remove('dragover');
					},
					'drop': function(e) {
						e.preventDefault();
						this.classList.remove('dragover');
						var files = e.dataTransfer.files;
						if (files.length > 0) {
							self.handleFileSelect(files[0]);
						}
					}
				}, [
					E('div', { 'class': 'st-upload-icon' }, '\uD83D\uDCC1'),
					E('div', { 'class': 'st-upload-text' }, [
						E('p', {}, _('Drop your .py file here or click to browse')),
						E('p', { 'style': 'font-size: 12px; color: #64748b;' }, _('Supported: Python (.py) files'))
					])
				]),
				E('input', {
					'type': 'file',
					'id': 'upload-file',
					'accept': '.py',
					'style': 'display: none;',
					'change': function(e) {
						if (e.target.files.length > 0) {
							self.handleFileSelect(e.target.files[0]);
						}
					}
				}),
				E('div', { 'id': 'upload-status', 'style': 'margin-top: 16px; display: none;' })
			])
		]);
	},

	formatSize: function(bytes) {
		if (!bytes || bytes === '-') return '-';
		var num = parseInt(bytes, 10);
		if (isNaN(num)) return bytes;
		if (num < 1024) return num + ' B';
		if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
		return (num / (1024 * 1024)).toFixed(1) + ' MB';
	},

	updateAppsTable: function() {
		var self = this;
		var tbody = document.getElementById('apps-tbody');
		if (!tbody) return;

		var apps = this.appsData.apps || [];
		var activeApp = this.appsData.active_app || 'hello';

		tbody.innerHTML = '';

		if (apps.length === 0) {
			tbody.appendChild(E('tr', {}, [
				E('td', { 'colspan': '4', 'style': 'text-align: center; padding: 40px;' }, [
					E('div', { 'class': 'st-empty' }, [
						E('div', { 'class': 'st-empty-icon' }, '\uD83D\uDCE6'),
						E('div', {}, _('No apps deployed yet'))
					])
				])
			]));
			return;
		}

		apps.forEach(function(app) {
			var isActive = app.active || app.name === activeApp;
			var isPublished = self.isAppPublished(app.name);
			tbody.appendChild(E('tr', {}, [
				E('td', { 'class': isActive ? 'st-app-active' : '' }, [
					app.name,
					isActive ? E('span', { 'class': 'st-app-badge active', 'style': 'margin-left: 8px' }, _('ACTIVE')) : '',
					isPublished ? E('span', { 'class': 'st-app-badge', 'style': 'margin-left: 8px; background: #059669; color: #fff;' }, _('PUBLISHED')) : ''
				]),
				E('td', {}, app.path || '-'),
				E('td', {}, self.formatSize(app.size)),
				E('td', {}, [
					E('div', { 'class': 'st-btn-group' }, [
						!isActive ? E('button', {
							'class': 'st-btn st-btn-primary',
							'style': 'padding: 5px 10px; font-size: 12px;',
							'click': function() { self.handleActivate(app.name); }
						}, _('Activate')) : '',
						!isPublished ? E('button', {
							'class': 'st-btn',
							'style': 'padding: 5px 10px; font-size: 12px; background: #7c3aed; color: #fff;',
							'click': function() { self.showPublishWizard(app.name); }
						}, ['\uD83C\uDF10 ', _('Publish')]) : '',
						app.name !== 'hello' ? E('button', {
							'class': 'st-btn st-btn-danger',
							'style': 'padding: 5px 10px; font-size: 12px;',
							'click': function() { self.handleRemove(app.name); }
						}, _('Remove')) : ''
					])
				])
			]));
		});
	},

	handleFileSelect: function(file) {
		var self = this;

		if (!file.name.endsWith('.py')) {
			ui.addNotification(null, E('p', {}, _('Please select a Python (.py) file')), 'error');
			return;
		}

		var nameInput = document.getElementById('upload-name');
		if (!nameInput.value) {
			// Auto-fill name from filename
			nameInput.value = file.name.replace('.py', '');
		}

		var statusDiv = document.getElementById('upload-status');
		statusDiv.style.display = 'block';
		statusDiv.innerHTML = '';
		statusDiv.appendChild(E('p', { 'style': 'color: #0ff;' },
			_('Selected: ') + file.name + ' (' + this.formatSize(file.size) + ')'));

		// Add upload button
		statusDiv.appendChild(E('button', {
			'class': 'st-btn st-btn-success',
			'style': 'margin-top: 10px;',
			'click': function() { self.uploadFile(file); }
		}, [E('span', {}, '\uD83D\uDCE4'), ' ' + _('Upload App')]));
	},

	uploadFile: function(file) {
		var self = this;
		var nameInput = document.getElementById('upload-name');
		var name = nameInput.value.trim();

		if (!name) {
			ui.addNotification(null, E('p', {}, _('Please enter an app name')), 'error');
			return;
		}

		// Validate name (alphanumeric and underscore only)
		if (!/^[a-zA-Z0-9_]+$/.test(name)) {
			ui.addNotification(null, E('p', {}, _('App name can only contain letters, numbers, and underscores')), 'error');
			return;
		}

		var reader = new FileReader();
		reader.onload = function(e) {
			// Convert ArrayBuffer to base64 (handles UTF-8 correctly)
			var bytes = new Uint8Array(e.target.result);
			var binary = '';
			for (var i = 0; i < bytes.byteLength; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			var content = btoa(binary);

			api.uploadApp(name, content).then(function(result) {
				if (result && result.success) {
					ui.addNotification(null, E('p', {}, _('App uploaded successfully: ') + name), 'success');
					nameInput.value = '';
					document.getElementById('upload-status').style.display = 'none';
					self.refreshData();
				} else {
					ui.addNotification(null, E('p', {}, result.message || _('Upload failed')), 'error');
				}
			}).catch(function(err) {
				ui.addNotification(null, E('p', {}, _('Upload failed: ') + err.message), 'error');
			});
		};
		reader.readAsArrayBuffer(file);
	},

	handleActivate: function(name) {
		var self = this;

		api.setActiveApp(name).then(function(result) {
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Active app set to: ') + name), 'success');
				self.refreshData();
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Failed to activate app')), 'error');
			}
		});
	},

	handleRemove: function(name) {
		var self = this;

		ui.showModal(_('Confirm Remove'), [
			E('p', {}, _('Are you sure you want to remove the app: ') + name + '?'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.removeApp(name).then(function(result) {
							if (result && result.success) {
								ui.addNotification(null, E('p', {}, _('App removed: ') + name), 'info');
								self.refreshData();
							} else {
								ui.addNotification(null, E('p', {}, result.message || _('Failed to remove app')), 'error');
							}
						});
					}
				}, _('Remove'))
			])
		]);
	},

	showPublishWizard: function(appName) {
		var self = this;
		var port = this.statusData.http_port || 8501;
		var lanIp = '192.168.255.1';

		// Try to get LAN IP from status
		if (this.statusData.web_url) {
			var match = this.statusData.web_url.match(/\/\/([^:\/]+)/);
			if (match) lanIp = match[1];
		}

		ui.showModal(_('Publish App to Web'), [
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('p', { 'style': 'margin-bottom: 12px;' }, [
					_('Configure HAProxy to expose '),
					E('strong', {}, appName),
					_(' via a custom domain.')
				])
			]),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px; font-weight: bold;' }, _('Domain Name')),
				E('input', {
					'type': 'text',
					'id': 'publish-domain',
					'style': 'width: 100%; padding: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; border-radius: 4px;',
					'placeholder': appName + '.example.com'
				}),
				E('small', { 'style': 'color: #64748b;' }, _('Enter the domain that will route to this app'))
			]),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px;' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'publish-ssl',
						'checked': true,
						'style': 'margin-right: 8px;'
					}),
					_('Enable SSL (HTTPS)')
				])
			]),
			E('div', { 'style': 'margin-bottom: 12px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 4px;' }, [
					E('input', {
						'type': 'checkbox',
						'id': 'publish-acme',
						'checked': true,
						'style': 'margin-right: 8px;'
					}),
					_('Auto-request Let\'s Encrypt certificate')
				])
			]),
			E('div', { 'style': 'background: #334155; padding: 12px; border-radius: 4px; margin-bottom: 16px;' }, [
				E('p', { 'style': 'margin: 0; font-size: 13px;' }, [
					_('Backend: '),
					E('code', {}, lanIp + ':' + port)
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'btn cbi-button-positive',
					'style': 'margin-left: 8px;',
					'click': function() {
						var domain = document.getElementById('publish-domain').value.trim();
						var ssl = document.getElementById('publish-ssl').checked;
						var acme = document.getElementById('publish-acme').checked;

						if (!domain) {
							ui.addNotification(null, E('p', {}, _('Please enter a domain name')), 'error');
							return;
						}

						self.publishApp(appName, domain, lanIp, port, ssl, acme);
					}
				}, ['\uD83D\uDE80 ', _('Publish')])
			])
		]);
	},

	publishApp: function(appName, domain, backendIp, backendPort, ssl, acme) {
		var self = this;
		var backendName = 'streamlit_' + appName;

		ui.hideModal();
		ui.showModal(_('Publishing...'), [
			E('p', { 'class': 'spinning' }, _('Creating HAProxy configuration...'))
		]);

		// Step 1: Create backend
		haproxyCreateBackend(backendName, 'http', 'roundrobin', 'httpchk', '1')
			.then(function(result) {
				if (result && result.error) {
					throw new Error(result.error);
				}
				// Step 2: Create server
				return haproxyCreateServer(backendName, appName, backendIp, backendPort.toString(), '100', '1', '1');
			})
			.then(function(result) {
				if (result && result.error) {
					throw new Error(result.error);
				}
				// Step 3: Create vhost
				var sslFlag = ssl ? '1' : '0';
				var acmeFlag = acme ? '1' : '0';
				return haproxyCreateVhost(domain, backendName, sslFlag, sslFlag, acmeFlag, '1');
			})
			.then(function(result) {
				if (result && result.error) {
					throw new Error(result.error);
				}
				// Step 4: Reload HAProxy
				return haproxyReload();
			})
			.then(function() {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, [
					_('App published successfully! Access at: '),
					E('a', {
						'href': (ssl ? 'https://' : 'http://') + domain,
						'target': '_blank',
						'style': 'color: #0ff;'
					}, (ssl ? 'https://' : 'http://') + domain)
				]), 'success');
				self.refreshData();
			})
			.catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', {}, _('Publish failed: ') + (err.message || err)), 'error');
			});
	}
});
