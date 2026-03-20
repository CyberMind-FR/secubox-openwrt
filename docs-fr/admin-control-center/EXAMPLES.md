# SecuBox Admin Control Center - Exemples d'Utilisation

> **Langues:** [English](../../docs/admin-control-center/EXAMPLES.md) | Francais | [中文](../../docs-zh/admin-control-center/EXAMPLES.md)

Exemples complets pour la gestion des etats et les operations du registre des composants.

---

## Table des Matieres

1. [Exemples CLI](#exemples-cli)
   - [Gestion d'Etat](#gestion-detat-cli)
   - [Registre des Composants](#registre-des-composants-cli)
   - [Workflows Courants](#workflows-courants-cli)
2. [Exemples de Scripts Shell](#exemples-de-scripts-shell)
3. [Exemples Frontend JavaScript](#exemples-frontend-javascript)
4. [Exemples d'Integration](#exemples-dintegration)

---

## Exemples CLI

### Gestion d'Etat CLI

#### Operations de Base sur les Etats

```bash
# Obtenir l'etat actuel d'un composant
secubox-state get luci-app-auth-guardian

# Definir l'etat d'un composant
secubox-state set luci-app-auth-guardian starting user_request

# Voir l'historique des etats
secubox-state history luci-app-auth-guardian 20

# Lister tous les composants en cours d'execution
secubox-state list --state=running

# Lister toutes les applications
secubox-state list --type=app

# Valider la coherence de l'etat
secubox-state validate luci-app-auth-guardian

# Synchroniser la base de donnees d'etat avec le systeme
secubox-state sync
```

#### Gestion des Erreurs

```bash
# Effacer l'etat d'erreur
secubox-state clear-error luci-app-vpn-client

# Verifier le composant apres avoir efface l'erreur
secubox-state get luci-app-vpn-client
```

#### Gel/Degel des Composants

```bash
# Geler un composant critique
secubox-state freeze luci-app-firewall system_critical

# Verifier l'etat gele
secubox-state get luci-app-firewall

# Degeler (transitionner vers actif)
secubox-state set luci-app-firewall active admin_unfreeze
```

### Registre des Composants CLI

#### Enregistrement de Composants

```bash
# Enregistrer un nouveau composant application
secubox-component register my-custom-app app '{
  "name": "My Custom App",
  "packages": ["my-custom-app", "dependency-pkg"],
  "capabilities": ["custom-feature"],
  "dependencies": {
    "required": ["luci-base"],
    "optional": []
  },
  "managed_services": ["my-service"]
}'

# Enregistrer un module
secubox-component register my-module module '{
  "name": "My Module",
  "packages": ["my-module-pkg"]
}'

# Enregistrer un widget
secubox-component register my-widget widget '{
  "name": "My Dashboard Widget",
  "packages": ["luci-app-widget-provider"]
}'
```

#### Requetes sur les Composants

```bash
# Obtenir les details d'un composant
secubox-component get luci-app-auth-guardian

# Lister toutes les applications
secubox-component list --type=app

# Lister tous les composants en cours d'execution
secubox-component list --state=running

# Lister les composants d'un profil
secubox-component list --profile=home-security

# Afficher l'arbre de dependances
secubox-component tree luci-app-auth-guardian

# Afficher les dependances inverses
secubox-component affected luci-base
```

#### Gestion des Composants

```bash
# Mettre a jour un parametre de composant
secubox-component set-setting luci-app-auth-guardian enabled true

# Desenregistrer un composant
secubox-component unregister my-old-app
```

### Workflows Courants CLI

#### Installation d'une Application (Workflow Complet)

```bash
#!/bin/bash

APP_ID="luci-app-vpn-client"

# 1. Verifier si le composant est enregistre
if ! secubox-component get "$APP_ID" > /dev/null 2>&1; then
    echo "Component not registered, syncing registry..."
    secubox-sync-registry apps
fi

# 2. Definir l'etat a installing
secubox-state set "$APP_ID" installing user_install

# 3. Effectuer l'installation reelle (ceci serait fait par secubox-appstore)
# opkg install luci-app-vpn-client

# 4. En cas de succes, definir a installed
secubox-state set "$APP_ID" installed install_success

# 5. Configurer l'application
secubox-state set "$APP_ID" configuring user_config

# 6. Marquer comme configured
secubox-state set "$APP_ID" configured config_complete

# 7. Activer
secubox-state set "$APP_ID" activating user_activate
secubox-state set "$APP_ID" active activation_complete

# 8. Demarrer le service
secubox-state set "$APP_ID" starting user_start

# 9. Marquer comme running
secubox-state set "$APP_ID" running start_success
```

#### Changement d'Etat en Masse

```bash
#!/bin/bash

# Arreter toutes les applications en cours d'execution
for app_id in $(secubox-state list --state=running --type=app | jq -r '.[].id'); do
    echo "Stopping $app_id..."
    secubox-state set "$app_id" stopping bulk_shutdown
    secubox-state set "$app_id" stopped shutdown_complete
done
```

#### Script de Verification de Sante

```bash
#!/bin/bash

echo "=== SecuBox Component Health Check ==="
echo

# Obtenir tous les composants
components=$(secubox-component list)

# Compter par etat
echo "Component Distribution:"
echo "  Running:     $(echo "$components" | jq '[.[] | select(.current_state=="running")] | length')"
echo "  Stopped:     $(echo "$components" | jq '[.[] | select(.current_state=="stopped")] | length')"
echo "  Error:       $(echo "$components" | jq '[.[] | select(.current_state=="error")] | length')"
echo "  Frozen:      $(echo "$components" | jq '[.[] | select(.current_state=="frozen")] | length')"
echo "  Disabled:    $(echo "$components" | jq '[.[] | select(.current_state=="disabled")] | length')"
echo

# Afficher les composants en erreur
error_count=$(echo "$components" | jq '[.[] | select(.current_state=="error")] | length')
if [ "$error_count" -gt 0 ]; then
    echo "Components in ERROR state:"
    echo "$components" | jq -r '.[] | select(.current_state=="error") | "  - \(.name) (\(.id))"'
    echo
fi

# Afficher les composants geles
frozen_count=$(echo "$components" | jq '[.[] | select(.current_state=="frozen")] | length')
if [ "$frozen_count" -gt 0 ]; then
    echo "Components in FROZEN state:"
    echo "$components" | jq -r '.[] | select(.current_state=="frozen") | "  - \(.name) (\(.id))"'
    echo
fi

# Valider tous les etats des composants
echo "Validating component states..."
invalid_count=0
for comp_id in $(echo "$components" | jq -r '.[].id'); do
    if ! secubox-state validate "$comp_id" > /dev/null 2>&1; then
        echo "  ⚠ Invalid state: $comp_id"
        invalid_count=$((invalid_count + 1))
    fi
done

if [ "$invalid_count" -eq 0 ]; then
    echo "  ✓ All component states are valid"
else
    echo "  ✗ Found $invalid_count invalid states"
fi
```

---

## Exemples de Scripts Shell

### Exemple: Demarrage Automatique de Toutes les Applications au Boot

```bash
#!/bin/bash
# /etc/init.d/secubox-autostart

START=99
STOP=10

start() {
    echo "Starting SecuBox components..."

    # Obtenir tous les composants actifs
    components=$(secubox-component list --state=active --type=app)

    for app_id in $(echo "$components" | jq -r '.[].id'); do
        # Verifier si auto_start est active
        auto_start=$(secubox-component get "$app_id" | jq -r '.settings.auto_start // false')

        if [ "$auto_start" = "true" ]; then
            echo "  Starting $app_id..."
            secubox-state set "$app_id" starting boot_autostart

            # Demarrer les services geres
            services=$(secubox-component get "$app_id" | jq -r '.managed_services[]')
            for service in $services; do
                /etc/init.d/"$service" start
            done

            secubox-state set "$app_id" running start_success
        fi
    done
}

stop() {
    echo "Stopping SecuBox components..."

    # Obtenir tous les composants en cours d'execution
    components=$(secubox-state list --state=running --type=app)

    for app_id in $(echo "$components" | jq -r '.[].id'); do
        echo "  Stopping $app_id..."
        secubox-state set "$app_id" stopping shutdown

        # Arreter les services geres
        services=$(secubox-component get "$app_id" | jq -r '.managed_services[]')
        for service in $services; do
            /etc/init.d/"$service" stop
        done

        secubox-state set "$app_id" stopped stop_success
    done
}
```

### Exemple: Resolveur de Dependances de Composants

```bash
#!/bin/bash

resolve_dependencies() {
    local component_id="$1"
    local resolved=()
    local seen=()

    resolve_recursive() {
        local comp_id="$1"

        # Verifier si deja vu (dependance circulaire)
        for s in "${seen[@]}"; do
            if [ "$s" = "$comp_id" ]; then
                echo "Error: Circular dependency detected: $comp_id" >&2
                return 1
            fi
        done

        seen+=("$comp_id")

        # Obtenir les dependances requises
        local deps=$(secubox-component get "$comp_id" | jq -r '.dependencies.required[]')

        for dep in $deps; do
            resolve_recursive "$dep"
        done

        # Ajouter a la liste resolue
        resolved+=("$comp_id")
    }

    resolve_recursive "$component_id"

    # Afficher dans l'ordre d'installation
    printf '%s\n' "${resolved[@]}"
}

# Utilisation
echo "Install order for luci-app-auth-guardian:"
resolve_dependencies "luci-app-auth-guardian"
```

### Exemple: Observateur de Transitions d'Etat

```bash
#!/bin/bash

watch_state_transitions() {
    local component_id="$1"
    local last_state=""

    echo "Watching state transitions for: $component_id"
    echo "Press Ctrl+C to stop"
    echo

    while true; do
        current_state=$(secubox-state get "$component_id" | jq -r '.current_state')

        if [ "$current_state" != "$last_state" ]; then
            timestamp=$(date "+%Y-%m-%d %H:%M:%S")
            echo "[$timestamp] State changed: $last_state -> $current_state"
            last_state="$current_state"
        fi

        sleep 1
    done
}

# Utilisation
watch_state_transitions "luci-app-vpn-client"
```

---

## Exemples Frontend JavaScript

### Exemple: Tableau de Bord des Composants

```javascript
'use strict';
'require view';
'require secubox-admin.api as api';
'require secubox-admin.components.StateIndicator as StateIndicator';

return view.extend({
    load: function() {
        return api.getAllComponentsWithStates({ type: 'app' });
    },

    render: function(components) {
        var container = E('div', { 'class': 'component-dashboard' });

        components.forEach(function(comp) {
            var card = E('div', {
                'class': 'component-card',
                'style': 'padding: 1rem; margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;'
            });

            // Nom du composant
            var name = E('h3', {}, comp.name);
            card.appendChild(name);

            // Indicateur d'etat
            var state = comp.state_info ? comp.state_info.current_state : 'unknown';
            var stateIndicator = StateIndicator.render(state, {
                showIcon: true,
                showLabel: true
            });
            card.appendChild(stateIndicator);

            // Boutons d'action
            var actions = E('div', { 'style': 'margin-top: 1rem; display: flex; gap: 0.5rem;' });

            if (state === 'stopped') {
                var startBtn = E('button', {
                    'class': 'btn cbi-button-action',
                    'click': function() {
                        api.setComponentState(comp.id, 'starting', 'user_action')
                            .then(function() {
                                location.reload();
                            });
                    }
                }, 'Start');
                actions.appendChild(startBtn);
            } else if (state === 'running') {
                var stopBtn = E('button', {
                    'class': 'btn cbi-button-negative',
                    'click': function() {
                        api.setComponentState(comp.id, 'stopping', 'user_action')
                            .then(function() {
                                location.reload();
                            });
                    }
                }, 'Stop');
                actions.appendChild(stopBtn);
            }

            card.appendChild(actions);
            container.appendChild(card);
        });

        return container;
    }
});
```

### Exemple: Gestionnaire de Transition d'Etat

```javascript
function handleStateTransition(componentId, newState) {
    // Afficher l'indicateur de chargement
    ui.showModal(_('Changing State'), [
        E('p', { 'class': 'spinning' }, _('Updating component state...'))
    ]);

    // Valider la transition
    return api.getComponentState(componentId).then(function(stateInfo) {
        var currentState = stateInfo.current_state;

        if (!stateUtils.canTransition(currentState, newState)) {
            ui.hideModal();
            ui.addNotification(null,
                E('p', _('Invalid state transition: %s -> %s').format(currentState, newState)),
                'error'
            );
            return Promise.reject('Invalid transition');
        }

        // Executer la transition
        return api.setComponentState(componentId, newState, 'user_action');
    }).then(function(result) {
        ui.hideModal();

        if (result.success) {
            ui.addNotification(null,
                E('p', _('State changed successfully')),
                'success'
            );

            // Recharger les donnees du composant
            return api.getComponentWithState(componentId);
        } else {
            throw new Error(result.message || 'State change failed');
        }
    }).catch(function(error) {
        ui.hideModal();
        ui.addNotification(null,
            E('p', _('Error: %s').format(error.message || error)),
            'error'
        );
    });
}

// Utilisation
handleStateTransition('luci-app-vpn-client', 'starting');
```

### Exemple: Moniteur d'Etat en Temps Reel

```javascript
var StateMonitor = baseclass.extend({
    __init__: function(componentId) {
        this.componentId = componentId;
        this.pollInterval = 2000; // 2 secondes
        this.callbacks = [];
    },

    start: function() {
        var self = this;
        this.lastState = null;

        this.pollId = poll.add(function() {
            return api.getComponentState(self.componentId).then(function(stateInfo) {
                var currentState = stateInfo.current_state;

                if (currentState !== self.lastState) {
                    self.notifyChange(self.lastState, currentState, stateInfo);
                    self.lastState = currentState;
                }
            });
        }, this.pollInterval / 1000);
    },

    stop: function() {
        if (this.pollId) {
            poll.remove(this.pollId);
            this.pollId = null;
        }
    },

    onChange: function(callback) {
        this.callbacks.push(callback);
    },

    notifyChange: function(oldState, newState, stateInfo) {
        this.callbacks.forEach(function(callback) {
            callback(oldState, newState, stateInfo);
        });
    }
});

// Utilisation
var monitor = new StateMonitor('luci-app-vpn-client');

monitor.onChange(function(oldState, newState, stateInfo) {
    console.log('State changed:', oldState, '->', newState);

    // Mettre a jour l'interface
    var indicator = document.getElementById('state-indicator');
    if (indicator) {
        var newIndicator = StateIndicator.render(newState);
        indicator.replaceWith(newIndicator);
    }
});

monitor.start();
```

### Exemple: Operations en Masse

```javascript
function bulkStartComponents(componentIds) {
    ui.showModal(_('Starting Components'), [
        E('p', {}, _('Starting %d components...').format(componentIds.length)),
        E('div', { 'id': 'bulk-progress' })
    ]);

    var progressDiv = document.getElementById('bulk-progress');
    var completed = 0;
    var failed = 0;

    // Demarrer tous les composants en parallele
    return api.bulkSetComponentState(componentIds, 'starting', 'bulk_start')
        .then(function(results) {
            results.forEach(function(result, index) {
                var componentId = componentIds[index];

                if (result.success) {
                    completed++;
                    progressDiv.appendChild(
                        E('div', { 'style': 'color: #10b981;' },
                            '✓ ' + componentId
                        )
                    );
                } else {
                    failed++;
                    progressDiv.appendChild(
                        E('div', { 'style': 'color: #ef4444;' },
                            '✗ ' + componentId + ': ' + (result.error || 'Unknown error')
                        )
                    );
                }
            });

            setTimeout(function() {
                ui.hideModal();

                var message = _('Completed: %d, Failed: %d').format(completed, failed);
                ui.addNotification(null, E('p', message),
                    failed > 0 ? 'warning' : 'success'
                );
            }, 2000);
        });
}

// Utilisation
var appsToStart = ['luci-app-vpn-client', 'luci-app-firewall', 'luci-app-ddns'];
bulkStartComponents(appsToStart);
```

---

## Exemples d'Integration

### Exemple: Formulaire LuCI avec Conscience d'Etat

```javascript
var form = new form.Map('myapp', _('My Application'));

var section = form.section(form.TypedSection, 'config');

// Ajouter l'indicateur d'etat a la section
section.load = function() {
    var self = this;

    return Promise.all([
        form.TypedSection.prototype.load.call(this),
        api.getComponentState('my-app')
    ]).then(function(results) {
        var stateInfo = results[1];

        // Ajouter les informations d'etat au titre de la section
        var stateIndicator = StateIndicator.render(stateInfo.current_state);
        var titleNode = self.titleFn ? document.querySelector('.cbi-section-node h3') : null;
        if (titleNode) {
            titleNode.appendChild(document.createTextNode(' '));
            titleNode.appendChild(stateIndicator);
        }

        return results[0];
    });
};

// Ajouter une option tenant compte de l'etat
var stateOption = section.option(form.DummyValue, '_state', _('Service State'));
stateOption.cfgvalue = function() {
    return api.getComponentState('my-app').then(function(stateInfo) {
        return StateIndicator.render(stateInfo.current_state);
    });
};

// Ajouter des boutons de controle
var controlOption = section.option(form.Button, '_control', _('Service Control'));
controlOption.inputtitle = _('Start');
controlOption.onclick = function() {
    return handleStateTransition('my-app', 'starting');
};
```

### Exemple: Mises a Jour d'Etat via WebSocket

```javascript
// Note: Necessite le support WebSocket cote backend

var StateWebSocket = baseclass.extend({
    __init__: function(url) {
        this.url = url || 'ws://localhost:8080/state-updates';
        this.ws = null;
        this.callbacks = {};
    },

    connect: function() {
        var self = this;

        this.ws = new WebSocket(this.url);

        this.ws.onopen = function() {
            console.log('State WebSocket connected');
        };

        this.ws.onmessage = function(event) {
            var data = JSON.parse(event.data);

            if (data.type === 'state_change') {
                self.handleStateChange(data);
            }
        };

        this.ws.onerror = function(error) {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = function() {
            console.log('WebSocket closed, reconnecting...');
            setTimeout(function() {
                self.connect();
            }, 5000);
        };
    },

    subscribe: function(componentId, callback) {
        if (!this.callbacks[componentId]) {
            this.callbacks[componentId] = [];
        }
        this.callbacks[componentId].push(callback);

        // Envoyer le message d'abonnement
        this.send({
            type: 'subscribe',
            component_id: componentId
        });
    },

    handleStateChange: function(data) {
        var componentId = data.component_id;
        var callbacks = this.callbacks[componentId] || [];

        callbacks.forEach(function(callback) {
            callback(data.old_state, data.new_state, data.state_info);
        });
    },

    send: function(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
});

// Utilisation
var ws = new StateWebSocket();
ws.connect();

ws.subscribe('luci-app-vpn-client', function(oldState, newState, stateInfo) {
    console.log('Real-time update:', oldState, '->', newState);
    // Mettre a jour l'interface immediatement
});
```

---

## Exemples de Tests

### Exemple: Test Unitaire pour les Transitions d'Etat

```javascript
describe('State Transitions', function() {
    it('should allow valid transitions', function() {
        expect(stateUtils.canTransition('stopped', 'starting')).toBe(true);
        expect(stateUtils.canTransition('starting', 'running')).toBe(true);
        expect(stateUtils.canTransition('running', 'stopping')).toBe(true);
    });

    it('should reject invalid transitions', function() {
        expect(stateUtils.canTransition('stopped', 'running')).toBe(false);
        expect(stateUtils.canTransition('available', 'running')).toBe(false);
    });

    it('should handle error transitions', function() {
        expect(stateUtils.canTransition('installing', 'error')).toBe(true);
        expect(stateUtils.canTransition('error', 'available')).toBe(true);
    });
});
```

### Exemple: Test d'Integration

```bash
#!/bin/bash

test_component_lifecycle() {
    local app_id="test-app"

    echo "Testing component lifecycle for: $app_id"

    # 1. Enregistrer le composant
    echo "  1. Registering component..."
    secubox-component register "$app_id" app '{"name":"Test App","packages":["test-pkg"]}'

    # 2. Initialiser l'etat
    echo "  2. Initializing state..."
    secubox-state set "$app_id" available init

    # 3. Installer
    echo "  3. Installing..."
    secubox-state set "$app_id" installing test
    secubox-state set "$app_id" installed test

    # 4. Activer
    echo "  4. Activating..."
    secubox-state set "$app_id" configuring test
    secubox-state set "$app_id" configured test
    secubox-state set "$app_id" activating test
    secubox-state set "$app_id" active test

    # 5. Demarrer
    echo "  5. Starting..."
    secubox-state set "$app_id" starting test
    secubox-state set "$app_id" running test

    # 6. Arreter
    echo "  6. Stopping..."
    secubox-state set "$app_id" stopping test
    secubox-state set "$app_id" stopped test

    # 7. Desinstaller
    echo "  7. Uninstalling..."
    secubox-state set "$app_id" uninstalling test
    secubox-state set "$app_id" available test

    # 8. Nettoyage
    echo "  8. Cleaning up..."
    secubox-component unregister "$app_id"

    echo "✓ Lifecycle test completed successfully"
}

test_component_lifecycle
```

---

**Voir Aussi:**
- [Reference API](API-REFERENCE.md)
- [Guide de Gestion d'Etat](STATE-MANAGEMENT.md)
- [Guide du Systeme de Composants](COMPONENT-SYSTEM.md)

---

**Version:** 1.0
**Derniere Mise a Jour:** 2026-01-05
