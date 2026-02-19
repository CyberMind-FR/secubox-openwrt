'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require uci';
'require matrix.api as api';

return view.extend({
	handleAction: function(action, args) {
		var self = this;

		ui.showModal(_('Processing...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		var promise;
		switch(action) {
			case 'start':
				promise = api.start();
				break;
			case 'stop':
				promise = api.stop();
				break;
			case 'install':
				promise = api.install();
				break;
			case 'uninstall':
				promise = api.uninstall();
				break;
			case 'update':
				promise = api.update();
				break;
			case 'emancipate':
				promise = api.emancipate(args.domain);
				break;
			case 'configure_haproxy':
				promise = api.configureHaproxy();
				break;
			case 'user_add':
				promise = api.userAdd(args.mxid, args.password);
				break;
			case 'identity_link':
				promise = api.identityLink(args.mxid);
				break;
			case 'identity_unlink':
				promise = api.identityUnlink();
				break;
			case 'mesh_publish':
				promise = api.meshPublish();
				break;
			case 'mesh_unpublish':
				promise = api.meshUnpublish();
				break;
			default:
				promise = Promise.reject(new Error('Unknown action'));
		}

		promise.then(function(res) {
			ui.hideModal();

			if (res && res.success) {
				var msg = res.message || 'Operation completed successfully';
				if (res.password) {
					msg += '\n\nGenerated password: ' + res.password;
				}
				ui.addNotification(null, E('p', {}, msg), 'success');
			} else {
				ui.addNotification(null, E('p', {}, _('Error: ') + (res.error || 'Unknown error')), 'error');
			}

			// Refresh status
			self.load().then(function(data) {
				dom.content(document.querySelector('#matrix-content'), self.renderContent(data));
			});
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Error: ') + e.message), 'error');
		});
	},

	load: function() {
		return Promise.all([
			api.getStatus(),
			uci.load('matrix'),
			api.getFederationStatus(),
			api.getIdentityStatus(),
			api.getMeshStatus()
		]);
	},

	renderStatusBadge: function(running) {
		var color = running ? '#4CAF50' : '#9e9e9e';
		var text = running ? _('Running') : _('Stopped');
		return E('span', {
			'style': 'display:inline-block;padding:3px 10px;border-radius:3px;color:#fff;background:' + color
		}, text);
	},

	renderFeatureBadge: function(enabled, label) {
		var color = enabled ? '#2196F3' : '#9e9e9e';
		return E('span', {
			'style': 'display:inline-block;padding:2px 8px;border-radius:3px;color:#fff;background:' + color + ';margin-right:5px;font-size:0.85em;'
		}, label);
	},

	renderInstallWizard: function() {
		var self = this;

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Matrix Homeserver')),
			E('p', {}, _('Matrix is a decentralized communication protocol with end-to-end encryption.')),
			E('div', { 'style': 'margin:20px 0;padding:15px;background:#f5f5f5;border-radius:5px;' }, [
				E('h4', {}, _('Features:')),
				E('ul', {}, [
					E('li', {}, _('End-to-end encrypted messaging')),
					E('li', {}, _('Federated chat (connect with other Matrix servers)')),
					E('li', {}, _('Group chats and spaces')),
					E('li', {}, _('Voice and video calls')),
					E('li', {}, _('File sharing')),
					E('li', {}, _('Bridge to other platforms'))
				]),
				E('h4', { 'style': 'margin-top:15px;' }, _('Compatible clients:')),
				E('p', {}, _('Element (Web/Desktop/Mobile), FluffyChat, Nheko, SchildiChat'))
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': function() { self.handleAction('install'); }
				}, _('Install Matrix Homeserver'))
			])
		]);
	},

	renderContent: function(data) {
		var self = this;
		var status = data[0] || {};
		var federation = data[2] || {};
		var identity = data[3] || {};
		var mesh = data[4] || {};

		// Show install wizard if not installed
		if (status.container_state === 'not_installed') {
			return this.renderInstallWizard();
		}

		var running = status.running === 'true' || status.running === true;
		var hostname = status.hostname || 'matrix.local';
		var httpPort = status.http_port || '8008';
		var domain = status.domain || '';
		var lanIp = '192.168.255.1';

		var content = [];

		// Status Section
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Matrix Homeserver')),
			E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:20px;margin:15px 0;' }, [
				// Status Card
				E('div', { 'style': 'flex:1;min-width:200px;padding:15px;border:1px solid #ddd;border-radius:5px;' }, [
					E('h4', { 'style': 'margin:0 0 10px 0;' }, _('Server Status')),
					E('div', {}, this.renderStatusBadge(running)),
					E('div', { 'style': 'margin-top:10px;color:#666;' }, [
						E('div', {}, _('Hostname: ') + hostname),
						E('div', {}, _('Client Port: ') + httpPort),
						status.version ? E('div', {}, _('Version: ') + status.version) : ''
					])
				]),
				// Features Card
				E('div', { 'style': 'flex:1;min-width:200px;padding:15px;border:1px solid #ddd;border-radius:5px;' }, [
					E('h4', { 'style': 'margin:0 0 10px 0;' }, _('Features')),
					E('div', {}, [
						this.renderFeatureBadge(federation.enabled === '1', _('Federation')),
						this.renderFeatureBadge(status.haproxy === '1', _('HAProxy')),
						this.renderFeatureBadge(identity.linked === '1', _('DID Linked')),
						this.renderFeatureBadge(mesh.published === '1', _('Mesh'))
					])
				]),
				// Connection Card
				E('div', { 'style': 'flex:1;min-width:200px;padding:15px;border:1px solid #ddd;border-radius:5px;' }, [
					E('h4', { 'style': 'margin:0 0 10px 0;' }, _('Connection Info')),
					E('div', { 'style': 'font-family:monospace;font-size:0.9em;' }, [
						E('div', {}, _('Homeserver URL:')),
						domain ? E('div', { 'style': 'color:#2196F3;' }, 'https://' + domain) :
							E('div', { 'style': 'color:#666;' }, 'http://' + lanIp + ':' + httpPort),
						E('div', { 'style': 'margin-top:5px;' }, _('Admin Room:')),
						E('div', { 'style': 'color:#666;' }, '#admins:' + hostname)
					])
				])
			])
		]));

		// Service Controls
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h4', {}, _('Service Controls')),
			E('div', { 'class': 'cbi-page-actions', 'style': 'margin:0;' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': function() { self.handleAction('start'); },
					'disabled': running
				}, _('Start')),
				E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': function() { self.handleAction('stop'); },
					'disabled': !running,
					'style': 'margin-left:5px;'
				}, _('Stop')),
				E('button', {
					'class': 'btn cbi-button',
					'click': function() { self.handleAction('update'); },
					'style': 'margin-left:5px;'
				}, _('Update')),
				E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'click': function() {
						if (confirm(_('Are you sure you want to uninstall? Data will be preserved.'))) {
							self.handleAction('uninstall');
						}
					},
					'style': 'margin-left:5px;'
				}, _('Uninstall'))
			])
		]));

		// User Management
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h4', {}, _('User Management')),
			E('p', { 'style': 'color:#666;' }, _('Create Matrix users for this homeserver.')),
			E('div', { 'style': 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;' }, [
				E('input', {
					'type': 'text',
					'id': 'new-user-mxid',
					'placeholder': '@username:' + hostname,
					'style': 'width:200px;padding:5px;'
				}),
				E('input', {
					'type': 'password',
					'id': 'new-user-password',
					'placeholder': _('Password (optional)'),
					'style': 'width:150px;padding:5px;'
				}),
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': function() {
						var mxid = document.getElementById('new-user-mxid').value;
						var password = document.getElementById('new-user-password').value;
						if (mxid) {
							self.handleAction('user_add', { mxid: mxid, password: password });
						}
					}
				}, _('Add User'))
			]),
			E('p', { 'style': 'margin-top:10px;color:#888;font-size:0.9em;' },
				_('For user listing and deletion, use the admin room: #admins:') + hostname)
		]));

		// Emancipate (Public Exposure)
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h4', {}, _('Public Exposure')),
			E('p', { 'style': 'color:#666;' }, _('Expose your Matrix server to the internet with SSL.')),
			E('div', { 'style': 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;' }, [
				E('input', {
					'type': 'text',
					'id': 'emancipate-domain',
					'placeholder': 'matrix.example.com',
					'value': domain,
					'style': 'width:250px;padding:5px;'
				}),
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': function() {
						var domain = document.getElementById('emancipate-domain').value;
						if (domain) {
							self.handleAction('emancipate', { domain: domain });
						}
					}
				}, _('Emancipate'))
			]),
			domain ? E('div', { 'style': 'margin-top:10px;padding:10px;background:#e8f5e9;border-radius:5px;' }, [
				E('strong', {}, _('Currently exposed at: ')),
				E('a', { 'href': 'https://' + domain, 'target': '_blank' }, 'https://' + domain)
			]) : ''
		]));

		// Identity Integration
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h4', {}, _('Identity Integration')),
			E('p', { 'style': 'color:#666;' }, _('Link your Matrix identity to the node DID.')),
			identity.linked === '1' ? E('div', { 'style': 'padding:10px;background:#e3f2fd;border-radius:5px;' }, [
				E('div', {}, _('Matrix ID: ') + identity.mxid),
				E('div', {}, _('Node DID: ') + (identity.did || 'N/A')),
				E('button', {
					'class': 'btn cbi-button',
					'click': function() { self.handleAction('identity_unlink'); },
					'style': 'margin-top:10px;'
				}, _('Unlink'))
			]) : E('div', { 'style': 'display:flex;gap:10px;align-items:center;' }, [
				E('input', {
					'type': 'text',
					'id': 'identity-mxid',
					'placeholder': '@user:' + hostname,
					'style': 'width:200px;padding:5px;'
				}),
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': function() {
						var mxid = document.getElementById('identity-mxid').value;
						if (mxid) {
							self.handleAction('identity_link', { mxid: mxid });
						}
					}
				}, _('Link Identity'))
			])
		]));

		// Mesh Publication
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h4', {}, _('P2P Mesh Publication')),
			E('p', { 'style': 'color:#666;' }, _('Publish this Matrix server to the SecuBox P2P mesh.')),
			mesh.published === '1' ?
				E('div', {}, [
					E('span', { 'style': 'color:#4CAF50;' }, _('Published to mesh as: ') + mesh.service_name),
					E('button', {
						'class': 'btn cbi-button',
						'click': function() { self.handleAction('mesh_unpublish'); },
						'style': 'margin-left:15px;'
					}, _('Unpublish'))
				]) :
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': function() { self.handleAction('mesh_publish'); }
				}, _('Publish to Mesh'))
		]));

		// Logs Section
		content.push(E('div', { 'class': 'cbi-section' }, [
			E('h4', {}, _('Server Logs')),
			E('div', { 'style': 'display:flex;gap:10px;margin-bottom:10px;' }, [
				E('button', {
					'class': 'btn cbi-button',
					'click': function() {
						api.getLogs(100).then(function(res) {
							var pre = document.getElementById('matrix-logs');
							if (pre) pre.textContent = res.logs || 'No logs available';
						});
					}
				}, _('Refresh Logs'))
			]),
			E('pre', {
				'id': 'matrix-logs',
				'style': 'background:#1e1e1e;color:#d4d4d4;padding:15px;border-radius:5px;max-height:300px;overflow:auto;font-size:0.85em;'
			}, _('Click "Refresh Logs" to load...'))
		]));

		return E('div', {}, content);
	},

	render: function(data) {
		var content = E('div', { 'id': 'matrix-content' }, this.renderContent(data));

		// Poll for status updates
		poll.add(L.bind(function() {
			return api.getStatus().then(L.bind(function(status) {
				// Update status badges without full reload
				var statusBadge = document.querySelector('#matrix-content .cbi-section span');
				if (statusBadge && status) {
					var running = status.running === 'true' || status.running === true;
					statusBadge.style.background = running ? '#4CAF50' : '#9e9e9e';
					statusBadge.textContent = running ? _('Running') : _('Stopped');
				}
			}, this));
		}, this), 10);

		return content;
	}
});
