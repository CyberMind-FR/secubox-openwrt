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
			_('Configure Nextcloud LXC container settings. Changes require service restart to take effect.'));

		// Main Settings
		s = m.section(form.NamedSection, 'main', 'nextcloud', _('General Settings'));
		s.anonymous = false;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable Nextcloud service'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'http_port', _('HTTP Port'),
			_('Port for the Nextcloud web interface'));
		o.datatype = 'port';
		o.default = '8080';
		o.placeholder = '8080';

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path to store Nextcloud data and backups'));
		o.default = '/srv/nextcloud';
		o.placeholder = '/srv/nextcloud';

		o = s.option(form.Value, 'domain', _('Domain'),
			_('Primary domain name for Nextcloud'));
		o.default = 'cloud.local';
		o.placeholder = 'cloud.local';

		o = s.option(form.Value, 'admin_user', _('Admin Username'),
			_('Administrator username'));
		o.default = 'admin';
		o.placeholder = 'admin';

		o = s.option(form.Value, 'admin_password', _('Admin Password'),
			_('Administrator password (only used during initial setup)'));
		o.password = true;
		o.placeholder = _('Enter password');

		o = s.option(form.Value, 'memory_limit', _('PHP Memory Limit'),
			_('Memory limit for PHP (e.g., 512M, 1G, 2G)'));
		o.default = '1G';
		o.placeholder = '1G';

		o = s.option(form.Value, 'upload_max', _('Max Upload Size'),
			_('Maximum file upload size (e.g., 512M, 1G)'));
		o.default = '512M';
		o.placeholder = '512M';

		o = s.option(form.Value, 'trusted_proxies', _('Trusted Proxies'),
			_('IP addresses of trusted reverse proxies'));
		o.default = '127.0.0.1';
		o.placeholder = '127.0.0.1';

		// Redis Cache Settings
		s = m.section(form.NamedSection, 'redis', 'cache', _('Redis Cache'));
		s.anonymous = false;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Redis'),
			_('Enable Redis caching for improved performance'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'memory', _('Redis Memory'),
			_('Maximum memory for Redis cache'));
		o.default = '128M';
		o.placeholder = '128M';

		// SSL Settings
		s = m.section(form.NamedSection, 'ssl', 'haproxy', _('SSL / HAProxy'));
		s.anonymous = false;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable SSL'),
			_('Enable HTTPS via HAProxy'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'domain', _('SSL Domain'),
			_('Domain name for SSL certificate'));
		o.placeholder = 'cloud.example.com';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'acme', _('Auto SSL (ACME)'),
			_('Automatically obtain SSL certificate from Let\'s Encrypt'));
		o.default = '1';
		o.rmempty = false;
		o.depends('enabled', '1');

		// Backup Settings
		s = m.section(form.NamedSection, 'backup', 'backup', _('Backup Settings'));
		s.anonymous = false;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Auto Backup'),
			_('Enable automatic scheduled backups'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'schedule', _('Backup Schedule'),
			_('How often to create automatic backups'));
		o.value('daily', _('Daily'));
		o.value('weekly', _('Weekly'));
		o.value('hourly', _('Hourly'));
		o.default = 'daily';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'keep', _('Keep Backups'),
			_('Number of backups to retain'));
		o.datatype = 'uinteger';
		o.default = '7';
		o.placeholder = '7';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'path', _('Backup Path'),
			_('Directory to store backups'));
		o.default = '/srv/nextcloud/backups';
		o.placeholder = '/srv/nextcloud/backups';
		o.depends('enabled', '1');

		return m.render().then(function(node) {
			return KissTheme.wrap(node, 'admin/secubox/services/nextcloud/settings');
		});
	}
});
