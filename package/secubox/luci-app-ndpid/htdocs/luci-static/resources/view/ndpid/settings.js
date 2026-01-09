'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require ndpid.api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var NDPID_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'flows', icon: '🔍', label: 'Flows' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderNdpidNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:8px;background:rgba(255,255,255,0.05);border-radius:12px;'
	}, NDPID_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'ndpid', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('nDPId Settings'),

	load: function() {
		return Promise.all([
			uci.load('ndpid'),
			api.getInterfaces().catch(function() { return {}; })
		]);
	},

	render: function(data) {
		var interfaces = data[1] || {};
		var available = (interfaces && interfaces.available) ? interfaces.available : ['br-lan', 'eth0', 'eth1', 'wlan0'];

		var m, s, o;

		m = new form.Map('ndpid', _('nDPId Configuration'),
			_('Configure the nDPId deep packet inspection daemon.'));

		// Main Settings
		s = m.section(form.TypedSection, 'ndpid', _('Service Settings'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable nDPId'),
			_('Start nDPId service on boot'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.MultiValue, 'interface', _('Monitored Interfaces'),
			_('Select network interfaces to monitor for traffic'));
		available.forEach(function(iface) {
			o.value(iface, iface);
		});
		o.default = 'br-lan';

		o = s.option(form.Value, 'max_flows', _('Maximum Flows'),
			_('Maximum number of concurrent flows to track'));
		o.datatype = 'uinteger';
		o.default = '100000';
		o.placeholder = '100000';

		o = s.option(form.Value, 'collector_socket', _('Collector Socket'),
			_('Path to the collector socket'));
		o.default = '/var/run/ndpid/collector.sock';
		o.placeholder = '/var/run/ndpid/collector.sock';

		o = s.option(form.Value, 'flow_idle_timeout', _('Flow Idle Timeout (ms)'),
			_('Time before idle flows are expired'));
		o.datatype = 'uinteger';
		o.default = '600000';
		o.placeholder = '600000';

		o = s.option(form.Value, 'tcp_timeout', _('TCP Timeout (ms)'),
			_('Timeout for TCP connections'));
		o.datatype = 'uinteger';
		o.default = '7200000';
		o.placeholder = '7200000';

		o = s.option(form.Value, 'udp_timeout', _('UDP Timeout (ms)'),
			_('Timeout for UDP flows'));
		o.datatype = 'uinteger';
		o.default = '180000';
		o.placeholder = '180000';

		o = s.option(form.Flag, 'compression', _('Enable Compression'),
			_('Compress data sent to distributor'));
		o.default = '1';

		// Distributor Settings
		s = m.section(form.TypedSection, 'ndpisrvd', _('Distributor Settings'),
			_('Configure the nDPIsrvd event distributor'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Distributor'),
			_('Enable nDPIsrvd event distribution'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'listen_socket', _('Listen Socket'),
			_('Unix socket path for clients'));
		o.default = '/var/run/ndpid/distributor.sock';

		o = s.option(form.Value, 'tcp_port', _('TCP Port'),
			_('TCP port for remote clients (0 to disable)'));
		o.datatype = 'port';
		o.default = '7000';
		o.placeholder = '7000';

		o = s.option(form.Value, 'tcp_address', _('TCP Address'),
			_('Address to bind TCP listener'));
		o.default = '127.0.0.1';
		o.placeholder = '127.0.0.1';

		o = s.option(form.Value, 'max_clients', _('Max Clients'),
			_('Maximum number of connected clients'));
		o.datatype = 'uinteger';
		o.default = '10';

		// Compatibility Layer
		s = m.section(form.TypedSection, 'compat', _('Compatibility Layer'),
			_('Netifyd-compatible output for existing consumers'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Compatibility'),
			_('Generate Netifyd-compatible status files'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'status_file', _('Status File'),
			_('Path for Netifyd-compatible status.json'));
		o.default = '/var/run/netifyd/status.json';

		o = s.option(form.Value, 'update_interval', _('Update Interval'),
			_('How often to update status file (seconds)'));
		o.datatype = 'uinteger';
		o.default = '1';

		// Flow Actions
		s = m.section(form.TypedSection, 'actions', _('Flow Actions'),
			_('Automatic actions based on detected applications'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Flow Actions'),
			_('Process flow events and update ipsets'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'bittorrent_ipset', _('BitTorrent IPSet'),
			_('IPSet for BitTorrent traffic'));
		o.default = 'secubox-bittorrent';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'bittorrent_timeout', _('BitTorrent Timeout'),
			_('IPSet entry timeout in seconds'));
		o.datatype = 'uinteger';
		o.default = '900';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'streaming_ipset', _('Streaming IPSet'),
			_('IPSet for streaming services'));
		o.default = 'secubox-streaming';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'blocked_ipset', _('Blocked IPSet'),
			_('IPSet for blocked applications'));
		o.default = 'secubox-blocked';
		o.depends('enabled', '1');

		o = s.option(form.DynamicList, 'blocked_app', _('Blocked Applications'),
			_('Applications to block'));
		o.value('bittorrent', 'BitTorrent');
		o.value('tor', 'Tor');
		o.value('vpn_udp', 'VPN (UDP)');
		o.depends('enabled', '1');

		return m.render().then(function(formEl) {
			var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
			wrapper.appendChild(SbHeader.render());
			wrapper.appendChild(renderNdpidNav('settings'));
			wrapper.appendChild(formEl);
			return wrapper;
		});
	}
});
