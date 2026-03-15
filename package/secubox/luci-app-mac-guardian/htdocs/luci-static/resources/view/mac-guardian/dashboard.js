'use strict';
'require view';
'require dom';
'require rpc';
'require ui';
'require uci';

var callStatus = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'status',
	expect: {}
});

var callGetClients = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'get_clients',
	expect: {}
});

var callGetEvents = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'get_events',
	params: ['count'],
	expect: {}
});

var callScan = rpc.declare({ object: 'luci.mac-guardian', method: 'scan' });
var callStart = rpc.declare({ object: 'luci.mac-guardian', method: 'start' });
var callStop = rpc.declare({ object: 'luci.mac-guardian', method: 'stop' });
var callTrust = rpc.declare({ object: 'luci.mac-guardian', method: 'trust', params: ['mac'] });
var callBlock = rpc.declare({ object: 'luci.mac-guardian', method: 'block', params: ['mac'] });
var callDhcpStatus = rpc.declare({ object: 'luci.mac-guardian', method: 'dhcp_status', expect: {} });
var callDhcpCleanup = rpc.declare({ object: 'luci.mac-guardian', method: 'dhcp_cleanup', expect: {} });

function formatDate(ts) {
	if (!ts || ts === 0) return '-';
	var d = new Date(ts * 1000);
	return d.toLocaleString();
}

function createCard(title, icon, content, borderColor) {
	return E('div', {
		'style': 'background:#12121a;border-radius:8px;padding:16px;margin-bottom:16px;' +
		         'border-left:4px solid ' + (borderColor || '#2a2a3a') + ';'
	}, [
		E('div', { 'style': 'display:flex;align-items:center;gap:8px;margin-bottom:12px;' }, [
			E('span', { 'style': 'font-size:1.2rem;' }, icon),
			E('span', { 'style': 'font-size:1rem;font-weight:600;color:#fff;' }, title)
		]),
		E('div', {}, content)
	]);
}

function createMetric(label, value, color) {
	return E('div', {
		'style': 'background:#1a1a24;padding:10px 16px;border-radius:6px;text-align:center;min-width:70px;'
	}, [
		E('div', {
			'style': 'font-size:1.4rem;font-weight:700;color:' + (color || '#00d4aa') + ';font-family:monospace;'
		}, String(value)),
		E('div', {
			'style': 'font-size:0.7rem;color:#808090;text-transform:uppercase;margin-top:2px;'
		}, label)
	]);
}

function createBtn(text, style, onclick) {
	var colors = {
		primary: 'background:rgba(0,160,255,0.2);color:#00a0ff;border-color:rgba(0,160,255,0.3);',
		success: 'background:rgba(0,212,170,0.2);color:#00d4aa;border-color:rgba(0,212,170,0.3);',
		danger: 'background:rgba(255,77,77,0.2);color:#ff4d4d;border-color:rgba(255,77,77,0.3);',
		warning: 'background:rgba(255,165,0,0.2);color:#ffa500;border-color:rgba(255,165,0,0.3);'
	};
	return E('button', {
		'style': 'padding:6px 14px;border:1px solid;border-radius:6px;font-size:13px;cursor:pointer;' +
		         'margin-right:8px;' + (colors[style] || colors.primary),
		'click': onclick
	}, text);
}

function statusBadge(status) {
	var colors = {
		'trusted': '#00d4aa',
		'suspect': '#ffa500',
		'blocked': '#ff4d4d',
		'unknown': '#808090'
	};
	var color = colors[status] || '#808090';
	return E('span', {
		'style': 'display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;' +
		         'background:' + color + '22;color:' + color + ';'
	}, status);
}

return view.extend({
	load: function() {
		return Promise.all([
			callStatus().catch(function() { return {}; }),
			callGetClients().catch(function() { return { clients: [] }; }),
			callGetEvents(15).catch(function() { return { events: [] }; }),
			callDhcpStatus().catch(function() { return {}; })
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var clientData = data[1] || {};
		var eventData = data[2] || {};
		var dhcpStatus = data[3] || {};
		var clients = clientData.clients || [];
		var events = eventData.events || [];
		var cl = status.clients || {};
		var ifaces = status.interfaces || [];
		var running = status.service_status === 'running';

		var view = E('div', { 'style': 'max-width:1200px;margin:0 auto;padding:20px;' }, [
			// Header
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;' }, [
				E('h2', {
					'style': 'margin:0;font-size:1.5rem;background:linear-gradient(90deg,#00d4aa,#00a0ff);' +
					         '-webkit-background-clip:text;-webkit-text-fill-color:transparent;'
				}, 'MAC Guardian'),
				E('div', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
					E('span', {
						'style': 'width:10px;height:10px;border-radius:50%;background:' +
						         (running ? '#00d4aa' : '#ff4d4d') + ';box-shadow:0 0 8px ' +
						         (running ? '#00d4aa' : '#ff4d4d') + ';'
					}),
					E('span', { 'style': 'color:' + (running ? '#00d4aa' : '#ff4d4d') + ';font-weight:600;' },
						running ? 'RUNNING' : 'STOPPED')
				])
			]),

			// Control buttons
			E('div', { 'style': 'margin-bottom:20px;' }, [
				createBtn('Start', 'success', function() {
					callStart().then(function() { window.location.reload(); });
				}),
				createBtn('Stop', 'danger', function() {
					callStop().then(function() { window.location.reload(); });
				}),
				createBtn('Scan Now', 'primary', function() {
					ui.showModal('Scanning', [E('p', { 'class': 'spinning' }, 'Scanning WiFi interfaces...')]);
					callScan().then(function() { ui.hideModal(); window.location.reload(); });
				}),
				createBtn('DHCP Cleanup', 'warning', function() {
					callDhcpCleanup().then(function() {
						ui.addNotification(null, E('p', 'DHCP cleanup completed'), 'info');
					});
				})
			]),

			// Stats Grid
			E('div', {
				'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:20px;'
			}, [
				// Clients Card
				createCard('Clients', '👥', E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:10px;' }, [
					createMetric('Total', cl.total || 0, '#00a0ff'),
					createMetric('Trusted', cl.trusted || 0, '#00d4aa'),
					createMetric('Suspect', cl.suspect || 0, '#ffa500'),
					createMetric('Blocked', cl.blocked || 0, '#ff4d4d')
				]), '#00d4aa'),

				// WiFi Interfaces Card
				createCard('WiFi Interfaces', '📡', E('div', {},
					ifaces.length === 0 ?
						E('p', { 'style': 'color:#808090;margin:0;' }, 'No WiFi interfaces detected') :
						ifaces.map(function(iface) {
							return E('div', { 'style': 'display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2a2a3a;' }, [
								E('span', { 'style': 'color:#fff;font-weight:500;' }, iface.name),
								E('span', { 'style': 'color:#808090;' }, iface.essid),
								E('span', { 'style': 'color:#00d4aa;font-family:monospace;' }, iface.stations + ' STA')
							]);
						})
				), '#00a0ff'),

				// DHCP Protection Card
				createCard('DHCP Protection', '🛡️', E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:10px;' }, [
					createMetric('Status', dhcpStatus.enabled ? 'ON' : 'OFF', dhcpStatus.enabled ? '#00d4aa' : '#808090'),
					createMetric('Leases', dhcpStatus.leases || 0, '#00a0ff'),
					createMetric('Conflicts', dhcpStatus.conflicts || 0, (dhcpStatus.conflicts || 0) > 0 ? '#ffa500' : '#00d4aa'),
					createMetric('Stale', dhcpStatus.stale || 0, (dhcpStatus.stale || 0) > 0 ? '#ffa500' : '#00d4aa')
				]), dhcpStatus.enabled ? '#00d4aa' : '#808090'),

				// Config Summary Card
				createCard('Configuration', '⚙️', E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:10px;' }, [
					createMetric('Policy', status.policy || 'alert', '#00a0ff'),
					createMetric('Interval', (status.scan_interval || 30) + 's', '#808090'),
					createMetric('Random', status.detect_random ? 'ON' : 'OFF', status.detect_random ? '#00d4aa' : '#808090'),
					createMetric('Spoof', status.detect_spoof ? 'ON' : 'OFF', status.detect_spoof ? '#00d4aa' : '#808090')
				]), '#808090')
			]),

			// Known Clients Table
			createCard('Known Clients', '💻', clients.length === 0 ?
				E('p', { 'style': 'color:#808090;margin:0;' }, 'No clients detected yet. Run a scan or wait for devices to connect.') :
				E('div', { 'style': 'overflow-x:auto;' }, [
					E('table', { 'style': 'width:100%;border-collapse:collapse;font-size:0.85rem;' }, [
						E('thead', {}, [
							E('tr', { 'style': 'border-bottom:1px solid #2a2a3a;' }, [
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'MAC'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Vendor'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Hostname'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Interface'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Last Seen'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Status'),
								E('th', { 'style': 'padding:8px;text-align:center;color:#808090;font-weight:600;' }, 'Actions')
							])
						]),
						E('tbody', {}, clients.map(function(c) {
							return E('tr', { 'style': 'border-bottom:1px solid #1a1a24;' }, [
								E('td', { 'style': 'padding:8px;font-family:monospace;color:#00a0ff;' }, [
									c.mac,
									c.randomized ? E('span', {
										'style': 'margin-left:6px;color:#ffa500;font-weight:bold;',
										'title': 'Randomized MAC'
									}, 'R') : ''
								]),
								E('td', { 'style': 'padding:8px;color:#e0e0e0;' }, c.vendor || '-'),
								E('td', { 'style': 'padding:8px;color:#e0e0e0;' }, c.hostname || '-'),
								E('td', { 'style': 'padding:8px;color:#808090;' }, c.iface || '-'),
								E('td', { 'style': 'padding:8px;color:#808090;font-size:0.8rem;' }, formatDate(c.last_seen)),
								E('td', { 'style': 'padding:8px;' }, statusBadge(c.status)),
								E('td', { 'style': 'padding:8px;text-align:center;' }, [
									c.status !== 'trusted' ? E('button', {
										'style': 'padding:3px 8px;border:1px solid rgba(0,212,170,0.3);border-radius:4px;' +
										         'background:rgba(0,212,170,0.2);color:#00d4aa;font-size:11px;cursor:pointer;margin-right:4px;',
										'click': function() {
											callTrust(c.mac).then(function() {
												ui.addNotification(null, E('p', 'MAC ' + c.mac + ' trusted'), 'info');
												window.location.reload();
											});
										}
									}, 'Trust') : '',
									c.status !== 'blocked' ? E('button', {
										'style': 'padding:3px 8px;border:1px solid rgba(255,77,77,0.3);border-radius:4px;' +
										         'background:rgba(255,77,77,0.2);color:#ff4d4d;font-size:11px;cursor:pointer;',
										'click': function() {
											if (confirm('Block and deauthenticate ' + c.mac + '?')) {
												callBlock(c.mac).then(function() {
													ui.addNotification(null, E('p', 'MAC ' + c.mac + ' blocked'), 'info');
													window.location.reload();
												});
											}
										}
									}, 'Block') : ''
								])
							]);
						}))
					])
				])
			, '#00a0ff'),

			// Recent Alerts Table
			createCard('Recent Alerts', '⚠️', events.length === 0 ?
				E('p', { 'style': 'color:#808090;margin:0;' }, 'No alerts recorded.') :
				E('div', { 'style': 'overflow-x:auto;' }, [
					E('table', { 'style': 'width:100%;border-collapse:collapse;font-size:0.85rem;' }, [
						E('thead', {}, [
							E('tr', { 'style': 'border-bottom:1px solid #2a2a3a;' }, [
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Time'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Event'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'MAC'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Interface'),
								E('th', { 'style': 'padding:8px;text-align:left;color:#808090;font-weight:600;' }, 'Details')
							])
						]),
						E('tbody', {}, events.slice().reverse().map(function(line) {
							try {
								var ev = JSON.parse(line);
								return E('tr', { 'style': 'border-bottom:1px solid #1a1a24;' }, [
									E('td', { 'style': 'padding:8px;color:#808090;white-space:nowrap;' }, ev.ts || '-'),
									E('td', { 'style': 'padding:8px;color:#ffa500;font-weight:600;' }, ev.event || '-'),
									E('td', { 'style': 'padding:8px;font-family:monospace;color:#00a0ff;' }, ev.mac || '-'),
									E('td', { 'style': 'padding:8px;color:#808090;' }, ev.iface || '-'),
									E('td', { 'style': 'padding:8px;color:#e0e0e0;font-size:0.8rem;' }, ev.details || '-')
								]);
							} catch(e) {
								return E('tr');
							}
						}))
					])
				])
			, '#ffa500')
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
