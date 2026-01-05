# SecuBox Admin Control Center - API Reference

Complete API reference for state management, component registry, and control center features.

---

## Table of Contents

1. [RPC Backend API](#rpc-backend-api)
   - [State Management Methods](#state-management-methods)
   - [Component Registry Methods](#component-registry-methods)
2. [CLI Tools](#cli-tools)
   - [secubox-state](#secubox-state)
   - [secubox-component](#secubox-component)
   - [secubox-sync-registry](#secubox-sync-registry)
3. [JavaScript Frontend API](#javascript-frontend-api)
   - [State Management](#state-management)
   - [Component Management](#component-management)
   - [Utility Functions](#utility-functions)
4. [State Utilities](#state-utilities)
5. [UI Components](#ui-components)
6. [Data Structures](#data-structures)

---

## RPC Backend API

All RPC methods are exposed through the `luci.secubox` object.

### State Management Methods

#### `get_component_state`

Get the current state and metadata for a component.

**Parameters:**
- `component_id` (string): Unique component identifier

**Returns:**
```json
{
  "component_id": "luci-app-auth-guardian",
  "current_state": "running",
  "previous_state": "starting",
  "state_changed_at": "2026-01-05T10:30:00Z",
  "error_details": {
    "type": "runtime_error",
    "message": "Service failed to start",
    "code": "E_SERVICE_START"
  },
  "history": [
    {
      "state": "starting",
      "timestamp": "2026-01-05T10:29:45Z",
      "reason": "user_action"
    }
  ],
  "metadata": {
    "installed_version": "1.0.0",
    "catalog_version": "1.0.1"
  }
}
```

**Example:**
```javascript
L.resolveDefault(callGetComponentState('luci-app-auth-guardian'))
  .then(function(state) {
    console.log('Current state:', state.current_state);
  });
```

#### `set_component_state`

Set a new state for a component with atomic transition validation.

**Parameters:**
- `component_id` (string): Unique component identifier
- `new_state` (string): Target state (see [State Definitions](#state-definitions))
- `reason` (string): Reason for state change

**Returns:**
```json
{
  "success": true,
  "message": "State transition successful",
  "previous_state": "stopped",
  "new_state": "starting"
}
```

**Errors:**
- Invalid transition (returns `success: false`)
- Component not found
- State locked

**Example:**
```javascript
L.resolveDefault(callSetComponentState('luci-app-auth-guardian', 'starting', 'user_request'))
  .then(function(result) {
    if (result.success) {
      console.log('State changed successfully');
    }
  });
```

#### `get_state_history`

Get state transition history for a component.

**Parameters:**
- `component_id` (string): Unique component identifier
- `limit` (number, optional): Maximum number of history entries (default: 50)

**Returns:**
```json
{
  "history": [
    {
      "state": "running",
      "timestamp": "2026-01-05T10:30:00Z",
      "reason": "start_success",
      "metadata": {}
    },
    {
      "state": "starting",
      "timestamp": "2026-01-05T10:29:45Z",
      "reason": "user_action"
    }
  ]
}
```

**Example:**
```javascript
L.resolveDefault(callGetStateHistory('luci-app-auth-guardian', 10))
  .then(function(result) {
    result.history.forEach(function(entry) {
      console.log(entry.state, entry.timestamp);
    });
  });
```

#### `list_components`

List all components with optional filters.

**Parameters:**
- `state_filter` (string, optional): Filter by state (e.g., "running", "error")
- `type_filter` (string, optional): Filter by type (e.g., "app", "module")

**Returns:**
```json
{
  "components": [
    {
      "id": "luci-app-auth-guardian",
      "type": "app",
      "name": "Auth Guardian",
      "current_state": "running",
      "state_changed_at": "2026-01-05T10:30:00Z"
    }
  ]
}
```

**Example:**
```javascript
// Get all running apps
L.resolveDefault(callListComponents('running', 'app'))
  .then(function(result) {
    console.log('Running apps:', result.components.length);
  });
```

#### `freeze_component`

Mark a component as frozen (locked state, no transitions allowed).

**Parameters:**
- `component_id` (string): Unique component identifier
- `reason` (string): Reason for freezing

**Returns:**
```json
{
  "success": true,
  "message": "Component frozen successfully"
}
```

**Example:**
```javascript
L.resolveDefault(callFreezeComponent('luci-app-firewall', 'system_critical'))
  .then(function(result) {
    console.log('Component frozen');
  });
```

#### `clear_error_state`

Clear error state and reset component to last known good state.

**Parameters:**
- `component_id` (string): Unique component identifier

**Returns:**
```json
{
  "success": true,
  "message": "Error state cleared",
  "new_state": "stopped"
}
```

**Example:**
```javascript
L.resolveDefault(callClearErrorState('luci-app-vpn-client'))
  .then(function(result) {
    console.log('Error cleared, new state:', result.new_state);
  });
```

### Component Registry Methods

#### `get_component`

Get full component metadata from registry.

**Parameters:**
- `component_id` (string): Unique component identifier

**Returns:**
```json
{
  "id": "luci-app-auth-guardian",
  "type": "app",
  "name": "Auth Guardian",
  "packages": ["luci-app-auth-guardian", "nodogsplash"],
  "capabilities": ["authentication", "captive-portal"],
  "dependencies": {
    "required": ["luci-base"],
    "optional": ["uhttpd-mod-lua"]
  },
  "settings": {
    "enabled": true,
    "auto_start": true
  },
  "profiles": ["home-security", "enterprise"],
  "managed_services": ["nodogsplash"],
  "state_ref": "luci-app-auth-guardian"
}
```

#### `get_component_tree`

Get component dependency tree (recursive).

**Parameters:**
- `component_id` (string): Unique component identifier

**Returns:**
```json
{
  "component": {
    "id": "luci-app-auth-guardian",
    "name": "Auth Guardian",
    "type": "app"
  },
  "dependencies": {
    "required": [
      {
        "id": "luci-base",
        "name": "LuCI Base",
        "type": "module",
        "dependencies": {...}
      }
    ],
    "optional": []
  },
  "reverse_dependencies": [
    {
      "id": "profile-home-security",
      "type": "composite"
    }
  ]
}
```

#### `update_component_settings`

Update component settings.

**Parameters:**
- `component_id` (string): Unique component identifier
- `settings` (object): Settings key-value pairs

**Returns:**
```json
{
  "success": true,
  "updated_settings": {
    "enabled": true,
    "auto_start": false
  }
}
```

#### `validate_component_state`

Validate component state consistency with system.

**Parameters:**
- `component_id` (string): Unique component identifier

**Returns:**
```json
{
  "valid": true,
  "inconsistencies": [],
  "recommendations": []
}
```

---

## CLI Tools

### secubox-state

State management command-line interface.

#### Commands

##### `get <component-id>`

Get current state with metadata.

```bash
secubox-state get luci-app-auth-guardian
```

**Output:**
```json
{
  "component_id": "luci-app-auth-guardian",
  "current_state": "running",
  "previous_state": "starting",
  "state_changed_at": "2026-01-05T10:30:00Z"
}
```

##### `set <component-id> <state> [reason]`

Set new state with atomic transition.

```bash
secubox-state set luci-app-auth-guardian starting user_request
```

**Output:**
```
Success: State transition: stopped -> starting
```

##### `history <component-id> [limit]`

View state history.

```bash
secubox-state history luci-app-auth-guardian 10
```

##### `list [--state=STATE] [--type=TYPE]`

List components by state/type.

```bash
secubox-state list --state=running --type=app
```

##### `validate <component-id>`

Validate state consistency.

```bash
secubox-state validate luci-app-auth-guardian
```

##### `sync`

Sync state DB with actual system state.

```bash
secubox-state sync
```

##### `freeze <component-id> <reason>`

Freeze component (lock state).

```bash
secubox-state freeze luci-app-firewall system_critical
```

##### `clear-error <component-id>`

Clear error state.

```bash
secubox-state clear-error luci-app-vpn-client
```

### secubox-component

Component registry management CLI.

#### Commands

##### `list [--type=TYPE] [--state=STATE] [--profile=PROFILE]`

List components with filters.

```bash
secubox-component list --type=app --state=running
```

##### `get <component-id>`

Get component details.

```bash
secubox-component get luci-app-auth-guardian
```

##### `register <component-id> <type> [metadata-json]`

Register new component.

```bash
secubox-component register my-app app '{"name":"My App","packages":["my-app"]}'
```

**Component Types:**
- `app` - LuCI application
- `module` - opkg package
- `widget` - Dashboard widget
- `service` - System service
- `composite` - Group of components

##### `unregister <component-id>`

Remove component from registry.

```bash
secubox-component unregister my-app
```

##### `tree <component-id>`

Show dependency tree.

```bash
secubox-component tree luci-app-auth-guardian
```

##### `affected <component-id>`

Show reverse dependencies.

```bash
secubox-component affected luci-base
```

##### `set-setting <component-id> <key> <value>`

Update component setting.

```bash
secubox-component set-setting my-app enabled true
```

### secubox-sync-registry

Auto-populate component registry from catalog.

#### Commands

##### `sync`

Full registry synchronization (default).

```bash
secubox-sync-registry sync
```

##### `apps`

Sync only apps from catalog.

```bash
secubox-sync-registry apps
```

##### `plugins`

Sync only plugins from catalog directory.

```bash
secubox-sync-registry plugins
```

##### `packages`

Sync only installed packages.

```bash
secubox-sync-registry packages
```

---

## JavaScript Frontend API

### State Management

#### `api.getComponentState(component_id)`

Get component state.

```javascript
api.getComponentState('luci-app-auth-guardian')
  .then(function(state) {
    console.log('Current state:', state.current_state);
  });
```

#### `api.setComponentState(component_id, new_state, reason)`

Set component state.

```javascript
api.setComponentState('luci-app-auth-guardian', 'starting', 'user_action')
  .then(function(result) {
    if (result.success) {
      console.log('State changed');
    }
  });
```

#### `api.getStateHistory(component_id, limit)`

Get state history.

```javascript
api.getStateHistory('luci-app-auth-guardian', 10)
  .then(function(history) {
    history.forEach(function(entry) {
      console.log(entry.state, entry.timestamp);
    });
  });
```

#### `api.listComponents(state_filter, type_filter)`

List components.

```javascript
api.listComponents('running', 'app')
  .then(function(components) {
    console.log('Running apps:', components);
  });
```

#### `api.freezeComponent(component_id, reason)`

Freeze component.

```javascript
api.freezeComponent('luci-app-firewall', 'system_critical')
  .then(function(result) {
    console.log('Component frozen');
  });
```

#### `api.clearErrorState(component_id)`

Clear error state.

```javascript
api.clearErrorState('luci-app-vpn-client')
  .then(function(result) {
    console.log('Error cleared');
  });
```

### Component Management

#### `api.getComponent(component_id)`

Get component metadata.

```javascript
api.getComponent('luci-app-auth-guardian')
  .then(function(component) {
    console.log('Component:', component.name);
  });
```

#### `api.getComponentTree(component_id)`

Get dependency tree.

```javascript
api.getComponentTree('luci-app-auth-guardian')
  .then(function(tree) {
    console.log('Dependencies:', tree.dependencies);
  });
```

#### `api.updateComponentSettings(component_id, settings)`

Update settings.

```javascript
api.updateComponentSettings('luci-app-auth-guardian', {
  enabled: true,
  auto_start: false
}).then(function(result) {
  console.log('Settings updated');
});
```

### Enhanced Methods

#### `api.getComponentWithState(component_id)`

Get component with state in single call.

```javascript
api.getComponentWithState('luci-app-auth-guardian')
  .then(function(component) {
    console.log('Component:', component.name);
    console.log('State:', component.state_info.current_state);
  });
```

#### `api.getAllComponentsWithStates(filters)`

Get all components with states.

```javascript
api.getAllComponentsWithStates({ state: 'running', type: 'app' })
  .then(function(components) {
    components.forEach(function(comp) {
      console.log(comp.name, comp.state_info.current_state);
    });
  });
```

#### `api.bulkSetComponentState(component_ids, new_state, reason)`

Bulk state change.

```javascript
api.bulkSetComponentState(
  ['app1', 'app2', 'app3'],
  'stopped',
  'bulk_shutdown'
).then(function(results) {
  console.log('Bulk operation results:', results);
});
```

#### `api.getStateStatistics()`

Get state distribution statistics.

```javascript
api.getStateStatistics()
  .then(function(stats) {
    console.log('Total components:', stats.total);
    console.log('By state:', stats.by_state);
    console.log('By type:', stats.by_type);
  });
```

---

## State Utilities

JavaScript utilities in `state-utils.js`.

### Methods

#### `getStateConfig(state)`

Get full state configuration.

```javascript
var config = stateUtils.getStateConfig('running');
// Returns: { color: '#10b981', icon: '▶', label: 'Running', category: 'runtime', description: '...' }
```

#### `getStateColor(state)`

Get CSS color for state.

```javascript
var color = stateUtils.getStateColor('error');
// Returns: '#ef4444'
```

#### `canTransition(fromState, toState)`

Validate state transition.

```javascript
var valid = stateUtils.canTransition('stopped', 'starting');
// Returns: true
```

#### `getNextStates(currentState)`

Get allowed next states.

```javascript
var nextStates = stateUtils.getNextStates('stopped');
// Returns: ['starting', 'disabled', 'uninstalling']
```

#### `formatHistoryEntry(historyEntry)`

Format history for display.

```javascript
var formatted = stateUtils.formatHistoryEntry({
  state: 'running',
  timestamp: '2026-01-05T10:30:00Z',
  reason: 'user_action'
});
// Returns: "2026-01-05 10:30:00 - Running (User Action)"
```

#### `getTimeAgo(timestamp)`

Get relative time string.

```javascript
var timeAgo = stateUtils.getTimeAgo('2026-01-05T10:30:00Z');
// Returns: "5 minutes ago"
```

#### `getStateStatistics(components)`

Calculate state distribution.

```javascript
var stats = stateUtils.getStateStatistics(components);
// Returns: { total: 25, by_state: {...}, by_category: {...} }
```

---

## UI Components

### StateIndicator

Render state badges and indicators.

#### `render(state, options)`

Standard state badge.

```javascript
var badge = StateIndicator.render('running', {
  showIcon: true,
  showLabel: true,
  showTooltip: true
});
```

#### `renderCompact(state, options)`

Compact indicator (icon only).

```javascript
var indicator = StateIndicator.renderCompact('error', {
  customTooltip: 'Critical error occurred'
});
```

#### `renderPill(state, metadata, options)`

Full details pill.

```javascript
var pill = StateIndicator.renderPill('running', {
  timestamp: '2026-01-05T10:30:00Z'
}, {
  showDescription: true
});
```

#### `renderDot(state, options)`

Minimal dot indicator.

```javascript
var dot = StateIndicator.renderDot('running', {
  size: '0.75rem'
});
```

#### `renderStatistics(statistics, options)`

State distribution cards.

```javascript
var stats = StateIndicator.renderStatistics({
  by_state: { running: 10, stopped: 5, error: 2 }
});
```

### StateTimeline

Visualize state history.

#### `render(history, options)`

Vertical timeline.

```javascript
var timeline = StateTimeline.render(historyEntries, {
  limit: 20,
  showRelativeTime: true,
  showCategory: true
});
```

#### `renderCompact(history, options)`

Inline compact timeline.

```javascript
var compact = StateTimeline.renderCompact(historyEntries, {
  limit: 5
});
```

#### `renderHorizontal(history, options)`

Horizontal timeline.

```javascript
var horizontal = StateTimeline.renderHorizontal(historyEntries, {
  limit: 10
});
```

#### `renderTransitionDiagram(currentState, options)`

Interactive transition diagram.

```javascript
var diagram = StateTimeline.renderTransitionDiagram('stopped', {
  onTransitionClick: function(from, to) {
    console.log('Transition:', from, '->', to);
  }
});
```

---

## Data Structures

### State Definitions

| State | Category | Description | Color |
|-------|----------|-------------|-------|
| available | persistent | Available for installation | #6b7280 |
| installing | transient | Installation in progress | #3b82f6 |
| installed | persistent | Installed but not active | #8b5cf6 |
| configuring | transient | Configuration in progress | #3b82f6 |
| configured | transient | Configuration completed | #8b5cf6 |
| activating | transient | Activation in progress | #3b82f6 |
| active | persistent | Active but not running | #06b6d4 |
| starting | transient | Service is starting | #3b82f6 |
| running | runtime | Service is running | #10b981 |
| stopping | transient | Service is stopping | #f59e0b |
| stopped | runtime | Service is stopped | #6b7280 |
| error | error | Component encountered an error | #ef4444 |
| frozen | persistent | Component is frozen (locked) | #06b6d4 |
| disabled | persistent | Component is disabled | #9ca3af |
| uninstalling | transient | Uninstallation in progress | #f59e0b |

### State Transition Matrix

```
available → [installing]
installing → [installed, error]
installed → [configuring, uninstalling]
configuring → [configured, error]
configured → [activating, disabled]
activating → [active, error]
active → [starting, disabled, frozen]
starting → [running, error]
running → [stopping, error, frozen]
stopping → [stopped, error]
stopped → [starting, disabled, uninstalling]
error → [available, installed, stopped]
frozen → [active]
disabled → [active, uninstalling]
uninstalling → [available, error]
```

### Component Metadata Structure

```json
{
  "id": "string",
  "type": "app|module|widget|service|composite",
  "name": "string",
  "packages": ["string"],
  "capabilities": ["string"],
  "dependencies": {
    "required": ["string"],
    "optional": ["string"]
  },
  "settings": {
    "key": "value"
  },
  "profiles": ["string"],
  "managed_services": ["string"],
  "state_ref": "string",
  "metadata": {
    "installed_version": "string",
    "catalog_version": "string",
    "auto_detected": boolean
  }
}
```

### State Database Structure

```json
{
  "components": {
    "component-id": {
      "current_state": "string",
      "previous_state": "string",
      "state_changed_at": "ISO8601",
      "error_details": {
        "type": "string",
        "message": "string",
        "code": "string"
      },
      "history": [
        {
          "state": "string",
          "timestamp": "ISO8601",
          "reason": "string",
          "metadata": {}
        }
      ],
      "metadata": {}
    }
  },
  "version": "1.0",
  "last_updated": "ISO8601"
}
```

---

## Error Codes

### State Management Errors

- `E_INVALID_TRANSITION` - Invalid state transition
- `E_COMPONENT_NOT_FOUND` - Component not found
- `E_STATE_LOCKED` - Component state is locked
- `E_VALIDATION_FAILED` - State validation failed

### Component Registry Errors

- `E_COMPONENT_EXISTS` - Component already registered
- `E_INVALID_TYPE` - Invalid component type
- `E_DEPENDENCY_MISSING` - Required dependency not found
- `E_CIRCULAR_DEPENDENCY` - Circular dependency detected

---

## Performance Considerations

- State transitions use file locking (`flock`) for atomicity
- RPC methods have retry logic with exponential backoff
- State history is limited to 100 entries per component (configurable)
- Component list queries are cached for 30 seconds
- Bulk operations use Promise.all for parallel execution

---

## Security Considerations

- State transitions require proper authentication
- Frozen components cannot be modified without admin privileges
- System-critical components have additional safeguards
- All state changes are logged with reason and timestamp

---

## Migration and Compatibility

- Existing RPC methods (`get_appstore_apps`, etc.) remain functional
- State-aware methods are additive, not breaking changes
- Components without state entries default to 'available'
- Migration script auto-initializes states for existing components

---

## See Also

- [Architecture Documentation](ARCHITECTURE.md)
- [State Management Guide](STATE-MANAGEMENT.md)
- [Component System Guide](COMPONENT-SYSTEM.md)
- [User Guide](../user-guide/control-center.md)

---

**Version:** 1.0
**Last Updated:** 2026-01-05
**Maintainer:** SecuBox Development Team
