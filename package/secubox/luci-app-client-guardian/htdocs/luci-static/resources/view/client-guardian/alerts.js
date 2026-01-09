'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require rpc';
'require ui';
'require client-guardian/api as API';
'require client-guardian/nav as CgNav';
'require secubox-portal/header as SbHeader';

return view.extend({
	load: function() {
		return Promise.all([
			API.getAlerts(),
			API.getLogs(20, null)
		]);
	},

	render: function(data) {
		var alerts = data[0];
		var logs = data[1].logs || [];

		// Main wrapper with SecuBox header
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());

		var view = E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),
			CgNav.renderTabs('alerts'),

			// Email Configuration
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '📧'),
						'Configuration Email'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					this.renderToggle('📧', 'Alertes Email', 'Recevoir les alertes par email', alerts.email?.enabled),
					
					E('div', { 'class': 'cg-form-group', 'style': 'margin-top: 16px' }, [
						E('label', { 'class': 'cg-form-label' }, 'Serveur SMTP'),
						E('input', { 'type': 'text', 'class': 'cg-input', 'value': alerts.email?.smtp_server || 'smtp.gmail.com', 'id': 'smtp_server' })
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Port SMTP'),
						E('input', { 'type': 'number', 'class': 'cg-input', 'value': alerts.email?.smtp_port || 587, 'id': 'smtp_port' })
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Utilisateur'),
						E('input', { 'type': 'text', 'class': 'cg-input', 'value': alerts.email?.smtp_user || '', 'id': 'smtp_user', 'placeholder': 'user@gmail.com' })
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Mot de passe'),
						E('input', { 'type': 'password', 'class': 'cg-input', 'id': 'smtp_password', 'placeholder': '••••••••' })
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Destinataires'),
						E('input', { 'type': 'text', 'class': 'cg-input', 'id': 'email_recipients', 'placeholder': 'admin@example.com, security@example.com' })
					]),
					E('button', { 
						'class': 'cg-btn', 
						'click': L.bind(this.sendTestEmail, this)
					}, [ '📧 Envoyer Test' ])
				])
			]),
			
			// SMS Configuration
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '📱'),
						'Configuration SMS'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					this.renderToggle('📱', 'Alertes SMS', 'Via Twilio, Nexmo ou OVH SMS', alerts.sms?.enabled),
					
					E('div', { 'class': 'cg-form-group', 'style': 'margin-top: 16px' }, [
						E('label', { 'class': 'cg-form-label' }, 'Fournisseur'),
						E('select', { 'class': 'cg-select', 'id': 'sms_provider' }, [
							E('option', { 'value': 'twilio', 'selected': alerts.sms?.provider === 'twilio' }, 'Twilio'),
							E('option', { 'value': 'nexmo', 'selected': alerts.sms?.provider === 'nexmo' }, 'Nexmo / Vonage'),
							E('option', { 'value': 'ovh', 'selected': alerts.sms?.provider === 'ovh' }, 'OVH SMS')
						])
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'API Key / Account SID'),
						E('input', { 'type': 'text', 'class': 'cg-input', 'id': 'sms_api_key', 'placeholder': 'ACxxxxx...' })
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'API Secret / Auth Token'),
						E('input', { 'type': 'password', 'class': 'cg-input', 'id': 'sms_api_secret', 'placeholder': '••••••••' })
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Numéros destinataires'),
						E('input', { 'type': 'text', 'class': 'cg-input', 'id': 'sms_recipients', 'placeholder': '+33612345678, +33698765432' })
					]),
					E('button', { 
						'class': 'cg-btn', 
						'click': L.bind(this.sendTestSMS, this)
					}, [ '📱 Envoyer Test' ])
				])
			]),
			
			// Alert Types
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '🔔'),
						'Types d\'Alertes'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					this.renderToggle('🆕', 'Nouveau Client Détecté', 'Alerte quand un appareil inconnu se connecte', alerts.settings?.new_client_alert),
					this.renderToggle('🚫', 'Tentative Client Banni', 'Alerte si un client banni tente de se reconnecter', alerts.settings?.banned_attempt_alert),
					this.renderToggle('📊', 'Quota Dépassé', 'Alerte si un client dépasse son quota de temps/données', alerts.settings?.quota_exceeded_alert),
					this.renderToggle('⚠️', 'Activité Suspecte', 'Scan de ports, tentatives d\'intrusion, anomalies', alerts.settings?.suspicious_activity_alert)
				])
			]),
			
			// Alert Templates
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '📝'),
						'Modèles de Messages'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Message Nouveau Client'),
						E('textarea', { 'class': 'cg-textarea', 'id': 'template_new_client' }, 
							'🆕 Nouveau client détecté sur votre réseau\nMAC: {mac}\nIP: {ip}\nHostname: {hostname}\nAction: Mis en quarantaine')
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Message Client Banni'),
						E('textarea', { 'class': 'cg-textarea', 'id': 'template_banned' }, 
							'🚫 Tentative de connexion bloquée\nMAC: {mac}\nRaison du ban: {reason}\nDate du ban: {ban_date}')
					]),
					E('div', { 'class': 'cg-form-hint' }, 
						'Variables disponibles: {mac}, {ip}, {hostname}, {zone}, {reason}, {ban_date}, {quota_used}, {quota_limit}')
				])
			]),
			
			// Recent Alerts
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '📋'),
						'Alertes Récentes'
					]),
					E('div', { 'class': 'cg-card-badge' }, logs.length + ' entrées')
				]),
				E('div', { 'class': 'cg-card-body', 'id': 'recent-alerts' }, 
					this.renderRecentAlerts(logs)
				)
			]),
			
			// Save Button
			E('div', { 'class': 'cg-btn-group' }, [
				E('button', { 
					'class': 'cg-btn cg-btn-primary',
					'click': L.bind(this.saveSettings, this)
				}, [ '💾 Sauvegarder' ])
			])
		]);

		wrapper.appendChild(view);
		return wrapper;
	},

	renderToggle: function(icon, label, desc, enabled) {
		return E('div', { 'class': 'cg-toggle' }, [
			E('div', { 'class': 'cg-toggle-info' }, [
				E('span', { 'class': 'cg-toggle-icon' }, icon),
				E('div', {}, [
					E('div', { 'class': 'cg-toggle-label' }, label),
					E('div', { 'class': 'cg-toggle-desc' }, desc)
				])
			]),
			E('div', { 
				'class': 'cg-toggle-switch' + (enabled ? ' active' : ''),
				'click': function(ev) { ev.target.classList.toggle('active'); }
			})
		]);
	},

	renderRecentAlerts: function(logs) {
		if (!logs || logs.length === 0) {
			return E('div', { 'class': 'cg-empty-state' }, [
				E('div', { 'class': 'cg-empty-state-icon' }, '🔔'),
				E('div', { 'class': 'cg-empty-state-title' }, 'Aucune alerte récente'),
				E('div', { 'class': 'cg-empty-state-text' }, 'Les alertes apparaîtront ici')
			]);
		}

		var alertIcons = {
			'info': '📝',
			'warning': '⚠️',
			'error': '🚨'
		};

		return E('div', {}, logs.slice(0, 10).map(function(log) {
			return E('div', { 'class': 'cg-alert-preview' }, [
				E('div', { 'class': 'cg-alert-preview-icon' }, alertIcons[log.level] || '📝'),
				E('div', {}, [
					E('div', { 'class': 'cg-alert-preview-title' }, log.level.toUpperCase()),
					E('div', { 'class': 'cg-alert-preview-text' }, log.message),
					E('div', { 'class': 'cg-alert-preview-time' }, log.timestamp)
				])
			]);
		}));
	},

	sendTestEmail: function() {
		ui.showModal(_('Test Email'), [
			E('p', {}, 'Envoi d\'un email de test...'),
			E('div', { 'class': 'spinning' })
		]);

		API.sendTestAlert('email').then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, '✅ Email de test envoyé avec succès!'), 'success');
			} else {
				ui.addNotification(null, E('p', {}, '❌ Erreur: ' + (result.error || 'Échec de l\'envoi')), 'error');
			}
		});
	},

	sendTestSMS: function() {
		ui.showModal(_('Test SMS'), [
			E('p', {}, 'Envoi d\'un SMS de test...'),
			E('div', { 'class': 'spinning' })
		]);

		API.sendTestAlert('sms').then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, '✅ SMS de test envoyé avec succès!'), 'success');
			} else {
				ui.addNotification(null, E('p', {}, '❌ Erreur: ' + (result.error || 'Échec de l\'envoi')), 'error');
			}
		});
	},

	saveSettings: function() {
		ui.showModal(_('Sauvegarde'), [
			E('p', {}, 'Sauvegarde des paramètres d\'alertes...'),
			E('div', { 'class': 'spinning' })
		]);

		// Save via UCI
		uci.load('client-guardian').then(function() {
			uci.set('client-guardian', 'email', 'smtp_server', document.getElementById('smtp_server').value);
			uci.set('client-guardian', 'email', 'smtp_port', document.getElementById('smtp_port').value);
			uci.set('client-guardian', 'email', 'smtp_user', document.getElementById('smtp_user').value);
			
			return uci.save();
		}).then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, '✅ Paramètres sauvegardés!'), 'success');
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, '❌ Erreur: ' + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
