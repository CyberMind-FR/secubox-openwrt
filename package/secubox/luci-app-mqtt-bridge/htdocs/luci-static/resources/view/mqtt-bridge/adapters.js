'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require rpc';
'require mqtt-bridge.api as API';
'require secubox-theme.theme as Theme';

return view.extend({
	load: function() {
		return Promise.all([
			API.getAdapterStatus().catch(function(err) {
				console.warn('MQTT Bridge backend not available:', err);
				return { adapters: [], backend_available: false };
			}),
			API.detectIoTAdapters().catch(function(err) {
				console.warn('MQTT Bridge backend not available:', err);
				return { zigbee: [], zwave: [], modbus: [], backend_available: false };
			}),
			L.resolveDefault(uci.load('mqtt-bridge'))
		]);
	},

	render: function(data) {
		Theme.init({ language: 'en' });

		var adapterStatus = data[0] || { adapters: [] };
		var detectedAdapters = data[1] || { zigbee: [], zwave: [], modbus: [] };

		// Import theme CSS
		document.head.appendChild(E('link', {
			'rel': 'stylesheet',
			'href': L.resource('secubox-theme/core/variables.css')
		}));
		document.head.appendChild(E('link', {
			'rel': 'stylesheet',
			'href': L.resource('secubox-theme/themes/cyberpunk.css')
		}));
		document.head.appendChild(E('link', {
			'rel': 'stylesheet',
			'href': L.resource('secubox-theme/components/cards.css')
		}));
		document.head.appendChild(E('link', {
			'rel': 'stylesheet',
			'href': L.resource('secubox-theme/components/buttons.css')
		}));

		var backendMissing = (adapterStatus.backend_available === false || detectedAdapters.backend_available === false);

		var containerContent = [
			E('style', {}, `
				.mqtt-adapters-container {
					padding: var(--spacing-lg);
				}
				.adapters-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: var(--spacing-lg);
				}
				.adapters-title {
					font-size: var(--font-size-2xl);
					font-weight: var(--font-weight-semibold);
					color: var(--sh-text-primary);
				}
				.adapters-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
					gap: var(--spacing-md);
					margin-bottom: var(--spacing-xl);
				}
				.adapter-card {
					background: var(--sh-bg-card);
					border: 1px solid var(--sh-border);
					border-radius: var(--radius-md);
					padding: var(--spacing-md);
					transition: all 0.2s;
				}
				.adapter-card:hover {
					box-shadow: var(--sh-hover-shadow);
					border-color: var(--sh-primary);
				}
				[data-secubox-theme="cyberpunk"] .adapter-card:hover {
					border-color: var(--cyber-accent-primary);
					box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
				}
				.adapter-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: var(--spacing-sm);
				}
				.adapter-title {
					font-size: var(--font-size-lg);
					font-weight: var(--font-weight-semibold);
					color: var(--sh-text-primary);
				}
				.adapter-type {
					display: inline-block;
					padding: 2px 8px;
					border-radius: var(--radius-sm);
					font-size: var(--font-size-xs);
					font-weight: var(--font-weight-medium);
					text-transform: uppercase;
					background: var(--sh-bg-secondary);
					color: var(--sh-text-secondary);
				}
				.adapter-type.zigbee { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
				.adapter-type.zwave { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
				.adapter-type.modbus { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
				.adapter-type.serial { background: rgba(156, 163, 175, 0.1); color: #9ca3af; }
				.adapter-info {
					margin: var(--spacing-sm) 0;
					color: var(--sh-text-secondary);
					font-size: var(--font-size-sm);
				}
				.adapter-info-row {
					display: flex;
					justify-content: space-between;
					margin: 4px 0;
				}
				.adapter-status {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					padding: 4px 12px;
					border-radius: var(--radius-full);
					font-size: var(--font-size-xs);
					font-weight: var(--font-weight-medium);
				}
				.adapter-status.online {
					background: rgba(34, 197, 94, 0.1);
					color: #22c55e;
				}
				.adapter-status.error {
					background: rgba(239, 68, 68, 0.1);
					color: #ef4444;
				}
				.adapter-status.missing {
					background: rgba(245, 158, 11, 0.1);
					color: #f59e0b;
				}
				.adapter-status.unknown {
					background: rgba(156, 163, 175, 0.1);
					color: #9ca3af;
				}
				.adapter-actions {
					display: flex;
					gap: var(--spacing-xs);
					margin-top: var(--spacing-md);
					padding-top: var(--spacing-md);
					border-top: 1px solid var(--sh-border);
				}
				.detected-section {
					margin-top: var(--spacing-xl);
				}
				.detected-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: var(--spacing-md);
				}
				.detected-title {
					font-size: var(--font-size-xl);
					font-weight: var(--font-weight-semibold);
					color: var(--sh-text-primary);
				}
				.detected-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
					gap: var(--spacing-md);
				}
				.detected-card {
					background: var(--sh-bg-card);
					border: 1px solid var(--sh-border);
					border-radius: var(--radius-md);
					padding: var(--spacing-sm);
				}
				.detected-card-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: var(--spacing-xs);
				}
				.empty-state {
					text-align: center;
					padding: var(--spacing-xl);
					color: var(--sh-text-secondary);
				}
				.empty-state-icon {
					font-size: 48px;
					margin-bottom: var(--spacing-md);
					opacity: 0.5;
				}
			`),

			// Page Header
			E('div', { 'class': 'adapters-header' }, [
				E('h2', { 'class': 'adapters-title' }, _('USB IoT Adapters')),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, this.handleScanUSB)
				}, _('Scan USB Devices'))
			]),

			// Configured Adapters Section
			E('div', {}, [
				E('h3', { 'class': 'detected-title' }, _('Configured Adapters')),
				this.renderConfiguredAdapters(adapterStatus.adapters)
			]),

			// Detected Devices Section
			E('div', { 'class': 'detected-section' }, [
				E('div', { 'class': 'detected-header' }, [
					E('h3', { 'class': 'detected-title' }, _('Detected USB Devices')),
					E('div', {}, [
						E('span', { 'style': 'color: var(--sh-text-secondary); font-size: var(--font-size-sm);' },
							_('Found: %d Zigbee, %d Z-Wave, %d ModBus').format(
								detectedAdapters.zigbee.length,
								detectedAdapters.zwave.length,
								detectedAdapters.modbus.length
							)
						)
					])
				]),
				this.renderDetectedDevices(detectedAdapters)
			])
		];

		// Insert warning banner if backend is not available
		if (backendMissing) {
			containerContent.splice(1, 0, E('div', {
				'style': 'background: #fef2f2; border-left: 4px solid #ef4444; border-radius: var(--radius-md); padding: var(--spacing-md); margin-bottom: var(--spacing-lg);'
			}, [
				E('h3', { 'style': 'color: #991b1b; margin: 0 0 8px 0; font-size: var(--font-size-lg);' },
					'⚠️ ' + _('Backend Not Installed')),
				E('p', { 'style': 'color: #991b1b; margin: 0;' },
					_('The MQTT Bridge backend (RPCD script) is not installed. USB detection and adapter management require the backend to be deployed.'))
			]));
		}

		var container = E('div', { 'class': 'mqtt-adapters-container' }, containerContent);
		return container;
	},

	renderConfiguredAdapters: function(adapters) {
		if (!adapters || adapters.length === 0) {
			return E('div', { 'class': 'empty-state' }, [
				E('div', { 'class': 'empty-state-icon' }, '🔌'),
				E('p', {}, _('No adapters configured yet.')),
				E('p', { 'style': 'font-size: var(--font-size-sm);' },
					_('Scan for USB devices and import them to get started.'))
			]);
		}

		var grid = E('div', { 'class': 'adapters-grid' });

		adapters.forEach(function(adapter) {
			var statusDot = E('span', {
				'style': 'display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; background: ' +
					(adapter.health === 'online' ? '#22c55e' :
					 adapter.health === 'error' ? '#ef4444' :
					 adapter.health === 'missing' ? '#f59e0b' : '#9ca3af')
			});

			var card = E('div', { 'class': 'adapter-card' }, [
				E('div', { 'class': 'adapter-header' }, [
					E('div', { 'class': 'adapter-title' }, adapter.title || adapter.id),
					E('span', { 'class': 'adapter-type ' + adapter.type }, adapter.type)
				]),
				E('div', { 'class': 'adapter-info' }, [
					E('div', { 'class': 'adapter-info-row' }, [
						E('span', {}, _('Port:')),
						E('span', { 'style': 'font-family: monospace;' }, adapter.port || _('Not detected'))
					]),
					adapter.vid && E('div', { 'class': 'adapter-info-row' }, [
						E('span', {}, _('VID:PID:')),
						E('span', { 'style': 'font-family: monospace;' },
							'%s:%s'.format(adapter.vid || '—', adapter.pid || '—'))
					]),
					E('div', { 'class': 'adapter-info-row' }, [
						E('span', {}, _('Status:')),
						E('span', { 'class': 'adapter-status ' + adapter.health }, [
							statusDot,
							_(adapter.health.charAt(0).toUpperCase() + adapter.health.slice(1))
						])
					]),
					adapter.usb_present !== undefined && E('div', { 'class': 'adapter-info-row' }, [
						E('span', {}, _('USB Present:')),
						E('span', {}, adapter.usb_present ? _('Yes') : _('No'))
					])
				]),
				E('div', { 'class': 'adapter-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.handleTestAdapter, adapter)
					}, _('Test')),
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': ui.createHandlerFn(this, this.handleConfigureAdapter, adapter)
					}, _('Configure')),
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': ui.createHandlerFn(this, this.handleRemoveAdapter, adapter)
					}, _('Remove'))
				])
			]);

			grid.appendChild(card);
		}.bind(this));

		return grid;
	},

	renderDetectedDevices: function(detected) {
		var allDevices = [
			...(detected.zigbee || []).map(d => ({ ...d, type: 'zigbee' })),
			...(detected.zwave || []).map(d => ({ ...d, type: 'zwave' })),
			...(detected.modbus || []).map(d => ({ ...d, type: 'modbus' }))
		];

		if (allDevices.length === 0) {
			return E('div', { 'class': 'empty-state' }, [
				E('div', { 'class': 'empty-state-icon' }, '🔍'),
				E('p', {}, _('No IoT USB devices detected.')),
				E('p', { 'style': 'font-size: var(--font-size-sm);' },
					_('Click "Scan USB Devices" to refresh detection.'))
			]);
		}

		var grid = E('div', { 'class': 'detected-grid' });

		allDevices.forEach(function(device) {
			var card = E('div', { 'class': 'detected-card' }, [
				E('div', { 'class': 'detected-card-header' }, [
					E('strong', {}, device.name),
					E('span', { 'class': 'adapter-type ' + device.type }, device.type)
				]),
				E('div', { 'style': 'font-size: var(--font-size-xs); color: var(--sh-text-secondary); margin: 4px 0;' }, [
					E('div', {}, 'VID:PID: ' + device.vid + ':' + device.pid),
					device.port && E('div', {}, 'Port: ' + device.port),
					device.bus && E('div', {}, 'Bus: ' + device.bus + ', Device: ' + device.device)
				]),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'style': 'margin-top: 8px; width: 100%;',
					'click': ui.createHandlerFn(this, this.handleImportDevice, device)
				}, _('Import'))
			]);

			grid.appendChild(card);
		}.bind(this));

		return grid;
	},

	handleScanUSB: function() {
		ui.showModal(_('Scanning USB Devices'), [
			E('p', { 'class': 'spinning' }, _('Scanning for IoT USB adapters...'))
		]);

		return API.detectIoTAdapters().then(function(result) {
			ui.hideModal();
			var totalFound = (result.zigbee || []).length +
			                (result.zwave || []).length +
			                (result.modbus || []).length;

			ui.addNotification(null,
				E('p', _('Found %d IoT USB device(s)').format(totalFound)),
				'info'
			);

			// Reload page to show detected devices
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Scan failed: %s').format(err.message)), 'error');
		});
	},

	handleImportDevice: function(device) {
		var adapterId = device.type + '_' + device.vid + device.pid;

		ui.showModal(_('Import Device'), [
			E('p', _('Import %s as a configured adapter?').format(device.name)),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, function() {
						return API.configureAdapter(
							adapterId,
							true,
							device.type,
							device.name,
							device.vid,
							device.pid,
							device.port || ''
						).then(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Adapter imported successfully')), 'info');
							window.location.reload();
						}).catch(function(err) {
							ui.addNotification(null, E('p', _('Import failed: %s').format(err.message)), 'error');
						});
					})
				}, _('Import'))
			])
		]);
	},

	handleTestAdapter: function(adapter) {
		if (!adapter.port) {
			ui.addNotification(null, E('p', _('No port configured for this adapter')), 'warning');
			return;
		}

		ui.showModal(_('Testing Connection'), [
			E('p', { 'class': 'spinning' }, _('Testing %s...').format(adapter.port))
		]);

		return API.testConnection(adapter.port).then(function(result) {
			ui.hideModal();
			if (result.accessible) {
				ui.addNotification(null, E('p', _('Port %s is accessible').format(adapter.port)), 'info');
			} else {
				ui.addNotification(null, E('p', _('Port %s is not accessible').format(adapter.port)), 'warning');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Test failed: %s').format(err.message)), 'error');
		});
	},

	handleConfigureAdapter: function(adapter) {
		ui.addNotification(null, E('p', _('Configuration dialog not yet implemented')), 'info');
		// TODO: Open configuration modal
	},

	handleRemoveAdapter: function(adapter) {
		ui.showModal(_('Remove Adapter'), [
			E('p', _('Remove adapter "%s"?').format(adapter.title || adapter.id)),
			E('p', { 'style': 'color: var(--sh-text-secondary); font-size: var(--font-size-sm);' },
				_('This will remove the adapter configuration from UCI.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button cbi-button-neutral',
					'click': ui.hideModal
				}, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': ui.createHandlerFn(this, function() {
						return API.resetAdapter(adapter.id).then(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Adapter removed successfully')), 'info');
							window.location.reload();
						}).catch(function(err) {
							ui.addNotification(null, E('p', _('Remove failed: %s').format(err.message)), 'error');
						});
					})
				}, _('Remove'))
			])
		]);
	},

	handleSaveOrder: null,
	handleSave: null,
	handleReset: null
});
