'use strict';
'require view';
'require rpc';
'require ui';
'require uci';
'require form';
'require secubox/kiss-theme';

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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callSecurityStatus(),
			uci.load('icecast')
		]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.ssl_enabled ? 'On' : 'Off', 'SSL/TLS', status.ssl_enabled ? c.green : c.muted),
			KissTheme.stat(status.crowdsec_installed ? 'Active' : 'Off', 'CrowdSec', status.crowdsec_installed ? c.blue : c.muted),
			KissTheme.stat(status.crowdsec_decisions || '0', 'Bans', c.red)
		];
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Security & Hardening'),
					KissTheme.badge('ICECAST', 'cyan')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Configure SSL/TLS, rate limiting, and CrowdSec integration')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// SSL/TLS Section
			KissTheme.card('SSL/TLS Encryption',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
						'Enable HTTPS for secure streaming. Listeners can connect via https://hostname:8443/live'),

					E('table', { 'class': 'kiss-table', 'style': 'margin: 8px 0;' }, [
						E('tbody', {}, [
							E('tr', {}, [
								E('td', { 'style': 'width: 180px; font-weight: 600;' }, 'SSL Status'),
								E('td', {}, KissTheme.badge(status.ssl_enabled ? 'Enabled' : 'Disabled', status.ssl_enabled ? 'green' : 'red'))
							]),
							E('tr', {}, [
								E('td', { 'style': 'font-weight: 600;' }, 'Certificate'),
								E('td', { 'style': status.ssl_cert_exists ? 'color: var(--kiss-green);' : 'color: var(--kiss-orange);' },
									status.ssl_cert_exists ? 'Found: ' + status.ssl_cert_path : 'Not found')
							]),
							status.ssl_cert_expiry ? E('tr', {}, [
								E('td', { 'style': 'font-weight: 600;' }, 'Expires'),
								E('td', {}, status.ssl_cert_expiry)
							]) : ''
						])
					]),

					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
								E('input', {
									'type': 'checkbox',
									'id': 'ssl-enabled',
									'checked': uci.get('icecast', 'ssl', 'enabled') === '1'
								}),
								E('span', {}, 'Enable HTTPS streaming on port 8443')
							])
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'SSL Port'),
							E('input', {
								'type': 'number',
								'id': 'ssl-port',
								'value': uci.get('icecast', 'ssl', 'port') || '8443',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						])
					]),
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Certificate Path'),
							E('input', {
								'type': 'text',
								'id': 'ssl-cert',
								'value': uci.get('icecast', 'ssl', 'certificate') || '/etc/ssl/certs/icecast.pem',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Private Key Path'),
							E('input', {
								'type': 'text',
								'id': 'ssl-key',
								'value': uci.get('icecast', 'ssl', 'key') || '/etc/ssl/private/icecast.key',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						])
					]),
					E('div', { 'style': 'display: flex; gap: 12px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': ui.createHandlerFn(this, 'handleSaveSSL')
						}, 'Save SSL Settings'),
						E('button', {
							'class': 'kiss-btn',
							'click': ui.createHandlerFn(this, 'handleGenerateCert')
						}, 'Generate Self-Signed Certificate')
					])
				])
			),

			// Rate Limiting Section
			KissTheme.card('Rate Limiting',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
						'Configure connection limits to prevent abuse'),

					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Client Timeout (sec)'),
							E('input', {
								'type': 'number',
								'id': 'client-timeout',
								'value': uci.get('icecast', 'ratelimit', 'client_timeout') || '30',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Burst Size (bytes)'),
							E('input', {
								'type': 'number',
								'id': 'burst-size',
								'value': uci.get('icecast', 'ratelimit', 'burst_size') || '65535',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Queue Size (bytes)'),
							E('input', {
								'type': 'number',
								'id': 'queue-size',
								'value': uci.get('icecast', 'ratelimit', 'queue_size') || '524288',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						])
					]),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'align-self: flex-start;',
						'click': ui.createHandlerFn(this, 'handleSaveRateLimit')
					}, 'Save Rate Limits')
				])
			),

			// CrowdSec Section
			KissTheme.card('CrowdSec Integration',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
						'Automatic abuse detection and IP blocking with CrowdSec'),

					E('table', { 'class': 'kiss-table', 'style': 'margin: 8px 0;' }, [
						E('tbody', {}, [
							E('tr', {}, [
								E('td', { 'style': 'width: 180px; font-weight: 600;' }, 'CrowdSec'),
								E('td', {}, KissTheme.badge(status.crowdsec_installed ? 'Installed' : 'Not Installed', status.crowdsec_installed ? 'green' : 'red'))
							]),
							E('tr', {}, [
								E('td', { 'style': 'font-weight: 600;' }, 'Icecast Parsers'),
								E('td', {}, KissTheme.badge(status.crowdsec_parsers ? 'Installed' : 'Not Installed', status.crowdsec_parsers ? 'green' : 'red'))
							]),
							E('tr', {}, [
								E('td', { 'style': 'font-weight: 600;' }, 'Icecast Scenarios'),
								E('td', {}, KissTheme.badge(status.crowdsec_scenarios ? 'Installed' : 'Not Installed', status.crowdsec_scenarios ? 'green' : 'red'))
							]),
							status.crowdsec_decisions ? E('tr', {}, [
								E('td', { 'style': 'font-weight: 600;' }, 'Active Bans'),
								E('td', {}, String(status.crowdsec_decisions))
							]) : ''
						])
					]),

					E('div', {}, [
						E('p', { 'style': 'margin: 0 0 8px 0;' }, 'CrowdSec protection includes:'),
						E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
							E('li', {}, 'Connection flood detection (20+ connections in 30s)'),
							E('li', {}, 'Bandwidth abuse / stream ripping detection'),
							E('li', {}, 'Automatic IP blocking via firewall bouncer')
						])
					]),

					status.crowdsec_installed ? E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': ui.createHandlerFn(this, 'handleInstallCrowdsec')
					}, status.crowdsec_parsers ? 'Reinstall CrowdSec Rules' : 'Install CrowdSec Rules')
					: E('p', { 'style': 'color: var(--kiss-orange); margin: 0;' },
						'Install CrowdSec package first: opkg install crowdsec crowdsec-firewall-bouncer')
				])
			),

			// Security Tips
			KissTheme.card('Security Tips',
				E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
					E('li', {}, 'Change default passwords immediately (admin, source, relay)'),
					E('li', {}, 'Use SSL/TLS for all public-facing streams'),
					E('li', {}, 'Enable CrowdSec to automatically block abusive IPs'),
					E('li', {}, 'Set reasonable listener limits to prevent resource exhaustion'),
					E('li', {}, 'Monitor logs regularly: /var/log/icecast/'),
					E('li', {}, 'Consider using firewall rules to restrict source connections to localhost')
				])
			)
		];

		return KissTheme.wrap(content, 'admin/services/webradio/security');
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
			E('p', { 'style': 'color: var(--kiss-orange);' },
				'Note: Self-signed certificates will show browser warnings. For production, use Let\'s Encrypt or a proper CA.'),
			E('div', { 'style': 'display: flex; gap: 12px; margin-top: 16px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
					'class': 'kiss-btn',
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
	}
});
