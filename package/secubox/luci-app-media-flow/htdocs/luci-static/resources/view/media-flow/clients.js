'use strict';
'require view';
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
			API.getStatsByClient()
		]);
	},

	render: function(data) {
		var statsByClient = data[0] || {};
		var clients = statsByClient.clients || {};

		var css = `
.mf-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e4e4e7; }
.mf-header { margin-bottom: 24px; }
.mf-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
.mf-subtitle { color: #a1a1aa; font-size: 0.875rem; }
.mf-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; }
.mf-table { width: 100%; border-collapse: collapse; }
.mf-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; text-transform: uppercase; color: #71717a; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255,255,255,0.02); }
.mf-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.mf-table tr:hover td { background: rgba(255, 255, 255, 0.03); }
.mf-empty { text-align: center; padding: 48px 20px; color: #71717a; }
.mf-empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.5; }
`;

		var container = E('div', { 'class': 'mf-page' }, [
			E('style', {}, css),
			renderMediaFlowNav('clients'),
			E('div', { 'class': 'mf-header' }, [
				E('div', { 'class': 'mf-title' }, ['👥 ', _('Clients Statistics')]),
				E('div', { 'class': 'mf-subtitle' }, _('Streaming activity per client'))
			])
		]);

		var clientsList = Object.keys(clients);

		if (clientsList.length === 0) {
			container.appendChild(E('div', { 'class': 'mf-card' }, [
				E('div', { 'class': 'mf-empty' }, [
					E('div', { 'class': 'mf-empty-icon' }, '👥'),
					E('div', {}, _('No client data available yet'))
				])
			]));
		} else {
			clientsList.sort(function(a, b) {
				return (clients[b].total_duration_seconds || 0) - (clients[a].total_duration_seconds || 0);
			});

			var table = E('table', { 'class': 'mf-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, _('Client IP')),
						E('th', {}, _('Sessions')),
						E('th', {}, _('Total Duration')),
						E('th', {}, _('Total Bandwidth')),
						E('th', {}, _('Top Service'))
					])
				]),
				E('tbody', {}, clientsList.map(function(client) {
					var stats = clients[client];
					var duration = stats.total_duration_seconds || 0;
					var hours = Math.floor(duration / 3600);
					var minutes = Math.floor((duration % 3600) / 60);

					return E('tr', {}, [
						E('td', {}, E('strong', {}, client)),
						E('td', {}, String(stats.sessions)),
						E('td', {}, hours + 'h ' + minutes + 'm'),
						E('td', {}, Math.round(stats.total_bandwidth_kbps) + ' kbps'),
						E('td', {}, stats.top_service || 'N/A')
					]);
				}))
			]);

			container.appendChild(E('div', { 'class': 'mf-card' }, table));
		}

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
