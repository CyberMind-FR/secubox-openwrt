# SecuBox 管理控制中心 - API 参考

> **语言:** [English](../../docs/admin-control-center/API-REFERENCE.md) | [Francais](../../docs-fr/admin-control-center/API-REFERENCE.md) | 中文

状态管理、组件注册表和控制中心功能的完整 API 参考。

---

## 目录

1. [RPC 后端 API](#rpc-后端-api)
   - [状态管理方法](#状态管理方法)
   - [组件注册表方法](#组件注册表方法)
2. [CLI 工具](#cli-工具)
   - [secubox-state](#secubox-state)
   - [secubox-component](#secubox-component)
   - [secubox-sync-registry](#secubox-sync-registry)
3. [JavaScript 前端 API](#javascript-前端-api)
   - [状态管理](#状态管理)
   - [组件管理](#组件管理)
   - [实用函数](#实用函数)
4. [状态工具](#状态工具)
5. [UI 组件](#ui-组件)
6. [数据结构](#数据结构)

---

## RPC 后端 API

所有 RPC 方法都通过 `luci.secubox` 对象暴露。

### 状态管理方法

#### `get_component_state`

获取组件的当前状态和元数据。

**参数:**
- `component_id` (string): 组件唯一标识符

**返回:**
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

**示例:**
```javascript
L.resolveDefault(callGetComponentState('luci-app-auth-guardian'))
  .then(function(state) {
    console.log('Current state:', state.current_state);
  });
```

#### `set_component_state`

为组件设置新状态，支持原子转换验证。

**参数:**
- `component_id` (string): 组件唯一标识符
- `new_state` (string): 目标状态（参见[状态定义](#状态定义)）
- `reason` (string): 状态更改原因

**返回:**
```json
{
  "success": true,
  "message": "State transition successful",
  "previous_state": "stopped",
  "new_state": "starting"
}
```

**错误:**
- 无效转换（返回 `success: false`）
- 组件未找到
- 状态已锁定

**示例:**
```javascript
L.resolveDefault(callSetComponentState('luci-app-auth-guardian', 'starting', 'user_request'))
  .then(function(result) {
    if (result.success) {
      console.log('State changed successfully');
    }
  });
```

#### `get_state_history`

获取组件的状态转换历史。

**参数:**
- `component_id` (string): 组件唯一标识符
- `limit` (number, 可选): 最大历史记录条数（默认: 50）

**返回:**
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

**示例:**
```javascript
L.resolveDefault(callGetStateHistory('luci-app-auth-guardian', 10))
  .then(function(result) {
    result.history.forEach(function(entry) {
      console.log(entry.state, entry.timestamp);
    });
  });
```

#### `list_components`

列出所有组件，支持可选过滤器。

**参数:**
- `state_filter` (string, 可选): 按状态过滤（如 "running", "error"）
- `type_filter` (string, 可选): 按类型过滤（如 "app", "module"）

**返回:**
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

**示例:**
```javascript
// 获取所有运行中的应用
L.resolveDefault(callListComponents('running', 'app'))
  .then(function(result) {
    console.log('Running apps:', result.components.length);
  });
```

#### `freeze_component`

将组件标记为冻结（锁定状态，不允许转换）。

**参数:**
- `component_id` (string): 组件唯一标识符
- `reason` (string): 冻结原因

**返回:**
```json
{
  "success": true,
  "message": "Component frozen successfully"
}
```

**示例:**
```javascript
L.resolveDefault(callFreezeComponent('luci-app-firewall', 'system_critical'))
  .then(function(result) {
    console.log('Component frozen');
  });
```

#### `clear_error_state`

清除错误状态并将组件重置为最后一个已知的正常状态。

**参数:**
- `component_id` (string): 组件唯一标识符

**返回:**
```json
{
  "success": true,
  "message": "Error state cleared",
  "new_state": "stopped"
}
```

**示例:**
```javascript
L.resolveDefault(callClearErrorState('luci-app-vpn-client'))
  .then(function(result) {
    console.log('Error cleared, new state:', result.new_state);
  });
```

### 组件注册表方法

#### `get_component`

从注册表获取完整的组件元数据。

**参数:**
- `component_id` (string): 组件唯一标识符

**返回:**
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

获取组件依赖树（递归）。

**参数:**
- `component_id` (string): 组件唯一标识符

**返回:**
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

更新组件设置。

**参数:**
- `component_id` (string): 组件唯一标识符
- `settings` (object): 设置键值对

**返回:**
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

验证组件状态与系统的一致性。

**参数:**
- `component_id` (string): 组件唯一标识符

**返回:**
```json
{
  "valid": true,
  "inconsistencies": [],
  "recommendations": []
}
```

---

## CLI 工具

### secubox-state

状态管理命令行界面。

#### 命令

##### `get <component-id>`

获取当前状态及元数据。

```bash
secubox-state get luci-app-auth-guardian
```

**输出:**
```json
{
  "component_id": "luci-app-auth-guardian",
  "current_state": "running",
  "previous_state": "starting",
  "state_changed_at": "2026-01-05T10:30:00Z"
}
```

##### `set <component-id> <state> [reason]`

设置新状态，支持原子转换。

```bash
secubox-state set luci-app-auth-guardian starting user_request
```

**输出:**
```
Success: State transition: stopped -> starting
```

##### `history <component-id> [limit]`

查看状态历史。

```bash
secubox-state history luci-app-auth-guardian 10
```

##### `list [--state=STATE] [--type=TYPE]`

按状态/类型列出组件。

```bash
secubox-state list --state=running --type=app
```

##### `validate <component-id>`

验证状态一致性。

```bash
secubox-state validate luci-app-auth-guardian
```

##### `sync`

将状态数据库与实际系统状态同步。

```bash
secubox-state sync
```

##### `freeze <component-id> <reason>`

冻结组件（锁定状态）。

```bash
secubox-state freeze luci-app-firewall system_critical
```

##### `clear-error <component-id>`

清除错误状态。

```bash
secubox-state clear-error luci-app-vpn-client
```

### secubox-component

组件注册表管理 CLI。

#### 命令

##### `list [--type=TYPE] [--state=STATE] [--profile=PROFILE]`

带过滤器列出组件。

```bash
secubox-component list --type=app --state=running
```

##### `get <component-id>`

获取组件详情。

```bash
secubox-component get luci-app-auth-guardian
```

##### `register <component-id> <type> [metadata-json]`

注册新组件。

```bash
secubox-component register my-app app '{"name":"My App","packages":["my-app"]}'
```

**组件类型:**
- `app` - LuCI 应用
- `module` - opkg 包
- `widget` - 仪表盘小部件
- `service` - 系统服务
- `composite` - 组件组

##### `unregister <component-id>`

从注册表中移除组件。

```bash
secubox-component unregister my-app
```

##### `tree <component-id>`

显示依赖树。

```bash
secubox-component tree luci-app-auth-guardian
```

##### `affected <component-id>`

显示反向依赖。

```bash
secubox-component affected luci-base
```

##### `set-setting <component-id> <key> <value>`

更新组件设置。

```bash
secubox-component set-setting my-app enabled true
```

### secubox-sync-registry

从目录自动填充组件注册表。

#### 命令

##### `sync`

完整注册表同步（默认）。

```bash
secubox-sync-registry sync
```

##### `apps`

仅从目录同步应用。

```bash
secubox-sync-registry apps
```

##### `plugins`

仅从目录同步插件。

```bash
secubox-sync-registry plugins
```

##### `packages`

仅同步已安装的包。

```bash
secubox-sync-registry packages
```

---

## JavaScript 前端 API

### 状态管理

#### `api.getComponentState(component_id)`

获取组件状态。

```javascript
api.getComponentState('luci-app-auth-guardian')
  .then(function(state) {
    console.log('Current state:', state.current_state);
  });
```

#### `api.setComponentState(component_id, new_state, reason)`

设置组件状态。

```javascript
api.setComponentState('luci-app-auth-guardian', 'starting', 'user_action')
  .then(function(result) {
    if (result.success) {
      console.log('State changed');
    }
  });
```

#### `api.getStateHistory(component_id, limit)`

获取状态历史。

```javascript
api.getStateHistory('luci-app-auth-guardian', 10)
  .then(function(history) {
    history.forEach(function(entry) {
      console.log(entry.state, entry.timestamp);
    });
  });
```

#### `api.listComponents(state_filter, type_filter)`

列出组件。

```javascript
api.listComponents('running', 'app')
  .then(function(components) {
    console.log('Running apps:', components);
  });
```

#### `api.freezeComponent(component_id, reason)`

冻结组件。

```javascript
api.freezeComponent('luci-app-firewall', 'system_critical')
  .then(function(result) {
    console.log('Component frozen');
  });
```

#### `api.clearErrorState(component_id)`

清除错误状态。

```javascript
api.clearErrorState('luci-app-vpn-client')
  .then(function(result) {
    console.log('Error cleared');
  });
```

### 组件管理

#### `api.getComponent(component_id)`

获取组件元数据。

```javascript
api.getComponent('luci-app-auth-guardian')
  .then(function(component) {
    console.log('Component:', component.name);
  });
```

#### `api.getComponentTree(component_id)`

获取依赖树。

```javascript
api.getComponentTree('luci-app-auth-guardian')
  .then(function(tree) {
    console.log('Dependencies:', tree.dependencies);
  });
```

#### `api.updateComponentSettings(component_id, settings)`

更新设置。

```javascript
api.updateComponentSettings('luci-app-auth-guardian', {
  enabled: true,
  auto_start: false
}).then(function(result) {
  console.log('Settings updated');
});
```

### 增强方法

#### `api.getComponentWithState(component_id)`

一次调用获取组件及其状态。

```javascript
api.getComponentWithState('luci-app-auth-guardian')
  .then(function(component) {
    console.log('Component:', component.name);
    console.log('State:', component.state_info.current_state);
  });
```

#### `api.getAllComponentsWithStates(filters)`

获取所有组件及其状态。

```javascript
api.getAllComponentsWithStates({ state: 'running', type: 'app' })
  .then(function(components) {
    components.forEach(function(comp) {
      console.log(comp.name, comp.state_info.current_state);
    });
  });
```

#### `api.bulkSetComponentState(component_ids, new_state, reason)`

批量状态更改。

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

获取状态分布统计。

```javascript
api.getStateStatistics()
  .then(function(stats) {
    console.log('Total components:', stats.total);
    console.log('By state:', stats.by_state);
    console.log('By type:', stats.by_type);
  });
```

---

## 状态工具

`state-utils.js` 中的 JavaScript 工具。

### 方法

#### `getStateConfig(state)`

获取完整的状态配置。

```javascript
var config = stateUtils.getStateConfig('running');
// 返回: { color: '#10b981', icon: '▶', label: 'Running', category: 'runtime', description: '...' }
```

#### `getStateColor(state)`

获取状态的 CSS 颜色。

```javascript
var color = stateUtils.getStateColor('error');
// 返回: '#ef4444'
```

#### `canTransition(fromState, toState)`

验证状态转换。

```javascript
var valid = stateUtils.canTransition('stopped', 'starting');
// 返回: true
```

#### `getNextStates(currentState)`

获取允许的下一个状态。

```javascript
var nextStates = stateUtils.getNextStates('stopped');
// 返回: ['starting', 'disabled', 'uninstalling']
```

#### `formatHistoryEntry(historyEntry)`

格式化历史记录以供显示。

```javascript
var formatted = stateUtils.formatHistoryEntry({
  state: 'running',
  timestamp: '2026-01-05T10:30:00Z',
  reason: 'user_action'
});
// 返回: "2026-01-05 10:30:00 - Running (User Action)"
```

#### `getTimeAgo(timestamp)`

获取相对时间字符串。

```javascript
var timeAgo = stateUtils.getTimeAgo('2026-01-05T10:30:00Z');
// 返回: "5 minutes ago"
```

#### `getStateStatistics(components)`

计算状态分布。

```javascript
var stats = stateUtils.getStateStatistics(components);
// 返回: { total: 25, by_state: {...}, by_category: {...} }
```

---

## UI 组件

### StateIndicator

渲染状态徽章和指示器。

#### `render(state, options)`

标准状态徽章。

```javascript
var badge = StateIndicator.render('running', {
  showIcon: true,
  showLabel: true,
  showTooltip: true
});
```

#### `renderCompact(state, options)`

紧凑指示器（仅图标）。

```javascript
var indicator = StateIndicator.renderCompact('error', {
  customTooltip: 'Critical error occurred'
});
```

#### `renderPill(state, metadata, options)`

完整详情药丸。

```javascript
var pill = StateIndicator.renderPill('running', {
  timestamp: '2026-01-05T10:30:00Z'
}, {
  showDescription: true
});
```

#### `renderDot(state, options)`

最小点指示器。

```javascript
var dot = StateIndicator.renderDot('running', {
  size: '0.75rem'
});
```

#### `renderStatistics(statistics, options)`

状态分布卡片。

```javascript
var stats = StateIndicator.renderStatistics({
  by_state: { running: 10, stopped: 5, error: 2 }
});
```

### StateTimeline

可视化状态历史。

#### `render(history, options)`

垂直时间线。

```javascript
var timeline = StateTimeline.render(historyEntries, {
  limit: 20,
  showRelativeTime: true,
  showCategory: true
});
```

#### `renderCompact(history, options)`

内联紧凑时间线。

```javascript
var compact = StateTimeline.renderCompact(historyEntries, {
  limit: 5
});
```

#### `renderHorizontal(history, options)`

水平时间线。

```javascript
var horizontal = StateTimeline.renderHorizontal(historyEntries, {
  limit: 10
});
```

#### `renderTransitionDiagram(currentState, options)`

交互式转换图。

```javascript
var diagram = StateTimeline.renderTransitionDiagram('stopped', {
  onTransitionClick: function(from, to) {
    console.log('Transition:', from, '->', to);
  }
});
```

---

## 数据结构

### 状态定义

| 状态 | 类别 | 描述 | 颜色 |
|------|------|------|------|
| available | persistent | 可供安装 | #6b7280 |
| installing | transient | 安装进行中 | #3b82f6 |
| installed | persistent | 已安装但未激活 | #8b5cf6 |
| configuring | transient | 配置进行中 | #3b82f6 |
| configured | transient | 配置完成 | #8b5cf6 |
| activating | transient | 激活进行中 | #3b82f6 |
| active | persistent | 激活但未运行 | #06b6d4 |
| starting | transient | 服务正在启动 | #3b82f6 |
| running | runtime | 服务正在运行 | #10b981 |
| stopping | transient | 服务正在停止 | #f59e0b |
| stopped | runtime | 服务已停止 | #6b7280 |
| error | error | 组件遇到错误 | #ef4444 |
| frozen | persistent | 组件已冻结（锁定） | #06b6d4 |
| disabled | persistent | 组件已禁用 | #9ca3af |
| uninstalling | transient | 卸载进行中 | #f59e0b |

### 状态转换矩阵

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

### 组件元数据结构

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

### 状态数据库结构

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

## 错误代码

### 状态管理错误

- `E_INVALID_TRANSITION` - 无效的状态转换
- `E_COMPONENT_NOT_FOUND` - 组件未找到
- `E_STATE_LOCKED` - 组件状态已锁定
- `E_VALIDATION_FAILED` - 状态验证失败

### 组件注册表错误

- `E_COMPONENT_EXISTS` - 组件已注册
- `E_INVALID_TYPE` - 无效的组件类型
- `E_DEPENDENCY_MISSING` - 未找到必需的依赖
- `E_CIRCULAR_DEPENDENCY` - 检测到循环依赖

---

## 性能考虑

- 状态转换使用文件锁定（`flock`）以确保原子性
- RPC 方法具有指数退避的重试逻辑
- 每个组件的状态历史限制为 100 条记录（可配置）
- 组件列表查询缓存 30 秒
- 批量操作使用 Promise.all 进行并行执行

---

## 安全考虑

- 状态转换需要适当的身份验证
- 冻结的组件需要管理员权限才能修改
- 系统关键组件有额外的保护措施
- 所有状态更改都会记录原因和时间戳

---

## 迁移和兼容性

- 现有 RPC 方法（`get_appstore_apps` 等）保持功能正常
- 状态感知方法是附加的，不是破坏性更改
- 没有状态条目的组件默认为 'available'
- 迁移脚本自动为现有组件初始化状态

---

## 另请参阅

- [架构文档](ARCHITECTURE.md)
- [状态管理指南](STATE-MANAGEMENT.md)
- [组件系统指南](COMPONENT-SYSTEM.md)
- [用户指南](../user-guide/control-center.md)

---

**版本:** 1.0
**最后更新:** 2026-01-05
**维护者:** SecuBox 开发团队
