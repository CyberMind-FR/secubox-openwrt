'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require uci';
'require form';
'require jabber.api as api';

return view.extend({
	handleAction: function(action, args) {
		var self = this;
		var btn = document.activeElement;

		ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Processing request...'))
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
				if (!confirm(_('This will remove the Jabber container. User data will be preserved. Continue?')))
					return ui.hideModal();
				promise = api.uninstall();
				break;
			case 'update':
				promise = api.update();
				break;
			case 'configure_haproxy':
				promise = api.configureHaproxy();
				break;
			case 'emancipate':
				var domain = args;
				if (!domain) {
					ui.hideModal();
					ui.addNotification(null, E('p', _('Domain is required')), 'error');
					return;
				}
				promise = api.emancipate(domain);
				break;
			case 'user_add':
				var jid = args.jid;
				var password = args.password;
				if (!jid) {
					ui.hideModal();
					ui.addNotification(null, E('p', _('JID is required')), 'error');
					return;
				}
				promise = api.userAdd(jid, password);
				break;
			case 'user_del':
				if (!confirm(_('Delete user ') + args + '?'))
					return ui.hideModal();
				promise = api.userDel(args);
				break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				var msg = res.message || _('Action completed');
				if (res.password) {
					msg += '\n' + _('Password: ') + res.password;
				}
				ui.addNotification(null, E('p', { 'style': 'white-space: pre-wrap;' }, msg), 'success');
				self.load().then(function(data) {
					dom.content(document.querySelector('#jabber-content'), self.renderContent(data));
				});
			} else {
				ui.addNotification(null, E('p', res.error || _('Action failed')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	load: function() {
		return Promise.all([
			api.status(),
			api.userList(),
			uci.load('jabber')
		]);
	},

	renderInstallWizard: function() {
		var self = this;

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Jabber/XMPP Server')),
			E('p', {}, _('Prosody is a modern XMPP server written in Lua. It aims to be easy to set up and configure, and efficient with system resources.')),
			E('div', { 'class': 'cbi-value' }, [
				E('h4', {}, _('Features')),
				E('ul', {}, [
					E('li', {}, _('Secure messaging with end-to-end encryption (OMEMO)')),
					E('li', {}, _('Multi-user chat rooms (MUC)')),
					E('li', {}, _('File sharing with HTTP upload')),
					E('li', {}, _('Server-to-server federation (S2S)')),
					E('li', {}, _('BOSH and WebSocket for web clients')),
					E('li', {}, _('Message archiving (MAM)'))
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('h4', {}, _('Compatible Clients')),
				E('ul', {}, [
					E('li', {}, _('Conversations (Android)')),
					E('li', {}, _('Monal (iOS/macOS)')),
					E('li', {}, _('Gajim (Windows/Linux)')),
					E('li', {}, _('Dino (Linux)')),
					E('li', {}, _('Converse.js (Web)'))
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': function() { self.handleAction('install'); }
				}, _('Install Jabber/XMPP'))
			])
		]);
	},

	renderStatusBadge: function(running) {
		var color = running === 'true' ? '#4CAF50' : '#f44336';
		var text = running === 'true' ? _('Running') : _('Stopped');
		return E('span', {
			'style': 'display:inline-block;padding:3px 10px;border-radius:3px;color:#fff;background:' + color
		}, text);
	},

	renderContent: function(data) {
		var self = this;
		var status = data[0] || {};
		var userListData = data[1] || {};

		if (status.container_state === 'not_installed') {
			return this.renderInstallWizard();
		}

		var running = status.running === 'true';
		var haproxyConfigured = status.haproxy === '1';
		var domain = status.domain || '';
		var hostname = status.hostname || 'jabber.local';

		// Parse user list
		var users = [];
		if (userListData.users) {
			users = userListData.users.split(',').filter(function(u) { return u.length > 0; });
		}

		var accessUrl = '';
		if (running) {
			if (domain && haproxyConfigured) {
				accessUrl = 'https://' + domain;
			} else {
				accessUrl = 'http://192.168.255.1:' + (status.http_port || '5280');
			}
		}

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Jabber/XMPP Server (Prosody)')),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Status')),
				E('div', { 'class': 'cbi-value-field' }, this.renderStatusBadge(status.running))
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Hostname')),
				E('div', { 'class': 'cbi-value-field' }, hostname)
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('C2S Port')),
				E('div', { 'class': 'cbi-value-field' }, status.c2s_port || '5222')
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('S2S Port')),
				E('div', { 'class': 'cbi-value-field' }, [
					status.s2s_port || '5269',
					' ',
					E('span', {
						'style': 'display:inline-block;padding:2px 8px;border-radius:3px;color:#fff;background:' + (status.s2s_enabled === '1' ? '#4CAF50' : '#9e9e9e')
					}, status.s2s_enabled === '1' ? _('Federation ON') : _('Federation OFF'))
				])
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('HTTP/BOSH Port')),
				E('div', { 'class': 'cbi-value-field' }, status.http_port || '5280')
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Users')),
				E('div', { 'class': 'cbi-value-field' }, status.user_count || '0')
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('MUC (Chat Rooms)')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('span', {
						'style': 'display:inline-block;padding:3px 10px;border-radius:3px;color:#fff;background:' + (status.muc_enabled === '1' ? '#4CAF50' : '#9e9e9e')
					}, status.muc_enabled === '1' ? _('Enabled') : _('Disabled'))
				])
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('HAProxy')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('span', {
						'style': 'display:inline-block;padding:3px 10px;border-radius:3px;color:#fff;background:' + (haproxyConfigured ? '#4CAF50' : '#9e9e9e')
					}, haproxyConfigured ? _('Configured') : _('Not configured')),
					' ',
					!haproxyConfigured ? E('button', {
						'class': 'btn cbi-button',
						'click': function() { self.handleAction('configure_haproxy'); }
					}, _('Configure')) : ''
				])
			]),

			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Domain')),
				E('div', { 'class': 'cbi-value-field' }, domain || _('Not configured'))
			]),

			E('hr'),

			E('h4', {}, _('Service Controls')),
			E('div', { 'class': 'cbi-page-actions', 'style': 'margin-bottom: 20px;' }, [
				running ?
					E('button', {
						'class': 'btn cbi-button cbi-button-negative',
						'click': function() { self.handleAction('stop'); }
					}, _('Stop')) :
					E('button', {
						'class': 'btn cbi-button cbi-button-positive',
						'click': function() { self.handleAction('start'); }
					}, _('Start')),
				' ',
				E('button', {
					'class': 'btn cbi-button',
					'click': function() { self.handleAction('update'); }
				}, _('Update')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': function() { self.handleAction('uninstall'); }
				}, _('Uninstall'))
			]),

			E('hr'),

			E('h4', {}, _('User Management')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('New User')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'new-user-jid',
						'class': 'cbi-input-text',
						'placeholder': 'user@' + hostname,
						'style': 'width: 200px;'
					}),
					' ',
					E('input', {
						'type': 'password',
						'id': 'new-user-password',
						'class': 'cbi-input-text',
						'placeholder': _('Password (auto-generate if empty)'),
						'style': 'width: 200px;'
					}),
					' ',
					E('button', {
						'class': 'btn cbi-button cbi-button-positive',
						'click': function() {
							var jid = document.getElementById('new-user-jid').value;
							var password = document.getElementById('new-user-password').value;
							self.handleAction('user_add', { jid: jid, password: password });
						}
					}, _('Add User'))
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Registered Users')),
				E('div', { 'class': 'cbi-value-field' }, [
					users.length > 0 ?
						E('table', { 'class': 'table', 'style': 'width: auto;' }, [
							E('tr', { 'class': 'tr table-titles' }, [
								E('th', { 'class': 'th' }, _('JID')),
								E('th', { 'class': 'th' }, _('Actions'))
							])
						].concat(users.map(function(user) {
							return E('tr', { 'class': 'tr' }, [
								E('td', { 'class': 'td' }, user),
								E('td', { 'class': 'td' }, [
									E('button', {
										'class': 'btn cbi-button cbi-button-remove',
										'click': function() { self.handleAction('user_del', user); }
									}, _('Delete'))
								])
							]);
						}))) :
						E('em', {}, _('No users registered'))
				])
			]),

			E('hr'),

			E('h4', {}, _('Emancipate (Public Exposure)')),
			E('p', {}, _('Make Jabber publicly accessible with SSL certificate, DNS records, and S2S federation.')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Domain')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'id': 'emancipate-domain',
						'class': 'cbi-input-text',
						'placeholder': 'xmpp.example.com',
						'value': domain
					})
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': function() {
						var domainInput = document.getElementById('emancipate-domain');
						self.handleAction('emancipate', domainInput.value);
					}
				}, _('Emancipate'))
			]),
			E('p', { 'style': 'font-size: 12px; color: #666;' }, [
				_('DNS records needed: A record for domain, SRV records for _xmpp-client._tcp and _xmpp-server._tcp')
			]),

			E('hr'),

			E('h4', {}, _('Connection Info')),
			E('div', { 'style': 'background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace;' }, [
				E('p', {}, [
					E('strong', {}, _('XMPP Server: ')),
					hostname + ':' + (status.c2s_port || '5222')
				]),
				E('p', {}, [
					E('strong', {}, _('BOSH URL: ')),
					accessUrl + '/http-bind'
				]),
				E('p', {}, [
					E('strong', {}, _('WebSocket: ')),
					(domain && haproxyConfigured ? 'wss://' + domain : 'ws://192.168.255.1:' + (status.http_port || '5280')) + '/xmpp-websocket'
				]),
				E('p', {}, [
					E('strong', {}, _('Admin JID: ')),
					(status.admin_user || 'admin') + '@' + hostname
				])
			]),

			E('hr'),

			E('h4', {}, _('Logs')),
			E('div', { 'id': 'jabber-logs' }, [
				E('pre', {
					'style': 'background:#1e1e1e;color:#d4d4d4;padding:10px;max-height:300px;overflow:auto;font-size:12px;border-radius:4px;'
				}, _('Loading logs...'))
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button',
					'click': function() {
						api.logs(100).then(function(res) {
							var logsEl = document.querySelector('#jabber-logs pre');
							if (logsEl) {
								logsEl.textContent = res.logs || _('No logs available');
							}
						});
					}
				}, _('Refresh Logs'))
			])
		]);
	},

	render: function(data) {
		var self = this;

		var content = E('div', { 'id': 'jabber-content' }, this.renderContent(data));

		// Load logs initially
		api.logs(50).then(function(res) {
			var logsEl = document.querySelector('#jabber-logs pre');
			if (logsEl) {
				logsEl.textContent = res.logs || _('No logs available');
			}
		});

		// Poll for status updates
		poll.add(function() {
			return api.status().then(function(status) {
				// Update status badge if needed
			});
		}, 10);

		return content;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
