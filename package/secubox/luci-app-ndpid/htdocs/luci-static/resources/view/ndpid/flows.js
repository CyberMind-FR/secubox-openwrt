'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require ndpid.api as api';

return view.extend({
	title: _('nDPId Flows'),
	pollInterval: 3,
	pollActive: true,

	load: function() {
		return Promise.all([
			api.getRealtimeFlows(),
			api.getInterfaceStats(),
			api.getTopProtocols()
		]).then(function(results) {
			return {
				flows: results[0],
				interfaces: results[1],
				protocols: results[2]
			};
		});
	},

	updateFlows: function(data) {
		var flows = data.flows || {};

		// Update flow counts
		var activeEl = document.querySelector('.ndpi-flows-active');
		var totalEl = document.querySelector('.ndpi-flows-total');

		if (activeEl) {
			var newActive = api.formatNumber(flows.flows_active || 0);
			if (activeEl.textContent !== newActive) {
				activeEl.textContent = newActive;
				activeEl.classList.add('ndpi-value-updated');
				setTimeout(function() { activeEl.classList.remove('ndpi-value-updated'); }, 500);
			}
		}

		if (totalEl) {
			var newTotal = api.formatNumber(flows.flow_count || 0);
			if (totalEl.textContent !== newTotal) {
				totalEl.textContent = newTotal;
			}
		}

		// Update interface stats
		var interfaces = (data.interfaces || {}).interfaces || [];
		interfaces.forEach(function(iface) {
			var row = document.querySelector('.ndpi-iface-row[data-iface="' + iface.name + '"]');
			if (!row) return;

			row.querySelector('.ndpi-iface-tcp').textContent = api.formatNumber(iface.tcp);
			row.querySelector('.ndpi-iface-udp').textContent = api.formatNumber(iface.udp);
			row.querySelector('.ndpi-iface-icmp').textContent = api.formatNumber(iface.icmp);
			row.querySelector('.ndpi-iface-bytes').textContent = api.formatBytes(iface.ip_bytes);
		});
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return Promise.all([
				api.getRealtimeFlows(),
				api.getInterfaceStats()
			]).then(L.bind(function(results) {
				this.updateFlows({
					flows: results[0],
					interfaces: results[1]
				});
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	render: function(data) {
		var self = this;
		var flows = data.flows || {};
		var interfaces = (data.interfaces || {}).interfaces || [];
		var protocols = (data.protocols || {}).protocols || [];

		// Calculate protocol totals
		var totalPackets = protocols.reduce(function(sum, p) { return sum + (p.count || 0); }, 0);

		var view = E('div', { 'class': 'ndpid-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('ndpid/dashboard.css') }),

			// Header
			E('div', { 'class': 'ndpi-header' }, [
				E('div', { 'class': 'ndpi-logo' }, [
					E('div', { 'class': 'ndpi-logo-icon' }, '📊'),
					E('div', { 'class': 'ndpi-logo-text' }, ['Flow ', E('span', {}, 'Statistics')])
				])
			]),

			// Flow Summary
			E('div', { 'class': 'ndpi-quick-stats' }, [
				E('div', { 'class': 'ndpi-quick-stat', 'style': '--stat-gradient: linear-gradient(135deg, #10b981, #34d399)' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '✅'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Active Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-flows-active' },
						api.formatNumber(flows.flows_active || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Currently tracked')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '📊'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Total Flows')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value ndpi-flows-total' },
						api.formatNumber(flows.flow_count || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Since service start')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '📦'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Total Packets')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value' },
						api.formatNumber(totalPackets)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'TCP + UDP + ICMP')
				]),
				E('div', { 'class': 'ndpi-quick-stat' }, [
					E('div', { 'class': 'ndpi-quick-stat-header' }, [
						E('span', { 'class': 'ndpi-quick-stat-icon' }, '⏱'),
						E('span', { 'class': 'ndpi-quick-stat-label' }, 'Uptime')
					]),
					E('div', { 'class': 'ndpi-quick-stat-value' },
						api.formatUptime(flows.uptime || 0)),
					E('div', { 'class': 'ndpi-quick-stat-sub' }, 'Service runtime')
				])
			]),

			// Interface Statistics Table
			E('div', { 'class': 'ndpi-card' }, [
				E('div', { 'class': 'ndpi-card-header' }, [
					E('div', { 'class': 'ndpi-card-title' }, [
						E('span', { 'class': 'ndpi-card-title-icon' }, '🌐'),
						'Per-Interface Statistics'
					]),
					E('div', { 'class': 'ndpi-card-badge' },
						interfaces.length + ' interface' + (interfaces.length !== 1 ? 's' : ''))
				]),
				E('div', { 'class': 'ndpi-card-body' },
					interfaces.length > 0 ?
					E('div', { 'class': 'ndpi-table-container' }, [
						E('table', { 'class': 'ndpi-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'Interface'),
									E('th', {}, 'TCP'),
									E('th', {}, 'UDP'),
									E('th', {}, 'ICMP'),
									E('th', {}, 'Total Bytes')
								])
							]),
							E('tbody', {},
								interfaces.map(function(iface) {
									return E('tr', { 'class': 'ndpi-iface-row', 'data-iface': iface.name }, [
										E('td', {}, [
											E('span', { 'class': 'ndpi-app-name' }, iface.name)
										]),
										E('td', { 'class': 'mono ndpi-iface-tcp' }, api.formatNumber(iface.tcp)),
										E('td', { 'class': 'mono ndpi-iface-udp' }, api.formatNumber(iface.udp)),
										E('td', { 'class': 'mono ndpi-iface-icmp' }, api.formatNumber(iface.icmp)),
										E('td', { 'class': 'mono ndpi-iface-bytes' }, api.formatBytes(iface.ip_bytes))
									]);
								})
							)
						])
					]) :
					E('div', { 'class': 'ndpi-empty' }, [
						E('div', { 'class': 'ndpi-empty-icon' }, '📊'),
						E('div', { 'class': 'ndpi-empty-text' }, 'No interface statistics available')
					])
				)
			]),

			// Protocol Breakdown
			E('div', { 'class': 'ndpi-card' }, [
				E('div', { 'class': 'ndpi-card-header' }, [
					E('div', { 'class': 'ndpi-card-title' }, [
						E('span', { 'class': 'ndpi-card-title-icon' }, '📡'),
						'Protocol Breakdown'
					])
				]),
				E('div', { 'class': 'ndpi-card-body' },
					protocols.length > 0 ?
					E('div', { 'class': 'ndpi-protocol-grid' },
						protocols.map(function(proto) {
							var pct = totalPackets > 0 ? Math.round((proto.count / totalPackets) * 100) : 0;
							var color = proto.name === 'TCP' ? '#0ea5e9' :
								proto.name === 'UDP' ? '#10b981' : '#f59e0b';
							return E('div', { 'class': 'ndpi-protocol-item' }, [
								E('div', { 'class': 'ndpi-protocol-header' }, [
									E('span', { 'class': 'ndpi-protocol-name' }, proto.name),
									E('span', { 'class': 'ndpi-protocol-count' }, api.formatNumber(proto.count))
								]),
								E('div', { 'class': 'ndpi-protocol-bar' }, [
									E('div', {
										'class': 'ndpi-protocol-bar-fill',
										'style': 'width: ' + pct + '%; background: ' + color
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
