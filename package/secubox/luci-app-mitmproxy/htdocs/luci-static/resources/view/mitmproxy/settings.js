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
	{ id: 'webui', icon: '🖥️', label: 'Web UI' },
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
			'href': L.url('admin', 'secubox', 'security', 'mitmproxy', item.id),
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
			_('Configure the mitmproxy HTTPS interception proxy with transparent mode and filtering options.'));

		// =====================================================================
		// Main Proxy Configuration
		// =====================================================================
		s = m.section(form.TypedSection, 'mitmproxy', _('Proxy Configuration'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable'),
			_('Enable mitmproxy at startup'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'mode', _('Proxy Mode'),
			_('How clients connect to the proxy'));
		o.value('regular', _('Regular - Clients must configure proxy settings'));
		o.value('transparent', _('Transparent - Intercept traffic automatically via nftables'));
		o.value('upstream', _('Upstream - Forward to another proxy'));
		o.value('reverse', _('Reverse - Reverse proxy mode'));
		o.default = 'regular';

		o = s.option(form.Value, 'proxy_port', _('Proxy Port'),
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

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Directory for storing certificates and data'));
		o.default = '/srv/mitmproxy';

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'),
			_('Maximum memory for the LXC container'));
		o.default = '256M';
		o.placeholder = '256M';

		o = s.option(form.Flag, 'ssl_insecure', _('Allow Insecure SSL'),
			_('Accept invalid/self-signed SSL certificates from upstream servers'));
		o.default = '0';

		o = s.option(form.Flag, 'anticache', _('Anti-Cache'),
			_('Strip cache headers to force fresh responses'));
		o.default = '0';

		o = s.option(form.Flag, 'anticomp', _('Anti-Compression'),
			_('Disable compression to allow content inspection'));
		o.default = '0';

		o = s.option(form.ListValue, 'flow_detail', _('Log Detail Level'),
			_('Amount of detail in flow logs'));
		o.value('0', _('Minimal'));
		o.value('1', _('Summary'));
		o.value('2', _('Full headers'));
		o.value('3', _('Full headers + body preview'));
		o.value('4', _('Full headers + full body'));
		o.default = '1';

		o = s.option(form.Value, 'upstream_proxy', _('Upstream Proxy'),
			_('Forward traffic to this upstream proxy (e.g., http://proxy:8080)'));
		o.depends('mode', 'upstream');
		o.placeholder = 'http://proxy:8080';

		o = s.option(form.Value, 'reverse_target', _('Reverse Target'),
			_('Target server for reverse proxy mode (e.g., http://localhost:80)'));
		o.depends('mode', 'reverse');
		o.placeholder = 'http://localhost:80';

		// =====================================================================
		// Transparent Mode Settings
		// =====================================================================
		s = m.section(form.TypedSection, 'transparent', _('Transparent Mode'));
		s.anonymous = true;
		s.addremove = false;
		s.tab('transparent', _('Firewall Settings'));

		o = s.taboption('transparent', form.Flag, 'enabled', _('Enable Transparent Firewall'),
			_('Automatically setup nftables rules to redirect traffic'));
		o.default = '0';

		o = s.taboption('transparent', form.Value, 'interface', _('Intercept Interface'),
			_('Network interface to intercept traffic from'));
		o.default = 'br-lan';
		o.placeholder = 'br-lan';
		o.depends('enabled', '1');

		o = s.taboption('transparent', form.Flag, 'redirect_http', _('Redirect HTTP'),
			_('Intercept plain HTTP traffic'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.taboption('transparent', form.Flag, 'redirect_https', _('Redirect HTTPS'),
			_('Intercept HTTPS traffic (requires CA certificate on clients)'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.taboption('transparent', form.Value, 'http_port', _('HTTP Port'),
			_('Source port to intercept for HTTP'));
		o.default = '80';
		o.datatype = 'port';
		o.depends('redirect_http', '1');

		o = s.taboption('transparent', form.Value, 'https_port', _('HTTPS Port'),
			_('Source port to intercept for HTTPS'));
		o.default = '443';
		o.datatype = 'port';
		o.depends('redirect_https', '1');

		// =====================================================================
		// Whitelist/Bypass Settings
		// =====================================================================
		s = m.section(form.TypedSection, 'whitelist', _('Whitelist / Bypass'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Whitelist'),
			_('Skip interception for whitelisted IPs and domains'));
		o.default = '1';

		o = s.option(form.DynamicList, 'bypass_ip', _('Bypass IP Addresses'),
			_('IP addresses or CIDR ranges that bypass the proxy'));
		o.placeholder = '192.168.1.0/24';
		o.depends('enabled', '1');

		o = s.option(form.DynamicList, 'bypass_domain', _('Bypass Domains'),
			_('Domain patterns that bypass the proxy (for domain-based bypass, requires additional configuration)'));
		o.placeholder = 'banking.com';
		o.depends('enabled', '1');

		// =====================================================================
		// Filtering / CDN Tracking
		// =====================================================================
		s = m.section(form.TypedSection, 'filtering', _('Filtering & Analytics'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Filtering Addon'),
			_('Load the SecuBox filtering addon for CDN/Media tracking and ad blocking'));
		o.default = '0';

		o = s.option(form.Flag, 'log_requests', _('Log All Requests'),
			_('Log request details to JSON file for analysis'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'filter_cdn', _('Track CDN Traffic'),
			_('Log and categorize CDN requests (Cloudflare, Akamai, Fastly, etc.)'));
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'filter_media', _('Track Media Streaming'),
			_('Log and categorize streaming media requests (YouTube, Netflix, Spotify, etc.)'));
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'block_ads', _('Block Ads & Trackers'),
			_('Block known advertising and tracking domains'));
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'addon_script', _('Addon Script Path'),
			_('Path to the Python filtering addon'));
		o.default = '/etc/mitmproxy/addons/secubox_filter.py';
		o.depends('enabled', '1');

		// =====================================================================
		// Capture Settings
		// =====================================================================
		s = m.section(form.TypedSection, 'capture', _('Capture Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'save_flows', _('Save Flows'),
			_('Save captured flows to disk for later replay'));
		o.default = '0';

		o = s.option(form.Flag, 'capture_request_headers', _('Capture Request Headers'),
			_('Include request headers in logs'));
		o.default = '1';

		o = s.option(form.Flag, 'capture_response_headers', _('Capture Response Headers'),
			_('Include response headers in logs'));
		o.default = '1';

		o = s.option(form.Flag, 'capture_request_body', _('Capture Request Body'),
			_('Include request body in logs (increases storage usage)'));
		o.default = '0';

		o = s.option(form.Flag, 'capture_response_body', _('Capture Response Body'),
			_('Include response body in logs (increases storage usage)'));
		o.default = '0';

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderMitmproxyNav('settings'));

		return m.render().then(function(mapEl) {
			wrapper.appendChild(mapEl);
			return wrapper;
		});
	}
});
