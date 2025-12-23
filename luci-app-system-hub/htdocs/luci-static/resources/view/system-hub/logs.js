'use strict';
'require view';
'require dom';
'require poll';
'require ui';

var api = L.require('system-hub.api');

return view.extend({
	load: function() {
		return api.callGetLogs(100, null, null);
	},

	render: function(data) {
		var logs = data.logs || [];
		var self = this;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📋'), 'Logs Unifiés' ]),
					E('div', { 'class': 'sh-card-badge' }, 'Tous composants')
				]),
				E('div', { 'class': 'sh-card-body' }, [
					// Filters
					E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;' }, [
						E('select', { 'class': 'sh-select', 'id': 'filter-source', 'style': 'width: auto; min-width: 120px;', 'change': L.bind(this.filterLogs, this) }, [
							E('option', { 'value': '' }, 'Toutes sources'),
							E('option', { 'value': 'system' }, 'system'),
							E('option', { 'value': 'crowdsec' }, 'crowdsec'),
							E('option', { 'value': 'netifyd' }, 'netifyd'),
							E('option', { 'value': 'client-guardian' }, 'client-guardian'),
							E('option', { 'value': 'system-hub' }, 'system-hub')
						]),
						E('select', { 'class': 'sh-select', 'id': 'filter-level', 'style': 'width: auto; min-width: 100px;', 'change': L.bind(this.filterLogs, this) }, [
							E('option', { 'value': '' }, 'Tous niveaux'),
							E('option', { 'value': 'info' }, '📝 info'),
							E('option', { 'value': 'warning' }, '⚠️ warning'),
							E('option', { 'value': 'error' }, '🚨 error')
						]),
						E('input', { 
							'type': 'text', 
							'class': 'sh-input', 
							'id': 'filter-search',
							'placeholder': 'Rechercher...',
							'style': 'flex: 1; min-width: 200px;',
							'keyup': L.bind(this.filterLogs, this)
						}),
						E('button', { 'class': 'sh-btn', 'click': L.bind(this.reloadLogs, this) }, '🔄 Rafraîchir'),
						E('button', { 'class': 'sh-btn', 'click': L.bind(this.exportLogs, this) }, '📥 Exporter')
					]),
					
					// Logs
					E('div', { 'class': 'sh-log-list', 'id': 'logs-container' }, 
						this.renderLogs(logs)
					)
				])
			])
		]);

		return view;
	},

	renderLogs: function(logs) {
		if (!logs || logs.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 40px; color: #707080;' }, [
				E('div', { 'style': 'font-size: 40px; margin-bottom: 12px;' }, '📋'),
				E('div', {}, 'Aucun log disponible')
			]);
		}

		return logs.map(function(log) {
			return E('div', { 'class': 'sh-log-item', 'data-source': log.source, 'data-level': log.level }, [
				E('div', { 'class': 'sh-log-time' }, log.timestamp || 'N/A'),
				E('div', { 'class': 'sh-log-source' }, log.source || 'system'),
				E('div', { 'class': 'sh-log-level ' + (log.level || 'info') }, log.level || 'info'),
				E('div', { 'class': 'sh-log-message' }, log.message)
			]);
		});
	},

	filterLogs: function() {
		var source = document.getElementById('filter-source').value;
		var level = document.getElementById('filter-level').value;
		var search = document.getElementById('filter-search').value.toLowerCase();
		var items = document.querySelectorAll('.sh-log-item');

		items.forEach(function(item) {
			var itemSource = item.dataset.source;
			var itemLevel = item.dataset.level;
			var itemText = item.textContent.toLowerCase();
			var show = true;

			if (source && itemSource !== source) show = false;
			if (level && itemLevel !== level) show = false;
			if (search && !itemText.includes(search)) show = false;

			item.style.display = show ? '' : 'none';
		});
	},

	reloadLogs: function() {
		var self = this;
		ui.showModal(_('Chargement'), [
			E('p', {}, 'Chargement des logs...'),
			E('div', { 'class': 'spinning' })
		]);

		api.callGetLogs(100, null, null).then(function(data) {
			var container = document.getElementById('logs-container');
			dom.content(container, self.renderLogs(data.logs || []));
			ui.hideModal();
			self.filterLogs();
		});
	},

	exportLogs: function() {
		var items = document.querySelectorAll('.sh-log-item');
		var csv = 'Timestamp,Source,Level,Message\n';

		items.forEach(function(item) {
			if (item.style.display !== 'none') {
				var time = item.querySelector('.sh-log-time').textContent;
				var source = item.querySelector('.sh-log-source').textContent;
				var level = item.querySelector('.sh-log-level').textContent;
				var message = item.querySelector('.sh-log-message').textContent.replace(/"/g, '""');
				csv += '"' + time + '","' + source + '","' + level + '","' + message + '"\n';
			}
		});

		var blob = new Blob([csv], { type: 'text/csv' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'system-hub-logs-' + new Date().toISOString().slice(0, 10) + '.csv';
		a.click();
		URL.revokeObjectURL(url);

		ui.addNotification(null, E('p', {}, '✅ Logs exportés!'), 'success');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
