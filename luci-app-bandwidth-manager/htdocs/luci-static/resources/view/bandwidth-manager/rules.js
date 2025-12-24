'use strict';
'require view';
'require ui';
'require form';
'require bandwidth-manager/api as API';

return L.view.extend({
	load: function() {
		return API.listRules();
	},

	render: function(rules) {
		var m = new form.Map('bandwidth', _('QoS Rules'),
			_('Define traffic shaping rules based on applications, ports, or IP addresses'));

		var s = m.section(form.GridSection, 'rule', _('Rules'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;

		s.modaltitle = function(section_id) {
			return _('Edit Rule: ') + section_id;
		};

		var o;

		o = s.option(form.Value, 'name', _('Rule Name'));
		o.rmempty = false;
		o.placeholder = 'Limit YouTube';

		o = s.option(form.ListValue, 'type', _('Type'));
		o.value('application', _('Application'));
		o.value('port', _('Port'));
		o.value('ip', _('IP Address'));
		o.value('mac', _('MAC Address'));
		o.default = 'application';

		o = s.option(form.Value, 'target', _('Target'));
		o.rmempty = false;
		o.placeholder = 'youtube / 80,443 / 192.168.1.100 / AA:BB:CC:DD:EE:FF';
		o.description = _('Application name, port(s), IP address, or MAC address');

		o = s.option(form.Value, 'limit_down', _('Download Limit (kbit/s)'));
		o.datatype = 'uinteger';
		o.placeholder = '5000';
		o.description = _('Maximum download speed in kbit/s (0 = unlimited)');
		o.default = '0';

		o = s.option(form.Value, 'limit_up', _('Upload Limit (kbit/s)'));
		o.datatype = 'uinteger';
		o.placeholder = '1000';
		o.description = _('Maximum upload speed in kbit/s (0 = unlimited)');
		o.default = '0';

		o = s.option(form.ListValue, 'priority', _('Priority'));
		o.value('1', '1 (Highest)');
		o.value('2', '2 (High)');
		o.value('3', '3');
		o.value('4', '4');
		o.value('5', '5 (Normal)');
		o.value('6', '6');
		o.value('7', '7 (Low)');
		o.value('8', '8 (Lowest)');
		o.default = '5';

		o = s.option(form.Value, 'schedule', _('Schedule (Optional)'));
		o.placeholder = 'Mon-Fri 08:00-18:00';
		o.description = _('Apply rule only during specific times');

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = o.enabled;

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
