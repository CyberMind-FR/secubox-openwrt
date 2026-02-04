'use strict';
'require view';
'require form';
'require ui';
'require uci';

return view.extend({
	load: function() {
		return L.resolveDefault(uci.load('device-intel'), {});
	},

	render: function() {
		var m, s, o;

		m = new form.Map('device-intel', _('Device Intelligence Settings'),
			_('Configure aggregation, display, classification, and emulator modules.'));

		// ── Main Settings ──
		s = m.section(form.NamedSection, 'main', 'device-intel', _('General'));

		o = s.option(form.Flag, 'enabled', _('Enable Device Intelligence'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'cache_ttl', _('Cache TTL (seconds)'));
		o.datatype = 'uinteger';
		o.default = '30';
		o.placeholder = '30';
		o.description = _('How long to cache aggregated device data before refreshing.');

		o = s.option(form.Flag, 'auto_classify', _('Auto-classify'));
		o.default = '1';
		o.description = _('Automatically classify devices using heuristic rules.');

		o = s.option(form.Value, 'classify_interval', _('Classify Interval (seconds)'));
		o.datatype = 'uinteger';
		o.default = '300';
		o.placeholder = '300';
		o.depends('auto_classify', '1');

		o = s.option(form.Value, 'mesh_query_timeout', _('Mesh Query Timeout (seconds)'));
		o.datatype = 'uinteger';
		o.default = '3';
		o.placeholder = '3';

		// ── Display Settings ──
		s = m.section(form.NamedSection, 'display', 'display', _('Display'));

		o = s.option(form.ListValue, 'default_view', _('Default View'));
		o.value('grid', _('Grid'));
		o.value('table', _('Table'));
		o.default = 'grid';

		o = s.option(form.ListValue, 'group_by', _('Group By'));
		o.value('type', _('Device Type'));
		o.value('zone', _('NAC Zone'));
		o.value('node', _('Source Node'));
		o.value('status', _('Online Status'));
		o.default = 'type';

		o = s.option(form.Flag, 'show_offline', _('Show Offline Devices'));
		o.default = '1';

		o = s.option(form.Flag, 'show_mesh_peers', _('Show Mesh Peers'));
		o.default = '1';

		o = s.option(form.Flag, 'auto_refresh', _('Auto-refresh'));
		o.default = '1';

		o = s.option(form.Value, 'refresh_interval', _('Refresh Interval (seconds)'));
		o.datatype = 'uinteger';
		o.default = '15';
		o.placeholder = '15';
		o.depends('auto_refresh', '1');

		// ── USB Emulator ──
		s = m.section(form.NamedSection, 'usb', 'emulator', _('USB Emulator'));

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '1';

		o = s.option(form.Value, 'scan_interval', _('Scan Interval (seconds)'));
		o.datatype = 'uinteger';
		o.default = '120';
		o.placeholder = '120';

		o = s.option(form.Flag, 'track_storage', _('Track Storage Devices'));
		o.default = '1';
		o.description = _('Detect USB mass storage devices and mount points.');

		o = s.option(form.Flag, 'track_serial', _('Track Serial Devices'));
		o.default = '1';
		o.description = _('Detect USB serial adapters (Zigbee/Z-Wave dongles).');

		// ── MQTT Emulator ──
		s = m.section(form.NamedSection, 'mqtt', 'emulator', _('MQTT Emulator'));

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '0';

		o = s.option(form.Value, 'broker_host', _('Broker Host'));
		o.default = '127.0.0.1';
		o.placeholder = '127.0.0.1';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'broker_port', _('Broker Port'));
		o.datatype = 'port';
		o.default = '1883';
		o.placeholder = '1883';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'discovery_topic', _('Discovery Topic'));
		o.default = '$SYS/#';
		o.placeholder = '$SYS/#';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'scan_interval', _('Scan Interval (seconds)'));
		o.datatype = 'uinteger';
		o.default = '60';
		o.depends('enabled', '1');

		// ── Zigbee Emulator ──
		s = m.section(form.NamedSection, 'zigbee', 'emulator', _('Zigbee Emulator'));

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '0';

		o = s.option(form.Value, 'coordinator', _('Coordinator Device'));
		o.default = '/dev/ttyUSB0';
		o.placeholder = '/dev/ttyUSB0';
		o.depends('enabled', '1');

		o = s.option(form.ListValue, 'adapter', _('Bridge Adapter'));
		o.value('zigbee2mqtt', 'Zigbee2MQTT');
		o.value('deconz', 'deCONZ');
		o.default = 'zigbee2mqtt';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'api_port', _('Bridge API Port'));
		o.datatype = 'port';
		o.default = '8099';
		o.placeholder = '8099';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'bridge_topic', _('Bridge MQTT Topic'));
		o.default = 'zigbee2mqtt/bridge/devices';
		o.depends({ 'enabled': '1', 'adapter': 'zigbee2mqtt' });

		return m.render();
	}
});
