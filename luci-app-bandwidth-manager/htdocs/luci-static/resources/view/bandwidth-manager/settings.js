'use strict';
'require view';
'require form';
'require network';

return L.view.extend({
	load: function() {
		return network.getDevices();
	},

	render: function(devices) {
		var m = new form.Map('bandwidth', _('Bandwidth Manager Settings'),
			_('Global settings and SQM/CAKE configuration'));

		var s = m.section(form.NamedSection, 'global', 'global', _('Global Settings'));
		s.anonymous = false;
		s.addremove = false;

		var o;

		o = s.option(form.Flag, 'enabled', _('Enable Bandwidth Manager'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.ListValue, 'interface', _('Interface'));
		devices.forEach(function(dev) {
			var name = dev.getName();
			o.value(name, name);
		});
		o.default = 'br-lan';
		o.rmempty = false;

		o = s.option(form.Flag, 'sqm_enabled', _('Enable SQM'));
		o.description = _('Smart Queue Management with CAKE qdisc');
		o.default = o.disabled;

		// SQM Configuration
		var sqm = m.section(form.NamedSection, 'sqm', 'sqm', _('SQM/CAKE Configuration'));
		sqm.anonymous = false;
		sqm.addremove = false;

		o = sqm.option(form.Value, 'download_speed', _('Download Speed (kbit/s)'));
		o.datatype = 'uinteger';
		o.placeholder = '100000';
		o.description = _('Your internet download speed in kbit/s');
		o.depends('global.sqm_enabled', '1');

		o = sqm.option(form.Value, 'upload_speed', _('Upload Speed (kbit/s)'));
		o.datatype = 'uinteger';
		o.placeholder = '50000';
		o.description = _('Your internet upload speed in kbit/s');
		o.depends('global.sqm_enabled', '1');

		o = sqm.option(form.ListValue, 'qdisc', _('Queue Discipline'));
		o.value('cake', 'CAKE (Recommended)');
		o.value('fq_codel', 'FQ_CoDel');
		o.value('htb', 'HTB');
		o.default = 'cake';
		o.depends('global.sqm_enabled', '1');

		o = sqm.option(form.Flag, 'nat', _('NAT Mode'));
		o.description = _('Enable if router performs NAT');
		o.default = o.enabled;
		o.depends('global.sqm_enabled', '1');

		o = sqm.option(form.ListValue, 'overhead', _('Link Overhead'));
		o.value('0', _('None'));
		o.value('18', 'Ethernet (18 bytes)');
		o.value('22', 'PPPoE (22 bytes)');
		o.value('40', 'VLAN + PPPoE (40 bytes)');
		o.default = '0';
		o.depends('global.sqm_enabled', '1');

		// Traffic Tracking
		var tracking = m.section(form.NamedSection, 'tracking', 'tracking', _('Traffic Tracking'));
		tracking.anonymous = false;
		tracking.addremove = false;

		o = tracking.option(form.Flag, 'iptables_tracking', _('Enable iptables Tracking'));
		o.description = _('Track per-client bandwidth usage with iptables counters');
		o.default = o.enabled;

		o = tracking.option(form.Value, 'history_retention', _('History Retention (days)'));
		o.datatype = 'range(1,90)';
		o.default = '30';
		o.description = _('How long to keep usage history');

		// Alerts
		var alerts = m.section(form.NamedSection, 'alerts', 'alerts', _('Alert Settings'));
		alerts.anonymous = false;
		alerts.addremove = false;

		o = alerts.option(form.Flag, 'enabled', _('Enable Alerts'));
		o.default = o.disabled;

		o = alerts.option(form.Value, 'quota_threshold', _('Quota Alert Threshold (%)'));
		o.datatype = 'range(50,100)';
		o.default = '90';
		o.description = _('Send alert when quota usage exceeds this percentage');
		o.depends('enabled', '1');

		o = alerts.option(form.Value, 'email', _('Alert Email'));
		o.datatype = 'email';
		o.placeholder = 'admin@example.com';
		o.depends('enabled', '1');

		return m.render();
	}
});
