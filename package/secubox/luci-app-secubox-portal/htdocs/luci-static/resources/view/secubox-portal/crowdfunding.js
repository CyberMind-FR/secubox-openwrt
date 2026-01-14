'use strict';
'require view';
'require dom';

/**
 * SecuBox Campagne Participative - Public Page
 * Accessible without authentication
 * Content from campaign.html
 */

return view.extend({
	title: _('SecuBox - Campagne Participative'),

	render: function() {
		// Inject CSS for public page
		var style = document.createElement('style');
		style.textContent = `
:root {
	--sb-bg: #0a0a12;
	--sb-bg-secondary: #0f1019;
	--sb-bg-card: #1a1a24;
	--sb-border: #2a2a3a;
	--sb-text: #f1f5f9;
	--sb-text-muted: #94a3b8;
	--sb-text-dim: #64748b;
	--sb-green: #10b981;
	--sb-cyan: #06b6d4;
	--sb-blue: #3b82f6;
	--sb-purple: #8b5cf6;
	--sb-orange: #f97316;
	--sb-red: #ef4444;
	--sb-gradient: linear-gradient(135deg, #10b981, #06b6d4, #3b82f6);
}
.sb-public-page {
	min-height: 100vh;
	background: linear-gradient(135deg, var(--sb-bg) 0%, var(--sb-bg-secondary) 100%);
	color: var(--sb-text);
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	padding: 2rem;
}
.sb-public-container {
	max-width: 1000px;
	margin: 0 auto;
}
.sb-public-header {
	text-align: center;
	margin-bottom: 2rem;
}
.sb-public-badge {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 20px;
	background: rgba(249,115,22,0.2);
	border: 1px solid rgba(249,115,22,0.5);
	border-radius: 30px;
	font-size: 14px;
	font-weight: 700;
	color: var(--sb-orange);
	margin-bottom: 16px;
}
.sb-public-badge-pulse {
	width: 8px;
	height: 8px;
	background: var(--sb-orange);
	border-radius: 50%;
	animation: sbPulse 2s infinite;
}
@keyframes sbPulse {
	0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
	50% { box-shadow: 0 0 0 12px rgba(249,115,22,0); }
}
.sb-public-title {
	font-size: 2.5rem;
	font-weight: 800;
	background: var(--sb-gradient);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	margin-bottom: 0.5rem;
}
.sb-public-subtitle {
	font-size: 1.1rem;
	color: var(--sb-text-muted);
	max-width: 600px;
	margin: 0 auto;
}
.sb-public-card {
	background: var(--sb-bg-card);
	border: 1px solid var(--sb-border);
	border-radius: 16px;
	padding: 2rem;
	margin-bottom: 1.5rem;
}
.sb-public-card h3 {
	color: var(--sb-cyan);
	font-size: 1.3rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
.sb-public-card p {
	color: var(--sb-text-muted);
	line-height: 1.7;
	margin-bottom: 1rem;
}
.sb-public-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 12px 24px;
	background: var(--sb-gradient);
	color: white;
	border-radius: 10px;
	text-decoration: none;
	font-weight: 700;
	transition: transform 0.2s, box-shadow 0.2s;
}
.sb-public-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(16,185,129,0.4);
}
.sb-public-btn-secondary {
	background: var(--sb-bg-card);
	border: 2px solid var(--sb-border);
}
.sb-public-btn-secondary:hover {
	border-color: var(--sb-cyan);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.sb-public-actions {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	margin-top: 1.5rem;
}
.sb-progress-card {
	background: var(--sb-bg-card);
	border: 1px solid var(--sb-border);
	border-radius: 20px;
	padding: 2rem;
	margin-bottom: 2rem;
}
.sb-progress-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	margin-bottom: 16px;
}
.sb-progress-amount {
	font-size: 2.5rem;
	font-weight: 800;
	font-family: 'JetBrains Mono', monospace;
	color: var(--sb-green);
}
.sb-progress-goal {
	font-size: 16px;
	color: var(--sb-text-muted);
}
.sb-progress-percent {
	font-size: 24px;
	font-weight: 700;
	color: var(--sb-orange);
}
.sb-progress-bar {
	height: 16px;
	background: var(--sb-bg);
	border-radius: 8px;
	overflow: hidden;
	margin-bottom: 16px;
}
.sb-progress-fill {
	height: 100%;
	background: var(--sb-gradient);
	border-radius: 8px;
	transition: width 1s ease-out;
}
.sb-progress-stats {
	display: flex;
	justify-content: space-between;
	font-size: 14px;
	color: var(--sb-text-muted);
}
.sb-progress-notice {
	margin-top: 20px;
	padding: 16px;
	background: rgba(249,115,22,0.1);
	border-radius: 10px;
	font-size: 14px;
	color: var(--sb-orange);
	text-align: center;
}
.sb-stats-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16px;
	margin-bottom: 2rem;
}
.sb-stat {
	text-align: center;
	padding: 20px;
	background: var(--sb-bg-card);
	border: 1px solid var(--sb-border);
	border-radius: 12px;
}
.sb-stat-value {
	font-size: 2rem;
	font-weight: 800;
	font-family: 'JetBrains Mono', monospace;
	color: var(--sb-green);
}
.sb-stat-label {
	font-size: 13px;
	color: var(--sb-text-muted);
	margin-top: 4px;
}
.sb-rewards-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 20px;
	margin-top: 1rem;
}
.sb-reward-card {
	background: var(--sb-bg);
	border: 2px solid var(--sb-border);
	border-radius: 16px;
	padding: 24px;
	transition: all 0.3s;
	position: relative;
}
.sb-reward-card:hover {
	transform: translateY(-4px);
	border-color: var(--sb-cyan);
}
.sb-reward-card.popular {
	border-color: var(--sb-green);
}
.sb-reward-popular-badge {
	position: absolute;
	top: -12px;
	left: 20px;
	background: var(--sb-gradient);
	color: white;
	font-size: 11px;
	font-weight: 800;
	padding: 6px 14px;
	border-radius: 20px;
}
.sb-reward-icon {
	font-size: 36px;
	margin-bottom: 12px;
}
.sb-reward-price {
	font-family: 'JetBrains Mono', monospace;
	margin-bottom: 8px;
}
.sb-reward-price .amount {
	font-size: 32px;
	font-weight: 800;
	color: var(--sb-green);
}
.sb-reward-price .currency {
	font-size: 18px;
	color: var(--sb-text-muted);
}
.sb-reward-name {
	font-size: 18px;
	font-weight: 700;
	margin-bottom: 8px;
	color: var(--sb-text);
}
.sb-reward-desc {
	font-size: 13px;
	color: var(--sb-text-muted);
	margin-bottom: 16px;
}
.sb-reward-includes {
	list-style: none;
	padding: 0;
	margin: 0 0 16px 0;
}
.sb-reward-includes li {
	font-size: 13px;
	color: var(--sb-text-muted);
	padding: 8px 0;
	display: flex;
	align-items: flex-start;
	gap: 8px;
	border-bottom: 1px solid var(--sb-border);
}
.sb-reward-includes li:last-child {
	border-bottom: none;
}
.sb-reward-includes li::before {
	content: '\\2713';
	color: var(--sb-green);
	font-weight: 700;
	flex-shrink: 0;
}
.sb-why-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	margin-top: 1rem;
}
.sb-why-card {
	background: var(--sb-bg);
	border: 1px solid var(--sb-border);
	border-radius: 12px;
	padding: 24px;
	text-align: center;
	transition: all 0.3s;
}
.sb-why-card:hover {
	transform: translateY(-4px);
	border-color: var(--sb-green);
}
.sb-why-icon {
	font-size: 36px;
	margin-bottom: 12px;
}
.sb-why-title {
	font-size: 16px;
	font-weight: 700;
	margin-bottom: 8px;
	color: var(--sb-text);
}
.sb-why-desc {
	font-size: 13px;
	color: var(--sb-text-muted);
	line-height: 1.5;
}
.sb-team-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 20px;
	margin-top: 1rem;
}
.sb-team-card {
	background: var(--sb-bg);
	border: 1px solid var(--sb-border);
	border-radius: 12px;
	padding: 24px;
	text-align: center;
}
.sb-team-avatar {
	width: 80px;
	height: 80px;
	background: var(--sb-gradient);
	border-radius: 50%;
	margin: 0 auto 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40px;
}
.sb-team-name {
	font-size: 18px;
	font-weight: 700;
	margin-bottom: 4px;
}
.sb-team-role {
	font-size: 13px;
	color: var(--sb-cyan);
	margin-bottom: 12px;
}
.sb-team-bio {
	font-size: 13px;
	color: var(--sb-text-muted);
	line-height: 1.5;
}
.sb-public-footer {
	text-align: center;
	margin-top: 3rem;
	padding-top: 2rem;
	border-top: 1px solid var(--sb-border);
	color: var(--sb-text-dim);
}
.sb-public-footer a {
	color: var(--sb-cyan);
	text-decoration: none;
}
@media (max-width: 768px) {
	.sb-stats-grid { grid-template-columns: 1fr; }
	.sb-progress-header { flex-direction: column; align-items: flex-start; gap: 8px; }
	.sb-public-title { font-size: 2rem; }
}
		`;
		document.head.appendChild(style);

		return E('div', { 'class': 'sb-public-page' }, [
			E('div', { 'class': 'sb-public-container' }, [
				// Header
				E('div', { 'class': 'sb-public-header' }, [
					E('div', { 'class': 'sb-public-badge' }, [
						E('span', { 'class': 'sb-public-badge-pulse' }),
						E('span', {}, 'Campagne Participative \u2014 Lancement Q2 2026')
					]),
					E('h1', { 'class': 'sb-public-title' }, 'Soutenez SecuBox 1.0'),
					E('p', { 'class': 'sb-public-subtitle' },
						'L\'appliance de cybers\u00e9curit\u00e9 100% open source qui embarque wizard, profils et App Store sur OpenWrt 24.10.')
				]),

				// Stats
				E('div', { 'class': 'sb-stats-grid' }, [
					E('div', { 'class': 'sb-stat' }, [
						E('div', { 'class': 'sb-stat-value' }, '20'),
						E('div', { 'class': 'sb-stat-label' }, 'Modules & Apps')
					]),
					E('div', { 'class': 'sb-stat' }, [
						E('div', { 'class': 'sb-stat-value' }, '9'),
						E('div', { 'class': 'sb-stat-label' }, 'Architectures')
					]),
					E('div', { 'class': 'sb-stat' }, [
						E('div', { 'class': 'sb-stat-value' }, '100%'),
						E('div', { 'class': 'sb-stat-label' }, 'Open Source')
					])
				]),

				// Progress
				E('div', { 'class': 'sb-progress-card' }, [
					E('div', { 'class': 'sb-progress-header' }, [
						E('div', {}, [
							E('div', { 'class': 'sb-progress-amount' }, '0 \u20ac'),
							E('div', { 'class': 'sb-progress-goal' }, 'sur 50 000 \u20ac objectif')
						]),
						E('div', { 'style': 'text-align: right;' }, [
							E('div', { 'class': 'sb-progress-percent' }, '0%'),
							E('div', { 'style': 'font-size: 13px; color: #94a3b8;' }, 'financ\u00e9')
						])
					]),
					E('div', { 'class': 'sb-progress-bar' }, [
						E('div', { 'class': 'sb-progress-fill', 'style': 'width: 0%;' })
					]),
					E('div', { 'class': 'sb-progress-stats' }, [
						E('span', {}, E('strong', {}, '0'), ' contributeurs'),
						E('span', {}, 'Lancement dans ', E('strong', {}, '~180 jours'), ' (Q2 2026)')
					]),
					E('div', { 'class': 'sb-progress-notice' },
						'\ud83d\udd27 Projet en phase d\'int\u00e9gration hardware. Inscrivez-vous pour \u00eatre notifi\u00e9 du lancement Q2 2026 et b\u00e9n\u00e9ficier des tarifs Early Bird !')
				]),

				// Rewards
				E('div', { 'class': 'sb-public-card' }, [
					E('h3', {}, ['\ud83c\udf81 ', 'Contreparties']),
					E('p', {}, 'Du simple soutien jusqu\'\u00e0 la SecuBox compl\u00e8te avec hardware GlobalScale et support premium.'),
					E('div', { 'class': 'sb-rewards-grid' }, [
						// Supporter
						E('div', { 'class': 'sb-reward-card' }, [
							E('div', { 'class': 'sb-reward-icon' }, '\ud83d\udc9a'),
							E('div', { 'class': 'sb-reward-price' }, [
								E('span', { 'class': 'amount' }, '25'),
								E('span', { 'class': 'currency' }, '\u20ac')
							]),
							E('div', { 'class': 'sb-reward-name' }, 'Supporter'),
							E('div', { 'class': 'sb-reward-desc' }, 'Soutenez le projet open source'),
							E('ul', { 'class': 'sb-reward-includes' }, [
								E('li', {}, 'Nom dans les remerciements GitHub'),
								E('li', {}, 'Badge Discord "Early Supporter"'),
								E('li', {}, 'Newsletter exclusive'),
								E('li', {}, 'Stickers SecuBox (x3)')
							])
						]),
						// Software Edition
						E('div', { 'class': 'sb-reward-card' }, [
							E('div', { 'class': 'sb-reward-icon' }, '\ud83d\udcbe'),
							E('div', { 'class': 'sb-reward-price' }, [
								E('span', { 'class': 'amount' }, '49'),
								E('span', { 'class': 'currency' }, '\u20ac')
							]),
							E('div', { 'class': 'sb-reward-name' }, 'Software Edition'),
							E('div', { 'class': 'sb-reward-desc' }, 'Tous les modules pour votre mat\u00e9riel'),
							E('ul', { 'class': 'sb-reward-includes' }, [
								E('li', {}, '20 modules & apps pr\u00e9compil\u00e9s'),
								E('li', {}, 'Image OpenWrt personnalis\u00e9e'),
								E('li', {}, 'Guide d\'installation complet'),
								E('li', {}, 'Support Discord prioritaire')
							])
						]),
						// SecuBox Lite (Popular)
						E('div', { 'class': 'sb-reward-card popular' }, [
							E('div', { 'class': 'sb-reward-popular-badge' }, '\u2b50 POPULAIRE'),
							E('div', { 'class': 'sb-reward-icon' }, '\ud83d\udce6'),
							E('div', { 'class': 'sb-reward-price' }, [
								E('span', { 'class': 'amount' }, '199'),
								E('span', { 'class': 'currency' }, '\u20ac')
							]),
							E('div', { 'class': 'sb-reward-name' }, 'SecuBox Lite'),
							E('div', { 'class': 'sb-reward-desc' }, 'L\'essentiel sur ESPRESSObin Ultra'),
							E('ul', { 'class': 'sb-reward-includes' }, [
								E('li', {}, 'ESPRESSObin Ultra (1GB RAM)'),
								E('li', {}, 'SecuBox pr\u00e9install\u00e9e'),
								E('li', {}, 'Bo\u00eetier aluminium + alimentation'),
								E('li', {}, '1 an support email')
							])
						]),
						// SecuBox Pro
						E('div', { 'class': 'sb-reward-card' }, [
							E('div', { 'class': 'sb-reward-icon' }, '\ud83d\ude80'),
							E('div', { 'class': 'sb-reward-price' }, [
								E('span', { 'class': 'amount' }, '349'),
								E('span', { 'class': 'currency' }, '\u20ac')
							]),
							E('div', { 'class': 'sb-reward-name' }, 'SecuBox Pro'),
							E('div', { 'class': 'sb-reward-desc' }, 'Performance sur Sheeva64'),
							E('ul', { 'class': 'sb-reward-includes' }, [
								E('li', {}, 'Sheeva64 (4GB RAM, 8GB eMMC)'),
								E('li', {}, 'WiFi 6 int\u00e9gr\u00e9'),
								E('li', {}, '2 ans support email prioritaire'),
								E('li', {}, '1 session RustDesk setup')
							])
						]),
						// SecuBox Ultimate
						E('div', { 'class': 'sb-reward-card' }, [
							E('div', { 'class': 'sb-reward-icon' }, '\ud83d\udc51'),
							E('div', { 'class': 'sb-reward-price' }, [
								E('span', { 'class': 'amount' }, '599'),
								E('span', { 'class': 'currency' }, '\u20ac')
							]),
							E('div', { 'class': 'sb-reward-name' }, 'SecuBox Ultimate'),
							E('div', { 'class': 'sb-reward-desc' }, 'Puissance maximale sur MOCHAbin'),
							E('ul', { 'class': 'sb-reward-includes' }, [
								E('li', {}, 'MOCHAbin (8GB RAM, NVMe)'),
								E('li', {}, 'Dual 2.5GbE + 10GbE SFP+'),
								E('li', {}, '3 ans support premium'),
								E('li', {}, 'Abonnement Pro 1 an inclus')
							])
						]),
						// Enterprise
						E('div', { 'class': 'sb-reward-card' }, [
							E('div', { 'class': 'sb-reward-icon' }, '\ud83c\udfe2'),
							E('div', { 'class': 'sb-reward-price' }, [
								E('span', { 'class': 'amount' }, '1499'),
								E('span', { 'class': 'currency' }, '\u20ac')
							]),
							E('div', { 'class': 'sb-reward-name' }, 'Pack Enterprise'),
							E('div', { 'class': 'sb-reward-desc' }, 'Solution multi-sites pour PME'),
							E('ul', { 'class': 'sb-reward-includes' }, [
								E('li', {}, '3x SecuBox Pro (Sheeva64)'),
								E('li', {}, 'VPN site-to-site pr\u00e9configur\u00e9'),
								E('li', {}, 'Formation visio 2h'),
								E('li', {}, 'Support t\u00e9l\u00e9phone 1 an')
							])
						])
					])
				]),

				// Why SecuBox
				E('div', { 'class': 'sb-public-card' }, [
					E('h3', {}, ['\ud83d\udca1 ', 'Pourquoi SecuBox ?']),
					E('p', {}, 'Une alternative open source aux appliances propri\u00e9taires co\u00fbteuses.'),
					E('div', { 'class': 'sb-why-grid' }, [
						E('div', { 'class': 'sb-why-card' }, [
							E('div', { 'class': 'sb-why-icon' }, '\ud83d\udd13'),
							E('div', { 'class': 'sb-why-title' }, '100% Open Source'),
							E('div', { 'class': 'sb-why-desc' }, 'Code sur GitHub sous licence Apache 2.0. Pas de backdoor.')
						]),
						E('div', { 'class': 'sb-why-card' }, [
							E('div', { 'class': 'sb-why-icon' }, '\ud83c\uddeb\ud83c\uddf7'),
							E('div', { 'class': 'sb-why-title' }, 'Made in France'),
							E('div', { 'class': 'sb-why-desc' }, 'Con\u00e7u par CyberMind. Support fran\u00e7ais, RGPD compliant.')
						]),
						E('div', { 'class': 'sb-why-card' }, [
							E('div', { 'class': 'sb-why-icon' }, '\ud83d\udcb0'),
							E('div', { 'class': 'sb-why-title' }, 'Prix Juste'),
							E('div', { 'class': 'sb-why-desc' }, '\u00c0 partir de 199\u20ac. Logiciel gratuit \u00e0 vie.')
						]),
						E('div', { 'class': 'sb-why-card' }, [
							E('div', { 'class': 'sb-why-icon' }, '\ud83d\udee1\ufe0f'),
							E('div', { 'class': 'sb-why-title' }, 'S\u00e9curit\u00e9 Pro'),
							E('div', { 'class': 'sb-why-desc' }, 'CrowdSec, IDS/IPS, VPN WireGuard, pare-feu avanc\u00e9.')
						]),
						E('div', { 'class': 'sb-why-card' }, [
							E('div', { 'class': 'sb-why-icon' }, '\u26a1'),
							E('div', { 'class': 'sb-why-title' }, 'Hardware ARM'),
							E('div', { 'class': 'sb-why-desc' }, 'Marvell quad-core, jusqu\'\u00e0 8GB RAM, 10GbE. < 15W.')
						]),
						E('div', { 'class': 'sb-why-card' }, [
							E('div', { 'class': 'sb-why-icon' }, '\ud83e\udd1d'),
							E('div', { 'class': 'sb-why-title' }, 'Communaut\u00e9'),
							E('div', { 'class': 'sb-why-desc' }, 'Discord, GitHub, entraide et d\u00e9veloppement collaboratif.')
						])
					])
				]),

				// Team
				E('div', { 'class': 'sb-public-card' }, [
					E('h3', {}, ['\ud83d\udc65 ', 'L\'\u00c9quipe']),
					E('div', { 'class': 'sb-team-grid' }, [
						E('div', { 'class': 'sb-team-card' }, [
							E('div', { 'class': 'sb-team-avatar' }, '\ud83e\uddd9\u200d\u2642\ufe0f'),
							E('div', { 'class': 'sb-team-name' }, 'Gandalf'),
							E('div', { 'class': 'sb-team-role' }, 'Fondateur & Lead Developer'),
							E('div', { 'class': 'sb-team-bio' }, '25+ ans d\'exp\u00e9rience en cybers\u00e9curit\u00e9. Contributeur Linux kernel, ambassadeur CrowdSec.')
						]),
						E('div', { 'class': 'sb-team-card' }, [
							E('div', { 'class': 'sb-team-avatar' }, '\ud83c\udf10'),
							E('div', { 'class': 'sb-team-name' }, 'GlobalScale'),
							E('div', { 'class': 'sb-team-role' }, 'Partenaire Hardware'),
							E('div', { 'class': 'sb-team-bio' }, 'Leader mondial des SBC ARM Marvell. Fabricant des ESPRESSObin, Sheeva64 et MOCHAbin.')
						]),
						E('div', { 'class': 'sb-team-card' }, [
							E('div', { 'class': 'sb-team-avatar' }, '\ud83d\udee1\ufe0f'),
							E('div', { 'class': 'sb-team-name' }, 'CrowdSec'),
							E('div', { 'class': 'sb-team-role' }, 'Partenaire S\u00e9curit\u00e9'),
							E('div', { 'class': 'sb-team-bio' }, 'Solution fran\u00e7aise de cybers\u00e9curit\u00e9 collaborative. 15M+ d\'IPs malveillantes partag\u00e9es.')
						])
					])
				]),

				// CTA
				E('div', { 'class': 'sb-public-card' }, [
					E('h3', {}, ['\ud83d\ude80 ', 'Rejoignez l\'Aventure']),
					E('p', {},
						'Inscrivez-vous pour \u00eatre notifi\u00e9 du lancement et b\u00e9n\u00e9ficier des tarifs Early Bird exclusifs (-20%).'),
					E('div', { 'class': 'sb-public-actions' }, [
						E('a', {
							'class': 'sb-public-btn',
							'href': 'https://secubox.cybermood.eu',
							'target': '_blank'
						}, ['\ud83c\udf10 ', 'Site Officiel']),
						E('a', {
							'class': 'sb-public-btn sb-public-btn-secondary',
							'href': 'https://github.com/CyberMind-FR/secubox-openwrt',
							'target': '_blank'
						}, ['\ud83d\udcc1 ', 'GitHub']),
						E('a', {
							'class': 'sb-public-btn sb-public-btn-secondary',
							'href': '/luci-static/secubox/index.html#modules'
						}, ['\ud83d\udcda ', 'Voir les Modules']),
						E('a', {
							'class': 'sb-public-btn sb-public-btn-secondary',
							'href': '/cgi-bin/luci/'
						}, ['\ud83d\udd12 ', 'Se Connecter'])
					])
				]),

				// Footer
				E('div', { 'class': 'sb-public-footer' }, [
					E('p', {}, [
						E('a', { 'href': 'https://cybermood.eu' }, 'CyberMood.eu'),
						' \u00a9 2025 ',
						E('a', { 'href': 'https://cybermind.fr' }, 'CyberMind.fr')
					]),
					E('p', {}, 'Open Source Apache-2.0 \u2014 \ud83c\uddeb\ud83c\uddf7 Made in France with \u2764\ufe0f')
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
