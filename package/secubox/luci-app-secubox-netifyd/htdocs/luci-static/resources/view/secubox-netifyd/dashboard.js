'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require secubox-netifyd/api as netifydAPI';

return view.extend({
	refreshInterval: 5,
	statusContainer: null,
	statsContainer: null,
	appsContainer: null,
	protosContainer: null,
	debugContainer: null,
	debugMode: false,
	lastUpdate: null,
	updateCount: 0,
	errorCount: 0,
	latestDashboardData: null,
	latestTopApps: null,
	latestTopProtocols: null,

	debug: function(message, data) {
		if (!this.debugMode) return;

		var timestamp = new Date().toISOString();
		console.log('[NetifydDashboard ' + timestamp + '] ' + message, data || '');

		if (this.debugContainer) {
			var logEntry = E('div', {
				'style': 'padding: 0.25rem; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 0.85em'
			}, [
				E('span', { 'style': 'color: #6b7280' }, timestamp + ' '),
				E('span', { 'style': 'color: #059669; font-weight: 600' }, message),
				data ? E('pre', { 'style': 'margin: 0.25rem 0 0 0; color: #374151; font-size: 0.8em' },
					JSON.stringify(data, null, 2)) : null
			]);
			this.debugContainer.insertBefore(logEntry, this.debugContainer.firstChild);

			// Keep only last 20 entries
			while (this.debugContainer.childNodes.length > 20) {
				this.debugContainer.removeChild(this.debugContainer.lastChild);
			}
		}
	},

	toggleDebug: function(ev) {
		this.debugMode = !this.debugMode;
		if (ev && ev.target) {
			ev.target.textContent = this.debugMode ? 'Disable Debug' : 'Enable Debug';
			ev.target.className = 'btn ' + (this.debugMode ? 'btn-danger' : 'btn-secondary');
		}
		this.debug('Debug mode ' + (this.debugMode ? 'enabled' : 'disabled'));

		if (this.debugContainer) {
			this.debugContainer.style.display = this.debugMode ? 'block' : 'none';
		}
	},

	aggregateApplications: function(apps) {
		var totals = {
			flows: 0,
			bytes: 0,
			packets: 0,
			uniqueApplications: Array.isArray(apps) ? apps.length : 0
		};

		if (!Array.isArray(apps)) {
			return totals;
		}

		apps.forEach(function(app) {
			totals.flows += app.flows || 0;
			totals.bytes += app.bytes || 0;
			totals.packets += app.packets || 0;
		});

		return totals;
	},

	load: function() {
		this.debug('Loading dashboard data...');
		return Promise.all([
			netifydAPI.getDashboard(),
			netifydAPI.getServiceStatus(),
			netifydAPI.getTopApplications(),
			netifydAPI.getTopProtocols()
	]).then(L.bind(function(result) {
		this.debug('Dashboard data loaded', {
			dashboard: result[0],
			status: result[1],
			apps: result[2] ? result[2].applications.length : 0,
			protocols: result[3] ? result[3].protocols.length : 0
		});
		this.latestDashboardData = result[0] || {};
		this.latestTopApps = result[2] || {};
		this.latestTopProtocols = result[3] || {};
		return result;
	}, this)).catch(L.bind(function(err) {
			this.debug('Error loading dashboard data', { error: err.message });
			this.errorCount++;
			throw err;
		}, this));
	},

	handleServiceAction: function(action, ev) {
		var self = this;
		var actionNames = {
			'start': _('Starting'),
			'stop': _('Stopping'),
			'restart': _('Restarting'),
			'enable': _('Enabling'),
			'disable': _('Disabling')
		};

		ui.showModal(_('Service Control'), [
			E('p', { 'class': 'spinning' }, _('%s Netifyd service...').format(actionNames[action] || _('Processing')))
		]);

		var promise;
		switch (action) {
			case 'start': promise = netifydAPI.startService(); break;
			case 'stop': promise = netifydAPI.stopService(); break;
			case 'restart': promise = netifydAPI.restartService(); break;
			case 'enable': promise = netifydAPI.enableService(); break;
			case 'disable': promise = netifydAPI.disableService(); break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('Action completed successfully')), 'info');
				setTimeout(function() {
					window.location.reload();
				}, 1500);
			} else {
				ui.addNotification(null, E('p', result.message || _('Action failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
		});
	},

	renderServiceStatus: function(status) {
		if (!status) {
			return E('div', { 'class': 'alert-message warning' },
				_('Unable to retrieve service status'));
		}

		var isRunning = status.running || false;
		var statusClass = isRunning ? 'success' : 'danger';
		var statusText = isRunning ? _('Running') : _('Stopped');
		var statusIcon = isRunning ? 'play-circle' : 'stop-circle';

		return E('div', { 'class': 'cbi-section' }, [
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', {
					'style': 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;'
				}, [
					E('h3', { 'style': 'margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem' }, [
						E('i', { 'class': 'fa fa-' + statusIcon, 'style': 'font-size: 1.5em' }),
						_('Netifyd Service Status')
					]),

					// Status Grid
					E('div', {
						'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem'
					}, [
						// Status
						E('div', { 'style': 'background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 6px' }, [
							E('div', { 'style': 'font-size: 0.85em; opacity: 0.8; margin-bottom: 0.5rem' }, _('Status')),
							E('div', { 'style': 'font-size: 1.25em; font-weight: bold' }, [
								E('i', { 'class': 'fa fa-circle', 'style': 'color: ' + (isRunning ? '#4ade80' : '#ef4444') + '; margin-right: 0.5rem; font-size: 0.7em' }),
								statusText
							])
						]),

						// Uptime
						E('div', { 'style': 'background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 6px' }, [
							E('div', { 'style': 'font-size: 0.85em; opacity: 0.8; margin-bottom: 0.5rem' }, _('Uptime')),
							E('div', { 'style': 'font-size: 1.25em; font-weight: bold' },
								netifydAPI.formatDuration(status.uptime || 0))
						]),

						// Version
						E('div', { 'style': 'background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 6px' }, [
							E('div', { 'style': 'font-size: 0.85em; opacity: 0.8; margin-bottom: 0.5rem' }, _('Version')),
							E('div', { 'style': 'font-size: 1.25em; font-weight: bold' }, status.version || _('Unknown'))
						]),

						// Socket Status
						E('div', { 'style': 'background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 6px' }, [
							E('div', { 'style': 'font-size: 0.85em; opacity: 0.8; margin-bottom: 0.5rem' }, _('Socket')),
							E('div', { 'style': 'font-size: 1.25em; font-weight: bold' }, [
								E('i', {
									'class': 'fa fa-circle',
									'style': 'color: ' + (status.socket_connected ? '#4ade80' : '#ef4444') + '; margin-right: 0.5rem; font-size: 0.7em'
								}),
								status.socket_connected ? _('Connected') : _('Disconnected')
							])
						])
					]),

					// UUID Display
					status.uuid && status.uuid !== 'unknown' ? E('div', {
						'style': 'background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem'
					}, [
						E('div', { 'style': 'font-size: 0.85em; opacity: 0.8; margin-bottom: 0.25rem' }, _('Agent UUID')),
						E('code', { 'style': 'color: white; font-size: 0.9em' }, status.uuid)
					]) : null,

					// Control Buttons
					E('div', { 'style': 'display: flex; gap: 0.5rem; flex-wrap: wrap' }, [
						E('button', {
							'class': 'btn ' + (isRunning ? 'btn-danger' : 'btn-success'),
							'click': ui.createHandlerFn(this, 'handleServiceAction', isRunning ? 'stop' : 'start')
						}, [
							E('i', { 'class': 'fa fa-' + (isRunning ? 'stop' : 'play') }),
							' ',
							isRunning ? _('Stop') : _('Start')
						]),
						E('button', {
							'class': 'btn btn-primary',
							'click': ui.createHandlerFn(this, 'handleServiceAction', 'restart'),
							'disabled': !isRunning
						}, [
							E('i', { 'class': 'fa fa-sync' }),
							' ',
							_('Restart')
						]),
						E('button', {
							'class': 'btn btn-secondary',
							'click': ui.createHandlerFn(this, 'handleServiceAction', 'enable')
						}, [
							E('i', { 'class': 'fa fa-check-circle' }),
							' ',
							_('Enable Auto-start')
						]),
						E('button', {
							'class': 'btn btn-secondary',
							'click': ui.createHandlerFn(this, 'handleServiceAction', 'disable')
						}, [
							E('i', { 'class': 'fa fa-times-circle' }),
							' ',
							_('Disable Auto-start')
						])
					])
				])
			])
		]);
	},

	renderStatistics: function(stats) {
		var fallbackStats = (this.latestDashboardData && this.latestDashboardData.stats) || {};
		var fallbackApps = this.aggregateApplications((this.latestTopApps && this.latestTopApps.applications) || []);

		var resolveStat = function(key) {
			if (stats && stats[key] !== undefined && stats[key] !== null) {
				return stats[key];
			}
			if (fallbackStats && fallbackStats[key] !== undefined && fallbackStats[key] !== null) {
				return fallbackStats[key];
			}
			return 0;
		};

		var activeFlows = resolveStat('active_flows') || fallbackApps.flows;
		var uniqueDevices = resolveStat('unique_devices');
		var totalBytes = resolveStat('total_bytes') || fallbackApps.bytes;
		var ipBytes = resolveStat('ip_bytes');
		var tcpPackets = resolveStat('tcp_packets');
		var udpPackets = resolveStat('udp_packets');
		var icmpPackets = resolveStat('icmp_packets');
		var cpuUsage = resolveStat('cpu_usage');
		var memoryKb = resolveStat('memory_kb');

		var statCards = [
			{
				title: _('Active Flows'),
				value: (activeFlows || 0).toString(),
				subtitle: _('Active: %d, Expired: %d').format(resolveStat('flows_active'), resolveStat('flows_expired')),
				icon: 'exchange-alt',
				color: '#3b82f6',
				gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
			},
			{
				title: _('Unique Devices'),
				value: (uniqueDevices || 0).toString(),
				subtitle: _('Connected devices'),
				icon: 'network-wired',
				color: '#10b981',
				gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
			},
			{
				title: _('Total Traffic'),
				value: netifydAPI.formatBytes(totalBytes || 0),
				subtitle: _('IP: %s').format(netifydAPI.formatBytes(ipBytes || 0)),
				icon: 'chart-line',
				color: '#f59e0b',
				gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
			},
			{
				title: _('CPU & Memory'),
				value: (cpuUsage || '0') + '%',
				subtitle: _('RAM: %s').format(netifydAPI.formatBytes((memoryKb || 0) * 1024)),
				icon: 'microchip',
				color: '#ec4899',
				gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
			}
		];

		var totalPackets = tcpPackets + udpPackets + icmpPackets;
		var protocolData = totalPackets > 0 ? [
			{
				name: 'TCP',
				packets: tcpPackets,
				percentage: ((tcpPackets || 0) / totalPackets * 100).toFixed(1),
				color: '#3b82f6'
			},
			{
				name: 'UDP',
				packets: udpPackets,
				percentage: ((udpPackets || 0) / totalPackets * 100).toFixed(1),
				color: '#10b981'
			},
			{
				name: 'ICMP',
				packets: icmpPackets,
				percentage: ((icmpPackets || 0) / totalPackets * 100).toFixed(1),
				color: '#f59e0b'
			}
		] : [];

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', [
				E('i', { 'class': 'fa fa-chart-bar', 'style': 'margin-right: 0.5rem' }),
				_('Network Statistics')
			]),
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', {
					'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin: 1rem 0'
				}, statCards.map(function(card) {
					return E('div', {
						'class': 'netifyd-stat-card',
						'style': 'background: ' + card.gradient + '; color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;'
					}, [
						E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem' }, [
							E('div', { 'style': 'font-size: 0.9em; opacity: 0.9' }, card.title),
							E('i', {
								'class': 'fa fa-' + card.icon,
								'style': 'font-size: 2em; opacity: 0.3'
							})
						]),
						E('div', { 'style': 'font-size: 2em; font-weight: bold; margin-bottom: 0.5rem' }, card.value),
						card.subtitle ? E('div', { 'style': 'font-size: 0.85em; opacity: 0.8' }, card.subtitle) : null
					]);
				})),

				// Protocol Breakdown
				protocolData.length > 0 ? E('div', {
					'style': 'background: white; padding: 1.5rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #e5e7eb'
				}, [
					E('h4', { 'style': 'margin: 0 0 1rem 0; color: #374151; display: flex; align-items: center; gap: 0.5rem' }, [
						E('i', { 'class': 'fa fa-network-wired' }),
						_('Protocol Distribution')
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem' },
						protocolData.map(function(proto) {
							return E('div', [
								E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #6b7280' }, [
									E('span', { 'style': 'font-weight: 600; color: ' + proto.color }, proto.name),
									E('span', proto.packets.toLocaleString() + ' pkts')
								]),
								E('div', { 'style': 'background: #f3f4f6; height: 8px; border-radius: 4px; overflow: hidden' }, [
									E('div', {
										'style': 'background: ' + proto.color + '; height: 100%; width: ' + proto.percentage + '%; transition: width 0.3s ease'
									})
								]),
								E('div', { 'style': 'text-align: right; font-size: 0.85em; margin-top: 0.25rem; color: #9ca3af' },
									proto.percentage + '%')
							]);
						})
					)
				]) : null
			])
		]);
	},

	renderTopApplications: function(data) {
		var fallbackStats = (this.latestDashboardData && this.latestDashboardData.stats) || {};

		if (!data || !data.applications || data.applications.length === 0) {
			return E('div', { 'class': 'cbi-section' }, [
				E('h3', [
					E('i', { 'class': 'fa fa-cubes', 'style': 'margin-right: 0.5rem' }),
					_('Top Applications')
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', {
						'class': 'alert-message info',
						'style': 'text-align: center; padding: 2rem'
					}, [
						E('i', { 'class': 'fa fa-info-circle', 'style': 'font-size: 2em; margin-bottom: 0.5rem; display: block' }),
						E('p', fallbackStats.active_flows ?
							_('Netifyd is tracking %d flows across %d applications. Detailed reporting will appear once the flow exporter is configured.').format(fallbackStats.active_flows, fallbackStats.unique_applications || 0) :
							_('No application data available yet')),
						E('small', { 'class': 'text-muted' }, _('Try enabling flow export (socket or sink) to populate this section'))
					])
				])
			]);
		}

		var maxBytes = Math.max.apply(null, data.applications.map(function(app) {
			return app.bytes || 0;
		}));

		// App colors
		var appColors = [
			'#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
			'#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
		];

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', [
				E('i', { 'class': 'fa fa-cubes', 'style': 'margin-right: 0.5rem' }),
				_('Top Applications')
			]),
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', { 'class': 'table', 'style': 'font-size: 0.95em' },
					data.applications.slice(0, 8).map(function(app, idx) {
						var percentage = maxBytes > 0 ? (app.bytes / maxBytes * 100) : 0;
						var color = appColors[idx % appColors.length];

						return E('div', { 'class': 'tr' }, [
							E('div', { 'class': 'td left', 'style': 'width: 25%; vertical-align: middle' }, [
								E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem' }, [
									E('div', {
										'style': 'width: 8px; height: 8px; border-radius: 50%; background: ' + color
									}),
									E('strong', app.name || 'Unknown')
								]),
								E('small', { 'class': 'text-muted' },
									_('%d flows').format(app.flows || 0))
							]),
							E('div', { 'class': 'td left', 'style': 'width: 55%; vertical-align: middle' }, [
								E('div', {
									'style': 'background: #e5e7eb; border-radius: 10px; height: 24px; position: relative; overflow: hidden'
								}, [
									E('div', {
										'style': 'background: ' + color + '; height: 100%; width: ' + percentage + '%; transition: width 0.3s ease; border-radius: 10px'
									}),
									E('span', {
										'style': 'position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 0.8em; font-weight: bold; color: ' + (percentage > 40 ? '#fff' : '#374151') + '; text-shadow: 0 1px 2px rgba(0,0,0,0.1)'
									}, percentage.toFixed(1) + '%')
								])
							]),
							E('div', { 'class': 'td right', 'style': 'width: 20%; vertical-align: middle' }, [
								E('strong', { 'style': 'color: ' + color },
									netifydAPI.formatBytes(app.bytes || 0))
							])
						]);
					}.bind(this))
				),
				data.applications.length > 8 ? E('div', {
					'class': 'text-center',
					'style': 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb'
				}, [
					E('a', {
						'href': '#',
						'click': function(ev) {
							ev.preventDefault();
							ui.showModal(_('All Applications'), [
								E('div', { 'style': 'max-height: 60vh; overflow-y: auto' }, [
									E('div', { 'class': 'table' },
										data.applications.map(function(app) {
											return E('div', { 'class': 'tr' }, [
												E('div', { 'class': 'td left' }, app.name || 'Unknown'),
												E('div', { 'class': 'td right' },
													netifydAPI.formatBytes(app.bytes || 0))
											]);
										}.bind(this))
									)
								]),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, _('Close'))
								])
							]);
						}.bind(this)
					}, _('View all %d applications »').format(data.applications.length))
				]) : null
			])
		]);
	},

	renderTopProtocols: function(data) {
		var fallbackStats = (this.latestDashboardData && this.latestDashboardData.stats) || {};

		if (!data || !data.protocols || data.protocols.length === 0) {
			return E('div', { 'class': 'cbi-section' }, [
				E('h3', [
					E('i', { 'class': 'fa fa-network-wired', 'style': 'margin-right: 0.5rem' }),
					_('Top Protocols')
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					E('div', {
						'class': 'alert-message info',
						'style': 'text-align: center; padding: 2rem'
					}, [
						E('i', { 'class': 'fa fa-info-circle', 'style': 'font-size: 2em; margin-bottom: 0.5rem; display: block' }),
						E('p', fallbackStats.active_flows ?
							_('Netifyd is tracking %d flows, but protocol breakdown is still pending.').format(fallbackStats.active_flows) :
							_('No protocol data available yet')),
						E('small', { 'class': 'text-muted' }, _('Enable packet capture or flow export to populate protocol metrics'))
					])
				])
			]);
		}

		var maxBytes = Math.max.apply(null, data.protocols.map(function(proto) {
			return proto.bytes || 0;
		}));

		var protocolColors = {
			'TCP': '#3b82f6',
			'UDP': '#10b981',
			'ICMP': '#f59e0b',
			'HTTP': '#14b8a6',
			'HTTPS': '#8b5cf6',
			'DNS': '#f97316',
			'SSH': '#6366f1',
			'FTP': '#ec4899',
			'SMTP': '#84cc16',
			'TLS': '#a855f7'
		};

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', [
				E('i', { 'class': 'fa fa-network-wired', 'style': 'margin-right: 0.5rem' }),
				_('Top Protocols')
			]),
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', { 'class': 'table', 'style': 'font-size: 0.95em' },
					data.protocols.slice(0, 8).map(function(proto) {
						var percentage = maxBytes > 0 ? (proto.bytes / maxBytes * 100) : 0;
						var color = protocolColors[proto.name] || '#6b7280';

						return E('div', { 'class': 'tr' }, [
							E('div', { 'class': 'td left', 'style': 'width: 25%; vertical-align: middle' }, [
								E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem' }, [
									E('div', {
										'style': 'width: 8px; height: 8px; border-radius: 50%; background: ' + color
									}),
									E('strong', proto.name || 'Unknown')
								]),
								E('small', { 'class': 'text-muted' },
									_('%d flows').format(proto.flows || 0))
							]),
							E('div', { 'class': 'td left', 'style': 'width: 55%; vertical-align: middle' }, [
								E('div', {
									'style': 'background: #e5e7eb; border-radius: 10px; height: 24px; position: relative; overflow: hidden'
								}, [
									E('div', {
										'style': 'background: ' + color + '; height: 100%; width: ' + percentage + '%; transition: width 0.3s ease; border-radius: 10px'
									}),
									E('span', {
										'style': 'position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 0.8em; font-weight: bold; color: ' + (percentage > 40 ? '#fff' : '#374151') + '; text-shadow: 0 1px 2px rgba(0,0,0,0.1)'
									}, percentage.toFixed(1) + '%')
								])
							]),
							E('div', { 'class': 'td right', 'style': 'width: 20%; vertical-align: middle' }, [
								E('strong', { 'style': 'color: ' + color },
									netifydAPI.formatBytes(proto.bytes || 0))
							])
						]);
					}.bind(this))
				)
			])
		]);
	},

	render: function(data) {
		var dashboard = data[0] || {};
		var status = data[1] || {};
		var topApps = data[2] || {};
		var topProtos = data[3] || {};

		this.latestDashboardData = dashboard;
		this.latestTopApps = topApps;
		this.latestTopProtocols = topProtos;

		// Store container references
		var self = this;

		this.debug('Rendering dashboard', { dashboard: dashboard, status: status });

		// Create containers first
		self.statusContainer = E('div');
		self.statsContainer = E('div');
		self.appsContainer = E('div');
		self.protosContainer = E('div');

		// Debug panel (hidden by default)
		self.debugContainer = E('div', {
			'class': 'cbi-section',
			'style': 'display: none; max-height: 400px; overflow-y: auto; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem'
		});

		// Set up polling for real-time updates AFTER containers are created
		poll.add(L.bind(function() {
			self.debug('Polling for updates... (interval: ' + self.refreshInterval + 's)');
			return Promise.all([
				netifydAPI.getDashboard(),
				netifydAPI.getServiceStatus(),
				netifydAPI.getTopApplications(),
				netifydAPI.getTopProtocols()
			]).then(L.bind(function(result) {
				self.updateCount++;
				self.lastUpdate = new Date();

				self.debug('Poll update #' + self.updateCount, {
					flows: result[0] ? result[0].stats.active_flows : 0,
					devices: result[0] ? result[0].stats.unique_devices : 0,
					apps: result[2] ? result[2].applications.length : 0
				});

				// Update containers if they exist
				if (self.statusContainer && result[1]) {
					dom.content(self.statusContainer, self.renderServiceStatus(result[1]));
				}
				if (self.statsContainer && result[0]) {
					dom.content(self.statsContainer, self.renderStatistics(result[0].stats));
				}
				if (self.appsContainer && result[2]) {
					dom.content(self.appsContainer, self.renderTopApplications(result[2]));
				}
				if (self.protosContainer && result[3]) {
					dom.content(self.protosContainer, self.renderTopProtocols(result[3]));
				}
			}, this)).catch(L.bind(function(err) {
				self.errorCount++;
				self.debug('Poll error #' + self.errorCount, { error: err.message, stack: err.stack });
				console.error('Netifyd dashboard poll error:', err);
			}, this));
		}, this), this.refreshInterval);

		var pageContent = E('div', { 'class': 'cbi-map' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
				E('h2', { 'name': 'content', 'style': 'margin: 0' }, [
					E('i', { 'class': 'fa fa-chart-pie', 'style': 'margin-right: 0.5rem' }),
					_('Network Intelligence Dashboard')
				]),
				E('div', { 'style': 'display: flex; gap: 0.5rem' }, [
					E('button', {
						'class': 'btn btn-secondary',
						'click': ui.createHandlerFn(this, 'toggleDebug')
					}, _('Enable Debug')),
					E('span', {
						'id': 'netifyd-update-indicator',
						'style': 'padding: 0.5rem 1rem; background: #f3f4f6; border-radius: 0.5rem; font-size: 0.85em; color: #6b7280'
					}, [
						E('i', { 'class': 'fa fa-clock' }),
						' ',
						E('span', {}, _('Updates: 0'))
					])
				])
			]),
			E('div', { 'class': 'cbi-map-descr' },
				_('Real-time deep packet inspection, application detection, and network analytics powered by Netifyd DPI engine')),

			// Debug panel
			E('div', {}, [
				E('h3', { 'style': 'margin: 1rem 0 0.5rem 0; color: #374151; display: ' + (self.debugMode ? 'block' : 'none') }, [
					E('i', { 'class': 'fa fa-bug', 'style': 'margin-right: 0.5rem' }),
					_('Debug Log')
				]),
				self.debugContainer
			]),

			// Service Status
			self.statusContainer,

			// Statistics
			self.statsContainer,

			// Two-column layout for apps and protocols
			E('div', {
				'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem',
				'data-responsive': 'true'
			}, [
				self.appsContainer,
				self.protosContainer
			])
		]);

		// Initial render
		dom.content(self.statusContainer, self.renderServiceStatus(status));
		dom.content(self.statsContainer, self.renderStatistics(dashboard.stats));
		dom.content(self.appsContainer, self.renderTopApplications(topApps));
		dom.content(self.protosContainer, self.renderTopProtocols(topProtos));

		// Update indicator with polling
		var updateIndicator = function() {
			var indicator = document.getElementById('netifyd-update-indicator');
			if (indicator && self.lastUpdate) {
				var elapsed = Math.floor((new Date() - self.lastUpdate) / 1000);
				var span = indicator.querySelector('span');
				if (span) {
					span.textContent = _('Updates: %d | Last: %ds ago').format(self.updateCount, elapsed);
				}
			}
		};
		setInterval(updateIndicator, 1000);

		this.debug('Dashboard rendered successfully');

		return pageContent;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
