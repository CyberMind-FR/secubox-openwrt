'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() {
		return uci.load('secubox');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('secubox', 'SecuBox Settings',
			'Configure global settings for the SecuBox security suite.');

		s = m.section(form.TypedSection, 'secubox', 'General Settings');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable SecuBox',
			'Master switch for all SecuBox modules');
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.Flag, 'auto_discovery', 'Auto Discovery',
			'Automatically detect and register installed modules');
		o.default = '1';

		o = s.option(form.Flag, 'notifications', 'Enable Notifications',
			'Show notifications for module status changes and updates');
		o.default = '1';

		o = s.option(form.ListValue, 'theme', 'Dashboard Theme');
		o.value('dark', 'Dark (Default)');
		o.value('light', 'Light');
		o.value('system', 'System Preference');
		o.default = 'dark';

		return m.render();
	}
});
