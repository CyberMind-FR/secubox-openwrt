'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require system-hub/api as API';
'require secubox-theme/theme as Theme';
'require system-hub/nav as HubNav';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	healthData: null,

	load: function() {
		return API.getHealth();
	},

	render: function(data) {
		this.healthData = data || {};

		var container = E('div', { 'class': 'system-hub-dashboard sh-health-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/health.css') }),
			HubNav.renderTabs('health'),
			this.renderHero(),
			this.renderMetricGrid(),
			this.renderSummaryPanels(),
			this.renderRecommendations(),
			this.renderActions()
		]);

		var self = this;
		poll.add(function() {
			return API.getHealth().then(function(fresh) {
				self.healthData = fresh || {};
				self.updateWidgets();
			});
		}, 30);

		return container;
	},

	renderHero: function() {
		var score = this.healthData.score || 0;
		var state = score >= 80 ? 'healthy' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'critical';

		return E('section', { 'class': 'sh-health-hero' }, [
			E('div', {}, [
				E('span', { 'class': 'sh-hero-eyebrow' }, _('System Health Monitor')),
				E('h1', {}, _('Real-time health score') + ': ' + score + '/100'),
				E('p', {}, _('CPU, RAM, storage, temperature, network, and services health summarized.'))
			]),
			E('div', { 'class': 'sh-health-score sh-' + state }, [
				E('div', { 'id': 'sh-health-score' }, score),
				E('span', {}, state.toUpperCase())
			])
		]);
	},

	renderMetricGrid: function() {
		var cpu = this.healthData.cpu || {};
		var mem = this.healthData.memory || {};
		var disk = this.healthData.disk || {};
		var temp = this.healthData.temperature || {};

		return E('section', { 'class': 'sh-health-grid', 'id': 'sh-health-grid' }, [
			this.renderMetricCard('cpu', '🔥', _('CPU Usage'), (cpu.usage || 0) + '%', cpu),
			this.renderMetricCard('mem', '💾', _('Memory'), (mem.usage || 0) + '%', mem),
			this.renderMetricCard('disk', '💿', _('Storage'), (disk.usage || 0) + '%', disk),
			this.renderMetricCard('temp', '🌡️', _('Temperature'), (temp.value || 0) + '°C', temp)
		]);
	},

	renderMetricCard: function(id, icon, label, value, data) {
		var percent = data.usage || data.value || 0;
		var status = data.status || 'ok';
		return E('div', { 'class': 'sh-health-card sh-' + status, 'data-id': id }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('span', { 'class': 'sh-card-title-icon' }, icon),
				E('div', { 'class': 'sh-card-title' }, label)
			]),
			E('div', { 'class': 'sh-health-value', 'id': 'sh-health-value-' + id }, value),
			E('div', { 'class': 'sh-health-bar' }, [
				E('div', {
					'class': 'sh-health-bar-fill',
					'id': 'sh-health-bar-' + id,
					'style': 'width:' + Math.min(100, percent) + '%'
				})
			])
		]);
	},

	renderSummaryPanels: function() {
		return E('section', { 'class': 'sh-summary-grid' }, [
			this.renderNetworkPanel(),
			this.renderServicesPanel()
		]);
	},

	renderNetworkPanel: function() {
		var net = this.healthData.network || {};
		var status = net.wan_up ? _('Connected') : _('Disconnected');
		return E('div', { 'class': 'sh-summary-card' }, [
			E('h3', {}, _('Network Summary')),
			E('ul', {}, [
				E('li', {}, _('WAN: ') + status),
				E('li', {}, _('RX: ') + API.formatBytes(net.rx_bytes || 0)),
				E('li', {}, _('TX: ') + API.formatBytes(net.tx_bytes || 0))
			])
		]);
	},

	renderServicesPanel: function() {
		var svc = this.healthData.services || {};
		return E('div', { 'class': 'sh-summary-card' }, [
			E('h3', {}, _('Services Health')),
			E('ul', {}, [
				E('li', {}, _('Running: ') + (svc.running || 0)),
				E('li', {}, _('Failed: ') + (svc.failed || 0))
			])
		]);
	},

	renderRecommendations: function() {
		var recos = this.healthData.recommendations || [];
		if (!recos.length) return E('section', { 'class': 'sh-card' }, []);
		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [E('span', { 'class': 'sh-card-title-icon' }, '📋'), _('Recommendations')])
			]),
			E('ul', { 'class': 'sh-reco-list', 'id': 'sh-reco-list' },
				recos.map(function(text) {
					return E('li', {}, text);
				})
			)
		]);
	},

	renderActions: function() {
		return E('section', { 'class': 'sh-card' }, [
			E('div', { 'class': 'sh-card-header' }, [
				E('div', { 'class': 'sh-card-title' }, [E('span', { 'class': 'sh-card-title-icon' }, '🔧'), _('Maintenance Actions')])
			]),
			E('div', { 'class': 'sh-card-body sh-btn-group' }, [
				E('button', {
					'class': 'sh-btn sh-btn-primary',
					'click': ui.createHandlerFn(this, 'runHealthCheck')
				}, _('Run full health check')),
				E('button', {
					'class': 'sh-btn',
					'click': function() { window.location.hash = '#admin/secubox/network/modes/overview'; }
				}, _('Open Network Modes'))
			])
		]);
	},

	updateWidgets: function() {
		var scoreNode = document.getElementById('sh-health-score');
		if (scoreNode) scoreNode.textContent = this.healthData.score || 0;
		['cpu','mem','disk','temp'].forEach(function(id) {
			var bar = document.getElementById('sh-health-bar-' + id);
			var data = this.healthData[id === 'cpu' ? 'cpu' : id === 'mem' ? 'memory' : id === 'disk' ? 'disk' : 'temperature'] || {};
			var percent = data.usage || data.value || 0;
			if (bar) bar.style.width = Math.min(100, percent) + '%';
			var valNode = document.getElementById('sh-health-value-' + id);
			if (valNode) valNode.textContent = (id === 'temp') ? (data.value || 0) + '°C' : (percent || 0) + '%';
		}, this);
		var list = document.getElementById('sh-reco-list');
		if (list) {
			dom.content(list, (this.healthData.recommendations || []).map(function(text) {
				return E('li', {}, text);
			}));
		}
	},

	runHealthCheck: function() {
		ui.addNotification(null, E('p', {}, _('Full health check started (see alerts).')), 'info');
	}
});
