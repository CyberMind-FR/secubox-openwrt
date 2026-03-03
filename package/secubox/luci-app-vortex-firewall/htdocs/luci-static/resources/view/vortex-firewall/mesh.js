'use strict';
'require view';
'require rpc';
'require poll';
'require ui';

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

function severityBadge(severity) {
	var colors = {
		'critical': '#dc3545',
		'high': '#fd7e14',
		'medium': '#ffc107',
		'low': '#28a745'
	};
	var color = colors[severity] || '#6c757d';
	return E('span', {
		style: 'display:inline-block;padding:2px 8px;border-radius:4px;' +
			'background:' + color + ';color:#fff;font-size:0.85em;font-weight:500;'
	}, severity || 'unknown');
}

function trustBadge(trust) {
	var colors = {
		'direct': '#28a745',
		'transitive': '#17a2b8',
		'unknown': '#6c757d'
	};
	var icons = {
		'direct': '\u{2705}',
		'transitive': '\u{1F517}',
		'unknown': '\u{2753}'
	};
	var color = colors[trust] || '#6c757d';
	var icon = icons[trust] || '';
	return E('span', {
		style: 'display:inline-block;padding:2px 8px;border-radius:4px;' +
			'background:' + color + ';color:#fff;font-size:0.85em;font-weight:500;'
	}, icon + ' ' + (trust || 'unknown'));
}

return view.extend({
	load: function() {
		return Promise.all([
			callMeshStatus(),
			callMeshReceived(50),
			callMeshPeers()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var received = data[1] || [];
		var peers = data[2] || [];

		var container = E('div', { class: 'cbi-map' });

		// Header
		container.appendChild(E('h2', { class: 'cbi-section-title' }, [
			'\u{1F310} Mesh Threat Sharing'
		]));

		// Check if available
		if (!status.available) {
			container.appendChild(E('div', {
				style: 'padding:24px;background:#f8f9fa;border-radius:8px;text-align:center;'
			}, [
				E('p', { style: 'font-size:1.2em;color:#666;' },
					'\u{26A0} Mesh threat sharing requires secubox-p2p package'),
				E('p', { style: 'color:#999;' },
					'Install secubox-p2p to enable distributed threat intelligence')
			]));
			return container;
		}

		// Status Cards Row
		var cardsRow = E('div', {
			style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;'
		});

		// Status Card
		var statusColor = status.enabled ? '#28a745' : '#dc3545';
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Mesh Status'),
			E('div', { style: 'font-size:1.5em;font-weight:600;color:' + statusColor + ';' },
				status.enabled ? '\u{2705} Active' : '\u{1F534} Inactive')
		]));

		// Local IOCs Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Local IOCs'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#17a2b8;' },
				String(status.local_iocs || 0))
		]));

		// Received IOCs Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Received'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#fd7e14;' },
				String(status.received_iocs || 0))
		]));

		// Applied IOCs Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Applied'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#28a745;' },
				String(status.applied_iocs || 0))
		]));

		// Vortex Shared Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Domains Shared'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#6f42c1;' },
				String(status.vortex_shared || 0))
		]));

		// Peers Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Peer Contributors'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#007bff;' },
				String(status.peer_contributors || 0))
		]));

		container.appendChild(cardsRow);

		// Actions Bar
		var actionsBar = E('div', {
			style: 'display:flex;gap:12px;margin-bottom:24px;'
		});

		var publishBtn = E('button', {
			class: 'cbi-button cbi-button-action',
			click: ui.createHandlerFn(this, function() {
				return callMeshPublish().then(function(result) {
					if (result.success) {
						ui.addNotification(null, E('p', '\u{2705} Published ' + result.published + ' IOCs to mesh'), 'info');
						window.location.reload();
					} else {
						ui.addNotification(null, E('p', '\u{274C} ' + result.message), 'error');
					}
				});
			})
		}, '\u{1F4E4} Publish to Mesh');

		var syncBtn = E('button', {
			class: 'cbi-button cbi-button-apply',
			click: ui.createHandlerFn(this, function() {
				return callMeshSync().then(function(result) {
					if (result.success) {
						ui.addNotification(null, E('p', '\u{2705} Applied ' + result.applied + ' IOCs from mesh'), 'info');
						window.location.reload();
					} else {
						ui.addNotification(null, E('p', '\u{274C} ' + result.message), 'error');
					}
				});
			})
		}, '\u{1F504} Sync from Mesh');

		actionsBar.appendChild(publishBtn);
		actionsBar.appendChild(syncBtn);
		container.appendChild(actionsBar);

		// Peer Contributors Section
		if (peers.length > 0) {
			var peersSection = E('div', {
				style: 'background:#fff;border-radius:8px;padding:16px;margin-bottom:24px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
			});

			peersSection.appendChild(E('h3', { style: 'margin:0 0 16px 0;font-size:1.1em;' },
				'\u{1F465} Peer Contributors'));

			var peersGrid = E('div', {
				style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;'
			});

			peers.forEach(function(peer) {
				peersGrid.appendChild(E('div', {
					style: 'display:flex;justify-content:space-between;align-items:center;' +
						'padding:12px;background:#f8f9fa;border-radius:6px;'
				}, [
					E('div', {}, [
						E('div', { style: 'font-weight:500;font-family:monospace;font-size:0.9em;' },
							(peer.node || 'unknown').substring(0, 16) + '...'),
						E('div', { style: 'margin-top:4px;' }, trustBadge(peer.trust))
					]),
					E('div', { style: 'text-align:right;' }, [
						E('div', { style: 'font-size:1.5em;font-weight:600;color:#17a2b8;' },
							String(peer.ioc_count || 0)),
						E('div', { style: 'font-size:0.85em;color:#666;' },
							String(peer.applied_count || 0) + ' applied')
					])
				]));
			});

			peersSection.appendChild(peersGrid);
			container.appendChild(peersSection);
		}

		// Received IOCs Table
		var receivedSection = E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		});

		receivedSection.appendChild(E('h3', { style: 'margin:0 0 16px 0;font-size:1.1em;' },
			'\u{1F4E5} Received Threats'));

		if (received.length === 0) {
			receivedSection.appendChild(E('p', { style: 'color:#666;font-style:italic;' },
				'No threats received from mesh yet'));
		} else {
			var table = E('table', {
				class: 'table',
				style: 'width:100%;border-collapse:collapse;'
			});

			// Header
			table.appendChild(E('tr', {
				style: 'background:#f8f9fa;'
			}, [
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Target'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Severity'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Trust'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Scenario'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Status')
			]));

			// Rows
			received.forEach(function(ioc) {
				var target = ioc.domain || ioc.ip || '-';
				var statusIcon = ioc.applied ? '\u{2705}' : '\u{23F3}';
				var statusText = ioc.applied ? 'Applied' : 'Pending';

				table.appendChild(E('tr', { style: 'border-bottom:1px solid #e0e0e0;' }, [
					E('td', { style: 'padding:10px;font-family:monospace;font-size:0.9em;' }, target),
					E('td', { style: 'padding:10px;' }, severityBadge(ioc.severity)),
					E('td', { style: 'padding:10px;' }, trustBadge(ioc.trust)),
					E('td', { style: 'padding:10px;font-size:0.9em;color:#666;' }, ioc.scenario || '-'),
					E('td', { style: 'padding:10px;' }, statusIcon + ' ' + statusText)
				]));
			});

			receivedSection.appendChild(table);
		}

		container.appendChild(receivedSection);

		// Info box
		container.appendChild(E('div', {
			style: 'margin-top:24px;padding:16px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);' +
				'border-radius:8px;color:#fff;'
		}, [
			E('h4', { style: 'margin:0 0 8px 0;' }, '\u{1F310} Decentralized Threat Intelligence'),
			E('p', { style: 'margin:0;opacity:0.9;font-size:0.9em;' }, [
				'Vortex domains with high confidence and hit counts are shared across the SecuBox mesh. ',
				'Threats from trusted peers are automatically applied to your local blocklist.'
			])
		]));

		return container;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
