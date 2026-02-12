'use strict';
'require view';
'require form';
'require ui';
'require media-flow/api as API';
'require media-flow/nav as NavHelper';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

return L.view.extend({
	// Initialize SecuBox dark theme
	initTheme: function() {
		document.documentElement.setAttribute('data-theme', 'dark');
		document.body.classList.add('secubox-mode');
		if (!document.getElementById('mf-theme-styles')) {
			var themeStyle = document.createElement('style');
			themeStyle.id = 'mf-theme-styles';
			themeStyle.textContent = 'body.secubox-mode { background: #0a0a0f !important; } body.secubox-mode .main-right, body.secubox-mode #maincontent, body.secubox-mode .container { background: transparent !important; }';
			document.head.appendChild(themeStyle);
		}
	},

	load: function() {
		return Promise.all([
			API.listAlerts()
		]);
	},

	render: function(data) {
		var self = this;
		this.initTheme();

		var alerts = data[0] || [];

		var m = new form.Map('media_flow', null, null);

		var s = m.section(form.TypedSection, 'alert', _('Streaming Alerts'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;

		var o;

		o = s.option(form.Value, 'service', _('Service Name'));
		o.placeholder = 'Netflix';
		o.rmempty = false;

		o = s.option(form.Value, 'threshold_hours', _("Daily Usage Limit (hours)"));
		o.datatype = 'uinteger';
		o.placeholder = '4';
		o.rmempty = false;
		o.description = _('Alert when daily usage exceeds this threshold (e.g., 2-4 hours)');

		o = s.option(form.ListValue, 'action', _("Alert Action"));
		o.value('notify', _('📬 Notify Only'));
		o.value('limit', _('🐌 Limit Bandwidth'));
		o.value('block', _('🚫 Block Service'));
		o.default = 'notify';
		o.rmempty = false;
		o.description = _('Choose what happens when threshold is exceeded');

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = o.enabled;

		return m.render().then(function(rendered) {
			var css = `
.mf-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e4e4e7; }
.mf-header { margin-bottom: 24px; }
.mf-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
.mf-subtitle { color: #a1a1aa; font-size: 0.875rem; }
.cbi-section { margin: 0 !important; background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 12px !important; padding: 20px !important; }
.cbi-section-create { margin-top: 12px !important; }
.cbi-option-compact { padding: 12px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.04) !important; }
.cbi-option-compact:last-child { border-bottom: none !important; }
.form-control { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; color: #e4e4e7 !important; border-radius: 6px !important; padding: 8px 12px !important; }
.form-control:focus { border-color: #ec4899 !important; background: rgba(236,72,153,0.08) !important; box-shadow: 0 0 0 3px rgba(236,72,153,0.1) !important; }
.cbi-button { border-radius: 8px !important; font-weight: 500 !important; transition: all 0.2s !important; }
.cbi-button-add { background: linear-gradient(135deg, #ec4899, #8b5cf6) !important; color: white !important; border: none !important; }
.cbi-button-add:hover { opacity: 0.9 !important; transform: translateY(-2px) !important; }
`;
			var container = E('div', { 'class': 'mf-page' }, [
				E('style', {}, css),
				E('link', { 'rel': 'stylesheet', 'href': L.resource('media-flow/common.css') }),
				NavHelper.renderTabs('alerts'),
				E('div', { 'class': 'mf-header' }, [
					E('div', { 'class': 'mf-title' }, ['🔔 ', _('Streaming Alerts')]),
					E('div', { 'class': 'mf-subtitle' }, _('Configure alerts based on streaming service usage'))
				]),
				rendered
			]);

			var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
			wrapper.appendChild(SbHeader.render());
			wrapper.appendChild(container);
			return KissTheme.wrap([wrapper], 'admin/services/media-flow/alerts');
		});
	}
});
