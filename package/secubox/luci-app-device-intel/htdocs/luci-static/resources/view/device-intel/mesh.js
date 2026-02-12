'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';
'require secubox/kiss-theme';

/**
 * Device Intel - Mesh Network - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	load: function() {
		return Promise.all([
			api.getMeshDevices(),
			api.getSummary()
		]);
	},

	render: function(data) {
		var K = KissTheme;
		var meshResult = data[0] || {};
		var meshDevices = meshResult.devices || [];

		// Separate mesh peers from remote devices
		var peers = meshDevices.filter(function(d) { return d.device_type === 'mesh_peer'; });
		var remoteDevices = meshDevices.filter(function(d) { return d.device_type !== 'mesh_peer'; });

		// ── Peer Cards ──
		var peerCards;
		if (peers.length > 0) {
			peerCards = K.E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'gap: 16px;' },
				peers.map(function(p) {
					return K.E('div', {
						'style': 'background: var(--kiss-bg2, #111827); border: 1px solid var(--kiss-line, #1e293b); border-radius: 12px; padding: 16px;'
					}, [
						K.E('div', { 'style': 'display: flex; align-items: center; gap: 10px; margin-bottom: 8px;' }, [
							K.E('span', {
								'style': 'display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ' + (p.online ? 'var(--kiss-green, #22c55e)' : 'var(--kiss-muted, #64748b)') + ';'
							}),
							K.E('strong', { 'style': 'font-size: 14px;' }, p.hostname || p.mac)
						]),
						K.E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, p.ip || '-')
					]);
				})
			);
		} else {
			peerCards = K.E('div', {
				'style': 'text-align: center; padding: 40px 20px; color: var(--kiss-muted);'
			}, [
				K.E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '🔗'),
				K.E('p', { 'style': 'margin: 0;' }, 'No mesh peers discovered.'),
				K.E('p', { 'style': 'font-size: 13px; margin-top: 8px;' },
					'Ensure SecuBox P2P is running and peers are configured.')
			]);
		}

		// ── Remote Devices Table ──
		var remoteTable;
		if (remoteDevices.length > 0) {
			var rows = remoteDevices.map(function(d) {
				return K.E('tr', {}, [
					K.E('td', {}, [
						K.E('span', {
							'style': 'display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; background: ' + (d.online ? 'var(--kiss-green, #22c55e)' : 'var(--kiss-muted, #64748b)') + ';'
						}),
						d.label || d.hostname || d.mac
					]),
					K.E('td', {}, d.ip || '-'),
					K.E('td', {}, d.device_type || '-'),
					K.E('td', {}, d.source_node || '-')
				]);
			});

			remoteTable = K.E('table', { 'class': 'kiss-table' }, [
				K.E('thead', {}, K.E('tr', {}, [
					K.E('th', {}, 'Device'),
					K.E('th', {}, 'IP'),
					K.E('th', {}, 'Type'),
					K.E('th', {}, 'Source Node')
				])),
				K.E('tbody', {}, rows)
			]);
		} else {
			remoteTable = K.E('p', { 'style': 'color: var(--kiss-muted); font-style: italic; text-align: center; padding: 20px;' },
				'No remote devices available. Peer device inventory sharing is not yet active.');
		}

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'margin-bottom: 20px;' }, [
				K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
					K.E('span', {}, '🌐'),
					'Mesh Network'
				]),
				K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
					'P2P mesh peers and shared device inventory')
			]),

			// Peers Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;' }, [
					K.E('div', { 'class': 'kiss-card-title', 'style': 'margin: 0;' }, ['🔗 ', 'Peers']),
					K.E('span', { 'style': 'color: var(--kiss-muted); font-size: 13px;' },
						String(peers.length) + ' peer(s) discovered')
				]),
				peerCards
			]),

			// Remote Devices Card
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['📡 ', 'Remote Devices']),
				K.E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px; font-size: 13px;' },
					'Devices reported by mesh peers. Requires device-intel on remote nodes.'),
				remoteTable
			])
		]);

		return KissTheme.wrap(content, 'admin/secubox/services/device-intel/mesh');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
