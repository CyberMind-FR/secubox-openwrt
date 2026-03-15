'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() {
		return uci.load('lyrion');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('lyrion', _('Lyrion Settings'));

		s = m.section(form.TypedSection, 'lyrion');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = '0';

		o = s.option(form.Value, 'port', _('Web UI Port'));
		o.datatype = 'port';
		o.default = '9000';

		o = s.option(form.Value, 'media_path', _('Media Path'));
		o.default = '/srv/media';

		o = s.option(form.Value, 'data_path', _('Data Path'));
		o.default = '/srv/lyrion';

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'));
		o.default = '256M';

		return m.render();
	}
});
