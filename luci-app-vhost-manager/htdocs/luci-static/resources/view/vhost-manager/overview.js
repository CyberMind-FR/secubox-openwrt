'use strict';
'require view';
'require poll';
'require ui';
'require vhost-manager/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.listVHosts(),
			API.listCerts()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var vhosts = data[1] || [];
		var certs = data[2] || [];

		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('VHost Manager - Overview')),
			E('div', { 'class': 'cbi-map-descr' }, _('Nginx reverse proxy and SSL certificate management'))
		]);

		// Status section
		var statusSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('System Status')),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '33%' }, [
						E('strong', {}, _('Nginx: ')),
						E('span', {}, status.nginx_running ? 
							E('span', { 'style': 'color: green' }, '● ' + _('Running')) : 
							E('span', { 'style': 'color: red' }, '● ' + _('Stopped'))
						),
						E('br'),
						E('small', {}, _('Version: ') + (status.nginx_version || 'unknown'))
					]),
					E('div', { 'class': 'td left', 'width': '33%' }, [
						E('strong', {}, _('ACME/SSL: ')),
						E('span', {}, status.acme_available ? 
							E('span', { 'style': 'color: green' }, '✓ ' + _('Available')) : 
							E('span', { 'style': 'color: orange' }, '✗ ' + _('Not installed'))
						),
						E('br'),
						E('small', {}, status.acme_version || 'N/A')
					]),
					E('div', { 'class': 'td left', 'width': '33%' }, [
						E('strong', {}, _('Virtual Hosts: ')),
						E('span', { 'style': 'font-size: 1.5em; color: #0088cc' }, String(status.vhost_count || 0))
					])
				])
			])
		]);
		v.appendChild(statusSection);

		// Quick stats
		var sslCount = 0;
		var authCount = 0;
		var wsCount = 0;
		
		vhosts.forEach(function(vhost) {
			if (vhost.ssl) sslCount++;
			if (vhost.auth) authCount++;
			if (vhost.websocket) wsCount++;
		});

		var statsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Virtual Hosts Summary')),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, '🔒 SSL Enabled: '),
						E('span', {}, String(sslCount))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, '🔐 Auth Protected: '),
						E('span', {}, String(authCount))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, '🔌 WebSocket: '),
						E('span', {}, String(wsCount))
					]),
					E('div', { 'class': 'td left', 'width': '25%' }, [
						E('strong', {}, '📜 Certificates: '),
						E('span', {}, String(certs.length))
					])
				])
			])
		]);
		v.appendChild(statsSection);

		// Recent vhosts
		if (vhosts.length > 0) {
			var vhostSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Virtual Hosts'))
			]);

			var table = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Domain')),
					E('th', { 'class': 'th' }, _('Backend')),
					E('th', { 'class': 'th' }, _('Features')),
					E('th', { 'class': 'th' }, _('SSL Expires'))
				])
			]);

			vhosts.slice(0, 10).forEach(function(vhost) {
				var features = [];
				if (vhost.ssl) features.push('🔒 SSL');
				if (vhost.auth) features.push('🔐 Auth');
				if (vhost.websocket) features.push('🔌 WS');

				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, vhost.domain),
					E('td', { 'class': 'td' }, vhost.backend),
					E('td', { 'class': 'td' }, features.join(' ')),
					E('td', { 'class': 'td' }, vhost.ssl_expires || 'N/A')
				]));
			});

			vhostSection.appendChild(table);
			v.appendChild(vhostSection);
		}

		return v;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
