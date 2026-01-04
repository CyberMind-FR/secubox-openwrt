'use strict';
'require view';
'require secubox-admin.api as API';
'require poll';

return view.extend({
	load: function() {
		return API.getHealth();
	},

	render: function(health) {
		var container = E('div', { 'class': 'secubox-health' }, [
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/common.css') }),
			E('link', { 'rel': 'stylesheet',
				'href': L.resource('secubox-admin/admin.css') }),

			E('h2', {}, 'System Health'),
			E('p', {}, 'Monitor system resources and performance'),

			E('div', { 'class': 'health-cards' }, [
				this.renderMetricCard('CPU Usage', health.cpu || 0, '%', 'cpu'),
				this.renderMetricCard('Memory Usage', health.memory || 0, '%', 'memory'),
				this.renderMetricCard('Disk Usage', health.disk || 0, '%', 'disk'),
				this.renderMetricCard('Uptime', this.formatUptime(health.uptime || 0), '', 'uptime')
			]),

			E('div', { 'class': 'health-details card' }, [
				E('h3', {}, 'System Details'),
				E('table', { 'class': 'table' }, [
					E('tr', {}, [
						E('th', {}, 'Metric'),
						E('th', {}, 'Value')
					]),
					E('tr', {}, [
						E('td', {}, 'CPU Load'),
						E('td', {}, (health.load || [0, 0, 0]).join(', '))
					]),
					E('tr', {}, [
						E('td', {}, 'Total Memory'),
						E('td', {}, API.formatBytes(health.total_memory || 0))
					]),
					E('tr', {}, [
						E('td', {}, 'Free Memory'),
						E('td', {}, API.formatBytes(health.free_memory || 0))
					]),
					E('tr', {}, [
						E('td', {}, 'Total Disk'),
						E('td', {}, API.formatBytes(health.total_disk || 0))
					]),
					E('tr', {}, [
						E('td', {}, 'Free Disk'),
						E('td', {}, API.formatBytes(health.free_disk || 0))
					])
				])
			])
		]);

		// Auto-refresh every 5 seconds
		poll.add(L.bind(this.pollData, this), 5);

		return container;
	},

	renderMetricCard: function(label, value, unit, type) {
		var colorClass = '';
		if (typeof value === 'number') {
			if (value > 90) colorClass = 'danger';
			else if (value > 75) colorClass = 'warning';
			else colorClass = 'success';
		}

		return E('div', { 'class': 'metric-card card ' + colorClass }, [
			E('h4', {}, label),
			E('div', { 'class': 'metric-value' }, [
				E('span', { 'class': 'value' }, value),
				E('span', { 'class': 'unit' }, unit)
			]),
			E('div', { 'class': 'progress' }, [
				E('div', {
					'class': 'progress-bar',
					'style': 'width: ' + (typeof value === 'number' ? value : 0) + '%'
				})
			])
		]);
	},

	formatUptime: function(seconds) {
		var days = Math.floor(seconds / 86400);
		var hours = Math.floor((seconds % 86400) / 3600);
		var mins = Math.floor((seconds % 3600) / 60);
		return days + 'd ' + hours + 'h ' + mins + 'm';
	},

	pollData: function() {
		return API.getHealth().then(L.bind(function(health) {
			// Update DOM elements with new values
			// Implementation for live updates can be enhanced
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
