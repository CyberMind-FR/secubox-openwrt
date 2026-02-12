'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';
'require secubox/kiss-theme';

/**
 * Device Intelligence Dashboard - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	load: function() {
		return Promise.all([
			api.getSummary(),
			api.getDevices(),
			api.getDeviceTypes()
		]);
	},

	render: function(data) {
		var self = this;
		var K = KissTheme;
		var summary = data[0] || {};
		var devResult = data[1] || {};
		var typesResult = data[2] || {};
		var devices = devResult.devices || [];
		var types = typesResult.types || [];

		// Count at-risk devices
		var atRiskCount = devices.filter(function(d) {
			return d.risk_score > 0;
		}).length;

		// Build type counts
		var typeCounts = {};
		devices.forEach(function(d) {
			var t = d.device_type || 'unknown';
			typeCounts[t] = (typeCounts[t] || 0) + 1;
		});

		var typeMap = {};
		types.forEach(function(t) { typeMap[t.id] = t; });

		// Build zone counts
		var zoneCounts = {};
		devices.forEach(function(d) {
			var z = d.cg_zone || 'unzoned';
			zoneCounts[z] = (zoneCounts[z] || 0) + 1;
		});

		// Recent devices (last 5 seen)
		var recent = devices
			.filter(function(d) { return d.last_seen; })
			.sort(function(a, b) { return (b.last_seen || 0) - (a.last_seen || 0); })
			.slice(0, 5);

		var sources = summary.sources || {};
		var emus = summary.emulators || {};

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' }, [
				K.E('div', {}, [
					K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
						K.E('span', {}, '🔍'),
						'Device Intelligence'
					]),
					K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
						'Network device discovery and monitoring')
				]),
				K.E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 10px 16px; font-size: 14px;',
					'click': function() {
						api.refresh().then(function() {
							window.location.href = window.location.pathname + '?' + Date.now();
						});
					}
				}, '🔄 Refresh')
			]),

			// Stats Grid
			K.E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'gap: 16px; margin-bottom: 20px;' }, [
				self.statCard(K, summary.total || 0, 'Total Devices', 'var(--kiss-blue, #3b82f6)', '📱'),
				self.statCard(K, summary.online || 0, 'Online', 'var(--kiss-green, #22c55e)', '🟢'),
				self.statCard(K, summary.mesh_peers || 0, 'Mesh Peers', 'var(--kiss-purple, #6366f1)', '🔗'),
				self.statCard(K, atRiskCount, 'At Risk', 'var(--kiss-red, #ef4444)', '⚠️')
			]),

			// Data Sources Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['📡 ', 'Data Sources']),
				K.E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;' }, [
					self.sourceChip(K, 'MAC Guardian', sources.mac_guardian),
					self.sourceChip(K, 'Client Guardian', sources.client_guardian),
					self.sourceChip(K, 'DHCP Leases', sources.dhcp),
					self.sourceChip(K, 'P2P Mesh', sources.p2p)
				]),
				K.E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted); margin-bottom: 8px;' }, 'Emulators'),
				K.E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' }, [
					self.sourceChip(K, 'USB', emus.usb),
					self.sourceChip(K, 'MQTT', emus.mqtt),
					self.sourceChip(K, 'Zigbee', emus.zigbee)
				])
			]),

			// Device Types Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['🏷️ ', 'Device Types']),
				K.E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 12px;' },
					Object.keys(typeCounts).sort(function(a, b) {
						return typeCounts[b] - typeCounts[a];
					}).map(function(tid) {
						var info = typeMap[tid] || { name: tid, color: '#6c757d' };
						return K.E('div', {
							'style': 'background: var(--kiss-bg2, #111827); border: 1px solid ' + (info.color || '#6c757d') + '; border-radius: 8px; padding: 12px 16px; text-align: center; min-width: 80px;'
						}, [
							K.E('div', { 'style': 'font-size: 24px; font-weight: bold; color: ' + (info.color || '#6c757d') }, String(typeCounts[tid])),
							K.E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-top: 4px;' }, info.name || tid)
						]);
					})
				)
			]),

			// Zones Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['🗺️ ', 'Zones']),
				K.E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' },
					Object.keys(zoneCounts).map(function(z) {
						return K.E('span', {
							'style': 'background: var(--kiss-purple, #6366f1); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 13px;'
						}, z + ' (' + zoneCounts[z] + ')');
					})
				)
			]),

			// Recent Devices Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['🕐 ', 'Recent Devices']),
				K.E('table', { 'class': 'kiss-table' }, [
					K.E('thead', {}, K.E('tr', {}, [
						K.E('th', {}, 'Device'),
						K.E('th', {}, 'IP'),
						K.E('th', {}, 'Type'),
						K.E('th', {}, 'Vendor')
					])),
					K.E('tbody', {},
						recent.length > 0
							? recent.map(function(d) {
								return K.E('tr', {}, [
									K.E('td', {}, [
										K.E('span', {
											'style': 'display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; background: ' + (d.online ? 'var(--kiss-green, #22c55e)' : 'var(--kiss-muted, #64748b)') + ';'
										}),
										d.label || d.hostname || d.mac
									]),
									K.E('td', {}, d.ip || '-'),
									K.E('td', {}, d.device_type || '-'),
									K.E('td', {}, d.vendor || '-')
								]);
							})
							: [K.E('tr', {}, K.E('td', { 'colspan': '4', 'style': 'text-align: center; color: var(--kiss-muted); padding: 20px;' }, 'No recent devices'))]
					)
				])
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/services/device-intel');
	},

	statCard: function(K, value, label, color, icon) {
		return K.E('div', {
			'style': 'background: var(--kiss-card, #161e2e); border: 1px solid var(--kiss-line, #1e293b); border-radius: 12px; padding: 20px; text-align: center;'
		}, [
			K.E('div', { 'style': 'font-size: 20px; margin-bottom: 8px;' }, icon),
			K.E('div', { 'style': 'font-size: 32px; font-weight: bold; color: ' + color }, String(value)),
			K.E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-top: 4px;' }, label)
		]);
	},

	sourceChip: function(K, name, active) {
		return K.E('span', {
			'style': 'padding: 6px 12px; border-radius: 6px; font-size: 13px; ' +
				(active
					? 'background: var(--kiss-green, #22c55e); color: #000;'
					: 'background: var(--kiss-bg2, #111827); color: var(--kiss-muted); border: 1px solid var(--kiss-line, #1e293b);')
		}, name);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
