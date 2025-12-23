'use strict';
'require view';
'require dom';
'require poll';
'require ui';

var api = L.require('system-hub.api');

return view.extend({
	refreshInterval: 30000,

	load: function() {
		return api.getAllData();
	},

	render: function(data) {
		var status = data.status;
		var components = data.components || [];
		var health = data.health;
		var self = this;

		var healthInfo = api.getHealthStatus(health.score || 0);
		var installedComponents = components.filter(function(c) { return c.status === 'installed'; });
		var runningComponents = installedComponents.filter(function(c) { return c.running; });
		var issueComponents = installedComponents.filter(function(c) { return !c.running; });

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			// Header
			E('div', { 'class': 'sh-header' }, [
				E('div', { 'class': 'sh-logo' }, [
					E('div', { 'class': 'sh-logo-icon' }, '🎛️'),
					E('div', { 'class': 'sh-logo-text' }, [ 'System ', E('span', {}, 'Hub') ])
				]),
				E('div', { 'class': 'sh-health-score' }, [
					E('div', { 'class': 'sh-score-circle ' + healthInfo.status }, (health.score || 0).toString()),
					E('div', { 'class': 'sh-score-info' }, [
						E('div', { 'class': 'sh-score-label' }, healthInfo.label),
						E('div', { 'class': 'sh-score-status' }, 'Dernière vérif: ' + (status.last_health_check || 'Jamais'))
					])
				])
			]),
			
			// Stats Grid
			E('div', { 'class': 'sh-stats-grid' }, [
				E('div', { 'class': 'sh-stat-card' }, [
					E('div', { 'class': 'sh-stat-icon' }, '🧩'),
					E('div', { 'class': 'sh-stat-value' }, installedComponents.length.toString()),
					E('div', { 'class': 'sh-stat-label' }, 'Composants')
				]),
				E('div', { 'class': 'sh-stat-card' }, [
					E('div', { 'class': 'sh-stat-icon' }, '✅'),
					E('div', { 'class': 'sh-stat-value' }, runningComponents.length.toString()),
					E('div', { 'class': 'sh-stat-label' }, 'En Marche')
				]),
				E('div', { 'class': 'sh-stat-card' }, [
					E('div', { 'class': 'sh-stat-icon' }, '⚠️'),
					E('div', { 'class': 'sh-stat-value' }, issueComponents.length.toString()),
					E('div', { 'class': 'sh-stat-label' }, 'Attention')
				]),
				E('div', { 'class': 'sh-stat-card' }, [
					E('div', { 'class': 'sh-stat-icon' }, '📊'),
					E('div', { 'class': 'sh-stat-value' }, (health.score || 0).toString()),
					E('div', { 'class': 'sh-stat-label' }, 'Score Santé')
				]),
				E('div', { 'class': 'sh-stat-card' }, [
					E('div', { 'class': 'sh-stat-icon' }, '📱'),
					E('div', { 'class': 'sh-stat-value' }, (status.network?.connected_clients || 0).toString()),
					E('div', { 'class': 'sh-stat-label' }, 'Clients')
				]),
				E('div', { 'class': 'sh-stat-card' }, [
					E('div', { 'class': 'sh-stat-icon' }, '⏱️'),
					E('div', { 'class': 'sh-stat-value' }, api.formatUptime(status.system?.uptime || 0)),
					E('div', { 'class': 'sh-stat-label' }, 'Uptime')
				])
			]),
			
			// System Info Card
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '💻'), 'Informations Système' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-sysinfo-grid' }, [
						this.renderSysInfo('Hostname', status.system?.hostname || 'N/A'),
						this.renderSysInfo('Modèle', status.system?.model || 'N/A'),
						this.renderSysInfo('Architecture', status.system?.architecture || 'N/A'),
						this.renderSysInfo('Kernel', status.system?.kernel || 'N/A'),
						this.renderSysInfo('OpenWrt', status.system?.openwrt_version || 'N/A'),
						this.renderSysInfo('Uptime', api.formatUptime(status.system?.uptime || 0)),
						this.renderSysInfo('WAN IP', status.network?.wan_ip || 'N/A'),
						this.renderSysInfo('LAN IP', status.network?.lan_ip || 'N/A')
					])
				])
			]),
			
			// Health Metrics Card
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📊'), 'Métriques Rapides' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-health-grid' }, [
						this.renderMetric('🔲', 'CPU', status.cpu?.usage_percent || 0, 80, 95, '%'),
						this.renderMetric('💾', 'RAM', status.memory?.usage_percent || 0, 80, 95, '%'),
						this.renderMetric('💿', 'Disque', status.storage?.usage_percent || 0, 80, 95, '%'),
						this.renderMetric('🌡️', 'Temp', status.temperature || 0, 70, 85, '°C')
					])
				])
			]),
			
			// Components Card
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🧩'), 'Composants Actifs' ]),
					E('div', { 'class': 'sh-card-badge' }, installedComponents.length + ' installés')
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-components-grid' }, 
						installedComponents.slice(0, 6).map(function(c) { return self.renderComponent(c, false); })
					)
				])
			])
		]);

		poll.add(L.bind(this.pollData, this), this.refreshInterval);
		return view;
	},

	renderSysInfo: function(label, value) {
		return E('div', { 'class': 'sh-sysinfo-item' }, [
			E('span', { 'class': 'sh-sysinfo-label' }, label),
			E('span', { 'class': 'sh-sysinfo-value' }, value)
		]);
	},

	renderMetric: function(icon, label, value, warning, critical, unit) {
		var status = api.getMetricStatus(value, warning, critical);
		return E('div', { 'class': 'sh-health-metric' }, [
			E('div', { 'class': 'sh-metric-header' }, [
				E('div', { 'class': 'sh-metric-title' }, [ E('span', { 'class': 'sh-metric-icon' }, icon), label ]),
				E('div', { 'class': 'sh-metric-value ' + status }, value + unit)
			]),
			E('div', { 'class': 'sh-progress-bar' }, [
				E('div', { 'class': 'sh-progress-fill ' + status, 'style': 'width: ' + Math.min(value, 100) + '%' })
			])
		]);
	},

	renderComponent: function(c, showActions) {
		return E('div', { 'class': 'sh-component-card', 'style': '--component-color: ' + c.color }, [
			E('div', { 'class': 'sh-component-header' }, [
				E('div', { 'class': 'sh-component-info' }, [
					E('div', { 'class': 'sh-component-icon' }, api.getComponentIcon(c.icon)),
					E('div', {}, [
						E('div', { 'class': 'sh-component-name' }, c.name),
						E('div', { 'class': 'sh-component-desc' }, c.description)
					])
				]),
				E('div', { 'class': 'sh-component-status ' + (c.running ? 'running' : 'stopped') }, 
					c.running ? 'Running' : 'Stopped')
			])
		]);
	},

	pollData: function() {
		// Poll implementation
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
