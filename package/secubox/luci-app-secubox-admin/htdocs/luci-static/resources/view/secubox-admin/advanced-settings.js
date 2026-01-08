'use strict';
'require view';
'require ui';
'require fs';
'require uci';
'require rpc';
'require form';

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
			L.resolveDefault(uci.load('dhcp'), {})
		]);
	},

	render: function() {
		var self = this;

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

		return container;
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
