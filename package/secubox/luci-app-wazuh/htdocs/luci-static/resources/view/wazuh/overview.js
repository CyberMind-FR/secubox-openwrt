'use strict';
'require view';
'require dom';
'require poll';
'require wazuh.api as api';
'require secubox/kiss-theme';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			api.getOverview(),
			api.getAlertSummary(),
			api.getCrowdSecCorrelation()
		]);
	},

	render: function(data) {
		var self = this;
		var overview = data[0] || {};
		var alerts = data[1] || {};
		var crowdsec = data[2] || {};

		// Determine health status
		var agentOk = overview.agent && overview.agent.connected;
		var managerOk = overview.manager && overview.manager.running;
		var indexerOk = overview.manager && overview.manager.indexer_status === 'green';
		var crowdsecOk = crowdsec.crowdsec_running;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px; flex-wrap: wrap;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Wazuh SIEM'),
					KissTheme.badge(managerOk ? 'RUNNING' : 'STOPPED', managerOk ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Security Information and Event Management')
			]),

			// Navigation tabs
			this.renderNav('overview'),

			// Stats row
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'wazuh-stats', 'style': 'margin: 20px 0;' }, [
				KissTheme.stat(alerts.critical || 0, 'Critical', this.colors.red),
				KissTheme.stat(alerts.high || 0, 'High', this.colors.orange),
				KissTheme.stat(alerts.medium || 0, 'Medium', this.colors.yellow),
				KissTheme.stat(alerts.total || 0, 'Total Alerts', this.colors.cyan)
			]),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				// Health Status card
				KissTheme.card('System Health', this.renderHealth(overview, crowdsec)),
				// Quick Actions card
				KissTheme.card('Quick Actions', this.renderActions())
			]),

			// Security Layers
			KissTheme.card('Security Layers', this.renderLayers(overview, crowdsec))
		];

		poll.add(L.bind(this.pollData, this), 30);
		return KissTheme.wrap(content, 'admin/services/wazuh/overview');
	},

	colors: {
		green: '#00C853',
		red: '#FF1744',
		orange: '#fb923c',
		yellow: '#fbbf24',
		cyan: '#22d3ee',
		muted: '#94a3b8'
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/wazuh/overview' },
			{ name: 'Alerts', path: 'admin/services/wazuh/alerts' },
			{ name: 'File Integrity', path: 'admin/services/wazuh/fim' },
			{ name: 'Agents', path: 'admin/services/wazuh/agents' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderHealth: function(overview, crowdsec) {
		var self = this;
		var items = [
			{
				name: 'Wazuh Agent',
				status: overview.agent && overview.agent.connected ? 'Connected' :
					(overview.agent && overview.agent.running ? 'Running' : 'Stopped'),
				ok: overview.agent && overview.agent.connected,
				desc: 'Local security monitoring'
			},
			{
				name: 'Wazuh Manager',
				status: overview.manager && overview.manager.running ? 'Running' : 'Stopped',
				ok: overview.manager && overview.manager.running,
				desc: 'SIEM server in LXC'
			},
			{
				name: 'Indexer',
				status: overview.manager ? (overview.manager.indexer_status || 'Unknown') : 'Unknown',
				ok: overview.manager && overview.manager.indexer_status === 'green',
				desc: 'OpenSearch cluster'
			},
			{
				name: 'CrowdSec',
				status: crowdsec.crowdsec_running ? 'Active' : 'Inactive',
				ok: crowdsec.crowdsec_running,
				desc: (crowdsec.active_decisions || 0) + ' ban decisions'
			}
		];

		return E('div', {}, items.map(function(item) {
			return E('div', {
				'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--kiss-line);'
			}, [
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600;' }, item.name),
					E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, item.desc)
				]),
				KissTheme.badge(item.status, item.ok ? 'green' : 'red')
			]);
		}));
	},

	renderActions: function() {
		var self = this;
		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
			E('a', {
				'href': 'https://wazuh.gk2.secubox.in',
				'target': '_blank',
				'class': 'kiss-btn kiss-btn-green',
				'style': 'text-decoration: none; justify-content: center;'
			}, '🔗 Open Wazuh Dashboard'),

			E('button', {
				'class': 'kiss-btn kiss-btn-blue',
				'click': L.bind(this.handleRestartAgent, this)
			}, '🔄 Restart Agent'),

			E('a', {
				'href': L.url('admin/services/wazuh/alerts'),
				'class': 'kiss-btn',
				'style': 'text-decoration: none; justify-content: center;'
			}, '📋 View Alerts'),

			E('a', {
				'href': L.url('admin/services/wazuh/fim'),
				'class': 'kiss-btn',
				'style': 'text-decoration: none; justify-content: center;'
			}, '📁 File Integrity')
		]);
	},

	renderLayers: function(overview, crowdsec) {
		var layers = [
			{
				num: 1,
				name: 'Firewall',
				component: 'Vortex + nftables',
				desc: 'Kernel-level IP blocking',
				ok: true
			},
			{
				num: 2,
				name: 'IPS',
				component: 'CrowdSec + Bouncer',
				desc: 'Behavior-based detection',
				ok: crowdsec.crowdsec_running
			},
			{
				num: 3,
				name: 'SIEM/XDR',
				component: 'Wazuh Manager',
				desc: 'Log analysis & correlation',
				ok: overview.manager && overview.manager.running
			},
			{
				num: 4,
				name: 'WAF',
				component: 'mitmproxy + HAProxy',
				desc: 'Web application firewall',
				ok: true
			}
		];

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Layer'),
					E('th', {}, 'Component'),
					E('th', {}, 'Function'),
					E('th', { 'style': 'text-align: right;' }, 'Status')
				])
			]),
			E('tbody', {}, layers.map(function(layer) {
				return E('tr', {}, [
					E('td', {}, 'L' + layer.num + ': ' + layer.name),
					E('td', { 'style': 'font-family: monospace;' }, layer.component),
					E('td', { 'style': 'color: var(--kiss-muted);' }, layer.desc),
					E('td', { 'style': 'text-align: right;' },
						KissTheme.badge(layer.ok ? 'ACTIVE' : 'DOWN', layer.ok ? 'green' : 'red')
					)
				]);
			}))
		]);
	},

	handleRestartAgent: function() {
		return api.restartAgent().then(function(res) {
			if (res.success) {
				L.ui.addNotification(null, E('p', 'Wazuh agent restarted successfully'), 'info');
			} else {
				L.ui.addNotification(null, E('p', 'Failed to restart agent'), 'error');
			}
		});
	},

	pollData: function() {
		var self = this;
		return Promise.all([
			api.getOverview(),
			api.getAlertSummary()
		]).then(function(data) {
			var overview = data[0] || {};
			var alerts = data[1] || {};

			// Update stats
			var statsEl = document.getElementById('wazuh-stats');
			if (statsEl) {
				dom.content(statsEl, [
					KissTheme.stat(alerts.critical || 0, 'Critical', self.colors.red),
					KissTheme.stat(alerts.high || 0, 'High', self.colors.orange),
					KissTheme.stat(alerts.medium || 0, 'Medium', self.colors.yellow),
					KissTheme.stat(alerts.total || 0, 'Total Alerts', self.colors.cyan)
				]);
			}
		});
	}
});
