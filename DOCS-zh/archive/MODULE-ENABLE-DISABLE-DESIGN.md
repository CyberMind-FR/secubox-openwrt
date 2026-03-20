# 模块启用/禁用设计文档

> **Languages:** [English](../../DOCS/archive/MODULE-ENABLE-DISABLE-DESIGN.md) | [Francais](../../DOCS-fr/archive/MODULE-ENABLE-DISABLE-DESIGN.md) | 中文

**版本:** 0.3.1
**日期:** 2025-12-27
**作者:** Claude Code + CyberMind

## 目标

将SecuBox模块的**启动/停止**逻辑替换为**启用/禁用**逻辑（激活/停用），因为模块是**已安装的插件**，我们希望激活或停用它们，而不是临时启动或停止服务。

## 概念变更

### 之前 (v0.2.x)

```
已安装模块 → 可以是"运行中"或"已停止"
操作: 启动 / 停止 / 重启
显示状态: "运行中"（绿色）或"已停止"（灰色）
```

### 之后 (v0.3.1+)

```
已安装模块 → 可以是"已启用"或"已禁用"
操作: 启用 / 禁用
显示状态: "已激活"（绿色）或"已停用"（灰色）
补充信息: "服务运行中"（如果已启用+正在运行）
```

## 技术架构

### 1. UCI配置

`/etc/config/secubox`中的每个模块将有一个`enabled`字段：

```uci
config module 'crowdsec'
    option name 'CrowdSec Dashboard'
    option package 'luci-app-crowdsec-dashboard'
    option config 'crowdsec'
    option category 'security'
    option enabled '1'              # 新增: 1 = 已启用, 0 = 已禁用
    option icon '🛡️'
    option color '#ef4444'
```

### 2. RPCD方法 (`luci.secubox`)

#### 旧方法（已废弃）
- `start_module(module_id)` → 启动服务
- `stop_module(module_id)` → 停止服务
- `restart_module(module_id)` → 重启服务

#### 新方法 (v0.3.1+)

```javascript
// 启用模块（UCI配置 + 启动服务）
enable_module(module_id)
→ uci set secubox.${module}.enabled='1'
→ uci commit secubox
→ /etc/init.d/${service} enable
→ /etc/init.d/${service} start
→ return { success: true, message: "模块已启用" }

// 禁用模块（UCI配置 + 停止服务）
disable_module(module_id)
→ uci set secubox.${module}.enabled='0'
→ uci commit secubox
→ /etc/init.d/${service} disable
→ /etc/init.d/${service} stop
→ return { success: true, message: "模块已禁用" }

// 检查模块是否已启用
check_module_enabled(module_id)
→ return uci get secubox.${module}.enabled == '1'

// 检查服务是否正在运行（补充信息）
check_service_running(module_id)
→ return pgrep -f ${service} > /dev/null
```

### 3. 返回的数据结构

```json
{
  "modules": [
    {
      "id": "crowdsec",
      "name": "CrowdSec Dashboard",
      "category": "security",
      "installed": true,
      "enabled": true,          // 主要状态（UCI配置）
      "running": true,          // 服务状态（信息）
      "status": "active",       // enabled + running = "active"
      "icon": "🛡️",
      "color": "#ef4444"
    },
    {
      "id": "netdata",
      "name": "Netdata Monitoring",
      "category": "monitoring",
      "installed": true,
      "enabled": false,         // 模块已禁用
      "running": false,
      "status": "disabled",     // 显示状态
      "icon": "📊",
      "color": "#22c55e"
    }
  ]
}
```

### 4. 可能的状态

| enabled | running | status   | UI徽章     | 描述 |
|---------|---------|----------|------------|------|
| `true`  | `true`  | `active` | 已激活     | 模块已启用且服务正在运行 |
| `true`  | `false` | `error`  | 错误       | 模块已启用但服务已停止（问题） |
| `false` | `false` | `disabled` | 已停用   | 模块已禁用（正常状态） |
| `false` | `true`  | `unknown` | 未知      | 状态不一致（罕见） |

## 用户界面

### 主仪表板（SecuBox Hub）

**之前:**
```
[CrowdSec Dashboard]  ● 运行中    [停止] [重启]
[Netdata Monitor]     ○ 已停止    [启动]
```

**之后:**
```
[CrowdSec Dashboard]  ✓ 已激活    [禁用]
[Netdata Monitor]     ○ 已停用    [启用]
```

### 单个模块卡片

```html
<div class="module-card enabled">
  <div class="module-header">
    <span class="module-icon">🛡️</span>
    <span class="module-name">CrowdSec Dashboard</span>
    <span class="module-badge enabled">✓ 已激活</span>
  </div>
  <div class="module-status">
    <span class="status-dot running"></span>
    <span>服务正在运行</span>
  </div>
  <div class="module-actions">
    <button class="btn-disable">禁用</button>
  </div>
</div>
```

### CSS类

```css
/* 模块状态 */
.module-badge.enabled {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.module-badge.disabled {
  background: var(--sh-bg-secondary);
  color: var(--sh-text-muted);
}

.module-badge.error {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

/* 状态指示器 */
.status-dot.running {
  background: #22c55e;
  animation: pulse 2s infinite;
}

.status-dot.stopped {
  background: #94a3b8;
}
```

## JavaScript API

### 文件: `secubox/api.js`

```javascript
// 旧方法（已废弃 - 待移除）
startModule: callStartModule,     // 已废弃
stopModule: callStopModule,       // 已废弃
restartModule: callRestartModule, // 已废弃

// 新方法 (v0.3.1+)
enableModule: callEnableModule,   // 新增
disableModule: callDisableModule, // 新增

// RPC声明
var callEnableModule = rpc.declare({
  object: 'luci.secubox',
  method: 'enable_module',
  params: ['module_id'],
  expect: { success: false, message: '' }
});

var callDisableModule = rpc.declare({
  object: 'luci.secubox',
  method: 'disable_module',
  params: ['module_id'],
  expect: { success: false, message: '' }
});
```

## 数据迁移

### 迁移脚本（执行一次）

```bash
#!/bin/sh
# migrate-to-enable-disable.sh

. /lib/functions.sh

migrate_module() {
  local module="$1"
  local running=$(pgrep -f "$module" > /dev/null && echo "1" || echo "0")

  # 如果服务当前正在运行，则启用它
  if [ "$running" = "1" ]; then
    uci set secubox.${module}.enabled='1'
  else
    # 否则，默认禁用
    uci set secubox.${module}.enabled='0'
  fi
}

# 迁移所有模块
config_load secubox
config_foreach migrate_module module

uci commit secubox
echo "Migration completed"
```

## 用户文档

### README.md（待添加）

```markdown
## 模块管理

SecuBox模块是可以**启用**或**禁用**的已安装插件。

### 启用模块
- 点击模块卡片上的**"启用"**按钮
- 模块将被配置为开机自动启动
- 关联的服务将立即启动

### 禁用模块
- 点击模块卡片上的**"禁用"**按钮
- 模块将不再开机自动启动
- 关联的服务将立即停止

### 模块状态

| 徽章 | 含义 |
|------|------|
| ✓ 已激活 | 模块已启用且服务正在运行 |
| 错误 | 模块已启用但服务已停止（检查日志） |
| ○ 已停用 | 模块已禁用（正常） |

**注意:** 即使禁用，模块仍然保持安装状态。要完全移除它们，请使用APK包管理器。
```

## 待执行的测试

### RPCD单元测试

```bash
# 测试 enable_module
ubus call luci.secubox enable_module '{"module_id":"crowdsec"}'
# 预期: {"success":true,"message":"模块已启用"}

# 验证UCI配置
uci get secubox.crowdsec.enabled
# 预期: 1

# 验证服务
/etc/init.d/crowdsec enabled && echo "OK" || echo "FAIL"
pgrep crowdsec && echo "Running" || echo "Not running"

# 测试 disable_module
ubus call luci.secubox disable_module '{"module_id":"crowdsec"}'
# 预期: {"success":true,"message":"模块已禁用"}

# 验证
uci get secubox.crowdsec.enabled
# 预期: 0
```

### 界面测试

1. 打开SecuBox仪表板
2. 验证模块显示"已激活"或"已停用"
3. 点击"禁用" → 徽章变为"○ 已停用"
4. 点击"启用" → 徽章变为"✓ 已激活"
5. 验证服务确实启动/停止了
6. 刷新页面 → 状态保持（UCI）

## 受影响的模块

### SecuBox Hub (`luci-app-secubox`)

**需要修改的文件:**
- `root/usr/libexec/rpcd/luci.secubox` - RPCD后端
- `htdocs/luci-static/resources/secubox/api.js` - JS API
- `htdocs/luci-static/resources/view/secubox/dashboard.js` - 仪表板
- `htdocs/luci-static/resources/view/secubox/modules.js` - 模块列表
- `htdocs/luci-static/resources/secubox/dashboard.css` - 样式
- `root/usr/share/rpcd/acl.d/luci-app-secubox.json` - ACL权限
- `README.md` - 文档

### System Hub (`luci-app-system-hub`)

**需要修改的文件:**
- `htdocs/luci-static/resources/view/system-hub/components.js` - 组件视图
- `htdocs/luci-static/resources/view/system-hub/services.js` - 服务视图
- `README.md` - 文档

## 优势

1. **概念清晰**: "启用/禁用"比"启动/停止"更清楚地表达插件的含义
2. **持久性**: 状态在重启后保持（UCI + init.d enable/disable）
3. **一致性**: 所有模块遵循相同的逻辑
4. **更好的用户体验**: 用户理解他们是在激活/停用功能
5. **OpenWrt对齐**: 使用原生机制（`/etc/init.d/${service} enable/disable`）

## 后续步骤

- [x] 创建此设计文档
- [ ] 实现RPCD修改
- [ ] 更新JavaScript API
- [ ] 更新UI界面
- [ ] 更新ACL权限
- [ ] 创建UCI迁移脚本
- [ ] 更新文档
- [ ] 在测试路由器上测试
- [ ] 部署到生产环境

---

**维护者:** CyberMind <contact@cybermind.fr>
**许可证:** Apache-2.0
