'use strict';
'require view';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			API.getStatus(),
			API.listRules(),
			API.listQuotas()
		]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.qos_active ? 'Active' : 'Inactive', 'QoS Engine', status.qos_active ? c.green : c.red),
			KissTheme.stat(status.interface || 'br-lan', 'Interface', c.cyan),
			KissTheme.stat(status.sqm_enabled ? 'On' : 'Off', 'SQM', status.sqm_enabled ? c.green : c.muted),
			KissTheme.stat(status.rule_count || 0, 'Rules', c.blue)
		];
	},

	renderTrafficStats: function(stats) {
		if (!stats) return null;

		var rows = [
			E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'Download'),
				E('span', { 'style': 'color: var(--kiss-green); font-weight: 600;' }, this.formatBytes(stats.rx_bytes || 0))
			]),
			E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'Upload'),
				E('span', { 'style': 'color: var(--kiss-blue); font-weight: 600;' }, this.formatBytes(stats.tx_bytes || 0))
			]),
			E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'RX Packets'),
				E('span', {}, String(stats.rx_packets || 0))
			]),
			E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0;' }, [
				E('span', { 'style': 'color: var(--kiss-muted);' }, 'TX Packets'),
				E('span', {}, String(stats.tx_packets || 0))
			])
		];

		return KissTheme.card('Traffic Statistics', E('div', {}, rows));
	},

	renderRulesTable: function(rules) {
		var activeRules = rules.filter(function(r) { return r.enabled; });

		if (activeRules.length === 0) {
			return KissTheme.card('Active QoS Rules',
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
					'No active rules configured'));
		}

		var rows = activeRules.slice(0, 5).map(function(rule) {
			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 600;' }, rule.name),
				E('td', {}, KissTheme.badge(rule.type, 'blue')),
				E('td', { 'style': 'font-family: monospace;' }, rule.target),
				E('td', {}, rule.limit_down > 0 ? rule.limit_down + ' kbit/s' : 'Unlimited'),
				E('td', {}, KissTheme.badge('P' + rule.priority, 'purple'))
			]);
		});

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Active QoS Rules'),
				KissTheme.badge(activeRules.length + ' rules', 'blue')
			]),
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, 'Name'),
						E('th', {}, 'Type'),
						E('th', {}, 'Target'),
						E('th', {}, 'Download Limit'),
						E('th', {}, 'Priority')
					])
				]),
				E('tbody', {}, rows)
			])
		);
	},

	renderQuotasTable: function(quotas) {
		var self = this;

		if (quotas.length === 0) {
			return KissTheme.card('Client Quotas',
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
					'No quotas configured'));
		}

		var rows = quotas.slice(0, 5).map(function(quota) {
			var progressColor = quota.percent > 90 ? 'var(--kiss-red)' : (quota.percent > 75 ? 'var(--kiss-orange)' : 'var(--kiss-green)');

			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 600;' }, quota.name || quota.mac),
				E('td', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, quota.mac),
				E('td', {}, quota.used_mb + ' MB'),
				E('td', {}, quota.limit_mb + ' MB'),
				E('td', {}, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
						E('div', { 'style': 'background: var(--kiss-bg); width: 80px; height: 8px; border-radius: 4px; overflow: hidden;' }, [
							E('div', {
								'style': 'background: ' + progressColor + '; width: ' + Math.min(quota.percent, 100) + '%; height: 100%;'
							})
						]),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, quota.percent + '%')
					])
				])
			]);
		});

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'Client Quotas'),
				KissTheme.badge(quotas.length + ' quotas', 'purple')
			]),
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, 'Client'),
						E('th', {}, 'MAC'),
						E('th', {}, 'Usage'),
						E('th', {}, 'Limit'),
						E('th', {}, 'Progress')
					])
				]),
				E('tbody', {}, rows)
			])
		);
	},

	render: function(data) {
		var status = data[0] || {};
		var rules = data[1] || [];
		var quotas = data[2] || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Bandwidth Manager'),
					status.qos_active ? KissTheme.badge('Active', 'green') : KissTheme.badge('Inactive', 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'QoS rules, client quotas, and traffic control')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// Traffic stats card
			status.stats ? this.renderTrafficStats(status.stats) : '',

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				this.renderRulesTable(rules),
				this.renderQuotasTable(quotas)
			])
		];

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/overview');
	},

	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
});
