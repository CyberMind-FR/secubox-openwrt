'use strict';
'require view';
'require dom';
'require ui';
'require uci';
'require form';
'require secubox-crowdsec/api as api';

return view.extend({
	api: null,

	load: function() {
		this.api = new api();
		return Promise.all([
			uci.load('crowdsec'),
			this.api.getConfig()
		]);
	},

	render: function(data) {
		var config = data[1] || {};
		var m, s, o;

		m = new form.Map('crowdsec', 'CrowdSec Settings',
			'Configure CrowdSec security engine and firewall bouncer settings.');

		// Main CrowdSec settings
		s = m.section(form.TypedSection, 'crowdsec', 'CrowdSec Engine');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable CrowdSec',
			'Enable or disable the CrowdSec security engine');
		o.default = '1';
		o.rmempty = false;

		// Bouncer settings
		s = m.section(form.TypedSection, 'bouncer', 'Firewall Bouncer');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable Bouncer',
			'Enable the firewall bouncer to block malicious IPs');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'ipv4', 'IPv4 Blocking',
			'Enable IPv4 address blocking');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'ipv6', 'IPv6 Blocking',
			'Enable IPv6 address blocking');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'deny_action', 'Deny Action',
			'Action to take when blocking an IP');
		o.value('drop', 'Drop (silent)');
		o.value('reject', 'Reject (with response)');
		o.default = 'drop';

		o = s.option(form.Flag, 'deny_log', 'Log Blocked IPs',
			'Log blocked connections to system log');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'update_frequency', 'Update Frequency',
			'How often to fetch new decisions from LAPI');
		o.value('5s', '5 seconds');
		o.value('10s', '10 seconds');
		o.value('30s', '30 seconds');
		o.value('1m', '1 minute');
		o.default = '10s';

		// Acquisition settings
		s = m.section(form.TypedSection, 'acquisition', 'Log Acquisition');
		s.anonymous = true;

		o = s.option(form.Flag, 'syslog_enabled', 'Syslog',
			'Monitor system logs via syslog-ng');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'firewall_enabled', 'Firewall Logs',
			'Monitor nftables/iptables firewall logs');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'ssh_enabled', 'SSH Logs',
			'Monitor SSH authentication attempts');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'http_enabled', 'HTTP Logs',
			'Monitor HTTP server logs (if applicable)');
		o.default = '0';
		o.rmempty = false;

		// Hub settings
		s = m.section(form.TypedSection, 'hub', 'Hub Settings');
		s.anonymous = true;

		o = s.option(form.Value, 'collections', 'Default Collections',
			'Space-separated list of collections to install');
		o.default = 'crowdsecurity/linux crowdsecurity/sshd crowdsecurity/iptables';

		o = s.option(form.ListValue, 'update_interval', 'Hub Update Interval',
			'How often to check for hub updates (days)');
		o.value('1', 'Daily');
		o.value('7', 'Weekly');
		o.value('30', 'Monthly');
		o.value('0', 'Never');
		o.default = '7';

		return m.render();
	}
});
