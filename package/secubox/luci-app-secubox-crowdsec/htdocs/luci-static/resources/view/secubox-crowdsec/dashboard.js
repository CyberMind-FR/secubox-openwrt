'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require secubox-crowdsec/api as api';

return view.extend({
	api: null,

	load: function() {
		this.api = new api();
		return Promise.all([
			this.api.getStatus(),
			this.api.getStats(),
			this.api.getNftablesStats()
		]);
	},

	renderStatusBadge: function(status, running, stopped) {
		var color = (status === running) ? 'green' : 'red';
		var text = (status === running) ? 'Running' : 'Stopped';
		return E('span', {
			'class': 'badge',
			'style': 'background-color: ' + color + '; color: white; padding: 2px 8px; border-radius: 3px;'
		}, text);
	},

	renderServiceCard: function(name, status) {
		return E('div', { 'class': 'cbi-section', 'style': 'display: inline-block; width: 200px; margin: 10px; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
			E('h4', { 'style': 'margin: 0 0 10px 0;' }, name),
			this.renderStatusBadge(status, 'running', 'stopped')
		]);
	},

	renderStatCard: function(label, value, icon) {
		return E('div', { 'class': 'cbi-section', 'style': 'display: inline-block; width: 150px; margin: 10px; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
			E('div', { 'style': 'font-size: 24px; font-weight: bold; color: #0066cc;' }, String(value || 0)),
			E('div', { 'style': 'color: #666; font-size: 12px;' }, label)
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var stats = data[1] || {};
		var nftStats = data[2] || {};
		var self = this;

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'CrowdSec Dashboard'),
			E('div', { 'class': 'cbi-map-descr' }, 'Security engine status and statistics'),

			// Services Status
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Services Status'),
				E('div', { 'id': 'service-status', 'style': 'text-align: center;' }, [
					this.renderServiceCard('CrowdSec', status.crowdsec),
					this.renderServiceCard('Bouncer', status.bouncer),
					this.renderServiceCard('Syslog-ng', status.syslog)
				])
			]),

			// API Status
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'API Status'),
				E('table', { 'class': 'table cbi-section-table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'CrowdSec Version'),
						E('td', { 'class': 'td' }, status.version || 'Unknown')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Local API (LAPI)'),
						E('td', { 'class': 'td' }, this.renderStatusBadge(status.lapi_status, 'available', 'unavailable'))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Central API (CAPI)'),
						E('td', { 'class': 'td' }, this.renderStatusBadge(status.capi_status, 'connected', 'disconnected'))
					])
				])
			]),

			// Statistics
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Statistics'),
				E('div', { 'id': 'stats-cards', 'style': 'text-align: center;' }, [
					this.renderStatCard('Active Decisions', stats.total_decisions),
					this.renderStatCard('Alerts (24h)', stats.alerts_24h),
					this.renderStatCard('Bouncers', stats.bouncers),
					this.renderStatCard('Parsers', stats.parsers),
					this.renderStatCard('Scenarios', stats.scenarios)
				])
			]),

			// NFTables Status
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Firewall (nftables)'),
				E('table', { 'class': 'table cbi-section-table' }, [
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'IPv4 Table'),
						E('td', { 'class': 'td' }, nftStats.ipv4_table ? 'Active' : 'Inactive')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'IPv6 Table'),
						E('td', { 'class': 'td' }, nftStats.ipv6_table ? 'Active' : 'Inactive')
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Blocked IPv4'),
						E('td', { 'class': 'td' }, String(nftStats.blocked_ipv4 || 0))
					]),
					E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td' }, 'Blocked IPv6'),
						E('td', { 'class': 'td' }, String(nftStats.blocked_ipv6 || 0))
					])
				])
			]),

			// Service Controls
			E('div', { 'class': 'cbi-section' }, [
				E('h3', { 'class': 'cbi-section-title' }, 'Service Controls'),
				E('div', { 'style': 'text-align: center;' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-apply',
						'click': ui.createHandlerFn(this, function() {
							return this.api.controlService('crowdsec', 'restart').then(function() {
								ui.addNotification(null, E('p', 'CrowdSec restarted'), 'info');
								window.location.reload();
							});
						})
					}, 'Restart CrowdSec'),
					' ',
					E('button', {
						'class': 'btn cbi-button cbi-button-apply',
						'click': ui.createHandlerFn(this, function() {
							return this.api.controlService('crowdsec-firewall-bouncer', 'restart').then(function() {
								ui.addNotification(null, E('p', 'Bouncer restarted'), 'info');
								window.location.reload();
							});
						})
					}, 'Restart Bouncer'),
					' ',
					E('button', {
						'class': 'btn cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, function() {
							return this.api.updateHub().then(function(res) {
								if (res.success)
									ui.addNotification(null, E('p', res.message), 'info');
								else
									ui.addNotification(null, E('p', res.error), 'warning');
							});
						})
					}, 'Update Hub')
				])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
