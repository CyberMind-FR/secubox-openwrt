"use strict";
"require view";
"require ui";
"require rpc";

var callGetPeers = rpc.declare({
	object: "luci.secubox-p2p",
	method: "get_peers",
	expect: { peers: [] }
});

return view.extend({
	peers: [],

	load: function() {
		var self = this;
		return callGetPeers().then(function(result) {
			// Handle RPC expect extraction: result IS the peers array
			self.peers = Array.isArray(result) ? result : (result.peers || []);
			return {};
		}).catch(function(err) {
			console.error("P2P Peers error:", err);
			return {};
		});
	},

	render: function() {
		var self = this;
		var rows = [];

		rows.push(E("tr", { "class": "tr table-titles" }, [
			E("th", { "class": "th" }, "Name"),
			E("th", { "class": "th" }, "Address"),
			E("th", { "class": "th" }, "Status"),
			E("th", { "class": "th" }, "Actions")
		]));

		if (this.peers && this.peers.length > 0) {
			this.peers.forEach(function(peer) {
				rows.push(E("tr", { "class": "tr" }, [
					E("td", { "class": "td" }, peer.name || peer.id),
					E("td", { "class": "td" }, peer.address || "Unknown"),
					E("td", { "class": "td" }, E("span", {
						"style": "color: " + (peer.status === "online" ? "#10b981" : "#ef4444")
					}, peer.status || "unknown")),
					E("td", { "class": "td" }, [
						E("button", {
							"class": "cbi-button cbi-button-remove",
							"click": function() { self.removePeer(peer.id); }
						}, "Remove")
					])
				]));
			});
		} else {
			rows.push(E("tr", { "class": "tr" }, [
				E("td", { "class": "td", "colspan": "4", "style": "text-align:center" },
					"No peers found. Click Discover to find peers.")
			]));
		}

		return E("div", { "class": "cbi-map" }, [
			E("h2", {}, "P2P Peers"),
			E("div", { "class": "cbi-section" }, [
				E("div", { "style": "margin-bottom: 1em;" }, [
					E("button", {
						"class": "cbi-button cbi-button-action",
						"click": function() { self.discoverPeers(); }
					}, "Discover Peers"),
					E("button", {
						"class": "cbi-button",
						"style": "margin-left: 0.5em;",
						"click": function() { self.addPeerManually(); }
					}, "Add Peer")
				]),
				E("table", { "class": "table" }, rows)
			])
		]);
	},

	discoverPeers: function() {
		ui.addNotification(null, E("p", "Discovering peers..."), "info");
		location.reload();
	},

	addPeerManually: function() {
		ui.addNotification(null, E("p", "Manual add not implemented yet"), "info");
	},

	removePeer: function(peerId) {
		ui.addNotification(null, E("p", "Remove not implemented yet"), "info");
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
