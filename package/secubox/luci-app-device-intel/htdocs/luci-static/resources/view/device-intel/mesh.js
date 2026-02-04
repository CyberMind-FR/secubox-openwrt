'use strict';
'require view';
'require dom';
'require ui';
'require device-intel/api as api';

return view.extend({
	load: function() {
		return Promise.all([
			api.getMeshDevices(),
			api.getSummary()
		]);
	},

	render: function(data) {
		var meshResult = data[0] || {};
		var summary = data[1] || {};
		var meshDevices = meshResult.devices || [];

		var cssLink = E('link', {
			rel: 'stylesheet',
			href: L.resource('device-intel/common.css')
		});

		// Separate mesh peers from remote devices
		var peers = meshDevices.filter(function(d) { return d.device_type === 'mesh_peer'; });
		var remoteDevices = meshDevices.filter(function(d) { return d.device_type !== 'mesh_peer'; });

		// ── Peer Cards ──
		var peerCards;
		if (peers.length > 0) {
			peerCards = E('div', { 'class': 'di-stats' },
				peers.map(function(p) {
					return E('div', { 'class': 'di-stat-card' }, [
						E('div', { 'style': 'display:flex; align-items:center; gap:0.5em; margin-bottom:0.5em;' }, [
							E('span', {
								'class': 'di-online-dot ' + (p.online ? 'online' : 'offline')
							}),
							E('strong', {}, p.hostname || p.mac)
						]),
						E('div', { 'style': 'font-size:0.85em; color:#6c757d;' }, p.ip || '-')
					]);
				})
			);
		} else {
			peerCards = E('div', {
				'style': 'text-align:center; padding:2em; color:#6c757d;'
			}, [
				E('p', {}, _('No mesh peers discovered.')),
				E('p', { 'style': 'font-size:0.9em;' },
					_('Ensure SecuBox P2P is running and peers are configured.'))
			]);
		}

		// ── Remote Devices Table ──
		var remoteTable;
		if (remoteDevices.length > 0) {
			var rows = remoteDevices.map(function(d) {
				return E('tr', {}, [
					E('td', {}, [
						E('span', { 'class': 'di-online-dot ' + (d.online ? 'online' : 'offline') }),
						d.label || d.hostname || d.mac
					]),
					E('td', {}, d.ip || '-'),
					E('td', {}, d.device_type || '-'),
					E('td', {}, d.source_node || '-')
				]);
			});

			remoteTable = E('table', { 'class': 'di-device-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, _('Device')),
					E('th', {}, _('IP')),
					E('th', {}, _('Type')),
					E('th', {}, _('Source Node'))
				])),
				E('tbody', {}, rows)
			]);
		} else {
			remoteTable = E('p', { 'style': 'color:#6c757d; font-style:italic;' },
				_('No remote devices available. Peer device inventory sharing is not yet active.'));
		}

		return E('div', {}, [
			cssLink,
			E('h2', {}, _('Mesh Network')),

			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display:flex; justify-content:space-between; align-items:center;' }, [
					E('h3', { 'style': 'margin:0;' }, _('Peers')),
					E('span', { 'style': 'color:#6c757d;' },
						String(peers.length) + _(' peer(s) discovered'))
				]),
				peerCards
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Remote Devices')),
				E('p', { 'style': 'color:#6c757d; margin-bottom:1em; font-size:0.9em;' },
					_('Devices reported by mesh peers. Requires device-intel on remote nodes.')),
				remoteTable
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
