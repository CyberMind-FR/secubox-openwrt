'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require rpc';

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
		var isRunning = netifydStatus && netifydStatus.instances &&
		                netifydStatus.instances.netifyd &&
		                netifydStatus.instances.netifyd.running;

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

		return m.render();
	}
});
