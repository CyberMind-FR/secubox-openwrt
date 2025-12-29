'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require secubox/api as API';
'require secubox/theme as Theme';
'require secubox/nav as SecuNav';

var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('secubox'),
			API.getStatus(),
			Theme.getTheme()
		]);
	},

	render: function(data) {
		var status = data[1] || {};
		var theme = data[2];
		var m, s, o;

		// Create wrapper container with modern header
		var container = E('div', { 'class': 'secubox-settings-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),

			SecuNav.renderTabs('settings'),

			E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
				E('div', {}, [
					E('h2', { 'class': 'sh-page-title' }, [
						E('span', { 'class': 'sh-page-title-icon' }, '⚙️'),
						'SecuBox Settings'
					]),
					E('p', { 'class': 'sh-page-subtitle' },
						'Configure global settings for the SecuBox security suite')
				]),
				E('div', { 'class': 'sh-header-meta' }, [
					this.renderHeaderChip('🏷️', _('Version'), status.version || '0.1.2'),
					this.renderHeaderChip('⚡', _('Status'), status.enabled ? _('On') : _('Off'), status.enabled ? 'success' : 'danger'),
					this.renderHeaderChip('🧩', _('Modules'), status.modules_count || '14')
				])
			])
		]);

		// Create form
		m = new form.Map('secubox', null, null);

		// General Settings Section
		s = m.section(form.TypedSection, 'secubox', '🔧 General Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', '🔌 Enable SecuBox',
			'Master switch for all SecuBox modules. When disabled, all module services will be stopped.');
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.Value, 'version', '📦 Version',
			'Current SecuBox version (read-only)');
		o.readonly = true;
		o.default = '0.1.2';

		// Dashboard Settings Section
		s = m.section(form.TypedSection, 'secubox', '📊 Dashboard Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'theme', '🎨 Dashboard Theme',
			'Choose the visual theme for the SecuBox dashboard');
		o.value('dark', 'Dark (Default) - Modern dark interface');
		o.value('light', 'Light - Bright and clean');
		o.value('system', 'System Preference - Auto detect');
		o.default = 'dark';

		o = s.option(form.ListValue, 'refresh_interval', '🔄 Auto-Refresh Interval',
			'How often to refresh dashboard data automatically');
		o.value('15', 'Every 15 seconds - High frequency');
		o.value('30', 'Every 30 seconds - Default');
		o.value('60', 'Every minute - Low frequency');
		o.value('0', 'Disabled - Manual refresh only');
		o.default = '30';

		o = s.option(form.Flag, 'show_system_stats', '📈 Show System Statistics',
			'Display CPU, memory, disk usage on dashboard');
		o.default = '1';

		o = s.option(form.Flag, 'show_module_grid', '🎯 Show Module Grid',
			'Display installed modules grid on dashboard');
		o.default = '1';

		// Module Management Section
		s = m.section(form.TypedSection, 'secubox', '📦 Module Management');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'auto_discovery', '🔍 Auto Discovery',
			'Automatically detect and register newly installed modules');
		o.default = '1';

		o = s.option(form.Flag, 'auto_start', '▶️ Auto Start Modules',
			'Automatically start module services when they are installed');
		o.default = '0';

		o = s.option(form.MultiValue, 'startup_modules', '🚀 Startup Modules',
			'Modules to start automatically on system boot');
		o.value('crowdsec', 'CrowdSec Dashboard');
		o.value('netdata', 'Netdata Dashboard');
		o.value('netifyd', 'Netifyd Dashboard');
		o.value('wireguard', 'WireGuard Dashboard');
		o.value('network_modes', 'Network Modes');
		o.value('client_guardian', 'Client Guardian');
		o.value('system_hub', 'System Hub');
		o.value('bandwidth_manager', 'Bandwidth Manager');
		o.value('auth_guardian', 'Auth Guardian');
		o.value('media_flow', 'Media Flow');
		o.value('vhost_manager', 'Virtual Host Manager');
		o.value('traffic_shaper', 'Traffic Shaper');
		o.value('cdn_cache', 'CDN Cache');
		o.value('ksm_manager', 'KSM Manager');
		o.optional = true;

		// Notification Settings Section
		s = m.section(form.TypedSection, 'secubox', '🔔 Notification Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'notifications', '🔔 Enable Notifications',
			'Show browser notifications for important events');
		o.default = '1';

		o = s.option(form.Flag, 'notify_module_start', '▶️ Module Start',
			'Notify when a module service starts');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_module_stop', '⏹️ Module Stop',
			'Notify when a module service stops');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_alerts', '⚠️ System Alerts',
			'Notify when system alerts are generated');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_health_issues', '🏥 Health Issues',
			'Notify when system health metrics exceed thresholds');
		o.default = '1';
		o.depends('notifications', '1');

		// Alert Thresholds Section
		s = m.section(form.TypedSection, 'secubox', '⚠️ Alert Thresholds');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'cpu_warning', '⚡ CPU Warning Level (%)',
			'Generate warning when CPU usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'cpu_critical', '🔥 CPU Critical Level (%)',
			'Generate critical alert when CPU usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		o = s.option(form.Value, 'memory_warning', '💾 Memory Warning Level (%)',
			'Generate warning when memory usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'memory_critical', '🔴 Memory Critical Level (%)',
			'Generate critical alert when memory usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		o = s.option(form.Value, 'disk_warning', '💿 Disk Warning Level (%)',
			'Generate warning when disk usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'disk_critical', '⛔ Disk Critical Level (%)',
			'Generate critical alert when disk usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		// Security Settings Section
		s = m.section(form.TypedSection, 'secubox', '🔒 Security Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'require_auth', '🔐 Require Authentication',
			'Require authentication to access SecuBox dashboard');
		o.default = '1';

		o = s.option(form.Flag, 'audit_logging', '📝 Audit Logging',
			'Log all configuration changes and module actions');
		o.default = '1';

		o = s.option(form.Value, 'audit_retention', '📅 Audit Log Retention (days)',
			'Number of days to keep audit logs');
		o.datatype = 'uinteger';
		o.default = '30';
		o.depends('audit_logging', '1');

		// Advanced Settings Section
		s = m.section(form.TypedSection, 'secubox', '🛠️ Advanced Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'debug_mode', '🐛 Debug Mode',
			'Enable debug logging (may impact performance)');
		o.default = '0';

		o = s.option(form.Value, 'api_timeout', '⏱️ API Timeout (seconds)',
			'Timeout for API requests to module backends');
		o.datatype = 'range(5,300)';
		o.default = '30';
		o.placeholder = '30';

		o = s.option(form.Value, 'max_modules', '📊 Maximum Modules',
			'Maximum number of modules that can be installed');
		o.datatype = 'range(1,50)';
		o.default = '20';
		o.placeholder = '20';

		// Render form and append to container
		return m.render().then(L.bind(function(formElement) {
			container.appendChild(formElement);
			return container;
		}, this));
	},

	renderHeaderChip: function(icon, label, value, tone) {
		var display = (value == null ? '—' : value).toString();
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, display)
			])
		]);
	}
});
