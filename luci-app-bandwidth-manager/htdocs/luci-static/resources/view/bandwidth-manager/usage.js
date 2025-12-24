'use strict';
'require view';
'require poll';
'require bandwidth-manager/api as API';

return L.view.extend({
	load: function() {
		return API.getUsageRealtime();
	},

	render: function(clients) {
		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Real-time Usage')),
			E('div', { 'class': 'cbi-map-descr' }, _('Live bandwidth usage per client (updates every 5 seconds)'))
		]);

		var container = E('div', { 'id': 'usage-container', 'class': 'cbi-section' });
		v.appendChild(container);

		// Initial render
		this.renderUsageTable(container, clients);

		// Auto-refresh every 5 seconds
		poll.add(L.bind(function() {
			return API.getUsageRealtime().then(L.bind(function(data) {
				this.renderUsageTable(container, data);
			}, this));
		}, this), 5);

		return v;
	},

	renderUsageTable: function(container, clients) {
		L.dom.content(container, [
			E('h3', {}, _('Active Clients')),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Client')),
					E('th', { 'class': 'th' }, _('IP')),
					E('th', { 'class': 'th' }, _('MAC')),
					E('th', { 'class': 'th' }, _('Download')),
					E('th', { 'class': 'th' }, _('Upload')),
					E('th', { 'class': 'th' }, _('Total')),
					E('th', { 'class': 'th' }, _('Quota'))
				])
			].concat(clients.length > 0 ? clients.map(L.bind(function(client) {
				var total = (client.rx_bytes || 0) + (client.tx_bytes || 0);
				
				var quotaCell = _('None');
				if (client.has_quota) {
					var percent = client.limit_mb > 0 ? Math.floor((client.used_mb * 100) / client.limit_mb) : 0;
					var color = percent > 90 ? 'red' : (percent > 75 ? 'orange' : 'green');
					quotaCell = [
						E('div', {}, client.used_mb + ' / ' + client.limit_mb + ' MB'),
						E('div', { 'style': 'background: #eee; width: 80px; height: 8px; border-radius: 4px;' }, [
							E('div', {
								'style': 'background: ' + color + '; width: ' + Math.min(percent, 100) + '%; height: 100%; border-radius: 4px;'
							})
						])
					];
				}

				return E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, client.hostname),
					E('td', { 'class': 'td' }, client.ip),
					E('td', { 'class': 'td' }, E('code', {}, client.mac)),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'color: #28a745' }, '⬇ ' + this.formatBytes(client.rx_bytes))
					]),
					E('td', { 'class': 'td' }, [
						E('span', { 'style': 'color: #dc3545' }, '⬆ ' + this.formatBytes(client.tx_bytes))
					]),
					E('td', { 'class': 'td' }, E('strong', {}, this.formatBytes(total))),
					E('td', { 'class': 'td' }, quotaCell)
				]);
			}, this)) : [
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td center', 'colspan': 7 }, 
						E('em', {}, _('No active clients')))
				])
			]))
		]);
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
