'use strict';
'require view';
'require form';
'require uci';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return uci.load('config-advisor');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('config-advisor', 'Config Advisor Settings',
			'Configure security advisor behavior, compliance framework, and LocalAI integration.');

		// Main settings
		s = m.section(form.TypedSection, 'main', 'General Settings');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable Advisor',
			'Enable background security monitoring');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'check_interval', 'Check Interval (seconds)',
			'How often to run security checks');
		o.datatype = 'uinteger';
		o.default = '3600';
		o.placeholder = '3600';

		o = s.option(form.Flag, 'auto_remediate', 'Auto-Remediate Safe Issues',
			'Automatically apply safe remediations');
		o.default = '0';

		o = s.option(form.Flag, 'notification_enabled', 'Enable Notifications',
			'Log warnings when security score drops');
		o.default = '1';

		// Compliance settings
		s = m.section(form.TypedSection, 'compliance', 'Compliance Settings');
		s.anonymous = true;

		o = s.option(form.ListValue, 'framework', 'Compliance Framework',
			'Select compliance standard to check against');
		o.value('anssi_cspn', 'ANSSI CSPN (French)');
		o.value('cis_benchmark', 'CIS Benchmark');
		o.value('custom', 'Custom');
		o.default = 'anssi_cspn';

		o = s.option(form.Flag, 'strict_mode', 'Strict Mode',
			'Treat warnings as failures for compliance');
		o.default = '0';

		// Scoring settings
		s = m.section(form.TypedSection, 'scoring', 'Scoring Configuration');
		s.anonymous = true;

		o = s.option(form.Value, 'passing_score', 'Passing Score Threshold',
			'Minimum score to be considered secure (0-100)');
		o.datatype = 'range(0,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'weight_critical', 'Critical Weight',
			'Weight for critical severity checks');
		o.datatype = 'uinteger';
		o.default = '40';
		o.placeholder = '40';

		o = s.option(form.Value, 'weight_high', 'High Weight',
			'Weight for high severity checks');
		o.datatype = 'uinteger';
		o.default = '25';
		o.placeholder = '25';

		o = s.option(form.Value, 'weight_medium', 'Medium Weight',
			'Weight for medium severity checks');
		o.datatype = 'uinteger';
		o.default = '20';
		o.placeholder = '20';

		o = s.option(form.Value, 'weight_low', 'Low Weight',
			'Weight for low severity checks');
		o.datatype = 'uinteger';
		o.default = '10';
		o.placeholder = '10';

		// Category toggles
		s = m.section(form.TypedSection, 'categories', 'Check Categories',
			'Enable or disable specific security check categories');
		s.anonymous = true;

		o = s.option(form.Flag, 'network', 'Network Checks');
		o.default = '1';

		o = s.option(form.Flag, 'firewall', 'Firewall Checks');
		o.default = '1';

		o = s.option(form.Flag, 'authentication', 'Authentication Checks');
		o.default = '1';

		o = s.option(form.Flag, 'encryption', 'Encryption Checks');
		o.default = '1';

		o = s.option(form.Flag, 'services', 'Services Checks');
		o.default = '1';

		o = s.option(form.Flag, 'logging', 'Logging Checks');
		o.default = '1';

		o = s.option(form.Flag, 'updates', 'Update Checks');
		o.default = '0';
		o.description = 'Can be slow as it queries opkg';

		// LocalAI integration
		s = m.section(form.TypedSection, 'localai', 'LocalAI Integration',
			'Configure AI-powered remediation suggestions');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable LocalAI',
			'Use LocalAI for intelligent remediation suggestions');
		o.default = '0';

		o = s.option(form.Value, 'url', 'LocalAI URL',
			'URL of the LocalAI API endpoint');
		o.default = 'http://127.0.0.1:8091';
		o.placeholder = 'http://127.0.0.1:8091';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'model', 'Model Name',
			'LocalAI model to use for suggestions');
		o.default = 'mistral';
		o.placeholder = 'mistral';
		o.depends('enabled', '1');

		return m.render().then(function(view) {
			return KissTheme.wrap([view], 'admin/secubox/security/config-advisor/settings');
		});
	}
});
