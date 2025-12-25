'use strict';
'require view';
'require dom';
'require poll';
'require traffic-shaper/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.listClasses(),
			API.getStats()
		]);
	},

	render: function(data) {
		var classes = data[0].classes || [];
		var stats = data[1].stats || [];

		var container = E('div', { 'class': 'traffic-shaper-dashboard' }, [
			E('h2', {}, _('Traffic Statistics')),

			E('div', { 'class': 'ts-stats-container' }, [
				E('div', { 'class': 'ts-stats-header' }, [
					E('h3', {}, _('Real-Time Class Statistics')),
					E('button', {
						'class': 'ts-stats-refresh',
						'click': L.bind(this.handleRefresh, this)
					}, _('Refresh Now'))
				]),

				E('table', { 'class': 'ts-table', 'id': 'stats-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, _('Class')),
							E('th', {}, _('Priority')),
							E('th', {}, _('Rate/Ceil')),
							E('th', { 'style': 'text-align: right;' }, _('Packets')),
							E('th', { 'style': 'text-align: right;' }, _('Bytes')),
							E('th', { 'style': 'text-align: right;' }, _('Dropped')),
							E('th', {}, _('Status'))
						])
					]),
					E('tbody', { 'id': 'stats-tbody' },
						this.renderStatsRows(classes, stats)
					)
				])
			]),

			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em; background: #f9f9f9; padding: 1em;' }, [
				E('h3', {}, _('Statistics Information')),
				E('p', {}, _('Statistics are collected from the kernel traffic control system. Auto-refresh every 5 seconds.')),
				E('ul', {}, [
					E('li', {}, _('Packets: Number of packets processed by this class')),
					E('li', {}, _('Bytes: Total data volume processed')),
					E('li', {}, _('Dropped: Packets dropped due to queue overflow or rate limiting')),
					E('li', {}, _('Status: Current operational state of the class'))
				])
			])
		]);

		// Setup auto-refresh polling
		poll.add(L.bind(function() {
			return Promise.all([
				API.listClasses(),
				API.getStats()
			]).then(L.bind(function(refreshData) {
				var tbody = document.getElementById('stats-tbody');
				if (tbody) {
					dom.content(tbody, this.renderStatsRows(
						refreshData[0].classes || [],
						refreshData[1].stats || []
					));
				}
			}, this));
		}, this), 5);

		return container;
	},

	renderStatsRows: function(classes, stats) {
		if (classes.length === 0) {
			return E('tr', {}, [
				E('td', { 'colspan': 7, 'style': 'text-align: center; color: #999; padding: 2em;' },
					_('No traffic classes configured'))
			]);
		}

		return classes.map(L.bind(function(cls) {
			var clsStats = stats.find(function(s) { return s.class === cls['.name']; }) || {};
			var priority = parseInt(cls.priority || 5);
			var enabled = cls.enabled === '1';

			return E('tr', {
				'class': enabled ? '' : 'inactive',
				'style': enabled ? '' : 'opacity: 0.5;'
			}, [
				E('td', {}, [
					E('div', { 'style': 'display: flex; align-items: center;' }, [
						E('div', {
							'style': 'width: 4px; height: 24px; margin-right: 8px; background: ' +
								this.getPriorityColor(priority) + ';'
						}),
						E('strong', {}, cls.name || cls['.name'])
					])
				]),
				E('td', {}, API.getPriorityLabel(priority)),
				E('td', {}, [
					E('div', {}, API.formatBandwidth(cls.rate)),
					E('div', { 'style': 'font-size: 0.85em; color: #666;' },
						'→ ' + API.formatBandwidth(cls.ceil))
				]),
				E('td', { 'style': 'text-align: right; font-family: monospace;' },
					(clsStats.packets || 0).toLocaleString()),
				E('td', { 'style': 'text-align: right; font-family: monospace;' },
					API.formatBytes(parseInt(clsStats.bytes || 0))),
				E('td', { 'style': 'text-align: right; font-family: monospace; color: ' +
					(parseInt(clsStats.dropped || 0) > 0 ? '#dc3545' : '#666') + ';' },
					(clsStats.dropped || 0).toLocaleString()),
				E('td', {}, [
					E('span', {
						'class': 'ts-status-badge ' + (enabled ? 'active' : 'inactive')
					}, enabled ? _('Active') : _('Disabled'))
				])
			]);
		}, this));
	},

	getPriorityColor: function(priority) {
		if (priority <= 2) return '#dc3545';  // High - Red
		if (priority <= 4) return '#fd7e14';  // Medium - Orange
		if (priority <= 6) return '#28a745';  // Normal - Green
		return '#6c757d';  // Low - Gray
	},

	handleRefresh: function(ev) {
		poll.start();

		var btn = ev.target;
		btn.disabled = true;
		btn.textContent = _('Refreshing...');

		Promise.all([
			API.listClasses(),
			API.getStats()
		]).then(L.bind(function(data) {
			var tbody = document.getElementById('stats-tbody');
			if (tbody) {
				dom.content(tbody, this.renderStatsRows(
					data[0].classes || [],
					data[1].stats || []
				));
			}

			btn.disabled = false;
			btn.textContent = _('Refresh Now');
		}, this)).catch(function(err) {
			btn.disabled = false;
			btn.textContent = _('Refresh Now');
			ui.addNotification(null, E('p', _('Failed to refresh statistics: %s').format(err.message)));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
