'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require ui';
'require client-guardian.api as api';

return view.extend({
	load: function() {
		return api.callPortal();
	},

	render: function(data) {
		var portal = data;
		var self = this;

		return E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),

			E('div', { 'class': 'cg-header' }, [
				E('div', { 'class': 'cg-logo' }, [
					E('div', { 'class': 'cg-logo-icon' }, '🚪'),
					E('div', { 'class': 'cg-logo-text' }, 'Portail Captif')
				]),
				E('div', { 'class': 'cg-status-badge ' + (portal.enabled ? 'approved' : 'offline') }, [
					E('span', { 'class': 'cg-status-dot' }),
					portal.enabled ? 'Actif' : 'Inactif'
				])
			]),

			// Configuration
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '⚙️'),
						'Configuration'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '🚪'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Portail Captif'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Activer pour les zones Guest et Quarantine')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch' + (portal.enabled ? ' active' : ''),
							'id': 'toggle-portal',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '📝'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Conditions d\'utilisation'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Exiger l\'acceptation des CGU')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch' + (portal.require_terms ? ' active' : ''),
							'id': 'toggle-terms',
							'click': function() { this.classList.toggle('active'); }
						})
					]),
					E('div', { 'class': 'cg-toggle' }, [
						E('div', { 'class': 'cg-toggle-info' }, [
							E('span', { 'class': 'cg-toggle-icon' }, '📧'),
							E('div', {}, [
								E('div', { 'class': 'cg-toggle-label' }, 'Inscription'),
								E('div', { 'class': 'cg-toggle-desc' }, 'Permettre l\'auto-inscription (avec approbation)')
							])
						]),
						E('div', {
							'class': 'cg-toggle-switch' + (portal.allow_registration ? ' active' : ''),
							'id': 'toggle-registration',
							'click': function() { this.classList.toggle('active'); }
						})
					]),

					E('div', { 'class': 'cg-form-group', 'style': 'margin-top: 20px' }, [
						E('label', { 'class': 'cg-form-label' }, 'Titre du Portail'),
						E('input', {
							'type': 'text',
							'id': 'portal-title',
							'class': 'cg-input',
							'value': portal.title || 'Bienvenue sur le Réseau'
						})
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Sous-titre'),
						E('input', {
							'type': 'text',
							'id': 'portal-subtitle',
							'class': 'cg-input',
							'value': portal.subtitle || 'Veuillez vous identifier pour accéder à Internet'
						})
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Méthode d\'authentification'),
						E('select', { 'id': 'portal-auth', 'class': 'cg-input' }, [
							E('option', { 'value': 'password', 'selected': portal.auth_method === 'password' }, 'Mot de passe unique'),
							E('option', { 'value': 'voucher', 'selected': portal.auth_method === 'voucher' }, 'Codes voucher'),
							E('option', { 'value': 'click', 'selected': portal.auth_method === 'click' }, 'Click-through (acceptation CGU)')
						])
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Mot de passe Invité'),
						E('input', {
							'type': 'text',
							'id': 'portal-password',
							'class': 'cg-input',
							'value': portal.guest_password || 'guest2024'
						})
					]),
					E('div', { 'class': 'cg-form-group' }, [
						E('label', { 'class': 'cg-form-label' }, 'Couleur d\'accent'),
						E('input', {
							'type': 'color',
							'id': 'portal-color',
							'class': 'cg-input',
							'style': 'width: 80px; height: 40px; padding: 4px',
							'value': portal.accent_color || '#ef4444'
						})
					]),

					E('div', { 'class': 'cg-btn-group' }, [
						E('button', {
							'class': 'cg-btn cg-btn-primary',
							'click': L.bind(this.handleSavePortal, this)
						}, [
							E('span', {}, '💾'),
							' Enregistrer'
						])
					])
				])
			]),

			// Portal Preview
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '👁️'),
						'Aperçu du Portail'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-portal-preview', 'id': 'portal-preview' }, [
						E('div', {
							'class': 'cg-portal-preview-logo',
							'style': 'background: ' + (portal.accent_color || '#ef4444')
						}, '🛡️'),
						E('div', { 'class': 'cg-portal-preview-title', 'id': 'preview-title' },
							portal.title || 'Bienvenue sur le Réseau'
						),
						E('div', { 'class': 'cg-portal-preview-subtitle', 'id': 'preview-subtitle' },
							portal.subtitle || 'Veuillez vous identifier pour accéder à Internet'
						),
						E('input', {
							'type': 'password',
							'class': 'cg-portal-preview-input',
							'placeholder': 'Mot de passe invité'
						}),
						E('button', {
							'class': 'cg-portal-preview-btn',
							'id': 'preview-btn',
							'style': 'background: ' + (portal.accent_color || '#ef4444')
						}, 'Se Connecter')
					])
				])
			]),

			// Active Sessions
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '👥'),
						'Sessions Actives'
					]),
					E('span', { 'class': 'cg-card-badge' }, (portal.active_sessions || 0) + ' sessions')
				]),
				E('div', { 'class': 'cg-card-body' }, [
					portal.active_sessions > 0 ?
						E('p', {}, 'Liste des sessions actives...') :
						E('div', { 'class': 'cg-empty-state' }, [
							E('div', { 'class': 'cg-empty-state-icon' }, '🔒'),
							E('div', { 'class': 'cg-empty-state-title' }, 'Aucune session active'),
							E('div', { 'class': 'cg-empty-state-text' }, 'Les sessions du portail captif apparaîtront ici')
						])
				])
			])
		]);
	},

	handleSavePortal: function(ev) {
		var title = document.getElementById('portal-title').value;
		var subtitle = document.getElementById('portal-subtitle').value;
		var auth = document.getElementById('portal-auth').value;
		var password = document.getElementById('portal-password').value;
		var color = document.getElementById('portal-color').value;

		api.callUpdatePortal(title, subtitle, color, auth, password).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', {}, _('Configuration du portail enregistrée')), 'success');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
