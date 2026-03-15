'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
	object: 'luci.torrent',
	method: 'status',
	expect: {}
});

var callQbtList = rpc.declare({
	object: 'luci.torrent',
	method: 'qbt_list',
	expect: {}
});

var callWtList = rpc.declare({
	object: 'luci.torrent',
	method: 'wt_list',
	expect: {}
});

var callQbtStart = rpc.declare({
	object: 'luci.torrent',
	method: 'qbt_start'
});

var callQbtStop = rpc.declare({
	object: 'luci.torrent',
	method: 'qbt_stop'
});

var callWtStart = rpc.declare({
	object: 'luci.torrent',
	method: 'wt_start'
});

var callWtStop = rpc.declare({
	object: 'luci.torrent',
	method: 'wt_stop'
});

var callQbtAdd = rpc.declare({
	object: 'luci.torrent',
	method: 'qbt_add',
	params: ['url']
});

var callWtAdd = rpc.declare({
	object: 'luci.torrent',
	method: 'wt_add',
	params: ['magnet']
});

function formatSpeed(bytes) {
	if (!bytes || bytes === 0) return '0 B/s';
	var k = 1024;
	var sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSize(bytes) {
	if (!bytes || bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callQbtList(),
			callWtList()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var qbt = status.qbittorrent || {};
		var wt = status.webtorrent || {};
		var qbtList = (data[1] || {}).torrents || [];
		var wtList = (data[2] || {}).torrents || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'style': 'color: #00d4ff; margin-bottom: 20px;' }, [
				E('span', { 'style': 'margin-right: 10px;' }, '\u{1F9F2}'),
				'Torrent Services'
			]),

			// Status Cards
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;' }, [
				// qBittorrent Card
				E('div', { 'style': 'background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border: 1px solid #2a2a4e;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;' }, [
						E('h3', { 'style': 'color: #00d4ff; margin: 0; font-size: 18px;' }, '\u{1F4E5} qBittorrent'),
						E('span', {
							'style': 'padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; ' +
								(qbt.running ? 'background: rgba(0,200,83,0.2); color: #00c853;' : 'background: rgba(244,67,54,0.2); color: #f44336;')
						}, qbt.running ? 'RUNNING' : 'STOPPED')
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;' }, [
						E('div', { 'style': 'background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;' }, [
							E('div', { 'style': 'color: #888; font-size: 11px;' }, 'DOWNLOAD'),
							E('div', { 'style': 'color: #00c853; font-size: 16px; font-weight: 600;' }, formatSpeed(qbt.dl_speed))
						]),
						E('div', { 'style': 'background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;' }, [
							E('div', { 'style': 'color: #888; font-size: 11px;' }, 'UPLOAD'),
							E('div', { 'style': 'color: #2196f3; font-size: 16px; font-weight: 600;' }, formatSpeed(qbt.up_speed))
						])
					]),
					E('div', { 'style': 'color: #888; font-size: 13px; margin-bottom: 15px;' }, [
						E('span', {}, 'Torrents: '),
						E('strong', { 'style': 'color: #e0e0e0;' }, String(qbt.torrents || 0)),
						qbt.version ? E('span', { 'style': 'margin-left: 15px;' }, ['Version: ', E('strong', { 'style': 'color: #e0e0e0;' }, qbt.version)]) : ''
					]),
					E('div', { 'style': 'display: flex; gap: 10px;' }, [
						E('button', {
							'class': 'btn cbi-button',
							'style': 'flex: 1; padding: 8px; border-radius: 6px; ' +
								(qbt.running ? 'background: #f44336; border-color: #f44336;' : 'background: #00c853; border-color: #00c853;'),
							'click': ui.createHandlerFn(this, function() {
								return (qbt.running ? callQbtStop() : callQbtStart()).then(function() {
									window.location.reload();
								});
							})
						}, qbt.running ? 'Stop' : 'Start'),
						E('a', {
							'href': qbt.url || 'http://192.168.255.42:8090/',
							'target': '_blank',
							'class': 'btn cbi-button',
							'style': 'flex: 1; padding: 8px; border-radius: 6px; text-align: center; text-decoration: none; background: #2196f3; border-color: #2196f3; color: white;'
						}, 'Open UI')
					])
				]),

				// WebTorrent Card
				E('div', { 'style': 'background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 20px; border: 1px solid #2a2a4e;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;' }, [
						E('h3', { 'style': 'color: #7c3aed; margin: 0; font-size: 18px;' }, '\u{1F4FA} WebTorrent'),
						E('span', {
							'style': 'padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; ' +
								(wt.running ? 'background: rgba(0,200,83,0.2); color: #00c853;' : 'background: rgba(244,67,54,0.2); color: #f44336;')
						}, wt.running ? 'RUNNING' : 'STOPPED')
					]),
					E('div', { 'style': 'background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px;' }, [
						E('div', { 'style': 'color: #888; font-size: 11px;' }, 'ACTIVE STREAMS'),
						E('div', { 'style': 'color: #7c3aed; font-size: 24px; font-weight: 600;' }, String(wt.torrents || 0))
					]),
					E('div', { 'style': 'color: #888; font-size: 13px; margin-bottom: 15px;' }, [
						'Browser-based torrent streaming with WebRTC'
					]),
					E('div', { 'style': 'display: flex; gap: 10px;' }, [
						E('button', {
							'class': 'btn cbi-button',
							'style': 'flex: 1; padding: 8px; border-radius: 6px; ' +
								(wt.running ? 'background: #f44336; border-color: #f44336;' : 'background: #00c853; border-color: #00c853;'),
							'click': ui.createHandlerFn(this, function() {
								return (wt.running ? callWtStop() : callWtStart()).then(function() {
									window.location.reload();
								});
							})
						}, wt.running ? 'Stop' : 'Start'),
						E('a', {
							'href': wt.url || 'http://192.168.255.43:8095/',
							'target': '_blank',
							'class': 'btn cbi-button',
							'style': 'flex: 1; padding: 8px; border-radius: 6px; text-align: center; text-decoration: none; background: #7c3aed; border-color: #7c3aed; color: white;'
						}, 'Open UI')
					])
				])
			]),

			// Add Torrent Section
			E('div', { 'style': 'background: #1a1a2e; border-radius: 12px; padding: 20px; border: 1px solid #2a2a4e; margin-bottom: 30px;' }, [
				E('h3', { 'style': 'color: #e0e0e0; margin: 0 0 15px 0; font-size: 16px;' }, '\u2795 Add Torrent'),
				E('div', { 'style': 'display: flex; gap: 10px;' }, [
					E('input', {
						'type': 'text',
						'id': 'torrent-url',
						'placeholder': 'Paste magnet link or torrent URL...',
						'style': 'flex: 1; padding: 12px; background: #0a0a12; border: 1px solid #3a3a4e; border-radius: 8px; color: #e0e0e0; font-size: 14px;'
					}),
					E('button', {
						'class': 'btn cbi-button',
						'style': 'padding: 12px 24px; background: linear-gradient(135deg, #00d4ff, #7c3aed); border: none; border-radius: 8px; color: white; font-weight: 600;',
						'click': ui.createHandlerFn(this, function() {
							var url = document.getElementById('torrent-url').value.trim();
							if (!url) {
								ui.addNotification(null, E('p', 'Please enter a magnet link or URL'), 'warning');
								return;
							}
							// Add to both services
							var promises = [];
							if (qbt.running) promises.push(callQbtAdd(url));
							if (wt.running && url.startsWith('magnet:')) promises.push(callWtAdd(url));
							if (promises.length === 0) {
								ui.addNotification(null, E('p', 'No torrent service is running'), 'warning');
								return;
							}
							return Promise.all(promises).then(function() {
								ui.addNotification(null, E('p', 'Torrent added successfully'), 'info');
								document.getElementById('torrent-url').value = '';
								window.location.reload();
							});
						})
					}, 'Add')
				])
			]),

			// Torrent Lists
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;' }, [
				// qBittorrent List
				E('div', { 'style': 'background: #1a1a2e; border-radius: 12px; padding: 20px; border: 1px solid #2a2a4e;' }, [
					E('h3', { 'style': 'color: #00d4ff; margin: 0 0 15px 0; font-size: 16px;' }, '\u{1F4E5} qBittorrent Queue'),
					E('div', { 'id': 'qbt-list' }, this.renderQbtList(qbtList))
				]),

				// WebTorrent List
				E('div', { 'style': 'background: #1a1a2e; border-radius: 12px; padding: 20px; border: 1px solid #2a2a4e;' }, [
					E('h3', { 'style': 'color: #7c3aed; margin: 0 0 15px 0; font-size: 16px;' }, '\u{1F4FA} WebTorrent Streams'),
					E('div', { 'id': 'wt-list' }, this.renderWtList(wtList))
				])
			])
		]);

		poll.add(L.bind(this.pollData, this), 5);

		return view;
	},

	renderQbtList: function(torrents) {
		if (!torrents || torrents.length === 0) {
			return E('div', { 'style': 'color: #666; text-align: center; padding: 30px;' }, 'No active torrents');
		}

		return E('div', {}, torrents.slice(0, 10).map(function(t) {
			var progress = (t.progress || 0) * 100;
			var state = t.state || 'unknown';
			var stateColor = state.includes('download') ? '#00c853' : (state.includes('upload') ? '#2196f3' : '#888');

			return E('div', { 'style': 'background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 10px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 8px;' }, [
					E('span', { 'style': 'color: #e0e0e0; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;' }, t.name || 'Unknown'),
					E('span', { 'style': 'color: ' + stateColor + '; font-size: 11px; text-transform: uppercase;' }, state)
				]),
				E('div', { 'style': 'background: #2a2a3e; border-radius: 4px; height: 6px; overflow: hidden;' }, [
					E('div', { 'style': 'background: linear-gradient(90deg, #00d4ff, #7c3aed); height: 100%; width: ' + progress + '%; transition: width 0.3s;' })
				]),
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-top: 6px; color: #888; font-size: 11px;' }, [
					E('span', {}, progress.toFixed(1) + '%'),
					E('span', {}, formatSize(t.size || t.total_size || 0)),
					E('span', {}, '\u2193 ' + formatSpeed(t.dlspeed || 0) + ' \u2191 ' + formatSpeed(t.upspeed || 0))
				])
			]);
		}));
	},

	renderWtList: function(torrents) {
		if (!torrents || torrents.length === 0) {
			return E('div', { 'style': 'color: #666; text-align: center; padding: 30px;' }, 'No active streams');
		}

		return E('div', {}, torrents.slice(0, 10).map(function(t) {
			var progress = (t.progress || 0) * 100;

			return E('div', { 'style': 'background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 10px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 8px;' }, [
					E('span', { 'style': 'color: #e0e0e0; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;' }, t.name || 'Unknown'),
					E('span', { 'style': 'color: #7c3aed; font-size: 11px;' }, (t.numPeers || 0) + ' peers')
				]),
				E('div', { 'style': 'background: #2a2a3e; border-radius: 4px; height: 6px; overflow: hidden;' }, [
					E('div', { 'style': 'background: linear-gradient(90deg, #7c3aed, #00d4ff); height: 100%; width: ' + progress + '%; transition: width 0.3s;' })
				]),
				E('div', { 'style': 'display: flex; justify-content: space-between; margin-top: 6px; color: #888; font-size: 11px;' }, [
					E('span', {}, progress.toFixed(1) + '%'),
					E('span', {}, formatSize(t.length || 0)),
					E('span', {}, '\u2193 ' + formatSpeed(t.downloadSpeed || 0))
				])
			]);
		}));
	},

	pollData: function() {
		var self = this;
		return Promise.all([callQbtList(), callWtList()]).then(function(data) {
			var qbtList = (data[0] || {}).torrents || [];
			var wtList = (data[1] || {}).torrents || [];

			var qbtEl = document.getElementById('qbt-list');
			var wtEl = document.getElementById('wt-list');

			if (qbtEl) {
				qbtEl.innerHTML = '';
				qbtEl.appendChild(self.renderQbtList(qbtList));
			}
			if (wtEl) {
				wtEl.innerHTML = '';
				wtEl.appendChild(self.renderWtList(wtList));
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
