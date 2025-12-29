'use strict';
'require view';
'require dom';
'require secubox/api as API';
'require secubox/help as Help';
'require secubox/theme as Theme';
'require secubox/nav as SecuNav';

// Ensure SecuBox theme variables are loaded for this view
Theme.init();

// Load base SecuBox + help styles
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/secubox.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox/help.css')
}));

return view.extend({
	load: function() {
		return API.getStatus();
	},

	render: function(status) {
		var data = status || {};
		var helpPages = Help.getAllHelpPages();

		return E('div', { 'class': 'secubox-help-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			SecuNav.renderTabs('help'),
			this.renderHeader(data),
			this.renderHero(data),
			this.renderHelpCatalog(helpPages),
			this.renderSupportSection(),
			this.renderFooter()
		]);
	},

	renderHero: function(status) {
		return E('div', { 'class': 'secubox-card secubox-help-hero' }, [
			E('div', { 'class': 'secubox-help-hero-text' }, [
				E('span', { 'class': 'secubox-help-eyebrow' }, _('Bonus Tab')),
				E('h2', {}, _('Help à SecuBox')),
				E('p', { 'class': 'secubox-help-subtitle' },
					_('Retrouvez la documentation, les guides et toutes les façons de soutenir la suite SecuBox.')),
				E('div', { 'class': 'secubox-help-hero-stats' }, [
					this.renderHeroStat('📦', _('Modules Couvert•e•s'), Object.keys(Help.getAllHelpPages()).length),
					this.renderHeroStat('⚙️', _('Version Actuelle'), status.version || 'v1.0.0'),
					this.renderHeroStat('🌐', _('Site Officiel'), 'secubox.cybermood.eu')
				])
			]),
			E('div', { 'class': 'secubox-help-hero-actions' }, [
				Help.createHelpButton('secubox', 'header', {
					icon: '📚',
					label: _('Ouvrir la knowledge base'),
					modal: true
				}),
				E('a', {
					'class': 'sb-help-btn sb-help-header secubox-help-cta',
					'href': 'https://secubox.cybermood.eu/#contact',
					'target': '_blank'
				}, [
					E('span', { 'class': 'sb-help-icon' }, '🤝'),
					E('span', { 'class': 'sb-help-label' }, _('Contacter SecuBox'))
				])
			])
		]);
	},

	renderHeroStat: function(icon, label, value) {
		return E('div', { 'class': 'secubox-help-hero-stat' }, [
			E('div', { 'class': 'secubox-help-hero-stat-icon' }, icon),
			E('div', { 'class': 'secubox-help-hero-stat-value' }, value),
			E('div', { 'class': 'secubox-help-hero-stat-label' }, label)
		]);
	},

	renderHelpCatalog: function(pages) {
		var self = this;
		var entries = Object.keys(pages || {});

		return E('div', { 'class': 'secubox-card' }, [
			E('div', { 'class': 'secubox-card-title-row' }, [
				E('h3', { 'class': 'secubox-card-title' }, '📘 ' + _('Documentation Express')),
				E('span', { 'class': 'secubox-card-hint' },
					_('Chaque tuile ouvre la doc dédiée dans un nouvel onglet.'))
			]),
			E('div', { 'class': 'secubox-help-grid' },
				entries.map(function(key) {
					return self.renderHelpCard(key, pages[key]);
				})
			)
		]);
	},

	renderHelpCard: function(key, url) {
		var info = this.getModuleInfo(key);

		return E('a', {
			'class': 'secubox-help-card',
			'href': url,
			'target': '_blank'
		}, [
			E('div', { 'class': 'secubox-help-card-icon' }, info.icon),
			E('div', { 'class': 'secubox-help-card-body' }, [
				E('h4', { 'class': 'secubox-help-card-title' }, info.title),
				E('p', { 'class': 'secubox-help-card-text' }, info.description || _('Guide officiel et FAQ.'))
			]),
			E('span', { 'class': 'secubox-help-card-link' }, _('Voir la doc →'))
		]);
	},

	renderSupportSection: function() {
		var items = [
			{
				icon: '💬',
				title: _('Feedback & idées'),
				text: _('Partagez vos retours via GitHub Issues ou email pour faire évoluer les modules.')
			},
			{
				icon: '🛠️',
				title: _('Contribuer au code'),
				text: _('Forkez le dépôt SecuBox, proposez des améliorations, corrigez des bugs, créez de nouveaux helpers.')
			},
			{
				icon: '🤗',
				title: _('Soutenir le projet'),
				text: _('Commandes pro, sponsoring ou partenariats : contactez CyberMind.fr pour renforcer SecuBox.')
			}
		];

		return E('div', { 'class': 'secubox-card secubox-help-support' }, [
			E('h3', { 'class': 'secubox-card-title' }, '🤝 ' + _('Comment aider SecuBox ?')),
			E('div', { 'class': 'secubox-help-support-grid' },
				items.map(function(item) {
					return E('div', { 'class': 'secubox-help-support-item' }, [
						E('div', { 'class': 'secubox-help-support-icon' }, item.icon),
						E('div', { 'class': 'secubox-help-support-title' }, item.title),
						E('p', { 'class': 'secubox-help-support-text' }, item.text)
					]);
				})
			),
			E('div', { 'class': 'secubox-help-support-actions' }, [
				Help.createHelpButton('secubox', 'footer', {
					icon: '💡',
					label: _('Ouvrir la FAQ')
				}),
				E('a', {
					'class': 'sb-help-btn sb-help-footer',
					'href': 'mailto:contact@cybermind.fr?subject=SecuBox%20Feedback'
				}, [
					E('span', { 'class': 'sb-help-icon' }, '✉️'),
					E('span', { 'class': 'sb-help-label' }, _('Écrire à l’équipe'))
				])
			])
		]);
	},

	renderFooter: function() {
		return E('div', { 'class': 'secubox-help-footer' }, [
			E('div', { 'class': 'secubox-help-footer-text' },
				_('Besoin d’un accompagnement premium ? SecuBox peut être intégré, maintenu et personnalisé par CyberMind.fr.')),
			E('div', { 'class': 'secubox-help-footer-links' }, [
				E('a', {
					'href': 'https://secubox.cybermood.eu/',
					'target': '_blank'
				}, _('Découvrir le site vitrine')),
				E('span', { 'class': 'sep' }, '•'),
				E('a', {
					'href': 'https://github.com/CyberMindStudio/secubox-openwrt',
					'target': '_blank'
				}, _('GitHub SecuBox'))
			])
		]);
	},

	getModuleInfo: function(key) {
		var titles = {
			'secubox': { title: _('SecuBox Hub'), icon: '🚀', description: _('Vue d’ensemble, modules et roadmap.') },
			'system-hub': { title: _('System Hub'), icon: '⚙️', description: _('Surveillance système et diagnostics.') },
			'network-modes': { title: _('Network Modes'), icon: '🌐', description: _('Guides de bascule et scénarios réseau.') },
			'client-guardian': { title: _('Client Guardian'), icon: '🛡️', description: _('Portail captif et NAC avancé.') },
			'bandwidth-manager': { title: _('Bandwidth Manager'), icon: '📶', description: _('QoS, classes et quotas réseau.') },
			'cdn-cache': { title: _('CDN Cache'), icon: '🗄️', description: _('Cache CDN local et politiques.') },
			'traffic-shaper': { title: _('Traffic Shaper'), icon: '🌀', description: _('Profils et préréglages QoS.') },
			'wireguard-dashboard': { title: _('WireGuard Dashboard'), icon: '🛜', description: _('Peers, profils et QR codes.') },
			'crowdsec-dashboard': { title: _('CrowdSec Dashboard'), icon: '🕵️', description: _('Décisions, bouncers et alertes.') },
			'netdata-dashboard': { title: _('Netdata Dashboard'), icon: '📊', description: _('Monitoring temps réel Netdata.') },
			'netifyd-dashboard': { title: _('Netifyd Dashboard'), icon: '🔍', description: _('DPI, flux et risques applications.') },
			'auth-guardian': { title: _('Auth Guardian'), icon: '🔐', description: _('Auth portail, vouchers et OAuth.') },
			'vhost-manager': { title: _('VHost Manager'), icon: '🧩', description: _('Virtual hosts, SSL & redirections.') },
			'ksm-manager': { title: _('KSM Manager'), icon: '🔑', description: _('Gestion clés et secrets sécurisés.') },
			'media-flow': { title: _('Media Flow'), icon: '🎬', description: _('Analytique streaming & clients.') }
		};

		var fallbackTitle = key.replace(/-/g, ' ').replace(/\b\w/g, function(c) {
			return c.toUpperCase();
		});

		return titles[key] || {
			title: fallbackTitle,
			icon: '📄',
			description: _('Documentation officielle')
		};
	},

	renderHeaderChip: function(icon, label, value) {
		return E('div', { 'class': 'sh-header-chip' }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, value.toString())
			])
		]);
	}
});
