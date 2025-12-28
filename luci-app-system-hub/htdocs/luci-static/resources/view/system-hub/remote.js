'use strict';
'require view';
'require dom';
'require ui';

var api = L.require('system-hub.api');

return view.extend({
	load: function() {
		return api.remoteStatus();
	},

	render: function(remote) {
		this.remote = remote || {};

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			// RustDesk Section
			E('div', { 'class': 'sh-card sh-remote-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🖥️'), 'RustDesk - Assistance à Distance' ]),
					E('div', { 'class': 'sh-card-badge' }, remote.enabled ? 'Actif' : 'Inactif')
				]),
				E('div', { 'class': 'sh-card-body' }, [
					// RustDesk ID
					E('div', { 'class': 'sh-remote-id' }, [
						E('div', { 'class': 'sh-remote-id-icon' }, '🖥️'),
						E('div', {}, [
							E('div', { 'class': 'sh-remote-id-value', 'id': 'remote-id-value' }, remote.id || '--- --- ---'),
							E('div', { 'class': 'sh-remote-id-label' }, 'ID RustDesk - Communiquez ce code au support')
						])
					]),
					
					// Settings
					this.renderToggle('🔒', 'Accès sans surveillance', 'Permettre la connexion sans approbation', remote.allow_unattended, 'allow_unattended'),
					this.renderToggle('✅', 'Approbation requise', 'Confirmer chaque connexion entrante', remote.require_approval, 'require_approval'),
					this.renderToggle('🔔', 'Notification de connexion', 'Recevoir une alerte à chaque session', remote.notify_on_connect, 'notify_on_connect'),
					
					// Status
					!remote.installed ? E('div', { 'style': 'padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 10px; border-left: 3px solid #f59e0b; margin-top: 16px;' }, [
						E('span', { 'style': 'font-size: 20px; margin-right: 12px;' }, '⚠️'),
						E('span', {}, 'RustDesk n\'est pas installé. '),
						E('a', { 'href': '#', 'style': 'color: #6366f1;', 'click': L.bind(this.installRustdesk, this) }, 'Installer maintenant')
					]) : E('div', { 'style': 'padding: 10px; background: rgba(34,197,94,0.12); border-radius: 10px; margin-top: 16px;' }, [
						E('span', { 'style': 'font-size: 20px; margin-right: 12px;' }, remote.running ? '🟢' : '🟠'),
						E('span', {}, remote.running ? 'Service RustDesk en cours d\'exécution' : 'Service installé mais arrêté')
					]),
					
					// Actions
					E('div', { 'class': 'sh-btn-group' }, [
						E('button', { 
							'class': 'sh-btn sh-btn-primary',
							'click': L.bind(this.showCredentials, this)
						}, [ '🔑 Identifiants' ]),
						E('button', { 
							'class': 'sh-btn',
							'click': L.bind(this.toggleService, this)
						}, [ remote.running ? '⏹️ Arrêter' : '▶️ Démarrer' ])
					])
				])
			]),
			
			// SSH Section
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🔐'), 'Accès SSH' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-sysinfo-grid' }, [
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Status'),
							E('span', { 'class': 'sh-sysinfo-value', 'style': 'color: #22c55e;' }, 'Actif')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Port'),
							E('span', { 'class': 'sh-sysinfo-value' }, '22')
						])
					]),
					E('div', { 'style': 'margin-top: 16px; padding: 14px; background: #0a0a0f; border-radius: 8px; font-family: monospace; font-size: 12px; color: #a0a0b0;' }, [
						'ssh root@', E('span', { 'style': 'color: #6366f1;' }, '192.168.1.1')
					])
				])
			]),
			
			// Support Contact (static)
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📞'), 'Contact Support' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-sysinfo-grid' }, [
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Fournisseur'),
							E('span', { 'class': 'sh-sysinfo-value' }, 'CyberMind.fr')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Email'),
							E('span', { 'class': 'sh-sysinfo-value' }, 'support@cybermind.fr')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Téléphone'),
							E('span', { 'class': 'sh-sysinfo-value' }, '+33 1 23 45 67 89')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Website'),
							E('span', { 'class': 'sh-sysinfo-value' }, 'https://cybermind.fr')
						])
					])
				])
			])
		]);

		return view;
	},

	renderToggle: function(icon, label, desc, enabled, field) {
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
				'data-field': field,
				'click': L.bind(function(ev) { 
					ev.target.classList.toggle('active');
					this.saveSettings();
				}, this)
			})
		]);
	},

	showCredentials: function() {
		ui.showModal(_('Identifiants RustDesk'), [
			E('p', {}, 'Récupération en cours…'),
			E('div', { 'class': 'spinning' })
		]);
		api.remoteCredentials().then(function(result) {
			ui.hideModal();
			ui.showModal(_('Identifiants RustDesk'), [
				E('div', { 'style': 'font-size:18px; margin-bottom:8px;' }, 'ID: ' + (result.id || '---')),
				E('div', { 'style': 'font-size:18px;' }, 'Mot de passe: ' + (result.password || '---')),
				E('div', { 'class': 'sh-btn-group', 'style': 'margin-top:16px;' }, [
					E('button', { 'class': 'sh-btn sh-btn-primary', 'click': ui.hideModal }, 'Fermer')
				])
			]);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	toggleService: function() {
		if (!this.remote || !this.remote.installed) return;
		var action = this.remote.running ? 'stop' : 'start';
		api.remoteServiceAction(action).then(L.bind(function(res) {
			if (res.success) {
				this.reload();
				ui.addNotification(null, E('p', {}, '✅ ' + action), 'info');
			} else {
				ui.addNotification(null, E('p', {}, res.error || 'Action impossible'), 'error');
			}
		}, this));
	},

	installRustdesk: function(ev) {
		ev.preventDefault();
		ui.showModal(_('Installation'), [
			E('p', {}, 'Installation de RustDesk…'),
			E('div', { 'class': 'spinning' })
		]);
		api.remoteInstall().then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, result.message || 'Installé'), 'info');
				this.reload();
			} else {
				ui.addNotification(null, E('p', {}, result.error || 'Installation impossible'), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	saveSettings: function() {
		var allow = document.querySelector('[data-field="allow_unattended"]').classList.contains('active') ? 1 : 0;
		var require = document.querySelector('[data-field="require_approval"]').classList.contains('active') ? 1 : 0;
		var notify = document.querySelector('[data-field="notify_on_connect"]').classList.contains('active') ? 1 : 0;

		api.remoteSaveSettings({
			allow_unattended: allow,
			require_approval: require,
			notify_on_connect: notify
		});
	},

	reload: function() {
		this.load().then(L.bind(function(data) {
			var node = this.render(data);
			var root = document.querySelector('.system-hub-dashboard');
			if (root && root.parentNode) {
				root.parentNode.replaceChild(node, root);
			}
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
