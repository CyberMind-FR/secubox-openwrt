'use strict';
'require view';
'require ui';
'require poll';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

return L.view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	settings: {},
	history: [],
	pending: { alerts: [], count: 0 },

	load: function() {
		return Promise.all([
			API.getAlertSettings(),
			API.getAlertHistory(50),
			API.getPendingAlerts()
		]);
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var pendingCount = this.pending.count || 0;
		var critical = this.history.filter(function(a) { return a.severity === 'critical'; }).length;
		return [
			KissTheme.stat(this.settings.enabled ? 'ON' : 'OFF', 'Alerts', this.settings.enabled ? c.green : c.red),
			KissTheme.stat(pendingCount, 'Pending', pendingCount > 0 ? c.orange : c.muted),
			KissTheme.stat(this.history.length, 'Total', c.blue),
			KissTheme.stat(critical, 'Critical', critical > 0 ? c.red : c.muted)
		];
	},

	render: function(data) {
		this.settings = data[0] || {};
		this.history = (data[1] && data[1].alerts) || [];
		this.pending = data[2] || { alerts: [], count: 0 };
		var self = this;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, _('Bandwidth Alerts')),
					this.settings.enabled ? KissTheme.badge('Enabled', 'green') : KissTheme.badge('Disabled', 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					_('Configure threshold alerts, notification methods, and view alert history'))
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Pending Alerts Banner
			this.pending.count > 0 ? this.renderPendingBanner() : '',

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				this.renderSettingsCard(),
				this.renderThresholdsCard()
			]),

			// Notifications Config
			this.renderNotificationsCard(),

			// Alert History
			this.renderHistoryCard()
		];

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/alerts');
	},

	renderPendingBanner: function() {
		var self = this;
		return E('div', {
			'style': 'display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%); border: 1px solid var(--kiss-orange); border-radius: 12px; margin-bottom: 20px;'
		}, [
			E('div', { 'style': 'font-size: 28px;' }, '🔔'),
			E('div', { 'style': 'flex: 1;' }, [
				E('div', { 'style': 'font-weight: 600; color: var(--kiss-orange);' }, _('%d Pending Alert(s)').format(this.pending.count)),
				E('div', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, _('You have unacknowledged alerts requiring attention'))
			]),
			E('button', {
				'class': 'kiss-btn kiss-btn-orange',
				'click': function() { self.scrollToHistory(); }
			}, _('View Alerts'))
		]);
	},

	renderSettingsCard: function() {
		var self = this;

		return KissTheme.card('Alert Settings',
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
				// Main toggle
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--kiss-bg); border-radius: 8px;' }, [
					E('div', {}, [
						E('div', { 'style': 'font-weight: 600;' }, _('Enable Alerts')),
						E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, _('Master switch for all bandwidth alerts'))
					]),
					E('input', {
						'type': 'checkbox',
						'id': 'alert-enabled',
						'checked': this.settings.enabled,
						'style': 'width: 20px; height: 20px;'
					})
				]),

				// Additional alerts
				E('div', { 'style': 'padding: 12px; background: var(--kiss-bg); border-radius: 8px;' }, [
					E('div', { 'style': 'font-weight: 600; margin-bottom: 12px;' }, '⚡ ' + _('Additional Alerts')),
					E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;' }, [
						E('input', { 'type': 'checkbox', 'id': 'new-device-alert', 'checked': this.settings.new_device_alert }),
						_('New device connected')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
						E('input', { 'type': 'checkbox', 'id': 'high-bandwidth-alert', 'checked': this.settings.high_bandwidth_alert }),
						_('High bandwidth usage above '),
						E('input', {
							'type': 'number',
							'id': 'high-bandwidth-threshold',
							'value': this.settings.high_bandwidth_threshold || 100,
							'min': '1', 'max': '1000',
							'style': 'width: 60px; padding: 4px 8px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 4px; color: var(--kiss-text); text-align: center;'
						}),
						_(' Mbps')
					])
				]),

				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.saveAlertSettings(); }
				}, _('Save Settings'))
			])
		);
	},

	renderThresholdsCard: function() {
		return KissTheme.card('📊 ' + _('Quota Thresholds'),
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--kiss-bg); border-radius: 8px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'threshold-80', 'checked': this.settings.quota_threshold_80 }),
					KissTheme.badge('80%', 'blue'),
					E('span', {}, _('Warning level'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--kiss-bg); border-radius: 8px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'threshold-90', 'checked': this.settings.quota_threshold_90 }),
					KissTheme.badge('90%', 'orange'),
					E('span', {}, _('Critical level'))
				]),
				E('label', { 'style': 'display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--kiss-bg); border-radius: 8px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'threshold-100', 'checked': this.settings.quota_threshold_100 }),
					KissTheme.badge('100%', 'red'),
					E('span', {}, _('Quota exceeded'))
				])
			])
		);
	},

	renderNotificationsCard: function() {
		var self = this;
		var inputStyle = 'width: 100%; padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);';
		var emailConfigured = this.settings.email && this.settings.email.configured;
		var smsConfigured = this.settings.sms && this.settings.sms.configured;

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, '📬 ' + _('Notification Methods')),
				E('div', { 'style': 'display: flex; gap: 8px;' }, [
					emailConfigured ? KissTheme.badge('Email OK', 'green') : KissTheme.badge('Email', 'muted'),
					smsConfigured ? KissTheme.badge('SMS OK', 'green') : KissTheme.badge('SMS', 'muted')
				])
			]),
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap: 20px;' }, [
				// Email Config
				E('div', { 'style': 'padding: 16px; background: var(--kiss-bg); border-radius: 8px;' }, [
					E('div', { 'style': 'font-weight: 600; margin-bottom: 16px;' }, '📧 ' + _('Email Notifications')),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
						E('input', { 'type': 'text', 'id': 'smtp-server', 'style': inputStyle, 'placeholder': 'smtp.gmail.com',
							'value': (this.settings.email && this.settings.email.smtp_server) || '' }),
						E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;' }, [
							E('input', { 'type': 'number', 'id': 'smtp-port', 'style': inputStyle, 'placeholder': '587',
								'value': (this.settings.email && this.settings.email.smtp_port) || 587 }),
							E('label', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
								E('input', { 'type': 'checkbox', 'id': 'smtp-tls', 'checked': this.settings.email ? this.settings.email.smtp_tls : true }),
								_('TLS')
							])
						]),
						E('input', { 'type': 'text', 'id': 'smtp-user', 'style': inputStyle, 'placeholder': _('Username'),
							'value': (this.settings.email && this.settings.email.smtp_user) || '' }),
						E('input', { 'type': 'password', 'id': 'smtp-password', 'style': inputStyle, 'placeholder': _('Password') }),
						E('input', { 'type': 'email', 'id': 'email-recipient', 'style': inputStyle, 'placeholder': 'admin@example.com',
							'value': (this.settings.email && this.settings.email.recipient) || '' }),
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('button', { 'class': 'kiss-btn kiss-btn-blue', 'click': function() { self.saveEmailConfig(); } }, _('Save')),
							E('button', { 'class': 'kiss-btn', 'click': function() { self.testNotification('email'); } }, _('Test'))
						])
					])
				]),

				// SMS Config
				E('div', { 'style': 'padding: 16px; background: var(--kiss-bg); border-radius: 8px;' }, [
					E('div', { 'style': 'font-weight: 600; margin-bottom: 16px;' }, '📱 ' + _('SMS Notifications')),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
						E('select', { 'id': 'sms-provider', 'style': inputStyle }, [
							E('option', { 'value': '' }, _('Select provider...')),
							E('option', { 'value': 'twilio', 'selected': this.settings.sms && this.settings.sms.provider === 'twilio' }, 'Twilio'),
							E('option', { 'value': 'nexmo', 'selected': this.settings.sms && this.settings.sms.provider === 'nexmo' }, 'Nexmo/Vonage'),
							E('option', { 'value': 'messagebird', 'selected': this.settings.sms && this.settings.sms.provider === 'messagebird' }, 'MessageBird')
						]),
						E('input', { 'type': 'text', 'id': 'sms-account-sid', 'style': inputStyle, 'placeholder': _('Account SID / API Key') }),
						E('input', { 'type': 'password', 'id': 'sms-auth-token', 'style': inputStyle, 'placeholder': _('Auth Token') }),
						E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;' }, [
							E('input', { 'type': 'tel', 'id': 'sms-from', 'style': inputStyle, 'placeholder': '+1234567890',
								'value': (this.settings.sms && this.settings.sms.from_number) || '' }),
							E('input', { 'type': 'tel', 'id': 'sms-to', 'style': inputStyle, 'placeholder': '+1234567890',
								'value': (this.settings.sms && this.settings.sms.to_number) || '' })
						]),
						E('div', { 'style': 'display: flex; gap: 8px;' }, [
							E('button', { 'class': 'kiss-btn kiss-btn-blue', 'click': function() { self.saveSmsConfig(); } }, _('Save')),
							E('button', { 'class': 'kiss-btn', 'click': function() { self.testNotification('sms'); } }, _('Test'))
						])
					])
				])
			])
		);
	},

	renderHistoryCard: function() {
		var self = this;

		var content;
		if (this.history.length === 0) {
			content = E('div', { 'style': 'text-align: center; padding: 40px;' }, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 12px; opacity: 0.5;' }, '🔔'),
				E('p', { 'style': 'color: var(--kiss-muted);' }, _('No alerts yet')),
				E('p', { 'style': 'font-size: 13px; color: var(--kiss-muted);' }, _('Alerts will appear here when quota thresholds are reached'))
			]);
		} else {
			var rows = this.history.slice().reverse().map(function(alert) {
				var date = new Date(parseInt(alert.timestamp) * 1000);
				var severityColor = alert.severity === 'critical' ? 'red' : (alert.severity === 'warning' ? 'orange' : 'blue');
				var icon = alert.severity === 'critical' ? '🚨' : (alert.severity === 'warning' ? '⚠️' : 'ℹ️');

				return E('tr', { 'style': alert.acknowledged ? 'opacity: 0.6;' : '' }, [
					E('td', { 'style': 'font-size: 20px;' }, icon),
					E('td', {}, KissTheme.badge(alert.severity, severityColor)),
					E('td', {}, alert.message),
					E('td', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, date.toLocaleString()),
					E('td', {}, [
						!alert.acknowledged ?
							E('button', {
								'class': 'kiss-btn kiss-btn-green',
								'style': 'padding: 4px 10px; font-size: 11px;',
								'click': function() { self.acknowledgeAlert(alert.timestamp); }
							}, _('Ack')) :
							E('span', { 'style': 'color: var(--kiss-green);' }, '✓')
					])
				]);
			});

			content = E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', { 'style': 'width: 40px;' }, ''),
						E('th', { 'style': 'width: 80px;' }, _('Severity')),
						E('th', {}, _('Message')),
						E('th', { 'style': 'width: 150px;' }, _('Time')),
						E('th', { 'style': 'width: 60px;' }, '')
					])
				]),
				E('tbody', {}, rows)
			]);
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', { 'id': 'alert-history' }, '📜 ' + _('Alert History')),
				E('div', { 'style': 'display: flex; gap: 8px;' }, [
					KissTheme.badge(this.history.length + ' alerts', 'blue'),
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() { window.location.reload(); }
					}, _('Refresh'))
				])
			]),
			content
		);
	},

	saveAlertSettings: function() {
		var enabled = document.getElementById('alert-enabled').checked ? 1 : 0;
		var threshold80 = document.getElementById('threshold-80').checked ? 1 : 0;
		var threshold90 = document.getElementById('threshold-90').checked ? 1 : 0;
		var threshold100 = document.getElementById('threshold-100').checked ? 1 : 0;
		var newDevice = document.getElementById('new-device-alert').checked ? 1 : 0;
		var highBandwidth = document.getElementById('high-bandwidth-alert').checked ? 1 : 0;
		var highThreshold = parseInt(document.getElementById('high-bandwidth-threshold').value) || 100;

		API.updateAlertSettings(enabled, threshold80, threshold90, threshold100, newDevice, highBandwidth, highThreshold).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Alert settings saved')), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to save settings')), 'error');
			}
		});
	},

	saveEmailConfig: function() {
		var server = document.getElementById('smtp-server').value;
		var port = parseInt(document.getElementById('smtp-port').value) || 587;
		var user = document.getElementById('smtp-user').value;
		var password = document.getElementById('smtp-password').value;
		var tls = document.getElementById('smtp-tls').checked ? 1 : 0;
		var recipient = document.getElementById('email-recipient').value;

		if (!server || !recipient) {
			ui.addNotification(null, E('p', _('SMTP server and recipient are required')), 'error');
			return;
		}

		API.configureEmail(server, port, user, password, tls, recipient, '').then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Email configuration saved')), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to save email config')), 'error');
			}
		});
	},

	saveSmsConfig: function() {
		var provider = document.getElementById('sms-provider').value;
		var accountSid = document.getElementById('sms-account-sid').value;
		var authToken = document.getElementById('sms-auth-token').value;
		var fromNumber = document.getElementById('sms-from').value;
		var toNumber = document.getElementById('sms-to').value;

		if (!provider || !toNumber) {
			ui.addNotification(null, E('p', _('Provider and recipient number are required')), 'error');
			return;
		}

		API.configureSms(provider, accountSid, authToken, fromNumber, toNumber).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('SMS configuration saved')), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to save SMS config')), 'error');
			}
		});
	},

	testNotification: function(type) {
		ui.addNotification(null, E('p', _('Sending test notification...')), 'info');

		API.testNotification(type).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Test notification sent')), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to send test notification')), 'error');
			}
		});
	},

	acknowledgeAlert: function(timestamp) {
		API.acknowledgeAlert(timestamp).then(function(result) {
			if (result.success) {
				window.location.reload();
			}
		});
	},

	scrollToHistory: function() {
		var historySection = document.getElementById('alert-history');
		if (historySection) {
			historySection.scrollIntoView({ behavior: 'smooth' });
		}
	}
});
