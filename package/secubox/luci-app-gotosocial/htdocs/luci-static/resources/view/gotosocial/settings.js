'use strict';
'require view';
'require form';
'require rpc';
'require uci';
'require ui';

return view.extend({
	load: function() {
		return uci.load('gotosocial');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('gotosocial', _('GoToSocial Settings'),
			_('Configure your Fediverse instance settings.'));

		// Main settings
		s = m.section(form.NamedSection, 'main', 'gotosocial', _('Instance Settings'));
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable GoToSocial service'));
		o.rmempty = false;

		o = s.option(form.Value, 'host', _('Domain'),
			_('The domain name for your instance (e.g., social.example.com)'));
		o.rmempty = false;
		o.placeholder = 'social.example.com';

		o = s.option(form.Value, 'port', _('Port'),
			_('Internal port for GoToSocial'));
		o.datatype = 'port';
		o.default = '8484';

		o = s.option(form.ListValue, 'protocol', _('Protocol'),
			_('Protocol for external access'));
		o.value('https', 'HTTPS');
		o.value('http', 'HTTP');
		o.default = 'https';

		o = s.option(form.Value, 'bind_address', _('Bind Address'),
			_('IP address to listen on'));
		o.default = '0.0.0.0';

		o = s.option(form.Value, 'instance_name', _('Instance Name'),
			_('Display name for your instance'));
		o.placeholder = 'SecuBox Social';

		o = s.option(form.TextValue, 'instance_description', _('Instance Description'),
			_('Description shown on the instance landing page'));
		o.rows = 3;

		// Registration settings
		s = m.section(form.NamedSection, 'main', 'gotosocial', _('Registration'));

		o = s.option(form.Flag, 'accounts_registration_open', _('Open Registration'),
			_('Allow new users to sign up'));
		o.default = '0';

		o = s.option(form.Flag, 'accounts_approval_required', _('Require Approval'),
			_('New registrations require admin approval'));
		o.default = '1';

		// LXC Container settings
		s = m.section(form.NamedSection, 'container', 'lxc', _('Container Settings'));
		s.addremove = false;

		o = s.option(form.Value, 'rootfs_path', _('Container Root'),
			_('Path to LXC container rootfs'));
		o.default = '/srv/lxc/gotosocial/rootfs';
		o.readonly = true;

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path to persistent data storage'));
		o.default = '/srv/gotosocial';
		o.readonly = true;

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'),
			_('Maximum memory for container'));
		o.default = '512M';

		o = s.option(form.Value, 'version', _('GoToSocial Version'),
			_('Version to install'));
		o.default = '0.17.3';

		// HAProxy integration
		s = m.section(form.NamedSection, 'proxy', 'haproxy', _('HAProxy Integration'));
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable HAProxy'),
			_('Route traffic through HAProxy'));
		o.default = '0';

		o = s.option(form.Value, 'vhost_domain', _('Virtual Host Domain'),
			_('Domain for HAProxy vhost (usually same as main domain)'));

		o = s.option(form.Flag, 'ssl_enabled', _('Enable SSL'),
			_('Enable HTTPS via HAProxy'));
		o.default = '1';

		o = s.option(form.Flag, 'acme_enabled', _('Enable ACME'),
			_('Automatically provision SSL certificates'));
		o.default = '1';

		// Federation settings
		s = m.section(form.NamedSection, 'federation', 'federation', _('Federation'));
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Federation'),
			_('Allow communication with other Fediverse instances'));
		o.default = '1';

		o = s.option(form.Flag, 'auto_approve_followers', _('Auto-Approve Followers'),
			_('Automatically approve follow requests'));
		o.default = '0';

		o = s.option(form.DynamicList, 'blocked_domains', _('Blocked Domains'),
			_('Instances to block from federation'));

		o = s.option(form.DynamicList, 'allowed_domains', _('Allowed Domains'),
			_('If set, only federate with these instances (allowlist mode)'));

		// Mesh settings
		s = m.section(form.NamedSection, 'mesh', 'mesh', _('SecuBox Mesh'));
		s.addremove = false;

		o = s.option(form.Flag, 'auto_federate', _('Auto-Federate with Mesh'),
			_('Automatically federate with other SecuBox nodes'));
		o.default = '1';

		o = s.option(form.Flag, 'announce_to_peers', _('Announce to Peers'),
			_('Publish this instance to mesh network'));
		o.default = '1';

		o = s.option(form.Flag, 'share_blocklist', _('Share Blocklist'),
			_('Share and sync blocked domains with mesh peers'));
		o.default = '1';

		return m.render();
	}
});
