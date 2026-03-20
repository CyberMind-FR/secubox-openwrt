# Exemples de Code SecuBox

[English](README.md) | Francais | [中文](README.zh.md)

Ce repertoire contient des exemples de code pratiques pour le developpement et l'integration des modules SecuBox.

## Exemples Disponibles

### help-button-integration.js
Exemples complets pour l'integration de boutons d'aide/documentation dans les modules SecuBox.

**Contenu :**
- Module utilitaire d'aide partage
- Exemples d'integration de modules
- Multiples modeles d'interface utilisateur (en-tete, flottant, actions rapides)
- Aide contextuelle
- Exemples de style CSS

**Cas d'utilisation :**
- Ajout de boutons d'aide aux tableaux de bord des modules
- Liens vers la documentation du site web
- Creation d'une experience utilisateur d'aide coherente entre les modules

## Documentation Associee

- **Plan d'Integration :** `../DOCS/HELP_INTEGRATION_PLAN.md`
- **Guide de Deploiement :** `../DOCS/WEBSITE_DEPLOYMENT_GUIDE.md`
- **Reference de Developpement LuCI :** `../DOCS/LUCI_DEVELOPMENT_REFERENCE.md`

## Comment Utiliser les Exemples

1. **Examiner le code d'exemple** pour comprendre le modele
2. **Copier les sections pertinentes** dans votre module
3. **Personnaliser** les noms de modules, URLs et styles
4. **Tester** sur le routeur de developpement
5. **Deployer** a l'aide des scripts de deploiement

## Workflow d'Integration

```bash
# 1. Deployer le site web sur le routeur
./secubox-tools/deploy-website.sh root@192.168.8.191

# 2. Ajouter le code du bouton d'aide a votre module
# (voir help-button-integration.js)

# 3. Compiler et deployer le module
./secubox-tools/local-build.sh build luci-app-your-module
./secubox-tools/deploy-network-modes.sh root@192.168.8.191

# 4. Tester dans le navigateur
open http://192.168.8.191/cgi-bin/luci/admin/secubox/your-module
```

## Modeles Courants

### Modele 1 : Bouton d'Aide en En-tete
```javascript
'require secubox/help as Help';

E('div', { 'class': 'header' }, [
    E('h2', {}, 'Module Title'),
    Help.createHelpButton('module-name', 'header')
])
```

### Modele 2 : Bouton d'Aide Flottant
```javascript
E('a', {
    'class': 'sb-help-floating',
    'href': '/luci-static/secubox/demo-module.html',
    'target': '_blank'
}, [E('span', {}, '❓')])
```

### Modele 3 : Action Rapide
```javascript
buttons.push(
    E('button', {
        'class': 'action-btn',
        'click': function() {
            window.open('/luci-static/secubox/demo-module.html', '_blank');
        }
    }, ['📖 Help'])
)
```

## Exemples Specifiques aux Modules

Chaque module peut avoir differents emplacements de boutons d'aide :

| Module | Position Recommandee | Fichier d'Exemple |
|--------|---------------------|--------------|
| SecuBox Dashboard | Actions Rapides | help-button-integration.js (Ex 3) |
| System Hub | Badge En-tete | help-button-integration.js (Ex 4) |
| Network Modes | Bouton En-tete | help-button-integration.js (Ex 2) |
| Autres Modules | Bouton Flottant | help-button-integration.js (Ex 5) |

## Liste de Verification des Tests

- [ ] Le bouton d'aide est visible
- [ ] Le clic ouvre la bonne page de documentation
- [ ] Le style correspond au theme du module
- [ ] Fonctionne en mode sombre/clair
- [ ] Responsive sur mobile
- [ ] Pas d'erreurs dans la console
- [ ] Accessible via le clavier

## Contribuer des Exemples

Pour ajouter de nouveaux exemples :

1. Creer un fichier JavaScript descriptif
2. Inclure des commentaires clairs
3. Montrer un code complet et fonctionnel
4. Mettre a jour ce README
5. Tester sur un routeur reel

## Support

Pour les questions sur les exemples :
- Consulter la documentation associee dans `DOCS/`
- Verifier le code source des modules dans `luci-app-*/`
- Tester d'abord sur le routeur de developpement

## Reference Rapide

**URL de Base du Site Web :** `/luci-static/secubox/`

**Pages d'Aide des Modules :**
- secubox → `index.html#modules`
- system-hub → `demo-secubox-hub.html`
- network-modes → `demo-network-modes.html`
- client-guardian → `demo-client-guardian.html`
- bandwidth-manager → `demo-bandwidth.html`
- traffic-shaper → `demo-traffic-shaper.html`
- (Voir help-button-integration.js pour la liste complete)

**Methodes de l'Utilitaire d'Aide :**
- `Help.createHelpButton(module, position, options)`
- `Help.getHelpUrl(module)`
- `Help.openHelpModal(module)`
