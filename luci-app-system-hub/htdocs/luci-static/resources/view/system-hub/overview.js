'use strict';
'require view';
'require poll';
'require system-hub/api as API';
'require system-hub/theme as Theme';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('system-hub/dashboard.css')
}));

// Initialize theme
Theme.init();

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getSystemInfo(),
			API.getHealth(),
			API.getStatus()
		]);
	},

	render: function(data) {
		var sysInfo = data[0] || {};
		var health = data[1] || {};
		var status = data[2] || {};

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('System Hub - Overview')),
			E('div', { 'class': 'cbi-map-descr' }, _('Central system control and monitoring'))
		]);

		// System Information Card
		var infoSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('System Information')),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '50%' }, [
						E('strong', {}, _('Hostname: ')),
						E('span', {}, sysInfo.hostname || 'unknown')
					]),
					E('div', { 'class': 'td left', 'width': '50%' }, [
						E('strong', {}, _('Model: ')),
						E('span', {}, sysInfo.model || 'Unknown')
					])
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '50%' }, [
						E('strong', {}, _('OpenWrt: ')),
						E('span', {}, sysInfo.openwrt_version || 'Unknown')
					]),
					E('div', { 'class': 'td left', 'width': '50%' }, [
						E('strong', {}, _('Kernel: ')),
						E('span', {}, sysInfo.kernel || 'unknown')
					])
				]),
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '50%' }, [
						E('strong', {}, _('Uptime: ')),
						E('span', {}, sysInfo.uptime_formatted || '0d 0h 0m')
					]),
					E('div', { 'class': 'td left', 'width': '50%' }, [
						E('strong', {}, _('Local Time: ')),
						E('span', {}, sysInfo.local_time || 'unknown')
					])
				])
			])
		]);
		v.appendChild(infoSection);

		// Health Metrics with Gauges
		var healthSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('System Health'))
		]);

		var gaugesContainer = E('div', { 'style': 'display: flex; justify-content: space-around; flex-wrap: wrap; margin: 20px 0;' });

		// CPU Load Gauge
		var cpuLoad = parseFloat(health.cpu ? health.cpu.load_1m : '0');
		var cpuPercent = health.cpu ? health.cpu.usage : 0;
		gaugesContainer.appendChild(this.createGauge('CPU Load', cpuPercent, cpuLoad.toFixed(2)));

		// Memory Gauge
		var memPercent = health.memory ? health.memory.usage : 0;
		var memUsed = health.memory ? (health.memory.used_kb / 1024).toFixed(0) : 0;
		var memTotal = health.memory ? (health.memory.total_kb / 1024).toFixed(0) : 0;
		gaugesContainer.appendChild(this.createGauge('Memory', memPercent, memUsed + ' / ' + memTotal + ' MB'));

		// Disk Gauge
		var diskPercent = health.disk ? health.disk.usage : 0;
		var diskUsed = health.disk ? (health.disk.used_kb / 1024).toFixed(0) : 0;
		var diskTotal = health.disk ? (health.disk.total_kb / 1024).toFixed(0) : 0;
		var diskInfo = diskUsed + ' / ' + diskTotal + ' MB';
		gaugesContainer.appendChild(this.createGauge('Disk Usage', diskPercent, diskInfo));

		healthSection.appendChild(gaugesContainer);
		v.appendChild(healthSection);

		// CPU Info
		if (health.cpu) {
			var cpuSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('CPU Information')),
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, _('Cores: ')),
							E('span', {}, String(health.cpu.cores))
						]),
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, _('Usage: ')),
							E('span', {}, health.cpu.usage + '%')
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td left' }, [
							E('strong', {}, _('Load Average: ')),
							E('span', {}, (health.cpu.load_1m + ' / ' + health.cpu.load_5m + ' / ' + health.cpu.load_15m))
						])
					])
				])
			]);
			v.appendChild(cpuSection);
		}

		// Temperature
		if (health.temperature && health.temperature.value > 0) {
			var tempValue = health.temperature.value;
			var tempColor = tempValue > 80 ? 'red' : (tempValue > 60 ? 'orange' : 'green');
			var tempSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Temperature')),
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td left' }, [
							E('strong', {}, _('System Temperature: ')),
							E('span', { 'style': 'color: ' + tempColor + '; font-weight: bold;' }, tempValue + '°C')
						])
					])
				])
			]);
			v.appendChild(tempSection);
		}

		// Storage (Root Filesystem)
		if (health.disk) {
			var diskColor = health.disk.usage > 90 ? 'red' : (health.disk.usage > 75 ? 'orange' : 'green');
			var storageSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Storage (Root Filesystem)')),
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, _('Total: ')),
							E('span', {}, (health.disk.total_kb / 1024).toFixed(0) + ' MB')
						]),
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, _('Used: ')),
							E('span', {}, (health.disk.used_kb / 1024).toFixed(0) + ' MB')
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td left' }, [
							E('strong', {}, _('Usage: ')),
							E('div', { 'style': 'display: inline-flex; align-items: center; width: 200px;' }, [
								E('div', { 'style': 'flex: 1; background: #eee; height: 10px; border-radius: 5px; margin-right: 10px;' }, [
									E('div', {
										'style': 'background: ' + diskColor + '; width: ' + health.disk.usage + '%; height: 100%; border-radius: 5px;'
									})
								]),
								E('span', { 'style': 'font-weight: bold; color: ' + diskColor }, health.disk.usage + '%')
							])
						])
					])
				])
			]);
			v.appendChild(storageSection);
		}

		// Auto-refresh every 5 seconds
		poll.add(L.bind(function() {
			return Promise.all([
				API.getHealth(),
				API.getStatus()
			]).then(L.bind(function(refreshData) {
				// Update would go here in a production implementation
			}, this));
		}, this), 5);

		return v;
	},

	createGauge: function(label, percent, detail) {
		var color = percent > 90 ? '#dc3545' : (percent > 75 ? '#fd7e14' : '#28a745');
		var size = 120;
		var strokeWidth = 10;
		var radius = (size - strokeWidth) / 2;
		var circumference = 2 * Math.PI * radius;
		var offset = circumference - (percent / 100 * circumference);

		return E('div', { 'style': 'text-align: center; margin: 10px;' }, [
			E('div', {}, [
				E('svg', { 'width': size, 'height': size, 'style': 'transform: rotate(-90deg);' }, [
					E('circle', {
						'cx': size/2,
						'cy': size/2,
						'r': radius,
						'fill': 'none',
						'stroke': '#eee',
						'stroke-width': strokeWidth
					}),
					E('circle', {
						'cx': size/2,
						'cy': size/2,
						'r': radius,
						'fill': 'none',
						'stroke': color,
						'stroke-width': strokeWidth,
						'stroke-dasharray': circumference,
						'stroke-dashoffset': offset,
						'stroke-linecap': 'round'
					})
				])
			]),
			E('div', { 'style': 'margin-top: -' + (size/2 + 10) + 'px; font-size: 20px; font-weight: bold; color: ' + color + ';' }, Math.round(percent) + '%'),
			E('div', { 'style': 'margin-top: ' + (size/2 - 10) + 'px; font-weight: bold;' }, label),
			E('div', { 'style': 'font-size: 12px; color: #666;' }, detail)
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
