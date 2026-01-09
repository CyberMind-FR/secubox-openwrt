'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require ndpid.api as api';

return view.extend({
	title: _('nDPId Dashboard'),
	pollInterval: 5,
	pollActive: true,

	load: function() {
		return api.getAllData();
	},

	updateDashboard: function(data) {
		var dashboard = data.dashboard || {};
		var service = dashboard.service || {};
		var flows = dashboard.flows || {};
		var system = dashboard.system || {};

		// Update service status
		var statusBadge = document.querySelector('.ndpi-status-badge');
		if (statusBadge) {
			statusBadge.classList.toggle('running', service.running);
			statusBadge.classList.toggle('stopped', !service.running);
			statusBadge.innerHTML = '<span class="ndpi-status-dot"></span>' +
				(service.running ? 'Running' : 'Stopped');
		}

		// Update flow counts
		var updates = [
			{ sel: '.ndpi-stat-flows-total', val: api.formatNumber(flows.total) },
			{ sel: '.ndpi-stat-flows-active', val: api.formatNumber(flows.active) },
			{ sel: '.ndpi-stat-memory', val: api.formatBytes(system.memory_kb * 1024) }
		];

		updates.forEach(function(u) {
			var el = document.querySelector(u.sel);
			if (el && el.textContent !== u.val) {
				el.textContent = u.val;
				el.classList.add('ndpi-value-updated');
				setTimeout(function() { el.classList.remove('ndpi-value-updated'); }, 500);
			}
		});

		// Update interface stats
		var interfaces = (data.interfaces || {}).interfaces || [];
		interfaces.forEach(function(iface) {
			var card = document.querySelector('.ndpi-iface-card[data-iface="' + iface.name + '"]');
			if (!card) return;

			var tcpEl = card.querySelector('.ndpi-iface-tcp');
			var udpEl = card.querySelector('.ndpi-iface-udp');
			var bytesEl = card.querySelector('.ndpi-iface-bytes');

			if (tcpEl) tcpEl.textContent = api.formatNumber(iface.tcp);
			if (udpEl) udpEl.textContent = api.formatNumber(iface.udp);
			if (bytesEl) bytesEl.textContent = api.formatBytes(iface.ip_bytes);
		});
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getAllData().then(L.bind(function(data) {
				this.updateDashboard(data);
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	handleServiceControl: function(action) {
		var self = this;

		ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Processing request...'))
		]);

		var promise;
		switch (action) {
			case 'start':
				promise = api.serviceStart();
				break;
			case 'stop':
				promise = api.serviceStop();
				break;
			case 'restart':
				promise = api.serviceRestart();
				break;
			default:
				ui.hideModal();
				return;
		}

		promise.then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || _('Operation completed')), 'info');
			} else {
				ui.addNotification(null, E('p', {}, result.message || _('Operation failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, _('Error: ') + err.message), 'error');
		});
	},

	render: function(data) {
		var self = this;
		var dashboard = data.dashboard || {};
		var service = dashboard.service || {};
		var flows = dashboard.flows || {};
		var system = dashboard.system || {};
		var interfaces = (data.interfaces || {}).interfaces || [];
		var applications = (data.applications || {}).applications || [];
		var protocols = (data.protocols || {}).protocols || [];

		var view = E('div', { 'class': 'ndpid-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('ndpid/dashboard.css') }),

			// Header
			E('div', { 'class': 'ndpi-header' }, [
				E('div', { 'class': 'ndpi-logo' }, [
					E('div', { 'class': 'ndpi-logo-icon' }, '🔍'),
					E('div', { 'class': 'ndpi-logo-text' }, ['nDPI', E('span', {}, 'd')])
				]),
				E('div', { 'class': 'ndpi-header-info' }, [
					E('div', {
						'class': 'ndpi-status-badge ' + (service.running ? 'running' : 'stopped')
					}, [
						E('span', { 'class': 'ndpi-status-dot' }),
						service.running ? 'Running' : 'Stopped'
					]),
					E('span', { 'class': 'ndpi-version' }, 'v' + (service.version || '1.7'))
				])
			]),

			// Service controls
			E('div', { 'class': 'ndpi-controls' }, [
				E('button', {
					'class': 'ndpi-btn ndpi-btn-success',
					'click': function() { self.handleServiceControl('start'); },
					'disabled': service.running
				}, '▶ Start'),
				E('button', {
					'class': 'ndpi-btn ndpi-btn-danger',
					'click': function() { self.handleServiceControl('stop'); },
					'disabled': !service.running
				}, '⏹ Stop'),
				E('button', {
					'class': 'ndpi-btn ndpi-btn-primary',
					'click': function() { self.handleServiceControl('restart'); }
				}, '🔄 Restart'),
				E('div', { 'style': 'flex: 1' }),
				E('span', { 'class': 'ndpi-refresh-status' }, [
					E('span', { 'class': 'ndpi-refresh-dot active' }),
					' Auto-refresh: ',
					E('span', { 'class': 'ndpi-refresh-state' }, 'Active')
				]),
				E('button', {
					'class': 'ndpi-btn ndpi-btn-sm',
					'id': 'ndpi-poll-toggle',
					'click': L.bind(function(ev) {
						var btn = ev.target;
						var indicator = document.querySelector('.ndpi-refresh-dot');
						var state = document.querySelector('.ndpi-refresh-state');
						if (this.pollActive) {
							this.stopPolling();
							btn.textContent = '▶ Resume';
							indicator.classList.remove('active');
							state.textContent = 'Paused';
						} else {
							this.startPolling();
							btn.textContent = '⏸ Pause';
							indicator.classList.add('active');
							state.textContent = 'Active';
						}
					}, this)
				}, '⏸ Pause')
			]),

			// Quick Stats
			E('div', { 'class': 'ndpi-quick-stats' }, [
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '📊'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Total Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-stat-flows-total' },
						api.formatNumber(flows.total || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Detected since start')
				]),
				E('div', { 'class': 'ndpi-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #34d399)' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '✅'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Active Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-stat-flows-active' },
						api.formatNumber(flows.active || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Currently tracked')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '🖥'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Memory')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-stat-memory' },
						api.formatBytes((system.memory_kb || 0) * 1024)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Process memory')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '🌐'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Interfaces')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value' },
						(dashboard.interfaces || []).length),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Monitored')
				])
			]),

			// Interface Statistics
			E('div', { 'class': 'ndpi-card' }, [
				E('div', { 'class': 'ndpi-card-header' }, [
					E('div', { 'class': 'ndpi-card-title' }, [
						E('span', { 'class': 'ndpi-card-title-icon' }, '🔗'),
						'Interface Statistics'
					]),
					E('div', { 'class': 'ndpi-card-badge' },
						interfaces.length + ' interface' + (interfaces.length !== 1 ? 's' : ''))
				]),
				E('div', { 'class': 'ndpi-card-body' },
					interfaces.length > 0 ?
					E('div', { 'class': 'ndpi-iface-grid' },
						interfaces.map(function(iface) {
							return E('div', { 'class': 'ndpi-iface-card', 'data-iface': iface.name }, [
								E('div', { 'class': 'ndpi-iface-header' }, [
									E('div', { 'class': 'ndpi-iface-icon' }, '🌐'),
									E('div', { 'class': 'ndpi-iface-name' }, iface.name)
								]),
								E('div', { 'class': 'ndpi-iface-stats' }, [
									E('div', { 'class': 'ndpi-iface-stat' }, [
										E('span', { 'class': 'ndpi-iface-stat-label' }, 'TCP'),
										E('span', { 'class': 'ndpi-iface-stat-value ndpi-iface-tcp' },
											api.formatNumber(iface.tcp))
									]),
									E('div', { 'class': 'ndpi-iface-stat' }, [
										E('span', { 'class': 'ndpi-iface-stat-label' }, 'UDP'),
										E('span', { 'class': 'ndpi-iface-stat-value ndpi-iface-udp' },
											api.formatNumber(iface.udp))
									]),
									E('div', { 'class': 'ndpi-iface-stat' }, [
										E('span', { 'class': 'ndpi-iface-stat-label' }, 'Bytes'),
										E('span', { 'class': 'ndpi-iface-stat-value ndpi-iface-bytes' },
											api.formatBytes(iface.ip_bytes))
									])
								])
							]);
						})
					) :
					E('div', { 'class': 'ndpi-empty' }, [
						E('div', { 'class': 'ndpi-empty-icon' }, '📡'),
						E('div', { 'class': 'ndpi-empty-text' }, 'No interface statistics available'),
						E('p', {}, 'Start the nDPId service to begin monitoring')
					])
				)
			]),

			// Top Applications
			E('div', { 'class': 'ndpi-card' }, [
				E('div', { 'class': 'ndpi-card-header' }, [
					E('div', { 'class': 'ndpi-card-title' }, [
						E('span', { 'class': 'ndpi-card-title-icon' }, '📱'),
						'Top Applications'
					])
				]),
				E('div', { 'class': 'ndpi-card-body' },
					applications.length > 0 ?
					E('div', { 'class': 'ndpi-table-container' }, [
						E('table', { 'class': 'ndpi-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'Application'),
									E('th', {}, 'Flows'),
									E('th', {}, 'Traffic')
								])
							]),
							E('tbody', {},
								applications.map(function(app) {
									return E('tr', {}, [
										E('td', {}, [
											E('span', { 'class': 'ndpi-app-name' }, app.name || 'unknown')
										]),
										E('td', { 'class': 'mono' }, api.formatNumber(app.flows)),
										E('td', { 'class': 'mono' }, api.formatBytes(app.bytes))
									]);
								})
							)
						])
					]) :
					E('div', { 'class': 'ndpi-empty' }, [
						E('div', { 'class': 'ndpi-empty-icon' }, '📱'),
						E('div', { 'class': 'ndpi-empty-text' }, 'No applications detected yet')
					])
				)
			]),

			// Top Protocols
			E('div', { 'class': 'ndpi-card' }, [
				E('div', { 'class': 'ndpi-card-header' }, [
					E('div', { 'class': 'ndpi-card-title' }, [
						E('span', { 'class': 'ndpi-card-title-icon' }, '📡'),
						'Protocol Distribution'
					])
				]),
				E('div', { 'class': 'ndpi-card-body' },
					protocols.length > 0 ?
					E('div', { 'class': 'ndpi-protocol-grid' },
						protocols.map(function(proto) {
							var total = protocols.reduce(function(sum, p) { return sum + (p.count || 0); }, 0);
							var pct = total > 0 ? Math.round((proto.count / total) * 100) : 0;
							return E('div', { 'class': 'ndpi-protocol-item' }, [
								E('div', { 'class': 'ndpi-protocol-header' }, [
									E('span', { 'class': 'ndpi-protocol-name' }, proto.name),
									E('span', { 'class': 'ndpi-protocol-count' }, api.formatNumber(proto.count))
								]),
								E('div', { 'class': 'ndpi-protocol-bar' }, [
									E('div', {
										'class': 'ndpi-protocol-bar-fill',
										'style': 'width: ' + pct + '%'
									})
								]),
								E('div', { 'class': 'ndpi-protocol-pct' }, pct + '%')
							]);
						})
					) :
					E('div', { 'class': 'ndpi-empty' }, [
						E('div', { 'class': 'ndpi-empty-icon' }, '📡'),
						E('div', { 'class': 'ndpi-empty-text' }, 'No protocol data available')
					])
				)
			])
		]);

		// Start polling
		this.startPolling();

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
