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

		m = new form.Map('lyrion', _('Lyrion Settings'),
			_('Configure Lyrion Music Server settings. Changes require service restart to take effect.'));

		s = m.section(form.TypedSection, 'lyrion', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable Lyrion Music Server'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'runtime', _('Container Runtime'),
			_('Select the container runtime to use'));
		o.value('auto', _('Auto-detect (LXC preferred)'));
		o.value('lxc', _('LXC Container'));
		o.value('docker', _('Docker'));
		o.default = 'auto';

		o = s.option(form.Value, 'port', _('Web UI Port'),
			_('Port for the Lyrion web interface'));
		o.datatype = 'port';
		o.default = '9000';
		o.placeholder = '9000';

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path to store Lyrion configuration and cache'));
		o.default = '/srv/lyrion';
		o.placeholder = '/srv/lyrion';

		o = s.option(form.Value, 'media_path', _('Media Path'),
			_('Path to your music library'));
		o.default = '/srv/media';
		o.placeholder = '/srv/media';

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'),
			_('Maximum memory for the container (e.g., 256M, 512M, 1G)'));
		o.default = '256M';
		o.placeholder = '256M';

		o = s.option(form.Value, 'timezone', _('Timezone'),
			_('Timezone for the container'));
		o.default = 'UTC';
		o.placeholder = 'UTC';

		o = s.option(form.Value, 'image', _('Docker Image'),
			_('Docker image to use (only for Docker runtime)'));
		o.default = 'ghcr.io/lms-community/lyrionmusicserver:stable';
		o.depends('runtime', 'docker');

		return m.render();
	}
});
