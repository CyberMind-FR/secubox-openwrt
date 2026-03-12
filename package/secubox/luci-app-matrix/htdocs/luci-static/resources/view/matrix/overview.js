'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require uci';
'require matrix.api as api';
'require secubox/kiss-theme';

return view.extend({
	handleAction: function(action, args) {
		var self = this;

		ui.showModal('Processing...', [
			E('p', { 'class': 'spinning' }, 'Please wait...')
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
				ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown error')), 'error');
			}

			self.load().then(function(data) {
				dom.content(document.querySelector('#matrix-content'), self.renderContent(data));
			});
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Error: ' + e.message), 'error');
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

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/matrix/overview' },
			{ name: 'Users', path: 'admin/services/matrix/users' },
			{ name: 'Rooms', path: 'admin/services/matrix/rooms' },
			{ name: 'Settings', path: 'admin/services/matrix/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status, federation, identity, mesh) {
		var c = KissTheme.colors;
		var running = status.running === 'true' || status.running === true;

		return [
			KissTheme.stat(running ? 'UP' : 'DOWN', 'Server', running ? c.green : c.red),
			KissTheme.stat(federation.enabled === '1' ? 'ON' : 'OFF', 'Federation', federation.enabled === '1' ? c.blue : c.muted),
			KissTheme.stat(identity.linked === '1' ? 'YES' : 'NO', 'DID Linked', identity.linked === '1' ? c.cyan : c.muted),
			KissTheme.stat(mesh.published === '1' ? 'YES' : 'NO', 'Mesh', mesh.published === '1' ? c.purple : c.muted)
		];
	},

	renderInstallWizard: function() {
		var self = this;

		return KissTheme.card('Install Matrix', E('div', {}, [
			E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' }, 'Matrix is a decentralized communication protocol with end-to-end encryption.'),
			E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 12px;' }, 'Features'),
				E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
					E('li', {}, 'End-to-end encrypted messaging'),
					E('li', {}, 'Federated chat (connect with other Matrix servers)'),
					E('li', {}, 'Group chats and spaces'),
					E('li', {}, 'Voice and video calls'),
					E('li', {}, 'File sharing'),
					E('li', {}, 'Bridge to other platforms')
				])
			]),
			E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 8px;' }, 'Compatible Clients'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'Element (Web/Desktop/Mobile), FluffyChat, Nheko, SchildiChat')
			]),
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': function() { self.handleAction('install'); }
			}, 'Install Matrix Homeserver')
		]));
	},

	renderHealth: function(status, federation, identity, mesh) {
		var running = status.running === 'true' || status.running === true;

		var checks = [
			{ label: 'Server', ok: running, value: running ? 'Running' : (status.container_state === 'not_installed' ? 'Not Installed' : 'Stopped') },
			{ label: 'Federation', ok: federation.enabled === '1', value: federation.enabled === '1' ? 'Enabled' : 'Disabled' },
			{ label: 'HAProxy', ok: status.haproxy === '1', value: status.haproxy === '1' ? 'Configured' : 'Not configured' },
			{ label: 'DID Linked', ok: identity.linked === '1', value: identity.linked === '1' ? identity.mxid : 'Not linked' },
			{ label: 'Mesh Published', ok: mesh.published === '1', value: mesh.published === '1' ? mesh.service_name : 'Not published' }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' }, checks.map(function(c) {
			return E('div', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('div', { 'style': 'width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; ' +
					(c.ok ? 'background: rgba(0,200,83,0.15); color: var(--kiss-green);' : 'background: rgba(255,23,68,0.15); color: var(--kiss-red);') },
					c.ok ? '\u2713' : '\u2717'),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-size: 13px; color: var(--kiss-text);' }, c.label),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, c.value)
				])
			]);
		}));
	},

	renderControls: function(status) {
		var self = this;
		var running = status.running === 'true' || status.running === true;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				running ? '' : E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAction('start'); }
				}, 'Start'),
				running ? E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleAction('stop'); }
				}, 'Stop') : '',
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleAction('update'); }
				}, 'Update'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						if (confirm('Are you sure you want to uninstall? Data will be preserved.')) {
							self.handleAction('uninstall');
						}
					}
				}, 'Uninstall')
			]),
			E('div', { 'style': 'margin-top: 8px;' }, [
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Hostname'),
				E('div', { 'style': 'font-family: monospace; font-size: 13px; color: var(--kiss-cyan);' }, status.hostname || 'matrix.local')
			]),
			status.domain ? E('div', {}, [
				E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Public URL'),
				E('a', { 'href': 'https://' + status.domain, 'target': '_blank', 'style': 'font-family: monospace; font-size: 13px; color: var(--kiss-green);' }, 'https://' + status.domain)
			]) : ''
		]);
	},

	renderUserManagement: function(status) {
		var self = this;
		var hostname = status.hostname || 'matrix.local';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Create Matrix users for this homeserver.'),
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('input', {
					'type': 'text',
					'id': 'new-user-mxid',
					'placeholder': '@username:' + hostname,
					'style': 'flex: 1; min-width: 200px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('input', {
					'type': 'password',
					'id': 'new-user-password',
					'placeholder': 'Password (optional)',
					'style': 'width: 150px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var mxid = document.getElementById('new-user-mxid').value;
						var password = document.getElementById('new-user-password').value;
						if (mxid) {
							self.handleAction('user_add', { mxid: mxid, password: password });
						}
					}
				}, 'Add User')
			]),
			E('p', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin: 0;' }, 'For user listing and deletion, use the admin room: #admins:' + hostname)
		]);
	},

	renderEmancipate: function(status) {
		var self = this;
		var domain = status.domain || '';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Expose your Matrix server to the internet with SSL.'),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('input', {
					'type': 'text',
					'id': 'emancipate-domain',
					'placeholder': 'matrix.example.com',
					'value': domain,
					'style': 'flex: 1; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var d = document.getElementById('emancipate-domain').value;
						if (d) {
							self.handleAction('emancipate', { domain: d });
						}
					}
				}, 'Emancipate')
			]),
			domain ? E('div', { 'style': 'padding: 12px; background: rgba(0,200,83,0.1); border-radius: 6px;' }, [
				E('span', { 'style': 'color: var(--kiss-green);' }, 'Currently exposed at: '),
				E('a', { 'href': 'https://' + domain, 'target': '_blank', 'style': 'color: var(--kiss-cyan);' }, 'https://' + domain)
			]) : ''
		]);
	},

	renderMesh: function(mesh) {
		var self = this;

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Publish this Matrix server to the SecuBox P2P mesh.'),
			mesh.published === '1' ?
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('span', { 'style': 'color: var(--kiss-green);' }, 'Published as: ' + mesh.service_name),
					E('button', {
						'class': 'kiss-btn',
						'click': function() { self.handleAction('mesh_unpublish'); }
					}, 'Unpublish')
				]) :
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleAction('mesh_publish'); }
				}, 'Publish to Mesh')
		]);
	},

	renderContent: function(data) {
		var self = this;
		var status = data[0] || {};
		var federation = data[2] || {};
		var identity = data[3] || {};
		var mesh = data[4] || {};
		var c = KissTheme.colors;

		if (status.container_state === 'not_installed') {
			return this.renderInstallWizard();
		}

		var running = status.running === 'true' || status.running === true;

		return E('div', {}, [
			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' }, this.renderStats(status, federation, identity, mesh)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('System Health', this.renderHealth(status, federation, identity, mesh)),
				KissTheme.card('Controls', this.renderControls(status))
			]),

			// User Management
			KissTheme.card('User Management', this.renderUserManagement(status)),

			// Two column for exposure
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Public Exposure', this.renderEmancipate(status)),
				KissTheme.card('P2P Mesh Publication', this.renderMesh(mesh))
			])
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var running = status.running === 'true' || status.running === true;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Matrix Homeserver'),
					KissTheme.badge(running ? 'RUNNING' : (status.container_state === 'not_installed' ? 'NOT INSTALLED' : 'STOPPED'),
						running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Decentralized end-to-end encrypted communication')
			]),

			// Navigation
			this.renderNav('overview'),

			// Content
			E('div', { 'id': 'matrix-content' }, this.renderContent(data))
		];

		poll.add(L.bind(function() {
			return api.getStatus().then(L.bind(function(s) {
				// Update status without full reload
			}, this));
		}, this), 10);

		return KissTheme.wrap(content, 'admin/services/matrix/overview');
	}
});
