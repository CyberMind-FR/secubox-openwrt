'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require poll';

var callNetdiagStatus = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'get_switch_status',
	expect: { ports: [] }
});

var callNetdiagDetails = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'get_interface_details',
	params: ['interface'],
	expect: {}
});

var callNetdiagHistory = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'get_error_history',
	params: ['interface', 'minutes'],
	expect: { timeline: [] }
});

var callNetdiagTopology = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'get_topology',
	expect: {}
});

var callClearCounters = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'clear_counters',
	params: ['interface'],
	expect: {}
});

var callCollectErrors = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'collect_errors',
	expect: {}
});

var callGetPortModes = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'get_port_modes',
	params: ['interface'],
	expect: {}
});

var callSetPortMode = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'set_port_mode',
	params: ['interface', 'speed', 'duplex', 'eee', 'autoneg'],
	expect: {}
});

var callGetTemperature = rpc.declare({
	object: 'luci.secubox-netdiag',
	method: 'get_temperature',
	expect: {}
});

return view.extend({
	refreshInterval: 5000,
	pollHandle: null,

	load: function() {
		return Promise.all([
			callNetdiagStatus(),
			callNetdiagTopology()
		]);
	},

	render: function(data) {
		var ports = data[0] || [];
		var topoData = data[1] || {};
		var topology = topoData.topology || {};
		var self = this;

		var container = E('div', { 'class': 'netdiag-container' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-netdiag/netdiag.css') }),
			this.renderHeader(),
			E('div', { 'id': 'netdiag-content' }, [
				this.renderSwitchSection(ports, topology),
				this.renderStandaloneSection(ports, topology),
				this.renderErrorMonitor(ports)
			])
		]);

		// Start polling
		this.startPolling();

		return container;
	},

	renderHeader: function() {
		var self = this;

		return E('div', { 'class': 'netdiag-header' }, [
			E('h1', { 'class': 'netdiag-title' }, [
				E('span', { 'class': 'netdiag-title-icon' }, '\uD83D\uDD0C'),
				_('Network Diagnostics')
			]),
			E('div', { 'class': 'netdiag-header-right' }, [
				E('div', { 'class': 'netdiag-temp-display', 'id': 'temp-display' }, [
					E('span', { 'class': 'temp-icon' }, '\uD83C\uDF21\uFE0F'),
					E('span', { 'class': 'temp-value', 'id': 'temp-value' }, '--'),
					E('span', { 'class': 'temp-unit' }, '\u00B0C')
				]),
				E('button', {
					'class': 'netdiag-btn netdiag-btn-secondary',
					'click': function() { self.collectAndExportErrors(); },
					'title': _('Collect all errors and export')
				}, '\uD83D\uDCCB ' + _('Collect Errors')),
				E('div', { 'class': 'netdiag-refresh-control' }, [
					E('button', {
						'class': 'netdiag-refresh-btn',
						'click': function() { self.refreshData(); }
					}, '\u21BB ' + _('Refresh')),
					E('select', {
						'class': 'netdiag-refresh-select',
						'change': function(ev) {
							self.refreshInterval = parseInt(ev.target.value, 10);
							self.restartPolling();
						}
					}, [
						E('option', { 'value': '5000', 'selected': true }, _('5 seconds')),
						E('option', { 'value': '10000' }, _('10 seconds')),
						E('option', { 'value': '30000' }, _('30 seconds')),
						E('option', { 'value': '0' }, _('Manual'))
					])
				])
			])
		]);
	},

	updateTemperature: function() {
		callGetTemperature().then(function(data) {
			var tempEl = document.getElementById('temp-value');
			if (!tempEl) return;

			var temp = '--';
			var zones = data.zones || [];
			var hwmon = data.hwmon || [];

			// Prefer CPU/SoC temp
			for (var i = 0; i < zones.length; i++) {
				if (zones[i].temp_c > 0) {
					temp = zones[i].temp_c;
					break;
				}
			}

			// Fallback to hwmon
			if (temp === '--' && hwmon.length > 0) {
				for (var j = 0; j < hwmon.length; j++) {
					if (hwmon[j].temp_c > 0) {
						temp = hwmon[j].temp_c;
						break;
					}
				}
			}

			tempEl.textContent = temp;

			// Color based on temp
			var display = document.getElementById('temp-display');
			if (display && temp !== '--') {
				display.classList.remove('temp-normal', 'temp-warm', 'temp-hot');
				if (temp >= 70) display.classList.add('temp-hot');
				else if (temp >= 55) display.classList.add('temp-warm');
				else display.classList.add('temp-normal');
			}
		}).catch(function() {});
	},

	collectAndExportErrors: function() {
		var self = this;

		ui.showModal(_('Collecting Errors'), [
			E('p', {}, _('Gathering error data from all interfaces...')),
			E('div', { 'class': 'spinning' })
		]);

		callCollectErrors().then(function(data) {
			ui.hideModal();

			var content = 'SecuBox Network Diagnostics - Error Collection\n';
			content += '==============================================\n';
			content += 'Timestamp: ' + (data.timestamp || new Date().toISOString()) + '\n';
			content += 'Hostname: ' + (data.hostname || 'unknown') + '\n';
			if (data.temperature) content += 'Temperature: ' + data.temperature + '\u00B0C\n';
			content += '\n';

			var interfaces = data.interfaces || [];
			if (interfaces.length === 0) {
				content += 'No errors detected on any interface.\n';
			} else {
				content += 'INTERFACE ERRORS\n';
				content += '----------------\n';
				interfaces.forEach(function(iface) {
					content += '\n[' + iface.interface + '] Total: ' + iface.total_errors + '\n';
					content += '  rx_crc_errors: ' + iface.rx_crc_errors + '\n';
					content += '  rx_frame_errors: ' + iface.rx_frame_errors + '\n';
					content += '  rx_fifo_errors: ' + iface.rx_fifo_errors + '\n';
					content += '  rx_dropped: ' + iface.rx_dropped + '\n';
					content += '  tx_dropped: ' + iface.tx_dropped + '\n';
					content += '  collisions: ' + iface.collisions + '\n';
				});
			}

			var dmesg = data.dmesg_errors || [];
			if (dmesg.length > 0) {
				content += '\nKERNEL MESSAGES (errors/warnings)\n';
				content += '---------------------------------\n';
				dmesg.forEach(function(line) {
					content += line + '\n';
				});
			}

			// Download file
			var blob = new Blob([content], { type: 'text/plain' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = 'netdiag-errors-' + Date.now() + '.txt';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			ui.addNotification(null, E('p', _('Error report exported')), 'info');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Failed to collect errors: ') + err), 'error');
		});
	},

	renderSwitchSection: function(ports, topology) {
		var self = this;
		var switches = topology.switches || [];

		// If no DSA topology detected, return empty
		if (switches.length === 0) {
			// Check if any ports have a master
			var dsaPorts = ports.filter(function(p) { return p.is_dsa_port; });
			if (dsaPorts.length === 0) {
				return E('div');
			}
		}

		// Group ports by master
		var portsByMaster = {};
		ports.forEach(function(port) {
			if (port.master) {
				if (!portsByMaster[port.master]) {
					portsByMaster[port.master] = [];
				}
				portsByMaster[port.master].push(port);
			}
		});

		var sections = [];
		Object.keys(portsByMaster).forEach(function(master) {
			var switchPorts = portsByMaster[master];

			sections.push(E('div', { 'class': 'netdiag-section' }, [
				E('div', { 'class': 'netdiag-section-header' }, [
					E('span', { 'class': 'netdiag-section-icon' }, '\uD83D\uDD00'),
					E('h2', { 'class': 'netdiag-section-title' },
						_('DSA Switch') + ' (' + master + ')')
				]),
				E('div', { 'class': 'netdiag-ports-grid' },
					switchPorts.map(function(port) {
						return self.renderPortCard(port);
					})
				)
			]));
		});

		return E('div', { 'id': 'netdiag-switches' }, sections);
	},

	renderStandaloneSection: function(ports, topology) {
		var self = this;

		// Get standalone interfaces (no DSA master)
		var standalone = ports.filter(function(p) {
			return !p.is_dsa_port && !p.name.match(/^(br-|lo|docker|veth|tun|tap)/);
		});

		if (standalone.length === 0) {
			return E('div');
		}

		return E('div', { 'class': 'netdiag-section', 'id': 'netdiag-standalone' }, [
			E('div', { 'class': 'netdiag-section-header' }, [
				E('span', { 'class': 'netdiag-section-icon' }, '\uD83C\uDF10'),
				E('h2', { 'class': 'netdiag-section-title' }, _('Standalone Interfaces'))
			]),
			E('div', { 'class': 'netdiag-ports-grid' },
				standalone.map(function(port) {
					return self.renderPortCard(port);
				})
			)
		]);
	},

	renderPortCard: function(port) {
		var self = this;
		var link = port.link;
		var speed = port.speed || 0;
		var duplex = (port.duplex || '').toLowerCase();
		var alertLevel = port.alert_level || 'normal';

		var portClass = 'netdiag-port';
		if (!link) {
			portClass += ' port-down';
		} else if (alertLevel === 'critical') {
			portClass += ' port-critical';
		} else if (alertLevel === 'warning') {
			portClass += ' port-warning';
		} else {
			portClass += ' port-up';
		}

		var indicatorClass = 'netdiag-port-indicator';
		if (!link) {
			indicatorClass += ' down';
		} else if (alertLevel === 'critical') {
			indicatorClass += ' critical';
		} else if (alertLevel === 'warning') {
			indicatorClass += ' warning';
		} else {
			indicatorClass += ' up';
		}

		var speedText = '-';
		if (link && speed > 0) {
			speedText = (speed >= 1000 ? (speed / 1000) + 'G' : speed + 'M');
			speedText += ' ' + (duplex === 'full' ? 'FD' : 'HD');
		}

		var errorText = this.getErrorSummary(port);
		var errorClass = 'netdiag-port-errors';
		if (alertLevel === 'critical') {
			errorClass += ' critical';
		} else if (alertLevel === 'warning') {
			errorClass += ' warning';
		} else {
			errorClass += ' ok';
		}

		return E('div', {
			'class': portClass,
			'data-interface': port.name,
			'click': function() { self.showPortDetails(port.name); }
		}, [
			E('div', { 'class': 'netdiag-port-name' }, port.name),
			E('div', { 'class': 'netdiag-port-status' }, [
				E('span', { 'class': indicatorClass }),
				link ? _('Up') : _('Down')
			]),
			E('div', { 'class': 'netdiag-port-speed' }, speedText),
			E('div', { 'class': errorClass }, errorText)
		]);
	},

	getErrorSummary: function(port) {
		var errors = port.errors || {};
		var total = 0;

		['rx_crc_errors', 'rx_frame_errors', 'rx_fifo_errors', 'rx_dropped',
		 'tx_dropped', 'collisions'].forEach(function(key) {
			total += parseInt(errors[key] || 0, 10);
		});

		if (total === 0) {
			return '\u2713 OK';
		}

		var rate = port.error_rate || 0;
		if (rate > 0) {
			return '\u26A0 ' + total + ' err (' + rate + '/min)';
		}

		return '\u26A0 ' + total + ' err';
	},

	renderErrorMonitor: function(ports) {
		var self = this;

		// Filter ports with errors
		var errorPorts = ports.filter(function(p) {
			return (p.alert_level === 'warning' || p.alert_level === 'critical') ||
			       (p.error_rate && p.error_rate > 0);
		});

		// Sort by error rate descending
		errorPorts.sort(function(a, b) {
			return (b.error_rate || 0) - (a.error_rate || 0);
		});

		if (errorPorts.length === 0) {
			return E('div', { 'class': 'netdiag-section', 'id': 'netdiag-errors' }, [
				E('div', { 'class': 'netdiag-section-header' }, [
					E('span', { 'class': 'netdiag-section-icon' }, '\u26A0\uFE0F'),
					E('h2', { 'class': 'netdiag-section-title' }, _('Error Monitor'))
				]),
				E('div', { 'class': 'netdiag-empty' }, [
					E('span', {}, '\u2705 '),
					_('No errors detected on any interface')
				])
			]);
		}

		return E('div', { 'class': 'netdiag-section', 'id': 'netdiag-errors' }, [
			E('div', { 'class': 'netdiag-section-header' }, [
				E('span', { 'class': 'netdiag-section-icon' }, '\u26A0\uFE0F'),
				E('h2', { 'class': 'netdiag-section-title' }, _('Error Monitor'))
			]),
			E('div', { 'class': 'netdiag-error-monitor' },
				errorPorts.slice(0, 5).map(function(port) {
					return self.renderErrorRow(port);
				})
			)
		]);
	},

	renderErrorRow: function(port) {
		var self = this;
		var errors = port.errors || {};
		var crcErrors = parseInt(errors.rx_crc_errors || 0, 10);
		var rate = port.error_rate || 0;
		var alertLevel = port.alert_level || 'normal';

		var rowClass = 'netdiag-error-interface';
		if (alertLevel === 'critical') rowClass += ' critical';
		else if (alertLevel === 'warning') rowClass += ' warning';

		var rateClass = 'netdiag-error-rate';
		if (alertLevel === 'critical') rateClass += ' critical';
		else if (alertLevel === 'warning') rateClass += ' warning';

		return E('div', { 'class': rowClass }, [
			E('div', { 'class': 'netdiag-error-info' }, [
				E('div', { 'class': 'netdiag-error-iface-name' }, port.name),
				E('div', { 'class': 'netdiag-error-stats' },
					_('CRC: %d, Frame: %d, FIFO: %d').format(
						crcErrors,
						parseInt(errors.rx_frame_errors || 0, 10),
						parseInt(errors.rx_fifo_errors || 0, 10)
					)
				)
			]),
			E('div', { 'class': 'netdiag-sparkline', 'data-interface': port.name }),
			E('div', { 'class': rateClass }, rate + '/min'),
			E('button', {
				'class': 'netdiag-btn netdiag-btn-secondary',
				'style': 'padding: 6px 12px; font-size: 0.8rem;',
				'click': function(ev) {
					ev.stopPropagation();
					self.showPortDetails(port.name);
				}
			}, _('Details'))
		]);
	},

	showPortDetails: function(iface) {
		var self = this;

		// Show loading modal
		var modal = E('div', { 'class': 'netdiag-modal' }, [
			E('div', { 'class': 'netdiag-modal-content' }, [
				E('div', { 'class': 'netdiag-modal-header' }, [
					E('span', { 'class': 'netdiag-modal-title' }, [
						'\uD83D\uDD0C ',
						iface + ' ' + _('Details')
					]),
					E('button', {
						'class': 'netdiag-modal-close',
						'click': function() { modal.remove(); }
					}, '\u2715')
				]),
				E('div', { 'class': 'netdiag-modal-body' }, [
					E('div', { 'class': 'netdiag-loading' }, [
						E('div', { 'class': 'netdiag-spinner' }),
						_('Loading interface details...')
					])
				])
			])
		]);

		document.body.appendChild(modal);

		// Fetch details
		callNetdiagDetails(iface).then(function(details) {
			var body = modal.querySelector('.netdiag-modal-body');
			body.innerHTML = '';

			if (details.error) {
				body.appendChild(E('div', { 'class': 'netdiag-empty' }, details.message));
				return;
			}

			body.appendChild(self.renderDetailContent(details, iface));
		}).catch(function(err) {
			var body = modal.querySelector('.netdiag-modal-body');
			body.innerHTML = '';
			body.appendChild(E('div', { 'class': 'netdiag-empty' }, _('Error loading details: ') + err));
		});
	},

	renderDetailContent: function(details, iface) {
		var self = this;
		var ethtool = details.ethtool || {};
		var stats = details.stats || {};
		var errors = details.errors || {};
		var dmesg = details.dmesg || [];
		var driverInfo = details.driver_info || {};

		return E('div', {}, [
			// Link Status
			E('div', { 'class': 'netdiag-detail-section' }, [
				E('div', { 'class': 'netdiag-detail-title' }, _('Link Status')),
				E('div', { 'class': 'netdiag-detail-grid' }, [
					this.renderDetailItem(_('Speed'), ethtool.speed || '-'),
					this.renderDetailItem(_('Duplex'), ethtool.duplex || '-'),
					this.renderDetailItem(_('Auto-negotiation'), ethtool.auto_negotiation || '-'),
					this.renderDetailItem(_('Link Detected'), ethtool.link_detected || '-'),
					this.renderDetailItem(_('Port'), ethtool.port || '-'),
					this.renderDetailItem(_('Driver'), driverInfo.driver || '-')
				])
			]),

			// Traffic Statistics
			E('div', { 'class': 'netdiag-detail-section' }, [
				E('div', { 'class': 'netdiag-detail-title' }, _('Traffic Statistics')),
				E('div', { 'class': 'netdiag-detail-grid' }, [
					this.renderDetailItem(_('RX Bytes'), this.formatBytes(stats.rx_bytes)),
					this.renderDetailItem(_('TX Bytes'), this.formatBytes(stats.tx_bytes)),
					this.renderDetailItem(_('RX Packets'), this.formatNumber(stats.rx_packets)),
					this.renderDetailItem(_('TX Packets'), this.formatNumber(stats.tx_packets)),
					this.renderDetailItem(_('RX Dropped'), stats.rx_dropped || '0'),
					this.renderDetailItem(_('TX Dropped'), stats.tx_dropped || '0')
				])
			]),

			// Error Counters
			E('div', { 'class': 'netdiag-detail-section' }, [
				E('div', { 'class': 'netdiag-detail-title' }, _('Error Counters')),
				E('table', { 'class': 'netdiag-error-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('Counter')),
							E('th', {}, _('Value')),
							E('th', {}, _('Status'))
						])
					]),
					E('tbody', {}, [
						this.renderErrorRow2('rx_crc_errors', errors.rx_crc_errors),
						this.renderErrorRow2('rx_frame_errors', errors.rx_frame_errors),
						this.renderErrorRow2('rx_fifo_errors', errors.rx_fifo_errors),
						this.renderErrorRow2('rx_missed_errors', errors.rx_missed_errors),
						this.renderErrorRow2('tx_aborted_errors', errors.tx_aborted_errors),
						this.renderErrorRow2('tx_carrier_errors', errors.tx_carrier_errors),
						this.renderErrorRow2('collisions', errors.collisions)
					])
				])
			]),

			// Kernel Messages
			dmesg.length > 0 ? E('div', { 'class': 'netdiag-detail-section' }, [
				E('div', { 'class': 'netdiag-detail-title' }, _('Recent Kernel Messages')),
				E('div', { 'class': 'netdiag-dmesg' },
					dmesg.slice(-10).map(function(line) {
						var lineClass = 'netdiag-dmesg-line';
						if (line.match(/error|fail|bad/i)) {
							lineClass += ' error';
						}
						return E('div', { 'class': lineClass }, line);
					})
				)
			]) : E('div'),

			// Port Mode Settings (for temperature control)
			E('div', { 'class': 'netdiag-detail-section' }, [
				E('div', { 'class': 'netdiag-detail-title' }, [
					'\uD83C\uDF21\uFE0F ',
					_('Port Mode (Temperature Control)')
				]),
				E('div', { 'class': 'netdiag-port-mode', 'id': 'port-mode-' + iface }, [
					E('p', { 'style': 'color: #94a3b8; font-size: 0.85rem; margin-bottom: 1rem;' },
						_('Reducing port speed or enabling EEE can lower heat generation.')),
					E('div', { 'class': 'netdiag-mode-controls' }, [
						E('div', { 'class': 'netdiag-mode-group' }, [
							E('label', {}, _('Speed/Duplex')),
							E('select', { 'id': 'speed-select-' + iface, 'class': 'netdiag-select' }, [
								E('option', { 'value': 'auto' }, _('Auto-negotiate')),
								E('option', { 'value': '1000-full' }, '1000 Mbps Full'),
								E('option', { 'value': '100-full' }, '100 Mbps Full'),
								E('option', { 'value': '100-half' }, '100 Mbps Half'),
								E('option', { 'value': '10-full' }, '10 Mbps Full'),
								E('option', { 'value': '10-half' }, '10 Mbps Half')
							])
						]),
						E('div', { 'class': 'netdiag-mode-group' }, [
							E('label', {}, _('Energy Efficient Ethernet (EEE)')),
							E('select', { 'id': 'eee-select-' + iface, 'class': 'netdiag-select' }, [
								E('option', { 'value': '' }, _('No change')),
								E('option', { 'value': 'on' }, _('Enable (saves power/heat)')),
								E('option', { 'value': 'off' }, _('Disable'))
							])
						]),
						E('button', {
							'class': 'netdiag-btn netdiag-btn-primary',
							'click': function() { self.applyPortMode(iface); }
						}, _('Apply'))
					])
				])
			]),

			// Actions
			E('div', { 'class': 'netdiag-actions' }, [
				E('button', {
					'class': 'netdiag-btn netdiag-btn-secondary',
					'click': function() {
						self.clearCounters(iface);
					}
				}, _('Clear History')),
				E('button', {
					'class': 'netdiag-btn netdiag-btn-secondary',
					'click': function() {
						self.exportLog(iface, details);
					}
				}, _('Export Log'))
			])
		]);
	},

	applyPortMode: function(iface) {
		var self = this;
		var speedSelect = document.getElementById('speed-select-' + iface);
		var eeeSelect = document.getElementById('eee-select-' + iface);

		if (!speedSelect) return;

		var speedVal = speedSelect.value;
		var eeeVal = eeeSelect ? eeeSelect.value : '';

		var speed = '', duplex = '', autoneg = '';
		if (speedVal === 'auto') {
			autoneg = 'on';
		} else {
			var parts = speedVal.split('-');
			speed = parts[0];
			duplex = parts[1];
			autoneg = 'off';
		}

		ui.showModal(_('Applying Port Mode'), [
			E('p', {}, _('Changing port settings for %s...').format(iface)),
			E('div', { 'class': 'spinning' })
		]);

		callSetPortMode(iface, speed, duplex, eeeVal, autoneg).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('Port mode updated')), 'info');
				self.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Failed: ') + (result.error || _('Unknown error'))), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err), 'error');
		});
	},

	renderDetailItem: function(label, value) {
		return E('div', { 'class': 'netdiag-detail-item' }, [
			E('span', { 'class': 'netdiag-detail-label' }, label),
			E('span', { 'class': 'netdiag-detail-value' }, value)
		]);
	},

	renderErrorRow2: function(name, value) {
		var val = parseInt(value || 0, 10);
		var status = val > 0 ? '\u26A0' : '\u2713';
		var tdClass = val > 0 ? 'delta-up' : '';

		return E('tr', {}, [
			E('td', {}, name),
			E('td', { 'class': tdClass }, String(val)),
			E('td', {}, status)
		]);
	},

	formatBytes: function(bytes) {
		bytes = parseInt(bytes || 0, 10);
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	formatNumber: function(num) {
		num = parseInt(num || 0, 10);
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return String(num);
	},

	clearCounters: function(iface) {
		var self = this;
		callClearCounters(iface).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('History cleared for %s').format(iface)), 'info');
				self.refreshData();
			} else {
				ui.addNotification(null, E('p', result.message), 'warning');
			}
		});
	},

	exportLog: function(iface, details) {
		var content = 'SecuBox Network Diagnostics Export\n';
		content += 'Interface: ' + iface + '\n';
		content += 'Timestamp: ' + new Date().toISOString() + '\n';
		content += '\n--- Ethtool ---\n';
		content += JSON.stringify(details.ethtool, null, 2) + '\n';
		content += '\n--- Statistics ---\n';
		content += JSON.stringify(details.stats, null, 2) + '\n';
		content += '\n--- Errors ---\n';
		content += JSON.stringify(details.errors, null, 2) + '\n';
		content += '\n--- Kernel Messages ---\n';
		(details.dmesg || []).forEach(function(line) {
			content += line + '\n';
		});

		var blob = new Blob([content], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'netdiag-' + iface + '-' + Date.now() + '.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	},

	refreshData: function() {
		var self = this;
		var content = document.getElementById('netdiag-content');

		if (!content) return;

		callNetdiagStatus().then(function(ports) {
			callNetdiagTopology().then(function(topoData) {
				var topology = (topoData && topoData.topology) ? topoData.topology : {};

				// Update content
				content.innerHTML = '';
				content.appendChild(self.renderSwitchSection(ports || [], topology));
				content.appendChild(self.renderStandaloneSection(ports || [], topology));
				content.appendChild(self.renderErrorMonitor(ports || []));
			});
		});
	},

	startPolling: function() {
		var self = this;

		// Initial temperature update
		this.updateTemperature();

		if (this.refreshInterval > 0) {
			this.pollHandle = poll.add(function() {
				self.refreshData();
				self.updateTemperature();
			}, this.refreshInterval / 1000);
		}
	},

	restartPolling: function() {
		if (this.pollHandle) {
			poll.remove(this.pollHandle);
			this.pollHandle = null;
		}
		this.startPolling();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
