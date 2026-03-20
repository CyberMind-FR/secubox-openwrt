# Guide d'Implementation des Modules SecuBox

> **Langues:** [English](../docs/module-implementation-guide.md) | **Francais** | [中文](../docs-zh/module-implementation-guide.md)

**Version :** 1.0.0
**Derniere mise a jour :** 2025-12-28
**Statut :** Actif
**Objectif :** Guide complet pour regenerer les modules SecuBox correspondant a la demo live

---

## Voir aussi

- **Briefing d'automatisation :** [CODEX.md](codex.md)
- **Prompts de modules :** [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
- **Modeles de code :** [CODE-TEMPLATES.md](code-templates.md)
- **Commandes rapides :** [QUICK-START.md](quick-start.md)

---

## Navigation rapide

- **[FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)** - Specifications completes des fonctionnalites pour les 15 modules
- **[CODE-TEMPLATES.md](code-templates.md)** - Modeles de code prets a l'emploi et exemples d'implementation
- **[DEVELOPMENT-GUIDELINES.md](development-guidelines.md)** - Guide de developpement complet et systeme de design
- **[QUICK-START.md](quick-start.md)** - Reference rapide pour les taches courantes
- **[CLAUDE.md](claude.md)** - Reference du systeme de build et de l'architecture

---

## Apercu du document

Ce guide vous montre comment utiliser la documentation complete pour regenerer ou creer des modules SecuBox correspondant a la demo live sur **secubox.cybermood.eu**.

### Contenu

1. **Specifications fonctionnelles** - Exigences detaillees pour les 15 modules
2. **Modeles de code** - Exemples d'implementation fonctionnels
3. **Systeme de design** - Variables CSS, typographie, composants
4. **Outils de validation** - Tests automatises et corrections
5. **Scripts de deploiement** - Build local et deploiement distant

---

## Workflow d'implementation

### Etape 1 : Choisissez votre approche

**Option A : Utiliser Claude.ai pour la generation de code**
1. Ouvrez [claude.ai](https://claude.ai)
2. Copiez le prompt de module pertinent depuis [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
3. Collez le prompt et demandez l'implementation
4. Claude generera tous les fichiers requis selon les modeles
5. Examinez et integrez le code genere

**Option B : Implementation manuelle avec les modeles**
1. Copiez les modeles depuis [CODE-TEMPLATES.md](code-templates.md)
2. Remplacez les placeholders par les valeurs specifiques au module
3. Implementez la logique specifique au module
4. Validez et testez

**Option C : Approche hybride (Recommandee)**
1. Utilisez Claude.ai pour la generation initiale du code
2. Affinez avec les modeles et les guidelines
3. Validez avec les outils automatises
4. Deployez et testez sur l'appareil cible

---

## Pas a pas : Regenerer un module avec Claude.ai

### Exemple : Regeneration du module System Hub

#### 1. Rassembler le contexte

Avant de prompter Claude, rassemblez ces ressources :

```bash
# Lire la specification du module
cat FEATURE-REGENERATION-PROMPTS.md | grep -A 200 "System Hub"

# Examiner le systeme de design
cat DEVELOPMENT-GUIDELINES.md | grep -A 100 "Design System"

# Verifier l'implementation existante (si disponible)
ls -la luci-app-system-hub/
```

#### 2. Preparer le prompt

Creez un prompt complet pour Claude.ai :

```
Je dois implementer le module System Hub pour le framework LuCI d'OpenWrt.

CONTRAINTES IMPORTANTES :
- OpenWrt utilise le framework LuCI (pas React/Vue)
- JavaScript utilise le pattern L.view.extend() (pas les modules ES6)
- Le backend est RPCD (scripts shell) communiquant via ubus
- Le CSS doit utiliser les variables de system-hub/common.css
- Tout le code doit etre pret pour la production et correspondre a la demo live
- Suivre exactement le systeme de design

EXIGENCES TECHNIQUES :
- Le script RPCD DOIT etre nomme : luci.system-hub
- Les chemins de menu DOIVENT correspondre aux emplacements des fichiers de vue
- Utiliser les variables CSS (--sh-*) pour toutes les couleurs
- Supporter le mode sombre avec [data-theme="dark"]
- Implementer une gestion d'erreur appropriee
- Ajouter des etats de chargement pour les operations asynchrones

DOCUMENTS DE REFERENCE :
1. Demo live : https://secubox.cybermood.eu/system-hub
2. Specification fonctionnelle : [coller depuis FEATURE-REGENERATION-PROMPTS.md]
3. Modeles de code : [coller les modeles pertinents de CODE-TEMPLATES.md]

Veuillez fournir :
1. Fichiers JavaScript de vue complets (overview.js, services.js, etc.)
2. Script RPCD backend (luci.system-hub)
3. Module API (system-hub/api.js)
4. Styles CSS (system-hub/dashboard.css)
5. Configuration JSON du menu
6. Configuration JSON des ACL

Assurez-vous que tout le code correspond au design visuel et aux fonctionnalites de la demo live.
```

#### 3. Generer le code

Collez votre prompt dans Claude.ai et laissez-le generer l'implementation.

#### 4. Examiner le code genere

Verifiez le code genere par rapport a ces exigences :

**Checklist du module API :**
- [ ] Utilise `'use strict';`
- [ ] Requiert `baseclass` et `rpc`
- [ ] Toutes les methodes RPC utilisent `rpc.declare()`
- [ ] Les noms d'objets correspondent au nom du script RPCD (`luci.system-hub`)
- [ ] Fonctions d'aide incluses si necessaire
- [ ] Exporte depuis `baseclass.extend()`

**Checklist du module View :**
- [ ] Etend `view.extend()`
- [ ] Implemente la methode `load()` retournant une Promise
- [ ] Implemente la methode `render(data)`
- [ ] Utilise l'aide `E()` pour la construction DOM
- [ ] Implemente `poll.add()` pour l'auto-rafraichissement
- [ ] Gestion d'erreur appropriee avec try/catch
- [ ] Utilise `ui.showModal()` pour les etats de chargement
- [ ] Utilise `ui.addNotification()` pour les retours utilisateur

**Checklist du backend RPCD :**
- [ ] Commence par `#!/bin/sh`
- [ ] Source `/lib/functions.sh` et `/usr/share/libubox/jshn.sh`
- [ ] Implemente le cas `list` avec les declarations de methodes
- [ ] Implemente le cas `call` avec le routage des methodes
- [ ] Toutes les methodes produisent du JSON valide avec les fonctions `json_*`
- [ ] Validation appropriee des parametres
- [ ] Gestion d'erreur avec messages appropries

**Checklist du JSON Menu :**
- [ ] Les chemins suivent `admin/secubox/<category>/<module>`
- [ ] La premiere entree utilise `"type": "firstchild"`
- [ ] Les entrees de vue utilisent `"type": "view"` avec le bon `"path"`
- [ ] Les chemins correspondent aux emplacements des fichiers de vue
- [ ] Valeurs `"order"` appropriees pour le positionnement du menu
- [ ] Depend de la bonne entree ACL

**Checklist du JSON ACL :**
- [ ] Le nom de l'entree correspond au nom du package
- [ ] Toutes les methodes de lecture listees sous `"read"."ubus"`
- [ ] Toutes les methodes d'ecriture listees sous `"write"."ubus"`
- [ ] Les noms d'objets ubus correspondent au nom du script RPCD
- [ ] Acces a la config UCI accorde si necessaire

**Checklist CSS :**
- [ ] Importe `system-hub/common.css`
- [ ] Utilise les variables CSS (`var(--sh-*)`)
- [ ] Supporte le mode sombre avec `[data-theme="dark"]`
- [ ] Layouts de grille responsive
- [ ] Transitions et animations fluides
- [ ] JetBrains Mono pour les valeurs numeriques

#### 5. Integrer dans le codebase

```bash
# Creer la structure de repertoires du module
mkdir -p luci-app-system-hub/htdocs/luci-static/resources/system-hub
mkdir -p luci-app-system-hub/htdocs/luci-static/resources/view/system-hub
mkdir -p luci-app-system-hub/root/usr/libexec/rpcd
mkdir -p luci-app-system-hub/root/usr/share/luci/menu.d
mkdir -p luci-app-system-hub/root/usr/share/rpcd/acl.d

# Copier les fichiers generes aux emplacements appropries
# (Copier depuis la sortie de Claude vers les fichiers respectifs)

# Rendre le script RPCD executable
chmod +x luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub
```

#### 6. Valider l'implementation

```bash
# Corriger les permissions d'abord (CRITIQUE)
./secubox-tools/fix-permissions.sh --local

# Executer la validation complete (7 verifications)
./secubox-tools/validate-modules.sh

# Sortie attendue :
# Toutes les verifications passees
# OU
# Erreurs trouvees avec instructions de correction specifiques
```

#### 7. Build local

```bash
# Build d'un seul module
./secubox-tools/local-build.sh build luci-app-system-hub

# Ou build de tous les modules
./secubox-tools/local-build.sh build

# Ou validation complete + build
./secubox-tools/local-build.sh full
```

#### 8. Deployer sur le routeur de test

```bash
# Transferer le package
scp build/x86-64/luci-app-system-hub*.ipk root@192.168.1.1:/tmp/

# Installer sur le routeur
ssh root@192.168.1.1 << 'EOF'
opkg install /tmp/luci-app-system-hub*.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
EOF

# Corriger les permissions sur le routeur deploye (si necessaire)
./secubox-tools/fix-permissions.sh --remote
```

#### 9. Tester dans le navigateur

1. Naviguez vers `http://192.168.1.1/cgi-bin/luci`
2. Allez dans SecuBox -> System -> System Hub
3. Verifiez :
   - La page se charge sans erreurs
   - Les donnees s'affichent correctement
   - Les actions fonctionnent (boutons, formulaires)
   - L'auto-rafraichissement met a jour les donnees
   - Le style correspond a la demo
   - Le mode sombre fonctionne
   - Le design responsive fonctionne sur mobile

#### 10. Iterer et affiner

Si des problemes sont trouves :
1. Verifiez la console du navigateur pour les erreurs JavaScript
2. Verifiez les logs du routeur : `ssh root@192.168.1.1 "logread | tail -50"`
3. Verifiez que les methodes RPCD fonctionnent : `ubus call luci.system-hub status`
4. Corrigez les problemes dans les fichiers locaux
5. Reconstruisez et redeployez
6. Testez a nouveau

---

## Patterns d'implementation courants

### Pattern 1 : Dashboard multi-onglets

**Exemple :** System Hub avec 9 onglets

```javascript
// Dans render()
var tabs = [
	{ id: 'overview', title: 'Vue d\'ensemble', icon: '🏠' },
	{ id: 'services', title: 'Services', icon: '⚙️' },
	{ id: 'logs', title: 'Logs', icon: '📋' }
];

var activeTab = 'overview';

// Rendre la navigation par onglets
var tabNav = E('div', { 'class': 'sh-nav-tabs' },
	tabs.map(function(tab) {
		return E('div', {
			'class': 'sh-nav-tab' + (activeTab === tab.id ? ' active' : ''),
			'click': function() {
				// Logique de changement d'onglet
				document.querySelectorAll('.sh-nav-tab').forEach(function(t) {
					t.classList.remove('active');
				});
				this.classList.add('active');
				// Afficher/masquer le contenu de l'onglet
			}
		}, [
			E('span', {}, tab.icon),
			E('span', {}, tab.title)
		]);
	})
);

// Rendre le contenu de l'onglet
var tabContent = E('div', { 'class': 'tab-content' }, [
	// Onglet overview
	E('div', { 'class': 'tab-pane' + (activeTab === 'overview' ? ' active' : ''), 'data-tab': 'overview' }, [
		this.renderOverviewContent()
	]),
	// Onglet services
	E('div', { 'class': 'tab-pane' + (activeTab === 'services' ? ' active' : ''), 'data-tab': 'services' }, [
		this.renderServicesContent()
	])
]);
```

### Pattern 2 : Onglets de filtre avec filtrage de donnees

**Exemple :** Grille de modules SecuBox avec filtrage par categorie

```javascript
// Onglets de filtre
var filterTabs = E('div', { 'class': 'sh-filter-tabs' }, [
	E('div', {
		'class': 'sh-filter-tab active',
		'data-filter': 'all',
		'click': function(ev) {
			document.querySelectorAll('.sh-filter-tab').forEach(function(t) {
				t.classList.remove('active');
			});
			this.classList.add('active');
			self.filterModules('all');
		}
	}, [
		E('span', { 'class': 'sh-tab-icon' }, '📦'),
		E('span', { 'class': 'sh-tab-label' }, 'Tous')
	]),
	E('div', {
		'class': 'sh-filter-tab',
		'data-filter': 'security',
		'click': function(ev) {
			document.querySelectorAll('.sh-filter-tab').forEach(function(t) {
				t.classList.remove('active');
			});
			this.classList.add('active');
			self.filterModules('security');
		}
	}, [
		E('span', { 'class': 'sh-tab-icon' }, '🛡️'),
		E('span', { 'class': 'sh-tab-label' }, 'Securite')
	])
]);

// Fonction de filtrage
filterModules: function(category) {
	var modules = document.querySelectorAll('.module-card');
	modules.forEach(function(module) {
		if (category === 'all' || module.dataset.category === category) {
			module.style.display = 'block';
		} else {
			module.style.display = 'none';
		}
	});
}
```

### Pattern 3 : Visualiseur de logs en temps reel

**Exemple :** Onglet logs du System Hub

```javascript
// Vue des logs avec auto-scroll et auto-rafraichissement
renderLogsTab: function() {
	var self = this;
	var autoScroll = true;
	var autoRefresh = true;
	var refreshInterval = 5; // secondes

	var logsContainer = E('div', { 'class': 'logs-container' });

	// Charger les logs
	var loadLogs = function() {
		API.getLogs(100, '').then(function(result) {
			var logs = result.logs || [];

			dom.content(logsContainer,
				logs.map(function(log) {
					return E('div', { 'class': 'log-line' }, log);
				})
			);

			// Auto-scroll vers le bas
			if (autoScroll) {
				logsContainer.scrollTop = logsContainer.scrollHeight;
			}
		});
	};

	// Chargement initial
	loadLogs();

	// Auto-rafraichissement
	if (autoRefresh) {
		setInterval(loadLogs, refreshInterval * 1000);
	}

	return E('div', {}, [
		// Controles
		E('div', { 'class': 'logs-controls' }, [
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': autoScroll,
					'change': function() { autoScroll = this.checked; }
				}),
				' Auto-scroll'
			]),
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': autoRefresh,
					'change': function() { autoRefresh = this.checked; }
				}),
				' Auto-rafraichissement'
			]),
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'click': loadLogs
			}, 'Rafraichir maintenant')
		]),
		// Affichage des logs
		logsContainer
	]);
}
```

### Pattern 4 : Boutons d'action avec confirmation

**Exemple :** Boutons de gestion des services

```javascript
// Rendre un bouton d'action avec confirmation
renderActionButton: function(service, action, label, btnClass) {
	var self = this;

	return E('button', {
		'class': 'sh-btn ' + btnClass,
		'click': function(ev) {
			// Afficher la modale de confirmation
			ui.showModal(_('Confirmer l\'action'), [
				E('p', {}, _('Etes-vous sur de vouloir %s le service %s ?').format(action, service)),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'sh-btn sh-btn-secondary',
						'click': ui.hideModal
					}, _('Annuler')),
					E('button', {
						'class': 'sh-btn sh-btn-primary',
						'click': function() {
							ui.hideModal();
							self.performServiceAction(service, action);
						}
					}, _('Confirmer'))
				])
			]);
		}
	}, label);
},

// Executer l'action sur le service
performServiceAction: function(service, action) {
	var self = this;

	ui.showModal(_('Action en cours'), [
		E('p', {}, E('em', { 'class': 'spinning' }, _('Veuillez patienter...')))
	]);

	API.serviceAction(service, action).then(function(result) {
		ui.hideModal();

		if (result.success) {
			ui.addNotification(null, E('p', _('Action completee avec succes')), 'success');
			self.handleRefresh();
		} else {
			ui.addNotification(null, E('p', _('Action echouee : %s').format(result.message)), 'error');
		}
	}).catch(function(error) {
		ui.hideModal();
		ui.addNotification(null, E('p', _('Erreur : %s').format(error.message)), 'error');
	});
}
```

### Pattern 5 : Formulaire avec validation

**Exemple :** Page de parametres

```javascript
renderSettingsForm: function() {
	var self = this;
	var settings = this.settingsData || {};

	return E('form', { 'class': 'settings-form' }, [
		// Champ texte
		E('div', { 'class': 'form-group' }, [
			E('label', {}, 'Nom d\'hote'),
			E('input', {
				'type': 'text',
				'class': 'form-control',
				'value': settings.hostname || '',
				'id': 'input-hostname'
			})
		]),

		// Champ numerique avec validation
		E('div', { 'class': 'form-group' }, [
			E('label', {}, 'Intervalle de rafraichissement (secondes)'),
			E('input', {
				'type': 'number',
				'class': 'form-control',
				'value': settings.refresh_interval || 30,
				'min': 10,
				'max': 300,
				'id': 'input-refresh'
			})
		]),

		// Case a cocher
		E('div', { 'class': 'form-group' }, [
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': settings.auto_refresh || false,
					'id': 'input-auto-refresh'
				}),
				' Activer l\'auto-rafraichissement'
			])
		]),

		// Bouton de soumission
		E('div', { 'class': 'form-actions' }, [
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'type': 'submit',
				'click': function(ev) {
					ev.preventDefault();
					self.handleSaveSettings();
				}
			}, 'Enregistrer les parametres')
		])
	]);
},

handleSaveSettings: function() {
	var hostname = document.getElementById('input-hostname').value;
	var refreshInterval = parseInt(document.getElementById('input-refresh').value);
	var autoRefresh = document.getElementById('input-auto-refresh').checked;

	// Validation
	if (!hostname) {
		ui.addNotification(null, E('p', _('Le nom d\'hote est requis')), 'error');
		return;
	}

	if (refreshInterval < 10 || refreshInterval > 300) {
		ui.addNotification(null, E('p', _('L\'intervalle de rafraichissement doit etre entre 10 et 300 secondes')), 'error');
		return;
	}

	// Sauvegarder via API
	API.saveSettings(hostname, refreshInterval, autoRefresh).then(function(result) {
		if (result.success) {
			ui.addNotification(null, E('p', _('Parametres enregistres avec succes')), 'success');
		} else {
			ui.addNotification(null, E('p', _('Echec de l\'enregistrement des parametres : %s').format(result.message)), 'error');
		}
	});
}
```

---

## Notes specifiques aux modules

### System Hub (luci-app-system-hub)
- **Complexite :** Elevee - 9 onglets, nombreuses fonctionnalites
- **Fonctionnalites cles :** Monitoring de sante, gestion des services, logs systeme, sauvegarde/restauration
- **Exigences speciales :** Integration avec SecuBox pour la liste des composants
- **Dependances :** Appelle `luci.secubox` pour l'enumeration des modules

### Dashboard WireGuard (luci-app-wireguard-dashboard)
- **Complexite :** Moyenne
- **Fonctionnalites cles :** Gestion des pairs, generation de QR code, statistiques de trafic
- **Exigences speciales :** Generation de QR code (utiliser qrencode ou bibliotheque JavaScript)
- **Dependances :** Outils WireGuard (commande `wg`)

### Dashboard CrowdSec (luci-app-crowdsec-dashboard)
- **Complexite :** Moyenne
- **Fonctionnalites cles :** Renseignement sur les menaces, gestion des decisions, bouncers
- **Exigences speciales :** Parser la sortie CLI de CrowdSec
- **Dependances :** CrowdSec (commande `cscli`)

### Dashboard Netdata (luci-app-netdata-dashboard)
- **Complexite :** Faible - principalement integration d'iframe
- **Fonctionnalites cles :** UI Netdata embarquee, apercu rapide des metriques
- **Exigences speciales :** Integration de l'API Netdata
- **Dependances :** Service Netdata

### Modes reseau (luci-app-network-modes)
- **Complexite :** Elevee - manipulation UCI
- **Fonctionnalites cles :** Assistant de topologie reseau, apercu de configuration
- **Exigences speciales :** Validation de config UCI, mecanisme de rollback
- **Dependances :** Configs Network, firewall, DHCP

#### Modes disponibles (v0.3.6)
Le build de production inclut maintenant neuf profils entierement supportes. Chaque profil expose son propre RPC (`*_config`), vue et valeurs par defaut sous `network-modes.<mode>` :

| ID Mode | Description | Fonctionnalites notables |
| --- | --- | --- |
| `router` | Routeur standard | NAT + pare-feu, DHCP, aides proxy/HTTPS front-end |
| `doublenat` | Derriere CPE FAI | Client DHCP WAN, bridge LAN/invite isole, controles UPnP/DMZ |
| `multiwan` | Double liaison montante | Verifications de sante, timers de basculement, equilibrage de charge/mwan3 |
| `vpnrelay` | Passerelle VPN | WireGuard/OpenVPN, kill switch, override DNS, split tunnel |
| `bridge` | Pass-through Layer-2 | Pas de NAT, tous les ports bridged, client DHCP |
| `accesspoint` | Point d'acces WiFi | Bridge upstream, desactivation routage/DHCP, toggles 802.11r/k/v |
| `relay` | Repeteur WiFi | STA+AP, relayd/WDS, assistance WireGuard, tuning MTU/MSS |
| `travel` | Routeur portable | Scan WiFi client, clone MAC, hotspot WPA3, LAN sandbox |
| `sniffer` | TAP/sniffer | Bridge promiscuous, integration Netifyd, support pcap |

Lors de l'ajout d'un autre mode, mettez a jour : les defauts UCI (`root/etc/config/network-modes`), le script RPC (`get_<mode>_config`, `update_settings`, `generate_config`, liste d'autorisation `set_mode`), l'API/vue/menu JS, et la documentation.

---

## Guide de depannage

### Probleme : Erreur "Object not found"

**Symptomes :**
```
RPC call to luci.module-name/method failed with error -32000: Object not found
```

**Diagnostic :**
```bash
# 1. Verifier que le script RPCD existe et est executable
ls -la luci-app-module-name/root/usr/libexec/rpcd/

# 2. Verifier que le nom du script RPCD correspond a l'objet ubus
grep "object:" luci-app-module-name/htdocs/luci-static/resources/module-name/api.js

# 3. Tester le script RPCD manuellement
ssh root@router "/usr/libexec/rpcd/luci.module-name list"

# 4. Verifier les logs RPCD
ssh root@router "logread | grep rpcd | tail -20"
```

**Solutions :**
1. Renommer le script RPCD pour correspondre au nom de l'objet ubus (doit inclure le prefixe `luci.`)
2. Rendre le script executable : `chmod +x luci.module-name`
3. Redemarrer RPCD : `/etc/init.d/rpcd restart`
4. Reinstaller le package si deploye

### Probleme : Vue non chargee (404)

**Symptomes :**
```
HTTP error 404 while loading class file '/luci-static/resources/view/module-name/overview.js'
```

**Diagnostic :**
```bash
# 1. Verifier le chemin du menu
cat luci-app-module-name/root/usr/share/luci/menu.d/*.json | grep "path"

# 2. Verifier que le fichier de vue existe
ls -la luci-app-module-name/htdocs/luci-static/resources/view/

# 3. Verifier que les chemins correspondent
# Menu: "path": "module-name/overview"
# Fichier: view/module-name/overview.js
```

**Solutions :**
1. Mettre a jour le chemin du menu pour correspondre a l'emplacement du fichier de vue
2. OU deplacer les fichiers de vue pour correspondre au chemin du menu
3. Reconstruire et redeployer le package

### Probleme : CSS non applique

**Symptomes :**
- Page sans style
- Couleurs, polices ou mise en page manquantes

**Diagnostic :**
```bash
# 1. Verifier la console du navigateur pour les erreurs 404 CSS
# (Ouvrir les outils de developpement du navigateur)

# 2. Verifier l'import CSS dans le fichier de vue
grep "stylesheet" luci-app-module-name/htdocs/luci-static/resources/view/*/overview.js

# 3. Verifier que le fichier CSS existe
ls -la luci-app-module-name/htdocs/luci-static/resources/module-name/dashboard.css
```

**Solutions :**
1. Verifier le chemin d'import CSS : `L.resource('module-name/dashboard.css')`
2. Importer common.css : `@import url('../system-hub/common.css');`
3. Verifier les permissions de fichier : `644` pour les fichiers CSS
4. Vider le cache du navigateur (Ctrl+Shift+R)

### Probleme : Donnees non mises a jour

**Symptomes :**
- Le dashboard affiche des donnees obsoletes
- L'auto-rafraichissement ne fonctionne pas

**Diagnostic :**
```bash
# 1. Verifier que le poll est enregistre
# (Chercher poll.add() dans la methode render())

# 2. Verifier que les appels API retournent des Promises
# (Verifier que les methodes retournent des resultats de rpc.declare())

# 3. Tester les methodes API directement
ssh root@router "ubus call luci.module-name status"
```

**Solutions :**
1. Ajouter poll.add() a la methode render()
2. Verifier que les appels API dans le callback poll retournent des Promises
3. S'assurer que updateDashboard() met a jour les bons elements DOM
4. Verifier la console du navigateur pour les erreurs JavaScript

---

## Bonnes pratiques

### 1. Organisation du code

**FAIRE :**
- Garder le code lie ensemble (methodes API, helpers)
- Utiliser des noms de variables et fonctions descriptifs
- Ajouter des commentaires pour la logique complexe
- Decouper les grandes fonctions en petits helpers

**NE PAS FAIRE :**
- Mettre tout le code dans une seule fonction massive
- Utiliser des noms de variables d'une seule lettre (sauf dans les boucles)
- Dupliquer le code - creer des fonctions d'aide a la place
- Laisser du code commente en production

### 2. Gestion des erreurs

**FAIRE :**
```javascript
API.getData().then(function(result) {
	if (result && result.data) {
		// Traiter les donnees
	} else {
		console.warn('Aucune donnee retournee');
		// Afficher un etat vide
	}
}).catch(function(error) {
	console.error('Erreur API:', error);
	ui.addNotification(null, E('p', 'Echec du chargement des donnees'), 'error');
});
```

**NE PAS FAIRE :**
```javascript
API.getData().then(function(result) {
	// Traiter les donnees sans verification
	result.data.forEach(function(item) { ... }); // Crashera si data est null
});
```

### 3. Performance

**FAIRE :**
- Utiliser poll.add() au lieu de setInterval pour l'auto-rafraichissement
- Mettre a jour des elements DOM specifiques au lieu de re-rendre entierement
- Debounce les champs de recherche
- Charger les donnees paresseusement seulement quand necessaire

**NE PAS FAIRE :**
- Re-rendre la vue entiere a chaque mise a jour
- Poller trop frequemment (<10 secondes)
- Charger toutes les donnees d'avance
- Effectuer des operations couteuses dans render()

### 4. Experience utilisateur

**FAIRE :**
- Afficher des etats de chargement (spinners, ecrans squelettes)
- Fournir des retours pour les actions (notifications succes/erreur)
- Confirmer les actions destructives (supprimer, redemarrer)
- Utiliser des messages d'erreur descriptifs

**NE PAS FAIRE :**
- Laisser les utilisateurs attendre sans retour
- Echecs silencieux
- Messages d'erreur generiques ("Une erreur s'est produite")
- Permettre les actions destructives sans confirmation

---

## Checklist de deploiement

Avant de deployer en production :

- [ ] **Qualite du code**
  - [ ] Toutes les verifications de validation passent
  - [ ] Pas d'erreurs JavaScript dans la console
  - [ ] Pas d'erreurs de script shell (shellcheck)
  - [ ] Tous les fichiers JSON valides (jsonlint)

- [ ] **Fonctionnalite**
  - [ ] Tous les onglets/pages se chargent correctement
  - [ ] Toutes les actions fonctionnent comme prevu
  - [ ] Les donnees s'affichent correctement
  - [ ] L'auto-rafraichissement met a jour les donnees
  - [ ] Les formulaires valident les entrees
  - [ ] La gestion des erreurs fonctionne

- [ ] **Design**
  - [ ] Correspond visuellement a la demo live
  - [ ] Le mode sombre fonctionne
  - [ ] Responsive sur mobile
  - [ ] Coherent avec les autres modules
  - [ ] Pas de problemes de mise en page

- [ ] **Performance**
  - [ ] La page se charge rapidement (<2s)
  - [ ] L'auto-rafraichissement ne bloque pas l'UI
  - [ ] Pas de fuites memoire
  - [ ] Recuperation de donnees efficace

- [ ] **Securite**
  - [ ] Permissions ACL correctes
  - [ ] Validation des entrees cote frontend et backend
  - [ ] Pas de credentials codes en dur
  - [ ] Execution de commandes securisee (pas d'injection)

- [ ] **Documentation**
  - [ ] README.md mis a jour
  - [ ] Commentaires dans le code complexe
  - [ ] Les entrees de menu ont des descriptions
  - [ ] Les entrees ACL ont des descriptions

---

## Ressources supplementaires

### Documentation
- [Reference API LuCI](https://openwrt.github.io/luci/api/)
- [Guide developpeur OpenWrt](https://openwrt.org/docs/guide-developer/start)
- [Configuration UCI](https://openwrt.org/docs/guide-user/base-system/uci)
- [Documentation ubus](https://openwrt.org/docs/techref/ubus)

### Demo live
- **Demo principale :** https://secubox.cybermood.eu
- **System Hub :** https://secubox.cybermood.eu/system-hub
- **CrowdSec :** https://secubox.cybermood.eu/crowdsec
- **WireGuard :** https://secubox.cybermood.eu/wireguard

### Documentation interne
- [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md) - Toutes les specifications de modules
- [CODE-TEMPLATES.md](code-templates.md) - Modeles d'implementation
- [DEVELOPMENT-GUIDELINES.md](development-guidelines.md) - Guide de developpement complet
- [QUICK-START.md](quick-start.md) - Reference rapide
- [CLAUDE.md](claude.md) - Reference du systeme de build

### Outils
- [SecuBox Tools](https://github.com/CyberMind-FR/secubox-openwrt/tree/master/secubox-tools/) - Scripts de validation, build, deploiement
- [GitHub Actions](https://github.com/CyberMind-FR/secubox-openwrt/tree/master/.github/workflows/) - Workflows CI/CD
- [Templates](https://github.com/CyberMind-FR/secubox-openwrt/tree/master/templates/) - Modeles de modules

---

## Obtenir de l'aide

Si vous rencontrez des problemes non couverts dans ce guide :

1. **Verifier les modules existants :** Regardez les modules fonctionnels pour des implementations de reference
2. **Executer la validation :** `./secubox-tools/validate-modules.sh` pour les verifications automatisees
3. **Verifier les logs :** `logread | grep -i error` sur le routeur
4. **Consulter la documentation :** Lire DEVELOPMENT-GUIDELINES.md pour des explications detaillees
5. **Contacter le support :** support@cybermind.fr

---

**Version du document :** 1.0.0
**Derniere mise a jour :** 2025-12-27
**Mainteneur :** CyberMind.fr
**Demo live :** https://secubox.cybermood.eu
