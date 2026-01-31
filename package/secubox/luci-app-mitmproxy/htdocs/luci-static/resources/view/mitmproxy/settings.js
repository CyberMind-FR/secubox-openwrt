'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() {
		return uci.load('mitmproxy');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('mitmproxy', _('mitmproxy Settings'),
			_('Configure the HTTPS intercepting proxy.'));

		// Main Settings
		s = m.section(form.TypedSection, 'mitmproxy', _('General'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;

		o = s.option(form.ListValue, 'mode', _('Mode'));
		o.value('regular', _('Regular Proxy'));
		o.value('transparent', _('Transparent Proxy'));
		o.value('upstream', _('Upstream Proxy'));
		o.value('reverse', _('Reverse Proxy'));
		o.default = 'transparent';

		o = s.option(form.Value, 'proxy_port', _('Proxy Port'));
		o.datatype = 'port';
		o.default = '8888';

		o = s.option(form.Value, 'web_port', _('Web UI Port'));
		o.datatype = 'port';
		o.default = '8082';

		o = s.option(form.Value, 'web_host', _('Web UI Host'));
		o.default = '0.0.0.0';

		o = s.option(form.Value, 'data_path', _('Data Path'));
		o.default = '/srv/mitmproxy';

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'));
		o.default = '256M';

		o = s.option(form.Flag, 'ssl_insecure', _('Allow Insecure SSL'));

		o = s.option(form.Flag, 'anticache', _('Disable Caching'));

		o = s.option(form.Flag, 'anticomp', _('Disable Compression'));

		// Transparent Mode
		s = m.section(form.TypedSection, 'transparent', _('Transparent Mode'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Transparent Redirect'));

		o = s.option(form.Value, 'interface', _('Interface'));
		o.default = 'br-lan';
		o.depends('enabled', '1');

		// Filtering
		s = m.section(form.TypedSection, 'filtering', _('Analytics'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Analytics'));
		o.description = _('Enable threat detection addon');

		o = s.option(form.Value, 'addon_script', _('Addon Script'));
		o.default = '/data/addons/secubox_analytics.py';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'log_requests', _('Log Requests'));
		o.depends('enabled', '1');

		return m.render();
	}
});
