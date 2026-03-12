'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require uci';
'require form';
'require jabber.api as api';
'require secubox/kiss-theme';

return view.extend({
	handleAction: function(action, args) {
		var self = this;

		ui.showModal('Processing...', [
			E('p', { 'class': 'spinning' }, 'Processing request...')
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
				if (!confirm('This will remove the Jabber container. User data will be preserved. Continue?'))
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
					ui.addNotification(null, E('p', 'Domain is required'), 'error');
					return;
				}
				promise = api.emancipate(domain);
				break;
			case 'user_add':
				var jid = args.jid;
				var password = args.password;
				if (!jid) {
					ui.hideModal();
					ui.addNotification(null, E('p', 'JID is required'), 'error');
					return;
				}
				promise = api.userAdd(jid, password);
				break;
			case 'user_del':
				if (!confirm('Delete user ' + args + '?'))
					return ui.hideModal();
				promise = api.userDel(args);
				break;
			case 'jingle_enable':
				var stunServer = args || 'stun.l.google.com:19302';
				promise = api.jingleEnable(stunServer);
				break;
			case 'jingle_disable':
				promise = api.jingleDisable();
				break;
			case 'sms_config':
				var sender = args;
				if (!sender) {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Sender name is required'), 'error');
					return;
				}
				promise = api.smsConfig(sender);
				break;
			case 'sms_send':
				if (!args.to || !args.message) {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Phone number and message are required'), 'error');
					return;
				}
				promise = api.smsSend(args.to, args.message);
				break;
			case 'voicemail_config':
				var notifyJid = args;
				if (!notifyJid) {
					ui.hideModal();
					ui.addNotification(null, E('p', 'Notification JID is required'), 'error');
					return;
				}
				promise = api.voicemailConfig(notifyJid);
				break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				var msg = res.message || 'Action completed';
				if (res.password) {
					msg += '\nPassword: ' + res.password;
				}
				ui.addNotification(null, E('p', { 'style': 'white-space: pre-wrap;' }, msg), 'success');
				self.load().then(function(data) {
					dom.content(document.querySelector('#jabber-content'), self.renderContent(data));
				});
			} else {
				ui.addNotification(null, E('p', res.error || 'Action failed'), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	load: function() {
		return Promise.all([
			api.status(),
			api.userList(),
			uci.load('jabber'),
			api.jingleStatus(),
			api.smsStatus(),
			api.voicemailStatus()
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/jabber/overview' },
			{ name: 'Users', path: 'admin/services/jabber/users' },
			{ name: 'Settings', path: 'admin/services/jabber/settings' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		var running = status.running === 'true';

		return [
			KissTheme.stat(running ? 'UP' : 'DOWN', 'Server', running ? c.green : c.red),
			KissTheme.stat(status.user_count || '0', 'Users', c.blue),
			KissTheme.stat(status.s2s_enabled === '1' ? 'ON' : 'OFF', 'Federation', status.s2s_enabled === '1' ? c.cyan : c.muted),
			KissTheme.stat(status.muc_enabled === '1' ? 'ON' : 'OFF', 'MUC', status.muc_enabled === '1' ? c.purple : c.muted)
		];
	},

	renderInstallWizard: function() {
		var self = this;

		return KissTheme.card('Install Jabber/XMPP', E('div', {}, [
			E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' }, 'Prosody is a modern XMPP server with end-to-end encryption support.'),
			E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 12px;' }, 'Features'),
				E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
					E('li', {}, 'Secure messaging with OMEMO encryption'),
					E('li', {}, 'Multi-user chat rooms (MUC)'),
					E('li', {}, 'File sharing with HTTP upload'),
					E('li', {}, 'Server-to-server federation'),
					E('li', {}, 'BOSH and WebSocket for web clients'),
					E('li', {}, 'Message archiving (MAM)')
				])
			]),
			E('div', { 'style': 'background: var(--kiss-bg2); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'font-weight: 600; margin-bottom: 8px;' }, 'Compatible Clients'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'Conversations, Monal, Gajim, Dino, Converse.js')
			]),
			E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'click': function() { self.handleAction('install'); }
			}, 'Install Jabber/XMPP')
		]));
	},

	renderHealth: function(status, jingleStatus, smsStatus, voicemailStatus) {
		var running = status.running === 'true';

		var checks = [
			{ label: 'Server', ok: running, value: running ? 'Running' : 'Stopped' },
			{ label: 'HAProxy', ok: status.haproxy === '1', value: status.haproxy === '1' ? 'Configured' : 'Not configured' },
			{ label: 'Jingle (VoIP)', ok: jingleStatus.enabled === '1', value: jingleStatus.enabled === '1' ? 'Enabled' : 'Disabled' },
			{ label: 'SMS Relay', ok: smsStatus.enabled === '1', value: smsStatus.enabled === '1' ? 'Enabled' : 'Disabled' },
			{ label: 'Voicemail', ok: voicemailStatus.enabled === '1', value: voicemailStatus.enabled === '1' ? 'Enabled' : 'Disabled' }
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
		var running = status.running === 'true';
		var haproxy = status.haproxy === '1';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				running ? E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleAction('stop'); }
				}, 'Stop') : E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAction('start'); }
				}, 'Start'),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleAction('update'); }
				}, 'Update'),
				!haproxy ? E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.handleAction('configure_haproxy'); }
				}, 'Configure HAProxy') : '',
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleAction('uninstall'); }
				}, 'Uninstall')
			]),
			E('div', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted); background: var(--kiss-bg2); padding: 12px; border-radius: 6px;' }, [
				E('div', {}, 'Hostname: ' + (status.hostname || 'jabber.local')),
				E('div', {}, 'C2S: ' + (status.c2s_port || '5222') + ' | S2S: ' + (status.s2s_port || '5269')),
				E('div', {}, 'HTTP/BOSH: ' + (status.http_port || '5280'))
			])
		]);
	},

	renderUsers: function(userListData, hostname) {
		var self = this;
		var users = [];
		if (userListData.users) {
			users = userListData.users.split(',').filter(function(u) { return u.length > 0; });
		}

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('input', {
					'type': 'text',
					'id': 'new-user-jid',
					'placeholder': 'user@' + hostname,
					'style': 'flex: 1; min-width: 150px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('input', {
					'type': 'password',
					'id': 'new-user-password',
					'placeholder': 'Password (auto)',
					'style': 'width: 150px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var jid = document.getElementById('new-user-jid').value;
						var password = document.getElementById('new-user-password').value;
						self.handleAction('user_add', { jid: jid, password: password });
					}
				}, 'Add')
			]),
			users.length > 0 ? E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, 'JID'),
					E('th', { 'style': 'width: 80px;' }, 'Action')
				])),
				E('tbody', {}, users.map(function(user) {
					return E('tr', {}, [
						E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-cyan);' }, user),
						E('td', {}, E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 11px;',
							'click': function() { self.handleAction('user_del', user); }
						}, 'Delete'))
					]);
				}))
			]) : E('div', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, 'No users registered')
		]);
	},

	renderEmancipate: function(status) {
		var self = this;
		var domain = status.domain || '';

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0;' }, 'Expose with SSL, DNS records, and S2S federation.'),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('input', {
					'type': 'text',
					'id': 'emancipate-domain',
					'placeholder': 'xmpp.example.com',
					'value': domain,
					'style': 'flex: 1; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var d = document.getElementById('emancipate-domain').value;
						self.handleAction('emancipate', d);
					}
				}, 'Emancipate')
			]),
			E('p', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin: 0;' }, 'DNS: A record + SRV for _xmpp-client._tcp and _xmpp-server._tcp')
		]);
	},

	renderContent: function(data) {
		var self = this;
		var status = data[0] || {};
		var userListData = data[1] || {};
		var jingleStatus = data[3] || {};
		var smsStatus = data[4] || {};
		var voicemailStatus = data[5] || {};
		var c = KissTheme.colors;

		if (status.container_state === 'not_installed') {
			return this.renderInstallWizard();
		}

		var hostname = status.hostname || 'jabber.local';

		return E('div', {}, [
			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom: 20px;' }, this.renderStats(status)),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('System Health', this.renderHealth(status, jingleStatus, smsStatus, voicemailStatus)),
				KissTheme.card('Controls', this.renderControls(status))
			]),

			// Users and Emancipate
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('User Management', this.renderUsers(userListData, hostname)),
				KissTheme.card('Public Exposure', this.renderEmancipate(status))
			])
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var running = status.running === 'true';

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Jabber/XMPP'),
					KissTheme.badge(running ? 'RUNNING' : (status.container_state === 'not_installed' ? 'NOT INSTALLED' : 'STOPPED'),
						running ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Prosody XMPP server with OMEMO encryption')
			]),

			// Navigation
			this.renderNav('overview'),

			// Content
			E('div', { 'id': 'jabber-content' }, this.renderContent(data))
		];

		poll.add(function() {
			return api.status().then(function(s) {
				// Status update
			});
		}, 10);

		return KissTheme.wrap(content, 'admin/services/jabber/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
