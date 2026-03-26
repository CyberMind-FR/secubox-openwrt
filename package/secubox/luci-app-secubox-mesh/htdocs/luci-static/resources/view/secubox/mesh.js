'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callMeshStatus = rpc.declare({
	object: 'luci.secubox-mesh',
	method: 'status',
	expect: {}
});

var callMeshPeers = rpc.declare({
	object: 'luci.secubox-mesh',
	method: 'peers',
	expect: {}
});

var callNodeInfo = rpc.declare({
	object: 'luci.secubox-mesh',
	method: 'node_info',
	expect: {}
});

var callTelemetry = rpc.declare({
	object: 'luci.secubox-mesh',
	method: 'telemetry',
	expect: {}
});

var callGetConfig = rpc.declare({
	object: 'luci.secubox-mesh',
	method: 'get_config',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.secubox-mesh',
	method: 'restart',
	expect: {}
});

var callNodeRotate = rpc.declare({
	object: 'luci.secubox-mesh',
	method: 'node_rotate',
	expect: {}
});

function formatUptime(seconds) {
	if (!seconds || seconds < 0) return '0s';
	var days = Math.floor(seconds / 86400);
	var hours = Math.floor((seconds % 86400) / 3600);
	var mins = Math.floor((seconds % 3600) / 60);
	var secs = seconds % 60;
	var parts = [];
	if (days > 0) parts.push(days + 'd');
	if (hours > 0) parts.push(hours + 'h');
	if (mins > 0) parts.push(mins + 'm');
	if (secs > 0 || parts.length === 0) parts.push(secs + 's');
	return parts.join(' ');
}

function formatBytes(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var units = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(1024));
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function createGauge(label, value, max, color) {
	var pct = Math.min(100, Math.max(0, (value / max) * 100));
	var gaugeColor = pct > 80 ? '#ff4444' : (pct > 60 ? '#ffaa00' : color);

	return E('div', { 'class': 'mesh-gauge' }, [
		E('div', { 'class': 'mesh-gauge-label' }, label),
		E('div', { 'class': 'mesh-gauge-bar' }, [
			E('div', {
				'class': 'mesh-gauge-fill',
				'style': 'width: ' + pct + '%; background: ' + gaugeColor
			})
		]),
		E('div', { 'class': 'mesh-gauge-value' }, value + '%')
	]);
}

function createStatCard(title, items) {
	var content = items.map(function(item) {
		return E('div', { 'class': 'mesh-stat-row' }, [
			E('span', { 'class': 'mesh-stat-label' }, item.label + ':'),
			E('span', { 'class': 'mesh-stat-value', 'style': item.color ? 'color: ' + item.color : '' }, item.value)
		]);
	});

	return E('div', { 'class': 'mesh-card' }, [
		E('div', { 'class': 'mesh-card-header' }, title),
		E('div', { 'class': 'mesh-card-body' }, content)
	]);
}

return view.extend({
	load: function() {
		return Promise.all([
			callMeshStatus().catch(function() { return {}; }),
			callNodeInfo().catch(function() { return {}; }),
			callTelemetry().catch(function() { return {}; }),
			callMeshPeers().catch(function() { return []; }),
			callGetConfig().catch(function() { return {}; })
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var nodeInfo = data[1] || {};
		var telemetry = data[2] || {};
		var peers = data[3] || [];
		var config = data[4] || {};

		// Ensure peers is an array
		if (!Array.isArray(peers)) {
			peers = [];
		}

		var view = E('div', { 'class': 'mesh-dashboard' }, [
			E('style', {}, [
				'.mesh-dashboard { padding: 20px; }',
				'.mesh-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }',
				'.mesh-header h2 { margin: 0; color: var(--cyber-text-primary, #33ff66); }',
				'.mesh-status-badge { padding: 6px 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }',
				'.mesh-status-running { background: rgba(51, 255, 102, 0.2); color: #33ff66; border: 1px solid #33ff66; }',
				'.mesh-status-stopped { background: rgba(255, 68, 68, 0.2); color: #ff4444; border: 1px solid #ff4444; }',
				'.mesh-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }',
				'.mesh-card { background: var(--cyber-bg-card, rgba(10, 25, 20, 0.9)); border: 1px solid var(--cyber-border, #1a4a3a); border-radius: 8px; overflow: hidden; }',
				'.mesh-card-header { padding: 12px 16px; background: var(--cyber-bg-header, rgba(51, 255, 102, 0.1)); border-bottom: 1px solid var(--cyber-border, #1a4a3a); font-weight: bold; color: var(--cyber-text-primary, #33ff66); }',
				'.mesh-card-body { padding: 16px; }',
				'.mesh-stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--cyber-border-dim, rgba(51, 255, 102, 0.1)); }',
				'.mesh-stat-row:last-child { border-bottom: none; }',
				'.mesh-stat-label { color: var(--cyber-text-secondary, #88aa99); }',
				'.mesh-stat-value { color: var(--cyber-text-primary, #33ff66); font-family: monospace; word-break: break-all; max-width: 60%; text-align: right; }',
				'.mesh-gauge { margin: 12px 0; }',
				'.mesh-gauge-label { font-size: 12px; color: var(--cyber-text-secondary, #88aa99); margin-bottom: 4px; }',
				'.mesh-gauge-bar { height: 8px; background: var(--cyber-bg-darker, #0a1510); border-radius: 4px; overflow: hidden; }',
				'.mesh-gauge-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }',
				'.mesh-gauge-value { font-size: 14px; font-weight: bold; margin-top: 4px; color: var(--cyber-text-primary, #33ff66); }',
				'.mesh-actions { display: flex; gap: 10px; margin-top: 16px; }',
				'.mesh-btn { padding: 8px 16px; border: 1px solid var(--cyber-border, #1a4a3a); background: var(--cyber-bg-card, rgba(10, 25, 20, 0.9)); color: var(--cyber-text-primary, #33ff66); border-radius: 4px; cursor: pointer; transition: all 0.2s; }',
				'.mesh-btn:hover { background: rgba(51, 255, 102, 0.2); border-color: #33ff66; }',
				'.mesh-btn-danger { border-color: #ff4444; color: #ff4444; }',
				'.mesh-btn-danger:hover { background: rgba(255, 68, 68, 0.2); }',
				'.mesh-peers-table { width: 100%; border-collapse: collapse; }',
				'.mesh-peers-table th, .mesh-peers-table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--cyber-border-dim, rgba(51, 255, 102, 0.1)); }',
				'.mesh-peers-table th { color: var(--cyber-text-secondary, #88aa99); font-weight: normal; text-transform: uppercase; font-size: 11px; }',
				'.mesh-peers-table td { font-family: monospace; color: var(--cyber-text-primary, #33ff66); }',
				'.mesh-empty { text-align: center; padding: 40px; color: var(--cyber-text-secondary, #88aa99); }',
				'.mesh-network-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }',
				'.mesh-net-stat { text-align: center; padding: 12px; background: var(--cyber-bg-darker, rgba(5, 15, 10, 0.5)); border-radius: 4px; }',
				'.mesh-net-stat-value { font-size: 18px; font-weight: bold; color: var(--cyber-text-primary, #33ff66); }',
				'.mesh-net-stat-label { font-size: 11px; color: var(--cyber-text-secondary, #88aa99); margin-top: 4px; }'
			]),

			E('div', { 'class': 'mesh-header' }, [
				E('h2', {}, 'SecuBox Mesh Network'),
				E('span', {
					'class': 'mesh-status-badge ' + (status.state === 'running' ? 'mesh-status-running' : 'mesh-status-stopped')
				}, status.state || 'unknown')
			]),

			E('div', { 'class': 'mesh-grid', 'id': 'mesh-cards' }, [
				// Node Identity Card
				createStatCard('Node Identity', [
					{ label: 'DID', value: nodeInfo.did || status.did || '-' },
					{ label: 'Role', value: (config.role || status.role || 'edge').toUpperCase(), color: config.role === 'relay' ? '#00aaff' : '#33ff66' },
					{ label: 'Mesh Gate', value: status.mesh_gate || nodeInfo.mesh_gate || 'None' },
					{ label: 'Daemon Uptime', value: formatUptime(status.uptime) }
				]),

				// Telemetry Card
				E('div', { 'class': 'mesh-card' }, [
					E('div', { 'class': 'mesh-card-header' }, 'System Telemetry'),
					E('div', { 'class': 'mesh-card-body' }, [
						createGauge('CPU', telemetry.cpu_percent || 0, 100, '#33ff66'),
						createGauge('Memory', telemetry.memory_percent || 0, 100, '#00aaff'),
						createGauge('Disk', telemetry.disk_percent || 0, 100, '#ffaa00'),
						E('div', { 'class': 'mesh-stat-row' }, [
							E('span', { 'class': 'mesh-stat-label' }, 'Temperature:'),
							E('span', { 'class': 'mesh-stat-value' }, (telemetry.temperature || 0) + '°C')
						]),
						E('div', { 'class': 'mesh-stat-row' }, [
							E('span', { 'class': 'mesh-stat-label' }, 'Load Average:'),
							E('span', { 'class': 'mesh-stat-value' }, (telemetry.load_avg || 0).toFixed(2))
						]),
						E('div', { 'class': 'mesh-stat-row' }, [
							E('span', { 'class': 'mesh-stat-label' }, 'System Uptime:'),
							E('span', { 'class': 'mesh-stat-value' }, formatUptime(telemetry.uptime))
						])
					])
				]),

				// Network Stats Card
				E('div', { 'class': 'mesh-card' }, [
					E('div', { 'class': 'mesh-card-header' }, 'Network'),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-network-stats' }, [
							E('div', { 'class': 'mesh-net-stat' }, [
								E('div', { 'class': 'mesh-net-stat-value' }, formatBytes((telemetry.network || {}).rx_bytes || 0)),
								E('div', { 'class': 'mesh-net-stat-label' }, 'RX Total')
							]),
							E('div', { 'class': 'mesh-net-stat' }, [
								E('div', { 'class': 'mesh-net-stat-value' }, formatBytes((telemetry.network || {}).tx_bytes || 0)),
								E('div', { 'class': 'mesh-net-stat-label' }, 'TX Total')
							]),
							E('div', { 'class': 'mesh-net-stat' }, [
								E('div', { 'class': 'mesh-net-stat-value' }, (telemetry.connections || {}).tcp || 0),
								E('div', { 'class': 'mesh-net-stat-label' }, 'TCP Connections')
							]),
							E('div', { 'class': 'mesh-net-stat' }, [
								E('div', { 'class': 'mesh-net-stat-value' }, (telemetry.wireguard || {}).peers || 0),
								E('div', { 'class': 'mesh-net-stat-label' }, 'WireGuard Peers')
							])
						])
					])
				]),

				// Configuration Card
				E('div', { 'class': 'mesh-card' }, [
					E('div', { 'class': 'mesh-card-header' }, 'Configuration'),
					E('div', { 'class': 'mesh-card-body' }, [
						E('div', { 'class': 'mesh-stat-row' }, [
							E('span', { 'class': 'mesh-stat-label' }, 'Enabled:'),
							E('span', { 'class': 'mesh-stat-value' }, config.enabled ? 'Yes' : 'No')
						]),
						E('div', { 'class': 'mesh-stat-row' }, [
							E('span', { 'class': 'mesh-stat-label' }, 'Subnet:'),
							E('span', { 'class': 'mesh-stat-value' }, config.subnet || '10.42.0.0/16')
						]),
						E('div', { 'class': 'mesh-stat-row' }, [
							E('span', { 'class': 'mesh-stat-label' }, 'Beacon Interval:'),
							E('span', { 'class': 'mesh-stat-value' }, (config.beacon_interval || 30) + 's')
						]),
						E('div', { 'class': 'mesh-actions' }, [
							E('button', {
								'class': 'mesh-btn',
								'click': ui.createHandlerFn(this, function() {
									return callRestart().then(function() {
										ui.addNotification(null, E('p', 'Mesh daemon restarted'), 'success');
									}).catch(function(e) {
										ui.addNotification(null, E('p', 'Failed to restart: ' + e.message), 'error');
									});
								})
							}, 'Restart Daemon'),
							E('button', {
								'class': 'mesh-btn mesh-btn-danger',
								'click': ui.createHandlerFn(this, function() {
									if (!confirm('Rotate node keys? This will generate a new identity.')) return;
									return callNodeRotate().then(function(res) {
										if (res && res.success) {
											ui.addNotification(null, E('p', 'Keys rotated. New expiry: ' + (res.new_expiry || 'unknown')), 'success');
										} else {
											ui.addNotification(null, E('p', 'Key rotation failed: ' + (res.error || 'unknown error')), 'error');
										}
									}).catch(function(e) {
										ui.addNotification(null, E('p', 'Failed to rotate keys: ' + e.message), 'error');
									});
								})
							}, 'Rotate Keys')
						])
					])
				])
			]),

			// Peers Table
			E('div', { 'class': 'mesh-card' }, [
				E('div', { 'class': 'mesh-card-header' }, 'Connected Peers (' + peers.length + ')'),
				E('div', { 'class': 'mesh-card-body', 'id': 'mesh-peers' },
					peers.length > 0 ? [
						E('table', { 'class': 'mesh-peers-table' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'DID'),
									E('th', {}, 'Address'),
									E('th', {}, 'Role'),
									E('th', {}, 'Last Seen')
								])
							]),
							E('tbody', {}, peers.map(function(peer) {
								return E('tr', {}, [
									E('td', {}, peer.did || '-'),
									E('td', {}, peer.address || '-'),
									E('td', {}, (peer.role || 'edge').toUpperCase()),
									E('td', {}, peer.last_seen || '-')
								]);
							}))
						])
					] : [
						E('div', { 'class': 'mesh-empty' }, 'No peers connected')
					]
				)
			])
		]);

		// Set up polling for live updates
		poll.add(L.bind(function() {
			return Promise.all([
				callMeshStatus().catch(function() { return {}; }),
				callTelemetry().catch(function() { return {}; }),
				callMeshPeers().catch(function() { return []; })
			]).then(L.bind(function(data) {
				var status = data[0] || {};
				var telemetry = data[1] || {};
				var peers = data[2] || [];

				if (!Array.isArray(peers)) peers = [];

				// Update status badge
				var badge = document.querySelector('.mesh-status-badge');
				if (badge) {
					badge.textContent = status.state || 'unknown';
					badge.className = 'mesh-status-badge ' + (status.state === 'running' ? 'mesh-status-running' : 'mesh-status-stopped');
				}

			}, this));
		}, this), 10);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
