'use strict';
'require view';
'require dom';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.resolve();
	},

	render: function() {
		var modules = [
			{ name: 'SecuBox Portal', version: '1.0.2', status: 'stable', desc: 'Dashboard unifie et navigation' },
			{ name: 'System Hub', version: '0.5.1', status: 'stable', desc: 'Gestion systeme centralisee' },
			{ name: 'CrowdSec Dashboard', version: '0.7.0', status: 'stable', desc: 'Protection collaborative contre les menaces' },
			{ name: 'Client Guardian', version: '0.4.0', status: 'stable', desc: 'Controle parental et gestion des appareils' },
			{ name: 'WireGuard Dashboard', version: '0.5.0', status: 'stable', desc: 'VPN WireGuard simplifie' },
			{ name: 'Network Modes', version: '0.5.0', status: 'stable', desc: 'Configuration reseau (routeur/AP/bridge)' },
			{ name: 'Bandwidth Manager', version: '0.5.0', status: 'stable', desc: 'Gestion de la bande passante' },
			{ name: 'Traffic Shaper', version: '0.4.0', status: 'stable', desc: 'QoS et priorisation du trafic' },
			{ name: 'CDN Cache', version: '0.5.0', status: 'stable', desc: 'Cache local pour jeux et mises a jour' },
			{ name: 'Auth Guardian', version: '0.4.0', status: 'stable', desc: 'Portail captif et authentification' },
			{ name: 'Media Flow', version: '0.6.3', status: 'beta', desc: 'Streaming multimedia local' },
			{ name: 'VHost Manager', version: '0.5.0', status: 'stable', desc: 'Gestion des virtual hosts' },
			{ name: 'MQTT Bridge', version: '0.4.0', status: 'stable', desc: 'Integration domotique MQTT' },
			{ name: 'Netdata Dashboard', version: '0.5.0', status: 'stable', desc: 'Monitoring en temps reel' },
			{ name: 'KSM Manager', version: '0.4.0', status: 'stable', desc: 'Optimisation memoire kernel' },
			{ name: 'Network Tweaks', version: '1.0.0', status: 'stable', desc: 'Optimisations reseau avancees' }
		];

		var planned = [
			{ name: 'Network Modes 1.0', desc: 'Mode DMZ, Bridge avance, VLAN support', eta: 'Q1 2026' },
			{ name: 'SecuBox Hub 1.0', desc: 'Gestion centralisee complete', eta: 'Q1 2026' },
			{ name: 'Multi-WAN Failover', desc: 'Basculement automatique multi-FAI', eta: 'Q2 2026' },
			{ name: 'Documentation Complete', desc: 'Guides utilisateur et developpeur', eta: 'Q2 2026' }
		];

		var changelog = [
			{ version: 'v0.15.0-rc2', date: '2026-01-16', changes: [
				'Fix CrowdSec firewall bouncer: ajout regles DROP manquantes',
				'Correction interface WAN (br-wan) dans configuration bouncer',
				'Les IPs blacklistees sont maintenant effectivement bloquees'
			]},
			{ version: 'v0.15.3', date: '2026-01', changes: [
				'Reorganisation du dashboard',
				'Console Debug deplacee vers System Hub',
				'Pages publiques Bug Bounty et Crowdfunding',
				'Correction detection auth-logger (faux positifs)',
				'Whitelist IP privees pour CrowdSec'
			]},
			{ version: 'v0.15.2', date: '2026-01', changes: [
				'Fix inscription CAPI avec credentials obsoletes',
				'Correction affichage "null" CrowdSec Dashboard',
				'Amelioration acquisition logs CrowdSec'
			]},
			{ version: 'v0.15.1', date: '2026-01', changes: [
				'Support Docker/LXC hybride pour Lyrion',
				'Permissions fichiers Network Tweaks',
				'Sync command pour local-build'
			]}
		];

		var style = E('style', {}, `
			.ds-container {
				max-width: 1200px;
				margin: 0 auto;
				padding: 20px;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			}
			.ds-header {
				text-align: center;
				margin-bottom: 40px;
				padding: 40px 20px;
				background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
				border-radius: 16px;
				color: #fff;
			}
			.ds-header h1 {
				font-size: 2.5em;
				margin: 0 0 10px 0;
			}
			.ds-header p {
				font-size: 1.2em;
				opacity: 0.9;
				margin: 0;
			}
			.ds-version-badge {
				display: inline-block;
				background: #00d4aa;
				color: #1a1a2e;
				padding: 8px 20px;
				border-radius: 20px;
				font-weight: bold;
				margin-top: 20px;
			}
			.ds-section {
				margin-bottom: 40px;
			}
			.ds-section h2 {
				font-size: 1.5em;
				margin-bottom: 20px;
				padding-bottom: 10px;
				border-bottom: 2px solid #00d4aa;
				color: #333;
			}
			.ds-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: 16px;
			}
			.ds-module-card {
				background: #fff;
				border-radius: 12px;
				padding: 20px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
				border-left: 4px solid #00d4aa;
				transition: transform 0.2s, box-shadow 0.2s;
			}
			.ds-module-card:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 16px rgba(0,0,0,0.15);
			}
			.ds-module-card.beta {
				border-left-color: #ffc107;
			}
			.ds-module-card.planned {
				border-left-color: #6c757d;
				opacity: 0.8;
			}
			.ds-module-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 8px;
			}
			.ds-module-name {
				font-weight: 600;
				font-size: 1.1em;
				color: #333;
			}
			.ds-module-version {
				font-size: 0.85em;
				color: #666;
				background: #f0f0f0;
				padding: 2px 8px;
				border-radius: 4px;
			}
			.ds-module-desc {
				color: #666;
				font-size: 0.9em;
				line-height: 1.4;
			}
			.ds-status-badge {
				display: inline-block;
				font-size: 0.75em;
				padding: 2px 8px;
				border-radius: 4px;
				text-transform: uppercase;
				font-weight: 600;
			}
			.ds-status-stable {
				background: #d4edda;
				color: #155724;
			}
			.ds-status-beta {
				background: #fff3cd;
				color: #856404;
			}
			.ds-status-planned {
				background: #e2e3e5;
				color: #383d41;
			}
			.ds-changelog {
				background: #fff;
				border-radius: 12px;
				padding: 20px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			}
			.ds-changelog-entry {
				padding: 16px 0;
				border-bottom: 1px solid #eee;
			}
			.ds-changelog-entry:last-child {
				border-bottom: none;
			}
			.ds-changelog-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10px;
			}
			.ds-changelog-version {
				font-weight: 600;
				font-size: 1.1em;
				color: #00d4aa;
			}
			.ds-changelog-date {
				font-size: 0.85em;
				color: #666;
			}
			.ds-changelog-list {
				margin: 0;
				padding-left: 20px;
				color: #555;
			}
			.ds-changelog-list li {
				margin-bottom: 4px;
			}
			.ds-links {
				display: flex;
				gap: 16px;
				flex-wrap: wrap;
				justify-content: center;
				margin-top: 30px;
			}
			.ds-link {
				display: inline-flex;
				align-items: center;
				gap: 8px;
				padding: 12px 24px;
				background: #fff;
				border-radius: 8px;
				text-decoration: none;
				color: #333;
				font-weight: 500;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
				transition: transform 0.2s;
			}
			.ds-link:hover {
				transform: translateY(-2px);
			}
			.ds-stats {
				display: flex;
				justify-content: center;
				gap: 40px;
				margin: 30px 0;
				flex-wrap: wrap;
			}
			.ds-stat {
				text-align: center;
			}
			.ds-stat-value {
				font-size: 2.5em;
				font-weight: bold;
				color: #00d4aa;
			}
			.ds-stat-label {
				font-size: 0.9em;
				color: rgba(255,255,255,0.8);
			}
			@media (prefers-color-scheme: dark) {
				.ds-section h2 { color: #eee; }
				.ds-module-card { background: #2a2a3e; }
				.ds-module-name { color: #fff; }
				.ds-module-desc { color: #aaa; }
				.ds-module-version { background: #3a3a4e; color: #ccc; }
				.ds-changelog { background: #2a2a3e; }
				.ds-changelog-list { color: #bbb; }
				.ds-link { background: #2a2a3e; color: #fff; }
			}
		`);

		return E('div', { 'class': 'ds-container' }, [
			style,

			// Header
			E('div', { 'class': 'ds-header' }, [
				E('h1', {}, 'SecuBox Development Status'),
				E('p', {}, 'Suivez l\'evolution du projet SecuBox'),
				E('div', { 'class': 'ds-stats' }, [
					E('div', { 'class': 'ds-stat' }, [
						E('div', { 'class': 'ds-stat-value' }, String(modules.length)),
						E('div', { 'class': 'ds-stat-label' }, 'Modules')
					]),
					E('div', { 'class': 'ds-stat' }, [
						E('div', { 'class': 'ds-stat-value' }, String(modules.filter(function(m) { return m.status === 'stable'; }).length)),
						E('div', { 'class': 'ds-stat-label' }, 'Stables')
					]),
					E('div', { 'class': 'ds-stat' }, [
						E('div', { 'class': 'ds-stat-value' }, String(planned.length)),
						E('div', { 'class': 'ds-stat-label' }, 'A venir')
					])
				]),
				E('div', { 'class': 'ds-version-badge' }, 'Release v0.15.3')
			]),

			// Modules actuels
			E('div', { 'class': 'ds-section' }, [
				E('h2', {}, 'Modules Disponibles'),
				E('div', { 'class': 'ds-grid' }, modules.map(function(mod) {
					return E('div', { 'class': 'ds-module-card ' + mod.status }, [
						E('div', { 'class': 'ds-module-header' }, [
							E('span', { 'class': 'ds-module-name' }, mod.name),
							E('span', { 'class': 'ds-module-version' }, mod.version)
						]),
						E('div', { 'class': 'ds-status-badge ds-status-' + mod.status }, mod.status),
						E('p', { 'class': 'ds-module-desc' }, mod.desc)
					]);
				}))
			]),

			// Modules planifies
			E('div', { 'class': 'ds-section' }, [
				E('h2', {}, 'Roadmap'),
				E('div', { 'class': 'ds-grid' }, planned.map(function(mod) {
					return E('div', { 'class': 'ds-module-card planned' }, [
						E('div', { 'class': 'ds-module-header' }, [
							E('span', { 'class': 'ds-module-name' }, mod.name),
							E('span', { 'class': 'ds-module-version' }, mod.eta)
						]),
						E('div', { 'class': 'ds-status-badge ds-status-planned' }, 'Planifie'),
						E('p', { 'class': 'ds-module-desc' }, mod.desc)
					]);
				}))
			]),

			// Changelog
			E('div', { 'class': 'ds-section' }, [
				E('h2', {}, 'Changelog'),
				E('div', { 'class': 'ds-changelog' }, changelog.map(function(entry) {
					return E('div', { 'class': 'ds-changelog-entry' }, [
						E('div', { 'class': 'ds-changelog-header' }, [
							E('span', { 'class': 'ds-changelog-version' }, entry.version),
							E('span', { 'class': 'ds-changelog-date' }, entry.date)
						]),
						E('ul', { 'class': 'ds-changelog-list' }, entry.changes.map(function(change) {
							return E('li', {}, change);
						}))
					]);
				}))
			]),

			// Liens
			E('div', { 'class': 'ds-links' }, [
				E('a', { 'class': 'ds-link', 'href': 'https://github.com/CyberMind-FR/secubox-openwrt', 'target': '_blank' }, [
					E('span', {}, 'GitHub'),
					E('span', {}, 'Code source')
				]),
				E('a', { 'class': 'ds-link', 'href': 'https://secubox.cybermood.eu', 'target': '_blank' }, [
					E('span', {}, 'Site Web'),
					E('span', {}, 'secubox.cybermood.eu')
				]),
				E('a', { 'class': 'ds-link', 'href': 'https://cybermind.fr', 'target': '_blank' }, [
					E('span', {}, 'CyberMind'),
					E('span', {}, 'Editeur')
				])
			])
		]);
	}
});
