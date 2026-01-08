'use strict';
'require view';
'require ui';
'require media-flow/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getStreamHistory(24)
		]);
	},

	render: function(data) {
		var historyData = data[0] || {};
		var history = historyData.history || [];

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Stream History')),
			E('div', { 'class': 'cbi-map-descr' }, _('Historical record of detected streaming sessions'))
		]);

		// Time period filter
		var filterSection = E('div', { 'class': 'cbi-section' }, [
			E('div', { 'style': 'display: flex; gap: 10px; align-items: center; margin-bottom: 15px;' }, [
				E('label', {}, _('Time Period: ')),
				E('select', { 'id': 'time-filter', 'class': 'cbi-input-select' }, [
					E('option', { 'value': '1' }, _('Last 1 hour')),
					E('option', { 'value': '6' }, _('Last 6 hours')),
					E('option', { 'value': '24', 'selected': 'selected' }, _('Last 24 hours')),
					E('option', { 'value': '168' }, _('Last 7 days'))
				]),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': function() {
						var hours = document.getElementById('time-filter').value;
						API.getStreamHistory(parseInt(hours)).then(function(data) {
							updateHistoryTable(data.history || []);
						});
					}
				}, _('Refresh')),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
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
			])
		]);
		v.appendChild(filterSection);

		// History table
		var tableContainer = E('div', { 'id': 'history-table-container', 'class': 'cbi-section' });
		v.appendChild(tableContainer);

		var updateHistoryTable = function(history) {
			var container = document.getElementById('history-table-container');
			if (!container) return;

			var table = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Time')),
					E('th', { 'class': 'th' }, _('Service')),
					E('th', { 'class': 'th' }, _('Category')),
					E('th', { 'class': 'th' }, _('Client')),
					E('th', { 'class': 'th' }, _('Quality')),
					E('th', { 'class': 'th' }, _('Duration')),
					E('th', { 'class': 'th' }, _('Bandwidth'))
				])
			]);

			if (history && history.length > 0) {
				// Sort by timestamp descending
				history.sort(function(a, b) {
					return new Date(b.timestamp) - new Date(a.timestamp);
				});

				var categoryIcons = {
					'video': '🎬',
					'audio': '🎵',
					'visio': '📹',
					'other': '📊'
				};

				var qualityColors = {
					'SD': '#999',
					'HD': '#0088cc',
					'FHD': '#00cc00',
					'4K': '#cc0000'
				};

				history.slice(0, 100).forEach(function(entry) {
					var time = new Date(entry.timestamp).toLocaleString();
					var duration = Math.floor((entry.duration || 0) / 60);
					var categoryIcon = categoryIcons[entry.category] || '📊';
					var qualityColor = qualityColors[entry.quality] || '#666';

					table.appendChild(E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, time),
						E('td', { 'class': 'td' }, entry.app || 'unknown'),
						E('td', { 'class': 'td' }, categoryIcon + ' ' + (entry.category || 'other')),
						E('td', { 'class': 'td' }, entry.client || 'unknown'),
						E('td', { 'class': 'td' },
							E('span', { 'style': 'color: ' + qualityColor + '; font-weight: bold' }, entry.quality || 'N/A')
						),
						E('td', { 'class': 'td' }, duration + ' min'),
						E('td', { 'class': 'td' }, (entry.bandwidth || 0) + ' kbps')
					]));
				});
			} else {
				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td', 'colspan': '7', 'style': 'text-align: center; font-style: italic; padding: 20px;' },
						_('No historical data available. Streaming sessions will appear here once detected.'))
				]));
			}

			container.innerHTML = '';
			container.appendChild(table);
		};

		// Initial render
		updateHistoryTable(history);

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
