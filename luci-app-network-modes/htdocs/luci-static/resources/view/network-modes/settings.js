'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require network-modes.helpers as helpers';

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('network-modes')
		]);
	},

	render: function() {
		var m, s, o;

		m = new form.Map('network-modes', _('Network Modes Settings'),
			_('Configure network operating modes and their parameters. Changes require applying the mode.'));

		// General Configuration
		s = m.section(form.NamedSection, 'config', 'network-modes', _('General Settings'));
		s.addremove = false;
		s.anonymous = false;

		o = s.option(form.Flag, 'backup_config', _('Backup Configuration'),
			_('Automatically backup network configuration before mode changes'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'last_change', _('Last Mode Change'),
			_('Timestamp of the last mode change'));
		o.readonly = true;
		o.placeholder = 'Never';

		// Sniffer/Passthrough Mode
		s = m.section(form.NamedSection, 'sniffer', 'mode', _('Sniffer / Passthrough Mode'));
		s.description = _('Transparent bridge for deep packet inspection without routing');

		o = s.option(form.Value, 'name', _('Display Name'));
		o.default = 'Sniffer / Passthrough';
		o.rmempty = false;

		o = s.option(form.Value, 'description', _('Description'));
		o.default = 'Transparent bridge for network analysis';

		o = s.option(form.Value, 'bridge_interface', _('Bridge Interface'),
			_('Network bridge interface for sniffing'));
		o.default = 'br-lan';
		o.datatype = 'network';

		o = s.option(form.Value, 'capture_interface', _('Capture Interface'),
			_('Physical interface to capture from'));
		o.default = 'eth0';

		o = s.option(form.Flag, 'netifyd_enabled', _('Enable Netifyd DPI'),
			_('Enable deep packet inspection with Netifyd'));
		o.default = '1';

		o = s.option(form.Flag, 'promiscuous', _('Promiscuous Mode'),
			_('Enable promiscuous mode on capture interface'));
		o.default = '1';

		// Access Point Mode
		s = m.section(form.NamedSection, 'accesspoint', 'mode', _('Access Point Mode'));
		s.description = _('WiFi access point with client management');

		o = s.option(form.Value, 'name', _('Display Name'));
		o.default = 'Access Point';
		o.rmempty = false;

		o = s.option(form.Value, 'description', _('Description'));
		o.default = 'WiFi access point with optimizations';

		o = s.option(form.Value, 'upstream_interface', _('Upstream Interface'),
			_('Interface to connect to upstream network'));
		o.default = 'eth0';

		o = s.option(form.Flag, 'dhcp_client', _('DHCP Client'),
			_('Obtain IP address from upstream network via DHCP'));
		o.default = '1';

		o = s.option(form.ListValue, 'wifi_channel', _('WiFi Channel'));
		o.value('auto', _('Auto'));
		o.value('1', '1 (2.4GHz)');
		o.value('6', '6 (2.4GHz)');
		o.value('11', '11 (2.4GHz)');
		o.value('36', '36 (5GHz)');
		o.value('40', '40 (5GHz)');
		o.value('44', '44 (5GHz)');
		o.value('48', '48 (5GHz)');
		o.value('149', '149 (5GHz)');
		o.value('153', '153 (5GHz)');
		o.value('157', '157 (5GHz)');
		o.value('161', '161 (5GHz)');
		o.default = 'auto';

		o = s.option(form.ListValue, 'wifi_htmode', _('WiFi Mode'));
		o.value('HT20', 'HT20 (20MHz, 2.4GHz)');
		o.value('HT40', 'HT40 (40MHz, 2.4GHz/5GHz)');
		o.value('VHT20', 'VHT20 (20MHz, 5GHz)');
		o.value('VHT40', 'VHT40 (40MHz, 5GHz)');
		o.value('VHT80', 'VHT80 (80MHz, 5GHz)');
		o.value('VHT160', 'VHT160 (160MHz, 5GHz)');
		o.value('HE20', 'HE20 (WiFi 6, 20MHz)');
		o.value('HE40', 'HE40 (WiFi 6, 40MHz)');
		o.value('HE80', 'HE80 (WiFi 6, 80MHz)');
		o.value('HE160', 'HE160 (WiFi 6, 160MHz)');
		o.default = 'VHT80';

		o = s.option(form.Value, 'wifi_txpower', _('TX Power (dBm)'),
			_('WiFi transmit power in dBm'));
		o.datatype = 'range(1,30)';
		o.default = '20';

		o = s.option(form.Flag, 'roaming_enabled', _('Enable 802.11k/v Roaming'),
			_('Enable seamless roaming for client devices'));
		o.default = '1';

		o = s.option(form.Flag, 'band_steering', _('Enable Band Steering'),
			_('Steer clients to 5GHz when possible'));
		o.default = '1';

		// Relay/Extender Mode
		s = m.section(form.NamedSection, 'relay', 'mode', _('Relay / Extender Mode'));
		s.description = _('Network relay with WireGuard optimization');

		o = s.option(form.Value, 'name', _('Display Name'));
		o.default = 'Relay / Extender';
		o.rmempty = false;

		o = s.option(form.Value, 'description', _('Description'));
		o.default = 'Network relay with WireGuard optimization';

		o = s.option(form.Value, 'relay_interface', _('Relay Interface'),
			_('Interface to relay traffic from'));
		o.default = 'wlan0';

		o = s.option(form.Value, 'lan_interface', _('LAN Interface'),
			_('Local network interface'));
		o.default = 'eth0';

		o = s.option(form.Flag, 'wireguard_enabled', _('Enable WireGuard'),
			_('Use WireGuard VPN for relay tunnel'));
		o.default = '1';

		o = s.option(form.Value, 'wireguard_interface', _('WireGuard Interface'),
			_('WireGuard interface name'));
		o.default = 'wg0';
		o.depends('wireguard_enabled', '1');

		o = s.option(form.Flag, 'mtu_optimization', _('MTU Optimization'),
			_('Automatically optimize MTU for WireGuard'));
		o.default = '1';
		o.depends('wireguard_enabled', '1');

		o = s.option(form.Flag, 'mss_clamping', _('MSS Clamping'),
			_('Enable MSS clamping to prevent fragmentation'));
		o.default = '1';
		o.depends('wireguard_enabled', '1');

		// Router Mode
		s = m.section(form.NamedSection, 'router', 'mode', _('Router Mode'));
		s.description = _('Full router with NAT, firewall, and optional proxy');

		o = s.option(form.Value, 'name', _('Display Name'));
		o.default = 'Router';
		o.rmempty = false;

		o = s.option(form.Value, 'description', _('Description'));
		o.default = 'Full router with WAN, proxy and HTTPS frontends';

		o = s.option(form.Value, 'wan_interface', _('WAN Interface'),
			_('External network interface'));
		o.default = 'eth1';

		o = s.option(form.ListValue, 'wan_protocol', _('WAN Protocol'));
		o.value('dhcp', _('DHCP - Automatic IP'));
		o.value('static', _('Static IP'));
		o.value('pppoe', _('PPPoE'));
		o.value('dhcpv6', _('DHCPv6'));
		o.default = 'dhcp';

		o = s.option(form.Value, 'lan_interface', _('LAN Interface'),
			_('Internal network interface'));
		o.default = 'br-lan';

		o = s.option(form.Flag, 'nat_enabled', _('Enable NAT'),
			_('Enable Network Address Translation'));
		o.default = '1';

		o = s.option(form.Flag, 'firewall_enabled', _('Enable Firewall'),
			_('Enable firewall protection'));
		o.default = '1';

		o = s.option(form.Flag, 'proxy_enabled', _('Enable Proxy'),
			_('Enable HTTP/HTTPS proxy (Squid)'));
		o.default = '0';

		o = s.option(form.ListValue, 'proxy_type', _('Proxy Type'));
		o.value('squid', _('Squid - Full-featured proxy'));
		o.value('tinyproxy', _('TinyProxy - Lightweight'));
		o.default = 'squid';
		o.depends('proxy_enabled', '1');

		o = s.option(form.Flag, 'https_frontend', _('Enable HTTPS Frontend'),
			_('Enable HTTPS frontend for management'));
		o.default = '0';

		o = s.option(form.ListValue, 'frontend_type', _('Frontend Type'));
		o.value('nginx', _('Nginx'));
		o.value('uhttpd', _('uHTTPd (lightweight)'));
		o.default = 'nginx';
		o.depends('https_frontend', '1');

		o = s.option(form.DynamicList, 'frontend_domains', _('Frontend Domains'),
			_('Domains to serve via HTTPS frontend'));
		o.placeholder = 'router.example.com';
		o.depends('https_frontend', '1');

		// Info Section
		s = m.section(form.NamedSection, '_info', 'info', _('Mode Switching Information'));
		s.anonymous = true;
		s.render = function() {
			return E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'background: #fff3cd; padding: 1em; border-radius: 4px; border-left: 4px solid #ffc107; margin-top: 1em;' }, [
					E('h4', { 'style': 'margin-top: 0;' }, [
						E('span', { 'style': 'font-size: 1.5em; margin-right: 0.5em;' }, '⚠️'),
						_('Important Notes')
					]),
					E('ul', { 'style': 'margin: 0.5em 0; padding-left: 2em;' }, [
						E('li', {}, _('Save settings here, then switch mode from the Overview or Mode Wizard page')),
						E('li', {}, _('Switching modes will modify network configuration - a backup is recommended')),
						E('li', {}, _('Network connectivity may be temporarily interrupted during mode changes')),
						E('li', {}, _('After switching, verify network interfaces and services are working correctly'))
					]),
					E('div', { 'style': 'margin-top: 1em; padding: 0.75em; background: #e8f4f8; border-radius: 4px;' }, [
						E('strong', {}, _('Configuration Files:')),
						E('ul', { 'style': 'margin: 0.5em 0; padding-left: 2em;' }, [
							E('li', {}, [E('code', {}, '/etc/config/network-modes'), ' - ', _('Mode configuration')]),
							E('li', {}, [E('code', {}, '/etc/config/network'), ' - ', _('Network interfaces (modified by mode)')]),
							E('li', {}, [E('code', {}, '/etc/config/firewall'), ' - ', _('Firewall rules (modified by mode)')]),
							E('li', {}, [E('code', {}, '/etc/network-modes-backup/'), ' - ', _('Configuration backups')])
						])
					])
				])
			]);
		};

		return m.render().then(function(formEl) {
			return E('div', { 'class': 'network-modes-dashboard nm-settings' }, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
				helpers.createNavigationTabs('settings'),
				formEl
			]);
		});
	}
});
