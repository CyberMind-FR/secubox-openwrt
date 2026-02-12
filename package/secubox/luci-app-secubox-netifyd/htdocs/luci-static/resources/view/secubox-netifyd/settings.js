'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require rpc';
'require secubox-netifyd/api as netifydAPI';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var NETIFYD_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'flows', icon: '🔍', label: 'Flows' },
	{ id: 'devices', icon: '💻', label: 'Devices' },
	{ id: 'applications', icon: '📱', label: 'Applications' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderNetifydNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, NETIFYD_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'netifyd', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#667eea,#764ba2);color:white;' : 'color:#a0a0b0;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name']
});

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('secubox-netifyd'),
			L.resolveDefault(callServiceList('netifyd'), {})
		]);
	},

	render: function(data) {
		var m, s, o;
		var netifydStatus = data[1] && data[1].netifyd;
		var isRunning = false;

		// Check all instances for running status
		if (netifydStatus && netifydStatus.instances) {
			for (var inst in netifydStatus.instances) {
				if (netifydStatus.instances[inst].running) {
					isRunning = true;
					break;
				}
			}
		}

		// Build description with status banner
		var description = E('div', [
			E('p', _('Configure Netifyd Deep Packet Inspection integration settings')),
			netifydStatus ? E('div', {
				'class': 'alert-message',
				'style': 'background: ' + (isRunning ?
					'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
					'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)') +
					'; color: white; padding: 1rem; margin-top: 1rem; border-radius: 8px; display: flex; align-items: center; gap: 1rem'
			}, [
				E('i', {
					'class': 'fa fa-' + (isRunning ? 'check-circle' : 'exclamation-triangle'),
					'style': 'font-size: 2em'
				}),
				E('div', [
					E('strong', { 'style': 'font-size: 1.1em; display: block; margin-bottom: 0.25rem' },
						_('Netifyd Service: %s').format(isRunning ? _('Running') : _('Stopped'))),
					E('small', { 'style': 'opacity: 0.9' },
						isRunning ?
							_('Deep packet inspection engine is active and monitoring network traffic') :
							_('Service is not running. Enable and save settings to start monitoring'))
				])
			]) : null
		]);

		m = new form.Map('secubox-netifyd',
			E('span', [
				E('i', { 'class': 'fa fa-cog', 'style': 'margin-right: 0.5rem' }),
				_('Netifyd Settings')
			]),
			description
		);

		// ========== General Settings Section ==========
		s = m.section(form.TypedSection, 'settings',
			E('span', [
				E('i', { 'class': 'fa fa-sliders-h', 'style': 'margin-right: 0.5rem' }),
				_('General Settings')
			])
		);
		s.anonymous = true;
		s.addremove = false;
		s.description = _('Core configuration for Netifyd integration and service behavior');

		o = s.option(form.Flag, 'enabled',
			E('span', [
				E('i', { 'class': 'fa fa-power-off', 'style': 'margin-right: 0.5rem' }),
				_('Enable Integration')
			]),
			_('Enable SecuBox integration with Netifyd DPI engine')
		);
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'auto_start',
			E('span', [
				E('i', { 'class': 'fa fa-play-circle', 'style': 'margin-right: 0.5rem' }),
				_('Auto Start')
			]),
			_('Automatically start Netifyd service when the system boots')
		);
		o.default = '1';
		o.rmempty = false;

		// Socket Configuration
		o = s.option(form.ListValue, 'socket_type',
			E('span', [
				E('i', { 'class': 'fa fa-plug', 'style': 'margin-right: 0.5rem' }),
				_('Socket Type')
			]),
			_('Communication method for connecting to Netifyd daemon')
		);
		o.value('tcp', _('TCP/IP Socket (Recommended)'));
		o.value('unix', _('Unix Domain Socket'));
		o.default = 'tcp';

		o = s.option(form.Value, 'socket_address',
			E('span', [
				E('i', { 'class': 'fa fa-server', 'style': 'margin-right: 0.5rem' }),
				_('Socket Address')
			]),
			_('IP address for TCP socket connection (localhost recommended)')
		);
		o.default = '127.0.0.1';
		o.depends('socket_type', 'tcp');
		o.datatype = 'ipaddr';
		o.placeholder = '127.0.0.1';

		o = s.option(form.Value, 'socket_port',
			E('span', [
				E('i', { 'class': 'fa fa-ethernet', 'style': 'margin-right: 0.5rem' }),
				_('Socket Port')
			]),
			_('Port number for TCP socket connection')
		);
		o.default = '7150';
		o.depends('socket_type', 'tcp');
		o.datatype = 'port';
		o.placeholder = '7150';

		o = s.option(form.Value, 'unix_socket_path',
			E('span', [
				E('i', { 'class': 'fa fa-folder', 'style': 'margin-right: 0.5rem' }),
				_('Unix Socket Path')
			]),
			_('Filesystem path to Unix domain socket')
		);
		o.default = '/var/run/netifyd/netifyd.sock';
		o.depends('socket_type', 'unix');
		o.placeholder = '/var/run/netifyd/netifyd.sock';

		o = s.option(form.Value, 'flow_retention',
			E('span', [
				E('i', { 'class': 'fa fa-clock', 'style': 'margin-right: 0.5rem' }),
				_('Flow Retention')
			]),
			_('Duration in seconds to retain flow data in memory (3600 = 1 hour)')
		);
		o.default = '3600';
		o.datatype = 'uinteger';
		o.placeholder = '3600';

	o = s.option(form.Value, 'max_flows',
		E('span', [
			E('i', { 'class': 'fa fa-database', 'style': 'margin-right: 0.5rem' }),
			_('Maximum Flows')
		]),
		_('Maximum number of concurrent flows to track (higher values use more memory)')
	);
	o.default = '10000';
	o.datatype = 'uinteger';
	o.placeholder = '10000';

	// ========== Flow Export Settings ==========
	s = m.section(form.TypedSection, 'sink',
		E('span', [
			E('i', { 'class': 'fa fa-stream', 'style': 'margin-right: 0.5rem' }),
			_('Flow Export')
		])
	);
	s.anonymous = true;
	s.addremove = false;
	s.description = _('Control how Netifyd exports flow data (sinks can be a UNIX socket or TCP listener).');

	o = s.option(form.Flag, 'enabled',
		E('span', [
			E('i', { 'class': 'fa fa-toggle-on', 'style': 'margin-right: 0.5rem' }),
			_('Enable Flow Sink')
		]),
		_('Automatically configure Netifyd to export flow summaries for dashboards or collectors')
	);
	o.default = '0';

	o = s.option(form.ListValue, 'type',
		E('span', [
			E('i', { 'class': 'fa fa-plug', 'style': 'margin-right: 0.5rem' }),
			_('Sink Type')
		]),
		_('Choose how Netifyd exposes flow exports (UNIX socket is strongly recommended)')
	);
	o.value('unix', _('Unix Domain Socket (file)'));
	o.value('tcp', _('TCP Socket (port)'));
	o.default = 'unix';
	o.depends('enabled', '1');

	o = s.option(form.Value, 'unix_path',
		_('Unix Socket Path'),
		_('Filesystem path that netifyd will write flow export JSON to')
	);
	o.default = '/tmp/netifyd-flows.json';
	o.depends('type', 'unix');

	o = s.option(form.Value, 'tcp_address',
		_('TCP Listen Address'),
		_('Bind address for the TCP sink (e.g. loopback)')
	);
	o.default = '127.0.0.1';
	o.depends('type', 'tcp');
	o.datatype = 'ipaddr';

	o = s.option(form.Value, 'tcp_port',
		_('TCP Listen Port'),
		_('Port where Netifyd will serve exported flows')
	);
	o.default = '9501';
	o.datatype = 'port';
	o.depends('type', 'tcp');

	// ========== Flow Plugin Templates ==========
	s = m.section(form.NamedSection, 'bittorrent', 'plugin',
		E('span', [
			E('i', { 'class': 'fa fa-hashtag', 'style': 'margin-right: 0.5rem' }),
			_('BitTorrent IP Set')
		]),
		_('Mark BitTorrent flows with an ipset so nftables rules can react to them.'));
	s.addremove = false;

	o = s.option(form.Flag, 'enabled',
		E('span', [
			E('i', { 'class': 'fa fa-toggle-on', 'style': 'margin-right: 0.5rem' }),
			_('Enable Plugin')
		]),
		_('Generate the Netify plugin config described in the BitTorrent IP set example.')
	);
	o.default = '0';
	o.rmempty = false;

	o = s.option(form.Value, 'ipset',
		E('span', [
			E('i', { 'class': 'fa fa-database', 'style': 'margin-right: 0.5rem' }),
			_('Target IP Set')
		]),
		_('IP set name used to tag BitTorrent traffic.')
	);
	o.default = 'secubox-bittorrent';

	o = s.option(form.ListValue, 'ipset_family',
		E('span', [
			E('i', { 'class': 'fa fa-globe', 'style': 'margin-right: 0.5rem' }),
			_('IP Family')
		]),
		_('IP set family used by the plugin (inet or inet6).')
	);
	o.value('inet', _('IPv4 (inet)'));
	o.value('inet6', _('IPv6 (inet6)'));
	o.default = 'inet';

	o = s.option(form.Value, 'match_application',
		E('span', [
			E('i', { 'class': 'fa fa-search', 'style': 'margin-right: 0.5rem' }),
			_('Match Application')
		]),
		_('Application identifier that triggers the IP set entry (default: bittorrent).')
	);
	o.default = 'bittorrent';

	s = m.section(form.NamedSection, 'nftables', 'plugin',
		E('span', [
			E('i', { 'class': 'fa fa-fire', 'style': 'margin-right: 0.5rem' }),
			_('nftables Verdicts')
		]),
		_('Emit flow verdicts into nftables chains after the Netify block-traffic example.'));
	s.addremove = false;

	o = s.option(form.Flag, 'enabled',
		E('span', [
			E('i', { 'class': 'fa fa-toggle-on', 'style': 'margin-right: 0.5rem' }),
			_('Enable Plugin')
		]),
		_('Generate the Netify plugin config described in the nftables example.')
	);
	o.default = '0';
	o.rmempty = false;

	o = s.option(form.Value, 'table',
		E('span', [
			E('i', { 'class': 'fa fa-table', 'style': 'margin-right: 0.5rem' }),
			_('nftables Table')
		]),
		_('Table where the plugin will insert verdicts.')
	);
	o.default = 'filter';

	o = s.option(form.Value, 'chain',
		E('span', [
			E('i', { 'class': 'fa fa-chain', 'style': 'margin-right: 0.5rem' }),
			_('nftables Chain')
		]),
		_('Chain used by the verdicts.')
	);
	o.default = 'SECUBOX';

	o = s.option(form.Value, 'action',
		E('span', [
			E('i', { 'class': 'fa fa-ban', 'style': 'margin-right: 0.5rem' }),
			_('Action')
		]),
		_('Action applied when the plugin matches a flow (drop/reject/queue).')
	);
	o.default = 'drop';

	o = s.option(form.Value, 'target_ipset',
		E('span', [
			E('i', { 'class': 'fa fa-database', 'style': 'margin-right: 0.5rem' }),
			_('Target IP Set')
		]),
		_('nftables ipset referenced by the verdict chain.')
	);
	o.default = 'secubox-banned';

	// ========== Flow Actions Processor Plugin ==========
	s = m.section(form.NamedSection, 'flow_actions', 'plugin',
		E('span', [
			E('i', { 'class': 'fa fa-cogs', 'style': 'margin-right: 0.5rem' }),
			_('Flow Actions Processor')
		]),
		_('Enable the Flow Actions processor plugin for advanced flow handling.'));
	s.addremove = false;

	o = s.option(form.Flag, 'enabled',
		E('span', [
			E('i', { 'class': 'fa fa-toggle-on', 'style': 'margin-right: 0.5rem' }),
			_('Enable Plugin')
		]),
		_('Requires netify-proc-flow-actions package from Netify repository.')
	);
	o.default = '0';
	o.rmempty = false;

	o = s.option(form.Value, 'config_file',
		E('span', [
			E('i', { 'class': 'fa fa-file-code', 'style': 'margin-right: 0.5rem' }),
			_('Configuration File')
		]),
		_('Path to the flow actions JSON configuration file.')
	);
	o.default = '/etc/netifyd/flow-actions.json';

	// ========== Streaming Services IP Set ==========
	s = m.section(form.NamedSection, 'streaming', 'plugin',
		E('span', [
			E('i', { 'class': 'fa fa-play-circle', 'style': 'margin-right: 0.5rem' }),
			_('Streaming Services IP Set')
		]),
		_('Tag streaming service traffic (Netflix, YouTube, Spotify, etc.) with an ipset.'));
	s.addremove = false;

	o = s.option(form.Flag, 'enabled',
		E('span', [
			E('i', { 'class': 'fa fa-toggle-on', 'style': 'margin-right: 0.5rem' }),
			_('Enable Plugin')
		]),
		_('Add streaming service IPs to the configured ipset.')
	);
	o.default = '0';
	o.rmempty = false;

	o = s.option(form.Value, 'ipset',
		E('span', [
			E('i', { 'class': 'fa fa-database', 'style': 'margin-right: 0.5rem' }),
			_('Target IP Set')
		]),
		_('IP set name used to tag streaming traffic.')
	);
	o.default = 'secubox-streaming';

	o = s.option(form.ListValue, 'ipset_family',
		E('span', [
			E('i', { 'class': 'fa fa-globe', 'style': 'margin-right: 0.5rem' }),
			_('IP Family')
		]),
		_('IP set family (inet or inet6).')
	);
	o.value('inet', _('IPv4 (inet)'));
	o.value('inet6', _('IPv6 (inet6)'));
	o.default = 'inet';

	o = s.option(form.Value, 'ipset_timeout',
		E('span', [
			E('i', { 'class': 'fa fa-clock', 'style': 'margin-right: 0.5rem' }),
			_('IP Set Timeout')
		]),
		_('Timeout in seconds for ipset entries.')
	);
	o.default = '1800';
	o.datatype = 'uinteger';

	// ========== Category Blocking Plugin ==========
	s = m.section(form.NamedSection, 'category_block', 'plugin',
		E('span', [
			E('i', { 'class': 'fa fa-shield-alt', 'style': 'margin-right: 0.5rem' }),
			_('Category Blocking')
		]),
		_('Block traffic based on application categories (malware, ads, tracking).'));
	s.addremove = false;

	o = s.option(form.Flag, 'enabled',
		E('span', [
			E('i', { 'class': 'fa fa-toggle-on', 'style': 'margin-right: 0.5rem' }),
			_('Enable Plugin')
		]),
		_('Block flows matching specified categories.')
	);
	o.default = '0';
	o.rmempty = false;

	o = s.option(form.Value, 'table',
		E('span', [
			E('i', { 'class': 'fa fa-table', 'style': 'margin-right: 0.5rem' }),
			_('nftables Table')
		]),
		_('Table where the plugin will insert verdicts.')
	);
	o.default = 'inet secubox';

	o = s.option(form.Value, 'chain',
		E('span', [
			E('i', { 'class': 'fa fa-chain', 'style': 'margin-right: 0.5rem' }),
			_('nftables Chain')
		]),
		_('Chain used by the verdicts.')
	);
	o.default = 'flow_actions';

	o = s.option(form.ListValue, 'action',
		E('span', [
			E('i', { 'class': 'fa fa-ban', 'style': 'margin-right: 0.5rem' }),
			_('Action')
		]),
		_('Action applied when the plugin matches a flow.')
	);
	o.value('drop', _('Drop'));
	o.value('reject', _('Reject'));
	o.default = 'drop';

	// ========== Apply Plugins Button ==========
	s = m.section(form.NamedSection, 'nftables', 'plugin');
	s.addremove = false;
	s.anonymous = true;

	o = s.option(form.Button, 'apply_plugins',
		E('span', [
			E('i', { 'class': 'fa fa-sync', 'style': 'margin-right: 0.5rem' }),
			_('Apply All Flow Plugins')
		]),
		_('Regenerate all plugin configs and restart Netifyd.')
	);
	o.inputstyle = 'action important';
	o.write = function() {
		netifydAPI.applyPluginConfig().then(function(result) {
			ui.addNotification(null, E('p', result.message || _('Plugin configuration applied')), 'success');
		}).catch(function(err) {
			ui.addNotification(null, E('p', (err && err.message) || _('Plugin configuration failed')), 'error');
		});
	};

	// ========== Plugin Setup Instructions ==========
	s = m.section(form.NamedSection, 'settings', 'settings',
		E('span', [
			E('i', { 'class': 'fa fa-info-circle', 'style': 'margin-right: 0.5rem' }),
			_('Plugin Installation')
		]),
		E('div', { 'style': 'background: #f0f4f8; padding: 15px; border-radius: 8px; margin-top: 10px;' }, [
			E('p', { 'style': 'margin: 0 0 10px 0;' }, _('To use plugins, add the Netify repository and install required packages:')),
			E('pre', { 'style': 'background: #1e293b; color: #e2e8f0; padding: 10px; border-radius: 4px; overflow-x: auto;' },
				'netifyd-plugin-setup add-feed\n' +
				'netifyd-plugin-setup install netify-proc-flow-actions\n' +
				'netifyd-plugin-setup create-ipsets'
			),
			E('p', { 'style': 'margin: 10px 0 0 0; font-size: 0.9em; color: #64748b;' },
				_('See /usr/bin/netifyd-plugin-setup for more options.'))
		]));
	s.addremove = false;

	// ========== Monitoring Settings Section ==========
	s = m.section(form.TypedSection, 'monitoring',
			E('span', [
				E('i', { 'class': 'fa fa-eye', 'style': 'margin-right: 0.5rem' }),
				_('Monitoring Features')
			])
		);
		s.anonymous = true;
		s.addremove = false;
		s.description = _('Toggle specific monitoring and detection capabilities');

		o = s.option(form.Flag, 'enable_flow_tracking',
			E('span', [
				E('i', { 'class': 'fa fa-stream', 'style': 'margin-right: 0.5rem; color: #3b82f6' }),
				_('Flow Tracking')
			]),
			_('Monitor and record individual network flows between devices')
		);
		o.default = '1';

		o = s.option(form.Flag, 'enable_app_detection',
			E('span', [
				E('i', { 'class': 'fa fa-cubes', 'style': 'margin-right: 0.5rem; color: #10b981' }),
				_('Application Detection')
			]),
			_('Identify applications using deep packet inspection (HTTP, HTTPS, SSH, etc.)')
		);
		o.default = '1';

		o = s.option(form.Flag, 'enable_protocol_detection',
			E('span', [
				E('i', { 'class': 'fa fa-project-diagram', 'style': 'margin-right: 0.5rem; color: #8b5cf6' }),
				_('Protocol Detection')
			]),
			_('Detect and classify network protocols (TCP, UDP, ICMP, etc.)')
		);
		o.default = '1';

		o = s.option(form.Flag, 'enable_device_tracking',
			E('span', [
				E('i', { 'class': 'fa fa-network-wired', 'style': 'margin-right: 0.5rem; color: #f59e0b' }),
				_('Device Tracking')
			]),
			_('Track devices on the network by MAC/IP address and monitor activity')
		);
		o.default = '1';

		o = s.option(form.Flag, 'enable_ssl_inspection',
			E('span', [
				E('i', { 'class': 'fa fa-lock', 'style': 'margin-right: 0.5rem; color: #ef4444' }),
				_('SSL/TLS Inspection')
			]),
			_('Inspect SSL/TLS certificates, SNI, and encrypted connection metadata')
		);
		o.default = '1';

		o = s.option(form.Flag, 'enable_dns_inspection',
			E('span', [
				E('i', { 'class': 'fa fa-globe', 'style': 'margin-right: 0.5rem; color: #06b6d4' }),
				_('DNS Inspection')
			]),
			_('Monitor DNS queries and responses to track domain name resolution')
		);
		o.default = '1';

		// ========== Analytics Settings Section ==========
		s = m.section(form.TypedSection, 'analytics',
			E('span', [
				E('i', { 'class': 'fa fa-chart-bar', 'style': 'margin-right: 0.5rem' }),
				_('Analytics & Statistics')
			])
		);
		s.anonymous = true;
		s.addremove = false;
		s.description = _('Configure analytics data collection, retention, and display limits');

		o = s.option(form.Flag, 'enabled',
			E('span', [
				E('i', { 'class': 'fa fa-chart-line', 'style': 'margin-right: 0.5rem' }),
				_('Enable Analytics')
			]),
			_('Collect and analyze statistics from network traffic data')
		);
		o.default = '1';

		o = s.option(form.Value, 'retention_days',
			E('span', [
				E('i', { 'class': 'fa fa-calendar-alt', 'style': 'margin-right: 0.5rem' }),
				_('Retention Period (days)')
			]),
			_('Number of days to retain historical analytics data')
		);
		o.default = '7';
		o.datatype = 'uinteger';
		o.depends('enabled', '1');
		o.placeholder = '7';

		o = s.option(form.Value, 'top_apps_limit',
			E('span', [
				E('i', { 'class': 'fa fa-list-ol', 'style': 'margin-right: 0.5rem' }),
				_('Top Applications Limit')
			]),
			_('Maximum number of top applications to display in analytics')
		);
		o.default = '10';
		o.datatype = 'uinteger';
		o.depends('enabled', '1');
		o.placeholder = '10';

		o = s.option(form.Value, 'top_protocols_limit',
			E('span', [
				E('i', { 'class': 'fa fa-list-ol', 'style': 'margin-right: 0.5rem' }),
				_('Top Protocols Limit')
			]),
			_('Maximum number of top protocols to display in analytics')
		);
		o.default = '10';
		o.datatype = 'uinteger';
		o.depends('enabled', '1');
		o.placeholder = '10';

		o = s.option(form.Value, 'top_devices_limit',
			E('span', [
				E('i', { 'class': 'fa fa-list-ol', 'style': 'margin-right: 0.5rem' }),
				_('Top Devices Limit')
			]),
			_('Maximum number of top devices to display in analytics')
		);
		o.default = '20';
		o.datatype = 'uinteger';
		o.depends('enabled', '1');
		o.placeholder = '20';

		// ========== Alerts Settings Section ==========
		s = m.section(form.TypedSection, 'alerts',
			E('span', [
				E('i', { 'class': 'fa fa-bell', 'style': 'margin-right: 0.5rem' }),
				_('Alert Notifications')
			])
		);
		s.anonymous = true;
		s.addremove = false;
		s.description = _('Configure alert triggers and notification thresholds');

		o = s.option(form.Flag, 'enabled',
			E('span', [
				E('i', { 'class': 'fa fa-bell-on', 'style': 'margin-right: 0.5rem' }),
				_('Enable Alerts')
			]),
			_('Enable alert notifications for network events')
		);
		o.default = '0';

		o = s.option(form.Flag, 'alert_on_new_device',
			E('span', [
				E('i', { 'class': 'fa fa-plus-circle', 'style': 'margin-right: 0.5rem; color: #10b981' }),
				_('New Device Alert')
			]),
			_('Send notification when a new device is detected on the network')
		);
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'alert_on_suspicious_traffic',
			E('span', [
				E('i', { 'class': 'fa fa-exclamation-triangle', 'style': 'margin-right: 0.5rem; color: #ef4444' }),
				_('Suspicious Traffic Alert')
			]),
			_('Send notification when suspicious or anomalous traffic patterns are detected')
		);
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'alert_threshold_mbps',
			E('span', [
				E('i', { 'class': 'fa fa-tachometer-alt', 'style': 'margin-right: 0.5rem' }),
				_('Traffic Threshold (Mbps)')
			]),
			_('Send alert when traffic rate exceeds this threshold in megabits per second')
		);
		o.default = '100';
		o.datatype = 'uinteger';
		o.depends('enabled', '1');
		o.placeholder = '100';

		// ========== Configuration Help Section ==========
		s = m.section(form.TypedSection, '__help__');
		s.anonymous = true;
		s.addremove = false;
		s.render = function() {
			return E('div', {
				'class': 'cbi-section',
				'style': 'margin-top: 2rem'
			}, [
				E('div', {
					'class': 'alert-message',
					'style': 'background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 1.5rem; border-radius: 8px'
				}, [
					E('h3', { 'style': 'margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem' }, [
						E('i', { 'class': 'fa fa-info-circle' }),
						_('Configuration Guide')
					]),
					E('div', { 'style': 'display: grid; gap: 1rem' }, [
						E('div', [
							E('strong', { 'style': 'display: block; margin-bottom: 0.5rem; font-size: 1.05em' }, [
								E('i', { 'class': 'fa fa-lightbulb', 'style': 'margin-right: 0.5rem' }),
								_('Recommended Configuration')
							]),
							E('ul', { 'style': 'margin: 0; padding-left: 1.5rem; opacity: 0.95; line-height: 1.6' }, [
								E('li', _('Keep Auto Start enabled to ensure monitoring resumes after reboot')),
								E('li', _('Use TCP socket type (default) for better compatibility and performance')),
								E('li', _('Enable all monitoring features for comprehensive network visibility')),
								E('li', _('Start with 7-day analytics retention, adjust based on storage capacity'))
							])
						]),
						E('div', [
							E('strong', { 'style': 'display: block; margin-bottom: 0.5rem; font-size: 1.05em' }, [
								E('i', { 'class': 'fa fa-wrench', 'style': 'margin-right: 0.5rem' }),
								_('Flow Export (Advanced)')
							]),
							E('p', { 'style': 'margin: 0; opacity: 0.95; line-height: 1.6' },
								_('Flow Export is disabled by default and only needed for external integrations. The dashboard works without it. Enable only if you want to export flow data to external tools or custom collectors.'))
						]),
						E('div', [
							E('strong', { 'style': 'display: block; margin-bottom: 0.5rem; font-size: 1.05em' }, [
								E('i', { 'class': 'fa fa-exclamation-triangle', 'style': 'margin-right: 0.5rem' }),
								_('Performance Considerations')
							]),
							E('ul', { 'style': 'margin: 0; padding-left: 1.5rem; opacity: 0.95; line-height: 1.6' }, [
								E('li', _('Higher max_flows values (>10000) require more RAM - adjust based on available memory')),
								E('li', _('SSL/TLS inspection adds CPU overhead - disable if performance issues occur')),
								E('li', _('Longer retention periods increase storage usage - monitor /var partition space'))
							])
						]),
						E('div', { 'style': 'margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.2)' }, [
							E('small', { 'style': 'opacity: 0.9; display: block; margin-bottom: 0.5rem' }, [
								E('i', { 'class': 'fa fa-book', 'style': 'margin-right: 0.5rem' }),
								_('After changing settings, click "Save & Apply" to restart the Netifyd service with new configuration.')
							]),
							E('small', { 'style': 'opacity: 0.9; display: block' }, [
								_('For detailed flow analysis and cloud features, visit '),
								E('a', {
									'href': 'https://dashboard.netify.ai',
									'target': '_blank',
									'style': 'color: white; text-decoration: underline; font-weight: 600'
								}, 'Netify.ai Dashboard'),
								_(' (requires CAPI registration in netifyd configuration)')
							])
						])
					])
				])
			]);
		};

		return m.render().then(function(formEl) {
			var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
			wrapper.appendChild(E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-netifyd/netifyd.css') }));
			wrapper.appendChild(SbHeader.render());
			wrapper.appendChild(renderNetifydNav('settings'));
			wrapper.appendChild(formEl);
			return KissTheme.wrap([wrapper], 'admin/status/netifyd/settings');
		});
	}
});
