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
			API.getStreamHistory(24)
		]);
	},

	render: function(data) {
		var historyData = data[0] || {};
		var history = historyData.history || [];

		var css = `
.mf-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e4e4e7; }
.mf-header { margin-bottom: 24px; }
.mf-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
.mf-subtitle { color: #a1a1aa; font-size: 0.875rem; }
.mf-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; overflow: hidden; }
.mf-controls { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.mf-select { padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e4e4e7; }
.mf-btn { padding: 8px 16px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; border: none; background: rgba(255,255,255,0.1); color: #e4e4e7; transition: all 0.2s; }
.mf-btn:hover { background: rgba(255,255,255,0.15); }
.mf-btn-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.mf-btn-danger:hover { background: rgba(239, 68, 68, 0.3); }
.mf-table { width: 100%; border-collapse: collapse; }
.mf-table th { text-align: left; padding: 12px 16px; font-size: 0.75rem; text-transform: uppercase; color: #71717a; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255,255,255,0.02); }
.mf-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.mf-table tr:hover td { background: rgba(255, 255, 255, 0.03); }
.mf-empty { text-align: center; padding: 48px 20px; color: #71717a; }
.mf-quality { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: white; }
`;

		var container = E('div', { 'class': 'mf-page' }, [
			E('style', {}, css),
			renderMediaFlowNav('history'),
			E('div', { 'class': 'mf-header' }, [
				E('div', { 'class': 'mf-title' }, ['📜 ', _('Stream History')]),
				E('div', { 'class': 'mf-subtitle' }, _('Historical record of detected streaming sessions'))
			])
		]);

		// Controls
		var controls = E('div', { 'class': 'mf-controls' }, [
			E('label', {}, _('Time Period: ')),
			E('select', { 'id': 'time-filter', 'class': 'mf-select' }, [
				E('option', { 'value': '1' }, _('Last 1 hour')),
				E('option', { 'value': '6' }, _('Last 6 hours')),
				E('option', { 'value': '24', 'selected': 'selected' }, _('Last 24 hours')),
				E('option', { 'value': '168' }, _('Last 7 days'))
			]),
			E('button', {
				'class': 'mf-btn',
				'click': function() {
					var hours = document.getElementById('time-filter').value;
					API.getStreamHistory(parseInt(hours)).then(function(data) {
						updateHistoryTable(data.history || []);
					});
				}
			}, _('Refresh')),
			E('button', {
				'class': 'mf-btn mf-btn-danger',
				'style': 'margin-left: auto;',
				'click': function() {
					if (confirm(_('Clear all history data?'))) {
						API.clearHistory().then(function() {
							ui.addNotification(null, E('p', _('History cleared')), 'info');
							updateHistoryTable([]);
						});
					}
				}
			}, _('Clear History'))
		]);
		container.appendChild(controls);

		var tableContainer = E('div', { 'id': 'history-table-container', 'class': 'mf-card' });
		container.appendChild(tableContainer);

		var updateHistoryTable = function(history) {
			var el = document.getElementById('history-table-container');
			if (!el) return;

			if (!history || history.length === 0) {
				el.innerHTML = '';
				el.appendChild(E('div', { 'class': 'mf-empty' }, _('No historical data available.')));
				return;
			}

			history.sort(function(a, b) {
				return new Date(b.timestamp) - new Date(a.timestamp);
			});

			var qualityColors = { 'SD': '#6b7280', 'HD': '#059669', 'FHD': '#2563eb', '4K': '#9333ea' };
			var categoryIcons = { 'video': '🎬', 'audio': '🎵', 'visio': '📹', 'other': '📊' };

			var table = E('table', { 'class': 'mf-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, _('Time')),
						E('th', {}, _('Service')),
						E('th', {}, _('Category')),
						E('th', {}, _('Client')),
						E('th', {}, _('Quality')),
						E('th', {}, _('Duration')),
						E('th', {}, _('Bandwidth'))
					])
				]),
				E('tbody', {}, history.slice(0, 100).map(function(entry) {
					var time = new Date(entry.timestamp).toLocaleString();
					var duration = Math.floor((entry.duration || 0) / 60);
					var categoryIcon = categoryIcons[entry.category] || '📊';
					var qualityColor = qualityColors[entry.quality] || '#6b7280';

					return E('tr', {}, [
						E('td', {}, time),
						E('td', {}, E('strong', {}, entry.app || 'unknown')),
						E('td', {}, categoryIcon + ' ' + (entry.category || 'other')),
						E('td', {}, entry.client || 'unknown'),
						E('td', {}, entry.quality ? E('span', { 'class': 'mf-quality', 'style': 'background:' + qualityColor }, entry.quality) : '-'),
						E('td', {}, duration + ' min'),
						E('td', {}, (entry.bandwidth || 0) + ' kbps')
					]);
				}))
			]);

			el.innerHTML = '';
			el.appendChild(table);
		};

		updateHistoryTable(history);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
