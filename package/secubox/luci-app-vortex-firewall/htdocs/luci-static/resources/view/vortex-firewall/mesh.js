'use strict';
'require view';
'require rpc';
'require poll';
'require ui';
'require secubox/kiss-theme';

var callMeshStatus = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'mesh_status',
	expect: {}
});

var callMeshReceived = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'mesh_received',
	params: ['limit'],
	expect: { iocs: [] }
});

var callMeshPeers = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'mesh_peers',
	expect: { peers: [] }
});

var callMeshPublish = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'mesh_publish',
	expect: {}
});

var callMeshSync = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'mesh_sync',
	expect: {}
});

function severityColor(severity) {
	var colors = {
		'critical': 'red',
		'high': 'orange',
		'medium': 'orange',
		'low': 'green'
	};
	return colors[severity] || 'muted';
}

function trustColor(trust) {
	var colors = {
		'direct': 'green',
		'transitive': 'cyan',
		'unknown': 'muted'
	};
	return colors[trust] || 'muted';
}

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callMeshStatus(),
			callMeshReceived(50),
			callMeshPeers()
		]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.enabled ? 'Active' : 'Inactive', 'Status', status.enabled ? c.green : c.red),
			KissTheme.stat(status.local_iocs || 0, 'Local IOCs', c.cyan),
			KissTheme.stat(status.received_iocs || 0, 'Received', c.orange),
			KissTheme.stat(status.applied_iocs || 0, 'Applied', c.green),
			KissTheme.stat(status.vortex_shared || 0, 'Shared', c.purple),
			KissTheme.stat(status.peer_contributors || 0, 'Peers', c.blue)
		];
	},

	renderPeers: function(peers) {
		if (!peers || peers.length === 0) return '';

		var peerCards = peers.map(function(peer) {
			return E('div', {
				'style': 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--kiss-bg); border-radius: 6px;'
			}, [
				E('div', {}, [
					E('div', { 'style': 'font-weight: 500; font-family: monospace; font-size: 0.9em;' },
						(peer.node || 'unknown').substring(0, 16) + '...'),
					E('div', { 'style': 'margin-top: 4px;' }, KissTheme.badge(peer.trust || 'unknown', trustColor(peer.trust)))
				]),
				E('div', { 'style': 'text-align: right;' }, [
					E('div', { 'style': 'font-size: 1.5em; font-weight: 600; color: var(--kiss-cyan);' },
						String(peer.ioc_count || 0)),
					E('div', { 'style': 'font-size: 0.85em; color: var(--kiss-muted);' },
						String(peer.applied_count || 0) + ' applied')
				])
			]);
		});

		return KissTheme.card('Peer Contributors',
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;' }, peerCards)
		);
	},

	renderReceivedTable: function(received) {
		if (!received || received.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' }, 'No threats received from mesh yet');
		}

		var rows = received.map(function(ioc) {
			var target = ioc.domain || ioc.ip || '-';
			var statusText = ioc.applied ? 'Applied' : 'Pending';
			var statusColor = ioc.applied ? 'green' : 'orange';

			return E('tr', {}, [
				E('td', { 'style': 'font-family: monospace; font-size: 0.9em;' }, target),
				E('td', {}, KissTheme.badge(ioc.severity || 'unknown', severityColor(ioc.severity))),
				E('td', {}, KissTheme.badge(ioc.trust || 'unknown', trustColor(ioc.trust))),
				E('td', { 'style': 'font-size: 0.9em; color: var(--kiss-muted);' }, ioc.scenario || '-'),
				E('td', {}, KissTheme.badge(statusText, statusColor))
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Target'),
					E('th', {}, 'Severity'),
					E('th', {}, 'Trust'),
					E('th', {}, 'Scenario'),
					E('th', {}, 'Status')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var received = data[1] || [];
		var peers = data[2] || [];

		// Check if mesh is available
		if (!status.available) {
			var content = [
				E('div', { 'style': 'margin-bottom: 24px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Mesh Threat Sharing')
				]),
				E('div', {
					'style': 'padding: 40px; background: var(--kiss-bg2); border-radius: 8px; text-align: center;'
				}, [
					E('p', { 'style': 'font-size: 1.2em; color: var(--kiss-muted);' },
						'Mesh threat sharing requires secubox-p2p package'),
					E('p', { 'style': 'color: var(--kiss-muted);' },
						'Install secubox-p2p to enable distributed threat intelligence')
				])
			];
			return KissTheme.wrap(content, 'admin/services/vortex-firewall/mesh');
		}

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Mesh Threat Sharing'),
					KissTheme.badge(status.enabled ? 'ACTIVE' : 'INACTIVE', status.enabled ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Decentralized threat intelligence sharing with SecuBox mesh peers')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// Actions
			KissTheme.card('Actions',
				E('div', { 'style': 'display: flex; gap: 12px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-purple',
						'click': ui.createHandlerFn(this, function() {
							return callMeshPublish().then(function(result) {
								if (result.success) {
									ui.addNotification(null, E('p', 'Published ' + result.published + ' IOCs to mesh'), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', result.message), 'error');
								}
							});
						})
					}, 'Publish to Mesh'),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': ui.createHandlerFn(this, function() {
							return callMeshSync().then(function(result) {
								if (result.success) {
									ui.addNotification(null, E('p', 'Applied ' + result.applied + ' IOCs from mesh'), 'info');
									window.location.reload();
								} else {
									ui.addNotification(null, E('p', result.message), 'error');
								}
							});
						})
					}, 'Sync from Mesh')
				])
			),

			// Peers
			this.renderPeers(peers),

			// Received Threats
			KissTheme.card('Received Threats', this.renderReceivedTable(received)),

			// Info box
			E('div', {
				'style': 'margin-top: 20px; padding: 16px; background: linear-gradient(135deg, var(--kiss-purple), var(--kiss-blue)); border-radius: 8px;'
			}, [
				E('h4', { 'style': 'margin: 0 0 8px 0; color: white;' }, 'Decentralized Threat Intelligence'),
				E('p', { 'style': 'margin: 0; opacity: 0.9; font-size: 0.9em; color: white;' },
					'Vortex domains with high confidence and hit counts are shared across the SecuBox mesh. Threats from trusted peers are automatically applied to your local blocklist.')
			])
		];

		return KissTheme.wrap(content, 'admin/services/vortex-firewall/mesh');
	}
});
