'use strict';
'require view';
'require bandwidth-manager/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.listRules(),
			API.listQuotas()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var rules = data[1] || [];
		var quotas = data[2] || [];

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Bandwidth Manager - Overview')),
			E('div', { 'class': 'cbi-map-descr' }, _('QoS rules, client quotas, and traffic control'))
		]);

		// System status
		var statusSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('System Status')),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('QoS Engine: ')),
						status.qos_active ?
							E('span', { 'style': 'color: green' }, '● ' + _('Active')) :
							E('span', { 'style': 'color: red' }, '● ' + _('Inactive'))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('Interface: ')),
						E('span', {}, status.interface || 'br-lan')
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('SQM: ')),
						status.sqm_enabled ?
							E('span', { 'style': 'color: green' }, '✓ ' + _('Enabled')) :
							E('span', {}, '✗ ' + _('Disabled'))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, _('Rules: ')),
						E('span', { 'style': 'font-size: 1.3em; color: #0088cc' }, String(status.rule_count || 0))
					])
				])
			])
		]);
		v.appendChild(statusSection);

		// Traffic statistics
		if (status.stats) {
			var statsSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Traffic Statistics')),
				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, '⬇ ' + _('Download: ')),
							E('span', {}, this.formatBytes(status.stats.rx_bytes || 0))
						]),
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, '⬆ ' + _('Upload: ')),
							E('span', {}, this.formatBytes(status.stats.tx_bytes || 0))
						])
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, _('RX Packets: ')),
							E('span', {}, String(status.stats.rx_packets || 0))
						]),
						E('div', { 'class': 'td left', 'width': '50%' }, [
							E('strong', {}, _('TX Packets: ')),
							E('span', {}, String(status.stats.tx_packets || 0))
						])
					])
				])
			]);
			v.appendChild(statsSection);
		}

		// Active rules summary
		if (rules.length > 0) {
			var rulesSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Active QoS Rules'))
			]);

			var rulesTable = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Name')),
					E('th', { 'class': 'th' }, _('Type')),
					E('th', { 'class': 'th' }, _('Target')),
					E('th', { 'class': 'th' }, _('Download Limit')),
					E('th', { 'class': 'th' }, _('Priority'))
				])
			]);

			rules.slice(0, 5).forEach(function(rule) {
				if (!rule.enabled)
					return;

				rulesTable.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, rule.name),
					E('td', { 'class': 'td' }, rule.type),
					E('td', { 'class': 'td' }, rule.target),
					E('td', { 'class': 'td' }, rule.limit_down > 0 ? rule.limit_down + ' kbit/s' : _('Unlimited')),
					E('td', { 'class': 'td' }, String(rule.priority))
				]));
			});

			rulesSection.appendChild(rulesTable);
			v.appendChild(rulesSection);
		}

		// Client quotas summary
		if (quotas.length > 0) {
			var quotasSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Client Quotas'))
			]);

			var quotasTable = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Client')),
					E('th', { 'class': 'th' }, _('MAC')),
					E('th', { 'class': 'th' }, _('Usage')),
					E('th', { 'class': 'th' }, _('Limit')),
					E('th', { 'class': 'th' }, _('Progress'))
				])
			]);

			quotas.slice(0, 5).forEach(function(quota) {
				var progressColor = quota.percent > 90 ? 'red' : (quota.percent > 75 ? 'orange' : 'green');

				quotasTable.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, quota.name || quota.mac),
					E('td', { 'class': 'td' }, E('code', {}, quota.mac)),
					E('td', { 'class': 'td' }, quota.used_mb + ' MB'),
					E('td', { 'class': 'td' }, quota.limit_mb + ' MB'),
					E('td', { 'class': 'td' }, [
						E('div', { 'style': 'background: #eee; width: 100px; height: 10px; border-radius: 5px;' }, [
							E('div', {
								'style': 'background: ' + progressColor + '; width: ' + Math.min(quota.percent, 100) + '%; height: 100%; border-radius: 5px;'
							})
						]),
						E('small', {}, quota.percent + '%')
					])
				]));
			});

			quotasSection.appendChild(quotasTable);
			v.appendChild(quotasSection);
		}

		return v;
	},

	formatBytes: function(bytes) {
		if (bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
