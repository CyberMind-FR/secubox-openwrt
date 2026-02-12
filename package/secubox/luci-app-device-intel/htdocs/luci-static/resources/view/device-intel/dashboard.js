'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';
'require secubox/kiss-theme';

return view.extend({
	css: null,

	load: function() {
		return Promise.all([
			api.getSummary(),
			api.getDevices(),
			api.getDeviceTypes(),
			L.require('device-intel/common.css')
				.catch(function() { return null; })
		]);
	},

	render: function(data) {
		var summary = data[0] || {};
		var devResult = data[1] || {};
		var typesResult = data[2] || {};
		var devices = devResult.devices || [];
		var types = typesResult.types || [];

		// Include CSS
		var cssLink = E('link', {
			rel: 'stylesheet',
			href: L.resource('device-intel/common.css')
		});

		// ── Summary Stat Cards ──
		var stats = E('div', { 'class': 'di-stats' }, [
			this.statCard(summary.total || 0, _('Total Devices'), '#3b82f6'),
			this.statCard(summary.online || 0, _('Online'), '#22c55e'),
			this.statCard(summary.mesh_peers || 0, _('Mesh Peers'), '#6366f1'),
			this.statCard(devices.filter(function(d) {
				return d.risk_score > 0;
			}).length, _('At Risk'), '#ef4444')
		]);

		// ── Data Source Status ──
		var sources = summary.sources || {};
		var sourceBar = E('div', { 'class': 'di-source-bar' }, [
			this.sourceChip('MAC Guardian', sources.mac_guardian),
			this.sourceChip('Client Guardian', sources.client_guardian),
			this.sourceChip('DHCP Leases', sources.dhcp),
			this.sourceChip('P2P Mesh', sources.p2p)
		]);

		// ── Emulator Status ──
		var emus = summary.emulators || {};
		var emuBar = E('div', { 'class': 'di-source-bar' }, [
			this.sourceChip('USB', emus.usb),
			this.sourceChip('MQTT', emus.mqtt),
			this.sourceChip('Zigbee', emus.zigbee)
		]);

		// ── Device Type Distribution ──
		var typeCounts = {};
		devices.forEach(function(d) {
			var t = d.device_type || 'unknown';
			typeCounts[t] = (typeCounts[t] || 0) + 1;
		});

		var typeMap = {};
		types.forEach(function(t) { typeMap[t.id] = t; });

		var typeCards = Object.keys(typeCounts).sort(function(a, b) {
			return typeCounts[b] - typeCounts[a];
		}).map(function(tid) {
			var info = typeMap[tid] || { name: tid, color: '#6c757d' };
			return E('div', {
				'class': 'di-type-card',
				'style': '--type-color:' + (info.color || '#6c757d')
			}, [
				E('span', { 'class': 'count' }, String(typeCounts[tid])),
				E('span', { 'class': 'name' }, info.name || tid)
			]);
		});

		var typeGrid = E('div', { 'class': 'di-type-grid' }, typeCards);

		// ── Zone Distribution ──
		var zoneCounts = {};
		devices.forEach(function(d) {
			var z = d.cg_zone || 'unzoned';
			zoneCounts[z] = (zoneCounts[z] || 0) + 1;
		});

		var zoneItems = Object.keys(zoneCounts).map(function(z) {
			return E('span', {
				'class': 'di-source-chip',
				'style': 'background:#e0e7ff; color:#3730a3;'
			}, z + ' (' + zoneCounts[z] + ')');
		});

		// ── Recent Devices (last 5 seen) ──
		var recent = devices
			.filter(function(d) { return d.last_seen; })
			.sort(function(a, b) { return (b.last_seen || 0) - (a.last_seen || 0); })
			.slice(0, 5);

		var recentRows = recent.map(function(d) {
			return E('tr', {}, [
				E('td', {}, [
					E('span', {
						'class': 'di-online-dot ' + (d.online ? 'online' : 'offline')
					}),
					d.label || d.hostname || d.mac
				]),
				E('td', {}, d.ip || '-'),
				E('td', {}, d.device_type || '-'),
				E('td', {}, d.vendor || '-')
			]);
		});

		var recentTable = E('table', { 'class': 'di-device-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, _('Device')),
				E('th', {}, _('IP')),
				E('th', {}, _('Type')),
				E('th', {}, _('Vendor'))
			])),
			E('tbody', {}, recentRows.length > 0 ? recentRows :
				[E('tr', {}, E('td', { 'colspan': '4', 'style': 'text-align:center; color:#6c757d;' },
					_('No recent devices')))])
		]);

		var content = [
			cssLink,
			E('h2', {}, _('Device Intelligence')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5em;' }, [
					E('h3', { 'style': 'margin:0;' }, _('Overview')),
					E('button', {
						'class': 'cbi-button',
						'click': function() {
							api.refresh().then(function() {
								window.location.href = window.location.pathname + '?' + Date.now();
							});
						}
					}, _('Refresh'))
				]),
				stats
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Data Sources')),
				sourceBar,
				E('h4', { 'style': 'margin-top:0.75em;' }, _('Emulators')),
				emuBar
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Device Types')),
				typeGrid
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Zones')),
				E('div', { 'class': 'di-source-bar' }, zoneItems)
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Recent Devices')),
				recentTable
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/services/device-intel');
	},

	statCard: function(value, label, color) {
		return E('div', { 'class': 'di-stat-card' }, [
			E('div', { 'class': 'value', 'style': 'color:' + color }, String(value)),
			E('div', { 'class': 'label' }, label)
		]);
	},

	sourceChip: function(name, active) {
		return E('span', {
			'class': 'di-source-chip ' + (active ? 'active' : 'inactive')
		}, name);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
