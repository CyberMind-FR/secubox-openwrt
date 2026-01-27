'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() {
		return uci.load('metablogizer');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('metablogizer', _('MetaBlogizer Settings'),
			_('Configure the MetaBlogizer static site publisher settings.'));

		// Main settings
		s = m.section(form.TypedSection, 'metablogizer', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Enable the MetaBlogizer service'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'runtime', _('Runtime'),
			_('Web server runtime for serving static sites'));
		o.value('auto', _('Auto-detect (Recommended)'));
		o.value('uhttpd', _('uhttpd (Lightweight)'));
		o.value('nginx', _('nginx LXC (Full-featured)'));
		o.default = 'auto';

		o = s.option(form.Value, 'sites_root', _('Sites Root Path'),
			_('Directory where site files are stored'));
		o.placeholder = '/srv/metablogizer/sites';
		o.default = '/srv/metablogizer/sites';
		o.rmempty = false;

		o = s.option(form.Value, 'gitea_url', _('Gitea URL'),
			_('URL of Gitea server for cloning repositories'));
		o.placeholder = 'http://localhost:3000';
		o.default = 'http://localhost:3000';

		o = s.option(form.Value, 'nginx_container', _('Nginx Container'),
			_('Name of the LXC container running nginx (only for nginx runtime)'));
		o.placeholder = 'nginx';
		o.default = 'nginx';
		o.depends('runtime', 'nginx');

		// Info section
		s = m.section(form.TypedSection, 'metablogizer', _('Information'));
		s.anonymous = true;

		o = s.option(form.DummyValue, '_info', _('How it works'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			return '<div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">' +
				'<p style="margin: 0 0 0.5rem 0;"><strong>' + _('MetaBlogizer Flow:') + '</strong></p>' +
				'<ol style="margin: 0; padding-left: 1.5rem;">' +
				'<li>' + _('Create a site with name and domain') + '</li>' +
				'<li>' + _('HAProxy vhost is auto-created with SSL/ACME') + '</li>' +
				'<li>' + _('Nginx container serves static files') + '</li>' +
				'<li>' + _('Optionally sync content from Gitea') + '</li>' +
				'<li>' + _('Share via QR code or social networks') + '</li>' +
				'</ol>' +
				'</div>';
		};

		return m.render();
	}
});
