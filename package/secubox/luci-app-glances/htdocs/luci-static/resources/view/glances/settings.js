'use strict';
'require view';
'require dom';
'require form';
'require uci';
'require ui';
'require glances.api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var GLANCES_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'webui', icon: '🖥️', label: 'Web UI' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderGlancesNav(activeId) {
	return E('div', {
		'class': 'gl-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;'
	}, GLANCES_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'monitoring', 'glances', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#27ae60,#1e8449);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('Glances Settings'),

	load: function() {
		return uci.load('glances');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('glances', _('Glances Settings'),
			_('Configure Glances system monitoring service.'));

		// Main Settings Section
		s = m.section(form.TypedSection, 'glances', _('Main Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'web_port', _('Web Port'));
		o.datatype = 'port';
		o.default = '61208';
		o.rmempty = false;

		o = s.option(form.Value, 'api_port', _('API Port'));
		o.datatype = 'port';
		o.default = '61209';
		o.rmempty = false;

		o = s.option(form.Value, 'web_host', _('Listen Address'));
		o.default = '0.0.0.0';
		o.rmempty = false;

		o = s.option(form.Value, 'refresh_rate', _('Refresh Rate (seconds)'));
		o.datatype = 'uinteger';
		o.default = '3';
		o.rmempty = false;

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'));
		o.default = '128M';
		o.rmempty = false;
		o.description = _('Container memory limit (e.g., 128M, 256M)');

		// Monitoring Section
		s = m.section(form.TypedSection, 'monitoring', _('Monitoring Options'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'monitor_docker', _('Monitor Docker'));
		o.default = '1';

		o = s.option(form.Flag, 'monitor_network', _('Monitor Network'));
		o.default = '1';

		o = s.option(form.Flag, 'monitor_diskio', _('Monitor Disk I/O'));
		o.default = '1';

		o = s.option(form.Flag, 'monitor_sensors', _('Monitor Sensors'));
		o.default = '1';

		o = s.option(form.Flag, 'monitor_processes', _('Monitor Processes'));
		o.default = '1';

		// Alerts Section
		s = m.section(form.TypedSection, 'alerts', _('Alert Thresholds'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'cpu_warning', _('CPU Warning (%)'));
		o.datatype = 'range(1,100)';
		o.default = '70';

		o = s.option(form.Value, 'cpu_critical', _('CPU Critical (%)'));
		o.datatype = 'range(1,100)';
		o.default = '90';

		o = s.option(form.Value, 'mem_warning', _('Memory Warning (%)'));
		o.datatype = 'range(1,100)';
		o.default = '70';

		o = s.option(form.Value, 'mem_critical', _('Memory Critical (%)'));
		o.datatype = 'range(1,100)';
		o.default = '90';

		o = s.option(form.Value, 'disk_warning', _('Disk Warning (%)'));
		o.datatype = 'range(1,100)';
		o.default = '70';

		o = s.option(form.Value, 'disk_critical', _('Disk Critical (%)'));
		o.datatype = 'range(1,100)';
		o.default = '90';

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(renderGlancesNav('settings'));

		return m.render().then(function(formEl) {
			wrapper.appendChild(formEl);
			return wrapper;
		});
	}
});
