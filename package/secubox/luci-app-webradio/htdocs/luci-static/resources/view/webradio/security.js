'use strict';
'require view';
'require rpc';
'require ui';
'require uci';
'require form';

var callSecurityStatus = rpc.declare({
	object: 'luci.webradio',
	method: 'security_status',
	expect: {}
});

var callInstallCrowdsec = rpc.declare({
	object: 'luci.webradio',
	method: 'install_crowdsec',
	expect: {}
});

var callGenerateCert = rpc.declare({
	object: 'luci.webradio',
	method: 'generate_ssl_cert',
	params: ['hostname'],
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callSecurityStatus(),
			uci.load('icecast')
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};

		var content = [
			E('h2', {}, 'Security & Hardening'),

			// SSL/TLS Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'SSL/TLS Encryption'),
				E('p', { 'style': 'color: #666;' },
					'Enable HTTPS for secure streaming. Listeners can connect via https://hostname:8443/live'),

				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td', 'style': 'width: 180px;' }, 'SSL Status'),
						E('div', { 'class': 'td' },
							status.ssl_enabled
								? this.statusBadge(true, 'Enabled')
								: this.statusBadge(false, 'Disabled'))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Certificate'),
						E('div', { 'class': 'td' },
							status.ssl_cert_exists
								? E('span', { 'style': 'color: green;' }, 'Found: ' + status.ssl_cert_path)
								: E('span', { 'style': 'color: orange;' }, 'Not found'))
					]),
					status.ssl_cert_expiry ? E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Expires'),
						E('div', { 'class': 'td' }, status.ssl_cert_expiry)
					]) : ''
				]),

				E('div', { 'class': 'cbi-value', 'style': 'margin-top: 15px;' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enable SSL'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'ssl-enabled',
							'checked': uci.get('icecast', 'ssl', 'enabled') === '1'
						}),
						E('span', { 'style': 'margin-left: 10px;' },
							'Enable HTTPS streaming on port 8443')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'SSL Port'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'ssl-port',
							'class': 'cbi-input-text',
							'value': uci.get('icecast', 'ssl', 'port') || '8443',
							'style': 'width: 100px;'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Certificate Path'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'ssl-cert',
							'class': 'cbi-input-text',
							'value': uci.get('icecast', 'ssl', 'certificate') || '/etc/ssl/certs/icecast.pem',
							'style': 'width: 300px;'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Private Key Path'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'ssl-key',
							'class': 'cbi-input-text',
							'value': uci.get('icecast', 'ssl', 'key') || '/etc/ssl/private/icecast.key',
							'style': 'width: 300px;'
						})
					])
				]),

				E('div', { 'style': 'display: flex; gap: 10px; margin-top: 15px;' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, 'handleSaveSSL')
					}, 'Save SSL Settings'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, 'handleGenerateCert')
					}, 'Generate Self-Signed Certificate')
				])
			]),

			// Rate Limiting Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Rate Limiting'),
				E('p', { 'style': 'color: #666;' },
					'Configure connection limits to prevent abuse'),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Client Timeout'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'client-timeout',
							'class': 'cbi-input-text',
							'value': uci.get('icecast', 'ratelimit', 'client_timeout') || '30',
							'style': 'width: 100px;'
						}),
						E('span', { 'style': 'margin-left: 10px; color: #666;' }, 'seconds')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Burst Size'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'burst-size',
							'class': 'cbi-input-text',
							'value': uci.get('icecast', 'ratelimit', 'burst_size') || '65535',
							'style': 'width: 120px;'
						}),
						E('span', { 'style': 'margin-left: 10px; color: #666;' }, 'bytes')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Queue Size'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'queue-size',
							'class': 'cbi-input-text',
							'value': uci.get('icecast', 'ratelimit', 'queue_size') || '524288',
							'style': 'width: 120px;'
						}),
						E('span', { 'style': 'margin-left: 10px; color: #666;' }, 'bytes')
					])
				]),

				E('button', {
					'class': 'btn cbi-button-action',
					'style': 'margin-top: 10px;',
					'click': ui.createHandlerFn(this, 'handleSaveRateLimit')
				}, 'Save Rate Limits')
			]),

			// CrowdSec Section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'CrowdSec Integration'),
				E('p', { 'style': 'color: #666;' },
					'Automatic abuse detection and IP blocking with CrowdSec'),

				E('div', { 'class': 'table' }, [
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td', 'style': 'width: 180px;' }, 'CrowdSec'),
						E('div', { 'class': 'td' },
							status.crowdsec_installed
								? this.statusBadge(true, 'Installed')
								: this.statusBadge(false, 'Not Installed'))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Icecast Parsers'),
						E('div', { 'class': 'td' },
							status.crowdsec_parsers
								? this.statusBadge(true, 'Installed')
								: this.statusBadge(false, 'Not Installed'))
					]),
					E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Icecast Scenarios'),
						E('div', { 'class': 'td' },
							status.crowdsec_scenarios
								? this.statusBadge(true, 'Installed')
								: this.statusBadge(false, 'Not Installed'))
					]),
					status.crowdsec_decisions ? E('div', { 'class': 'tr' }, [
						E('div', { 'class': 'td' }, 'Active Bans'),
						E('div', { 'class': 'td' }, String(status.crowdsec_decisions))
					]) : ''
				]),

				E('div', { 'style': 'margin-top: 15px;' }, [
					E('p', {}, 'CrowdSec protection includes:'),
					E('ul', { 'style': 'color: #666;' }, [
						E('li', {}, 'Connection flood detection (20+ connections in 30s)'),
						E('li', {}, 'Bandwidth abuse / stream ripping detection'),
						E('li', {}, 'Automatic IP blocking via firewall bouncer')
					])
				]),

				status.crowdsec_installed ? E('button', {
					'class': 'btn cbi-button-positive',
					'style': 'margin-top: 10px;',
					'click': ui.createHandlerFn(this, 'handleInstallCrowdsec')
				}, status.crowdsec_parsers ? 'Reinstall CrowdSec Rules' : 'Install CrowdSec Rules')
				: E('p', { 'style': 'color: orange; margin-top: 10px;' },
					'Install CrowdSec package first: opkg install crowdsec crowdsec-firewall-bouncer')
			]),

			// Security Tips
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Security Tips'),
				E('ul', { 'style': 'color: #666;' }, [
					E('li', {}, 'Change default passwords immediately (admin, source, relay)'),
					E('li', {}, 'Use SSL/TLS for all public-facing streams'),
					E('li', {}, 'Enable CrowdSec to automatically block abusive IPs'),
					E('li', {}, 'Set reasonable listener limits to prevent resource exhaustion'),
					E('li', {}, 'Monitor logs regularly: /var/log/icecast/'),
					E('li', {}, 'Consider using firewall rules to restrict source connections to localhost')
				])
			])
		];

		return E('div', { 'class': 'cbi-map' }, content);
	},

	statusBadge: function(ok, text) {
		var style = ok
			? 'color: #fff; background: #5cb85c; padding: 2px 8px; border-radius: 3px;'
			: 'color: #fff; background: #d9534f; padding: 2px 8px; border-radius: 3px;';
		return E('span', { 'style': style }, text);
	},

	handleSaveSSL: function() {
		var enabled = document.getElementById('ssl-enabled').checked;
		var port = document.getElementById('ssl-port').value;
		var cert = document.getElementById('ssl-cert').value;
		var key = document.getElementById('ssl-key').value;

		uci.set('icecast', 'ssl', 'ssl');
		uci.set('icecast', 'ssl', 'enabled', enabled ? '1' : '0');
		uci.set('icecast', 'ssl', 'port', port);
		uci.set('icecast', 'ssl', 'certificate', cert);
		uci.set('icecast', 'ssl', 'key', key);

		return uci.save().then(function() {
			return uci.apply();
		}).then(function() {
			ui.addNotification(null, E('p', 'SSL settings saved. Restart Icecast to apply.'));
		});
	},

	handleSaveRateLimit: function() {
		var clientTimeout = document.getElementById('client-timeout').value;
		var burstSize = document.getElementById('burst-size').value;
		var queueSize = document.getElementById('queue-size').value;

		uci.set('icecast', 'ratelimit', 'ratelimit');
		uci.set('icecast', 'ratelimit', 'client_timeout', clientTimeout);
		uci.set('icecast', 'ratelimit', 'burst_size', burstSize);
		uci.set('icecast', 'ratelimit', 'queue_size', queueSize);

		return uci.save().then(function() {
			return uci.apply();
		}).then(function() {
			ui.addNotification(null, E('p', 'Rate limit settings saved. Restart Icecast to apply.'));
		});
	},

	handleGenerateCert: function() {
		var hostname = uci.get('icecast', 'server', 'hostname') || 'localhost';

		ui.showModal('Generate Certificate', [
			E('p', {}, 'Generate a self-signed SSL certificate for: ' + hostname),
			E('p', { 'style': 'color: orange;' },
				'Note: Self-signed certificates will show browser warnings. For production, use Let\'s Encrypt or a proper CA.'),
			E('div', { 'style': 'display: flex; gap: 10px; margin-top: 15px;' }, [
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': L.bind(function() {
						ui.hideModal();
						ui.showModal('Generating', [
							E('p', { 'class': 'spinning' }, 'Generating certificate...')
						]);
						callGenerateCert(hostname).then(function(res) {
							ui.hideModal();
							if (res.result === 'ok') {
								ui.addNotification(null, E('p', 'Certificate generated successfully'));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
							}
						});
					}, this)
				}, 'Generate'),
				E('button', {
					'class': 'btn',
					'click': function() { ui.hideModal(); }
				}, 'Cancel')
			])
		]);
	},

	handleInstallCrowdsec: function() {
		ui.showModal('Installing CrowdSec Rules', [
			E('p', { 'class': 'spinning' }, 'Installing Icecast parsers and scenarios...')
		]);

		return callInstallCrowdsec().then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'CrowdSec rules installed successfully'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
