'use strict';
'require view';
'require dom';
'require ui';
'require system-hub/api as API';
'require system-hub/theme as Theme';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('system-hub/dashboard.css')
}));

// Initialize theme
Theme.init();

return view.extend({
	load: function() {
		return Promise.all([
			API.getSettings(),
			API.getStatus()
		]);
	},

	render: function(data) {
		var settings = data[0] || {};
		var status = data[1];
		var self = this;

		// Extract settings with defaults
		var general = settings.general || {};
		var thresholds = settings.thresholds || {};
		var schedules = settings.schedules || {};
		var upload = settings.upload || {};
		var support = settings.support || {};

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			// General Settings
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '⚙️'), 'Configuration Générale' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderToggle('🔄', 'Rafraîchissement automatique', 'Mettre à jour le dashboard toutes les 30s', general.auto_refresh !== false, 'cfg_refresh'),
					this.renderToggle('💚', 'Vérification santé auto', 'Exécuter un health check toutes les heures', general.health_check !== false, 'cfg_health'),
					this.renderToggle('🐛', 'Mode Debug', 'Activer les logs détaillés', general.debug_mode === true, 'cfg_debug'),

					E('div', { 'class': 'sh-form-group', 'style': 'margin-top: 16px;' }, [
						E('label', { 'class': 'sh-form-label' }, 'Intervalle de rafraîchissement (secondes)'),
						E('input', { 'type': 'number', 'class': 'sh-input', 'value': general.refresh_interval || '30', 'id': 'cfg_interval', 'style': 'width: 120px;' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Rétention des logs (jours)'),
						E('input', { 'type': 'number', 'class': 'sh-input', 'value': general.log_retention || '30', 'id': 'cfg_retention', 'style': 'width: 120px;' })
					])
				])
			]),
			
			// Alert Thresholds
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🚨'), 'Seuils d\'Alerte' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'CPU Warning / Critical (%)'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.cpu_warning || '80', 'id': 'cpu_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.cpu_critical || '95', 'id': 'cpu_critical', 'style': 'width: 100px;' })
						])
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Mémoire Warning / Critical (%)'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.mem_warning || '80', 'id': 'mem_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.mem_critical || '95', 'id': 'mem_critical', 'style': 'width: 100px;' })
						])
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Disque Warning / Critical (%)'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.disk_warning || '80', 'id': 'disk_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.disk_critical || '95', 'id': 'disk_critical', 'style': 'width: 100px;' })
						])
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Température Warning / Critical (°C)'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.temp_warning || '70', 'id': 'temp_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': thresholds.temp_critical || '85', 'id': 'temp_critical', 'style': 'width: 100px;' })
						])
					])
				])
			]),
			
			// Scheduled Tasks
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📅'), 'Tâches Planifiées' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderToggle('📋', 'Rapport Santé Quotidien', 'Tous les jours à 6h00', schedules.health_report !== false, 'sched_health'),
					this.renderToggle('💾', 'Sauvegarde Hebdomadaire', 'Dimanche à 3h00, garde 4 versions', schedules.backup_weekly !== false, 'sched_backup'),
					this.renderToggle('🧹', 'Nettoyage Logs', 'Supprimer logs > 30 jours', schedules.log_cleanup !== false, 'sched_cleanup')
				])
			]),

			// Upload Configuration
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '☁️'), 'Upload Diagnostics' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderToggle('☁️', 'Upload automatique', 'Envoyer les diagnostics au support', upload.auto_upload === true, 'cfg_upload'),
					E('div', { 'class': 'sh-form-group', 'style': 'margin-top: 16px;' }, [
						E('label', { 'class': 'sh-form-label' }, 'URL d\'upload'),
						E('input', { 'type': 'text', 'class': 'sh-input', 'id': 'upload_url', 'value': upload.url || '', 'placeholder': 'https://support.example.com/upload' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Token d\'authentification'),
						E('input', { 'type': 'password', 'class': 'sh-input', 'id': 'upload_token', 'value': upload.token || '', 'placeholder': '••••••••' })
					])
				])
			]),

			// Support Info
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📞'), 'Informations Support' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Fournisseur'),
						E('input', { 'type': 'text', 'class': 'sh-input', 'id': 'support_provider', 'value': support.provider || 'CyberMind.fr' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Email Support'),
						E('input', { 'type': 'email', 'class': 'sh-input', 'id': 'support_email', 'value': support.email || 'support@cybermind.fr' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'URL Documentation'),
						E('input', { 'type': 'url', 'class': 'sh-input', 'id': 'support_docs', 'value': support.docs || 'https://docs.cybermind.fr' })
					])
				])
			]),
			
			// Actions
			E('div', { 'class': 'sh-btn-group' }, [
				E('button', { 
					'class': 'sh-btn sh-btn-primary',
					'click': L.bind(this.saveSettings, this)
				}, [ '💾 Sauvegarder' ]),
				E('button', { 'class': 'sh-btn', 'click': function() { window.location.reload(); } }, [ '🔄 Réinitialiser' ])
			])
		]);

		return view;
	},

	renderToggle: function(icon, label, desc, enabled, id) {
		return E('div', { 'class': 'sh-toggle' }, [
			E('div', { 'class': 'sh-toggle-info' }, [
				E('span', { 'class': 'sh-toggle-icon' }, icon),
				E('div', {}, [
					E('div', { 'class': 'sh-toggle-label' }, label),
					E('div', { 'class': 'sh-toggle-desc' }, desc)
				])
			]),
			E('div', { 
				'class': 'sh-toggle-switch' + (enabled ? ' active' : ''),
				'id': id,
				'click': function(ev) { ev.target.classList.toggle('active'); }
			})
		]);
	},

	saveSettings: function() {
		ui.showModal(_('Sauvegarde'), [
			E('p', {}, 'Sauvegarde des paramètres...'),
			E('div', { 'class': 'spinning' })
		]);

		// Collect all settings from form
		var settingsData = {
			auto_refresh: document.getElementById('cfg_refresh').classList.contains('active') ? 1 : 0,
			health_check: document.getElementById('cfg_health').classList.contains('active') ? 1 : 0,
			debug_mode: document.getElementById('cfg_debug').classList.contains('active') ? 1 : 0,
			refresh_interval: parseInt(document.getElementById('cfg_interval').value) || 30,
			log_retention: parseInt(document.getElementById('cfg_retention').value) || 30,
			cpu_warning: parseInt(document.getElementById('cpu_warning').value) || 80,
			cpu_critical: parseInt(document.getElementById('cpu_critical').value) || 95,
			mem_warning: parseInt(document.getElementById('mem_warning').value) || 80,
			mem_critical: parseInt(document.getElementById('mem_critical').value) || 95,
			disk_warning: parseInt(document.getElementById('disk_warning').value) || 80,
			disk_critical: parseInt(document.getElementById('disk_critical').value) || 95,
			temp_warning: parseInt(document.getElementById('temp_warning').value) || 70,
			temp_critical: parseInt(document.getElementById('temp_critical').value) || 85
		};

		API.saveSettings(
			settingsData.auto_refresh,
			settingsData.health_check,
			settingsData.debug_mode,
			settingsData.refresh_interval,
			settingsData.log_retention,
			settingsData.cpu_warning,
			settingsData.cpu_critical,
			settingsData.mem_warning,
			settingsData.mem_critical,
			settingsData.disk_warning,
			settingsData.disk_critical,
			settingsData.temp_warning,
			settingsData.temp_critical
		).then(function(response) {
			ui.hideModal();
			if (response.success) {
				ui.addNotification(null, E('p', {}, 'Paramètres sauvegardés avec succès'), 'success');
			} else {
				ui.addNotification(null, E('p', {}, 'Erreur: ' + (response.message || 'Unknown error')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'Erreur: ' + (err.message || err)), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
