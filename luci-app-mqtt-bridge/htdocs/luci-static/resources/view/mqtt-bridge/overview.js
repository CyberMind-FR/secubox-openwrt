'use strict';
'require view';
'require ui';
'require mqtt-bridge/api as API';
'require secubox-theme/theme as Theme';
'require mqtt-bridge/nav as Nav';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus().catch(function(err) {
				console.warn('MQTT Bridge backend not available:', err);
				return { backend_available: false };
			}),
			API.getAdapterStatus().catch(function(err) {
				console.warn('MQTT Bridge backend not available:', err);
				return { adapters: [], backend_available: false };
			})
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var adapterStatus = data[1] || { adapters: [] };

		// Ensure adapters is always an array
		var adapters = [];
		if (adapterStatus && Array.isArray(adapterStatus.adapters)) {
			adapters = adapterStatus.adapters;
		} else if (status && Array.isArray(status.adapters)) {
			// Fallback: try to get adapters from status
			adapters = status.adapters;
		}

		var content = [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('mqtt-bridge/common.css') }),
			Nav.renderTabs('overview')
		];

		// Show warning if backend is not available
		if (status.backend_available === false) {
			content.push(E('div', {
				'class': 'mb-card',
				'style': 'background: #fef2f2; border-left: 4px solid #ef4444; margin-bottom: 16px;'
			}, [
				E('div', { 'class': 'mb-card-header' }, [
					E('div', { 'class': 'mb-card-title' }, [E('span', {}, '⚠️'), _('Backend Not Installed')])
				]),
				E('p', { 'style': 'color: #991b1b; margin: 0;' },
					_('The MQTT Bridge backend (RPCD script) is not installed on this router. Please deploy the complete module package to enable functionality.'))
			]));
		}

		content.push(
			this.renderHero(status),
			this.renderUSBAdapterStats(adapters),
			this.renderStats(status),
			this.renderRecentPayloads(status)
		);

		var container = E('div', { 'class': 'mqtt-bridge-dashboard' }, content);
		return container;
	},

	renderHero: function(status) {
		var meta = [
			{ label: _('Broker'), value: status.broker || 'Mosquitto' },
			{ label: _('Clients'), value: status.clients || 0 },
			{ label: _('Last USB Event'), value: status.last_event || _('n/a') }
		];
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '📡'), _('MQTT Bridge')]),
				E('div', { 'style': 'display:flex;gap:8px;' }, [
					E('button', { 'class': 'mb-btn mb-btn-primary', 'click': ui.createHandlerFn(this, 'startPairing') }, ['🔌 ', _('Pair device')])
				])
			]),
			E('p', { 'style': 'color:var(--mb-muted);margin-bottom:12px;' },
				_('USB-to-MQTT hub for bringing Zigbee, serial and modbus devices into SecuBox.')),
			E('div', { 'class': 'mb-hero-meta' }, meta.map(function(item) {
				return E('div', { 'class': 'mb-hero-chip' }, [
					E('span', { 'class': 'mb-hero-chip-label' }, item.label),
					E('strong', {}, item.value)
				]);
			}))
		]);
	},

	renderUSBAdapterStats: function(adapters) {
		// Ensure adapters is always an array
		if (!adapters || !Array.isArray(adapters)) {
			adapters = [];
		}

		var stats = {
			total: adapters.length,
			byType: { zigbee: 0, zwave: 0, modbus: 0, serial: 0 },
			byHealth: { online: 0, error: 0, missing: 0, unknown: 0 }
		};

		adapters.forEach(function(adapter) {
			if (adapter.type) {
				stats.byType[adapter.type] = (stats.byType[adapter.type] || 0) + 1;
			}
			if (adapter.health) {
				stats.byHealth[adapter.health] = (stats.byHealth[adapter.health] || 0) + 1;
			}
		});

		var typeIcons = {
			zigbee: '📡',
			zwave: '🌊',
			modbus: '⚙️',
			serial: '🔌'
		};

		var healthColors = {
			online: '#22c55e',
			error: '#ef4444',
			missing: '#f59e0b',
			unknown: '#9ca3af'
		};

		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '🔌'), _('USB IoT Adapters')]),
				E('button', {
					'class': 'mb-btn mb-btn-neutral',
					'click': function() {
						window.location.href = L.url('admin/secubox/services/mqtt-bridge/adapters');
					}
				}, _('Manage Adapters'))
			]),

			// Adapter count by type
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('div', { 'style': 'color: var(--mb-muted); font-size: 13px; margin-bottom: 8px;' },
					_('Configured Adapters: %d').format(stats.total)),
				E('div', { 'class': 'mb-grid', 'style': 'grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));' },
					Object.keys(stats.byType).map(function(type) {
						var count = stats.byType[type];
						if (count === 0) return null;
						return E('div', {
							'class': 'mb-stat',
							'style': 'background: var(--mb-bg-secondary); border: 1px solid var(--mb-border); border-radius: 8px; padding: 12px;'
						}, [
							E('span', {
								'style': 'display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--mb-muted);'
							}, [
								E('span', {}, typeIcons[type] || ''),
								_('%s').format(type.charAt(0).toUpperCase() + type.slice(1))
							]),
							E('div', { 'class': 'mb-stat-value', 'style': 'font-size: 24px;' }, count)
						]);
					}).filter(Boolean)
				)
			]),

			// Health status breakdown
			E('div', { 'style': 'border-top: 1px solid var(--mb-border); padding-top: 16px;' }, [
				E('div', { 'style': 'color: var(--mb-muted); font-size: 13px; margin-bottom: 8px;' },
					_('Health Status')),
				E('div', { 'class': 'mb-grid', 'style': 'grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));' },
					Object.keys(stats.byHealth).map(function(health) {
						var count = stats.byHealth[health];
						return E('div', {
							'style': 'display: flex; align-items: center; gap: 8px; padding: 8px;'
						}, [
							E('span', {
								'style': 'display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ' + healthColors[health]
							}),
							E('span', { 'style': 'color: var(--mb-muted); font-size: 13px; flex: 1;' },
								_(health.charAt(0).toUpperCase() + health.slice(1))),
							E('strong', { 'style': 'font-size: 16px;' }, count)
						]);
					})
				)
			])
		]);
	},

	renderStats: function(status) {
		var adapterCount = 0;
		if (Array.isArray(status.adapters))
			adapterCount = status.adapters.length;
		else if (status.device_stats && typeof status.device_stats.usb !== 'undefined')
			adapterCount = status.device_stats.usb;
		else if (typeof status.adapters === 'number')
			adapterCount = status.adapters;

		var stats = [
			{ label: _('USB adapters'), value: adapterCount },
			{ label: _('Paired devices'), value: (status.device_stats && status.device_stats.total) || 0 },
			{ label: _('Online devices'), value: (status.device_stats && status.device_stats.online) || 0 },
			{ label: _('Topics/s'), value: status.messages_per_sec || 0 },
			{ label: _('Stored payloads'), value: status.retained || 0 },
			{ label: _('Bridge uptime'), value: status.uptime || _('–') }
		];
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '📊'), _('Metrics')])
			]),
			E('div', { 'class': 'mb-grid' }, stats.map(function(stat) {
				return E('div', { 'class': 'mb-stat' }, [
					E('span', { 'class': 'mb-stat-label' }, stat.label),
					E('div', { 'class': 'mb-stat-value' }, stat.value)
				]);
			}))
		]);
	},

	renderRecentPayloads: function(status) {
		var payloads = status.recent_payloads || [];
		return E('div', { 'class': 'mb-card' }, [
			E('div', { 'class': 'mb-card-header' }, [
				E('div', { 'class': 'mb-card-title' }, [E('span', {}, '📝'), _('Recent payloads')])
			]),
			payloads.length ? E('div', {}, payloads.map(function(entry) {
				return E('div', { 'class': 'mb-device-row' }, [
					E('div', { 'class': 'mb-device-info' }, [
						E('strong', {}, entry.topic),
						E('span', { 'style': 'color:var(--mb-muted);font-size:13px;' }, entry.timestamp)
					]),
					E('code', { 'style': 'font-family:\"JetBrains Mono\",monospace;font-size:12px;' }, entry.payload)
				]);
			})) : E('p', { 'style': 'color:var(--mb-muted);' }, _('No payloads yet'))
		]);
	},

	startPairing: function() {
		ui.showModal(_('Pairing'), [
			E('p', {}, _('Listening for device join requests…')),
			E('div', { 'class': 'spinning' })
		]);
		return API.triggerPairing().then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, _('Pairing window opened for 2 minutes.')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, _('Unable to start pairing')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
