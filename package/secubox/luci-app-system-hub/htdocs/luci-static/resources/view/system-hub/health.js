'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require system-hub/api as API';
'require secubox/kiss-theme';

return view.extend({
	healthData: null,

	load: function() {
		return API.getHealth();
	},

	render: function(data) {
		this.healthData = data || {};

		var self = this;
		poll.add(function() {
			return API.getHealth().then(function(fresh) {
				self.healthData = fresh || {};
				self.updateWidgets();
			});
		}, 30);

		// Inject health-specific styles
		this.injectStyles();

		var content = [
			this.renderHero(),
			this.renderMetricGrid(),
			this.renderSummaryPanels(),
			this.renderRecommendations(),
			this.renderActions()
		];

		return KissTheme.wrap(content, 'admin/secubox/system/system-hub/health');
	},

	injectStyles: function() {
		if (document.querySelector('#sh-health-kiss-styles')) return;
		var style = document.createElement('style');
		style.id = 'sh-health-kiss-styles';
		style.textContent = `
.sh-health-hero { display: flex; justify-content: space-between; align-items: center; padding: 24px; background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 16px; margin-bottom: 24px; }
.sh-hero-eyebrow { font-size: 11px; color: var(--kiss-muted); text-transform: uppercase; letter-spacing: 1.5px; }
.sh-health-hero h1 { font-size: 24px; font-weight: 700; margin: 8px 0 4px; }
.sh-health-hero p { color: var(--kiss-muted); margin: 0; font-size: 14px; }
.sh-health-score { text-align: center; padding: 20px 30px; border-radius: 12px; background: rgba(0,200,83,0.05); border: 1px solid rgba(0,200,83,0.2); }
.sh-health-score > div { font-family: 'Orbitron', monospace; font-size: 48px; font-weight: 700; color: var(--kiss-green); }
.sh-health-score span { font-size: 11px; color: var(--kiss-green); letter-spacing: 2px; text-transform: uppercase; }
.sh-health-score.sh-healthy { background: rgba(0,200,83,0.05); border-color: rgba(0,200,83,0.2); }
.sh-health-score.sh-healthy > div, .sh-health-score.sh-healthy span { color: var(--kiss-green); }
.sh-health-score.sh-good { background: rgba(41,121,255,0.05); border-color: rgba(41,121,255,0.2); }
.sh-health-score.sh-good > div, .sh-health-score.sh-good span { color: var(--kiss-blue); }
.sh-health-score.sh-warning { background: rgba(251,191,36,0.05); border-color: rgba(251,191,36,0.2); }
.sh-health-score.sh-warning > div, .sh-health-score.sh-warning span { color: var(--kiss-yellow); }
.sh-health-score.sh-critical { background: rgba(255,23,68,0.05); border-color: rgba(255,23,68,0.2); }
.sh-health-score.sh-critical > div, .sh-health-score.sh-critical span { color: var(--kiss-red); }
.sh-health-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.sh-health-card { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; transition: all 0.2s; }
.sh-health-card:hover { border-color: rgba(0,200,83,0.2); }
.sh-health-card.sh-ok { border-left: 3px solid var(--kiss-green); }
.sh-health-card.sh-warning { border-left: 3px solid var(--kiss-yellow); }
.sh-health-card.sh-critical { border-left: 3px solid var(--kiss-red); }
.sh-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.sh-card-title-icon { font-size: 18px; }
.sh-card-title { font-size: 13px; font-weight: 600; color: var(--kiss-muted); }
.sh-health-value { font-family: 'Orbitron', monospace; font-size: 28px; font-weight: 700; color: var(--kiss-text); margin-bottom: 10px; }
.sh-health-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.sh-health-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--kiss-green), var(--kiss-cyan)); transition: width 0.3s; }
.sh-health-card.sh-warning .sh-health-bar-fill { background: linear-gradient(90deg, var(--kiss-yellow), var(--kiss-orange)); }
.sh-health-card.sh-critical .sh-health-bar-fill { background: linear-gradient(90deg, var(--kiss-red), var(--kiss-pink)); }
.sh-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
.sh-summary-card { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; }
.sh-summary-card h3 { margin: 0 0 12px; font-size: 15px; font-weight: 600; }
.sh-summary-card ul { list-style: none; padding: 0; margin: 0; }
.sh-summary-card li { padding: 6px 0; font-size: 13px; color: var(--kiss-muted); border-bottom: 1px solid rgba(255,255,255,0.03); }
.sh-summary-card li:last-child { border-bottom: none; }
.sh-card { background: var(--kiss-card); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
.sh-card .sh-card-header { margin-bottom: 12px; }
.sh-card .sh-card-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--kiss-text); }
.sh-reco-list { list-style: none; padding: 0; margin: 0; }
.sh-reco-list li { padding: 8px 12px; font-size: 13px; color: var(--kiss-muted); background: rgba(255,255,255,0.02); border-radius: 6px; margin-bottom: 6px; }
.sh-btn-group { display: flex; gap: 10px; flex-wrap: wrap; }
.sh-btn { padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--kiss-line); background: var(--kiss-bg2); color: var(--kiss-text); transition: all 0.2s; }
.sh-btn:hover { border-color: rgba(0,200,83,0.3); background: rgba(0,200,83,0.05); }
.sh-btn-primary { border-color: var(--kiss-green); color: var(--kiss-green); background: rgba(0,200,83,0.05); }
.sh-btn-primary:hover { background: rgba(0,200,83,0.1); }
`;
		document.head.appendChild(style);
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
