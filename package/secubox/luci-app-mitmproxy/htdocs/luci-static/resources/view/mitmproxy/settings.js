'use strict';
'require view';
'require form';
'require uci';
'require network';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('mitmproxy'),
			uci.load('network')
		]);
	},

	render: function() {
		var m, s, o;

		m = new form.Map('mitmproxy', _('mitmproxy Settings'),
			_('Configure the HTTPS intercepting proxy for traffic inspection and threat detection.'));

		// Main Settings
		s = m.section(form.TypedSection, 'mitmproxy', _('General'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;

		o = s.option(form.ListValue, 'mode', _('Mode'));
		o.value('regular', _('Regular Proxy'));
		o.value('transparent', _('Transparent Proxy (LAN)'));
		o.value('upstream', _('Upstream Proxy'));
		o.value('reverse', _('Reverse Proxy'));
		o.default = 'regular';

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

		// WAN Protection Mode
		s = m.section(form.TypedSection, 'wan_protection', _('WAN Protection Mode'));
		s.anonymous = true;
		s.description = _('Protect services exposed to the internet. Intercept incoming WAN traffic for threat detection (WAF mode). Detects bot scanners, attacks, and feeds to CrowdSec for automatic blocking.');

		o = s.option(form.Flag, 'enabled', _('Enable WAN Protection'));
		o.description = _('Intercept incoming WAN traffic for threat analysis');
		o.default = '0';

		o = s.option(form.ListValue, 'wan_interface', _('WAN Interface'));
		o.description = _('Network interface for incoming traffic');
		o.default = 'wan';
		o.depends('enabled', '1');
		// Add common WAN interface options
		o.value('wan', _('wan'));
		o.value('wan6', _('wan6'));
		o.value('eth1', _('eth1'));
		o.value('eth0', _('eth0'));
		// Try to populate from network config
		uci.sections('network', 'interface', function(iface) {
			if (iface['.name'] && iface['.name'].match(/wan/i)) {
				o.value(iface['.name'], iface['.name']);
			}
		});

		o = s.option(form.Value, 'wan_http_port', _('WAN HTTP Port'));
		o.datatype = 'port';
		o.default = '80';
		o.description = _('HTTP port to intercept on WAN (0 to disable)');
		o.depends('enabled', '1');

		o = s.option(form.Value, 'wan_https_port', _('WAN HTTPS Port'));
		o.datatype = 'port';
		o.default = '443';
		o.description = _('HTTPS port to intercept on WAN (0 to disable)');
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'crowdsec_feed', _('CrowdSec Integration'));
		o.description = _('Feed detected threats to CrowdSec for automatic blocking');
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'block_bots', _('Block Known Bots'));
		o.description = _('Immediately block requests from known bot scanners (Nikto, SQLMap, etc.)');
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'rate_limit', _('Rate Limit'));
		o.datatype = 'uinteger';
		o.default = '0';
		o.description = _('Max requests per IP per minute (0 to disable rate limiting)');
		o.depends('enabled', '1');

		// LAN Transparent Mode
		s = m.section(form.TypedSection, 'transparent', _('LAN Transparent Mode (Disabled by Default)'));
		s.anonymous = true;
		s.description = _('<strong>Warning:</strong> LAN transparent mode intercepts HTTPS traffic which requires all LAN clients to trust the mitmproxy CA certificate. Without this, secured websites will show certificate errors. This mode is disabled by default. Use WAN Protection Mode for threat detection without client-side certificate requirements.');

		o = s.option(form.Flag, 'enabled', _('Enable LAN Transparent Redirect'));
		o.description = _('Redirect outbound LAN HTTP/HTTPS traffic through proxy. Requires mitmproxy CA certificate installed on all clients.');

		o = s.option(form.Value, 'interface', _('LAN Interface'));
		o.default = 'br-lan';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'redirect_http', _('Redirect HTTP'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'redirect_https', _('Redirect HTTPS'));
		o.default = '1';
		o.depends('enabled', '1');

		// DPI Mirror Mode
		s = m.section(form.TypedSection, 'dpi_mirror', _('DPI Mirror Mode'));
		s.anonymous = true;
		s.description = _('Mirror traffic to DPI engines (netifyd/ndpid) for deep packet inspection. This is a secondary feature for advanced network analysis.');

		o = s.option(form.Flag, 'enabled', _('Enable DPI Mirror'));
		o.description = _('Mirror traffic to DPI interface for analysis');
		o.default = '0';

		o = s.option(form.Value, 'dpi_interface', _('DPI Interface'));
		o.default = 'br-lan';
		o.description = _('Interface where DPI engines listen');
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'mirror_wan', _('Mirror WAN Traffic'));
		o.default = '0';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'mirror_lan', _('Mirror LAN Traffic'));
		o.default = '0';
		o.depends('enabled', '1');

		// Filtering/Analytics
		s = m.section(form.TypedSection, 'filtering', _('Threat Analytics'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable Threat Analytics'));
		o.description = _('Enable threat detection addon for attack analysis');

		o = s.option(form.Value, 'addon_script', _('Analytics Addon'));
		o.default = '/data/addons/secubox_analytics.py';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'log_requests', _('Log All Requests'));
		o.description = _('Log all requests (not just threats) for analysis');
		o.depends('enabled', '1');

		// Auto-ban Settings
		s = m.section(form.TypedSection, 'autoban', _('Auto-ban Settings'));
		s.anonymous = true;
		s.description = _('Automatically ban IPs that trigger threat detection. Works with CrowdSec for distributed blocking.');

		o = s.option(form.Flag, 'enabled', _('Enable Auto-ban'));
		o.description = _('Automatically ban IPs that match threat patterns');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'sensitivity', _('Sensitivity Level'));
		o.description = _('Controls how quickly IPs are banned. Strict: immediate ban on first threat. Moderate: ban after 3 threats in 5 minutes. Permissive: ban after 5 threats in 1 hour.');
		o.value('strict', _('Strict (Immediate ban)'));
		o.value('moderate', _('Moderate (3 threats / 5 min)'));
		o.value('permissive', _('Permissive (5 threats / 1 hour)'));
		o.default = 'moderate';
		o.depends('enabled', '1');

		o = s.option(form.ListValue, 'min_severity', _('Minimum Severity'));
		o.description = _('Minimum threat severity level to trigger auto-ban');
		o.value('low', _('Low'));
		o.value('medium', _('Medium'));
		o.value('high', _('High'));
		o.value('critical', _('Critical'));
		o.default = 'high';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'ban_duration', _('Ban Duration'));
		o.description = _('How long to ban offending IPs (e.g., 1h, 4h, 24h, 7d)');
		o.default = '4h';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'ban_sqli', _('Ban SQL Injection'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'ban_cve_exploits', _('Ban CVE Exploits'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'ban_scanners', _('Ban Scanners'));
		o.description = _('Ban known vulnerability scanners (Nikto, SQLMap, etc.)');
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'ban_traversal', _('Ban Path Traversal'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'ban_cmdi', _('Ban Command Injection'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.DynamicList, 'whitelist_bots', _('Whitelisted Bots'));
		o.description = _('Bot user-agents to whitelist (e.g., google, bing, facebook)');
		o.depends('enabled', '1');

		// HAProxy Router
		s = m.section(form.TypedSection, 'haproxy_router', _('HAProxy Backend Inspection'));
		s.anonymous = true;
		s.description = _('Route HAProxy vhost traffic through mitmproxy for threat detection. All backends will be inspected before reaching their destination.');

		o = s.option(form.Flag, 'enabled', _('Enable HAProxy Inspection'));
		o.description = _('When enabled, all HAProxy backends will route through mitmproxy');

		o = s.option(form.Value, 'listen_port', _('Listen Port'));
		o.datatype = 'port';
		o.default = '8889';
		o.description = _('Port for HAProxy to send traffic to mitmproxy');
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'threat_detection', _('Threat Detection'));
		o.default = '1';
		o.description = _('Enable threat detection on HAProxy traffic');
		o.depends('enabled', '1');

		return m.render().then(function(formEl) {
			return KissTheme.wrap([formEl], 'admin/secubox/security/mitmproxy/settings');
		});
	}
});
