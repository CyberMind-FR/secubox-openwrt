'use strict';
'require view';
'require poll';
'require ui';
'require media-flow/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.getActiveStreams(),
			API.getStatsByService()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var activeStreams = data[1] || [];
		var statsByService = data[2] || {};

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Media Flow Dashboard')),
			E('div', { 'class': 'cbi-map-descr' }, _('Real-time detection and monitoring of streaming services'))
		]);

		// Status overview
		var statusSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Status')),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [
						E('strong', {}, _('Module: ')),
						E('span', {}, status.enabled ? _('Enabled') : _('Disabled'))
					]),
					E('div', { 'class': 'td left', 'width': '33%' }, [
						E('strong', {}, _('Netifyd: ')),
						E('span', {}, status.netifyd_running ? 
							E('span', { 'style': 'color: green' }, '● ' + _('Running')) : 
							E('span', { 'style': 'color: red' }, '● ' + _('Stopped'))
						)
					]),
					E('div', { 'class': 'td left', 'width': '33%' }, [
						E('strong', {}, _('Active Streams: ')),
						E('span', { 'style': 'font-size: 1.5em; color: #0088cc' }, String(status.active_streams || 0))
					])
				])
			])
		]);
		v.appendChild(statusSection);

		// Active streams
		var activeSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Active Streams')),
			E('div', { 'id': 'active-streams-table' })
		]);

		var updateActiveStreams = function() {
			API.getActiveStreams().then(function(streams) {
				var table = E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Service')),
						E('th', { 'class': 'th' }, _('Category')),
						E('th', { 'class': 'th' }, _('Client')),
						E('th', { 'class': 'th' }, _('Quality')),
						E('th', { 'class': 'th' }, _('Bandwidth'))
					])
				]);

				if (streams && streams.length > 0) {
					streams.forEach(function(stream) {
						var qualityColor = {
							'SD': '#999',
							'HD': '#0088cc',
							'FHD': '#00cc00',
							'4K': '#cc0000'
						}[stream.quality] || '#666';

						var categoryIcon = {
							'video': '🎬',
							'audio': '🎵',
							'visio': '📹'
						}[stream.category] || '📊';

						table.appendChild(E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, categoryIcon + ' ' + stream.application),
							E('td', { 'class': 'td' }, stream.category),
							E('td', { 'class': 'td' }, stream.client_ip),
							E('td', { 'class': 'td' }, 
								E('span', { 'style': 'color: ' + qualityColor + '; font-weight: bold' }, stream.quality)
							),
							E('td', { 'class': 'td' }, stream.bandwidth_kbps + ' kbps')
						]));
					});
				} else {
					table.appendChild(E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'colspan': '5', 'style': 'text-align: center; font-style: italic' }, 
							_('No active streams detected')
						)
					]));
				}

				var container = document.getElementById('active-streams-table');
				if (container) {
					container.innerHTML = '';
					container.appendChild(table);
				}
			});
		};

		updateActiveStreams();
		v.appendChild(activeSection);

		// Stats by service (pie chart simulation with bars)
		var statsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Usage by Service')),
			E('div', { 'id': 'service-stats' })
		]);

		var updateServiceStats = function() {
			API.getStatsByService().then(function(data) {
				var services = data.services || {};
				var container = document.getElementById('service-stats');
				
				if (!container) return;
				
				container.innerHTML = '';

				var servicesList = Object.keys(services);
				if (servicesList.length === 0) {
					container.appendChild(E('p', { 'style': 'font-style: italic' }, _('No historical data available')));
					return;
				}

				// Calculate total for percentage
				var total = 0;
				servicesList.forEach(function(service) {
					total += services[service].total_duration_seconds || 0;
				});

				// Sort by duration
				servicesList.sort(function(a, b) {
					return (services[b].total_duration_seconds || 0) - (services[a].total_duration_seconds || 0);
				});

				// Display top 10
				servicesList.slice(0, 10).forEach(function(service) {
					var stats = services[service];
					var duration = stats.total_duration_seconds || 0;
					var percentage = total > 0 ? Math.round((duration / total) * 100) : 0;
					var hours = Math.floor(duration / 3600);
					var minutes = Math.floor((duration % 3600) / 60);

					var categoryIcon = {
						'video': '🎬',
						'audio': '🎵',
						'visio': '📹'
					}[stats.category] || '📊';

					container.appendChild(E('div', { 'style': 'margin: 10px 0' }, [
						E('div', { 'style': 'margin-bottom: 5px' }, [
							E('strong', {}, categoryIcon + ' ' + service),
							E('span', { 'style': 'float: right' }, hours + 'h ' + minutes + 'm (' + percentage + '%)')
						]),
						E('div', { 
							'style': 'background: #e0e0e0; height: 20px; border-radius: 5px; overflow: hidden' 
						}, [
							E('div', { 
								'style': 'background: #0088cc; height: 100%; width: ' + percentage + '%' 
							})
						])
					]));
				});
			});
		};

		updateServiceStats();
		v.appendChild(statsSection);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			updateActiveStreams();
			updateServiceStats();
		}, this), 5);

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
