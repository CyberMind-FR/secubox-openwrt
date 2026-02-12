'use strict';
'require view';
'require form';
'require uci';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return uci.load('client-guardian');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('client-guardian', 'Client Guardian Settings',
			'Basic network client management.');

		s = m.section(form.NamedSection, 'config', 'client-guardian', 'General');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable');
		o.default = '1';

		o = s.option(form.ListValue, 'default_policy', 'Default Policy');
		o.value('open', 'Open - Auto-approve new clients');
		o.value('closed', 'Closed - Require approval');
		o.default = 'open';

		o = s.option(form.Flag, 'auto_approve', 'Auto-approve known devices');
		o.default = '1';

		o = s.option(form.ListValue, 'log_level', 'Log Level');
		o.value('error', 'Error');
		o.value('warn', 'Warning');
		o.value('info', 'Info');
		o.value('debug', 'Debug');
		o.default = 'info';

		return m.render().then(function(rendered) {
			return KissTheme.wrap(rendered, 'admin/secubox/guardian/settings');
		});
	}
});
