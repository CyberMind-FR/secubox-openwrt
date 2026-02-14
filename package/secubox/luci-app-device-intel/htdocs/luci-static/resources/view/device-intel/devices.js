'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';
'require secubox/kiss-theme';

/**
 * Device Intel - Devices List - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	load: function() {
		return Promise.all([
			api.getDevices(),
			api.getDeviceTypes()
		]);
	},

	render: function(data) {
		var devResult = data[0] || {};
		var typesResult = data[1] || {};
		var devices = devResult.devices || [];
		var types = typesResult.types || [];
		var self = this;
		var K = KissTheme;

		// Build type lookup
		var typeMap = {};
		types.forEach(function(t) { typeMap[t.id] = t; });

		var inputStyle = 'padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;';

		// ── Filter Bar ──
		var filterInput, typeFilter, statusFilter;

		var filterBar = K.E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; align-items: center;' }, [
			filterInput = K.E('input', {
				'type': 'text',
				'placeholder': 'Search MAC, hostname, IP, vendor...',
				'style': inputStyle + ' width: 280px;',
				'input': function() { self.applyFilters(devices, typeMap); }
			}),
			typeFilter = K.E('select', {
				'style': inputStyle,
				'change': function() { self.applyFilters(devices, typeMap); }
			}, [
				K.E('option', { value: '' }, 'All Types')
			].concat(types.map(function(t) {
				return K.E('option', { value: t.id }, t.name);
			})).concat([
				K.E('option', { value: 'unknown' }, 'Unknown')
			])),
			statusFilter = K.E('select', {
				'style': inputStyle,
				'change': function() { self.applyFilters(devices, typeMap); }
			}, [
				K.E('option', { value: '' }, 'All Status'),
				K.E('option', { value: 'online' }, 'Online'),
				K.E('option', { value: 'offline' }, 'Offline')
			]),
			K.E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'style': 'padding: 10px 16px;',
				'click': function() {
					api.refresh().then(function() {
						window.location.href = window.location.pathname + '?' + Date.now();
					});
				}
			}, '🔄 Refresh')
		]);

		// Store filter elements for later
		this._filterInput = filterInput;
		this._typeFilter = typeFilter;
		this._statusFilter = statusFilter;
		this._typeMap = typeMap;

		// ── Device Table ──
		var tbody = K.E('tbody', { 'id': 'di-device-tbody' });
		this.renderDeviceRows(tbody, devices, typeMap);

		var table = K.E('table', { 'class': 'kiss-table' }, [
			K.E('thead', {}, K.E('tr', {}, [
				K.E('th', { 'style': 'width: 40px;' }, ''),
				K.E('th', {}, 'Device'),
				K.E('th', {}, 'MAC'),
				K.E('th', {}, 'IP'),
				K.E('th', {}, 'Vendor'),
				K.E('th', {}, 'Type'),
				K.E('th', {}, 'Zone'),
				K.E('th', {}, 'Source'),
				K.E('th', { 'style': 'width: 140px;' }, 'Actions')
			])),
			tbody
		]);

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'margin-bottom: 20px;' }, [
				K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
					K.E('span', {}, '📱'),
					'Devices'
				]),
				K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
					'Network devices discovered across all data sources')
			]),

			// Filter and Table Card
			K.E('div', { 'class': 'kiss-card' }, [
				filterBar,
				table
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/services/device-intel/devices');
	},

	vendorDisplay: function(d) {
		var vendor = d.vendor || '';
		var mac = (d.mac || '').toLowerCase();

		// Locally-administered MAC detection (bit 1 of second hex digit)
		var isLocal = false;
		if (mac.length >= 2) {
			var c = mac.charAt(1);
			if ('2367abef'.indexOf(c) !== -1) isLocal = true;
		}

		// Emoji by vendor/type
		if (mac.indexOf('mesh-') === 0)
			return ['\u{1F310} ', vendor || 'Mesh Peer'];
		if (vendor === 'Docker')
			return ['\u{1F4E6} ', vendor];
		if (vendor === 'QEMU/KVM')
			return ['\u{1F5A5} ', vendor];
		if (d.randomized)
			return ['\u{1F3AD} ', vendor || 'Randomized'];
		if (isLocal && !vendor)
			return ['\u{1F47B} ', 'Virtual'];

		// IoT flag from common vendors
		var iotVendors = ['Espressif', 'Tuya', 'Shelly', 'Sonoff', 'Xiaomi',
			'Philips Hue', 'TP-Link', 'Silicon Labs', 'Bosch'];
		if (vendor && iotVendors.indexOf(vendor) !== -1)
			return ['\u{1F4E1} ', vendor];

		return ['', vendor || '-'];
	},

	renderDeviceRows: function(tbody, devices, typeMap) {
		var self = this;
		var K = KissTheme;
		dom.content(tbody, devices.map(function(d) {
			var typeInfo = typeMap[d.device_type] || {};
			return K.E('tr', { 'data-mac': d.mac }, [
				K.E('td', {}, K.E('span', {
					'style': 'display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ' + (d.online ? 'var(--kiss-green, #22c55e)' : 'var(--kiss-muted, #64748b)') + ';',
					'title': d.online ? 'Online' : 'Offline'
				})),
				K.E('td', {}, [
					K.E('strong', {}, d.label || d.hostname || '-'),
					d.emulator_source
						? K.E('small', { 'style': 'display: block; color: var(--kiss-muted); font-size: 11px;' },
							d.emulator_source)
						: null
				].filter(Boolean)),
				K.E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, d.mac || '-'),
				K.E('td', {}, d.ip || '-'),
				K.E('td', {}, (function() {
					var v = self.vendorDisplay(d);
					return [v[0], v[1]].join('');
				})()),
				K.E('td', {}, [
					typeInfo.name
						? K.E('span', {
							'style': 'border-left: 3px solid ' + (typeInfo.color || '#6c757d') + '; padding-left: 8px;'
						}, typeInfo.name)
						: K.E('span', { 'style': 'color: var(--kiss-muted);' }, d.device_type || '-')
				]),
				K.E('td', {}, d.cg_zone || '-'),
				K.E('td', {}, d.source_node || 'local'),
				K.E('td', {}, [
					K.E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'padding: 4px 10px; font-size: 12px; margin-right: 6px;',
						'click': function() { self.handleEditDevice(d, typeMap); }
					}, 'Edit'),
					K.E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 4px 10px; font-size: 12px;',
						'click': function() { self.handleShowDetail(d); }
					}, 'Detail')
				])
			]);
		}));

		if (devices.length === 0) {
			dom.content(tbody, K.E('tr', {},
				K.E('td', { 'colspan': '9', 'style': 'text-align: center; color: var(--kiss-muted); padding: 40px;' },
					'No devices found')));
		}
	},

	applyFilters: function(allDevices, typeMap) {
		var text = (this._filterInput.value || '').toLowerCase();
		var typeVal = this._typeFilter.value;
		var statusVal = this._statusFilter.value;

		var filtered = allDevices.filter(function(d) {
			// Text filter
			if (text) {
				var searchable = [d.mac, d.ip, d.hostname, d.label, d.vendor]
					.filter(Boolean).join(' ').toLowerCase();
				if (searchable.indexOf(text) === -1) return false;
			}
			// Type filter
			if (typeVal && (d.device_type || 'unknown') !== typeVal) return false;
			// Status filter
			if (statusVal === 'online' && !d.online) return false;
			if (statusVal === 'offline' && d.online) return false;
			return true;
		});

		var tbody = document.getElementById('di-device-tbody');
		if (tbody) this.renderDeviceRows(tbody, filtered, typeMap);
	},

	handleEditDevice: function(device, typeMap) {
		var typeSelect, labelInput;
		var types = Object.keys(typeMap);
		var inputStyle = 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px; margin-top: 6px;';

		ui.showModal('✏️ Edit Device: ' + (device.label || device.hostname || device.mac), [
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Label'),
					labelInput = E('input', {
						'type': 'text',
						'value': device.label || '',
						'placeholder': device.hostname || device.mac,
						'style': inputStyle
					})
				]),
				E('div', {}, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Device Type'),
					typeSelect = E('select', { 'style': inputStyle }, [
						E('option', { value: '' }, '-- Auto --')
					].concat(types.map(function(tid) {
						var opt = E('option', { value: tid }, typeMap[tid].name);
						if (device.device_type === tid) opt.selected = true;
						return opt;
					})))
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 10px 20px;',
					'click': ui.hideModal
				}, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 10px 20px;',
					'click': function() {
						var newType = typeSelect.value;
						var newLabel = labelInput.value.trim();

						ui.hideModal();
						api.setDeviceMeta(device.mac, newType, newLabel).then(function(res) {
							if (res && res.success) {
								ui.addNotification(null, E('p', {}, 'Device updated.'), 'info');
								window.location.href = window.location.pathname + '?' + Date.now();
							} else {
								ui.addNotification(null, E('p', {},
									'Update failed: ' + (res ? res.error : '')), 'danger');
							}
						});
					}
				}, '💾 Save')
			])
		]);
	},

	handleShowDetail: function(device) {
		var rows = [
			['MAC', device.mac],
			['IP', device.ip || '-'],
			['Hostname', device.hostname || '-'],
			['Label', device.label || '-'],
			['Vendor', device.vendor || '-'],
			['Online', device.online ? '🟢 Yes' : '⚫ No'],
			['Connection', device.connection_type || '-'],
			['Interface', device.iface || '-'],
			['Randomized MAC', device.randomized ? 'Yes' : 'No'],
			['MAC Guardian Status', device.mg_status || '-'],
			['NAC Zone', device.cg_zone || '-'],
			['NAC Status', device.cg_status || '-'],
			['Device Type', device.device_type || '-'],
			['Type Source', device.device_type_source || '-'],
			['Emulator', device.emulator_source || '-'],
			['Risk Score', String(device.risk_score || 0)],
			['RX Bytes', String(device.rx_bytes || 0)],
			['TX Bytes', String(device.tx_bytes || 0)],
			['Source Node', device.source_node || 'local']
		];

		ui.showModal('🔍 Device Detail: ' + (device.label || device.hostname || device.mac), [
			E('table', { 'style': 'width: 100%; border-collapse: collapse;' },
				rows.map(function(r) {
					return E('tr', {}, [
						E('td', { 'style': 'font-weight: bold; padding: 8px 16px 8px 0; color: var(--kiss-muted); border-bottom: 1px solid var(--kiss-line, #1e293b);' }, r[0]),
						E('td', { 'style': 'padding: 8px 0; border-bottom: 1px solid var(--kiss-line, #1e293b);' }, r[1])
					]);
				})
			),
			E('div', { 'style': 'text-align: right; margin-top: 20px;' },
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 10px 20px;',
					'click': ui.hideModal
				}, 'Close'))
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
