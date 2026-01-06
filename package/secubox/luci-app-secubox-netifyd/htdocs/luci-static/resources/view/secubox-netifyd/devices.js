'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require secubox-netifyd/api as netifydAPI';

return view.extend({
	refreshInterval: 5,
	devicesData: [],
	sortColumn: 'bytes_sent',
	sortDirection: 'desc',
	searchQuery: '',

	load: function() {
		return Promise.all([
			netifydAPI.getDetectedDevices(),
			netifydAPI.getServiceStatus(),
			netifydAPI.getDashboard()
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
		var csvContent = 'IP Address,MAC Address,Flows,Bytes Sent,Bytes Received,Total Traffic,Last Seen\n';

		this.devicesData.forEach(function(device) {
			var total = (device.bytes_sent || 0) + (device.bytes_received || 0);
			var lastSeen = device.last_seen || 0;
			var lastSeenStr = lastSeen > 0 ? new Date(lastSeen * 1000).toISOString() : 'N/A';

			csvContent += [
				'"' + (device.ip || 'N/A') + '"',
				'"' + (device.mac || 'N/A') + '"',
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
				icon: 'network-wired',
				gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
			},
			{
				title: _('Total Flows'),
				value: totalFlows.toLocaleString(),
				icon: 'stream',
				gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
			},
			{
				title: _('Total Sent'),
				value: netifydAPI.formatBytes(totalBytesSent),
				icon: 'upload',
				gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
			},
			{
				title: _('Total Received'),
				value: netifydAPI.formatBytes(totalBytesRecv),
				icon: 'download',
				gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
			}
		];

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem'
		}, cards.map(function(card) {
			return E('div', {
				'style': 'background: ' + card.gradient + '; color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1)'
			}, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem' }, [
					E('div', { 'style': 'font-size: 0.9em; opacity: 0.9' }, card.title),
					E('i', {
						'class': 'fa fa-' + card.icon,
						'style': 'font-size: 2em; opacity: 0.3'
					})
				]),
				E('div', { 'style': 'font-size: 2em; font-weight: bold' }, card.value)
			]);
		}.bind(this)));
	},

	renderDevicesTable: function() {
		var container = document.getElementById('devices-table-container');
		if (!container) return;

		var devices = this.filterDevices(this.devicesData);
		var sortedDevices = this.sortDevices(devices, this.sortColumn, this.sortDirection);

		var getSortIcon = function(column) {
			if (this.sortColumn !== column) {
				return E('i', { 'class': 'fa fa-sort', 'style': 'opacity: 0.3' });
			}
			return E('i', {
				'class': 'fa fa-sort-' + (this.sortDirection === 'asc' ? 'up' : 'down'),
				'style': 'color: #3b82f6'
			});
		}.bind(this);

		dom.content(container, [
			devices.length > 0 ? E('div', { 'class': 'table', 'style': 'font-size: 0.95em' },
				[
					// Header
					E('div', { 'class': 'tr table-titles' }, [
						E('div', {
							'class': 'th left',
							'style': 'width: 20%; cursor: pointer',
							'click': ui.createHandlerFn(this, 'handleSort', 'ip')
						}, [
							_('IP Address'),
							' ',
							getSortIcon('ip')
						]),
						E('div', { 'class': 'th left', 'style': 'width: 20%' }, _('MAC Address')),
						E('div', {
							'class': 'th center',
							'style': 'width: 10%; cursor: pointer',
							'click': ui.createHandlerFn(this, 'handleSort', 'flows')
						}, [
							_('Flows'),
							' ',
							getSortIcon('flows')
						]),
						E('div', {
							'class': 'th right',
							'style': 'width: 15%; cursor: pointer',
							'click': ui.createHandlerFn(this, 'handleSort', 'bytes_sent')
						}, [
							_('Sent'),
							' ',
							getSortIcon('bytes_sent')
						]),
						E('div', {
							'class': 'th right',
							'style': 'width: 15%; cursor: pointer',
							'click': ui.createHandlerFn(this, 'handleSort', 'bytes_received')
						}, [
							_('Received'),
							' ',
							getSortIcon('bytes_received')
						]),
						E('div', { 'class': 'th', 'style': 'width: 20%' }, _('Traffic Distribution'))
					])
				].concat(
					// Rows
					sortedDevices.map(function(device, idx) {
					var lastSeen = device.last_seen || 0;
					var now = Math.floor(Date.now() / 1000);
					var ago = now - lastSeen;
					var lastSeenStr = 'N/A';

					if (lastSeen > 0) {
						if (ago < 60) {
							lastSeenStr = _('Just now');
						} else {
							lastSeenStr = netifydAPI.formatDuration(ago) + ' ' + _('ago');
						}
					}

					var totalBytes = (device.bytes_sent || 0) + (device.bytes_received || 0);
					var sentPercent = totalBytes > 0 ? ((device.bytes_sent || 0) / totalBytes * 100) : 50;
					var recvPercent = 100 - sentPercent;

					return E('div', {
						'class': 'tr',
						'style': idx % 2 === 0 ? 'background: #f9fafb' : ''
					}, [
						E('div', { 'class': 'td left', 'style': 'width: 20%' }, [
							E('code', { 'style': 'font-size: 0.9em' }, device.ip || 'Unknown'),
							E('br'),
							E('small', { 'class': 'text-muted' }, lastSeenStr)
						]),
						E('div', { 'class': 'td left', 'style': 'width: 20%' }, [
							E('code', { 'style': 'font-size: 0.8em' }, device.mac || 'Unknown')
						]),
						E('div', { 'class': 'td center', 'style': 'width: 10%' },
							(device.flows || 0).toLocaleString()),
						E('div', { 'class': 'td right', 'style': 'width: 15%' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: #ef4444; color: white; padding: 0.25rem 0.5rem; border-radius: 4px'
							}, netifydAPI.formatBytes(device.bytes_sent || 0))
						]),
						E('div', { 'class': 'td right', 'style': 'width: 15%' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: #10b981; color: white; padding: 0.25rem 0.5rem; border-radius: 4px'
							}, netifydAPI.formatBytes(device.bytes_received || 0))
						]),
						E('div', { 'class': 'td', 'style': 'width: 20%' }, [
							E('div', {
								'style': 'display: flex; gap: 2px; height: 24px; border-radius: 4px; overflow: hidden'
							}, [
								E('div', {
									'style': 'background: #ef4444; width: ' + sentPercent + '%; transition: width 0.3s',
									'title': _('Upload: %s').format(sentPercent.toFixed(1) + '%')
								}),
								E('div', {
									'style': 'background: #10b981; width: ' + recvPercent + '%; transition: width 0.3s',
									'title': _('Download: %s').format(recvPercent.toFixed(1) + '%')
								})
							]),
							E('div', { 'style': 'font-size: 0.75em; color: #6b7280; margin-top: 0.25rem; text-align: center' },
								_('Total: %s').format(netifydAPI.formatBytes(totalBytes)))
						])
					]);
				}.bind(this))
				)
			) : E('div', {
				'class': 'alert-message info',
				'style': 'text-align: center; padding: 3rem'
			}, [
				E('i', { 'class': 'fa fa-network-wired', 'style': 'font-size: 3em; opacity: 0.3; display: block; margin-bottom: 1rem' }),
				E('h4', _('No Device Data')),
				E('p', { 'class': 'text-muted' }, _('No devices have been detected yet')),
				E('small', _('Data will appear once network traffic is analyzed'))
			])
		]);
	},

	render: function(data) {
		var devicesData = data[0] || {};
		var status = data[1] || {};
		this.devicesData = devicesData.devices || [];

		var self = this;

		// Set up polling
		poll.add(L.bind(function() {
			return Promise.all([
				netifydAPI.getDetectedDevices(),
				netifydAPI.getServiceStatus()
			]).then(L.bind(function(result) {
				this.devicesData = (result[0] || {}).devices || [];
				this.renderDevicesTable();
			}, this));
		}, this), this.refreshInterval);

		var serviceRunning = status.running;

		return E('div', { 'class': 'cbi-map' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
				E('h2', { 'name': 'content', 'style': 'margin: 0' }, [
					E('i', { 'class': 'fa fa-network-wired', 'style': 'margin-right: 0.5rem' }),
					_('Detected Devices')
				]),
				E('span', {
					'class': 'badge',
					'style': 'padding: 0.5rem 1rem; font-size: 0.9em; background: ' + (serviceRunning ? '#10b981' : '#ef4444')
				}, [
					E('i', { 'class': 'fa fa-circle', 'style': 'margin-right: 0.5rem' }),
					serviceRunning ? _('Live') : _('Offline')
				])
			]),
			E('div', { 'class': 'cbi-map-descr' },
				_('Network devices detected and tracked by Netifyd deep packet inspection. Updates every 5 seconds.')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
						E('h3', { 'style': 'margin: 0' }, [
							E('i', { 'class': 'fa fa-chart-bar', 'style': 'margin-right: 0.5rem' }),
							_('Summary')
						]),
						E('button', {
							'class': 'btn btn-primary',
							'click': ui.createHandlerFn(this, 'handleExport')
						}, [
							E('i', { 'class': 'fa fa-download' }),
							' ',
							_('Export CSV')
						])
					]),
					this.renderSummaryCards(this.devicesData)
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
					E('h3', { 'style': 'margin: 0' }, [
						E('i', { 'class': 'fa fa-list', 'style': 'margin-right: 0.5rem' }),
						_('Device List'),
						' ',
						E('span', {
							'class': 'badge',
							'style': 'background: #3b82f6; color: white; margin-left: 0.5rem'
						}, this.devicesData.length)
					]),
					E('div', { 'style': 'display: flex; gap: 0.5rem; align-items: center' }, [
						E('input', {
							'type': 'text',
							'class': 'cbi-input-text',
							'placeholder': _('Search by IP or MAC...'),
							'style': 'min-width: 250px',
							'value': this.searchQuery,
							'keyup': function(ev) {
								self.searchQuery = ev.target.value;
								self.renderDevicesTable();
							}
						})
					])
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', {
						'class': 'alert alert-info',
						'style': 'margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem'
					}, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem' }, [
							E('div', { 'style': 'width: 12px; height: 12px; background: #ef4444; border-radius: 2px' }),
							E('span', _('Upload'))
						]),
						E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem' }, [
							E('div', { 'style': 'width: 12px; height: 12px; background: #10b981; border-radius: 2px' }),
							E('span', _('Download'))
						]),
						E('span', { 'class': 'text-muted' }, '|'),
						E('span', [
							E('i', { 'class': 'fa fa-sync' }),
							' ',
							_('Auto-refresh: Every %d seconds').format(this.refreshInterval)
						])
					]),
					E('div', { 'id': 'devices-table-container' })
				])
			])
		]);
	},

	addFooter: function() {
		this.renderDevicesTable();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
