# SecuBox 管理控制中心 - 使用示例

> **语言:** [English](../../docs/admin-control-center/EXAMPLES.md) | [Francais](../../docs-fr/admin-control-center/EXAMPLES.md) | 中文

状态管理和组件注册表操作的完整示例。

---

## 目录

1. [CLI 示例](#cli-示例)
   - [状态管理](#状态管理-cli)
   - [组件注册表](#组件注册表-cli)
   - [常见工作流](#常见工作流-cli)
2. [Shell 脚本示例](#shell-脚本示例)
3. [JavaScript 前端示例](#javascript-前端示例)
4. [集成示例](#集成示例)

---

## CLI 示例

### 状态管理 CLI

#### 基本状态操作

```bash
# 获取组件的当前状态
secubox-state get luci-app-auth-guardian

# 设置组件状态
secubox-state set luci-app-auth-guardian starting user_request

# 查看状态历史
secubox-state history luci-app-auth-guardian 20

# 列出所有运行中的组件
secubox-state list --state=running

# 列出所有应用
secubox-state list --type=app

# 验证状态一致性
secubox-state validate luci-app-auth-guardian

# 将状态数据库与系统同步
secubox-state sync
```

#### 错误处理

```bash
# 清除错误状态
secubox-state clear-error luci-app-vpn-client

# 清除错误后检查组件
secubox-state get luci-app-vpn-client
```

#### 冻结/解冻组件

```bash
# 冻结关键组件
secubox-state freeze luci-app-firewall system_critical

# 检查冻结状态
secubox-state get luci-app-firewall

# 解冻（转换回激活状态）
secubox-state set luci-app-firewall active admin_unfreeze
```

### 组件注册表 CLI

#### 组件注册

```bash
# 注册新的应用组件
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

# 注册模块
secubox-component register my-module module '{
  "name": "My Module",
  "packages": ["my-module-pkg"]
}'

# 注册小部件
secubox-component register my-widget widget '{
  "name": "My Dashboard Widget",
  "packages": ["luci-app-widget-provider"]
}'
```

#### 组件查询

```bash
# 获取组件详情
secubox-component get luci-app-auth-guardian

# 列出所有应用
secubox-component list --type=app

# 列出所有运行中的组件
secubox-component list --state=running

# 列出配置文件中的组件
secubox-component list --profile=home-security

# 显示依赖树
secubox-component tree luci-app-auth-guardian

# 显示反向依赖
secubox-component affected luci-base
```

#### 组件管理

```bash
# 更新组件设置
secubox-component set-setting luci-app-auth-guardian enabled true

# 注销组件
secubox-component unregister my-old-app
```

### 常见工作流 CLI

#### 安装应用（完整工作流）

```bash
#!/bin/bash

APP_ID="luci-app-vpn-client"

# 1. 检查组件是否已注册
if ! secubox-component get "$APP_ID" > /dev/null 2>&1; then
    echo "Component not registered, syncing registry..."
    secubox-sync-registry apps
fi

# 2. 设置状态为 installing
secubox-state set "$APP_ID" installing user_install

# 3. 执行实际安装（这将由 secubox-appstore 完成）
# opkg install luci-app-vpn-client

# 4. 成功后设置为 installed
secubox-state set "$APP_ID" installed install_success

# 5. 配置应用
secubox-state set "$APP_ID" configuring user_config

# 6. 标记为 configured
secubox-state set "$APP_ID" configured config_complete

# 7. 激活
secubox-state set "$APP_ID" activating user_activate
secubox-state set "$APP_ID" active activation_complete

# 8. 启动服务
secubox-state set "$APP_ID" starting user_start

# 9. 标记为 running
secubox-state set "$APP_ID" running start_success
```

#### 批量状态更改

```bash
#!/bin/bash

# 停止所有运行中的应用
for app_id in $(secubox-state list --state=running --type=app | jq -r '.[].id'); do
    echo "Stopping $app_id..."
    secubox-state set "$app_id" stopping bulk_shutdown
    secubox-state set "$app_id" stopped shutdown_complete
done
```

#### 健康检查脚本

```bash
#!/bin/bash

echo "=== SecuBox Component Health Check ==="
echo

# 获取所有组件
components=$(secubox-component list)

# 按状态统计
echo "Component Distribution:"
echo "  Running:     $(echo "$components" | jq '[.[] | select(.current_state=="running")] | length')"
echo "  Stopped:     $(echo "$components" | jq '[.[] | select(.current_state=="stopped")] | length')"
echo "  Error:       $(echo "$components" | jq '[.[] | select(.current_state=="error")] | length')"
echo "  Frozen:      $(echo "$components" | jq '[.[] | select(.current_state=="frozen")] | length')"
echo "  Disabled:    $(echo "$components" | jq '[.[] | select(.current_state=="disabled")] | length')"
echo

# 显示错误组件
error_count=$(echo "$components" | jq '[.[] | select(.current_state=="error")] | length')
if [ "$error_count" -gt 0 ]; then
    echo "Components in ERROR state:"
    echo "$components" | jq -r '.[] | select(.current_state=="error") | "  - \(.name) (\(.id))"'
    echo
fi

# 显示冻结组件
frozen_count=$(echo "$components" | jq '[.[] | select(.current_state=="frozen")] | length')
if [ "$frozen_count" -gt 0 ]; then
    echo "Components in FROZEN state:"
    echo "$components" | jq -r '.[] | select(.current_state=="frozen") | "  - \(.name) (\(.id))"'
    echo
fi

# 验证所有组件状态
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

## Shell 脚本示例

### 示例：启动时自动启动所有应用

```bash
#!/bin/bash
# /etc/init.d/secubox-autostart

START=99
STOP=10

start() {
    echo "Starting SecuBox components..."

    # 获取所有活动组件
    components=$(secubox-component list --state=active --type=app)

    for app_id in $(echo "$components" | jq -r '.[].id'); do
        # 检查是否启用 auto_start
        auto_start=$(secubox-component get "$app_id" | jq -r '.settings.auto_start // false')

        if [ "$auto_start" = "true" ]; then
            echo "  Starting $app_id..."
            secubox-state set "$app_id" starting boot_autostart

            # 启动管理的服务
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

    # 获取所有运行中的组件
    components=$(secubox-state list --state=running --type=app)

    for app_id in $(echo "$components" | jq -r '.[].id'); do
        echo "  Stopping $app_id..."
        secubox-state set "$app_id" stopping shutdown

        # 停止管理的服务
        services=$(secubox-component get "$app_id" | jq -r '.managed_services[]')
        for service in $services; do
            /etc/init.d/"$service" stop
        done

        secubox-state set "$app_id" stopped stop_success
    done
}
```

### 示例：组件依赖解析器

```bash
#!/bin/bash

resolve_dependencies() {
    local component_id="$1"
    local resolved=()
    local seen=()

    resolve_recursive() {
        local comp_id="$1"

        # 检查是否已处理过（循环依赖）
        for s in "${seen[@]}"; do
            if [ "$s" = "$comp_id" ]; then
                echo "Error: Circular dependency detected: $comp_id" >&2
                return 1
            fi
        done

        seen+=("$comp_id")

        # 获取必需的依赖
        local deps=$(secubox-component get "$comp_id" | jq -r '.dependencies.required[]')

        for dep in $deps; do
            resolve_recursive "$dep"
        done

        # 添加到已解析列表
        resolved+=("$comp_id")
    }

    resolve_recursive "$component_id"

    # 按安装顺序打印
    printf '%s\n' "${resolved[@]}"
}

# 使用
echo "Install order for luci-app-auth-guardian:"
resolve_dependencies "luci-app-auth-guardian"
```

### 示例：状态转换监控器

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

# 使用
watch_state_transitions "luci-app-vpn-client"
```

---

## JavaScript 前端示例

### 示例：组件仪表盘

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

            // 组件名称
            var name = E('h3', {}, comp.name);
            card.appendChild(name);

            // 状态指示器
            var state = comp.state_info ? comp.state_info.current_state : 'unknown';
            var stateIndicator = StateIndicator.render(state, {
                showIcon: true,
                showLabel: true
            });
            card.appendChild(stateIndicator);

            // 操作按钮
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

### 示例：状态转换处理器

```javascript
function handleStateTransition(componentId, newState) {
    // 显示加载指示器
    ui.showModal(_('Changing State'), [
        E('p', { 'class': 'spinning' }, _('Updating component state...'))
    ]);

    // 验证转换
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

        // 执行转换
        return api.setComponentState(componentId, newState, 'user_action');
    }).then(function(result) {
        ui.hideModal();

        if (result.success) {
            ui.addNotification(null,
                E('p', _('State changed successfully')),
                'success'
            );

            // 重新加载组件数据
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

// 使用
handleStateTransition('luci-app-vpn-client', 'starting');
```

### 示例：实时状态监控器

```javascript
var StateMonitor = baseclass.extend({
    __init__: function(componentId) {
        this.componentId = componentId;
        this.pollInterval = 2000; // 2 秒
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

// 使用
var monitor = new StateMonitor('luci-app-vpn-client');

monitor.onChange(function(oldState, newState, stateInfo) {
    console.log('State changed:', oldState, '->', newState);

    // 更新界面
    var indicator = document.getElementById('state-indicator');
    if (indicator) {
        var newIndicator = StateIndicator.render(newState);
        indicator.replaceWith(newIndicator);
    }
});

monitor.start();
```

### 示例：批量操作

```javascript
function bulkStartComponents(componentIds) {
    ui.showModal(_('Starting Components'), [
        E('p', {}, _('Starting %d components...').format(componentIds.length)),
        E('div', { 'id': 'bulk-progress' })
    ]);

    var progressDiv = document.getElementById('bulk-progress');
    var completed = 0;
    var failed = 0;

    // 并行启动所有组件
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

// 使用
var appsToStart = ['luci-app-vpn-client', 'luci-app-firewall', 'luci-app-ddns'];
bulkStartComponents(appsToStart);
```

---

## 集成示例

### 示例：具有状态感知的 LuCI 表单

```javascript
var form = new form.Map('myapp', _('My Application'));

var section = form.section(form.TypedSection, 'config');

// 向 section 添加状态指示器
section.load = function() {
    var self = this;

    return Promise.all([
        form.TypedSection.prototype.load.call(this),
        api.getComponentState('my-app')
    ]).then(function(results) {
        var stateInfo = results[1];

        // 将状态信息添加到 section 标题
        var stateIndicator = StateIndicator.render(stateInfo.current_state);
        var titleNode = self.titleFn ? document.querySelector('.cbi-section-node h3') : null;
        if (titleNode) {
            titleNode.appendChild(document.createTextNode(' '));
            titleNode.appendChild(stateIndicator);
        }

        return results[0];
    });
};

// 添加状态感知选项
var stateOption = section.option(form.DummyValue, '_state', _('Service State'));
stateOption.cfgvalue = function() {
    return api.getComponentState('my-app').then(function(stateInfo) {
        return StateIndicator.render(stateInfo.current_state);
    });
};

// 添加控制按钮
var controlOption = section.option(form.Button, '_control', _('Service Control'));
controlOption.inputtitle = _('Start');
controlOption.onclick = function() {
    return handleStateTransition('my-app', 'starting');
};
```

### 示例：WebSocket 状态更新

```javascript
// 注意：需要后端 WebSocket 支持

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

        // 发送订阅消息
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

// 使用
var ws = new StateWebSocket();
ws.connect();

ws.subscribe('luci-app-vpn-client', function(oldState, newState, stateInfo) {
    console.log('Real-time update:', oldState, '->', newState);
    // 立即更新界面
});
```

---

## 测试示例

### 示例：状态转换单元测试

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

### 示例：集成测试

```bash
#!/bin/bash

test_component_lifecycle() {
    local app_id="test-app"

    echo "Testing component lifecycle for: $app_id"

    # 1. 注册组件
    echo "  1. Registering component..."
    secubox-component register "$app_id" app '{"name":"Test App","packages":["test-pkg"]}'

    # 2. 初始化状态
    echo "  2. Initializing state..."
    secubox-state set "$app_id" available init

    # 3. 安装
    echo "  3. Installing..."
    secubox-state set "$app_id" installing test
    secubox-state set "$app_id" installed test

    # 4. 激活
    echo "  4. Activating..."
    secubox-state set "$app_id" configuring test
    secubox-state set "$app_id" configured test
    secubox-state set "$app_id" activating test
    secubox-state set "$app_id" active test

    # 5. 启动
    echo "  5. Starting..."
    secubox-state set "$app_id" starting test
    secubox-state set "$app_id" running test

    # 6. 停止
    echo "  6. Stopping..."
    secubox-state set "$app_id" stopping test
    secubox-state set "$app_id" stopped test

    # 7. 卸载
    echo "  7. Uninstalling..."
    secubox-state set "$app_id" uninstalling test
    secubox-state set "$app_id" available test

    # 8. 清理
    echo "  8. Cleaning up..."
    secubox-component unregister "$app_id"

    echo "✓ Lifecycle test completed successfully"
}

test_component_lifecycle
```

---

**另请参阅:**
- [API 参考](API-REFERENCE.md)
- [状态管理指南](STATE-MANAGEMENT.md)
- [组件系统指南](COMPONENT-SYSTEM.md)

---

**版本:** 1.0
**最后更新:** 2026-01-05
