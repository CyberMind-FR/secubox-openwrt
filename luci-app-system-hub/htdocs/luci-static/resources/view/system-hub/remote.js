'use strict';
'require view';
'require dom';
'require ui';

var api = L.require('system-hub.api');

// Stub: Get remote access config (planned feature)
function getRemoteConfig() {
	return Promise.resolve({
		rustdesk_enabled: false,
		rustdesk_installed: false,
		rustdesk_id: null,
		allow_unattended: false,
		require_approval: true,
		notify_on_connect: true,
		support: {
			provider: 'CyberMind.fr',
			email: 'support@cybermind.fr',
			phone: '+33 1 23 45 67 89',
			website: 'https://cybermind.fr'
		}
	});
}

return view.extend({
	load: function() {
		return getRemoteConfig();
	},

	render: function(data) {
		var remote = data;
		var self = this;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			// RustDesk Section
			E('div', { 'class': 'sh-card sh-remote-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🖥️'), 'RustDesk - Assistance à Distance' ]),
					E('div', { 'class': 'sh-card-badge' }, remote.rustdesk_enabled ? 'Actif' : 'Inactif')
				]),
				E('div', { 'class': 'sh-card-body' }, [
					// RustDesk ID
					E('div', { 'class': 'sh-remote-id' }, [
						E('div', { 'class': 'sh-remote-id-icon' }, '🖥️'),
						E('div', {}, [
							E('div', { 'class': 'sh-remote-id-value' }, remote.rustdesk_id || '--- --- ---'),
							E('div', { 'class': 'sh-remote-id-label' }, 'ID RustDesk - Communiquez ce code au support')
						])
					]),
					
					// Settings
					this.renderToggle('🔒', 'Accès sans surveillance', 'Permettre la connexion sans approbation', remote.allow_unattended),
					this.renderToggle('✅', 'Approbation requise', 'Confirmer chaque connexion entrante', remote.require_approval),
					this.renderToggle('🔔', 'Notification de connexion', 'Recevoir une alerte à chaque session', remote.notify_on_connect),
					
					// Status
					!remote.rustdesk_installed ? E('div', { 'style': 'padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 10px; border-left: 3px solid #f59e0b; margin-top: 16px;' }, [
						E('span', { 'style': 'font-size: 20px; margin-right: 12px;' }, '⚠️'),
						E('span', {}, 'RustDesk n\'est pas installé. '),
						E('a', { 'href': '#', 'style': 'color: #6366f1;' }, 'Installer maintenant')
					]) : E('span'),
					
					// Actions
					E('div', { 'class': 'sh-btn-group' }, [
						E('button', { 
							'class': 'sh-btn sh-btn-primary',
							'click': L.bind(this.startSession, this, 'rustdesk')
						}, [ '🚀 Démarrer Session' ]),
						E('button', { 'class': 'sh-btn' }, [ '⚙️ Configurer RustDesk' ])
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
			
			// Support Contact
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📞'), 'Contact Support' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-sysinfo-grid' }, [
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Fournisseur'),
							E('span', { 'class': 'sh-sysinfo-value' }, remote.support?.provider || 'N/A')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Email'),
							E('span', { 'class': 'sh-sysinfo-value' }, remote.support?.email || 'N/A')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Téléphone'),
							E('span', { 'class': 'sh-sysinfo-value' }, remote.support?.phone || 'N/A')
						]),
						E('div', { 'class': 'sh-sysinfo-item' }, [
							E('span', { 'class': 'sh-sysinfo-label' }, 'Website'),
							E('span', { 'class': 'sh-sysinfo-value' }, remote.support?.website || 'N/A')
						])
					]),
					E('div', { 'class': 'sh-btn-group' }, [
						E('button', { 'class': 'sh-btn sh-btn-primary' }, [ '🎫 Ouvrir un Ticket' ]),
						E('button', { 'class': 'sh-btn' }, [ '📚 Documentation' ])
					])
				])
			])
		]);

		return view;
	},

	renderToggle: function(icon, label, desc, enabled) {
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
				'click': function(ev) { ev.target.classList.toggle('active'); }
			})
		]);
	},

	startSession: function(type) {
		ui.showModal(_('Démarrage Session'), [
			E('p', {}, 'Démarrage de la session ' + type + '...'),
			E('div', { 'class': 'spinning' })
		]);

		// Stub: Remote session not yet implemented
		setTimeout(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, '⚠️ Remote session feature coming soon'), 'info');
		}, 1000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
