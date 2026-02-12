'use strict';
'require view';
'require form';
'require uci';
'require secubox/kiss-theme';

return view.extend({
	title: _('Ollama Settings'),

	load: function() {
		return uci.load('ollama');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('ollama', _('Ollama Configuration'),
			_('Configure Ollama LLM service settings'));

		s = m.section(form.TypedSection, 'main', _('General Settings'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Service'));
		o.rmempty = false;

		o = s.option(form.Value, 'api_port', _('API Port'));
		o.datatype = 'port';
		o.default = '11434';
		o.rmempty = false;

		o = s.option(form.Value, 'api_host', _('API Host'));
		o.default = '0.0.0.0';
		o.rmempty = false;
		o.description = _('Use 0.0.0.0 to listen on all interfaces');

		o = s.option(form.Value, 'data_path', _('Data Path'));
		o.default = '/srv/ollama';
		o.rmempty = false;
		o.description = _('Directory for storing models and data');

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'));
		o.default = '2g';
		o.rmempty = false;
		o.description = _('Container memory limit (e.g., 2g, 4g)');

		// Docker Settings
		s = m.section(form.TypedSection, 'docker', _('Container Settings'));
		s.anonymous = true;

		o = s.option(form.Value, 'image', _('Docker Image'));
		o.default = 'ollama/ollama:latest';
		o.rmempty = false;
		o.description = _('Ollama Docker image to use');

		return m.render().then(function(view) {
			return KissTheme.wrap([view], 'admin/services/ollama/settings');
		});
	}
});
