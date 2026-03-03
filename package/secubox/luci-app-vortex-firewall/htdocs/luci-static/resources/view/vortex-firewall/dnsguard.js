'use strict';
'require view';
'require rpc';
'require poll';
'require ui';

var callDNSGuardStatus = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'dnsguard_status',
	expect: {}
});

var callDNSGuardAlerts = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'dnsguard_alerts',
	params: ['limit'],
	expect: { alerts: [] }
});

var callDNSGuardSync = rpc.declare({
	object: 'luci.vortex-firewall',
	method: 'dnsguard_sync',
	expect: {}
});

function typeIcon(type) {
	var icons = {
		'dga': '\u{1F9EC}',           // DNA for DGA
		'dns_tunnel': '\u{1F573}',    // Hole for tunneling
		'tunneling': '\u{1F573}',
		'malware': '\u{1F41B}',       // Bug for malware
		'known_bad': '\u{1F6AB}',     // No entry for known bad
		'suspicious_tld': '\u{26A0}', // Warning for TLD
		'tld_anomaly': '\u{26A0}',
		'rate_anomaly': '\u{23F1}',   // Stopwatch for rate
		'ai_detected': '\u{1F916}'    // Robot for AI
	};
	return icons[type] || '\u{2753}';
}

function typeBadge(type) {
	var colors = {
		'dga': '#dc3545',
		'dns_tunnel': '#fd7e14',
		'tunneling': '#fd7e14',
		'malware': '#dc3545',
		'known_bad': '#6f42c1',
		'suspicious_tld': '#ffc107',
		'tld_anomaly': '#ffc107',
		'rate_anomaly': '#17a2b8',
		'ai_detected': '#28a745'
	};
	var color = colors[type] || '#6c757d';
	return E('span', {
		style: 'display:inline-block;padding:2px 8px;border-radius:4px;' +
			'background:' + color + ';color:#fff;font-size:0.85em;font-weight:500;'
	}, typeIcon(type) + ' ' + (type || 'unknown').replace('_', ' '));
}

function confidenceBar(value) {
	var color = value >= 80 ? '#dc3545' : value >= 60 ? '#fd7e14' : '#ffc107';
	return E('div', { style: 'display:flex;align-items:center;gap:8px;' }, [
		E('div', {
			style: 'width:80px;height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;'
		}, [
			E('div', {
				style: 'height:100%;width:' + value + '%;background:' + color + ';'
			})
		]),
		E('span', { style: 'font-size:0.85em;color:#666;' }, value + '%')
	]);
}

return view.extend({
	load: function() {
		return Promise.all([
			callDNSGuardStatus(),
			callDNSGuardAlerts(50)
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var alerts = data[1] || [];

		var container = E('div', { class: 'cbi-map' });

		// Header
		container.appendChild(E('h2', { class: 'cbi-section-title' }, [
			'\u{1F9E0} DNS Guard Integration'
		]));

		// Status Cards Row
		var cardsRow = E('div', {
			style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;'
		});

		// Service Status Card
		var serviceStatus = status.installed ?
			(status.running ? '\u{2705} Running' : '\u{1F7E1} Stopped') :
			'\u{274C} Not Installed';
		var serviceColor = status.running ? '#28a745' : (status.installed ? '#ffc107' : '#dc3545');

		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'DNS Guard Service'),
			E('div', { style: 'font-size:1.5em;font-weight:600;color:' + serviceColor + ';' }, serviceStatus)
		]));

		// Alert Count Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Total Alerts'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#dc3545;' }, String(status.alert_count || 0))
		]));

		// Pending Approvals Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Pending Approvals'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#fd7e14;' }, String(status.pending_count || 0))
		]));

		// Vortex Imported Card
		cardsRow.appendChild(E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		}, [
			E('div', { style: 'font-size:0.85em;color:#666;margin-bottom:4px;' }, 'Imported to Vortex'),
			E('div', { style: 'font-size:2em;font-weight:600;color:#28a745;' }, String(status.vortex_imported || 0))
		]));

		container.appendChild(cardsRow);

		// Detection Types Breakdown
		if (status.detection_types && Object.keys(status.detection_types).length > 0) {
			var typesSection = E('div', {
				style: 'background:#fff;border-radius:8px;padding:16px;margin-bottom:24px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
			});

			typesSection.appendChild(E('h3', { style: 'margin:0 0 16px 0;font-size:1.1em;' }, 'Detection Types'));

			var typesGrid = E('div', {
				style: 'display:flex;flex-wrap:wrap;gap:12px;'
			});

			for (var type in status.detection_types) {
				typesGrid.appendChild(E('div', {
					style: 'display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8f9fa;border-radius:6px;'
				}, [
					typeBadge(type),
					E('span', { style: 'font-weight:600;' }, String(status.detection_types[type]))
				]));
			}

			typesSection.appendChild(typesGrid);
			container.appendChild(typesSection);
		}

		// Actions Bar
		var actionsBar = E('div', {
			style: 'display:flex;gap:12px;margin-bottom:24px;'
		});

		var syncBtn = E('button', {
			class: 'cbi-button cbi-button-action',
			click: ui.createHandlerFn(this, function() {
				return callDNSGuardSync().then(function(result) {
					if (result.success) {
						ui.addNotification(null, E('p', '\u{2705} ' + result.message), 'info');
						window.location.reload();
					} else {
						ui.addNotification(null, E('p', '\u{274C} ' + result.message), 'error');
					}
				});
			})
		}, '\u{1F504} Sync from DNS Guard');

		actionsBar.appendChild(syncBtn);

		if (status.vortex_last_sync) {
			actionsBar.appendChild(E('span', {
				style: 'display:flex;align-items:center;color:#666;font-size:0.9em;'
			}, 'Last sync: ' + status.vortex_last_sync));
		}

		container.appendChild(actionsBar);

		// Recent Alerts Table
		var alertsSection = E('div', {
			style: 'background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);'
		});

		alertsSection.appendChild(E('h3', { style: 'margin:0 0 16px 0;font-size:1.1em;' },
			'\u{1F6A8} Recent DNS Guard Alerts'));

		if (alerts.length === 0) {
			alertsSection.appendChild(E('p', { style: 'color:#666;font-style:italic;' },
				'No alerts from DNS Guard'));
		} else {
			var table = E('table', {
				class: 'table',
				style: 'width:100%;border-collapse:collapse;'
			});

			// Header
			table.appendChild(E('tr', {
				style: 'background:#f8f9fa;'
			}, [
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Domain'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Type'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Confidence'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Client'),
				E('th', { style: 'padding:10px;text-align:left;border-bottom:2px solid #dee2e6;' }, 'Reason')
			]));

			// Rows
			alerts.forEach(function(alert) {
				table.appendChild(E('tr', { style: 'border-bottom:1px solid #e0e0e0;' }, [
					E('td', { style: 'padding:10px;font-family:monospace;font-size:0.9em;' }, alert.domain || '-'),
					E('td', { style: 'padding:10px;' }, typeBadge(alert.type)),
					E('td', { style: 'padding:10px;' }, confidenceBar(alert.confidence || 0)),
					E('td', { style: 'padding:10px;font-family:monospace;color:#666;' }, alert.client || '-'),
					E('td', { style: 'padding:10px;font-size:0.85em;color:#666;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' }, alert.reason || '-')
				]));
			});

			alertsSection.appendChild(table);
		}

		container.appendChild(alertsSection);

		// Info box
		container.appendChild(E('div', {
			style: 'margin-top:24px;padding:16px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);' +
				'border-radius:8px;color:#fff;'
		}, [
			E('h4', { style: 'margin:0 0 8px 0;' }, '\u{1F9E0} AI-Powered Detection'),
			E('p', { style: 'margin:0;opacity:0.9;font-size:0.9em;' }, [
				'DNS Guard uses LocalAI to detect DGA domains, DNS tunneling, and other anomalies. ',
				'Detections are automatically imported into Vortex Firewall for DNS-level blocking.'
			])
		]));

		return container;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
