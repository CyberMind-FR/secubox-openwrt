'use strict';
'require view';
'require form';
'require uci';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return uci.load('iot-guard');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('iot-guard', 'IoT Guard Settings',
			'Configure IoT device isolation and security monitoring settings.');

		// Main settings
		s = m.section(form.TypedSection, 'iot-guard', 'General Settings');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable IoT Guard');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'scan_interval', 'Scan Interval (seconds)');
		o.datatype = 'uinteger';
		o.default = '300';
		o.placeholder = '300';

		o = s.option(form.Flag, 'auto_isolate', 'Auto-Isolate High-Risk Devices',
			'Automatically move high-risk IoT devices to the isolated zone.');
		o.default = '1';

		o = s.option(form.Value, 'auto_isolate_threshold', 'Auto-Isolate Threshold',
			'Risk score threshold (0-100) for automatic isolation.');
		o.datatype = 'range(0,100)';
		o.default = '80';
		o.placeholder = '80';
		o.depends('auto_isolate', '1');

		o = s.option(form.Flag, 'anomaly_detection', 'Enable Anomaly Detection',
			'Monitor traffic patterns and detect behavioral anomalies.');
		o.default = '1';

		o = s.option(form.ListValue, 'anomaly_sensitivity', 'Anomaly Sensitivity');
		o.value('low', 'Low (fewer alerts)');
		o.value('medium', 'Medium');
		o.value('high', 'High (more alerts)');
		o.default = 'medium';
		o.depends('anomaly_detection', '1');

		o = s.option(form.ListValue, 'log_level', 'Log Level');
		o.value('debug', 'Debug');
		o.value('info', 'Info');
		o.value('warn', 'Warning');
		o.value('error', 'Error');
		o.default = 'info';

		// Zone policy
		s = m.section(form.TypedSection, 'zone_policy', 'IoT Zone Policy');
		s.anonymous = true;

		o = s.option(form.Value, 'target_zone', 'Target Zone',
			'Network zone for isolated IoT devices.');
		o.default = 'iot';
		o.placeholder = 'iot';

		o = s.option(form.Flag, 'block_lan', 'Block LAN Access',
			'Prevent isolated devices from accessing other LAN devices.');
		o.default = '1';

		o = s.option(form.Flag, 'allow_internet', 'Allow Internet Access',
			'Allow isolated devices to access the internet.');
		o.default = '1';

		o = s.option(form.Value, 'bandwidth_limit', 'Bandwidth Limit (Mbps)',
			'Rate limit for isolated IoT devices. 0 = unlimited.');
		o.datatype = 'uinteger';
		o.default = '10';
		o.placeholder = '10';

		// Allowlist
		s = m.section(form.TypedSection, 'allowlist', 'Trusted Devices (Allowlist)');
		s.anonymous = true;

		o = s.option(form.DynamicList, 'mac', 'Trusted MAC Addresses',
			'Devices in this list will never be auto-isolated.');
		o.datatype = 'macaddr';
		o.placeholder = 'AA:BB:CC:DD:EE:FF';

		// Blocklist
		s = m.section(form.TypedSection, 'blocklist', 'Blocked Devices');
		s.anonymous = true;

		o = s.option(form.DynamicList, 'mac', 'Blocked MAC Addresses',
			'Devices in this list are completely blocked from network access.');
		o.datatype = 'macaddr';
		o.placeholder = 'AA:BB:CC:DD:EE:FF';

		return m.render().then(function(node) {
			return KissTheme.wrap(node, 'admin/secubox/security/iot-guard/settings');
		});
	}
});
