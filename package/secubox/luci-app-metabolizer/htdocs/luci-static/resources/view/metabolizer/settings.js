'use strict';
'require view';
'require form';
'require uci';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return uci.load('metabolizer');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('metabolizer', _('Metabolizer Settings'),
			_('Configure the Metabolizer CMS pipeline settings.'));

		// Main settings
		s = m.section(form.TypedSection, 'metabolizer', _('General'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.rmempty = false;

		o = s.option(form.Value, 'gitea_url', _('Gitea URL'));
		o.placeholder = 'http://192.168.255.1:3000';

		o = s.option(form.Value, 'gitea_user', _('Gitea Username'));
		o.placeholder = 'admin';

		o = s.option(form.Value, 'webhook_port', _('Webhook Port'));
		o.placeholder = '8088';
		o.datatype = 'port';

		// Content repository
		s = m.section(form.TypedSection, 'content', _('Content Repository'));
		s.anonymous = true;

		o = s.option(form.Value, 'repo_name', _('Repository Name'));
		o.placeholder = 'blog-content';

		o = s.option(form.Value, 'repo_path', _('Local Path'));
		o.placeholder = '/srv/metabolizer/content';

		o = s.option(form.Value, 'github_mirror', _('GitHub Mirror URL'),
			_('Optional GitHub URL to mirror'));
		o.optional = true;

		// CMS settings
		s = m.section(form.TypedSection, 'cms', _('Streamlit CMS'));
		s.anonymous = true;

		o = s.option(form.Value, 'repo_name', _('CMS Repository'));
		o.placeholder = 'metabolizer-cms';

		o = s.option(form.Value, 'streamlit_app', _('Streamlit App Name'));
		o.placeholder = 'metabolizer';

		// Hexo integration
		s = m.section(form.TypedSection, 'hexo', _('Hexo Integration'));
		s.anonymous = true;

		o = s.option(form.Value, 'source_path', _('Hexo Source Path'));
		o.placeholder = '/srv/hexojs/site/source/_posts';

		o = s.option(form.Value, 'public_path', _('Hexo Public Path'));
		o.placeholder = '/srv/hexojs/site/public';

		o = s.option(form.Value, 'portal_path', _('Portal Path'));
		o.placeholder = '/www/blog';

		o = s.option(form.Flag, 'auto_publish', _('Auto Publish'),
			_('Automatically publish to portal after build'));
		o.rmempty = false;

		// Portal settings
		s = m.section(form.TypedSection, 'portal', _('Portal'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.rmempty = false;

		o = s.option(form.Value, 'url_path', _('URL Path'));
		o.placeholder = '/blog';

		o = s.option(form.Value, 'title', _('Portal Title'));
		o.placeholder = 'SecuBox Blog';

		return m.render().then(function(node) {
			return KissTheme.wrap(node, 'admin/secubox/services/metabolizer/settings');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
