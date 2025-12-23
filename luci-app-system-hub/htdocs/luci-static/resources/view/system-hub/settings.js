'use strict';
'require view';
'require dom';
'require uci';
'require ui';

var api = L.require('system-hub.api');

return view.extend({
	load: function() {
		return Promise.all([
			api.callStatus(),
			api.callGetSchedules()
		]);
	},

	render: function(data) {
		var status = data[0];
		var schedules = data[1].schedules || [];
		var self = this;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			// General Settings
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '⚙️'), 'Configuration Générale' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderToggle('🔄', 'Rafraîchissement automatique', 'Mettre à jour le dashboard toutes les 30s', true, 'cfg_refresh'),
					this.renderToggle('💚', 'Vérification santé auto', 'Exécuter un health check toutes les heures', true, 'cfg_health'),
					this.renderToggle('🐛', 'Mode Debug', 'Activer les logs détaillés', false, 'cfg_debug'),
					
					E('div', { 'class': 'sh-form-group', 'style': 'margin-top: 16px;' }, [
						E('label', { 'class': 'sh-form-label' }, 'Intervalle de rafraîchissement (secondes)'),
						E('input', { 'type': 'number', 'class': 'sh-input', 'value': '30', 'id': 'cfg_interval', 'style': 'width: 120px;' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Rétention des logs (jours)'),
						E('input', { 'type': 'number', 'class': 'sh-input', 'value': '30', 'id': 'cfg_retention', 'style': 'width: 120px;' })
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
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '80', 'id': 'cpu_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '95', 'id': 'cpu_critical', 'style': 'width: 100px;' })
						])
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Mémoire Warning / Critical (%)'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '80', 'id': 'mem_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '95', 'id': 'mem_critical', 'style': 'width: 100px;' })
						])
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Disque Warning / Critical (%)'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '80', 'id': 'disk_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '95', 'id': 'disk_critical', 'style': 'width: 100px;' })
						])
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Température Warning / Critical (°C)'),
						E('div', { 'style': 'display: flex; gap: 12px;' }, [
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '70', 'id': 'temp_warning', 'style': 'width: 100px;' }),
							E('input', { 'type': 'number', 'class': 'sh-input', 'value': '85', 'id': 'temp_critical', 'style': 'width: 100px;' })
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
					this.renderToggle('📋', 'Rapport Santé Quotidien', 'Tous les jours à 6h00', true, 'sched_health'),
					this.renderToggle('💾', 'Sauvegarde Hebdomadaire', 'Dimanche à 3h00, garde 4 versions', true, 'sched_backup'),
					this.renderToggle('🧹', 'Nettoyage Logs', 'Supprimer logs > 30 jours', true, 'sched_cleanup')
				])
			]),
			
			// Upload Configuration
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '☁️'), 'Upload Diagnostics' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderToggle('☁️', 'Upload automatique', 'Envoyer les diagnostics au support', false, 'cfg_upload'),
					E('div', { 'class': 'sh-form-group', 'style': 'margin-top: 16px;' }, [
						E('label', { 'class': 'sh-form-label' }, 'URL d\'upload'),
						E('input', { 'type': 'text', 'class': 'sh-input', 'id': 'upload_url', 'placeholder': 'https://support.example.com/upload' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Token d\'authentification'),
						E('input', { 'type': 'password', 'class': 'sh-input', 'id': 'upload_token', 'placeholder': '••••••••' })
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
						E('input', { 'type': 'text', 'class': 'sh-input', 'id': 'support_provider', 'value': 'CyberMind.fr' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'Email Support'),
						E('input', { 'type': 'email', 'class': 'sh-input', 'id': 'support_email', 'value': 'support@cybermind.fr' })
					]),
					E('div', { 'class': 'sh-form-group' }, [
						E('label', { 'class': 'sh-form-label' }, 'URL Documentation'),
						E('input', { 'type': 'url', 'class': 'sh-input', 'id': 'support_docs', 'value': 'https://docs.cybermind.fr' })
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

		uci.load('system-hub').then(function() {
			// Save health thresholds
			uci.set('system-hub', 'health', 'cpu_warning', document.getElementById('cpu_warning').value);
			uci.set('system-hub', 'health', 'cpu_critical', document.getElementById('cpu_critical').value);
			uci.set('system-hub', 'health', 'memory_warning', document.getElementById('mem_warning').value);
			uci.set('system-hub', 'health', 'memory_critical', document.getElementById('mem_critical').value);
			uci.set('system-hub', 'health', 'disk_warning', document.getElementById('disk_warning').value);
			uci.set('system-hub', 'health', 'disk_critical', document.getElementById('disk_critical').value);
			uci.set('system-hub', 'health', 'temperature_warning', document.getElementById('temp_warning').value);
			uci.set('system-hub', 'health', 'temperature_critical', document.getElementById('temp_critical').value);

			return uci.save();
		}).then(function() {
			return uci.apply();
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
