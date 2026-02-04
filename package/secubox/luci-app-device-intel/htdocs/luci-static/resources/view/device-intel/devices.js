'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';

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

		var cssLink = E('link', {
			rel: 'stylesheet',
			href: L.resource('device-intel/common.css')
		});

		// Build type lookup
		var typeMap = {};
		types.forEach(function(t) { typeMap[t.id] = t; });

		// ── Filter Bar ──
		var filterInput, typeFilter, statusFilter;

		var filterBar = E('div', { 'class': 'di-filter-bar' }, [
			filterInput = E('input', {
				'type': 'text',
				'placeholder': _('Search MAC, hostname, IP, vendor...'),
				'style': 'width:250px;',
				'input': function() { self.applyFilters(devices, typeMap); }
			}),
			typeFilter = E('select', {
				'change': function() { self.applyFilters(devices, typeMap); }
			}, [
				E('option', { value: '' }, _('All Types'))
			].concat(types.map(function(t) {
				return E('option', { value: t.id }, t.name);
			})).concat([
				E('option', { value: 'unknown' }, _('Unknown'))
			])),
			statusFilter = E('select', {
				'change': function() { self.applyFilters(devices, typeMap); }
			}, [
				E('option', { value: '' }, _('All Status')),
				E('option', { value: 'online' }, _('Online')),
				E('option', { value: 'offline' }, _('Offline'))
			]),
			E('button', {
				'class': 'cbi-button',
				'click': function() {
					api.refresh().then(function() {
						window.location.href = window.location.pathname + '?' + Date.now();
					});
				}
			}, _('Refresh'))
		]);

		// Store filter elements for later
		this._filterInput = filterInput;
		this._typeFilter = typeFilter;
		this._statusFilter = statusFilter;

		// ── Device Table ──
		var tbody = E('tbody', { 'id': 'di-device-tbody' });
		this.renderDeviceRows(tbody, devices, typeMap);

		var table = E('table', { 'class': 'di-device-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, ''),
				E('th', {}, _('Device')),
				E('th', {}, _('MAC')),
				E('th', {}, _('IP')),
				E('th', {}, _('Vendor')),
				E('th', {}, _('Type')),
				E('th', {}, _('Zone')),
				E('th', {}, _('Source')),
				E('th', {}, _('Actions'))
			])),
			tbody
		]);

		return E('div', {}, [
			cssLink,
			E('h2', {}, _('Devices')),
			E('div', { 'class': 'cbi-section' }, [
				filterBar,
				table
			])
		]);
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
		dom.content(tbody, devices.map(function(d) {
			var typeInfo = typeMap[d.device_type] || {};
			return E('tr', { 'data-mac': d.mac }, [
				E('td', {}, E('span', {
					'class': 'di-online-dot ' + (d.online ? 'online' : 'offline'),
					'title': d.online ? _('Online') : _('Offline')
				})),
				E('td', {}, [
					E('strong', {}, d.label || d.hostname || '-'),
					d.emulator_source
						? E('small', { 'style': 'display:block; color:#6c757d;' },
							d.emulator_source)
						: null
				].filter(Boolean)),
				E('td', { 'style': 'font-family:monospace; font-size:0.85em;' }, d.mac || '-'),
				E('td', {}, d.ip || '-'),
				E('td', {}, (function() {
					var v = self.vendorDisplay(d);
					return [v[0], v[1]].join('');
				})()),
				E('td', {}, [
					typeInfo.name
						? E('span', {
							'style': 'border-left:3px solid ' + (typeInfo.color || '#6c757d') +
								'; padding-left:0.5em;'
						}, typeInfo.name)
						: E('span', { 'style': 'color:#6c757d;' }, d.device_type || '-')
				]),
				E('td', {}, d.cg_zone || '-'),
				E('td', {}, d.source_node || 'local'),
				E('td', {}, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'padding:0.2em 0.5em; font-size:0.8em;',
						'click': function() { self.handleEditDevice(d, typeMap); }
					}, _('Edit')),
					' ',
					E('button', {
						'class': 'cbi-button',
						'style': 'padding:0.2em 0.5em; font-size:0.8em;',
						'click': function() { self.handleShowDetail(d); }
					}, _('Detail'))
				])
			]);
		}));

		if (devices.length === 0) {
			dom.content(tbody, E('tr', {},
				E('td', { 'colspan': '9', 'style': 'text-align:center; color:#6c757d; padding:2em;' },
					_('No devices found'))));
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

		ui.showModal(_('Edit Device: ') + (device.label || device.hostname || device.mac), [
			E('div', { 'style': 'display:flex; flex-direction:column; gap:0.8em;' }, [
				E('label', {}, [
					E('strong', {}, _('Label')),
					labelInput = E('input', {
						'type': 'text',
						'class': 'cbi-input-text',
						'value': device.label || '',
						'placeholder': device.hostname || device.mac,
						'style': 'margin-left:0.5em;'
					})
				]),
				E('label', {}, [
					E('strong', {}, _('Device Type')),
					typeSelect = E('select', {
						'class': 'cbi-input-select',
						'style': 'margin-left:0.5em;'
					}, [
						E('option', { value: '' }, _('-- Auto --'))
					].concat(types.map(function(tid) {
						var opt = E('option', { value: tid }, typeMap[tid].name);
						if (device.device_type === tid) opt.selected = true;
						return opt;
					})))
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var newType = typeSelect.value;
						var newLabel = labelInput.value.trim();

						ui.hideModal();
						api.setDeviceMeta(device.mac, newType, newLabel).then(function(res) {
							if (res && res.success) {
								ui.addNotification(null, E('p', {}, _('Device updated.')), 'info');
								window.location.href = window.location.pathname + '?' + Date.now();
							} else {
								ui.addNotification(null, E('p', {},
									_('Update failed: ') + (res ? res.error : '')), 'danger');
							}
						});
					}
				}, _('Save'))
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
			['Online', device.online ? 'Yes' : 'No'],
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

		ui.showModal(_('Device Detail: ') + (device.label || device.hostname || device.mac), [
			E('table', { 'style': 'width:100%;' },
				rows.map(function(r) {
					return E('tr', {}, [
						E('td', { 'style': 'font-weight:bold; padding:0.3em 1em 0.3em 0;' }, r[0]),
						E('td', { 'style': 'padding:0.3em 0;' }, r[1])
					]);
				})
			),
			E('div', { 'class': 'right', 'style': 'margin-top:1em;' },
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close')))
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
