'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require rpc';
'require secubox/kiss-theme';

/**
 * SecuBox Settings - KISS Edition
 * Configuration management with inline CSS
 */

var callGetStatus = rpc.declare({
	object: 'luci.secubox',
	method: 'get_status',
	expect: {}
});

var THEMES = ['dark', 'light', 'system', 'cyberpunk'];

function getThemeLabel(theme) {
	var labels = { 'dark': 'Dark', 'light': 'Light', 'system': 'System', 'cyberpunk': 'Cyberpunk' };
	return labels[theme] || 'Dark';
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('secubox'),
			callGetStatus().catch(function() { return {}; })
		]);
	},

	render: function(data) {
		var status = data[1] || {};
		var theme = uci.get('secubox', 'main', 'theme') || 'dark';
		var version = status.version || uci.get('secubox', 'main', 'version') || '0.1.0';
		var enabled = status.enabled !== undefined ? status.enabled : (uci.get('secubox', 'main', 'enabled') !== '0');
		var modules = status.modules_total || 0;

		var m, s, o;

		m = new form.Map('secubox', null, null);

		// General Settings
		s = m.section(form.TypedSection, 'core', '🔧 General Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', '🔌 Enable SecuBox', 'Master switch for all modules');
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.Value, 'version', '📦 Version', 'Current version (read-only)');
		o.readonly = true;
		o.default = version;
		o.cfgvalue = function() { return version; };

		// Dashboard Settings
		s = m.section(form.TypedSection, 'core', '📊 Dashboard Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'theme', '🎨 Theme', 'Visual theme for the dashboard');
		THEMES.forEach(function(t) { o.value(t, getThemeLabel(t)); });
		o.default = 'dark';

		o = s.option(form.ListValue, 'refresh_interval', '🔄 Auto-Refresh', 'Dashboard refresh interval');
		o.value('15', 'Every 15 seconds');
		o.value('30', 'Every 30 seconds (default)');
		o.value('60', 'Every minute');
		o.value('0', 'Manual only');
		o.default = '30';

		o = s.option(form.Flag, 'show_system_stats', '📈 System Statistics', 'Show CPU/Memory/Disk on dashboard');
		o.default = '1';

		o = s.option(form.Flag, 'show_module_grid', '🎯 Module Grid', 'Show modules grid on dashboard');
		o.default = '1';

		// Module Management
		s = m.section(form.TypedSection, 'core', '📦 Module Management');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'auto_discovery', '🔍 Auto Discovery', 'Detect new modules automatically');
		o.default = '1';

		o = s.option(form.Flag, 'auto_start', '▶️ Auto Start', 'Start modules on install');
		o.default = '0';

		// Notification Settings
		s = m.section(form.TypedSection, 'core', '🔔 Notifications');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'notifications', '🔔 Enable Notifications', 'Browser notifications for events');
		o.default = '1';

		o = s.option(form.Flag, 'notify_module_start', '▶️ Module Start', 'Notify on module start');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_module_stop', '⏹️ Module Stop', 'Notify on module stop');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_alerts', '⚠️ System Alerts', 'Notify on system alerts');
		o.default = '1';
		o.depends('notifications', '1');

		// Alert Thresholds
		s = m.section(form.TypedSection, 'diagnostics', '⚠️ Alert Thresholds');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'cpu_warning', '⚡ CPU Warning (%)', 'CPU usage warning threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'cpu_critical', '🔥 CPU Critical (%)', 'CPU usage critical threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		o = s.option(form.Value, 'memory_warning', '💾 Memory Warning (%)', 'Memory usage warning threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'memory_critical', '🔴 Memory Critical (%)', 'Memory usage critical threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		o = s.option(form.Value, 'disk_warning', '💿 Disk Warning (%)', 'Disk usage warning threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'disk_critical', '⛔ Disk Critical (%)', 'Disk usage critical threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		// Security Settings
		s = m.section(form.TypedSection, 'security', '🔒 Security');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'require_auth', '🔐 Require Auth', 'Require authentication for dashboard');
		o.default = '1';

		o = s.option(form.Flag, 'audit_logging', '📝 Audit Logging', 'Log configuration changes');
		o.default = '1';

		o = s.option(form.Value, 'audit_retention', '📅 Log Retention (days)', 'Days to keep audit logs');
		o.datatype = 'uinteger';
		o.default = '30';
		o.depends('audit_logging', '1');

		// Advanced Settings
		s = m.section(form.TypedSection, 'core', '🛠️ Advanced');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'debug_mode', '🐛 Debug Mode', 'Enable debug logging');
		o.default = '0';

		o = s.option(form.Value, 'api_timeout', '⏱️ API Timeout (s)', 'Timeout for API requests');
		o.datatype = 'range(5,300)';
		o.default = '30';
		o.placeholder = '30';

		var self = this;
		return m.render().then(function(formEl) {
			var chips = [
				{ icon: '🏷️', label: 'Version', value: version },
				{ icon: '⚡', label: 'Status', value: enabled ? 'On' : 'Off', color: enabled ? '#22c55e' : '#ef4444' },
				{ icon: '🧩', label: 'Modules', value: modules }
			];

			var header = E('div', { 'class': 'sb-header' }, [
				E('div', {}, [
					E('h2', { 'class': 'sb-title' }, '⚙️ SecuBox Settings'),
					E('p', { 'class': 'sb-subtitle' }, 'Configure global settings')
				]),
				E('div', { 'class': 'sb-chips' }, chips.map(function(c) {
					return E('div', { 'class': 'sb-chip' }, [
						E('span', { 'class': 'sb-chip-icon' }, c.icon),
						E('div', {}, [
							E('span', { 'class': 'sb-chip-label' }, c.label),
							E('strong', { 'style': c.color ? 'color:' + c.color : '' }, String(c.value))
						])
					]);
				}))
			]);

			var content = E('div', { 'class': 'sb-settings' }, [
				E('style', {}, self.getStyles()),
				header,
				E('div', { 'class': 'sb-form-wrapper' }, [formEl])
			]);

			return KissTheme.wrap(content, 'admin/secubox/settings');
		});
	},

	getStyles: function() {
		return `
.sb-settings { max-width: 1000px; margin: 0 auto; padding: 20px; }
.sb-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-title { margin: 0; font-size: 24px; font-weight: 700; }
.sb-subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
.sb-chips { display: flex; gap: 12px; flex-wrap: wrap; }
.sb-chip { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; }
.sb-chip-icon { font-size: 16px; }
.sb-chip-label { font-size: 11px; color: #666; display: block; }
.sb-form-wrapper { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sb-form-wrapper .cbi-section { margin: 0 0 24px; padding: 0 0 24px; border-bottom: 1px solid #f0f0f0; }
.sb-form-wrapper .cbi-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.sb-form-wrapper .cbi-section-descr { display: none; }
.sb-form-wrapper .cbi-section h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px; padding: 0; }
.sb-form-wrapper .cbi-value { display: flex; align-items: flex-start; gap: 12px; margin: 12px 0; padding: 0; }
.sb-form-wrapper .cbi-value-title { flex: 0 0 200px; font-size: 13px; font-weight: 500; padding-top: 8px; }
.sb-form-wrapper .cbi-value-field { flex: 1; }
.sb-form-wrapper .cbi-value-description { font-size: 12px; color: #888; margin-top: 4px; }
.sb-form-wrapper input[type="text"], .sb-form-wrapper select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; width: 100%; max-width: 300px; }
.sb-form-wrapper input[type="checkbox"] { width: 18px; height: 18px; }
.sb-form-wrapper .cbi-button-save, .sb-form-wrapper .cbi-button-apply { background: #3b82f6; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.sb-form-wrapper .cbi-button-save:hover, .sb-form-wrapper .cbi-button-apply:hover { background: #2563eb; }
.sb-form-wrapper .cbi-button-reset { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
@media (prefers-color-scheme: dark) {
  .sb-settings { color: #e5e7eb; }
  .sb-header, .sb-form-wrapper { background: #1f2937; }
  .sb-chip { background: #374151; border-color: #4b5563; }
  .sb-chip-label, .sb-subtitle { color: #9ca3af; }
  .sb-form-wrapper .cbi-section { border-color: #374151; }
  .sb-form-wrapper .cbi-value-title { color: #e5e7eb; }
  .sb-form-wrapper .cbi-value-description { color: #9ca3af; }
  .sb-form-wrapper input[type="text"], .sb-form-wrapper select { background: #374151; border-color: #4b5563; color: #e5e7eb; }
  .sb-form-wrapper .cbi-button-reset { background: #374151; border-color: #4b5563; color: #e5e7eb; }
}
@media (max-width: 768px) {
  .sb-form-wrapper .cbi-value { flex-direction: column; gap: 4px; }
  .sb-form-wrapper .cbi-value-title { flex: none; padding-top: 0; }
}
`;
	}
});
