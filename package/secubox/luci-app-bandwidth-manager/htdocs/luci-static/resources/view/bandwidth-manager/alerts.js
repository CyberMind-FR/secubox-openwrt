'use strict';
'require view';
'require ui';
'require poll';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getAlertSettings(),
			API.getAlertHistory(50),
			API.getPendingAlerts()
		]);
	},

	render: function(data) {
		var settings = data[0] || {};
		var history = (data[1] && data[1].alerts) || [];
		var pending = data[2] || { alerts: [], count: 0 };
		var self = this;

		var v = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('bandwidth-manager/dashboard.css') }),
			E('style', {}, this.getCustomStyles()),
			E('h2', {}, _('Bandwidth Alerts')),
			E('div', { 'class': 'cbi-map-descr' }, _('Configure threshold alerts, notification methods, and view alert history'))
		]);

		// Pending Alerts Banner
		if (pending.count > 0) {
			var pendingBanner = E('div', { 'class': 'pending-alerts-banner' }, [
				E('div', { 'class': 'banner-icon' }, '🔔'),
				E('div', { 'class': 'banner-content' }, [
					E('div', { 'class': 'banner-title' }, _('%d Pending Alert(s)').format(pending.count)),
					E('div', { 'class': 'banner-desc' }, _('You have unacknowledged alerts requiring attention'))
				]),
				E('button', {
					'class': 'bw-btn bw-btn-primary',
					'click': function() { self.scrollToHistory(); }
				}, _('View Alerts'))
			]);
			v.appendChild(pendingBanner);
		}

		// Alert Settings Section
		var settingsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Alert Settings')),
			E('div', { 'class': 'settings-grid' }, [
				// Main toggle
				E('div', { 'class': 'setting-card main-toggle' }, [
					E('div', { 'class': 'setting-info' }, [
						E('div', { 'class': 'setting-name' }, _('Enable Alerts')),
						E('div', { 'class': 'setting-desc' }, _('Master switch for all bandwidth alerts'))
					]),
					E('label', { 'class': 'toggle' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'alert-enabled',
							'checked': settings.enabled
						}),
						E('span', { 'class': 'toggle-slider' })
					])
				]),

				// Quota thresholds
				E('div', { 'class': 'setting-card' }, [
					E('div', { 'class': 'setting-header' }, [
						E('span', { 'class': 'setting-icon' }, '📊'),
						E('span', {}, _('Quota Threshold Alerts'))
					]),
					E('div', { 'class': 'threshold-options' }, [
						E('label', { 'class': 'checkbox-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'threshold-80', 'checked': settings.quota_threshold_80 }),
							E('span', { 'class': 'threshold-badge t-80' }, '80%'),
							E('span', {}, _('Warning'))
						]),
						E('label', { 'class': 'checkbox-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'threshold-90', 'checked': settings.quota_threshold_90 }),
							E('span', { 'class': 'threshold-badge t-90' }, '90%'),
							E('span', {}, _('Critical'))
						]),
						E('label', { 'class': 'checkbox-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'threshold-100', 'checked': settings.quota_threshold_100 }),
							E('span', { 'class': 'threshold-badge t-100' }, '100%'),
							E('span', {}, _('Exceeded'))
						])
					])
				]),

				// Additional alerts
				E('div', { 'class': 'setting-card' }, [
					E('div', { 'class': 'setting-header' }, [
						E('span', { 'class': 'setting-icon' }, '⚡'),
						E('span', {}, _('Additional Alerts'))
					]),
					E('div', { 'class': 'checkbox-list' }, [
						E('label', { 'class': 'checkbox-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'new-device-alert', 'checked': settings.new_device_alert }),
							E('span', {}, _('New device connected'))
						]),
						E('label', { 'class': 'checkbox-option' }, [
							E('input', { 'type': 'checkbox', 'id': 'high-bandwidth-alert', 'checked': settings.high_bandwidth_alert }),
							E('span', {}, _('High bandwidth usage (above ')),
							E('input', {
								'type': 'number',
								'id': 'high-bandwidth-threshold',
								'class': 'cbi-input-text inline-input',
								'value': settings.high_bandwidth_threshold || 100,
								'min': '1',
								'max': '1000'
							}),
							E('span', {}, _(' Mbps)'))
						])
					])
				])
			]),
			E('div', { 'class': 'settings-actions' }, [
				E('button', {
					'class': 'bw-btn bw-btn-primary',
					'click': function() { self.saveAlertSettings(); }
				}, _('Save Settings'))
			])
		]);
		v.appendChild(settingsSection);

		// Notification Methods
		var notifySection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Notification Methods')),
			E('div', { 'class': 'notify-grid' }, [
				// Email Configuration
				E('div', { 'class': 'notify-card' }, [
					E('div', { 'class': 'notify-header' }, [
						E('span', { 'class': 'notify-icon' }, '📧'),
						E('span', { 'class': 'notify-title' }, _('Email Notifications')),
						settings.email && settings.email.configured ?
							E('span', { 'class': 'status-badge success' }, _('Configured')) :
							E('span', { 'class': 'status-badge' }, _('Not configured'))
					]),
					E('div', { 'class': 'notify-form' }, [
						E('div', { 'class': 'form-group' }, [
							E('label', {}, _('SMTP Server')),
							E('input', {
								'type': 'text',
								'id': 'smtp-server',
								'class': 'cbi-input-text',
								'placeholder': 'smtp.gmail.com',
								'value': (settings.email && settings.email.smtp_server) || ''
							})
						]),
						E('div', { 'class': 'form-row' }, [
							E('div', { 'class': 'form-group half' }, [
								E('label', {}, _('Port')),
								E('input', {
									'type': 'number',
									'id': 'smtp-port',
									'class': 'cbi-input-text',
									'value': (settings.email && settings.email.smtp_port) || 587
								})
							]),
							E('div', { 'class': 'form-group half' }, [
								E('label', {}, [
									E('input', {
										'type': 'checkbox',
										'id': 'smtp-tls',
										'checked': settings.email ? settings.email.smtp_tls : true
									}),
									' ' + _('Use TLS')
								])
							])
						]),
						E('div', { 'class': 'form-group' }, [
							E('label', {}, _('Username')),
							E('input', {
								'type': 'text',
								'id': 'smtp-user',
								'class': 'cbi-input-text',
								'value': (settings.email && settings.email.smtp_user) || ''
							})
						]),
						E('div', { 'class': 'form-group' }, [
							E('label', {}, _('Password')),
							E('input', {
								'type': 'password',
								'id': 'smtp-password',
								'class': 'cbi-input-text',
								'placeholder': _('Enter to change')
							})
						]),
						E('div', { 'class': 'form-group' }, [
							E('label', {}, _('Recipient Email')),
							E('input', {
								'type': 'email',
								'id': 'email-recipient',
								'class': 'cbi-input-text',
								'placeholder': 'admin@example.com',
								'value': (settings.email && settings.email.recipient) || ''
							})
						])
					]),
					E('div', { 'class': 'notify-actions' }, [
						E('button', {
							'class': 'bw-btn bw-btn-secondary',
							'click': function() { self.saveEmailConfig(); }
						}, _('Save Email')),
						E('button', {
							'class': 'bw-btn bw-btn-secondary',
							'click': function() { self.testNotification('email'); }
						}, _('Test'))
					])
				]),

				// SMS Configuration
				E('div', { 'class': 'notify-card' }, [
					E('div', { 'class': 'notify-header' }, [
						E('span', { 'class': 'notify-icon' }, '📱'),
						E('span', { 'class': 'notify-title' }, _('SMS Notifications')),
						settings.sms && settings.sms.configured ?
							E('span', { 'class': 'status-badge success' }, _('Configured')) :
							E('span', { 'class': 'status-badge' }, _('Not configured'))
					]),
					E('div', { 'class': 'notify-form' }, [
						E('div', { 'class': 'form-group' }, [
							E('label', {}, _('Provider')),
							E('select', { 'id': 'sms-provider', 'class': 'cbi-input-select' }, [
								E('option', { 'value': '', 'selected': !settings.sms || !settings.sms.provider }, _('Select provider...')),
								E('option', { 'value': 'twilio', 'selected': settings.sms && settings.sms.provider === 'twilio' }, 'Twilio'),
								E('option', { 'value': 'nexmo', 'selected': settings.sms && settings.sms.provider === 'nexmo' }, 'Nexmo/Vonage'),
								E('option', { 'value': 'messagebird', 'selected': settings.sms && settings.sms.provider === 'messagebird' }, 'MessageBird')
							])
						]),
						E('div', { 'class': 'form-group' }, [
							E('label', {}, _('Account SID / API Key')),
							E('input', {
								'type': 'text',
								'id': 'sms-account-sid',
								'class': 'cbi-input-text',
								'placeholder': 'ACxxxxxxxxxx'
							})
						]),
						E('div', { 'class': 'form-group' }, [
							E('label', {}, _('Auth Token / Secret')),
							E('input', {
								'type': 'password',
								'id': 'sms-auth-token',
								'class': 'cbi-input-text',
								'placeholder': _('Enter to change')
							})
						]),
						E('div', { 'class': 'form-row' }, [
							E('div', { 'class': 'form-group half' }, [
								E('label', {}, _('From Number')),
								E('input', {
									'type': 'tel',
									'id': 'sms-from',
									'class': 'cbi-input-text',
									'placeholder': '+1234567890',
									'value': (settings.sms && settings.sms.from_number) || ''
								})
							]),
							E('div', { 'class': 'form-group half' }, [
								E('label', {}, _('To Number')),
								E('input', {
									'type': 'tel',
									'id': 'sms-to',
									'class': 'cbi-input-text',
									'placeholder': '+1234567890',
									'value': (settings.sms && settings.sms.to_number) || ''
								})
							])
						])
					]),
					E('div', { 'class': 'notify-actions' }, [
						E('button', {
							'class': 'bw-btn bw-btn-secondary',
							'click': function() { self.saveSmsConfig(); }
						}, _('Save SMS')),
						E('button', {
							'class': 'bw-btn bw-btn-secondary',
							'click': function() { self.testNotification('sms'); }
						}, _('Test'))
					])
				])
			])
		]);
		v.appendChild(notifySection);

		// Alert History
		var historySection = E('div', { 'class': 'cbi-section', 'id': 'alert-history' }, [
			E('h3', {}, _('Alert History')),
			E('div', { 'class': 'history-actions' }, [
				E('button', {
					'class': 'bw-btn bw-btn-secondary',
					'click': function() { window.location.reload(); }
				}, _('Refresh'))
			])
		]);

		if (history.length > 0) {
			var historyTable = E('div', { 'class': 'history-list' });

			history.reverse().forEach(function(alert) {
				var date = new Date(parseInt(alert.timestamp) * 1000);
				var severityClass = alert.severity === 'critical' ? 'danger' :
					(alert.severity === 'warning' ? 'warning' : 'info');

				historyTable.appendChild(E('div', {
					'class': 'history-item' + (alert.acknowledged ? ' acknowledged' : ''),
					'data-timestamp': alert.timestamp
				}, [
					E('div', { 'class': 'history-severity severity-' + severityClass }, [
						alert.severity === 'critical' ? '🚨' :
							(alert.severity === 'warning' ? '⚠️' : 'ℹ️')
					]),
					E('div', { 'class': 'history-content' }, [
						E('div', { 'class': 'history-message' }, alert.message),
						E('div', { 'class': 'history-meta' }, [
							E('span', { 'class': 'history-type' }, alert.type),
							E('span', { 'class': 'history-time' }, date.toLocaleString())
						])
					]),
					!alert.acknowledged ? E('button', {
						'class': 'bw-btn bw-btn-secondary btn-sm',
						'click': function() { self.acknowledgeAlert(alert.timestamp); }
					}, _('Ack')) : E('span', { 'class': 'ack-badge' }, '✓')
				]));
			});

			historySection.appendChild(historyTable);
		} else {
			historySection.appendChild(E('div', { 'class': 'empty-state' }, [
				E('div', { 'class': 'empty-icon' }, '🔔'),
				E('p', {}, _('No alerts yet')),
				E('p', { 'class': 'empty-hint' }, _('Alerts will appear here when quota thresholds are reached'))
			]));
		}

		v.appendChild(historySection);

		return KissTheme.wrap([v], 'admin/services/bandwidth-manager/alerts');
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
		var self = this;
		API.acknowledgeAlert(timestamp).then(function(result) {
			if (result.success) {
				var item = document.querySelector('.history-item[data-timestamp="' + timestamp + '"]');
				if (item) {
					item.classList.add('acknowledged');
					var btn = item.querySelector('.bw-btn');
					if (btn) {
						btn.replaceWith(E('span', { 'class': 'ack-badge' }, '✓'));
					}
				}
			}
		});
	},

	scrollToHistory: function() {
		var historySection = document.getElementById('alert-history');
		if (historySection) {
			historySection.scrollIntoView({ behavior: 'smooth' });
		}
	},

	getCustomStyles: function() {
		return `
			.pending-alerts-banner { display: flex; align-items: center; gap: 16px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
			.banner-icon { font-size: 32px; animation: shake 0.5s ease-in-out infinite; }
			.banner-content { flex: 1; }
			.banner-title { font-size: 16px; font-weight: 600; color: #fbbf24; }
			.banner-desc { font-size: 13px; color: #999; }
			@keyframes shake { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
			.settings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 20px; }
			.setting-card { background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 12px; padding: 16px; }
			.setting-card.main-toggle { display: flex; justify-content: space-between; align-items: center; }
			.setting-info { }
			.setting-name { font-size: 16px; font-weight: 600; color: #fff; }
			.setting-desc { font-size: 13px; color: #999; margin-top: 4px; }
			.setting-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 15px; font-weight: 600; color: #fff; }
			.setting-icon { font-size: 20px; }
			.toggle { position: relative; display: inline-block; width: 48px; height: 24px; }
			.toggle input { opacity: 0; width: 0; height: 0; }
			.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--bw-border, #25252f); border-radius: 24px; transition: 0.3s; }
			.toggle-slider::before { content: ""; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
			input:checked + .toggle-slider { background: #10b981; }
			input:checked + .toggle-slider::before { transform: translateX(24px); }
			.threshold-options, .checkbox-list { display: flex; flex-direction: column; gap: 12px; }
			.checkbox-option { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #ccc; }
			.checkbox-option input { width: 18px; height: 18px; }
			.threshold-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
			.threshold-badge.t-80 { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
			.threshold-badge.t-90 { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
			.threshold-badge.t-100 { background: rgba(239, 68, 68, 0.2); color: #f87171; }
			.inline-input { width: 60px; display: inline-block; margin: 0 4px; padding: 2px 6px; text-align: center; }
			.settings-actions { margin-top: 16px; }
			.notify-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
			.notify-card { background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 12px; padding: 20px; }
			.notify-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--bw-border, #25252f); }
			.notify-icon { font-size: 24px; }
			.notify-title { font-size: 16px; font-weight: 600; color: #fff; flex: 1; }
			.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
			.status-badge.success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
			.notify-form { margin-bottom: 16px; }
			.form-group { margin-bottom: 12px; }
			.form-group label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #999; }
			.form-row { display: flex; gap: 12px; }
			.form-group.half { flex: 1; }
			.notify-actions { display: flex; gap: 8px; }
			.history-actions { margin-bottom: 16px; }
			.history-list { display: flex; flex-direction: column; gap: 8px; }
			.history-item { display: flex; align-items: flex-start; gap: 12px; background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 8px; padding: 12px 16px; transition: all 0.2s; }
			.history-item.acknowledged { opacity: 0.6; }
			.history-severity { font-size: 20px; }
			.severity-danger { }
			.severity-warning { }
			.severity-info { }
			.history-content { flex: 1; }
			.history-message { font-size: 14px; color: #fff; margin-bottom: 4px; }
			.history-meta { display: flex; gap: 12px; font-size: 12px; color: #666; }
			.history-type { text-transform: capitalize; }
			.btn-sm { padding: 6px 12px; font-size: 12px; }
			.ack-badge { color: #10b981; font-weight: 600; }
			.empty-state { text-align: center; padding: 40px; color: #999; }
			.empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
			.empty-hint { font-size: 13px; color: #666; }
		`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
