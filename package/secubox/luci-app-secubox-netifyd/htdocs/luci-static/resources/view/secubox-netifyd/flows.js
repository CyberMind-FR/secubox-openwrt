'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require secubox-netifyd/api as netifydAPI';
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
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:8px;background:rgba(255,255,255,0.05);border-radius:12px;flex-wrap:wrap;'
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

return view.extend({
	refreshInterval: 3,
	statsContainer: null,
	interfaceContainer: null,
	trendsContainer: null,
	isPaused: false,

	formatInterfaceLabel: function(name) {
		if (!name) {
			return _('Unknown');
		}

		if (typeof name === 'string') {
			return name;
		}

		if (name.nodeType && typeof name.textContent === 'string') {
			return name.textContent.trim();
		}

		return String(name);
	},

	normalizePacketPercentage: function(value, total) {
		if (!total || total <= 0) {
			return '0.0';
		}

		return (value / total * 100).toFixed(1);
	},

	load: function() {
		return Promise.all([
			netifydAPI.getDashboard(),
			netifydAPI.getServiceStatus()
		]);
	},

	handlePauseResume: function(ev) {
		this.isPaused = !this.isPaused;
		var btn = ev.target.closest('button');
		if (this.isPaused) {
			btn.innerHTML = '<i class="fa fa-play"></i> ' + _('Resume');
			btn.classList.remove('btn-warning');
			btn.classList.add('btn-success');
			poll.stop();
		} else {
			btn.innerHTML = '<i class="fa fa-pause"></i> ' + _('Pause');
			btn.classList.remove('btn-success');
			btn.classList.add('btn-warning');
			poll.start();
		}
	},

	renderFlowOverview: function(stats) {
		if (!stats) {
			return E('div', {
				'class': 'alert-message warning',
				'style': 'text-align: center; padding: 2rem'
			}, _('No flow statistics available'));
		}

		var cards = [
			{
				title: _('Total Flows'),
				value: (stats.active_flows || 0).toString(),
				subtitle: _('Currently tracked'),
				icon: 'stream',
				color: '#3b82f6',
				gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
			},
			{
				title: _('Active Flows'),
				value: (stats.flows_active || 0).toString(),
				subtitle: _('In progress'),
				icon: 'play-circle',
				color: '#10b981',
				gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
			},
			{
				title: _('Expired Flows'),
				value: (stats.flows_expired || 0).toString(),
				subtitle: _('Completed'),
				icon: 'check-circle',
				color: '#f59e0b',
				gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
			},
			{
				title: _('Purged Flows'),
				value: (stats.flows_purged || 0).toString(),
				subtitle: _('Cleaned up'),
				icon: 'trash-alt',
				color: '#ef4444',
				gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
			}
		];

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem'
		}, cards.map(function(card) {
			return E('div', {
				'style': 'background: ' + card.gradient + '; color: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1)'
			}, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem' }, [
					E('div', { 'style': 'font-size: 0.9em; opacity: 0.9' }, card.title),
					E('i', { 'class': 'fa fa-' + card.icon, 'style': 'font-size: 2em; opacity: 0.3' })
				]),
				E('div', { 'style': 'font-size: 2.5em; font-weight: bold; margin-bottom: 0.5rem' }, card.value),
				card.subtitle ? E('div', { 'style': 'font-size: 0.85em; opacity: 0.8' }, card.subtitle) : null
			]);
		}));
	},

	renderInterfaceFlows: function(interfaces, stats) {
		var self = this;

		if (!interfaces || Object.keys(interfaces).length === 0) {
			return E('div', {
				'class': 'alert-message info',
				'style': 'text-align: center; padding: 1.5rem; margin-bottom: 1rem'
			}, _('No interface activity detected yet'));
		}

		var interfaceList = [];
		for (var iface in interfaces) {
			if (interfaces.hasOwnProperty(iface)) {
				var ifaceStats = interfaces[iface];
				interfaceList.push({
					name: iface,
					tcp: ifaceStats.tcp_packets || 0,
					udp: ifaceStats.udp_packets || 0,
					icmp: ifaceStats.icmp_packets || 0,
					bytes: ifaceStats.wire_bytes || 0,
					dropped: ifaceStats.dropped || 0
				});
			}
		}

		var tableStyle = 'width: 100%; border-collapse: collapse; margin-top: 1rem;';
		var thStyle = 'padding: 0.75rem 1rem; text-align: left; font-weight: 600; background: #f8fafc; border-bottom: 2px solid #e2e8f0;';
		var tdStyle = 'padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle;';

		var tableContent = E('table', { 'style': tableStyle }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', { 'style': thStyle }, _('Interface')),
					E('th', { 'style': thStyle + ' text-align: center;' }, _('TCP')),
					E('th', { 'style': thStyle + ' text-align: center;' }, _('UDP')),
					E('th', { 'style': thStyle + ' text-align: center;' }, _('ICMP')),
					E('th', { 'style': thStyle + ' text-align: right;' }, _('Total Traffic')),
					E('th', { 'style': thStyle + ' text-align: center;' }, _('Status'))
				])
			]),
			E('tbody', {}, interfaceList.map(function(iface) {
				var totalPackets = iface.tcp + iface.udp + iface.icmp;
				var isActive = totalPackets > 0;

				return E('tr', { 'style': isActive ? '' : 'opacity: 0.6;' }, [
					E('td', { 'style': tdStyle }, [
						E('span', { 'style': 'display: inline-flex; align-items: center; gap: 0.5rem;' }, [
							E('i', { 'class': 'fa fa-ethernet', 'style': 'color: ' + (isActive ? '#3b82f6' : '#9ca3af') }),
							E('strong', {}, self.formatInterfaceLabel(iface.name))
						])
					]),
					E('td', { 'style': tdStyle + ' text-align: center;' }, [
						E('span', {
							'style': 'display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: #3b82f6; color: white; font-weight: 500; min-width: 3rem;'
						}, iface.tcp.toLocaleString())
					]),
					E('td', { 'style': tdStyle + ' text-align: center;' }, [
						E('span', {
							'style': 'display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: #10b981; color: white; font-weight: 500; min-width: 3rem;'
						}, iface.udp.toLocaleString())
					]),
					E('td', { 'style': tdStyle + ' text-align: center;' }, [
						E('span', {
							'style': 'display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: #f59e0b; color: white; font-weight: 500; min-width: 3rem;'
						}, iface.icmp.toLocaleString())
					]),
					E('td', { 'style': tdStyle + ' text-align: right; font-weight: 500;' },
						netifydAPI.formatBytes ? netifydAPI.formatBytes(iface.bytes) : (iface.bytes + ' B')),
					E('td', { 'style': tdStyle + ' text-align: center;' }, [
						E('span', {
							'style': 'display: inline-flex; align-items: center; gap: 0.5rem;'
						}, [
							E('i', {
								'class': 'fa fa-circle',
								'style': 'color: ' + (isActive ? '#10b981' : '#9ca3af'),
								'title': isActive ? _('Active') : _('Idle')
							}),
							iface.dropped > 0 ? E('span', {
								'style': 'padding: 0.125rem 0.5rem; border-radius: 9999px; background: #ef4444; color: white; font-size: 0.75rem;'
							}, iface.dropped + ' dropped') : null
						])
					])
				]);
			}))
		]);

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', { 'style': 'display: flex; align-items: center; margin-bottom: 0.5rem;' }, [
				E('i', { 'class': 'fa fa-network-wired', 'style': 'margin-right: 0.5rem; color: #3b82f6;' }),
				_('Flow Activity by Interface')
			]),
			E('div', { 'class': 'cbi-section-node', 'style': 'overflow-x: auto;' }, [
				tableContent
			])
		]);
	},

	renderProtocolBreakdown: function(stats) {
		if (!stats) return null;

		var self = this;

		var tcp = stats.tcp_packets || 0;
		var udp = stats.udp_packets || 0;
		var icmp = stats.icmp_packets || 0;
		var total = tcp + udp + icmp;

		if (total === 0) {
			return E('div', {
				'class': 'alert-message info',
				'style': 'text-align: center; padding: 2rem'
			}, _('No packet data available yet'));
		}

		var protocols = [
			{
				name: 'TCP',
				packets: tcp,
				percentage: self.normalizePacketPercentage(tcp, total),
				color: '#3b82f6',
				icon: 'exchange-alt'
			},
			{
				name: 'UDP',
				packets: udp,
				percentage: self.normalizePacketPercentage(udp, total),
				color: '#10b981',
				icon: 'paper-plane'
			},
			{
				name: 'ICMP',
				packets: icmp,
				percentage: self.normalizePacketPercentage(icmp, total),
				color: '#f59e0b',
				icon: 'broadcast-tower'
			}
		];

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', [
				E('i', { 'class': 'fa fa-chart-pie', 'style': 'margin-right: 0.5rem' }),
				_('Protocol Distribution')
			]),
			E('div', { 'class': 'cbi-section-node' }, [
				E('div', {
					'style': 'background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem'
				}, [
					E('div', { 'style': 'display: grid; gap: 1.5rem' }, protocols.map(function(proto) {
						return E('div', [
							E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem' }, [
								E('div', { 'style': 'display: flex; align-items: center; gap: 0.75rem' }, [
									E('i', {
										'class': 'fa fa-' + proto.icon,
										'style': 'color: ' + proto.color + '; font-size: 1.5em'
									}),
									E('div', [
										E('div', { 'style': 'font-weight: 600; color: ' + proto.color }, proto.name),
										E('div', { 'style': 'font-size: 0.85em; color: #6b7280' },
											proto.packets.toLocaleString() + ' packets')
									])
								]),
								E('div', { 'style': 'text-align: right' }, [
									E('div', { 'style': 'font-size: 1.5em; font-weight: bold; color: ' + proto.color },
										proto.percentage + '%')
								])
							]),
							E('div', { 'style': 'background: #f3f4f6; height: 12px; border-radius: 6px; overflow: hidden' }, [
								E('div', {
									'style': 'background: ' + proto.color + '; height: 100%; width: ' + proto.percentage + '%; transition: width 0.3s ease'
								})
							])
						]);
					}))
				])
			])
		]);
	},

	render: function(data) {
		var dashboard = data[0] || {};
		var status = data[1] || {};
		var stats = dashboard.stats || {};
		var interfaces = dashboard.interfaces || {};

		var self = this;

		// Create containers
		self.statsContainer = E('div');
		self.interfaceContainer = E('div');
		self.protocolContainer = E('div');

		// Set up polling
		poll.add(L.bind(function() {
			if (this.isPaused) {
				return Promise.resolve();
			}

			return Promise.all([
				netifydAPI.getDashboard(),
				netifydAPI.getServiceStatus()
			]).then(L.bind(function(result) {
				var newDashboard = result[0] || {};
				var newStats = newDashboard.stats || {};
				var newInterfaces = newDashboard.interfaces || {};

				// Update containers
				if (self.statsContainer) {
					dom.content(self.statsContainer, self.renderFlowOverview(newStats));
				}
				if (self.interfaceContainer) {
					dom.content(self.interfaceContainer, self.renderInterfaceFlows(newInterfaces, newStats));
				}
				if (self.protocolContainer) {
					dom.content(self.protocolContainer, self.renderProtocolBreakdown(newStats));
				}
			}, this));
		}, this), this.refreshInterval);

		var serviceRunning = status.running;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-netifyd/netifyd.css') }),
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem' }, [
				E('h2', { 'name': 'content', 'style': 'margin: 0' }, [
					E('i', { 'class': 'fa fa-stream', 'style': 'margin-right: 0.5rem' }),
					_('Network Flow Analytics')
				]),
				E('div', { 'style': 'display: flex; gap: 0.5rem' }, [
					E('button', {
						'class': 'btn btn-warning',
						'click': ui.createHandlerFn(this, 'handlePauseResume')
					}, [
						E('i', { 'class': 'fa fa-pause' }),
						' ',
						_('Pause')
					]),
					E('span', {
						'class': 'badge',
						'style': 'padding: 0.5rem 1rem; font-size: 0.9em; background: ' + (serviceRunning ? '#10b981' : '#ef4444')
					}, [
						E('i', { 'class': 'fa fa-circle', 'style': 'margin-right: 0.5rem' }),
						serviceRunning ? _('Live') : _('Offline')
					])
				])
			]),
			E('div', { 'class': 'cbi-map-descr' },
				_('Real-time flow statistics and protocol analysis. Updates every 3 seconds.')),

			// Service warning if not running
			!serviceRunning ? E('div', {
				'class': 'alert-message warning',
				'style': 'margin: 1rem 0'
			}, [
				E('strong', _('Netifyd service is not running')),
				E('p', _('Start the service from the Dashboard to see live flow data.'))
			]) : null,

			// Flow Overview
			E('div', { 'class': 'cbi-section' }, [
				E('h3', [
					E('i', { 'class': 'fa fa-chart-bar', 'style': 'margin-right: 0.5rem' }),
					_('Flow Overview')
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					self.statsContainer
				])
			]),

			// Interface Flows
			self.interfaceContainer,

			// Protocol Breakdown
			self.protocolContainer,

			// Information panel
			E('div', {
				'class': 'alert-message',
				'style': 'background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 1.5rem; margin-top: 1.5rem; border-radius: 8px'
			}, [
				E('h4', { 'style': 'margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.5rem' }, [
					E('i', { 'class': 'fa fa-info-circle' }),
					_('About Flow Data')
				]),
				E('p', { 'style': 'margin: 0 0 0.5rem 0; opacity: 0.95' },
					_('This view shows aggregated flow statistics from Netifyd. Individual flow details (source/destination IPs, ports) require additional sink configuration.')),
				E('p', { 'style': 'margin: 0; font-size: 0.9em; opacity: 0.9' }, [
					_('For detailed per-flow analysis, visit '),
					E('a', {
						'href': 'https://dashboard.netify.ai',
						'target': '_blank',
						'style': 'color: white; text-decoration: underline; font-weight: 600'
					}, _('Netify.ai Cloud Dashboard')),
					_(' or configure local flow export.')
				])
			])
		]);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderNetifydNav('flows'));
		wrapper.appendChild(view);
		return wrapper;
	},

	addFooter: function() {
		// Initial render - execute promise but don't return it
		Promise.all([
			netifydAPI.getDashboard()
		]).then(L.bind(function(result) {
			var dashboard = result[0] || {};
			var stats = dashboard.stats || {};
			var interfaces = dashboard.interfaces || {};

			if (this.statsContainer) {
				dom.content(this.statsContainer, this.renderFlowOverview(stats));
			}
			if (this.interfaceContainer) {
				dom.content(this.interfaceContainer, this.renderInterfaceFlows(interfaces, stats));
			}
			if (this.protocolContainer) {
				dom.content(this.protocolContainer, this.renderProtocolBreakdown(stats));
			}
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
