'use strict';
'require view';
'require form';
'require ui';
'require media-flow/api as API';
'require secubox-portal/header as SbHeader';

var MEDIAFLOW_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'clients', icon: '👥', label: 'Clients' },
	{ id: 'services', icon: '🎬', label: 'Services' },
	{ id: 'history', icon: '📜', label: 'History' },
	{ id: 'alerts', icon: '🔔', label: 'Alerts' }
];

function renderMediaFlowNav(activeId) {
	return E('div', {
		'class': 'sb-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;flex-wrap:wrap;'
	}, MEDIAFLOW_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'mediaflow', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#ec4899,#8b5cf6);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listAlerts()
		]);
	},

	render: function(data) {
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

		o = s.option(form.Value, 'threshold_hours', _('Threshold (hours)'));
		o.datatype = 'uinteger';
		o.placeholder = '2';
		o.rmempty = false;
		o.description = _('Trigger alert if usage exceeds this many hours per day');

		o = s.option(form.ListValue, 'action', _('Action'));
		o.value('notify', _('Notification only'));
		o.value('limit', _('Limit bandwidth'));
		o.value('block', _('Block service'));
		o.default = 'notify';
		o.rmempty = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = o.enabled;

		return m.render().then(function(rendered) {
			var css = `
.mf-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e4e4e7; }
.mf-header { margin-bottom: 24px; }
.mf-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
.mf-subtitle { color: #a1a1aa; font-size: 0.875rem; }
`;
			var container = E('div', { 'class': 'mf-page' }, [
				E('style', {}, css),
				renderMediaFlowNav('alerts'),
				E('div', { 'class': 'mf-header' }, [
					E('div', { 'class': 'mf-title' }, ['🔔 ', _('Streaming Alerts')]),
					E('div', { 'class': 'mf-subtitle' }, _('Configure alerts based on streaming service usage'))
				]),
				rendered
			]);

			var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
			wrapper.appendChild(SbHeader.render());
			wrapper.appendChild(container);
			return wrapper;
		});
	}
});
