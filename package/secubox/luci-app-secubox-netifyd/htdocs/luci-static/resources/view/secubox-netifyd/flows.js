'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require secubox-netifyd/api as netifydAPI';

return view.extend({
	refreshInterval: 3,
	flowsData: [],
	statsData: {},
	isPaused: false,
	flowsContainer: null,
	statsContainer: null,
	filterProtocol: '',
	filterApplication: '',
	searchQuery: '',

	load: function() {
		return Promise.all([
			netifydAPI.getRealtimeFlows(),
			netifydAPI.getFlowStatistics()
		]);
	},

	handlePauseResume: function(ev) {
		this.isPaused = !this.isPaused;
		var btn = ev.target.closest('button');
		if (this.isPaused) {
			btn.innerHTML = '<i class="fa fa-play"></i> ' + _('Resume');
			btn.classList.remove('btn-warning');
			btn.classList.add('btn-success');
		} else {
			btn.innerHTML = '<i class="fa fa-pause"></i> ' + _('Pause');
			btn.classList.remove('btn-success');
			btn.classList.add('btn-warning');
		}
	},

	handleExport: function(format, ev) {
		ui.showModal(_('Export Flows'), [
			E('p', { 'class': 'spinning' }, _('Exporting flows to %s...').format(format.toUpperCase()))
		]);

		netifydAPI.exportFlows(format).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Flows exported to: %s').format(result.file)), 'info');
			} else {
				ui.addNotification(null, E('p', result.message || _('Export failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message)), 'error');
		});
	},

	handleClearCache: function(ev) {
		ui.showConfirmation(_('Clear Flow Cache'), _('Are you sure you want to clear the flow cache? This will remove all cached flow data.'), function() {
			netifydAPI.clearCache().then(function(result) {
				if (result.success) {
					ui.addNotification(null, E('p', result.message || _('Cache cleared')), 'info');
					window.location.reload();
				} else {
					ui.addNotification(null, E('p', result.message || _('Failed to clear cache')), 'error');
				}
			});
		}.bind(this));
	},

	filterFlows: function(flows) {
		var filtered = flows;

		// Apply protocol filter
		if (this.filterProtocol) {
			filtered = filtered.filter(function(flow) {
				return (flow.protocol || '').toLowerCase() === this.filterProtocol.toLowerCase();
			}.bind(this));
		}

		// Apply application filter
		if (this.filterApplication) {
			filtered = filtered.filter(function(flow) {
				return (flow.application || flow.app || '').toLowerCase() === this.filterApplication.toLowerCase();
			}.bind(this));
		}

		// Apply search query
		if (this.searchQuery) {
			var query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(function(flow) {
				var srcIp = (flow.ip_orig || flow.src_ip || '').toLowerCase();
				var dstIp = (flow.ip_resp || flow.dst_ip || '').toLowerCase();
				var app = (flow.application || flow.app || '').toLowerCase();
				var proto = (flow.protocol || '').toLowerCase();
				return srcIp.indexOf(query) >= 0 || dstIp.indexOf(query) >= 0 ||
				       app.indexOf(query) >= 0 || proto.indexOf(query) >= 0;
			}.bind(this));
		}

		return filtered;
	},

	renderToolbar: function(flowsData) {
		var self = this;

		// Get unique protocols and applications for filters
		var protocols = {};
		var applications = {};
		(flowsData.flows || []).forEach(function(flow) {
			var proto = flow.protocol || 'Unknown';
			var app = flow.application || flow.app || 'Unknown';
			protocols[proto] = (protocols[proto] || 0) + 1;
			applications[app] = (applications[app] || 0) + 1;
		});

		return E('div', {
			'class': 'cbi-section-node',
			'style': 'background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem'
		}, [
			E('div', {
				'style': 'display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.75rem; align-items: center'
			}, [
				// Search
				E('div', [
					E('label', { 'style': 'font-size: 0.9em; display: block; margin-bottom: 0.25rem' }, [
						E('i', { 'class': 'fa fa-search' }),
						' ',
						_('Search')
					]),
					E('input', {
						'type': 'text',
						'class': 'cbi-input-text',
						'placeholder': _('IP, app, protocol...'),
						'style': 'width: 100%',
						'value': this.searchQuery,
						'keyup': function(ev) {
							self.searchQuery = ev.target.value;
							self.updateFlowsTable();
						}
					})
				]),

				// Protocol Filter
				E('div', [
					E('label', { 'style': 'font-size: 0.9em; display: block; margin-bottom: 0.25rem' }, [
						E('i', { 'class': 'fa fa-filter' }),
						' ',
						_('Protocol')
					]),
					E('select', {
						'class': 'cbi-input-select',
						'style': 'width: 100%',
						'change': function(ev) {
							self.filterProtocol = ev.target.value;
							self.updateFlowsTable();
						}
					}, [
						E('option', { 'value': '' }, _('All Protocols')),
						Object.keys(protocols).sort().map(function(proto) {
							return E('option', { 'value': proto }, proto + ' (' + protocols[proto] + ')');
						})
					])
				]),

				// Application Filter
				E('div', [
					E('label', { 'style': 'font-size: 0.9em; display: block; margin-bottom: 0.25rem' }, [
						E('i', { 'class': 'fa fa-filter' }),
						' ',
						_('Application')
					]),
					E('select', {
						'class': 'cbi-input-select',
						'style': 'width: 100%',
						'change': function(ev) {
							self.filterApplication = ev.target.value;
							self.updateFlowsTable();
						}
					}, [
						E('option', { 'value': '' }, _('All Applications')),
						Object.keys(applications).sort().map(function(app) {
							return E('option', { 'value': app }, app + ' (' + applications[app] + ')');
						})
					])
				]),

				// Actions
				E('div', [
					E('label', { 'style': 'font-size: 0.9em; display: block; margin-bottom: 0.25rem; opacity: 0' }, '-'),
					E('div', { 'class': 'btn-group' }, [
						E('button', {
							'class': 'btn btn-sm btn-warning',
							'click': ui.createHandlerFn(this, 'handlePauseResume')
						}, [
							E('i', { 'class': 'fa fa-pause' }),
							' ',
							_('Pause')
						]),
						E('button', {
							'class': 'btn btn-sm btn-primary',
							'click': ui.createHandlerFn(this, 'handleExport', 'json')
						}, [
							E('i', { 'class': 'fa fa-download' }),
							' ',
							_('Export')
						]),
						E('button', {
							'class': 'btn btn-sm btn-danger',
							'click': ui.createHandlerFn(this, 'handleClearCache')
						}, [
							E('i', { 'class': 'fa fa-trash' })
						])
					])
				])
			]),

			// Info bar
			E('div', {
				'class': 'alert alert-info',
				'style': 'margin-top: 0.75rem; margin-bottom: 0; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap'
			}, [
				E('span', [
					E('i', { 'class': 'fa fa-circle', 'style': 'color: ' + (flowsData.source === 'socket' ? '#10b981' : '#f59e0b') }),
					' ',
					E('strong', _('Source:')),
					' ',
					flowsData.source === 'socket' ? _('Live Socket') : _('Cached Dump')
				]),
				E('span', [
					E('i', { 'class': 'fa fa-sync' }),
					' ',
					E('strong', _('Refresh:')),
					' ',
					_('Every %d seconds').format(this.refreshInterval)
				]),
				E('span', [
					E('i', { 'class': 'fa fa-database' }),
					' ',
					E('strong', _('Total Flows:')),
					' ',
					(flowsData.flows || []).length
				])
			])
		]);
	},

	renderStatsSummary: function(stats) {
		if (!stats) return null;

		var rateInMbps = ((stats.rate_bytes_in || 0) * 8 / 1000000).toFixed(2);
		var rateOutMbps = ((stats.rate_bytes_out || 0) * 8 / 1000000).toFixed(2);

		var statItems = [
			{
				label: _('Total Flows'),
				value: (stats.total_flows || 0).toString(),
				icon: 'exchange-alt',
				color: '#3b82f6'
			},
			{
				label: _('Downloaded'),
				value: netifydAPI.formatBytes(stats.total_bytes_in || 0),
				icon: 'download',
				color: '#10b981'
			},
			{
				label: _('Uploaded'),
				value: netifydAPI.formatBytes(stats.total_bytes_out || 0),
				icon: 'upload',
				color: '#f59e0b'
			},
			{
				label: _('Download Rate'),
				value: rateInMbps + ' Mbps',
				icon: 'arrow-down',
				color: '#14b8a6'
			},
			{
				label: _('Upload Rate'),
				value: rateOutMbps + ' Mbps',
				icon: 'arrow-up',
				color: '#ef4444'
			}
		];

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem'
		}, statItems.map(function(item) {
			return E('div', {
				'style': 'background: linear-gradient(135deg, ' + item.color + '22 0%, ' + item.color + '11 100%); border-left: 4px solid ' + item.color + '; padding: 1rem; border-radius: 6px'
			}, [
				E('div', { 'style': 'font-size: 0.85em; color: #6b7280; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem' }, [
					E('i', { 'class': 'fa fa-' + item.icon, 'style': 'color: ' + item.color }),
					item.label
				]),
				E('div', { 'style': 'font-size: 1.5em; font-weight: bold; color: ' + item.color }, item.value)
			]);
		}));
	},

	renderFlowsTable: function(flows) {
		if (!flows || flows.length === 0) {
			return E('div', {
				'class': 'alert-message info',
				'style': 'text-align: center; padding: 3rem'
			}, [
				E('i', { 'class': 'fa fa-stream', 'style': 'font-size: 3em; opacity: 0.3; display: block; margin-bottom: 1rem' }),
				E('h4', _('No Active Flows')),
				E('p', { 'class': 'text-muted' }, _('Waiting for network traffic to be detected...')),
				E('small', _('Make sure Netifyd service is running and capturing traffic'))
			]);
		}

		// Apply filters
		var filteredFlows = this.filterFlows(flows);

		// Limit display for performance
		var displayFlows = filteredFlows.slice(0, 200);

		return E('div', [
			E('div', { 'class': 'table', 'style': 'font-size: 0.9em' }, [
				// Header
				E('div', { 'class': 'tr table-titles' }, [
					E('div', { 'class': 'th', 'style': 'width: 18%' }, _('Source')),
					E('div', { 'class': 'th', 'style': 'width: 18%' }, _('Destination')),
					E('div', { 'class': 'th center', 'style': 'width: 12%' }, _('Protocol')),
					E('div', { 'class': 'th center', 'style': 'width: 15%' }, _('Application')),
					E('div', { 'class': 'th right', 'style': 'width: 12%' }, _('Traffic')),
					E('div', { 'class': 'th center', 'style': 'width: 10%' }, _('Packets')),
					E('div', { 'class': 'th center', 'style': 'width: 10%' }, _('Duration'))
				]),

				// Rows
				displayFlows.map(function(flow, idx) {
					var srcIp = flow.ip_orig || flow.src_ip || 'N/A';
					var dstIp = flow.ip_resp || flow.dst_ip || 'N/A';
					var srcPort = flow.port_orig || flow.src_port || '';
					var dstPort = flow.port_resp || flow.dst_port || '';
					var protocol = flow.protocol || 'Unknown';
					var application = flow.application || flow.app || 'Unknown';
					var bytes = (flow.bytes_orig || 0) + (flow.bytes_resp || 0);
					var packets = (flow.packets_orig || 0) + (flow.packets_resp || 0);
					var duration = flow.duration || 0;

					// Protocol colors
					var protoColors = {
						'TCP': '#3b82f6',
						'UDP': '#10b981',
						'ICMP': '#f59e0b',
						'HTTP': '#14b8a6',
						'HTTPS': '#8b5cf6'
					};
					var protoColor = protoColors[protocol] || '#6b7280';

					return E('div', { 'class': 'tr', 'style': idx % 2 === 0 ? 'background: #f9fafb' : '' }, [
						E('div', { 'class': 'td', 'style': 'width: 18%' }, [
							E('code', { 'style': 'font-size: 0.85em' }, srcIp),
							srcPort ? E('span', { 'class': 'text-muted', 'style': 'font-size: 0.8em' }, ':' + srcPort) : ''
						]),
						E('div', { 'class': 'td', 'style': 'width: 18%' }, [
							E('code', { 'style': 'font-size: 0.85em' }, dstIp),
							dstPort ? E('span', { 'class': 'text-muted', 'style': 'font-size: 0.8em' }, ':' + dstPort) : ''
						]),
						E('div', { 'class': 'td center', 'style': 'width: 12%' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: ' + protoColor + '; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75em'
							}, protocol)
						]),
						E('div', { 'class': 'td center', 'style': 'width: 15%' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: #6366f1; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75em'
							}, application)
						]),
						E('div', { 'class': 'td right', 'style': 'width: 12%' },
							netifydAPI.formatBytes(bytes)),
						E('div', { 'class': 'td center', 'style': 'width: 10%' },
							packets.toString()),
						E('div', { 'class': 'td center', 'style': 'width: 10%' },
							duration > 0 ? netifydAPI.formatDuration(duration) : '-')
					]);
				}.bind(this))
			]),

			// Pagination info
			filteredFlows.length > 200 ? E('div', {
				'class': 'alert alert-warning',
				'style': 'margin-top: 1rem; text-align: center'
			}, _('Showing 200 of %d flows. Use filters to narrow results.').format(filteredFlows.length)) : null,

			filteredFlows.length === 0 && flows.length > 0 ? E('div', {
				'class': 'alert alert-info',
				'style': 'margin-top: 1rem; text-align: center'
			}, _('No flows match the current filters')) : null
		]);
	},

	updateFlowsTable: function() {
		if (this.flowsContainer && this.flowsData) {
			dom.content(this.flowsContainer, this.renderFlowsTable(this.flowsData));
		}
	},

	render: function(data) {
		var flowsData = data[0] || { flows: [] };
		var statsData = data[1] || {};

		// Store data
		this.flowsData = flowsData.flows || [];
		this.statsData = statsData;

		var self = this;

		// Set up polling
		poll.add(L.bind(function() {
			if (this.isPaused) {
				return Promise.resolve();
			}

			return Promise.all([
				netifydAPI.getRealtimeFlows(),
				netifydAPI.getFlowStatistics()
			]).then(L.bind(function(result) {
				this.flowsData = (result[0] || {}).flows || [];
				this.statsData = result[1] || {};

				// Update containers
				if (self.flowsContainer) {
					dom.content(self.flowsContainer, self.renderFlowsTable(self.flowsData));
				}
				if (self.statsContainer) {
					dom.content(self.statsContainer, self.renderStatsSummary(self.statsData));
				}
			}, this));
		}, this), this.refreshInterval);

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'name': 'content' }, [
				E('i', { 'class': 'fa fa-stream', 'style': 'margin-right: 0.5rem' }),
				_('Real-Time Network Flows')
			]),
			E('div', { 'class': 'cbi-map-descr' },
				_('Live monitoring of network flows detected by Netifyd DPI engine with filtering and search capabilities')),

			// Information banner when no flow data
			(!this.flowsData || this.flowsData.length === 0) ? E('div', {
				'class': 'alert-message',
				'style': 'background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 1.5rem; margin: 1rem 0; border-radius: 8px'
			}, [
				E('div', { 'style': 'display: flex; align-items: flex-start; gap: 1rem' }, [
					E('i', { 'class': 'fa fa-info-circle', 'style': 'font-size: 2em; margin-top: 0.25rem' }),
					E('div', { 'style': 'flex: 1' }, [
						E('h4', { 'style': 'margin: 0 0 0.5rem 0; font-size: 1.1em' }, _('Detailed Flow Data Not Available')),
						E('p', { 'style': 'margin: 0 0 0.75rem 0; opacity: 0.95' },
							_('Netifyd is tracking flows but detailed flow information is not being exported to SecuBox dashboard. Flow count and statistics are available, but individual flow details (IPs, protocols, bytes) are not.')),
						E('p', { 'style': 'margin: 0; font-size: 0.9em' }, [
							E('strong', _('Options:')),
							E('br'),
							_('1. Access full flow details via '),
							E('a', {
								'href': 'https://dashboard.netify.ai',
								'target': '_blank',
								'style': 'color: white; text-decoration: underline'
							}, _('Netify.ai Cloud Dashboard')),
							E('br'),
							_('2. Configure local flow export (see '),
							E('code', { 'style': 'background: rgba(0,0,0,0.2); padding: 0.2rem 0.4rem; border-radius: 3px' }, 'README-FLOW-DATA.md'),
							_(' for instructions)')
						])
					])
				])
			]) : null,

			E('div', { 'class': 'cbi-section' }, [
				this.renderToolbar(flowsData)
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', [
					E('i', { 'class': 'fa fa-chart-bar', 'style': 'margin-right: 0.5rem' }),
					_('Flow Statistics')
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					self.statsContainer = E('div')
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', [
					E('i', { 'class': 'fa fa-list', 'style': 'margin-right: 0.5rem' }),
					_('Active Flows'),
					' ',
					E('span', {
						'class': 'badge',
						'style': 'background: #3b82f6; color: white; margin-left: 0.5rem'
					}, this.flowsData.length)
				]),
				E('div', { 'class': 'cbi-section-node' }, [
					self.flowsContainer = E('div')
				])
			])
		]);
	},

	addFooter: function() {
		// Initial render of dynamic containers
		if (this.statsContainer) {
			dom.content(this.statsContainer, this.renderStatsSummary(this.statsData));
		}
		if (this.flowsContainer) {
			dom.content(this.flowsContainer, this.renderFlowsTable(this.flowsData));
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
