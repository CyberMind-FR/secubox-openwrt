# SecuBox Admin Control Center - Usage Examples

Comprehensive examples for state management and component registry operations.

---

## Table of Contents

1. [CLI Examples](#cli-examples)
   - [State Management](#state-management-cli)
   - [Component Registry](#component-registry-cli)
   - [Common Workflows](#common-workflows-cli)
2. [Shell Script Examples](#shell-script-examples)
3. [JavaScript Frontend Examples](#javascript-frontend-examples)
4. [Integration Examples](#integration-examples)

---

## CLI Examples

### State Management CLI

#### Basic State Operations

```bash
# Get current state of a component
secubox-state get luci-app-auth-guardian

# Set component state
secubox-state set luci-app-auth-guardian starting user_request

# View state history
secubox-state history luci-app-auth-guardian 20

# List all running components
secubox-state list --state=running

# List all apps
secubox-state list --type=app

# Validate state consistency
secubox-state validate luci-app-auth-guardian

# Sync state DB with system
secubox-state sync
```

#### Error Handling

```bash
# Clear error state
secubox-state clear-error luci-app-vpn-client

# Check component after clearing error
secubox-state get luci-app-vpn-client
```

#### Freeze/Unfreeze Components

```bash
# Freeze a critical component
secubox-state freeze luci-app-firewall system_critical

# Check frozen state
secubox-state get luci-app-firewall

# Unfreeze (transition back to active)
secubox-state set luci-app-firewall active admin_unfreeze
```

### Component Registry CLI

#### Component Registration

```bash
# Register a new app component
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

# Register a module
secubox-component register my-module module '{
  "name": "My Module",
  "packages": ["my-module-pkg"]
}'

# Register a widget
secubox-component register my-widget widget '{
  "name": "My Dashboard Widget",
  "packages": ["luci-app-widget-provider"]
}'
```

#### Component Queries

```bash
# Get component details
secubox-component get luci-app-auth-guardian

# List all apps
secubox-component list --type=app

# List all running components
secubox-component list --state=running

# List components in a profile
secubox-component list --profile=home-security

# Show dependency tree
secubox-component tree luci-app-auth-guardian

# Show what depends on a component (reverse dependencies)
secubox-component affected luci-base
```

#### Component Management

```bash
# Update component setting
secubox-component set-setting luci-app-auth-guardian enabled true

# Unregister a component
secubox-component unregister my-old-app
```

### Common Workflows CLI

#### Installing an App (Full Workflow)

```bash
#!/bin/bash

APP_ID="luci-app-vpn-client"

# 1. Check if component is registered
if ! secubox-component get "$APP_ID" > /dev/null 2>&1; then
    echo "Component not registered, syncing registry..."
    secubox-sync-registry apps
fi

# 2. Set state to installing
secubox-state set "$APP_ID" installing user_install

# 3. Perform actual installation (this would be done by secubox-appstore)
# opkg install luci-app-vpn-client

# 4. On success, set to installed
secubox-state set "$APP_ID" installed install_success

# 5. Configure the app
secubox-state set "$APP_ID" configuring user_config

# 6. Mark as configured
secubox-state set "$APP_ID" configured config_complete

# 7. Activate
secubox-state set "$APP_ID" activating user_activate
secubox-state set "$APP_ID" active activation_complete

# 8. Start the service
secubox-state set "$APP_ID" starting user_start

# 9. Mark as running
secubox-state set "$APP_ID" running start_success
```

#### Bulk State Change

```bash
#!/bin/bash

# Stop all running apps
for app_id in $(secubox-state list --state=running --type=app | jq -r '.[].id'); do
    echo "Stopping $app_id..."
    secubox-state set "$app_id" stopping bulk_shutdown
    secubox-state set "$app_id" stopped shutdown_complete
done
```

#### Health Check Script

```bash
#!/bin/bash

echo "=== SecuBox Component Health Check ==="
echo

# Get all components
components=$(secubox-component list)

# Count by state
echo "Component Distribution:"
echo "  Running:     $(echo "$components" | jq '[.[] | select(.current_state=="running")] | length')"
echo "  Stopped:     $(echo "$components" | jq '[.[] | select(.current_state=="stopped")] | length')"
echo "  Error:       $(echo "$components" | jq '[.[] | select(.current_state=="error")] | length')"
echo "  Frozen:      $(echo "$components" | jq '[.[] | select(.current_state=="frozen")] | length')"
echo "  Disabled:    $(echo "$components" | jq '[.[] | select(.current_state=="disabled")] | length')"
echo

# Show error components
error_count=$(echo "$components" | jq '[.[] | select(.current_state=="error")] | length')
if [ "$error_count" -gt 0 ]; then
    echo "Components in ERROR state:"
    echo "$components" | jq -r '.[] | select(.current_state=="error") | "  - \(.name) (\(.id))"'
    echo
fi

# Show frozen components
frozen_count=$(echo "$components" | jq '[.[] | select(.current_state=="frozen")] | length')
if [ "$frozen_count" -gt 0 ]; then
    echo "Components in FROZEN state:"
    echo "$components" | jq -r '.[] | select(.current_state=="frozen") | "  - \(.name) (\(.id))"'
    echo
fi

# Validate all component states
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

## Shell Script Examples

### Example: Auto-Start All Apps on Boot

```bash
#!/bin/bash
# /etc/init.d/secubox-autostart

START=99
STOP=10

start() {
    echo "Starting SecuBox components..."

    # Get all active components
    components=$(secubox-component list --state=active --type=app)

    for app_id in $(echo "$components" | jq -r '.[].id'); do
        # Check if auto_start is enabled
        auto_start=$(secubox-component get "$app_id" | jq -r '.settings.auto_start // false')

        if [ "$auto_start" = "true" ]; then
            echo "  Starting $app_id..."
            secubox-state set "$app_id" starting boot_autostart

            # Start managed services
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

    # Get all running components
    components=$(secubox-state list --state=running --type=app)

    for app_id in $(echo "$components" | jq -r '.[].id'); do
        echo "  Stopping $app_id..."
        secubox-state set "$app_id" stopping shutdown

        # Stop managed services
        services=$(secubox-component get "$app_id" | jq -r '.managed_services[]')
        for service in $services; do
            /etc/init.d/"$service" stop
        done

        secubox-state set "$app_id" stopped stop_success
    done
}
```

### Example: Component Dependency Resolver

```bash
#!/bin/bash

resolve_dependencies() {
    local component_id="$1"
    local resolved=()
    local seen=()

    resolve_recursive() {
        local comp_id="$1"

        # Check if already seen (circular dependency)
        for s in "${seen[@]}"; do
            if [ "$s" = "$comp_id" ]; then
                echo "Error: Circular dependency detected: $comp_id" >&2
                return 1
            fi
        done

        seen+=("$comp_id")

        # Get required dependencies
        local deps=$(secubox-component get "$comp_id" | jq -r '.dependencies.required[]')

        for dep in $deps; do
            resolve_recursive "$dep"
        done

        # Add to resolved list
        resolved+=("$comp_id")
    }

    resolve_recursive "$component_id"

    # Print in installation order
    printf '%s\n' "${resolved[@]}"
}

# Usage
echo "Install order for luci-app-auth-guardian:"
resolve_dependencies "luci-app-auth-guardian"
```

### Example: State Transition Watcher

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

# Usage
watch_state_transitions "luci-app-vpn-client"
```

---

## JavaScript Frontend Examples

### Example: Component Dashboard

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

            // Component name
            var name = E('h3', {}, comp.name);
            card.appendChild(name);

            // State indicator
            var state = comp.state_info ? comp.state_info.current_state : 'unknown';
            var stateIndicator = StateIndicator.render(state, {
                showIcon: true,
                showLabel: true
            });
            card.appendChild(stateIndicator);

            // Action buttons
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

### Example: State Transition Handler

```javascript
function handleStateTransition(componentId, newState) {
    // Show loading indicator
    ui.showModal(_('Changing State'), [
        E('p', { 'class': 'spinning' }, _('Updating component state...'))
    ]);

    // Validate transition
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

        // Execute transition
        return api.setComponentState(componentId, newState, 'user_action');
    }).then(function(result) {
        ui.hideModal();

        if (result.success) {
            ui.addNotification(null,
                E('p', _('State changed successfully')),
                'success'
            );

            // Reload component data
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

// Usage
handleStateTransition('luci-app-vpn-client', 'starting');
```

### Example: Real-time State Monitor

```javascript
var StateMonitor = baseclass.extend({
    __init__: function(componentId) {
        this.componentId = componentId;
        this.pollInterval = 2000; // 2 seconds
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

// Usage
var monitor = new StateMonitor('luci-app-vpn-client');

monitor.onChange(function(oldState, newState, stateInfo) {
    console.log('State changed:', oldState, '->', newState);

    // Update UI
    var indicator = document.getElementById('state-indicator');
    if (indicator) {
        var newIndicator = StateIndicator.render(newState);
        indicator.replaceWith(newIndicator);
    }
});

monitor.start();
```

### Example: Bulk Operations

```javascript
function bulkStartComponents(componentIds) {
    ui.showModal(_('Starting Components'), [
        E('p', {}, _('Starting %d components...').format(componentIds.length)),
        E('div', { 'id': 'bulk-progress' })
    ]);

    var progressDiv = document.getElementById('bulk-progress');
    var completed = 0;
    var failed = 0;

    // Start all components in parallel
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

// Usage
var appsToStart = ['luci-app-vpn-client', 'luci-app-firewall', 'luci-app-ddns'];
bulkStartComponents(appsToStart);
```

---

## Integration Examples

### Example: LuCI Form with State Awareness

```javascript
var form = new form.Map('myapp', _('My Application'));

var section = form.section(form.TypedSection, 'config');

// Add state indicator to section
section.load = function() {
    var self = this;

    return Promise.all([
        form.TypedSection.prototype.load.call(this),
        api.getComponentState('my-app')
    ]).then(function(results) {
        var stateInfo = results[1];

        // Add state info to section title
        var stateIndicator = StateIndicator.render(stateInfo.current_state);
        var titleNode = self.titleFn ? document.querySelector('.cbi-section-node h3') : null;
        if (titleNode) {
            titleNode.appendChild(document.createTextNode(' '));
            titleNode.appendChild(stateIndicator);
        }

        return results[0];
    });
};

// Add state-aware option
var stateOption = section.option(form.DummyValue, '_state', _('Service State'));
stateOption.cfgvalue = function() {
    return api.getComponentState('my-app').then(function(stateInfo) {
        return StateIndicator.render(stateInfo.current_state);
    });
};

// Add control buttons
var controlOption = section.option(form.Button, '_control', _('Service Control'));
controlOption.inputtitle = _('Start');
controlOption.onclick = function() {
    return handleStateTransition('my-app', 'starting');
};
```

### Example: WebSocket State Updates

```javascript
// Note: Requires WebSocket support in backend

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

        // Send subscribe message
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

// Usage
var ws = new StateWebSocket();
ws.connect();

ws.subscribe('luci-app-vpn-client', function(oldState, newState, stateInfo) {
    console.log('Real-time update:', oldState, '->', newState);
    // Update UI immediately
});
```

---

## Testing Examples

### Example: Unit Test for State Transitions

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

### Example: Integration Test

```bash
#!/bin/bash

test_component_lifecycle() {
    local app_id="test-app"

    echo "Testing component lifecycle for: $app_id"

    # 1. Register component
    echo "  1. Registering component..."
    secubox-component register "$app_id" app '{"name":"Test App","packages":["test-pkg"]}'

    # 2. Initialize state
    echo "  2. Initializing state..."
    secubox-state set "$app_id" available init

    # 3. Install
    echo "  3. Installing..."
    secubox-state set "$app_id" installing test
    secubox-state set "$app_id" installed test

    # 4. Activate
    echo "  4. Activating..."
    secubox-state set "$app_id" configuring test
    secubox-state set "$app_id" configured test
    secubox-state set "$app_id" activating test
    secubox-state set "$app_id" active test

    # 5. Start
    echo "  5. Starting..."
    secubox-state set "$app_id" starting test
    secubox-state set "$app_id" running test

    # 6. Stop
    echo "  6. Stopping..."
    secubox-state set "$app_id" stopping test
    secubox-state set "$app_id" stopped test

    # 7. Uninstall
    echo "  7. Uninstalling..."
    secubox-state set "$app_id" uninstalling test
    secubox-state set "$app_id" available test

    # 8. Cleanup
    echo "  8. Cleaning up..."
    secubox-component unregister "$app_id"

    echo "✓ Lifecycle test completed successfully"
}

test_component_lifecycle
```

---

**See Also:**
- [API Reference](API-REFERENCE.md)
- [State Management Guide](STATE-MANAGEMENT.md)
- [Component System Guide](COMPONENT-SYSTEM.md)

---

**Version:** 1.0
**Last Updated:** 2026-01-05
