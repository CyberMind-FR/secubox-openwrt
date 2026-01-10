'use strict';
'require view';
'require form';
'require uci';
'require mitmproxy.api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var MITMPROXY_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'requests', icon: '🔍', label: 'Requests' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderMitmproxyNav(activeId) {
	return E('div', {
		'class': 'mp-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;'
	}, MITMPROXY_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'mitmproxy', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('mitmproxy Settings'),

	load: function() {
		return uci.load('mitmproxy');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('mitmproxy', _('mitmproxy Settings'),
			_('Configure the mitmproxy HTTPS interception proxy.'));

		// Main settings
		s = m.section(form.TypedSection, 'mitmproxy', _('Proxy Configuration'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable'),
			_('Enable mitmproxy at startup'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'mode', _('Proxy Mode'),
			_('How clients connect to the proxy'));
		o.value('transparent', _('Transparent - Intercept traffic automatically'));
		o.value('regular', _('Regular - Clients must configure proxy settings'));
		o.value('upstream', _('Upstream - Forward to another proxy'));
		o.default = 'transparent';

		o = s.option(form.Value, 'listen_host', _('Listen Address'),
			_('IP address to bind the proxy to'));
		o.default = '0.0.0.0';
		o.placeholder = '0.0.0.0';
		o.datatype = 'ipaddr';

		o = s.option(form.Value, 'listen_port', _('Proxy Port'),
			_('Port for HTTP/HTTPS interception'));
		o.default = '8080';
		o.placeholder = '8080';
		o.datatype = 'port';

		o = s.option(form.Value, 'web_host', _('Web UI Address'),
			_('IP address for mitmweb interface'));
		o.default = '0.0.0.0';
		o.placeholder = '0.0.0.0';
		o.datatype = 'ipaddr';

		o = s.option(form.Value, 'web_port', _('Web UI Port'),
			_('Port for mitmweb interface'));
		o.default = '8081';
		o.placeholder = '8081';
		o.datatype = 'port';

		o = s.option(form.Flag, 'ssl_insecure', _('Allow Insecure SSL'),
			_('Accept invalid/self-signed SSL certificates from upstream servers'));
		o.default = '0';

		o = s.option(form.ListValue, 'flow_detail', _('Log Detail Level'),
			_('Amount of detail in flow logs'));
		o.value('0', _('Minimal'));
		o.value('1', _('Summary'));
		o.value('2', _('Full headers'));
		o.value('3', _('Full headers + body preview'));
		o.value('4', _('Full headers + full body'));
		o.default = '2';

		// Capture settings
		s = m.section(form.TypedSection, 'capture', _('Capture Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'save_flows', _('Save Flows'),
			_('Save captured flows to disk for later replay'));
		o.default = '1';

		o = s.option(form.Value, 'flow_file', _('Flow File'),
			_('Path to save captured flows'));
		o.default = '/tmp/mitmproxy/flows.bin';
		o.depends('save_flows', '1');

		o = s.option(form.Flag, 'capture_urls', _('Capture URLs'),
			_('Log full URLs of requests'));
		o.default = '1';

		o = s.option(form.Flag, 'capture_cookies', _('Capture Cookies'),
			_('Log cookie headers'));
		o.default = '1';

		o = s.option(form.Flag, 'capture_headers', _('Capture Headers'),
			_('Log all HTTP headers'));
		o.default = '1';

		o = s.option(form.Flag, 'capture_body', _('Capture Body'),
			_('Log request/response bodies (increases storage usage)'));
		o.default = '0';

		// Logging settings
		s = m.section(form.TypedSection, 'logging', _('Logging'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Request Logging'),
			_('Log requests to file'));
		o.default = '1';

		o = s.option(form.Value, 'log_file', _('Log File'),
			_('Path to request log file'));
		o.default = '/tmp/mitmproxy/requests.log';
		o.depends('enabled', '1');

		o = s.option(form.ListValue, 'log_format', _('Log Format'),
			_('Format of log entries'));
		o.value('json', _('JSON'));
		o.value('text', _('Plain text'));
		o.default = 'json';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'max_size', _('Max Log Size (MB)'),
			_('Rotate log when it reaches this size'));
		o.default = '10';
		o.datatype = 'uinteger';
		o.depends('enabled', '1');

		// Filter settings
		s = m.section(form.TypedSection, 'filter', _('Filtering'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Filtering'),
			_('Enable content filtering'));
		o.default = '0';

		o = s.option(form.Flag, 'block_ads', _('Block Ads'),
			_('Block known advertising domains'));
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'block_trackers', _('Block Trackers'),
			_('Block known tracking domains'));
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.DynamicList, 'ignore_host', _('Ignore Hosts'),
			_('Hosts to pass through without interception'));
		o.placeholder = '*.example.com';

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMitmproxyNav('settings'));

		return m.render().then(function(mapEl) {
			wrapper.appendChild(mapEl);
			return wrapper;
		});
	}
});
