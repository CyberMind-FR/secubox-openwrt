'use strict';
'require view';
'require form';
'require uci';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return uci.load('localai');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('localai', _('LocalAI Configuration'),
			_('Configure LocalAI service settings. Changes require a service restart.'));

		// Main settings section with tabs
		s = m.section(form.TypedSection, 'main', _('Service Settings'));
		s.anonymous = true;
		s.addremove = false;
		s.tab('general', _('General'));
		s.tab('paths', _('Storage'));

		// General tab options
		o = s.taboption('general', form.Flag, 'enabled', _('Enable Service'));
		o.default = '0';
		o.rmempty = false;

		o = s.taboption('general', form.Value, 'api_port', _('API Port'));
		o.datatype = 'port';
		o.default = '8080';
		o.placeholder = '8080';

		o = s.taboption('general', form.Value, 'api_host', _('API Host'));
		o.default = '0.0.0.0';
		o.placeholder = '0.0.0.0';
		o.description = _('Use 0.0.0.0 to listen on all interfaces');

		o = s.taboption('general', form.Value, 'memory_limit', _('Memory Limit'));
		o.default = '2G';
		o.placeholder = '2G';
		o.description = _('Maximum memory for the container (e.g., 2G, 4G)');

		o = s.taboption('general', form.Value, 'threads', _('CPU Threads'));
		o.datatype = 'uinteger';
		o.default = '4';
		o.placeholder = '4';
		o.description = _('Number of CPU threads for inference');

		o = s.taboption('general', form.Value, 'context_size', _('Context Size'));
		o.datatype = 'uinteger';
		o.default = '2048';
		o.placeholder = '2048';
		o.description = _('Maximum context window size in tokens');

		o = s.taboption('general', form.Flag, 'cors', _('Enable CORS'));
		o.default = '1';
		o.description = _('Allow cross-origin requests to API');

		o = s.taboption('general', form.Flag, 'debug', _('Debug Mode'));
		o.default = '0';
		o.description = _('Enable verbose logging');

		// Paths tab options
		o = s.taboption('paths', form.Value, 'data_path', _('Data Directory'));
		o.default = '/srv/localai';
		o.placeholder = '/srv/localai';

		o = s.taboption('paths', form.Value, 'models_path', _('Models Directory'));
		o.default = '/srv/localai/models';
		o.placeholder = '/srv/localai/models';

		// GPU section (experimental)
		s = m.section(form.TypedSection, 'gpu', _('GPU Acceleration (Experimental)'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable GPU'));
		o.default = '0';
		o.description = _('Enable GPU acceleration (requires compatible hardware)');

		o = s.option(form.ListValue, 'backend', _('GPU Backend'));
		o.value('vulkan', 'Vulkan (ARM64)');
		o.value('cuda', 'CUDA (Nvidia)');
		o.value('rocm', 'ROCm (AMD)');
		o.default = 'vulkan';
		o.depends('enabled', '1');

		return KissTheme.wrap([m.render()], 'admin/services/localai/settings');
	}
});
