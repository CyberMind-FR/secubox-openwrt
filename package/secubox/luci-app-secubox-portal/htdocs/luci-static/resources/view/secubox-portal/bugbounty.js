'use strict';
'require view';
'require dom';
'require secubox/kiss-theme';

/**
 * SecuBox Bug Bounty Program - Public Page
 * Accessible without authentication
 */

return view.extend({
	title: _('SecuBox Bug Bounty'),

	render: function() {
		// Inject CSS for public page
		var style = document.createElement('style');
		style.textContent = `
:root {
	--bb-bg: #0a0a12;
	--bb-bg-secondary: #0f1019;
	--bb-bg-card: #1a1a24;
	--bb-border: #2a2a3a;
	--bb-text: #f1f5f9;
	--bb-text-muted: #94a3b8;
	--bb-text-dim: #64748b;
	--bb-green: #22c55e;
	--bb-cyan: #06b6d4;
	--bb-blue: #3b82f6;
	--bb-purple: #8b5cf6;
	--bb-orange: #f97316;
	--bb-red: #ef4444;
	--bb-gradient: linear-gradient(135deg, #22c55e, #10b981);
}
.bb-public-page {
	min-height: 100vh;
	background: linear-gradient(135deg, var(--bb-bg) 0%, var(--bb-bg-secondary) 100%);
	color: var(--bb-text);
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	padding: 2rem;
}
.bb-public-container {
	max-width: 900px;
	margin: 0 auto;
}
.bb-public-header {
	text-align: center;
	margin-bottom: 2rem;
}
.bb-public-logo {
	font-size: 4rem;
	margin-bottom: 1rem;
}
.bb-public-title {
	font-size: 2.5rem;
	font-weight: 800;
	background: var(--bb-gradient);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	margin-bottom: 0.5rem;
}
.bb-public-subtitle {
	font-size: 1.1rem;
	color: var(--bb-text-muted);
	max-width: 600px;
	margin: 0 auto;
}
.bb-public-card {
	background: var(--bb-bg-card);
	border: 1px solid var(--bb-border);
	border-radius: 16px;
	padding: 2rem;
	margin-bottom: 1.5rem;
}
.bb-public-card h3 {
	color: var(--bb-green);
	font-size: 1.3rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
.bb-public-card p {
	color: var(--bb-text-muted);
	line-height: 1.7;
	margin-bottom: 1rem;
}
.bb-public-card ul {
	color: var(--bb-text-muted);
	padding-left: 1.5rem;
	margin-bottom: 1rem;
}
.bb-public-card li {
	margin-bottom: 0.5rem;
	line-height: 1.6;
}
.bb-public-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 12px 24px;
	background: var(--bb-gradient);
	color: white;
	border-radius: 10px;
	text-decoration: none;
	font-weight: 700;
	transition: transform 0.2s, box-shadow 0.2s;
}
.bb-public-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
}
.bb-public-btn-secondary {
	background: var(--bb-bg-card);
	border: 2px solid var(--bb-border);
}
.bb-public-btn-secondary:hover {
	border-color: var(--bb-green);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.bb-public-actions {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	margin-top: 1.5rem;
}
.bb-severity-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 16px;
	margin-top: 1rem;
}
.bb-severity-card {
	text-align: center;
	padding: 20px;
	background: var(--bb-bg);
	border-radius: 12px;
	border: 2px solid var(--bb-border);
	transition: all 0.3s;
}
.bb-severity-card:hover {
	transform: translateY(-4px);
}
.bb-severity-card.critical {
	border-color: var(--bb-red);
}
.bb-severity-card.critical .bb-severity-icon {
	color: var(--bb-red);
}
.bb-severity-card.high {
	border-color: var(--bb-orange);
}
.bb-severity-card.high .bb-severity-icon {
	color: var(--bb-orange);
}
.bb-severity-card.medium {
	border-color: #eab308;
}
.bb-severity-card.medium .bb-severity-icon {
	color: #eab308;
}
.bb-severity-card.low {
	border-color: var(--bb-blue);
}
.bb-severity-card.low .bb-severity-icon {
	color: var(--bb-blue);
}
.bb-severity-icon {
	font-size: 2.5rem;
	margin-bottom: 8px;
}
.bb-severity-name {
	font-size: 16px;
	font-weight: 700;
	color: var(--bb-text);
	margin-bottom: 4px;
}
.bb-severity-desc {
	font-size: 12px;
	color: var(--bb-text-muted);
}
.bb-scope-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 16px;
	margin-top: 1rem;
}
.bb-scope-item {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
	background: var(--bb-bg);
	border-radius: 10px;
	border: 1px solid var(--bb-border);
}
.bb-scope-item.in-scope {
	border-color: rgba(34, 197, 94, 0.5);
	background: rgba(34, 197, 94, 0.05);
}
.bb-scope-item.out-scope {
	border-color: rgba(239, 68, 68, 0.5);
	background: rgba(239, 68, 68, 0.05);
}
.bb-scope-icon {
	font-size: 24px;
	flex-shrink: 0;
}
.bb-scope-content {
	flex: 1;
}
.bb-scope-title {
	font-size: 14px;
	font-weight: 600;
	color: var(--bb-text);
	margin-bottom: 4px;
}
.bb-scope-desc {
	font-size: 12px;
	color: var(--bb-text-muted);
}
.bb-rewards-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;
	margin-top: 1rem;
}
.bb-reward {
	text-align: center;
	padding: 20px;
	background: rgba(34, 197, 94, 0.1);
	border-radius: 12px;
	border: 1px solid rgba(34, 197, 94, 0.3);
}
.bb-reward-icon {
	font-size: 2rem;
	margin-bottom: 8px;
}
.bb-reward-name {
	font-size: 14px;
	font-weight: 600;
	color: var(--bb-green);
	margin-bottom: 4px;
}
.bb-reward-desc {
	font-size: 12px;
	color: var(--bb-text-muted);
}
.bb-timeline {
	margin-top: 1rem;
}
.bb-timeline-item {
	display: flex;
	gap: 16px;
	padding: 16px 0;
	border-bottom: 1px solid var(--bb-border);
}
.bb-timeline-item:last-child {
	border-bottom: none;
}
.bb-timeline-time {
	font-family: 'JetBrains Mono', monospace;
	font-size: 14px;
	font-weight: 700;
	color: var(--bb-green);
	min-width: 80px;
}
.bb-timeline-desc {
	font-size: 14px;
	color: var(--bb-text-muted);
}
.bb-contact-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 20px;
	background: var(--bb-bg);
	border-radius: 12px;
	border: 1px solid var(--bb-border);
	margin-top: 1rem;
}
.bb-contact-icon {
	font-size: 2.5rem;
}
.bb-contact-content {
	flex: 1;
}
.bb-contact-title {
	font-size: 16px;
	font-weight: 700;
	color: var(--bb-text);
	margin-bottom: 4px;
}
.bb-contact-value {
	font-family: 'JetBrains Mono', monospace;
	font-size: 14px;
	color: var(--bb-cyan);
}
.bb-public-footer {
	text-align: center;
	margin-top: 3rem;
	padding-top: 2rem;
	border-top: 1px solid var(--bb-border);
	color: var(--bb-text-dim);
}
.bb-public-footer a {
	color: var(--bb-cyan);
	text-decoration: none;
}
@media (max-width: 768px) {
	.bb-public-title { font-size: 2rem; }
	.bb-contact-card { flex-direction: column; text-align: center; }
}
		`;
		document.head.appendChild(style);

		return KissTheme.wrap([E('div', { 'class': 'bb-public-page' }, [
			E('div', { 'class': 'bb-public-container' }, [
				// Header
				E('div', { 'class': 'bb-public-header' }, [
					E('div', { 'class': 'bb-public-logo' }, '\ud83d\udc1b'),
					E('h1', { 'class': 'bb-public-title' }, 'SecuBox Bug Bounty'),
					E('p', { 'class': 'bb-public-subtitle' },
						'Aidez-nous \u00e0 am\u00e9liorer la s\u00e9curit\u00e9 de SecuBox. Programme de divulgation responsable pour les chercheurs en s\u00e9curit\u00e9.')
				]),

				// Introduction
				E('div', { 'class': 'bb-public-card' }, [
					E('h3', {}, ['\ud83d\udee1\ufe0f ', 'Programme de S\u00e9curit\u00e9']),
					E('p', {},
						'SecuBox est un projet open-source d\u00e9di\u00e9 \u00e0 la s\u00e9curit\u00e9 r\u00e9seau. ' +
						'Nous encourageons les chercheurs en s\u00e9curit\u00e9 \u00e0 examiner notre code ' +
						'et \u00e0 signaler les vuln\u00e9rabilit\u00e9s de mani\u00e8re responsable.'),
					E('p', {},
						'En tant que projet open-source sous licence Apache-2.0, nous croyons en la transparence ' +
						'et la collaboration communautaire pour am\u00e9liorer la s\u00e9curit\u00e9 de notre plateforme.')
				]),

				// Severity Levels
				E('div', { 'class': 'bb-public-card' }, [
					E('h3', {}, ['\ud83d\udea8 ', 'Niveaux de S\u00e9v\u00e9rit\u00e9']),
					E('p', {}, 'Classification des vuln\u00e9rabilit\u00e9s selon leur impact potentiel :'),
					E('div', { 'class': 'bb-severity-grid' }, [
						E('div', { 'class': 'bb-severity-card critical' }, [
							E('div', { 'class': 'bb-severity-icon' }, '\ud83d\udd34'),
							E('div', { 'class': 'bb-severity-name' }, 'Critique'),
							E('div', { 'class': 'bb-severity-desc' }, 'RCE, Auth Bypass, Root Access')
						]),
						E('div', { 'class': 'bb-severity-card high' }, [
							E('div', { 'class': 'bb-severity-icon' }, '\ud83d\udfe0'),
							E('div', { 'class': 'bb-severity-name' }, '\u00c9lev\u00e9e'),
							E('div', { 'class': 'bb-severity-desc' }, 'Injection SQL, XSS Stock\u00e9')
						]),
						E('div', { 'class': 'bb-severity-card medium' }, [
							E('div', { 'class': 'bb-severity-icon' }, '\ud83d\udfe1'),
							E('div', { 'class': 'bb-severity-name' }, 'Moyenne'),
							E('div', { 'class': 'bb-severity-desc' }, 'XSS Refl\u00e9chi, CSRF, Info Leak')
						]),
						E('div', { 'class': 'bb-severity-card low' }, [
							E('div', { 'class': 'bb-severity-icon' }, '\ud83d\udfe2'),
							E('div', { 'class': 'bb-severity-name' }, 'Faible'),
							E('div', { 'class': 'bb-severity-desc' }, 'D\u00e9faut de config, Headers')
						])
					])
				]),

				// Scope
				E('div', { 'class': 'bb-public-card' }, [
					E('h3', {}, ['\ud83c\udfaf ', 'P\u00e9rim\u00e8tre']),
					E('p', {}, 'Composants inclus et exclus du programme :'),
					E('div', { 'class': 'bb-scope-grid' }, [
						// In Scope
						E('div', { 'class': 'bb-scope-item in-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u2705'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'Interface LuCI SecuBox'),
								E('div', { 'class': 'bb-scope-desc' }, 'Toutes les applications web du portail')
							])
						]),
						E('div', { 'class': 'bb-scope-item in-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u2705'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'Scripts RPCD & Backends'),
								E('div', { 'class': 'bb-scope-desc' }, 'API JSON-RPC et scripts shell')
							])
						]),
						E('div', { 'class': 'bb-scope-item in-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u2705'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'Configuration UCI'),
								E('div', { 'class': 'bb-scope-desc' }, 'Fichiers de configuration syst\u00e8me')
							])
						]),
						E('div', { 'class': 'bb-scope-item in-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u2705'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'Services R\u00e9seau'),
								E('div', { 'class': 'bb-scope-desc' }, 'CrowdSec, firewall, VPN WireGuard')
							])
						]),
						E('div', { 'class': 'bb-scope-item in-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u2705'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'Authentification'),
								E('div', { 'class': 'bb-scope-desc' }, 'Portail captif, sessions, OAuth')
							])
						]),
						// Out of Scope
						E('div', { 'class': 'bb-scope-item out-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u274c'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'Services Tiers'),
								E('div', { 'class': 'bb-scope-desc' }, 'OpenWrt core, Netdata, CrowdSec agent')
							])
						]),
						E('div', { 'class': 'bb-scope-item out-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u274c'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'DoS / DDoS'),
								E('div', { 'class': 'bb-scope-desc' }, 'Attaques par d\u00e9ni de service')
							])
						]),
						E('div', { 'class': 'bb-scope-item out-scope' }, [
							E('div', { 'class': 'bb-scope-icon' }, '\u274c'),
							E('div', { 'class': 'bb-scope-content' }, [
								E('div', { 'class': 'bb-scope-title' }, 'Social Engineering'),
								E('div', { 'class': 'bb-scope-desc' }, 'Phishing, manipulation humaine')
							])
						])
					])
				]),

				// Rewards
				E('div', { 'class': 'bb-public-card' }, [
					E('h3', {}, ['\ud83c\udfc6 ', 'Reconnaissance']),
					E('p', {},
						'En tant que projet open-source, nous ne pouvons pas offrir de r\u00e9compenses mon\u00e9taires. ' +
						'Cependant, nous reconnaissons les contributeurs de plusieurs fa\u00e7ons :'),
					E('div', { 'class': 'bb-rewards-grid' }, [
						E('div', { 'class': 'bb-reward' }, [
							E('div', { 'class': 'bb-reward-icon' }, '\ud83c\udf1f'),
							E('div', { 'class': 'bb-reward-name' }, 'Hall of Fame'),
							E('div', { 'class': 'bb-reward-desc' }, 'Mention sur notre page de remerciements')
						]),
						E('div', { 'class': 'bb-reward' }, [
							E('div', { 'class': 'bb-reward-icon' }, '\ud83d\udcdd'),
							E('div', { 'class': 'bb-reward-name' }, 'Credit CVE'),
							E('div', { 'class': 'bb-reward-desc' }, 'Attribution dans les CVE publi\u00e9es')
						]),
						E('div', { 'class': 'bb-reward' }, [
							E('div', { 'class': 'bb-reward-icon' }, '\ud83e\udd1d'),
							E('div', { 'class': 'bb-reward-name' }, 'Contribution'),
							E('div', { 'class': 'bb-reward-desc' }, 'Mention comme contributeur GitHub')
						]),
						E('div', { 'class': 'bb-reward' }, [
							E('div', { 'class': 'bb-reward-icon' }, '\ud83c\udf81'),
							E('div', { 'class': 'bb-reward-name' }, 'Swag SecuBox'),
							E('div', { 'class': 'bb-reward-desc' }, 'Stickers et goodies exclusifs')
						])
					])
				]),

				// Timeline
				E('div', { 'class': 'bb-public-card' }, [
					E('h3', {}, ['\u23f1\ufe0f ', 'D\u00e9lais de R\u00e9ponse']),
					E('p', {}, 'Notre engagement envers les chercheurs en s\u00e9curit\u00e9 :'),
					E('div', { 'class': 'bb-timeline' }, [
						E('div', { 'class': 'bb-timeline-item' }, [
							E('div', { 'class': 'bb-timeline-time' }, '< 24h'),
							E('div', { 'class': 'bb-timeline-desc' }, 'Accus\u00e9 de r\u00e9ception de votre rapport')
						]),
						E('div', { 'class': 'bb-timeline-item' }, [
							E('div', { 'class': 'bb-timeline-time' }, '< 48h'),
							E('div', { 'class': 'bb-timeline-desc' }, 'Triage initial et \u00e9valuation de la s\u00e9v\u00e9rit\u00e9')
						]),
						E('div', { 'class': 'bb-timeline-item' }, [
							E('div', { 'class': 'bb-timeline-time' }, '< 7 jours'),
							E('div', { 'class': 'bb-timeline-desc' }, 'Correction des vuln\u00e9rabilit\u00e9s critiques')
						]),
						E('div', { 'class': 'bb-timeline-item' }, [
							E('div', { 'class': 'bb-timeline-time' }, '< 30 jours'),
							E('div', { 'class': 'bb-timeline-desc' }, 'Correction des vuln\u00e9rabilit\u00e9s non-critiques')
						]),
						E('div', { 'class': 'bb-timeline-item' }, [
							E('div', { 'class': 'bb-timeline-time' }, '90 jours'),
							E('div', { 'class': 'bb-timeline-desc' }, 'Divulgation coordonn\u00e9e (si d\'accord)')
						])
					])
				]),

				// How to Report
				E('div', { 'class': 'bb-public-card' }, [
					E('h3', {}, ['\ud83d\udce7 ', 'Comment Signaler']),
					E('p', {}, 'Pour signaler une vuln\u00e9rabilit\u00e9, veuillez inclure :'),
					E('ul', {}, [
						E('li', {}, E('strong', {}, 'Description'), ' - Explication claire de la vuln\u00e9rabilit\u00e9'),
						E('li', {}, E('strong', {}, '\u00c9tapes de reproduction'), ' - Guide d\u00e9taill\u00e9 pour reproduire le probl\u00e8me'),
						E('li', {}, E('strong', {}, 'Impact'), ' - Cons\u00e9quences potentielles de l\'exploitation'),
						E('li', {}, E('strong', {}, 'Version affect\u00e9e'), ' - Version de SecuBox concern\u00e9e'),
						E('li', {}, E('strong', {}, 'Suggestion de correction'), ' (optionnel) - Si vous avez une solution')
					]),
					E('div', { 'class': 'bb-contact-card' }, [
						E('div', { 'class': 'bb-contact-icon' }, '\ud83d\udce8'),
						E('div', { 'class': 'bb-contact-content' }, [
							E('div', { 'class': 'bb-contact-title' }, 'Email S\u00e9curit\u00e9'),
							E('div', { 'class': 'bb-contact-value' }, 'devel@cybermind.fr')
						])
					]),
					E('div', { 'class': 'bb-contact-card' }, [
						E('div', { 'class': 'bb-contact-icon' }, '\ud83d\udcc1'),
						E('div', { 'class': 'bb-contact-content' }, [
							E('div', { 'class': 'bb-contact-title' }, 'GitHub Security Advisory'),
							E('div', { 'class': 'bb-contact-value' }, 'Issue priv\u00e9e sur le repo SecuBox')
						])
					])
				]),

				// CTA
				E('div', { 'class': 'bb-public-card' }, [
					E('h3', {}, ['\ud83d\ude80 ', 'Commencer']),
					E('p', {},
						'Explorez notre code source et consultez l\'\u00e9tat de d\u00e9veloppement pour identifier ' +
						'les zones n\u00e9cessitant une attention particuli\u00e8re.'),
					E('div', { 'class': 'bb-public-actions' }, [
						E('a', {
							'class': 'bb-public-btn',
							'href': 'https://github.com/CyberMind-FR/secubox-openwrt',
							'target': '_blank'
						}, ['\ud83d\udcc1 ', 'Code Source GitHub']),
						E('a', {
							'class': 'bb-public-btn bb-public-btn-secondary',
							'href': '/luci-static/secubox/index.html#modules'
						}, ['\ud83d\udcda ', 'Documentation']),
						E('a', {
							'class': 'bb-public-btn bb-public-btn-secondary',
							'href': '/cgi-bin/luci/'
						}, ['\ud83d\udd12 ', 'Se Connecter'])
					])
				]),

				// Footer
				E('div', { 'class': 'bb-public-footer' }, [
					E('p', {}, [
						E('a', { 'href': 'https://cybermood.eu' }, 'CyberMood.eu'),
						' \u00a9 2025 ',
						E('a', { 'href': 'https://cybermind.fr' }, 'CyberMind.fr')
					]),
					E('p', {}, 'Open Source Apache-2.0 \u2014 \ud83c\uddeb\ud83c\uddf7 Made in France with \u2764\ufe0f')
				])
			])
		])], 'admin/secubox/portal/bugbounty');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
