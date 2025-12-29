'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require poll';
'require dom';
'require ui';
'require netdata-dashboard.api as api';

return view.extend({
	title: _('System'),
	
	load: function() {
		return Promise.all([
			api.getSystem(),
			api.getCpu(),
			api.getMemory(),
			api.getSensors()
		]);
	},
	
	render: function(data) {
		var system = data[0] || {};
		var cpu = data[1] || {};
		var memory = data[2] || {};
		var sensors = data[3] || {};
		
		var uptime = system.uptime_seconds || 0;
		var days = Math.floor(uptime / 86400);
		var hours = Math.floor((uptime % 86400) / 3600);
		var minutes = Math.floor((uptime % 3600) / 60);
		var seconds = uptime % 60;
		
		var view = E('div', { 'class': 'netdata-dashboard' }, [
			// Header
			E('div', { 'class': 'nd-header' }, [
				E('div', { 'class': 'nd-logo' }, [
					E('div', { 'class': 'nd-logo-icon' }, '🖥️'),
					E('div', { 'class': 'nd-logo-text' }, ['System ', E('span', {}, 'Info')])
				]),
				E('div', { 'class': 'nd-header-info' }, [
					E('div', { 'class': 'nd-hostname' }, system.hostname || 'OpenWrt'),
					E('div', { 'class': 'nd-live-badge' }, [
						E('span', { 'class': 'nd-live-dot' }),
						'Live'
					])
				])
			]),
			
			// Uptime Display
			E('div', { 'class': 'nd-chart-card' }, [
				E('div', { 'class': 'nd-chart-header' }, [
					E('div', { 'class': 'nd-chart-title' }, [
						E('span', { 'class': 'nd-chart-title-icon' }, '⏱️'),
						'System Uptime'
					])
				]),
				E('div', { 'class': 'nd-chart-body' }, [
					E('div', { 'class': 'nd-uptime' }, [
						E('div', { 'class': 'nd-uptime-block' }, [
							E('div', { 'class': 'nd-uptime-value' }, days),
							E('div', { 'class': 'nd-uptime-label' }, 'Days')
						]),
						E('div', { 'class': 'nd-uptime-block' }, [
							E('div', { 'class': 'nd-uptime-value' }, hours),
							E('div', { 'class': 'nd-uptime-label' }, 'Hours')
						]),
						E('div', { 'class': 'nd-uptime-block' }, [
							E('div', { 'class': 'nd-uptime-value' }, minutes),
							E('div', { 'class': 'nd-uptime-label' }, 'Minutes')
						]),
						E('div', { 'class': 'nd-uptime-block' }, [
							E('div', { 'class': 'nd-uptime-value' }, seconds),
							E('div', { 'class': 'nd-uptime-label' }, 'Seconds')
						])
					])
				])
			]),
			
			// Grid
			E('div', { 'class': 'nd-charts-grid', 'style': 'margin-top:16px' }, [
				// System Details
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '📋'),
							'System Details'
						])
					]),
					E('div', { 'class': 'nd-chart-body' }, [
						E('div', { 'class': 'nd-info-grid' }, [
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Hostname'),
								E('div', { 'class': 'nd-info-value' }, system.hostname || 'N/A')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Model'),
								E('div', { 'class': 'nd-info-value' }, system.model || 'N/A')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Distribution'),
								E('div', { 'class': 'nd-info-value' }, system.distro || 'OpenWrt')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Version'),
								E('div', { 'class': 'nd-info-value' }, system.version || 'N/A')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Target'),
								E('div', { 'class': 'nd-info-value' }, system.target || 'N/A')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Kernel'),
								E('div', { 'class': 'nd-info-value' }, system.kernel || 'N/A')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Architecture'),
								E('div', { 'class': 'nd-info-value' }, system.arch || 'N/A')
							])
						])
					])
				]),
				
				// CPU Info
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '⚡'),
							'CPU Information'
						])
					]),
					E('div', { 'class': 'nd-chart-body' }, [
						E('div', { 'class': 'nd-info-grid' }, [
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Cores'),
								E('div', { 'class': 'nd-info-value' }, cpu.cores || 1)
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Frequency'),
								E('div', { 'class': 'nd-info-value' }, cpu.frequency ? Math.round(cpu.frequency / 1000) + ' MHz' : 'N/A')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Load (1m)'),
								E('div', { 'class': 'nd-info-value' }, cpu.load1 || '0.00')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Load (5m)'),
								E('div', { 'class': 'nd-info-value' }, cpu.load5 || '0.00')
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Load (15m)'),
								E('div', { 'class': 'nd-info-value' }, cpu.load15 || '0.00')
							])
						])
					])
				]),
				
				// Memory Details
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '🧠'),
							'Memory Details'
						])
					]),
					E('div', { 'class': 'nd-chart-body' }, [
						E('div', { 'class': 'nd-info-grid' }, [
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Total'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.total || 0))
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Used'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.used || 0))
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Free'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.free || 0))
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Available'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.available || 0))
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Buffers'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.buffers || 0))
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Cached'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.cached || 0))
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Swap Total'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.swap_total || 0))
							]),
							E('div', { 'class': 'nd-info-item' }, [
								E('div', { 'class': 'nd-info-label' }, 'Swap Used'),
								E('div', { 'class': 'nd-info-value' }, api.formatKB(memory.swap_used || 0))
							])
						])
					])
				]),
				
				// Temperatures
				E('div', { 'class': 'nd-chart-card' }, [
					E('div', { 'class': 'nd-chart-header' }, [
						E('div', { 'class': 'nd-chart-title' }, [
							E('span', { 'class': 'nd-chart-title-icon' }, '🌡️'),
							'Temperature Sensors'
						])
					]),
					E('div', { 'class': 'nd-chart-body' },
						(sensors.temperatures && sensors.temperatures.length > 0) ?
						sensors.temperatures.map(function(s) {
							var tempClass = api.getTempClass(s.temp_c);
							return E('div', { 'style': 'display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #30363d' }, [
								E('span', {}, s.sensor),
								E('span', { 'class': 'nd-temp-value ' + tempClass, 'style': 'font-size:18px' }, s.temp_c + '°C')
							]);
						}) :
						E('div', { 'class': 'nd-empty' }, 'No temperature sensors detected')
					)
				])
			])
		]);
		
		var cssLink = E('link', { 'rel': 'stylesheet', 'href': L.resource('netdata-dashboard/dashboard.css') });
		document.head.appendChild(cssLink);
		
		return view;
	},
	
	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
