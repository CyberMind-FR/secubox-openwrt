'use strict';
'require view';
'require secubox-theme/theme as Theme';
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
		E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
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

		// Stats by service (donut chart + bars)
		var statsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Usage by Service')),
			E('div', { 'style': 'display: flex; gap: 20px;' }, [
				E('div', { 'style': 'flex: 0 0 300px;' }, [
					E('canvas', {
						'id': 'service-donut-chart',
						'width': '300',
						'height': '300',
						'style': 'max-width: 100%;'
					})
				]),
				E('div', { 'id': 'service-stats', 'style': 'flex: 1;' })
			])
		]);

		var serviceColors = [
			'#0088cc', '#00cc88', '#cc0088', '#cc8800', '#8800cc',
			'#00cccc', '#cc00cc', '#cccc00', '#0000cc', '#cc0000'
		];

		var drawDonutChart = function(services, servicesList, total) {
			var canvas = document.getElementById('service-donut-chart');
			if (!canvas || !canvas.getContext) return;

			var ctx = canvas.getContext('2d');
			var centerX = 150;
			var centerY = 150;
			var outerRadius = 120;
			var innerRadius = 70;

			// Clear canvas
			ctx.clearRect(0, 0, 300, 300);

			if (servicesList.length === 0 || total === 0) {
				ctx.fillStyle = '#999';
				ctx.font = '14px sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText(_('No data'), centerX, centerY);
				return;
			}

			// Draw donut segments
			var currentAngle = -Math.PI / 2; // Start at top

			servicesList.slice(0, 10).forEach(function(service, index) {
				var duration = services[service].total_duration_seconds || 0;
				var percentage = duration / total;
				var segmentAngle = percentage * 2 * Math.PI;

				// Draw segment
				ctx.fillStyle = serviceColors[index % serviceColors.length];
				ctx.beginPath();
				ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + segmentAngle);
				ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
				ctx.closePath();
				ctx.fill();

				// Draw border
				ctx.strokeStyle = '#fff';
				ctx.lineWidth = 2;
				ctx.stroke();

				currentAngle += segmentAngle;
			});

			// Draw center circle (donut hole)
			ctx.fillStyle = '#f8f9fa';
			ctx.beginPath();
			ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
			ctx.fill();

			// Draw total in center
			ctx.fillStyle = '#333';
			ctx.font = 'bold 16px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			var totalHours = Math.floor(total / 3600);
			ctx.fillText(totalHours + 'h', centerX, centerY - 10);
			ctx.font = '12px sans-serif';
			ctx.fillText(_('Total'), centerX, centerY + 10);
		};

		var updateServiceStats = function() {
			API.getStatsByService().then(function(data) {
				var services = data.services || {};
				var container = document.getElementById('service-stats');

				if (!container) return;

				container.innerHTML = '';

				var servicesList = Object.keys(services);
				if (servicesList.length === 0) {
					container.appendChild(E('p', { 'style': 'font-style: italic' }, _('No historical data available')));
					drawDonutChart({}, [], 0);
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

				// Draw donut chart
				drawDonutChart(services, servicesList, total);

				// Display top 10
				servicesList.slice(0, 10).forEach(function(service, index) {
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

					var color = serviceColors[index % serviceColors.length];

					container.appendChild(E('div', { 'style': 'margin: 10px 0' }, [
						E('div', { 'style': 'margin-bottom: 5px' }, [
							E('span', {
								'style': 'display: inline-block; width: 12px; height: 12px; background: ' + color + '; margin-right: 8px; border-radius: 2px;'
							}),
							E('strong', {}, categoryIcon + ' ' + service),
							E('span', { 'style': 'float: right' }, hours + 'h ' + minutes + 'm (' + percentage + '%)')
						]),
						E('div', {
							'style': 'background: #e0e0e0; height: 20px; border-radius: 5px; overflow: hidden'
						}, [
							E('div', {
								'style': 'background: ' + color + '; height: 100%; width: ' + percentage + '%'
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
