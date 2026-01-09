'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require rpc';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var NETIFYD_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'flows', icon: '🔍', label: 'Flows' },
	{ id: 'devices', icon: '💻', label: 'Devices' },
	{ id: 'applications', icon: '📱', label: 'Applications' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderNetifydNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, NETIFYD_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'netifyd', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

var callGetDevices = rpc.declare({
	object: 'luci.secubox-netifyd',
	method: 'get_detected_devices'
});

var callGetStatus = rpc.declare({
	object: 'luci.secubox-netifyd',
	method: 'get_service_status'
});

var callGetDashboard = rpc.declare({
	object: 'luci.secubox-netifyd',
	method: 'get_dashboard'
});

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	i = Math.min(i, units.length - 1);
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function formatDuration(seconds) {
	if (seconds < 60) return seconds + 's';
	if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
	if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
	return Math.floor(seconds / 86400) + 'd';
}

function getDeviceIcon(hostname, mac) {
	hostname = (hostname || '').toLowerCase();
	if (hostname.match(/android|phone|mobile|samsung|xiaomi|huawei|oppo|vivo/)) return '📱';
	if (hostname.match(/iphone|ipad|apple|macbook|imac/)) return '🍎';
	if (hostname.match(/pc|laptop|desktop|windows|linux|ubuntu/)) return '💻';
	if (hostname.match(/camera|cam|dvr|nvr|hikvision|dahua/)) return '📷';
	if (hostname.match(/tv|roku|chromecast|firestick|appletv|smart-tv/)) return '📺';
	if (hostname.match(/playstation|xbox|nintendo|switch|steam/)) return '🎮';
	if (hostname.match(/router|switch|ap|access[-_]?point|mesh/)) return '📡';
	if (hostname.match(/printer|print|hp-|canon-|epson-/)) return '🖨️';
	if (hostname.match(/alexa|echo|google[-_]?home|homepod/)) return '🔊';
	if (hostname.match(/thermostat|nest|hue|bulb|sensor|iot/)) return '🏠';
	return '🔌';
}

return view.extend({
	refreshInterval: 5,
	devicesData: [],
	sortColumn: 'bytes_sent',
	sortDirection: 'desc',
	searchQuery: '',

	load: function() {
		return Promise.all([
			callGetDevices(),
			callGetStatus(),
			callGetDashboard()
		]);
	},

	filterDevices: function(devices) {
		if (!this.searchQuery) {
			return devices;
		}

		var query = this.searchQuery.toLowerCase();
		return devices.filter(function(device) {
			var ip = (device.ip || '').toLowerCase();
			var mac = (device.mac || '').toLowerCase();
			return ip.indexOf(query) >= 0 || mac.indexOf(query) >= 0;
		});
	},

	sortDevices: function(devices, column, direction) {
		return devices.slice().sort(function(a, b) {
			var valA = a[column] || 0;
			var valB = b[column] || 0;

			if (column === 'ip' || column === 'mac') {
				valA = String(valA);
				valB = String(valB);
			}

			if (direction === 'asc') {
				return valA > valB ? 1 : valA < valB ? -1 : 0;
			} else {
				return valA < valB ? 1 : valA > valB ? -1 : 0;
			}
		});
	},

	handleSort: function(column, ev) {
		if (this.sortColumn === column) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortColumn = column;
			this.sortDirection = 'desc';
		}
		this.renderDevicesTable();
	},

	handleFilterOnline: function(value, ev) {
		this.filterOnline = value;
		this.renderDevicesTable();
	},

	handleExport: function(ev) {
		var csvContent = 'IP Address,MAC Address,Hostname,Flows,Bytes Sent,Bytes Received,Total Traffic,Last Seen\n';

		this.devicesData.forEach(function(device) {
			var total = (device.bytes_sent || 0) + (device.bytes_received || 0);
			var lastSeen = device.last_seen || 0;
			var lastSeenStr = lastSeen > 0 ? new Date(lastSeen * 1000).toISOString() : 'N/A';

			csvContent += [
				'"' + (device.ip || 'N/A') + '"',
				'"' + (device.mac || 'N/A') + '"',
				'"' + (device.hostname || device.name || '') + '"',
				device.flows || 0,
				device.bytes_sent || 0,
				device.bytes_received || 0,
				total,
				'"' + lastSeenStr + '"'
			].join(',') + '\n';
		});

		var blob = new Blob([csvContent], { type: 'text/csv' });
		var url = window.URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'netifyd-devices-' + new Date().toISOString().slice(0,10) + '.csv';
		a.click();
		window.URL.revokeObjectURL(url);

		ui.addNotification(null, E('p', _('Devices exported to CSV')), 'info');
	},

	renderSummaryCards: function(devices) {
		var totalBytesSent = devices.reduce(function(sum, dev) {
			return sum + (dev.bytes_sent || 0);
		}, 0);

		var totalBytesRecv = devices.reduce(function(sum, dev) {
			return sum + (dev.bytes_received || 0);
		}, 0);

		var totalFlows = devices.reduce(function(sum, dev) {
			return sum + (dev.flows || 0);
		}, 0);

		var cards = [
			{
				title: _('Active Devices'),
				value: devices.length.toString(),
				emoji: '📱',
				color: '#6366f1',
				bg: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)'
			},
			{
				title: _('Total Flows'),
				value: totalFlows.toLocaleString(),
				emoji: '🔄',
				color: '#10b981',
				bg: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(52,211,153,0.15) 100%)'
			},
			{
				title: _('Upload'),
				value: formatBytes(totalBytesSent),
				emoji: '⬆️',
				color: '#ef4444',
				bg: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(248,113,113,0.15) 100%)'
			},
			{
				title: _('Download'),
				value: formatBytes(totalBytesRecv),
				emoji: '⬇️',
				color: '#22c55e',
				bg: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(74,222,128,0.15) 100%)'
			}
		];

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px'
		}, cards.map(function(card) {
			return E('div', {
				'style': 'background: ' + card.bg + '; border: 1px solid rgba(0,0,0,0.08); padding: 20px; border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s;'
			}, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px' }, [
					E('span', { 'style': 'font-size: 28px' }, card.emoji),
					E('span', { 'style': 'font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600' }, card.title)
				]),
				E('div', { 'style': 'font-size: 28px; font-weight: 700; color: ' + card.color }, card.value)
			]);
		}));
	},

	renderDevicesTable: function() {
		var container = document.getElementById('devices-table-container');
		if (!container) return;

		var devices = this.filterDevices(this.devicesData);
		var sortedDevices = this.sortDevices(devices, this.sortColumn, this.sortDirection);

		if (devices.length === 0) {
			dom.content(container, E('div', {
				'style': 'text-align: center; padding: 48px; background: linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%); border-radius: 16px; border: 2px dashed rgba(99,102,241,0.2)'
			}, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 16px; opacity: 0.5' }, '📡'),
				E('h4', { 'style': 'margin: 0 0 8px 0; color: #374151' }, _('No Devices Detected')),
				E('p', { 'style': 'color: #6b7280; margin: 0' }, _('Waiting for network traffic...'))
			]));
			return;
		}

		var deviceCards = sortedDevices.map(function(device) {
			var lastSeen = device.last_seen || 0;
			var now = Math.floor(Date.now() / 1000);
			var ago = now - lastSeen;
			var lastSeenStr = 'N/A';
			var isOnline = ago < 120;

			if (lastSeen > 0) {
				if (ago < 60) lastSeenStr = _('Just now');
				else lastSeenStr = formatDuration(ago) + ' ' + _('ago');
			}

			var totalBytes = (device.bytes_sent || 0) + (device.bytes_received || 0);
			var sentPercent = totalBytes > 0 ? ((device.bytes_sent || 0) / totalBytes * 100) : 50;
			var recvPercent = 100 - sentPercent;
			var icon = getDeviceIcon(device.hostname || device.name, device.mac);

			return E('div', {
				'style': 'background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; transition: all 0.2s; ' + (isOnline ? 'box-shadow: 0 2px 8px rgba(34,197,94,0.1); border-left: 4px solid #22c55e;' : 'opacity: 0.7;')
			}, [
				// Header row: Icon + IP/MAC + Status
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px' }, [
					E('div', { 'style': 'font-size: 32px; flex-shrink: 0' }, icon),
					E('div', { 'style': 'flex: 1; min-width: 0' }, [
						E('div', { 'style': 'font-weight: 600; color: #111827; font-size: 15px; font-family: monospace' }, device.ip || 'Unknown'),
						E('div', { 'style': 'font-size: 11px; color: #9ca3af; font-family: monospace' }, device.mac || 'Unknown')
					]),
					E('div', { 'style': 'text-align: right' }, [
						E('div', {
							'style': 'display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; ' + (isOnline ? 'background: rgba(34,197,94,0.15); color: #16a34a' : 'background: rgba(156,163,175,0.15); color: #6b7280')
						}, [
							E('span', { 'style': 'width: 6px; height: 6px; border-radius: 50%; background: ' + (isOnline ? '#22c55e' : '#9ca3af') }),
							isOnline ? _('Online') : lastSeenStr
						]),
						E('div', { 'style': 'font-size: 11px; color: #9ca3af; margin-top: 4px' },
							(device.flows || 0) + ' ' + _('flows'))
					])
				]),
				// Traffic stats row
				E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px' }, [
					E('div', { 'style': 'background: rgba(239,68,68,0.08); padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center' }, [
						E('span', { 'style': 'font-size: 12px; color: #6b7280' }, '⬆️ ' + _('Upload')),
						E('span', { 'style': 'font-weight: 600; color: #dc2626; font-size: 13px' }, formatBytes(device.bytes_sent || 0))
					]),
					E('div', { 'style': 'background: rgba(34,197,94,0.08); padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center' }, [
						E('span', { 'style': 'font-size: 12px; color: #6b7280' }, '⬇️ ' + _('Download')),
						E('span', { 'style': 'font-weight: 600; color: #16a34a; font-size: 13px' }, formatBytes(device.bytes_received || 0))
					])
				]),
				// Traffic bar
				E('div', { 'style': 'position: relative' }, [
					E('div', { 'style': 'display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: #f3f4f6' }, [
						E('div', {
							'style': 'background: linear-gradient(90deg, #ef4444, #f87171); width: ' + sentPercent + '%; transition: width 0.3s',
							'title': _('Upload: %s').format(sentPercent.toFixed(1) + '%')
						}),
						E('div', {
							'style': 'background: linear-gradient(90deg, #22c55e, #4ade80); width: ' + recvPercent + '%; transition: width 0.3s',
							'title': _('Download: %s').format(recvPercent.toFixed(1) + '%')
						})
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: #9ca3af' }, [
						E('span', {}, sentPercent.toFixed(0) + '% ↑'),
						E('span', { 'style': 'font-weight: 500; color: #6b7280' }, _('Total: %s').format(formatBytes(totalBytes))),
						E('span', {}, recvPercent.toFixed(0) + '% ↓')
					])
				])
			]);
		});

		dom.content(container, E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px'
		}, deviceCards));
	},

	render: function(data) {
		var devicesData = data[0] || {};
		var status = data[1] || {};
		this.devicesData = devicesData.devices || [];

		var self = this;

		// Set up polling
		poll.add(L.bind(function() {
			return Promise.all([
				callGetDevices(),
				callGetStatus()
			]).then(L.bind(function(result) {
				this.devicesData = (result[0] || {}).devices || [];
				this.renderDevicesTable();
				// Update summary cards
				var summaryContainer = document.getElementById('summary-cards-container');
				if (summaryContainer) {
					dom.content(summaryContainer, this.renderSummaryCards(this.devicesData).childNodes);
				}
				// Update device count badge
				var countBadge = document.getElementById('device-count-badge');
				if (countBadge) {
					countBadge.textContent = this.devicesData.length;
				}
			}, this));
		}, this), this.refreshInterval);

		var serviceRunning = status.running;

		var view = E('div', { 'style': 'max-width: 1400px; margin: 0 auto; padding: 24px' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-netifyd/netifyd.css') }),
			// Header
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px' }, [
					E('div', { 'style': 'font-size: 36px' }, '📡'),
					E('div', {}, [
						E('h2', { 'style': 'margin: 0; font-size: 24px; font-weight: 700; color: #111827' }, _('Network Devices')),
						E('p', { 'style': 'margin: 4px 0 0 0; font-size: 14px; color: #6b7280' }, _('Real-time traffic monitoring via Netifyd DPI'))
					])
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px' }, [
					E('div', {
						'style': 'display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 24px; font-size: 13px; font-weight: 600; ' + (serviceRunning ? 'background: rgba(34,197,94,0.15); color: #16a34a' : 'background: rgba(239,68,68,0.15); color: #dc2626')
					}, [
						E('span', { 'style': 'width: 8px; height: 8px; border-radius: 50%; background: ' + (serviceRunning ? '#22c55e' : '#ef4444') + '; animation: ' + (serviceRunning ? 'pulse 2s infinite' : 'none') }),
						serviceRunning ? _('Live') : _('Offline')
					]),
					E('button', {
						'style': 'display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer',
						'click': ui.createHandlerFn(this, 'handleExport')
					}, [
						'📥',
						_('Export')
					])
				])
			]),

			// Summary Cards
			E('div', { 'id': 'summary-cards-container' }, this.renderSummaryCards(this.devicesData).childNodes),

			// Device List Header
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px' }, [
					E('h3', { 'style': 'margin: 0; font-size: 18px; font-weight: 600; color: #374151' }, _('Device List')),
					E('span', {
						'id': 'device-count-badge',
						'style': 'background: #6366f1; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600'
					}, this.devicesData.length)
				]),
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 16px; font-size: 12px; color: #6b7280' }, [
						E('span', { 'style': 'display: flex; align-items: center; gap: 4px' }, [
							E('span', { 'style': 'width: 10px; height: 10px; background: linear-gradient(90deg, #ef4444, #f87171); border-radius: 2px' }),
							_('Upload')
						]),
						E('span', { 'style': 'display: flex; align-items: center; gap: 4px' }, [
							E('span', { 'style': 'width: 10px; height: 10px; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 2px' }),
							_('Download')
						]),
						E('span', { 'style': 'color: #9ca3af' }, '|'),
						E('span', {}, '🔄 ' + _('%ds refresh').format(this.refreshInterval))
					]),
					E('input', {
						'type': 'text',
						'placeholder': _('🔍 Search IP or MAC...'),
						'style': 'padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; min-width: 200px; outline: none',
						'value': this.searchQuery,
						'keyup': function(ev) {
							self.searchQuery = ev.target.value;
							self.renderDevicesTable();
						}
					})
				])
			]),

			// Devices Grid
			E('div', { 'id': 'devices-table-container' }),

			// CSS for pulse animation
			E('style', {}, '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }')
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderNetifydNav('devices'));
		wrapper.appendChild(view);
		return wrapper;
	},

	addFooter: function() {
		this.renderDevicesTable();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
