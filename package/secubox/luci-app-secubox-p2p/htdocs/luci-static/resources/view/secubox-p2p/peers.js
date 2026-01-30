'use strict';
'require view';
'require ui';
'require secubox-p2p/api as P2PAPI';

return view.extend({
	peers: [],

	load: function() {
		var self = this;
		return P2PAPI.getPeers().then(function(result) {
			self.peers = result.peers || [];
			return {};
		}).catch(function() { return {}; });
	},

	render: function() {
		var self = this;
		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'P2P Peers'),
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'margin-bottom: 1em;' }, [
					E('button', { 'class': 'cbi-button cbi-button-action', 'click': function() { self.discoverPeers(); } }, 'Discover Peers'),
					E('button', { 'class': 'cbi-button', 'style': 'margin-left: 0.5em;', 'click': function() { self.addPeerManually(); } }, 'Add Peer')
				]),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, 'Name'),
						E('th', { 'class': 'th' }, 'Address'),
						E('th', { 'class': 'th' }, 'Status'),
						E('th', { 'class': 'th' }, 'Actions')
					])
				].concat(this.peers.map(function(peer) {
					return E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, peer.name || peer.id),
						E('td', { 'class': 'td' }, peer.address || 'Unknown'),
						E('td', { 'class': 'td' }, E('span', { 'style': 'color: ' + (peer.status === 'online' ? 'green' : 'red') }, peer.status || 'unknown')),
						E('td', { 'class': 'td' }, [
							E('button', { 'class': 'cbi-button cbi-button-remove', 'click': function() { self.removePeer(peer.id); } }, 'Remove')
						])
					]);
				})))
			])
		]);
	},

	discoverPeers: function() {
		var self = this;
		ui.addNotification(null, E('p', 'Discovering peers...'), 'info');
		P2PAPI.discover(5).then(function() {
			window.location.reload();
		});
	},

	addPeerManually: function() {
		var self = this;
		ui.showModal('Add Peer', [
			E('div', {}, [
				E('label', {}, 'Address: '),
				E('input', { 'type': 'text', 'id': 'new-peer-addr', 'class': 'cbi-input-text' }),
				E('br', {}), E('br', {}),
				E('label', {}, 'Name: '),
				E('input', { 'type': 'text', 'id': 'new-peer-name', 'class': 'cbi-input-text' })
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var addr = document.getElementById('new-peer-addr').value;
					var name = document.getElementById('new-peer-name').value;
					if (addr) {
						P2PAPI.addPeer(addr, name).then(function() {
							ui.hideModal();
							window.location.reload();
						});
					}
				} }, 'Add')
			])
		]);
	},

	removePeer: function(peerId) {
		if (confirm('Remove this peer?')) {
			P2PAPI.removePeer(peerId).then(function() {
				window.location.reload();
			});
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
