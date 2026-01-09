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
		var streamsData = data[1] || {};
		var statsByService = data[2] || {};

		var v = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('h2', {}, _('Media Flow Dashboard')),
			E('div', { 'class': 'cbi-map-descr' }, _('Streaming service detection and network flow monitoring'))
		]);

		// DPI Source indicator
		var dpiSource = status.dpi_source || 'none';
		var dpiColor = dpiSource === 'ndpid' ? '#00cc88' : (dpiSource === 'netifyd' ? '#0088cc' : '#cc0000');
		var dpiLabel = dpiSource === 'ndpid' ? 'nDPId (Local DPI)' : (dpiSource === 'netifyd' ? 'Netifyd' : 'No DPI Engine');

		// Status overview with DPI source
		var statusSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Status')),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('Module: ')),
						E('span', {}, status.enabled ? _('Enabled') : _('Disabled'))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('DPI Source: ')),
						E('span', { 'style': 'color: ' + dpiColor + '; font-weight: bold;' }, '● ' + dpiLabel)
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('Active Flows: ')),
						E('span', { 'style': 'font-size: 1.3em; color: #0088cc' }, String(status.active_flows || 0))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('Active Streams: ')),
						E('span', { 'style': 'font-size: 1.3em; color: #ec4899' }, String(status.active_streams || 0))
					])
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('nDPId: ')),
						E('span', {}, status.ndpid_running ?
							E('span', { 'style': 'color: green' }, '● ' + _('Running') + (status.ndpid_version !== 'unknown' ? ' (v' + status.ndpid_version + ')' : '')) :
							E('span', { 'style': 'color: #999' }, '○ ' + _('Not running'))
						)
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('Netifyd: ')),
						E('span', {}, status.netifyd_running ?
							E('span', { 'style': 'color: green' }, '● ' + _('Running') + ' (v' + (status.netifyd_version || '?') + ')') :
							E('span', { 'style': 'color: #999' }, '○ ' + _('Not running'))
						)
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('nDPId Flows: ')),
						E('span', {}, String(status.ndpid_flows || 0))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('History: ')),
						E('span', {}, String(status.history_entries || 0) + ' entries')
					])
				])
			])
		]);
		v.appendChild(statusSection);

		// Info notice based on DPI source
		var noticeSection;
		if (dpiSource === 'ndpid') {
			noticeSection = E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 4px; margin-bottom: 15px;' }, [
					E('strong', {}, _('nDPId Active: ')),
					E('span', {}, _('Using local deep packet inspection for streaming detection. No cloud subscription required.'))
				])
			]);
		} else if (dpiSource === 'netifyd') {
			noticeSection = E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 15px;' }, [
					E('strong', {}, _('Notice: ')),
					E('span', {}, _('Netifyd 5.x requires a cloud subscription for streaming service detection. Install nDPId for local detection.'))
				])
			]);
		} else {
			noticeSection = E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'background: #f8d7da; border: 1px solid #dc3545; padding: 15px; border-radius: 4px; margin-bottom: 15px;' }, [
					E('strong', {}, _('No DPI Engine: ')),
					E('span', {}, _('Install nDPId or netifyd for streaming detection capabilities.'))
				])
			]);
		}
		v.appendChild(noticeSection);

		// Active Streams section (when nDPId provides data)
		var streamsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Active Streams')),
			E('div', { 'id': 'active-streams-container' })
		]);

		var categoryIcons = {
			'video': String.fromCodePoint(0x1F3AC),
			'audio': String.fromCodePoint(0x1F3B5),
			'visio': String.fromCodePoint(0x1F4F9)
		};

		var qualityColors = {
			'4K': '#9333ea',
			'FHD': '#2563eb',
			'HD': '#059669',
			'SD': '#d97706',
			'Lossless': '#9333ea',
			'High': '#2563eb',
			'Normal': '#059669',
			'Low': '#d97706',
			'Audio Only': '#6b7280'
		};

		var renderActiveStreams = function(streams, dpiSrc) {
			var container = document.getElementById('active-streams-container');
			if (!container) return;

			container.innerHTML = '';

			if (!streams || streams.length === 0) {
				container.appendChild(E('div', { 'style': 'text-align: center; padding: 30px; color: #666;' }, [
					E('div', { 'style': 'font-size: 3em; margin-bottom: 10px;' }, String.fromCodePoint(0x1F4E1)),
					E('p', {}, dpiSrc === 'ndpid' ? _('No streaming activity detected') : _('Waiting for streaming data...'))
				]));
				return;
			}

			var table = E('table', { 'class': 'table', 'style': 'width: 100%;' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Service')),
					E('th', { 'class': 'th' }, _('Client')),
					E('th', { 'class': 'th' }, _('Category')),
					E('th', { 'class': 'th' }, _('Quality')),
					E('th', { 'class': 'th' }, _('Bandwidth')),
					E('th', { 'class': 'th' }, _('Data'))
				])
			]);

			streams.slice(0, 20).forEach(function(stream) {
				var icon = categoryIcons[stream.category] || String.fromCodePoint(0x1F4CA);
				var qualityColor = qualityColors[stream.quality] || '#6b7280';
				var bytesTotal = (stream.bytes_rx || 0) + (stream.bytes_tx || 0);
				var dataMB = (bytesTotal / 1048576).toFixed(1);

				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, [
						E('strong', {}, stream.app || 'Unknown')
					]),
					E('td', { 'class': 'td' }, stream.client || '-'),
					E('td', { 'class': 'td' }, icon + ' ' + (stream.category || 'other')),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'background: ' + qualityColor + '; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85em;' },
							stream.quality || '-')
					]),
					E('td', { 'class': 'td' }, (stream.bandwidth || 0) + ' kbps'),
					E('td', { 'class': 'td' }, dataMB + ' MB')
				]));
			});

			container.appendChild(table);
		};

		// Initial render of streams
		renderActiveStreams(streamsData.streams || [], dpiSource);
		v.appendChild(streamsSection);

		// Network flow stats
		var flowSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Network Flow Statistics')),
			E('div', { 'id': 'flow-stats-container' })
		]);

		var updateFlowStats = function() {
			API.getActiveStreams().then(function(data) {
				var container = document.getElementById('flow-stats-container');
				if (!container) return;

				var flowCount = data.flow_count || 0;
				var dpiSrc = data.dpi_source || 'none';
				var note = data.note || '';

				container.innerHTML = '';
				container.appendChild(E('div', { 'style': 'display: flex; justify-content: space-around; background: #f8f9fa; padding: 20px; border-radius: 8px;' }, [
					E('div', { 'style': 'text-align: center;' }, [
						E('div', { 'style': 'font-size: 2.5em; color: #0088cc; font-weight: bold;' }, String(flowCount)),
						E('div', { 'style': 'color: #666; margin-top: 5px;' }, _('Total Flows'))
					]),
					E('div', { 'style': 'text-align: center;' }, [
						E('div', { 'style': 'font-size: 2.5em; color: #ec4899; font-weight: bold;' }, String((data.streams || []).length)),
						E('div', { 'style': 'color: #666; margin-top: 5px;' }, _('Streaming Flows'))
					])
				]));

				if (note) {
					container.appendChild(E('p', { 'style': 'font-style: italic; color: #666; text-align: center; margin-top: 10px;' }, note));
				}

				// Update active streams table
				renderActiveStreams(data.streams || [], dpiSrc);
			});
		};

		updateFlowStats();
		v.appendChild(flowSection);

		// Stats by service (from history)
		var statsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Historical Usage by Service')),
			E('p', { 'style': 'color: #666; font-size: 0.9em;' }, _('Data collected from previous sessions (if available)')),
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
					container.appendChild(E('p', { 'style': 'font-style: italic' }, _('No historical data available. Start streaming services while nDPId is running to collect data.')));
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
			updateFlowStats();
			updateServiceStats();
		}, this), 5);

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
