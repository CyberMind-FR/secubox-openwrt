'use strict';
'require view';
'require form';
'require uci';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return uci.load('nextcloud');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('nextcloud', _('Nextcloud Settings'),
			_('Configure Nextcloud settings. Changes require service restart to take effect.'));

		s = m.section(form.TypedSection, 'nextcloud', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable Nextcloud'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Web UI Port'),
			_('Port for the Nextcloud web interface'));
		o.datatype = 'port';
		o.default = '80';
		o.placeholder = '80';

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path to store Nextcloud data'));
		o.default = '/srv/nextcloud';
		o.placeholder = '/srv/nextcloud';

		o = s.option(form.Value, 'admin_user', _('Admin Username'),
			_('Administrator username for initial setup'));
		o.default = 'admin';
		o.placeholder = 'admin';

		o = s.option(form.Value, 'admin_password', _('Admin Password'),
			_('Administrator password for initial setup. Required for first install.'));
		o.password = true;
		o.placeholder = _('Enter password');

		o = s.option(form.Value, 'trusted_domains', _('Trusted Domains'),
			_('Comma-separated list of trusted domains (e.g., cloud.example.com,192.168.1.1)'));
		o.default = 'cloud.local';
		o.placeholder = 'cloud.local';

		o = s.option(form.Value, 'timezone', _('Timezone'),
			_('Timezone for the container'));
		o.default = 'UTC';
		o.placeholder = 'UTC';

		o = s.option(form.Value, 'image', _('Docker Image'),
			_('Docker image to use'));
		o.default = 'nextcloud:latest';
		o.placeholder = 'nextcloud:latest';

		return m.render().then(function(node) {
			return KissTheme.wrap(node, 'admin/secubox/services/nextcloud/settings');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
