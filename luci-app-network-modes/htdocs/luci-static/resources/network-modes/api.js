'use strict';
'require baseclass';
'require rpc';

/**
 * Network Modes API
 * Package: luci-app-network-modes
 * RPCD object: luci.network-modes
 */

// Version: 0.2.2

var callStatus = rpc.declare({
	object: 'luci.network-modes',
	method: 'status',
	expect: { }
});

var callGetCurrentMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_current_mode',
	expect: { mode: '' }
});

var callGetAvailableModes = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_available_modes',
	expect: { modes: [] }
});

var callSetMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'set_mode',
	params: ['mode']
});

var callGetInterfaces = rpc.declare({
	object: 'luci.network-modes',
	method: 'get_interfaces',
	expect: { interfaces: [] }
});

var callValidateConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'validate_config',
	params: ['mode', 'config'],
	expect: { valid: false, errors: [] }
});

return baseclass.extend({
	getStatus: callStatus,
	getCurrentMode: callGetCurrentMode,
	getAvailableModes: callGetAvailableModes,
	setMode: callSetMode,
	getInterfaces: callGetInterfaces,
	validateConfig: callValidateConfig,

	// Aggregate function for overview page
	getAllData: function() {
		return Promise.all([
			callStatus(),
			callGetCurrentMode(),
			callGetAvailableModes(),
			callGetInterfaces()
		]).then(function(results) {
			var status = results[0] || {};
			var currentMode = results[1] || {};

			// Merge current_mode into status for compatibility
			status.current_mode = currentMode.mode || 'router';
			status.interfaces = (results[3] || {}).interfaces || [];

			return {
				status: status,
				modes: results[2] || { modes: [] }
			};
		});
	},

	// Get static information about a mode
	getModeInfo: function(mode) {
		var modeInfo = {
			router: {
				id: 'router',
				name: 'Router Mode',
				icon: '🏠',
				description: 'Traditional home/office router with NAT, firewall, and DHCP server. Ideal for connecting multiple devices to the internet.',
				features: [
					'NAT and firewall enabled',
					'DHCP server for LAN clients',
					'Port forwarding and DMZ',
					'QoS and traffic shaping'
				]
			},
			bridge: {
				id: 'bridge',
				name: 'Bridge Mode',
				icon: '🌉',
				description: 'Transparent layer-2 forwarding without NAT. All devices appear on the same network segment.',
				features: [
					'Layer-2 transparent bridging',
					'No NAT or routing',
					'STP/RSTP support',
					'VLAN tagging support'
				]
			},
			accesspoint: {
				id: 'accesspoint',
				name: 'Access Point',
				icon: '📡',
				description: 'WiFi access point with wired uplink. Extends your existing network wirelessly.',
				features: [
					'WiFi hotspot functionality',
					'Wired uplink to main router',
					'Multiple SSID support',
					'Fast roaming (802.11r/k/v)'
				]
			},
			relay: {
				id: 'relay',
				name: 'Repeater/Extender',
				icon: '🔁',
				description: 'WiFi to WiFi repeating to extend wireless coverage. Connects wirelessly to upstream network.',
				features: [
					'WiFi range extension',
					'Wireless uplink (WDS/Relay)',
					'Rebroadcast on same or different SSID',
					'Signal amplification'
				]
			},
			sniffer: {
				id: 'sniffer',
				name: 'Sniffer Mode',
				icon: '🔍',
				description: 'Network monitoring and packet capture mode for security analysis and troubleshooting.',
				features: [
					'Promiscuous mode capture',
					'WiFi monitor mode',
					'pcap/pcapng output',
					'Integration with Wireshark'
				]
			}
		};

		return modeInfo[mode] || {
			id: mode,
			name: mode.charAt(0).toUpperCase() + mode.slice(1),
			icon: '⚙️',
			description: 'Unknown mode',
			features: []
		};
	},

	// Format uptime seconds to human readable
	formatUptime: function(seconds) {
		if (!seconds || seconds < 0) return '0d 0h 0m';

		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var minutes = Math.floor((seconds % 3600) / 60);

		return days + 'd ' + hours + 'h ' + minutes + 'm';
	}
});
