'use strict';
'require view';
'require dom';
'require ui';
'require haproxy.api as api';
'require secubox/kiss-theme';

/**
 * HAProxy Settings - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	load: function() {
		return api.getSettings();
	},

	render: function(settings) {
		var self = this;
		var K = KissTheme;
		settings = settings || {};
		var main = settings.main || {};
		var defaults = settings.defaults || {};
		var acme = settings.acme || {};

		var inputStyle = 'width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--kiss-line, #1e293b); background: var(--kiss-bg2, #111827); color: var(--kiss-text, #e2e8f0); font-size: 14px;';
		var labelStyle = 'font-size: 12px; color: var(--kiss-muted); text-transform: uppercase; display: block; margin-bottom: 6px;';

		var content = K.E('div', {}, [
			// Page Header
			K.E('div', { 'style': 'margin-bottom: 20px;' }, [
				K.E('h2', { 'style': 'margin: 0; font-size: 24px; display: flex; align-items: center; gap: 10px;' }, [
					K.E('span', {}, '⚙️'),
					'Settings'
				]),
				K.E('p', { 'style': 'margin: 4px 0 0; color: var(--kiss-muted, #94a3b8); font-size: 14px;' },
					'Configure HAProxy service settings')
			]),

			// Service Settings
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['🔧 ', 'Service Settings']),
				K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px;' }, [
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
							K.E('input', { 'type': 'checkbox', 'id': 'main-enabled', 'checked': main.enabled }),
							'✅ Start HAProxy on boot'
						])
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'HTTP Port'),
						K.E('input', { 'type': 'number', 'id': 'main-http-port', 'value': main.http_port || 80, 'min': '1', 'max': '65535', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'HTTPS Port'),
						K.E('input', { 'type': 'number', 'id': 'main-https-port', 'value': main.https_port || 443, 'min': '1', 'max': '65535', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Max Connections'),
						K.E('input', { 'type': 'number', 'id': 'main-maxconn', 'value': main.maxconn || 4096, 'min': '100', 'max': '100000', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Memory Limit'),
						K.E('input', { 'type': 'text', 'id': 'main-memory', 'value': main.memory_limit || '256M', 'placeholder': '256M', 'style': inputStyle })
					]),
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': labelStyle }, 'Log Level'),
						K.E('select', { 'id': 'main-log-level', 'style': inputStyle }, [
							K.E('option', { 'value': 'emerg', 'selected': main.log_level === 'emerg' }, 'Emergency'),
							K.E('option', { 'value': 'alert', 'selected': main.log_level === 'alert' }, 'Alert'),
							K.E('option', { 'value': 'crit', 'selected': main.log_level === 'crit' }, 'Critical'),
							K.E('option', { 'value': 'err', 'selected': main.log_level === 'err' }, 'Error'),
							K.E('option', { 'value': 'warning', 'selected': main.log_level === 'warning' || !main.log_level }, 'Warning'),
							K.E('option', { 'value': 'notice', 'selected': main.log_level === 'notice' }, 'Notice'),
							K.E('option', { 'value': 'info', 'selected': main.log_level === 'info' }, 'Info'),
							K.E('option', { 'value': 'debug', 'selected': main.log_level === 'debug' }, 'Debug')
						])
					])
				])
			]),

			// Statistics Dashboard
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['📊 ', 'Statistics Dashboard']),
				K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px;' }, [
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
							K.E('input', { 'type': 'checkbox', 'id': 'main-stats-enabled', 'checked': main.stats_enabled }),
							'📊 Enable statistics dashboard'
						])
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Stats Port'),
						K.E('input', { 'type': 'number', 'id': 'main-stats-port', 'value': main.stats_port || 8404, 'min': '1', 'max': '65535', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Stats Username'),
						K.E('input', { 'type': 'text', 'id': 'main-stats-user', 'value': main.stats_user || 'admin', 'style': inputStyle })
					]),
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': labelStyle }, 'Stats Password'),
						K.E('input', { 'type': 'password', 'id': 'main-stats-password', 'value': main.stats_password || '', 'style': inputStyle })
					])
				])
			]),

			// Timeouts
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['⏱️ ', 'Timeouts']),
				K.E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'gap: 16px;' }, [
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Connect Timeout'),
						K.E('input', { 'type': 'text', 'id': 'defaults-timeout-connect', 'value': defaults.timeout_connect || '5s', 'placeholder': '5s', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Client Timeout'),
						K.E('input', { 'type': 'text', 'id': 'defaults-timeout-client', 'value': defaults.timeout_client || '30s', 'placeholder': '30s', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Server Timeout'),
						K.E('input', { 'type': 'text', 'id': 'defaults-timeout-server', 'value': defaults.timeout_server || '30s', 'placeholder': '30s', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'HTTP Request Timeout'),
						K.E('input', { 'type': 'text', 'id': 'defaults-timeout-http-request', 'value': defaults.timeout_http_request || '10s', 'placeholder': '10s', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'HTTP Keep-Alive'),
						K.E('input', { 'type': 'text', 'id': 'defaults-timeout-http-keep-alive', 'value': defaults.timeout_http_keep_alive || '10s', 'placeholder': '10s', 'style': inputStyle })
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Retries'),
						K.E('input', { 'type': 'number', 'id': 'defaults-retries', 'value': defaults.retries || 3, 'min': '0', 'max': '10', 'style': inputStyle })
					])
				])
			]),

			// ACME / Let's Encrypt
			K.E('div', { 'class': 'kiss-card' }, [
				K.E('div', { 'class': 'kiss-card-title' }, ['🔐 ', "ACME / Let's Encrypt"]),
				K.E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 16px;' }, [
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
							K.E('input', { 'type': 'checkbox', 'id': 'acme-enabled', 'checked': acme.enabled }),
							'🔐 Enable automatic certificate management'
						])
					]),
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': labelStyle }, 'Email'),
						K.E('input', { 'type': 'email', 'id': 'acme-email', 'value': acme.email || '', 'placeholder': 'admin@example.com', 'style': inputStyle }),
						K.E('small', { 'style': 'color: var(--kiss-muted); font-size: 11px; margin-top: 4px; display: block;' },
							"Required for Let's Encrypt certificate registration")
					]),
					K.E('div', { 'style': 'grid-column: span 2;' }, [
						K.E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
							K.E('input', { 'type': 'checkbox', 'id': 'acme-staging', 'checked': acme.staging }),
							"🧪 Use Let's Encrypt staging server (for testing)"
						])
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Key Type'),
						K.E('select', { 'id': 'acme-key-type', 'style': inputStyle }, [
							K.E('option', { 'value': 'ec-256', 'selected': acme.key_type === 'ec-256' || !acme.key_type }, 'EC-256 (recommended)'),
							K.E('option', { 'value': 'ec-384', 'selected': acme.key_type === 'ec-384' }, 'EC-384'),
							K.E('option', { 'value': 'rsa-2048', 'selected': acme.key_type === 'rsa-2048' }, 'RSA-2048'),
							K.E('option', { 'value': 'rsa-4096', 'selected': acme.key_type === 'rsa-4096' }, 'RSA-4096')
						])
					]),
					K.E('div', {}, [
						K.E('label', { 'style': labelStyle }, 'Renew Before (days)'),
						K.E('input', { 'type': 'number', 'id': 'acme-renew-days', 'value': acme.renew_days || 30, 'min': '1', 'max': '60', 'style': inputStyle }),
						K.E('small', { 'style': 'color: var(--kiss-muted); font-size: 11px; margin-top: 4px; display: block;' },
							'Renew certificate this many days before expiry')
					])
				])
			]),

			// Save Button
			K.E('div', { 'style': 'margin-top: 20px; text-align: right;' }, [
				K.E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 12px 24px; font-size: 14px;',
					'click': function() { self.handleSave(); }
				}, '💾 Save & Apply')
			])
		]);

		return KissTheme.wrap(content, 'admin/services/haproxy/settings');
	},

	handleSave: function() {
		var self = this;
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
				self.showToast('Settings saved successfully', 'success');
			} else {
				self.showToast('Failed to save: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.kiss-toast');
		if (existing) existing.remove();

		var icons = { success: '✅', error: '❌', warning: '⚠️' };
		var colors = {
			success: 'var(--kiss-green, #00C853)',
			error: 'var(--kiss-red, #FF1744)',
			warning: 'var(--kiss-yellow, #fbbf24)'
		};

		var toast = document.createElement('div');
		toast.className = 'kiss-toast';
		toast.style.cssText = 'position: fixed; bottom: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; background: var(--kiss-card, #161e2e); border: 1px solid ' + (colors[type] || 'var(--kiss-line)') + '; color: var(--kiss-text, #e2e8f0); font-size: 14px; display: flex; align-items: center; gap: 10px; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
		toast.innerHTML = (icons[type] || 'ℹ️') + ' ' + message;

		document.body.appendChild(toast);
		setTimeout(function() { toast.remove(); }, 4000);
	},

	handleSaveApply: null,
	handleReset: null
});
