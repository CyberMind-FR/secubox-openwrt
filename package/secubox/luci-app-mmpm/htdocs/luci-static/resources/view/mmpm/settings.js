'use strict';
'require view';
'require dom';
'require ui';
'require uci';
'require form';
'require secubox/kiss-theme';

return view.extend({
	title: _('MMPM Settings'),

	load: function() {
		return uci.load('mmpm');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('mmpm', _('MMPM Settings'), _('Configure MMPM - MagicMirror Package Manager'));

		s = m.section(form.NamedSection, 'main', 'mmpm', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable GUI Service'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'port', _('GUI Port'));
		o.datatype = 'port';
		o.default = '7891';
		o.rmempty = false;

		o = s.option(form.Value, 'address', _('Listen Address'));
		o.default = '0.0.0.0';
		o.rmempty = false;

		return m.render().then(function(view) {
			return KissTheme.wrap([view], 'admin/secubox/services/mmpm/settings');
		});
	}
});
