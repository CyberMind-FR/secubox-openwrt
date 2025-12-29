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

var callPreviewChanges = rpc.declare({
	object: 'luci.network-modes',
	method: 'preview_changes',
	expect: { }
});

var callApplyMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'apply_mode',
	expect: { }
});

var callConfirmMode = rpc.declare({
	object: 'luci.network-modes',
	method: 'confirm_mode',
	expect: { }
});

var callRollback = rpc.declare({
	object: 'luci.network-modes',
	method: 'rollback',
	expect: { }
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

var callSnifferConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'sniffer_config',
	expect: { }
});

var callApConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'ap_config',
	expect: { }
});

var callRelayConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'relay_config',
	expect: { }
});

var callRouterConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'router_config',
	expect: { }
});

var callDmzConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'dmz_config',
	expect: { }
});

var callTravelConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'travel_config',
	expect: { }
});

var callDoubleNatConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'doublenat_config',
	expect: { }
});

var callMultiWanConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'multiwan_config',
	expect: { }
});

var callVpnRelayConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'vpnrelay_config',
	expect: { }
});

var callTravelScan = rpc.declare({
	object: 'luci.network-modes',
	method: 'travel_scan_networks',
	expect: { networks: [] }
});

var callUpdateSettings = rpc.declare({
	object: 'luci.network-modes',
	method: 'update_settings'
});

var callAddVhost = rpc.declare({
	object: 'luci.network-modes',
	method: 'add_vhost'
});

var callGenerateConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'generate_config',
	params: ['mode'],
	expect: { }
});

var callGenerateWireguardKeys = rpc.declare({
	object: 'luci.network-modes',
	method: 'generate_wireguard_keys',
	expect: { }
});

var callApplyWireguardConfig = rpc.declare({
	object: 'luci.network-modes',
	method: 'apply_wireguard_config',
	expect: { }
});

var callApplyMtuClamping = rpc.declare({
	object: 'luci.network-modes',
	method: 'apply_mtu_clamping',
	expect: { }
});

var callEnableTcpBbr = rpc.declare({
	object: 'luci.network-modes',
	method: 'enable_tcp_bbr',
	expect: { }
});

return baseclass.extend({
	getStatus: callStatus,
	getCurrentMode: callGetCurrentMode,
	getAvailableModes: callGetAvailableModes,
	setMode: callSetMode,
	getInterfaces: callGetInterfaces,
	getDmzConfig: callDmzConfig,
	validateConfig: callValidateConfig,
	previewChanges: callPreviewChanges,
	confirmMode: callConfirmMode,
	rollbackMode: callRollback,

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

	applyMode: function(targetMode) {
		var chain = Promise.resolve();

		if (targetMode) {
			chain = callSetMode(targetMode).then(function(result) {
				if (!result || result.success === false) {
					return Promise.reject(new Error((result && result.error) || 'Unable to prepare mode'));
				}
				return result;
			});
		}

		return chain.then(function() {
			return callApplyMode();
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
			doublenat: {
				id: 'doublenat',
				name: 'Double NAT',
				icon: '🔁',
				description: 'Operate behind an ISP router with a second isolated LAN and guest network policies.',
				features: [
					'DHCP WAN client behind ISP box',
					'Private LAN subnet (10.0.0.0/24)',
					'Optional guest bridge isolation',
					'UPnP/DMZ hardening'
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
			multiwan: {
				id: 'multiwan',
				name: 'Multi-WAN Gateway',
				icon: '⚡',
				description: 'Combine dual WAN uplinks with health tracking, load balancing, and automatic failover.',
				features: [
					'Dual uplinks (ethernet, 4G/5G, USB)',
					'Health tracking (ping/NTP/HTTP)',
					'Automatic failover with hold timers',
					'mwan3 compatible policies'
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
			vpnrelay: {
				id: 'vpnrelay',
				name: 'VPN Relay',
				icon: '🛡️',
				description: 'Inject WireGuard/OpenVPN tunnels with kill-switch, DNS override, and policy routing for LAN clients.',
				features: [
					'WireGuard & OpenVPN profiles',
					'Policy routing / split tunnel',
					'DNS override & kill switch',
					'Provider templates'
				]
			},
			travel: {
				id: 'travel',
				name: 'Travel Router',
				icon: '✈️',
				description: 'Portable router for hotels and conferences. Clones WAN MAC and creates a secure personal hotspot.',
				features: [
					'Hotel WiFi client + scan wizard',
					'MAC clone to bypass captive portals',
					'Private WPA3 hotspot for your devices',
					'Isolated NAT + DHCP sandbox'
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
	getDmzConfig: callDmzConfig,

	// Format uptime seconds to human readable
	formatUptime: function(seconds) {
		if (!seconds || seconds < 0) return '0d 0h 0m';

		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var minutes = Math.floor((seconds % 3600) / 60);

		return days + 'd ' + hours + 'h ' + minutes + 'm';
	},

	getSnifferConfig: callSnifferConfig,
	getApConfig: callApConfig,
	getRelayConfig: callRelayConfig,
	getRouterConfig: callRouterConfig,
	getTravelConfig: callTravelConfig,
	getDoubleNatConfig: callDoubleNatConfig,
	getMultiWanConfig: callMultiWanConfig,
	getVpnRelayConfig: callVpnRelayConfig,
	scanTravelNetworks: callTravelScan,

	updateSettings: function(mode, settings) {
		var payload = Object.assign({}, settings || {}, { mode: mode });
		return callUpdateSettings(payload);
	},

	addVirtualHost: function(vhost) {
		return callAddVhost(vhost);
	},

	generateConfig: function(mode) {
		return callGenerateConfig(mode);
	},

	generateWireguardKeys: function() {
		return callGenerateWireguardKeys();
	},

	applyWireguardConfig: function() {
		return callApplyWireguardConfig();
	},

	applyMtuClamping: function() {
		return callApplyMtuClamping();
	},

	enableTcpBbr: function() {
		return callEnableTcpBbr();
	}
});
			dmz: {
				id: 'dmz',
				name: 'Router + DMZ',
				icon: '🛡️',
				description: 'Traditional router with an additional DMZ interface isolated from LAN but allowed to reach WAN.',
				features: [
					'Dedicated DMZ subnet',
					'Separate firewall zone',
					'Optional DHCP for DMZ clients',
					'Quick rollback timer'
				]
			},
