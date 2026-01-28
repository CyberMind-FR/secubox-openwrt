'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require wireguard-dashboard/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.getInterfaces()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		// Handle RPC expect unwrapping - results may be array or object
		var interfacesData = data[1] || [];
		var interfaces = Array.isArray(interfacesData) ? interfacesData : (interfacesData.interfaces || []);

		var view = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('h2', {}, _('WireGuard Settings')),
			E('div', { 'class': 'cbi-map-descr' },
				_('WireGuard VPN configuration and management information.')),

			// Service Status
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Status')),
				E('div', { 'class': 'table cbi-section-table' }, [
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Active Interfaces')),
						E('div', { 'class': 'td left' }, (status.interface_count || 0).toString())
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Total Peers')),
						E('div', { 'class': 'td left' }, (status.total_peers || 0).toString())
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Active Peers')),
						E('div', { 'class': 'td left' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: ' + (status.active_peers > 0 ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
							}, (status.active_peers || 0).toString())
						])
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Total Downloaded')),
						E('div', { 'class': 'td left' }, API.formatBytes(status.total_rx || 0))
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Total Uploaded')),
						E('div', { 'class': 'td left' }, API.formatBytes(status.total_tx || 0))
					])
				])
			]),

			// Configured Interfaces
			interfaces.length > 0 ? E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Configured Interfaces')),
				E('div', { 'class': 'table cbi-section-table' }, [
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'font-weight: bold;' }, _('Interface')),
						E('div', { 'class': 'td left', 'style': 'font-weight: bold;' }, _('Public Key')),
						E('div', { 'class': 'td left', 'style': 'font-weight: bold;' }, _('Port')),
						E('div', { 'class': 'td left', 'style': 'font-weight: bold;' }, _('Peers'))
					])
				].concat(
					interfaces.map(function(iface) {
						return E('div', { 'class': 'tr cbi-section-table-row' }, [
							E('div', { 'class': 'td left' }, [
								E('strong', {}, iface.name || 'N/A')
							]),
							E('div', { 'class': 'td left' }, [
								E('code', { 'style': 'font-size: 0.85em;' },
									(iface.public_key || 'N/A').substring(0, 16) + '...')
							]),
							E('div', { 'class': 'td left' }, (iface.listen_port || 'N/A').toString()),
							E('div', { 'class': 'td left' }, ((iface.peers || []).length || 0).toString())
						]);
					})
				))
			]) : null,

			// About WireGuard
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('About WireGuard')),
				E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px;' }, [
					E('p', {}, _('WireGuard® is an extremely simple yet fast and modern VPN that utilizes state-of-the-art cryptography.')),
					E('p', { 'style': 'margin-top: 0.5em;' }, _('Key features:')),
					E('ul', { 'style': 'margin: 0.5em 0; padding-left: 2em;' }, [
						E('li', {}, _('Simple & Easy to use - minimal configuration required')),
						E('li', {}, _('High Performance - faster than IPsec and OpenVPN')),
						E('li', {}, _('Cryptographically Sound - uses modern Noise protocol framework')),
						E('li', {}, _('Cross-Platform - works on Linux, Windows, macOS, Android, iOS')),
						E('li', {}, _('Stealth - very small network footprint and quick handshakes'))
					]),
					E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #e8f4f8; border-radius: 4px;' }, [
						E('strong', {}, _('Note:')),
						' ',
						_('WireGuard uses UDP protocol and operates at layer 3 (network layer).')
					])
				])
			]),

			// Configuration Files
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Configuration Files')),
				E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px;' }, [
					E('p', {}, [
						E('strong', {}, _('UCI Network Configuration:')),
						' ',
						E('code', {}, '/etc/config/network')
					]),
					E('p', {}, [
						E('strong', {}, _('WireGuard Interface Configuration:')),
						' ',
						E('code', {}, '/etc/config/network')
					]),
					E('p', {}, [
						E('strong', {}, _('Private Keys:')),
						' ',
						E('code', {}, '/etc/wireguard/*.key')
					]),
					E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
						E('strong', {}, _('Security Warning:')),
						' ',
						_('Private keys should never be shared. Keep them secure with proper file permissions (600).')
					])
				])
			]),

			// Common Configuration Examples
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Common Configuration Examples')),

				// Create New Interface
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Create New WireGuard Interface')),
					E('p', {}, _('Generate keys and configure interface in /etc/config/network:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'# Generate key pair\n' +
						'wg genkey | tee privatekey | wg pubkey > publickey\n\n' +
						'# Add to /etc/config/network:\n' +
						'config interface \'wg0\'\n' +
						'    option proto \'wireguard\'\n' +
						'    option private_key \'<contents of privatekey>\'\n' +
						'    option listen_port \'51820\'\n' +
						'    list addresses \'10.0.0.1/24\'\n'
					)
				]),

				// Add Peer
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Add Peer to Interface')),
					E('p', {}, _('Configure peer in /etc/config/network:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'config wireguard_wg0\n' +
						'    option public_key \'<peer public key>\'\n' +
						'    option preshared_key \'<optional preshared key>\'\n' +
						'    list allowed_ips \'10.0.0.2/32\'\n' +
						'    option endpoint_host \'peer.example.com\'\n' +
						'    option endpoint_port \'51820\'\n' +
						'    option persistent_keepalive \'25\'\n' +
						'    option route_allowed_ips \'1\'\n'
					),
					E('p', { 'style': 'color: #666; font-size: 0.9em;' },
						_('Use persistent_keepalive for peers behind NAT. Set to 25 seconds for most cases.'))
				]),

				// Road Warrior Setup
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Road Warrior Server Setup')),
					E('p', {}, _('Configure WireGuard as a VPN server for remote clients:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'# Server interface\n' +
						'config interface \'wg0\'\n' +
						'    option proto \'wireguard\'\n' +
						'    option private_key \'<server private key>\'\n' +
						'    option listen_port \'51820\'\n' +
						'    list addresses \'10.99.0.1/24\'\n\n' +
						'# Firewall zone\n' +
						'config zone\n' +
						'    option name \'vpn\'\n' +
						'    option network \'wg0\'\n' +
						'    option input \'ACCEPT\'\n' +
						'    option output \'ACCEPT\'\n' +
						'    option forward \'ACCEPT\'\n' +
						'    option masq \'1\'\n'
					)
				]),

				// Site-to-Site VPN
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Site-to-Site VPN')),
					E('p', {}, _('Connect two networks over WireGuard:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'# Site A (192.168.1.0/24)\n' +
						'config wireguard_wg0\n' +
						'    option public_key \'<Site B public key>\'\n' +
						'    list allowed_ips \'10.0.0.2/32\'\n' +
						'    list allowed_ips \'192.168.2.0/24\'\n' +
						'    option endpoint_host \'site-b.example.com\'\n' +
						'    option persistent_keepalive \'25\'\n\n' +
						'# Site B (192.168.2.0/24)\n' +
						'config wireguard_wg0\n' +
						'    option public_key \'<Site A public key>\'\n' +
						'    list allowed_ips \'10.0.0.1/32\'\n' +
						'    list allowed_ips \'192.168.1.0/24\'\n' +
						'    option persistent_keepalive \'25\'\n'
					),
					E('p', { 'style': 'color: #666; font-size: 0.9em;' },
						_('Both sides need to allow the remote network in allowed_ips for routing.'))
				])
			]),

			// Useful Commands
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em; background: #e8f4f8; padding: 1em;' }, [
				E('h3', {}, _('Useful Commands')),
				E('pre', { 'style': 'background: white; padding: 1em; border-radius: 4px; overflow-x: auto;' }, [
					'# Show current configuration\n',
					'wg show\n',
					'wg show wg0\n',
					'\n',
					'# Generate key pair\n',
					'wg genkey | tee privatekey | wg pubkey > publickey\n',
					'\n',
					'# Generate preshared key (optional, additional security)\n',
					'wg genpsk > presharedkey\n',
					'\n',
					'# Restart interface\n',
					'ifdown wg0 && ifup wg0\n',
					'\n',
					'# View interface status\n',
					'ip addr show wg0\n',
					'ip route show dev wg0\n',
					'\n',
					'# Check connectivity\n',
					'ping -c 3 10.0.0.1\n',
					'\n',
					'# Monitor logs\n',
					'logread -f | grep wireguard\n',
					'\n',
					'# Apply network configuration\n',
					'/etc/init.d/network reload\n'
				])
			]),

			// Security Best Practices
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Security Best Practices')),
				E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px;' }, [
					E('ul', { 'style': 'margin: 0.5em 0; padding-left: 2em;' }, [
						E('li', {}, _('Never share private keys - generate unique keys for each peer')),
						E('li', {}, _('Use preshared keys for post-quantum security (optional)')),
						E('li', {}, _('Limit allowed_ips to only necessary networks/hosts')),
						E('li', {}, _('Use firewall rules to restrict access to WireGuard port')),
						E('li', {}, _('Enable persistent_keepalive for NAT traversal (25 seconds recommended)')),
						E('li', {}, _('Regularly rotate keys (recommended: every 6-12 months)')),
						E('li', {}, _('Monitor active connections and disconnect unused peers'))
					]),
					E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
						E('strong', {}, _('Important:')),
						' ',
						_('WireGuard is designed to be secure by default. Follow these practices to maintain security.')
					])
				])
			]),

			// Documentation Links
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Documentation & Resources')),
				E('ul', { 'style': 'margin-top: 0.5em;' }, [
					E('li', {}, [
						E('a', { 'href': 'https://www.wireguard.com/', 'target': '_blank' },
							_('Official WireGuard Website'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://www.wireguard.com/quickstart/', 'target': '_blank' },
							_('Quick Start Guide'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://openwrt.org/docs/guide-user/services/vpn/wireguard/start', 'target': '_blank' },
							_('OpenWrt WireGuard Documentation'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://github.com/pirate/wireguard-docs', 'target': '_blank' },
							_('WireGuard Documentation Repository'))
					]),
					E('li', {}, [
						E('code', {}, 'man wg'),
						' - ',
						_('WireGuard command-line manual')
					])
				])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
