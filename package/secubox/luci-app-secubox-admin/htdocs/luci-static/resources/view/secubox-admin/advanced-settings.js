'use strict';
'require view';
'require ui';
'require fs';
'require uci';
'require rpc';
'require form';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme as KissTheme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var ADMIN_NAV = [
	{ id: 'dashboard', icon: '🎛️', label: 'Control Panel' },
	{ id: 'cyber-dashboard', icon: '🔮', label: 'Cyber Console' },
	{ id: 'apps', icon: '📦', label: 'Apps Manager' },
	{ id: 'updates', icon: '🔄', label: 'Updates' },
	{ id: 'catalog-sources', icon: '📚', label: 'Catalog' },
	{ id: 'health', icon: '💚', label: 'Health' },
	{ id: 'logs', icon: '📋', label: 'Logs' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' },
	{ id: 'advanced', icon: '🔧', label: 'Advanced' }
];

function renderAdminNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, ADMIN_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'admin', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

var callGetWanAccess = rpc.declare({
	object: 'luci.secubox',
	method: 'get_wan_access',
	expect: { }
});

var callSetWanAccess = rpc.declare({
	object: 'luci.secubox',
	method: 'set_wan_access',
	params: ['enabled', 'https_enabled', 'https_port', 'http_enabled', 'http_port', 'ssh_enabled', 'ssh_port'],
	expect: { success: false }
});

var callApplyWanAccess = rpc.declare({
	object: 'luci.secubox',
	method: 'apply_wan_access',
	expect: { success: false }
});

var callGetConfigFiles = rpc.declare({
	object: 'file',
	method: 'list',
	params: ['path'],
	expect: { entries: [] }
});

var callReadFile = rpc.declare({
	object: 'file',
	method: 'read',
	params: ['path'],
	expect: { data: '' }
});

var callWriteFile = rpc.declare({
	object: 'file',
	method: 'write',
	params: ['path', 'data'],
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(uci.load('secubox'), {}),
			L.resolveDefault(uci.load('secubox-appstore'), {}),
			L.resolveDefault(uci.load('network'), {}),
			L.resolveDefault(uci.load('firewall'), {}),
			L.resolveDefault(uci.load('dhcp'), {}),
			L.resolveDefault(callGetWanAccess(), {})
		]);
	},

	render: function(data) {
		var self = this;
		var wanAccess = data[5] || {};

		var container = E('div', { 'class': 'cyberpunk-mode' }, [
			E('link', { 'rel': 'stylesheet', 'type': 'text/css',
				'href': L.resource('secubox-admin/cyberpunk.css') + '?v=' + Date.now() }),

			// Header
			E('div', { 'class': 'cyber-header cyber-scanlines' }, [
				E('div', { 'class': 'cyber-header-title cyber-text-glow' }, '⚙️ ADVANCED SETTINGS'),
				E('div', { 'class': 'cyber-header-subtitle' }, 'System Configuration Editor • Use with Caution')
			]),

			// Main content
			E('div', { 'class': 'cyber-dual-console' }, [
				// Left: Quick Config Sections
				E('div', { 'class': 'cyber-console-left' }, [
					this.renderWanAccessPanel(wanAccess),
					this.renderQuickConfigPanel(),
					this.renderSystemSubsetsPanel(),
					this.renderConfigFilesPanel()
				]),

				// Right: Editor
				E('div', { 'class': 'cyber-console-right' }, [
					this.renderConfigEditorPanel(),
					this.renderJSONEditorPanel(),
					this.renderDangerZonePanel()
				])
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderAdminNav('advanced'));
		wrapper.appendChild(container);
		return KissTheme.wrap([wrapper], 'admin/secubox/admin/advanced-settings');
	},

	renderWanAccessPanel: function(wanAccess) {
		var self = this;
		var enabled = wanAccess.enabled || false;
		var services = wanAccess.services || {};

		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '🌐 WAN ACCESS'),
				E('span', {
					'class': 'cyber-panel-badge ' + (enabled ? 'success' : 'warning'),
					'id': 'wan-access-status'
				}, enabled ? 'ENABLED' : 'DISABLED')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				// Master toggle
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--cyber-primary); margin-bottom: 15px;' }, [
					E('div', {}, [
						E('div', { 'style': 'font-weight: bold; font-size: 13px;' }, 'Remote Access'),
						E('div', { 'style': 'font-size: 10px; color: var(--cyber-text-dim);' }, 'Allow access from WAN/Internet')
					]),
					E('label', { 'class': 'cyber-switch' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'wan-access-master',
							'checked': enabled,
							'change': function(ev) {
								var masterEnabled = ev.target.checked;
								document.getElementById('wan-access-status').textContent = masterEnabled ? 'ENABLED' : 'DISABLED';
								document.getElementById('wan-access-status').className = 'cyber-panel-badge ' + (masterEnabled ? 'success' : 'warning');
							}
						}),
						E('span', { 'class': 'cyber-slider' })
					])
				]),

				// Service toggles
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 10px;' }, [
					// HTTPS
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,255,255,0.05); border-radius: 4px;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('span', { 'style': 'font-size: 16px;' }, '🔒'),
							E('div', {}, [
								E('div', { 'style': 'font-size: 12px; font-weight: bold;' }, 'HTTPS (LuCI)'),
								E('div', { 'style': 'font-size: 10px; color: var(--cyber-text-dim);' }, 'Secure web interface')
							])
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('input', {
								'type': 'number',
								'id': 'wan-https-port',
								'value': (services.https && services.https.port) || 443,
								'style': 'width: 70px; padding: 5px; background: rgba(0,0,0,0.3); border: 1px solid var(--cyber-border); color: var(--cyber-text); text-align: center;'
							}),
							E('label', { 'class': 'cyber-switch' }, [
								E('input', {
									'type': 'checkbox',
									'id': 'wan-https-enabled',
									'checked': services.https && services.https.enabled
								}),
								E('span', { 'class': 'cyber-slider' })
							])
						])
					]),

					// HTTP
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,165,0,0.05); border-radius: 4px;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('span', { 'style': 'font-size: 16px;' }, '🌐'),
							E('div', {}, [
								E('div', { 'style': 'font-size: 12px; font-weight: bold;' }, 'HTTP'),
								E('div', { 'style': 'font-size: 10px; color: var(--cyber-warning);' }, 'Not recommended')
							])
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('input', {
								'type': 'number',
								'id': 'wan-http-port',
								'value': (services.http && services.http.port) || 80,
								'style': 'width: 70px; padding: 5px; background: rgba(0,0,0,0.3); border: 1px solid var(--cyber-border); color: var(--cyber-text); text-align: center;'
							}),
							E('label', { 'class': 'cyber-switch' }, [
								E('input', {
									'type': 'checkbox',
									'id': 'wan-http-enabled',
									'checked': services.http && services.http.enabled
								}),
								E('span', { 'class': 'cyber-slider' })
							])
						])
					]),

					// SSH
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,0,0,0.05); border-radius: 4px;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('span', { 'style': 'font-size: 16px;' }, '🖥️'),
							E('div', {}, [
								E('div', { 'style': 'font-size: 12px; font-weight: bold;' }, 'SSH'),
								E('div', { 'style': 'font-size: 10px; color: var(--cyber-danger);' }, 'Use with caution')
							])
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('input', {
								'type': 'number',
								'id': 'wan-ssh-port',
								'value': (services.ssh && services.ssh.port) || 22,
								'style': 'width: 70px; padding: 5px; background: rgba(0,0,0,0.3); border: 1px solid var(--cyber-border); color: var(--cyber-text); text-align: center;'
							}),
							E('label', { 'class': 'cyber-switch' }, [
								E('input', {
									'type': 'checkbox',
									'id': 'wan-ssh-enabled',
									'checked': services.ssh && services.ssh.enabled
								}),
								E('span', { 'class': 'cyber-slider' })
							])
						])
					])
				]),

				// Apply button
				E('div', { 'style': 'margin-top: 15px;' }, [
					E('button', {
						'class': 'cyber-btn primary',
						'style': 'width: 100%;',
						'click': function() {
							var masterEnabled = document.getElementById('wan-access-master').checked;
							var httpsEnabled = document.getElementById('wan-https-enabled').checked;
							var httpsPort = parseInt(document.getElementById('wan-https-port').value) || 443;
							var httpEnabled = document.getElementById('wan-http-enabled').checked;
							var httpPort = parseInt(document.getElementById('wan-http-port').value) || 80;
							var sshEnabled = document.getElementById('wan-ssh-enabled').checked;
							var sshPort = parseInt(document.getElementById('wan-ssh-port').value) || 22;

							ui.showModal(_('Applying'), [
								E('p', { 'class': 'spinning' }, _('Updating firewall rules...'))
							]);

							callSetWanAccess(
								masterEnabled ? 1 : 0,
								httpsEnabled ? 1 : 0,
								httpsPort,
								httpEnabled ? 1 : 0,
								httpPort,
								sshEnabled ? 1 : 0,
								sshPort
							).then(function() {
								return callApplyWanAccess();
							}).then(function(result) {
								ui.hideModal();
								if (result.success) {
									ui.addNotification(null, E('p', 'WAN access rules applied successfully'), 'success');
								} else {
									ui.addNotification(null, E('p', 'Failed to apply rules'), 'error');
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', 'Error: ' + err), 'error');
							});
						}
					}, '🔄 Apply Firewall Rules')
				])
			])
		]);
	},

	renderQuickConfigPanel: function() {
		var self = this;

		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '⚡ QUICK CONFIG')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-quick-actions' }, [
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							self.loadConfig('secubox-appstore');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '📦'),
						E('span', { 'class': 'cyber-action-label' }, 'AppStore Config'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							self.loadConfig('network');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '🌐'),
						E('span', { 'class': 'cyber-action-label' }, 'Network Config'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							self.loadConfig('firewall');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '🔥'),
						E('span', { 'class': 'cyber-action-label' }, 'Firewall Config'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							self.loadConfig('dhcp');
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '📡'),
						E('span', { 'class': 'cyber-action-label' }, 'DHCP Config'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					]),
					E('button', {
						'class': 'cyber-action-btn',
						'click': function() {
							self.loadCatalogJSON();
						}
					}, [
						E('span', { 'class': 'cyber-action-icon' }, '📋'),
						E('span', { 'class': 'cyber-action-label' }, 'Catalog JSON'),
						E('span', { 'class': 'cyber-action-arrow' }, '▸')
					])
				])
			])
		]);
	},

	renderSystemSubsetsPanel: function() {
		var subsets = [
			{ icon: '🔐', name: 'Authentication', status: 'active', count: 3 },
			{ icon: '🌐', name: 'Network', status: 'active', count: 12 },
			{ icon: '🛡️', name: 'Security', status: 'active', count: 8 },
			{ icon: '📊', name: 'Monitoring', status: 'active', count: 5 },
			{ icon: '🎮', name: 'Applications', status: 'active', count: 37 },
			{ icon: '💾', name: 'Storage', status: 'active', count: 4 },
			{ icon: '⚙️', name: 'System', status: 'active', count: 15 }
		];

		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '🎯 SYSTEM SUBSETS')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
					subsets.map(function(subset) {
						return E('div', {
							'style': 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,255,65,0.05); border-left: 2px solid var(--cyber-primary); cursor: pointer;',
							'click': function() {
								ui.addNotification(null, E('p', 'Loading ' + subset.name + ' configuration...'), 'info');
							}
						}, [
							E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
								E('span', { 'style': 'font-size: 18px;' }, subset.icon),
								E('span', { 'style': 'font-size: 12px; font-weight: bold; text-transform: uppercase;' }, subset.name)
							]),
							E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
								E('span', { 'class': 'cyber-badge success', 'style': 'font-size: 9px;' }, subset.count),
								E('span', { 'class': 'cyber-status-dot online' })
							])
						]);
					})
				)
			])
		]);
	},

	renderConfigFilesPanel: function() {
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '📁 CONFIG FILES')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'style': 'font-size: 11px; color: var(--cyber-text-dim);' }, [
					E('div', { 'style': 'padding: 5px 0;' }, '→ /etc/config/secubox'),
					E('div', { 'style': 'padding: 5px 0;' }, '→ /etc/config/secubox-appstore'),
					E('div', { 'style': 'padding: 5px 0;' }, '→ /etc/config/network'),
					E('div', { 'style': 'padding: 5px 0;' }, '→ /etc/config/firewall'),
					E('div', { 'style': 'padding: 5px 0;' }, '→ /etc/config/dhcp'),
					E('div', { 'style': 'padding: 5px 0;' }, '→ /usr/share/secubox/catalog.json')
				])
			])
		]);
	},

	renderConfigEditorPanel: function() {
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '✏️ UCI CONFIG EDITOR'),
				E('span', { 'class': 'cyber-panel-badge' }, 'LIVE')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'style': 'margin-bottom: 15px;' }, [
					E('label', {
						'style': 'display: block; font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;'
					}, 'Configuration File:'),
					E('select', {
						'id': 'config-file-selector',
						'class': 'cyber-btn',
						'style': 'width: 100%; padding: 10px; background: rgba(0,255,65,0.1); border: 1px solid var(--cyber-border); color: var(--cyber-text);',
						'change': function(ev) {
							var file = ev.target.value;
							document.querySelector('#current-config-name').textContent = file;
						}
					}, [
						E('option', { value: 'secubox-appstore' }, 'secubox-appstore'),
						E('option', { value: 'network' }, 'network'),
						E('option', { value: 'firewall' }, 'firewall'),
						E('option', { value: 'dhcp' }, 'dhcp'),
						E('option', { value: 'system' }, 'system')
					])
				]),
				E('div', { 'style': 'margin-bottom: 10px;' }, [
					E('span', {
						'style': 'font-size: 10px; color: var(--cyber-primary); text-transform: uppercase; letter-spacing: 1px;'
					}, '→ /etc/config/'),
					E('span', {
						'id': 'current-config-name',
						'style': 'font-size: 10px; color: var(--cyber-accent); font-weight: bold;'
					}, 'secubox-appstore')
				]),
				E('textarea', {
					'id': 'uci-editor',
					'style': 'width: 100%; height: 300px; background: rgba(0,0,0,0.5); border: 1px solid var(--cyber-border); color: var(--cyber-primary); font-family: monospace; font-size: 12px; padding: 10px; resize: vertical;',
					'placeholder': 'UCI configuration will appear here...'
				}),
				E('div', { 'style': 'display: flex; gap: 10px; margin-top: 10px;' }, [
					E('button', {
						'class': 'cyber-btn primary',
						'click': function() {
							var selector = document.getElementById('config-file-selector');
							var editor = document.getElementById('uci-editor');
							var file = selector.value;

							ui.showModal(_('Loading'), [
								E('p', { 'class': 'spinning' }, _('Reading configuration...'))
							]);

							fs.read('/etc/config/' + file).then(function(content) {
								editor.value = content || '';
								ui.hideModal();
								ui.addNotification(null, E('p', 'Configuration loaded: ' + file), 'success');
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
							});
						}
					}, '📂 Load'),
					E('button', {
						'class': 'cyber-btn',
						'style': 'background: rgba(0,255,255,0.1); border-color: var(--cyber-accent);',
						'click': function() {
							var selector = document.getElementById('config-file-selector');
							var editor = document.getElementById('uci-editor');
							var file = selector.value;
							var content = editor.value;

							if (!content) {
								ui.addNotification(null, E('p', 'Editor is empty!'), 'warning');
								return;
							}

							ui.showModal(_('Saving'), [
								E('p', {}, 'Save configuration to /etc/config/' + file + '?'),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, 'Cancel'),
									E('button', {
										'class': 'btn cbi-button-positive',
										'click': function() {
											ui.hideModal();
											ui.showModal(_('Saving'), [
												E('p', { 'class': 'spinning' }, _('Writing configuration...'))
											]);

											fs.write('/etc/config/' + file, content).then(function() {
												ui.hideModal();
												ui.addNotification(null, E('p', 'Configuration saved: ' + file), 'success');
											}).catch(function(err) {
												ui.hideModal();
												ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
											});
										}
									}, 'Save')
								])
							]);
						}
					}, '💾 Save'),
					E('button', {
						'class': 'cyber-btn danger',
						'click': function() {
							document.getElementById('uci-editor').value = '';
						}
					}, '🗑️ Clear')
				])
			])
		]);
	},

	renderJSONEditorPanel: function() {
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '📋 JSON EDITOR'),
				E('span', { 'class': 'cyber-panel-badge' }, 'ADVANCED')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'style': 'margin-bottom: 15px;' }, [
					E('label', {
						'style': 'display: block; font-size: 11px; color: var(--cyber-text-dim); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;'
					}, 'JSON File:'),
					E('input', {
						'id': 'json-file-path',
						'type': 'text',
						'value': '/usr/share/secubox/catalog.json',
						'style': 'width: 100%; padding: 10px; background: rgba(0,255,65,0.1); border: 1px solid var(--cyber-border); color: var(--cyber-text); font-family: monospace;'
					})
				]),
				E('textarea', {
					'id': 'json-editor',
					'style': 'width: 100%; height: 250px; background: rgba(0,0,0,0.5); border: 1px solid var(--cyber-accent); color: var(--cyber-accent); font-family: monospace; font-size: 11px; padding: 10px; resize: vertical;',
					'placeholder': 'JSON content will appear here...'
				}),
				E('div', { 'style': 'display: flex; gap: 10px; margin-top: 10px;' }, [
					E('button', {
						'class': 'cyber-btn primary',
						'click': function() {
							var pathInput = document.getElementById('json-file-path');
							var editor = document.getElementById('json-editor');
							var path = pathInput.value;

							ui.showModal(_('Loading'), [
								E('p', { 'class': 'spinning' }, _('Reading JSON file...'))
							]);

							fs.read(path).then(function(content) {
								try {
									var json = JSON.parse(content);
									editor.value = JSON.stringify(json, null, 2);
									ui.hideModal();
									ui.addNotification(null, E('p', 'JSON loaded successfully'), 'success');
								} catch (e) {
									editor.value = content;
									ui.hideModal();
									ui.addNotification(null, E('p', 'Warning: Invalid JSON format'), 'warning');
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
							});
						}
					}, '📂 Load JSON'),
					E('button', {
						'class': 'cyber-btn',
						'style': 'background: rgba(0,255,255,0.1); border-color: var(--cyber-accent);',
						'click': function() {
							var editor = document.getElementById('json-editor');
							try {
								var json = JSON.parse(editor.value);
								editor.value = JSON.stringify(json, null, 2);
								ui.addNotification(null, E('p', 'JSON formatted successfully'), 'success');
							} catch (e) {
								ui.addNotification(null, E('p', 'Invalid JSON: ' + e.message), 'error');
							}
						}
					}, '✨ Format'),
					E('button', {
						'class': 'cyber-btn',
						'click': function() {
							var editor = document.getElementById('json-editor');
							try {
								var json = JSON.parse(editor.value);
								ui.addNotification(null, E('p', 'JSON is valid!'), 'success');
							} catch (e) {
								ui.addNotification(null, E('p', 'Invalid JSON: ' + e.message), 'error');
							}
						}
					}, '✓ Validate')
				])
			])
		]);
	},

	renderDangerZonePanel: function() {
		return E('div', { 'class': 'cyber-panel cyber-scanlines' }, [
			E('div', { 'class': 'cyber-panel-header' }, [
				E('div', { 'class': 'cyber-panel-title' }, '⚠️ DANGER ZONE')
			]),
			E('div', { 'class': 'cyber-panel-body' }, [
				E('div', { 'class': 'cyber-list' }, [
					E('div', { 'class': 'cyber-list-item' }, [
						E('div', { 'class': 'cyber-list-icon' }, '🔄'),
						E('div', { 'class': 'cyber-list-content' }, [
							E('div', { 'class': 'cyber-list-title' }, [
								'Reload UCI Configuration',
								E('span', { 'class': 'cyber-badge info' }, 'SAFE')
							]),
							E('div', { 'style': 'font-size: 10px; color: var(--cyber-text-dim); margin-top: 5px;' },
								'Reload UCI config from disk without rebooting')
						]),
						E('button', {
							'class': 'cyber-btn primary',
							'click': function() {
								ui.showModal(_('Reloading'), [
									E('p', { 'class': 'spinning' }, _('Reloading UCI configuration...'))
								]);
								fs.exec('/sbin/uci', ['reload']).then(function() {
									ui.hideModal();
									ui.addNotification(null, E('p', 'UCI configuration reloaded'), 'success');
								}).catch(function(err) {
									ui.hideModal();
									ui.addNotification(null, E('p', 'Error: ' + err), 'error');
								});
							}
						}, 'Reload')
					]),
					E('div', { 'class': 'cyber-list-item' }, [
						E('div', { 'class': 'cyber-list-icon' }, '🔃'),
						E('div', { 'class': 'cyber-list-content' }, [
							E('div', { 'class': 'cyber-list-title' }, [
								'Restart Services',
								E('span', { 'class': 'cyber-badge warning' }, 'CAUTION')
							]),
							E('div', { 'style': 'font-size: 10px; color: var(--cyber-text-dim); margin-top: 5px;' },
								'Restart network, firewall, and DHCP services')
						]),
						E('button', {
							'class': 'cyber-btn',
							'style': 'border-color: var(--cyber-warning);',
							'click': function() {
								ui.showModal(_('Confirm'), [
									E('p', {}, 'Restart network services? This may disconnect you.'),
									E('div', { 'class': 'right' }, [
										E('button', { 'class': 'btn', 'click': ui.hideModal }, 'Cancel'),
										E('button', {
											'class': 'btn cbi-button-negative',
											'click': function() {
												ui.hideModal();
												ui.addNotification(null, E('p', 'Restarting services...'), 'info');
												fs.exec('/etc/init.d/network', ['restart']);
											}
										}, 'Restart')
									])
								]);
							}
						}, 'Restart')
					]),
					E('div', { 'class': 'cyber-list-item' }, [
						E('div', { 'class': 'cyber-list-icon' }, '💾'),
						E('div', { 'class': 'cyber-list-content' }, [
							E('div', { 'class': 'cyber-list-title' }, [
								'Backup Configuration',
								E('span', { 'class': 'cyber-badge success' }, 'SAFE')
							]),
							E('div', { 'style': 'font-size: 10px; color: var(--cyber-text-dim); margin-top: 5px;' },
								'Download complete system configuration backup')
						]),
						E('button', {
							'class': 'cyber-btn primary',
							'click': function() {
								window.location = L.url('admin/system/flash/backup');
							}
						}, 'Backup')
					])
				])
			])
		]);
	},

	loadConfig: function(configName) {
		var editor = document.getElementById('uci-editor');
		var selector = document.getElementById('config-file-selector');

		if (selector) {
			selector.value = configName;
			document.querySelector('#current-config-name').textContent = configName;
		}

		ui.showModal(_('Loading'), [
			E('p', { 'class': 'spinning' }, _('Reading configuration...'))
		]);

		fs.read('/etc/config/' + configName).then(function(content) {
			if (editor) editor.value = content || '';
			ui.hideModal();
			ui.addNotification(null, E('p', 'Configuration loaded: ' + configName), 'success');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	loadCatalogJSON: function() {
		var pathInput = document.getElementById('json-file-path');
		var editor = document.getElementById('json-editor');

		if (pathInput) {
			pathInput.value = '/usr/share/secubox/catalog.json';
		}

		ui.showModal(_('Loading'), [
			E('p', { 'class': 'spinning' }, _('Reading catalog...'))
		]);

		fs.read('/usr/share/secubox/catalog.json').then(function(content) {
			try {
				var json = JSON.parse(content);
				if (editor) editor.value = JSON.stringify(json, null, 2);
				ui.hideModal();
				ui.addNotification(null, E('p', 'Catalog JSON loaded'), 'success');
			} catch (e) {
				if (editor) editor.value = content;
				ui.hideModal();
				ui.addNotification(null, E('p', 'Warning: Invalid JSON format'), 'warning');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
