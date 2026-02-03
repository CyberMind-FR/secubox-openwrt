'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';

var callStatus = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'status',
	expect: { '': {} }
});

var callGetClients = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'get_clients',
	expect: { '': {} }
});

var callGetEvents = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'get_events',
	params: ['count'],
	expect: { '': {} }
});

var callScan = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'scan'
});

var callStart = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'start'
});

var callStop = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'stop'
});

var callRestart = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'restart'
});

var callTrust = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'trust',
	params: ['mac']
});

var callBlock = rpc.declare({
	object: 'luci.mac-guardian',
	method: 'block',
	params: ['mac']
});

function formatDate(ts) {
	if (!ts || ts === 0) return '-';
	var d = new Date(ts * 1000);
	var pad = function(n) { return n < 10 ? '0' + n : n; };
	return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
		' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function statusBadge(status) {
	var colors = {
		'trusted': '#080',
		'suspect': '#c60',
		'blocked': '#c00',
		'unknown': '#888'
	};
	var color = colors[status] || '#888';
	return '<span style="display:inline-block;padding:2px 8px;border-radius:3px;' +
		'background:' + color + ';color:#fff;font-size:12px;font-weight:bold;">' +
		status + '</span>';
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('mac-guardian'),
			callStatus(),
			callGetClients(),
			callGetEvents(10)
		]);
	},

	render: function(data) {
		var status = data[1];
		var clientData = data[2];
		var eventData = data[3];
		var clients = (clientData && clientData.clients) ? clientData.clients : [];
		var events = (eventData && eventData.events) ? eventData.events : [];
		var m, s, o;

		m = new form.Map('mac-guardian', _('MAC Guardian'),
			_('WiFi MAC address security monitor. Detects randomized MACs, spoofing, and MAC floods.'));

		// ==========================================
		// Status Section
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'mac-guardian', _('Status'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_status');
		o.rawhtml = true;
		o.cfgvalue = function() {
			var svcColor = status.service_status === 'running' ? '#080' : '#c00';
			var svcLabel = status.service_status === 'running' ? 'Running' : 'Stopped';

			var html = '<div style="display:flex;gap:25px;flex-wrap:wrap;">';

			// Service card
			html += '<div style="min-width:160px;">';
			html += '<h4 style="margin:0 0 8px 0;border-bottom:1px solid #ddd;padding-bottom:4px;">Service</h4>';
			html += '<p><b>Status:</b> <span style="color:' + svcColor + ';font-weight:bold;">' + svcLabel + '</span></p>';
			html += '<p><b>Policy:</b> ' + (status.policy || 'alert') + '</p>';
			html += '<p><b>Interval:</b> ' + (status.scan_interval || 30) + 's</p>';
			html += '</div>';

			// Clients card
			var cl = status.clients || {};
			html += '<div style="min-width:160px;">';
			html += '<h4 style="margin:0 0 8px 0;border-bottom:1px solid #ddd;padding-bottom:4px;">Clients</h4>';
			html += '<p><b>Total:</b> ' + (cl.total || 0) + '</p>';
			html += '<p><b>Trusted:</b> <span style="color:#080;">' + (cl.trusted || 0) + '</span></p>';
			html += '<p><b>Suspect:</b> <span style="color:#c60;">' + (cl.suspect || 0) + '</span></p>';
			html += '<p><b>Blocked:</b> <span style="color:#c00;">' + (cl.blocked || 0) + '</span></p>';
			html += '</div>';

			// Interfaces card
			var ifaces = status.interfaces || [];
			html += '<div style="min-width:160px;">';
			html += '<h4 style="margin:0 0 8px 0;border-bottom:1px solid #ddd;padding-bottom:4px;">WiFi Interfaces</h4>';
			if (ifaces.length === 0) {
				html += '<p style="color:#888;">None detected</p>';
			} else {
				for (var i = 0; i < ifaces.length; i++) {
					html += '<p><b>' + ifaces[i].name + '</b> (' + ifaces[i].essid + ') - ' + ifaces[i].stations + ' STA</p>';
				}
			}
			html += '</div>';

			html += '</div>';
			return html;
		};

		// Control buttons
		o = s.option(form.Button, '_start', _('Start'));
		o.inputtitle = _('Start');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return callStart().then(function() { window.location.reload(); });
		};

		o = s.option(form.Button, '_stop', _('Stop'));
		o.inputtitle = _('Stop');
		o.inputstyle = 'remove';
		o.onclick = function() {
			return callStop().then(function() { window.location.reload(); });
		};

		o = s.option(form.Button, '_scan', _('Scan Now'));
		o.inputtitle = _('Scan');
		o.inputstyle = 'reload';
		o.onclick = function() {
			ui.showModal(_('Scanning'), [
				E('p', { 'class': 'spinning' }, _('Scanning WiFi interfaces...'))
			]);
			return callScan().then(function() {
				ui.hideModal();
				window.location.reload();
			});
		};

		// ==========================================
		// Clients Table
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'mac-guardian', _('Known Clients'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_clients');
		o.rawhtml = true;
		o.cfgvalue = function() {
			if (clients.length === 0) {
				return '<p style="color:#888;">No clients detected yet. Run a scan or wait for devices to connect.</p>';
			}

			var html = '<div style="overflow-x:auto;">';
			html += '<table class="table" style="width:100%;border-collapse:collapse;">';
			html += '<tr class="tr table-titles">';
			html += '<th class="th">MAC</th>';
			html += '<th class="th">Vendor</th>';
			html += '<th class="th">Hostname</th>';
			html += '<th class="th">Interface</th>';
			html += '<th class="th">First Seen</th>';
			html += '<th class="th">Last Seen</th>';
			html += '<th class="th">Status</th>';
			html += '<th class="th">Actions</th>';
			html += '</tr>';

			for (var i = 0; i < clients.length; i++) {
				var c = clients[i];
				var macDisplay = c.mac;
				if (c.randomized) {
					macDisplay += ' <span title="Randomized MAC" style="color:#c60;font-weight:bold;">R</span>';
				}

				html += '<tr class="tr">';
				html += '<td class="td" style="font-family:monospace;">' + macDisplay + '</td>';
				html += '<td class="td">' + (c.vendor || '-') + '</td>';
				html += '<td class="td">' + (c.hostname || '-') + '</td>';
				html += '<td class="td">' + (c.iface || '-') + '</td>';
				html += '<td class="td">' + formatDate(c.first_seen) + '</td>';
				html += '<td class="td">' + formatDate(c.last_seen) + '</td>';
				html += '<td class="td">' + statusBadge(c.status) + '</td>';
				html += '<td class="td">';
				if (c.status !== 'trusted') {
					html += '<button class="cbi-button cbi-button-apply" data-mac="' + c.mac + '" data-action="trust" style="margin-right:4px;">Trust</button>';
				}
				if (c.status !== 'blocked') {
					html += '<button class="cbi-button cbi-button-remove" data-mac="' + c.mac + '" data-action="block">Block</button>';
				}
				html += '</td>';
				html += '</tr>';
			}

			html += '</table>';
			html += '</div>';
			return html;
		};

		// ==========================================
		// Recent Alerts
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'mac-guardian', _('Recent Alerts'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_events');
		o.rawhtml = true;
		o.cfgvalue = function() {
			if (events.length === 0) {
				return '<p style="color:#888;">No alerts recorded.</p>';
			}

			var html = '<div style="overflow-x:auto;">';
			html += '<table class="table" style="width:100%;border-collapse:collapse;">';
			html += '<tr class="tr table-titles">';
			html += '<th class="th">Time</th>';
			html += '<th class="th">Event</th>';
			html += '<th class="th">MAC</th>';
			html += '<th class="th">Interface</th>';
			html += '<th class="th">Details</th>';
			html += '</tr>';

			for (var i = events.length - 1; i >= 0; i--) {
				try {
					var ev = JSON.parse(events[i]);
					html += '<tr class="tr">';
					html += '<td class="td" style="white-space:nowrap;">' + (ev.ts || '-') + '</td>';
					html += '<td class="td"><b>' + (ev.event || '-') + '</b></td>';
					html += '<td class="td" style="font-family:monospace;">' + (ev.mac || '-') + '</td>';
					html += '<td class="td">' + (ev.iface || '-') + '</td>';
					html += '<td class="td" style="font-size:12px;">' + (ev.details || '-') + '</td>';
					html += '</tr>';
				} catch(e) {
					continue;
				}
			}

			html += '</table>';
			html += '</div>';
			return html;
		};

		// ==========================================
		// Configuration
		// ==========================================
		s = m.section(form.NamedSection, 'main', 'mac-guardian', _('Configuration'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable MAC Guardian service'));
		o.rmempty = false;

		o = s.option(form.Value, 'scan_interval', _('Scan Interval'),
			_('Seconds between WiFi scans'));
		o.datatype = 'uinteger';
		o.default = '30';
		o.placeholder = '30';

		s = m.section(form.NamedSection, 'detection', 'detection', _('Detection'));
		s.anonymous = true;

		o = s.option(form.Flag, 'random_mac', _('Detect Randomized MACs'),
			_('Alert on locally-administered (randomized) MAC addresses'));
		o.default = '1';

		o = s.option(form.Flag, 'spoof_detection', _('Detect Spoofing'),
			_('Alert when a MAC address appears on a different interface'));
		o.default = '1';

		o = s.option(form.Flag, 'mac_flip', _('Detect MAC Floods'),
			_('Alert when many new MACs appear in a short window'));
		o.default = '1';

		s = m.section(form.NamedSection, 'enforcement', 'enforcement', _('Enforcement'));
		s.anonymous = true;

		o = s.option(form.ListValue, 'policy', _('Policy'),
			_('Action to take on detected threats'));
		o.value('alert', _('Alert only'));
		o.value('quarantine', _('Quarantine (drop traffic)'));
		o.value('deny', _('Deny (drop + deauthenticate)'));
		o.default = 'alert';

		// ==========================================
		// Bind action buttons
		// ==========================================
		var rendered = m.render();

		return rendered.then(function(node) {
			node.addEventListener('click', function(ev) {
				var btn = ev.target.closest('[data-action]');
				if (!btn) return;

				var mac = btn.getAttribute('data-mac');
				var action = btn.getAttribute('data-action');

				if (action === 'trust') {
					callTrust(mac).then(function() {
						ui.addNotification(null, E('p', _('MAC %s trusted').format(mac)), 'success');
						window.location.reload();
					});
				} else if (action === 'block') {
					if (confirm(_('Block and deauthenticate %s?').format(mac))) {
						callBlock(mac).then(function() {
							ui.addNotification(null, E('p', _('MAC %s blocked').format(mac)), 'success');
							window.location.reload();
						});
					}
				}
			});

			return node;
		});
	}
});
