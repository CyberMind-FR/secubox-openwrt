'use strict';
'require view';
'require dom';
'require ui';
'require secubox-theme/theme as Theme';
'require system-hub/api as API';
'require system-hub/theme-assets as ThemeAssets';
'require system-hub/nav as HubNav';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	load: function() {
		return Promise.all([
			API.remoteStatus(),
			API.ttydStatus()
		]);
	},

	render: function(data) {
		var remote = data[0] || {};
		var ttyd = data[1] || {};
		this.remote = remote;
		this.ttyd = ttyd;

		var content = [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			HubNav.renderTabs('remote'),

			// rtty Remote Access Section
			E('div', { 'class': 'sh-card sh-remote-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🔗'), _('rtty - Remote Terminal') ]),
					E('div', { 'class': 'sh-card-badge', 'id': 'rtty-status-badge' }, remote.running ? _('Connected') : _('Disconnected'))
				]),
				E('div', { 'class': 'sh-card-body' }, [
					// Device ID
					E('div', { 'class': 'sh-remote-id' }, [
						E('div', { 'class': 'sh-remote-id-icon' }, '🆔'),
						E('div', {}, [
							E('div', { 'class': 'sh-remote-id-value', 'id': 'rtty-device-id' }, remote.id || _('Not configured')),
							E('div', { 'class': 'sh-remote-id-label' }, _('Device ID - Share this with support'))
						])
					]),

					// Configuration fields
					E('div', { 'class': 'sh-form-grid', 'style': 'margin-top: 16px;' }, [
						// Server Host
						E('div', { 'class': 'sh-form-group' }, [
							E('label', { 'class': 'sh-form-label' }, _('Server Host')),
							E('input', {
								'type': 'text',
								'class': 'sh-form-input',
								'id': 'rtty-host',
								'placeholder': 'rttys.example.com',
								'value': remote.host || ''
							})
						]),
						// Server Port
						E('div', { 'class': 'sh-form-group' }, [
							E('label', { 'class': 'sh-form-label' }, _('Server Port')),
							E('input', {
								'type': 'number',
								'class': 'sh-form-input',
								'id': 'rtty-port',
								'placeholder': '5912',
								'value': remote.port || 5912
							})
						]),
						// Token
						E('div', { 'class': 'sh-form-group' }, [
							E('label', { 'class': 'sh-form-label' }, _('Access Token')),
							E('input', {
								'type': 'password',
								'class': 'sh-form-input',
								'id': 'rtty-token',
								'placeholder': _('Optional authentication token'),
								'value': remote.token || ''
							})
						]),
						// Device Description
						E('div', { 'class': 'sh-form-group' }, [
							E('label', { 'class': 'sh-form-label' }, _('Description')),
							E('input', {
								'type': 'text',
								'class': 'sh-form-input',
								'id': 'rtty-description',
								'placeholder': _('Device description'),
								'value': remote.description || ''
							})
						])
					]),

					// SSL Toggle
					this.renderToggle('🔒', _('Use SSL/TLS'), _('Encrypt connection to relay server'), remote.ssl, 'rtty-ssl'),

					// Status
					!remote.installed ? E('div', { 'style': 'padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 10px; border-left: 3px solid #f59e0b; margin-top: 16px;' }, [
						E('span', { 'style': 'font-size: 20px; margin-right: 12px;' }, '⚠️'),
						E('span', {}, _('rtty is not installed.')),
						E('a', { 'href': '#', 'style': 'color: #6366f1; margin-left: 8px;', 'click': L.bind(this.installRtty, this) }, _('Install now'))
					]) : E('div', { 'style': 'padding: 10px; background: rgba(34,197,94,0.12); border-radius: 10px; margin-top: 16px;' }, [
						E('span', { 'style': 'font-size: 20px; margin-right: 12px;' }, remote.running ? '🟢' : '🟠'),
						E('span', {}, remote.running ? _('Connected to relay server') : _('Installed but not connected'))
					]),

					// Actions
					E('div', { 'class': 'sh-btn-group', 'style': 'margin-top: 16px;' }, [
						E('button', {
							'class': 'sh-btn sh-btn-primary',
							'id': 'rtty-save-btn',
							'click': L.bind(this.saveRttySettings, this)
						}, [ '💾 ', _('Save Settings') ]),
						E('button', {
							'class': 'sh-btn',
							'id': 'rtty-toggle-btn',
							'click': L.bind(this.toggleRttyService, this)
						}, [ remote.running ? '⏹️ ' + _('Disconnect') : '▶️ ' + _('Connect') ]),
						E('button', {
							'class': 'sh-btn',
							'click': L.bind(this.showCredentials, this)
						}, [ '🔑 ', _('Show Credentials') ])
					])
				])
			]),

			// SSH Section
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🔐'), _('SSH Access') ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-sysinfo-grid' }, [
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Status')),
							E('span', { 'class': 'sh-sysinfo-value', 'style': 'color: #22c55e;' }, _('Active'))
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Port')),
							E('span', { 'class': 'sh-sysinfo-value' }, '22')
						])
					]),
					E('div', { 'style': 'margin-top: 16px; padding: 14px; background: #0a0a0f; border-radius: 8px; font-family: monospace; font-size: 12px; color: #a0a0b0;' }, [
						'ssh root@', E('span', { 'style': 'color: #6366f1;' }, window.location.hostname)
					])
				])
			]),

			// Web Console (ttyd) Section
			E('div', { 'class': 'sh-card sh-webconsole-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '💻'), _('Web Console') ]),
					E('div', { 'class': 'sh-card-badge', 'id': 'ttyd-status-badge' }, ttyd.running ? _('Running') : _('Stopped'))
				]),
				E('div', { 'class': 'sh-card-body' }, [
					// Status info
					E('div', { 'class': 'sh-sysinfo-grid' }, [
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Status')),
							E('span', { 'class': 'sh-sysinfo-value', 'id': 'ttyd-status-text', 'style': ttyd.running ? 'color: #22c55e;' : 'color: #f59e0b;' },
								ttyd.installed ? (ttyd.running ? _('Running') : _('Stopped')) : _('Not Installed'))
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Port')),
							E('span', { 'class': 'sh-sysinfo-value' }, ttyd.port || 7681)
						])
					]),

					// Install warning or console iframe
					!ttyd.installed ? E('div', { 'style': 'padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 10px; border-left: 3px solid #f59e0b; margin-top: 16px;' }, [
						E('span', { 'style': 'font-size: 20px; margin-right: 12px;' }, '⚠️'),
						E('span', {}, _('Web Console (ttyd) is not installed.')),
						E('a', { 'href': '#', 'style': 'color: #6366f1; margin-left: 8px;', 'click': L.bind(this.installTtyd, this) }, _('Install now'))
					]) : (ttyd.running ?
						// Console iframe when running
						E('div', { 'id': 'ttyd-console-container', 'style': 'margin-top: 16px; border-radius: 8px; overflow: hidden; background: #0a0a0f; border: 1px solid rgba(255,255,255,0.1);' }, [
							E('iframe', {
								'id': 'ttyd-iframe',
								'src': 'http://' + window.location.hostname + ':' + (ttyd.port || 7681),
								'style': 'width: 100%; height: 400px; border: none; background: #0a0a0f;',
								'title': 'Web Console'
							})
						]) :
						// Start prompt when stopped
						E('div', { 'style': 'padding: 20px; background: rgba(99, 102, 241, 0.1); border-radius: 10px; margin-top: 16px; text-align: center;' }, [
							E('span', { 'style': 'font-size: 40px; display: block; margin-bottom: 12px;' }, '💻'),
							E('p', { 'style': 'margin: 0 0 16px 0; color: #a0a0b0;' }, _('Web Console is ready. Click Start to open the terminal.')),
							E('button', {
								'class': 'sh-btn sh-btn-primary',
								'click': L.bind(this.startTtyd, this)
							}, [ '▶️ ', _('Start Console') ])
						])
					),

					// Actions
					ttyd.installed ? E('div', { 'class': 'sh-btn-group', 'style': 'margin-top: 16px;' }, [
						E('button', {
							'class': 'sh-btn sh-btn-primary',
							'id': 'ttyd-toggle-btn',
							'click': L.bind(this.toggleTtyd, this)
						}, [ ttyd.running ? '⏹️ ' + _('Stop') : '▶️ ' + _('Start') ]),
						ttyd.running ? E('button', {
							'class': 'sh-btn',
							'click': L.bind(this.openTtydFullscreen, this)
						}, [ '🔲 ', _('Fullscreen') ]) : '',
						E('button', {
							'class': 'sh-btn',
							'click': L.bind(this.refreshTtydStatus, this)
						}, [ '🔄 ', _('Refresh') ])
					]) : ''
				])
			]),

			// Support Contact (static)
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📞'), _('Contact Support') ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-sysinfo-grid' }, [
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Provider')),
							E('span', { 'class': 'sh-sysinfo-value' }, 'CyberMind.fr')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Email')),
							E('span', { 'class': 'sh-sysinfo-value' }, 'support@cybermind.fr')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Phone')),
							E('span', { 'class': 'sh-sysinfo-value' }, '+33 1 23 45 67 89')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, _('Website')),
							E('span', { 'class': 'sh-sysinfo-value' }, 'https://cybermind.fr')
						])
					])
				])
			])
		];

		return KissTheme.wrap(content, 'admin/system/hub/remote');
	},

	renderToggle: function(icon, label, desc, enabled, id) {
		return E('div', { 'class': 'sh-toggle', 'style': 'margin-top: 16px;' }, [
			E('div', { 'class': 'sh-toggle-info' }, [
				E('span', { 'class': 'sh-toggle-icon' }, icon),
				E('div', {}, [
					E('div', { 'class': 'sh-toggle-label' }, label),
					E('div', { 'class': 'sh-toggle-desc' }, desc)
				])
			]),
			E('div', {
				'class': 'sh-toggle-switch' + (enabled ? ' active' : ''),
				'id': id,
				'click': function(ev) {
					ev.target.classList.toggle('active');
				}
			})
		]);
	},

	showCredentials: function() {
		ui.showModal(_('rtty Credentials'), [
			E('p', {}, _('Retrieving credentials...')),
			E('div', { 'class': 'spinning' })
		]);
		API.remoteCredentials().then(L.bind(function(result) {
			ui.hideModal();
			ui.showModal(_('rtty Credentials'), [
				E('div', { 'style': 'font-size:16px; margin-bottom:12px;' }, [
					E('strong', {}, _('Device ID:')), ' ', (result.id || _('Not configured'))
				]),
				E('div', { 'style': 'font-size:16px; margin-bottom:12px;' }, [
					E('strong', {}, _('Token:')), ' ', (result.token || _('No token set'))
				]),
				E('p', { 'style': 'color: #a0a0b0; font-size: 13px; margin-top: 16px;' },
					_('Share the Device ID with support to allow remote access via the rtty relay server.')),
				E('div', { 'class': 'sh-btn-group', 'style': 'margin-top:16px;' }, [
					E('button', { 'class': 'sh-btn sh-btn-primary', 'click': ui.hideModal }, _('Close'))
				])
			]);
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	toggleRttyService: function() {
		if (!this.remote || !this.remote.installed) return;
		var action = this.remote.running ? 'stop' : 'start';

		ui.showModal(action === 'start' ? _('Connecting...') : _('Disconnecting...'), [
			E('p', {}, action === 'start' ? _('Connecting to relay server...') : _('Stopping rtty service...')),
			E('div', { 'class': 'spinning' })
		]);

		API.remoteServiceAction(action).then(L.bind(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', {}, '✅ ' + (res.message || action)), 'info');
				this.reload();
			} else {
				ui.addNotification(null, E('p', {}, res.error || _('Action failed')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	saveRttySettings: function() {
		var host = document.getElementById('rtty-host').value;
		var port = parseInt(document.getElementById('rtty-port').value) || 5912;
		var token = document.getElementById('rtty-token').value;
		var description = document.getElementById('rtty-description').value;
		var ssl = document.getElementById('rtty-ssl').classList.contains('active') ? 1 : 0;

		if (!host) {
			ui.addNotification(null, E('p', {}, _('Server host is required')), 'error');
			return;
		}

		ui.showModal(_('Saving Settings'), [
			E('p', {}, _('Saving rtty configuration...')),
			E('div', { 'class': 'spinning' })
		]);

		API.remoteSaveSettings({
			host: host,
			port: port,
			token: token,
			description: description,
			ssl: ssl
		}).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, _('Settings saved successfully')), 'info');
				this.reload();
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Failed to save settings')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	installRtty: function(ev) {
		ev.preventDefault();
		ui.showModal(_('Installing rtty'), [
			E('p', {}, _('Installing rtty-openssl package...')),
			E('div', { 'class': 'spinning' })
		]);
		API.remoteInstall().then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Installed successfully')), 'info');
				this.reload();
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Installation failed')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	reload: function() {
		this.load().then(L.bind(function(data) {
			var node = this.render(data);
			var root = document.querySelector('.system-hub-dashboard');
			if (root && root.parentNode) {
				root.parentNode.replaceChild(node, root);
			}
		}, this));
	},

	// TTYD Web Console methods
	installTtyd: function(ev) {
		ev.preventDefault();
		ui.showModal(_('Installing Web Console'), [
			E('p', {}, _('Installing ttyd...')),
			E('div', { 'class': 'spinning' })
		]);
		API.ttydInstall().then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, _('Web Console installed successfully')), 'info');
				this.reload();
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Installation failed')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	startTtyd: function() {
		ui.showModal(_('Starting Web Console'), [
			E('p', {}, _('Starting ttyd service...')),
			E('div', { 'class': 'spinning' })
		]);
		API.ttydStart().then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, _('Web Console started on port ') + result.port), 'info');
				this.reload();
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Failed to start')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	stopTtyd: function() {
		API.ttydStop().then(L.bind(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, _('Web Console stopped')), 'info');
				this.reload();
			} else {
				ui.addNotification(null, E('p', {}, result.error || _('Failed to stop')), 'error');
			}
		}, this));
	},

	toggleTtyd: function() {
		if (this.ttyd && this.ttyd.running) {
			this.stopTtyd();
		} else {
			this.startTtyd();
		}
	},

	openTtydFullscreen: function() {
		var port = (this.ttyd && this.ttyd.port) || 7681;
		window.open('http://' + window.location.hostname + ':' + port, '_blank');
	},

	refreshTtydStatus: function() {
		API.ttydStatus().then(L.bind(function(status) {
			this.ttyd = status;
			var badge = document.getElementById('ttyd-status-badge');
			var text = document.getElementById('ttyd-status-text');
			var btn = document.getElementById('ttyd-toggle-btn');

			if (badge) badge.textContent = status.running ? _('Running') : _('Stopped');
			if (text) {
				text.textContent = status.installed ? (status.running ? _('Running') : _('Stopped')) : _('Not Installed');
				text.style.color = status.running ? '#22c55e' : '#f59e0b';
			}
			if (btn) btn.innerHTML = status.running ? '⏹️ ' + _('Stop') : '▶️ ' + _('Start');

			// Reload to update iframe visibility
			if (status.running !== this.ttyd.running) {
				this.reload();
			}
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
