'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';

return view.extend({
	load: function() {
		return api.getSettings();
	},

	render: function(settings) {
		var self = this;
		settings = settings || {};
		var main = settings.main || {};
		var defaults = settings.defaults || {};
		var acme = settings.acme || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'Settings'),
			E('p', {}, 'Configure HAProxy service settings.'),

			// Main settings
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Service Settings'),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enable Service'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'main-enabled',
							'checked': main.enabled
						}),
						E('label', { 'for': 'main-enabled' }, ' Start HAProxy on boot')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'HTTP Port'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'main-http-port',
							'class': 'cbi-input-text',
							'value': main.http_port || 80,
							'min': '1',
							'max': '65535'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'HTTPS Port'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'main-https-port',
							'class': 'cbi-input-text',
							'value': main.https_port || 443,
							'min': '1',
							'max': '65535'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Max Connections'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'main-maxconn',
							'class': 'cbi-input-text',
							'value': main.maxconn || 4096,
							'min': '100',
							'max': '100000'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Memory Limit'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'main-memory',
							'class': 'cbi-input-text',
							'value': main.memory_limit || '256M',
							'placeholder': '256M'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Log Level'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', {
							'id': 'main-log-level',
							'class': 'cbi-input-select'
						}, [
							E('option', { 'value': 'emerg', 'selected': main.log_level === 'emerg' }, 'Emergency'),
							E('option', { 'value': 'alert', 'selected': main.log_level === 'alert' }, 'Alert'),
							E('option', { 'value': 'crit', 'selected': main.log_level === 'crit' }, 'Critical'),
							E('option', { 'value': 'err', 'selected': main.log_level === 'err' }, 'Error'),
							E('option', { 'value': 'warning', 'selected': main.log_level === 'warning' || !main.log_level }, 'Warning'),
							E('option', { 'value': 'notice', 'selected': main.log_level === 'notice' }, 'Notice'),
							E('option', { 'value': 'info', 'selected': main.log_level === 'info' }, 'Info'),
							E('option', { 'value': 'debug', 'selected': main.log_level === 'debug' }, 'Debug')
						])
					])
				])
			]),

			// Stats settings
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Statistics Dashboard'),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enable Stats'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'main-stats-enabled',
							'checked': main.stats_enabled
						}),
						E('label', { 'for': 'main-stats-enabled' }, ' Enable statistics dashboard')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Stats Port'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'main-stats-port',
							'class': 'cbi-input-text',
							'value': main.stats_port || 8404,
							'min': '1',
							'max': '65535'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Stats Username'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'main-stats-user',
							'class': 'cbi-input-text',
							'value': main.stats_user || 'admin'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Stats Password'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'password',
							'id': 'main-stats-password',
							'class': 'cbi-input-text',
							'value': main.stats_password || ''
						})
					])
				])
			]),

			// Timeouts
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'Timeouts'),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Connect Timeout'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'defaults-timeout-connect',
							'class': 'cbi-input-text',
							'value': defaults.timeout_connect || '5s',
							'placeholder': '5s'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Client Timeout'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'defaults-timeout-client',
							'class': 'cbi-input-text',
							'value': defaults.timeout_client || '30s',
							'placeholder': '30s'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Server Timeout'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'defaults-timeout-server',
							'class': 'cbi-input-text',
							'value': defaults.timeout_server || '30s',
							'placeholder': '30s'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'HTTP Request Timeout'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'defaults-timeout-http-request',
							'class': 'cbi-input-text',
							'value': defaults.timeout_http_request || '10s',
							'placeholder': '10s'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'HTTP Keep-Alive'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'defaults-timeout-http-keep-alive',
							'class': 'cbi-input-text',
							'value': defaults.timeout_http_keep_alive || '10s',
							'placeholder': '10s'
						})
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Retries'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'defaults-retries',
							'class': 'cbi-input-text',
							'value': defaults.retries || 3,
							'min': '0',
							'max': '10'
						})
					])
				])
			]),

			// ACME settings
			E('div', { 'class': 'haproxy-form-section' }, [
				E('h3', {}, 'ACME / Let\'s Encrypt'),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enable ACME'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'acme-enabled',
							'checked': acme.enabled
						}),
						E('label', { 'for': 'acme-enabled' }, ' Enable automatic certificate management')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Email'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'email',
							'id': 'acme-email',
							'class': 'cbi-input-text',
							'value': acme.email || '',
							'placeholder': 'admin@example.com'
						}),
						E('p', { 'class': 'cbi-value-description' },
							'Required for Let\'s Encrypt certificate registration')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Staging Mode'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'acme-staging',
							'checked': acme.staging
						}),
						E('label', { 'for': 'acme-staging' }, ' Use Let\'s Encrypt staging server (for testing)')
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Key Type'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', {
							'id': 'acme-key-type',
							'class': 'cbi-input-select'
						}, [
							E('option', { 'value': 'ec-256', 'selected': acme.key_type === 'ec-256' || !acme.key_type }, 'EC-256 (recommended)'),
							E('option', { 'value': 'ec-384', 'selected': acme.key_type === 'ec-384' }, 'EC-384'),
							E('option', { 'value': 'rsa-2048', 'selected': acme.key_type === 'rsa-2048' }, 'RSA-2048'),
							E('option', { 'value': 'rsa-4096', 'selected': acme.key_type === 'rsa-4096' }, 'RSA-4096')
						])
					])
				]),

				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Renew Before (days)'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'number',
							'id': 'acme-renew-days',
							'class': 'cbi-input-text',
							'value': acme.renew_days || 30,
							'min': '1',
							'max': '60'
						}),
						E('p', { 'class': 'cbi-value-description' },
							'Renew certificate this many days before expiry')
					])
				])
			]),

			// Save button
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': function() { self.handleSave(); }
				}, 'Save & Apply')
			])
		]);

		// Add CSS
		var style = E('style', {}, `
			@import url('/luci-static/resources/haproxy/dashboard.css');
		`);
		view.insertBefore(style, view.firstChild);

		return view;
	},

	handleSave: function() {
		var mainSettings = {
			enabled: document.getElementById('main-enabled').checked ? 1 : 0,
			http_port: parseInt(document.getElementById('main-http-port').value) || 80,
			https_port: parseInt(document.getElementById('main-https-port').value) || 443,
			maxconn: parseInt(document.getElementById('main-maxconn').value) || 4096,
			memory_limit: document.getElementById('main-memory').value || '256M',
			log_level: document.getElementById('main-log-level').value || 'warning',
			stats_enabled: document.getElementById('main-stats-enabled').checked ? 1 : 0,
			stats_port: parseInt(document.getElementById('main-stats-port').value) || 8404,
			stats_user: document.getElementById('main-stats-user').value || 'admin',
			stats_password: document.getElementById('main-stats-password').value || ''
		};

		var defaultsSettings = {
			timeout_connect: document.getElementById('defaults-timeout-connect').value || '5s',
			timeout_client: document.getElementById('defaults-timeout-client').value || '30s',
			timeout_server: document.getElementById('defaults-timeout-server').value || '30s',
			timeout_http_request: document.getElementById('defaults-timeout-http-request').value || '10s',
			timeout_http_keep_alive: document.getElementById('defaults-timeout-http-keep-alive').value || '10s',
			retries: parseInt(document.getElementById('defaults-retries').value) || 3
		};

		var acmeSettings = {
			enabled: document.getElementById('acme-enabled').checked ? 1 : 0,
			email: document.getElementById('acme-email').value || '',
			staging: document.getElementById('acme-staging').checked ? 1 : 0,
			key_type: document.getElementById('acme-key-type').value || 'ec-256',
			renew_days: parseInt(document.getElementById('acme-renew-days').value) || 30
		};

		return api.saveSettings(mainSettings, defaultsSettings, acmeSettings).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, 'Settings saved successfully'));
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to save: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleReset: null
});
