'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require ui';
'require media-flow/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getStatsByService()
		]);
	},

	render: function(data) {
		var statsByService = data[0] || {};
		var services = statsByService.services || {};

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Services Statistics')),
			E('div', { 'class': 'cbi-map-descr' }, _('Detailed statistics per streaming service'))
		]);

		var servicesList = Object.keys(services);

		if (servicesList.length === 0) {
			v.appendChild(E('div', { 'class': 'cbi-section' }, [
				E('p', { 'style': 'font-style: italic; text-align: center; padding: 20px' }, 
					_('No service data available yet. Streaming services will appear here once detected.'))
			]));
			return v;
		}

		// Sort by total duration
		servicesList.sort(function(a, b) {
			return (services[b].total_duration_seconds || 0) - (services[a].total_duration_seconds || 0);
		});

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Service')),
				E('th', { 'class': 'th' }, _('Category')),
				E('th', { 'class': 'th' }, _('Sessions')),
				E('th', { 'class': 'th' }, _('Total Duration')),
				E('th', { 'class': 'th' }, _('Avg Bandwidth')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		]);

		servicesList.forEach(function(service) {
			var stats = services[service];
			var duration = stats.total_duration_seconds || 0;
			var hours = Math.floor(duration / 3600);
			var minutes = Math.floor((duration % 3600) / 60);
			var avgBandwidth = stats.total_bandwidth_kbps / stats.sessions || 0;

			var categoryIcon = {
				'video': '🎬',
				'audio': '🎵',
				'visio': '📹'
			}[stats.category] || '📊';

			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, categoryIcon + ' ' + service),
				E('td', { 'class': 'td' }, stats.category),
				E('td', { 'class': 'td' }, String(stats.sessions)),
				E('td', { 'class': 'td' }, hours + 'h ' + minutes + 'm'),
				E('td', { 'class': 'td' }, Math.round(avgBandwidth) + ' kbps'),
				E('td', { 'class': 'td' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function(ev) {
							API.getServiceDetails(service).then(function(details) {
								ui.showModal(_('Service Details: ') + service, [
									E('div', { 'class': 'cbi-section' }, [
										E('p', {}, [
											E('strong', {}, _('Category: ')),
											E('span', {}, details.category || 'unknown')
										]),
										E('p', {}, [
											E('strong', {}, _('Total Sessions: ')),
											E('span', {}, String(details.total_sessions || 0))
										]),
										E('p', {}, [
											E('strong', {}, _('Average Bandwidth: ')),
											E('span', {}, Math.round(details.avg_bandwidth_kbps || 0) + ' kbps')
										]),
										E('p', {}, [
											E('strong', {}, _('Typical Quality: ')),
											E('span', {}, details.typical_quality || 'unknown')
										]),
										E('p', {}, [
											E('strong', {}, _('Total Duration: ')),
											E('span', {}, Math.floor((details.total_duration_seconds || 0) / 3600) + 'h')
										])
									]),
									E('div', { 'class': 'right' }, [
										E('button', {
											'class': 'cbi-button cbi-button-neutral',
											'click': ui.hideModal
										}, _('Close'))
									])
								]);
							});
						}
					}, _('Details'))
				])
			]));
		});

		v.appendChild(E('div', { 'class': 'cbi-section' }, table));

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
