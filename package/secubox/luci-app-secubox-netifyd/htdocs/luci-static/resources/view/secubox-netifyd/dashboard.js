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

	load: function() {
		return Promise.all([
			netifydAPI.getDashboard(),
			netifydAPI.getServiceStatus(),
			netifydAPI.getTopApplications(),
			netifydAPI.getTopProtocols()
		]);
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
		if (!stats) stats = {};

		var statCards = [
			{
				title: _('Active Flows'),
				value: (stats.active_flows || 0).toString(),
				icon: 'exchange-alt',
				color: '#3b82f6',
				gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
			},
			{
				title: _('Unique Devices'),
				value: (stats.unique_devices || 0).toString(),
				icon: 'network-wired',
				color: '#10b981',
				gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
			},
			{
				title: _('Applications'),
				value: (stats.unique_applications || 0).toString(),
				icon: 'cubes',
				color: '#8b5cf6',
				gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
			},
			{
				title: _('Total Traffic'),
				value: netifydAPI.formatBytes(stats.total_bytes || 0),
				icon: 'chart-line',
				color: '#f59e0b',
				gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
			}
		];

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
						E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem' }, [
							E('div', { 'style': 'font-size: 0.9em; opacity: 0.9' }, card.title),
							E('i', {
								'class': 'fa fa-' + card.icon,
								'style': 'font-size: 2em; opacity: 0.3'
							})
						]),
						E('div', { 'style': 'font-size: 2em; font-weight: bold' }, card.value)
					]);
				}))
			])
		]);
	},

	renderTopApplications: function(data) {
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
						E('p', _('No application data available yet')),
						E('small', { 'class': 'text-muted' }, _('Data will appear once network traffic is detected'))
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
						E('p', _('No protocol data available yet')),
						E('small', { 'class': 'text-muted' }, _('Data will appear once network traffic is detected'))
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

		// Store container references
		var self = this;

		// Set up polling for real-time updates
		poll.add(L.bind(function() {
			return Promise.all([
				netifydAPI.getDashboard(),
				netifydAPI.getServiceStatus(),
				netifydAPI.getTopApplications(),
				netifydAPI.getTopProtocols()
			]).then(L.bind(function(result) {
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
			}, this));
		}, this), this.refreshInterval);

		var pageContent = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'name': 'content' }, [
				E('i', { 'class': 'fa fa-chart-pie', 'style': 'margin-right: 0.5rem' }),
				_('Network Intelligence Dashboard')
			]),
			E('div', { 'class': 'cbi-map-descr' },
				_('Real-time deep packet inspection, application detection, and network analytics powered by Netifyd DPI engine')),

			// Service Status
			self.statusContainer = E('div'),

			// Statistics
			self.statsContainer = E('div'),

			// Two-column layout for apps and protocols
			E('div', {
				'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem',
				'data-responsive': 'true'
			}, [
				self.appsContainer = E('div'),
				self.protosContainer = E('div')
			])
		]);

		// Initial render
		dom.content(self.statusContainer, self.renderServiceStatus(status));
		dom.content(self.statsContainer, self.renderStatistics(dashboard.stats));
		dom.content(self.appsContainer, self.renderTopApplications(topApps));
		dom.content(self.protosContainer, self.renderTopProtocols(topProtos));

		return pageContent;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
