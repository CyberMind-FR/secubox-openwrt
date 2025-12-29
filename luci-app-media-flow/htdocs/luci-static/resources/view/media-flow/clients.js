'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require ui';
'require media-flow/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getStatsByClient()
		]);
	},

	render: function(data) {
		var statsByClient = data[0] || {};
		var clients = statsByClient.clients || {};

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Clients Statistics')),
			E('div', { 'class': 'cbi-map-descr' }, _('Streaming activity per client'))
		]);

		var clientsList = Object.keys(clients);

		if (clientsList.length === 0) {
			v.appendChild(E('div', { 'class': 'cbi-section' }, [
				E('p', { 'style': 'font-style: italic; text-align: center; padding: 20px' }, 
					_('No client data available yet'))
			]));
			return v;
		}

		// Sort by total duration
		clientsList.sort(function(a, b) {
			return (clients[b].total_duration_seconds || 0) - (clients[a].total_duration_seconds || 0);
		});

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Client IP')),
				E('th', { 'class': 'th' }, _('Sessions')),
				E('th', { 'class': 'th' }, _('Total Duration')),
				E('th', { 'class': 'th' }, _('Total Bandwidth')),
				E('th', { 'class': 'th' }, _('Top Service'))
			])
		]);

		clientsList.forEach(function(client) {
			var stats = clients[client];
			var duration = stats.total_duration_seconds || 0;
			var hours = Math.floor(duration / 3600);
			var minutes = Math.floor((duration % 3600) / 60);

			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, client),
				E('td', { 'class': 'td' }, String(stats.sessions)),
				E('td', { 'class': 'td' }, hours + 'h ' + minutes + 'm'),
				E('td', { 'class': 'td' }, Math.round(stats.total_bandwidth_kbps) + ' kbps'),
				E('td', { 'class': 'td' }, stats.top_service || 'N/A')
			]));
		});

		v.appendChild(E('div', { 'class': 'cbi-section' }, table));

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
