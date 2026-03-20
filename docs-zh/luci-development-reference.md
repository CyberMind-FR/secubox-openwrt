# LuCI 开发参考指南

> **语言:** [English](../docs/luci-development-reference.md) | [Francais](../docs-fr/luci-development-reference.md) | 中文

**版本:** 1.0.0
**最后更新:** 2025-12-28
**状态:** 活跃
**基于:** luci-app-secubox 和 luci-app-system-hub 实现
**目标受众:** Claude.ai 和从事 OpenWrt LuCI 应用开发的开发人员

---

## 另请参阅

- **设计与标准:** [DEVELOPMENT-GUIDELINES.md](development-guidelines.md)
- **快速命令:** [QUICK-START.md](quick-start.md)
- **自动化简报:** [CODEX.md](codex.md)
- **代码模板:** [CODE-TEMPLATES.md](code-templates.md)

本文档记录了在开发 SecuBox LuCI 应用程序过程中发现的关键模式、最佳实践和常见陷阱。请将此作为所有未来 LuCI 应用开发的验证参考。

---

## 目录

1. [ubus 和 RPC 基础](#ubus-和-rpc-基础)
2. [RPCD 后端模式](#rpcd-后端模式)
3. [LuCI API 模块模式](#luci-api-模块模式)
4. [LuCI 视图导入模式](#luci-视图导入模式)
5. [ACL 权限结构](#acl-权限结构)
6. [数据结构约定](#数据结构约定)
7. [常见错误和解决方案](#常见错误和解决方案)
8. [验证清单](#验证清单)
9. [测试和部署](#测试和部署)

---

## ubus 和 RPC 基础

### 什么是 ubus？

**ubus**（OpenWrt 微总线架构）是 OpenWrt 的进程间通信（IPC）系统。它支持：
- 进程间的 RPC（远程过程调用）
- Web 界面（LuCI）与后端服务的通信
- 通过 `ubus call` 进行命令行交互

### ubus 对象命名约定

**关键规则**：所有 LuCI 应用程序的 ubus 对象必须使用 `luci.` 前缀。

```javascript
// ✅ 正确
object: 'luci.system-hub'
object: 'luci.cdn-cache'
object: 'luci.wireguard-dashboard'

// ❌ 错误
object: 'system-hub'
object: 'systemhub'
object: 'cdn-cache'
```

**为什么？** LuCI 期望 Web 应用程序的对象在 `luci.*` 命名空间下。如果没有此前缀：
- ACL 权限将不匹配
- RPCD 将无法正确路由调用
- 浏览器控制台显示：`RPC call to system-hub/status failed with error -32000: Object not found`

### RPCD 脚本名称必须与 ubus 对象匹配

RPCD 脚本文件名必须与 ubus 对象名称完全匹配：

```bash
# 如果 JavaScript 声明：
# object: 'luci.system-hub'

# 那么 RPCD 脚本必须命名为：
/usr/libexec/rpcd/luci.system-hub

# 而不是：
/usr/libexec/rpcd/system-hub
/usr/libexec/rpcd/luci-system-hub
```

**验证命令**：
```bash
# 检查 JavaScript 文件中的 ubus 对象名称
grep -r "object:" luci-app-*/htdocs --include="*.js"

# 验证 RPCD 脚本是否存在且名称匹配
ls luci-app-*/root/usr/libexec/rpcd/
```

### ubus 调用类型

**读操作**（类似 GET）：
- `status` - 获取当前状态
- `get_*` - 检索数据（例如 `get_health`、`get_settings`）
- `list_*` - 枚举项目（例如 `list_services`）

**写操作**（类似 POST）：
- `save_*` - 持久化配置（例如 `save_settings`）
- `*_action` - 执行操作（例如 `service_action`）
- `backup`、`restore`、`reboot` - 系统修改

**ACL 映射**：
- 读操作 → ACL 中的 `"read"` 部分
- 写操作 → ACL 中的 `"write"` 部分

---

## RPCD 后端模式

### Shell 脚本结构

RPCD 后端是可执行的 shell 脚本，它们：
1. 解析 `$1` 获取操作（`list` 或 `call`）
2. 解析 `$2` 获取方法名称（如果是 `call`）
3. 从 stdin 读取 JSON 输入（用于带参数的方法）
4. 将 JSON 输出到 stdout
5. 成功时退出状态为 0，失败时为非零

### 标准模板

```bash
#!/bin/sh
# RPCD 后端：luci.system-hub
# 版本：0.1.0

# 加载 JSON shell 助手
. /usr/share/libubox/jshn.sh

case "$1" in
    list)
        # 列出所有可用方法及其参数
        echo '{
            "status": {},
            "get_health": {},
            "service_action": { "service": "string", "action": "string" },
            "save_settings": {
                "auto_refresh": 0,
                "health_check": 0,
                "refresh_interval": 0
            }
        }'
        ;;
    call)
        case "$2" in
            status)
                status
                ;;
            get_health)
                get_health
                ;;
            service_action)
                # 从 stdin 读取 JSON 输入
                read -r input
                json_load "$input"
                json_get_var service service
                json_get_var action action
                service_action "$service" "$action"
                ;;
            save_settings)
                read -r input
                json_load "$input"
                json_get_var auto_refresh auto_refresh
                json_get_var health_check health_check
                json_get_var refresh_interval refresh_interval
                save_settings "$auto_refresh" "$health_check" "$refresh_interval"
                ;;
            *)
                echo '{"error": "Method not found"}'
                exit 1
                ;;
        esac
        ;;
esac
```

### 使用 jshn.sh 输出 JSON

**jshn.sh** 提供了用于 JSON 操作的 shell 函数：

```bash
# 初始化 JSON 对象
json_init

# 添加简单值
json_add_string "hostname" "openwrt"
json_add_int "uptime" 86400
json_add_boolean "running" 1

# 添加嵌套对象
json_add_object "cpu"
json_add_int "usage" 25
json_add_string "status" "ok"
json_close_object

# 添加数组
json_add_array "services"
json_add_string "" "network"
json_add_string "" "firewall"
json_close_array

# 将 JSON 输出到 stdout
json_dump
```

**常用函数**：
- `json_init` - 开始新的 JSON 对象
- `json_add_string "key" "value"` - 添加字符串
- `json_add_int "key" 123` - 添加整数
- `json_add_boolean "key" 1` - 添加布尔值（0 或 1）
- `json_add_object "key"` - 开始嵌套对象
- `json_close_object` - 结束嵌套对象
- `json_add_array "key"` - 开始数组
- `json_close_array` - 结束数组
- `json_dump` - 将 JSON 输出到 stdout

### 错误处理

始终验证输入并返回有意义的错误：

```bash
service_action() {
    local service="$1"
    local action="$2"

    # 验证服务名称
    if [ -z "$service" ]; then
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Service name is required"
        json_dump
        return 1
    fi

    # 验证操作
    case "$action" in
        start|stop|restart|enable|disable)
            ;;
        *)
            json_init
            json_add_boolean "success" 0
            json_add_string "error" "Invalid action: $action"
            json_dump
            return 1
            ;;
    esac

    # 执行操作
    /etc/init.d/"$service" "$action" >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        json_init
        json_add_boolean "success" 1
        json_add_string "message" "Service $service $action successful"
        json_dump
    else
        json_init
        json_add_boolean "success" 0
        json_add_string "error" "Service $service $action failed"
        json_dump
        return 1
    fi
}
```

### UCI 集成

对于持久化配置，使用 UCI（统一配置接口）：

```bash
save_settings() {
    local auto_refresh="$1"
    local health_check="$2"
    local refresh_interval="$3"

    # 创建/更新 UCI 配置
    uci set system-hub.general=general
    uci set system-hub.general.auto_refresh="$auto_refresh"
    uci set system-hub.general.health_check="$health_check"
    uci set system-hub.general.refresh_interval="$refresh_interval"
    uci commit system-hub

    json_init
    json_add_boolean "success" 1
    json_add_string "message" "Settings saved successfully"
    json_dump
}

get_settings() {
    # 加载 UCI 配置
    if [ -f "/etc/config/system-hub" ]; then
        . /lib/functions.sh
        config_load system-hub
    fi

    json_init
    json_add_object "general"

    # 获取值或使用默认值
    config_get auto_refresh general auto_refresh "1"
    json_add_boolean "auto_refresh" "${auto_refresh:-1}"

    config_get refresh_interval general refresh_interval "30"
    json_add_int "refresh_interval" "${refresh_interval:-30}"

    json_close_object
    json_dump
}
```

### 性能提示

1. **缓存昂贵的操作**：不要多次重复读取 `/proc` 文件
2. **高效使用命令替换**：
   ```bash
   # 好
   uptime=$(cat /proc/uptime | cut -d' ' -f1)

   # 更好
   read uptime _ < /proc/uptime
   uptime=${uptime%.*}
   ```
3. **尽可能避免外部命令**：
   ```bash
   # 慢
   count=$(ls /etc/init.d | wc -l)

   # 快
   count=0
   for file in /etc/init.d/*; do
       [ -f "$file" ] && count=$((count + 1))
   done
   ```

---

## LuCI API 模块模式

### 关键：使用 baseclass.extend()

**规则**：LuCI API 模块必须使用 `baseclass.extend()` 模式。

```javascript
'use strict';
'require baseclass';
'require rpc';

// 声明 RPC 方法
var callStatus = rpc.declare({
    object: 'luci.system-hub',
    method: 'status',
    expect: {}
});

var callGetHealth = rpc.declare({
    object: 'luci.system-hub',
    method: 'get_health',
    expect: {}
});

var callSaveSettings = rpc.declare({
    object: 'luci.system-hub',
    method: 'save_settings',
    params: ['auto_refresh', 'health_check', 'refresh_interval'],
    expect: {}
});

// ✅ 正确：使用 baseclass.extend()
return baseclass.extend({
    getStatus: callStatus,
    getHealth: callGetHealth,
    saveSettings: callSaveSettings
});

// ❌ 错误：不要使用这些模式
return baseclass.singleton({...});  // 会破坏一切！
return {...};  // 普通对象不起作用
```

**为什么使用 baseclass.extend()？**
- LuCI 的模块系统期望基于类的模块
- 视图使用 `'require module/api as API'` 导入，会自动实例化
- `baseclass.extend()` 创建正确的类构造函数
- `baseclass.singleton()` 会破坏实例化机制
- 普通对象不支持 LuCI 的模块生命周期

### rpc.declare() 参数

```javascript
var callMethodName = rpc.declare({
    object: 'luci.module-name',     // ubus 对象名称（必须以 luci. 开头）
    method: 'method_name',          // RPCD 方法名称
    params: ['param1', 'param2'],   // 可选：参数名称（顺序很重要！）
    expect: {}                      // 期望的返回结构（或 { key: [] } 用于数组）
});
```

**参数顺序很重要**：
```javascript
// RPCD 期望参数按此确切顺序
var callSaveSettings = rpc.declare({
    object: 'luci.system-hub',
    method: 'save_settings',
    params: ['auto_refresh', 'health_check', 'debug_mode', 'refresh_interval'],
    expect: {}
});

// JavaScript 调用必须按相同顺序传递参数
API.saveSettings(1, 1, 0, 30);  // auto_refresh=1, health_check=1, debug_mode=0, refresh_interval=30
```

### expect 参数模式

```javascript
// 方法返回单个对象
expect: {}

// 方法在顶层返回数组
expect: { services: [] }

// 方法返回特定结构
expect: {
    services: [],
    count: 0
}
```

### API 模块中的错误处理

API 方法返回 Promise。在视图中处理错误：

```javascript
return API.getHealth().then(function(data) {
    if (!data || typeof data !== 'object') {
        console.error('Invalid health data:', data);
        return null;
    }
    return data;
}).catch(function(err) {
    console.error('Failed to load health data:', err);
    ui.addNotification(null, E('p', {}, 'Failed to load health data'), 'error');
    return null;
});
```

---

## LuCI 视图导入模式

### 关键：为 API 使用 'require ... as VAR'

**规则**：导入 API 模块时，在文件顶部使用 `'require ... as VAR'` 模式。

```javascript
// ✅ 正确：自动实例化类
'require system-hub/api as API';

return L.view.extend({
    load: function() {
        return API.getHealth();  // API 已经实例化
    }
});

// ❌ 错误：返回类构造函数，而不是实例
var api = L.require('system-hub.api');
api.getHealth();  // 错误：api.getHealth is not a function
```

**为什么？**
- `'require module/path as VAR'`（使用斜杠）自动实例化类
- `L.require('module.path')`（使用点）返回原始类构造函数
- API 模块扩展 `baseclass`，需要实例化
- 使用 `as VAR` 模式时，LuCI 的模块加载器处理实例化

### 标准视图结构

```javascript
'use strict';
'require view';
'require form';
'require ui';
'require system-hub/api as API';

return L.view.extend({
    load: function() {
        // 加载渲染所需的数据
        return Promise.all([
            API.getHealth(),
            API.getStatus()
        ]);
    },

    render: function(data) {
        var health = data[0];
        var status = data[1];

        // 创建 UI 元素
        var container = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'Dashboard'),
            // ... 更多元素
        ]);

        return container;
    },

    handleSave: null,  // 禁用保存按钮
    handleSaveApply: null,  // 禁用保存并应用按钮
    handleReset: null  // 禁用重置按钮
});
```

### 导入模式总结

```javascript
// 核心 LuCI 模块（始终使用引号）
'require view';
'require form';
'require ui';
'require rpc';
'require baseclass';

// 自定义 API 模块（使用 'as VAR' 进行自动实例化）
'require system-hub/api as API';
'require cdn-cache/api as CdnAPI';

// 访问全局 L 对象（无需 require）
L.resolveDefault(...)
L.Poll.add(...)
L.ui.addNotification(...)
```

---

## ACL 权限结构

### 文件位置

ACL 文件位于：
```
/usr/share/rpcd/acl.d/luci-app-<模块名称>.json
```

在源代码树中：
```
luci-app-<模块名称>/root/usr/share/rpcd/acl.d/luci-app-<模块名称>.json
```

### 标准 ACL 模板

```json
{
    "luci-app-module-name": {
        "description": "Module Name - Description",
        "read": {
            "ubus": {
                "luci.module-name": [
                    "status",
                    "get_system_info",
                    "get_health",
                    "list_services",
                    "get_logs",
                    "get_storage",
                    "get_settings"
                ]
            }
        },
        "write": {
            "ubus": {
                "luci.module-name": [
                    "service_action",
                    "backup_config",
                    "restore_config",
                    "reboot",
                    "save_settings"
                ]
            }
        }
    }
}
```

### 读取与写入分类

**读操作**（不修改系统）：
- `status` - 获取当前状态
- `get_*` - 检索数据（系统信息、健康状况、设置、日志、存储）
- `list_*` - 枚举项目（服务、接口等）

**写操作**（修改系统状态）：
- `*_action` - 执行操作（启动/停止服务等）
- `save_*` - 持久化配置更改
- `backup`、`restore` - 系统备份/恢复
- `reboot`、`shutdown` - 系统控制

### 常见 ACL 错误

**错误**：`Access denied` 或 RPC 错误 `-32002`

**原因**：方法未在 ACL 文件中列出，或列在错误的部分（读取与写入）

**解决方案**：
1. 确定方法是读操作还是写操作
2. 将方法名称添加到 ACL 的正确部分
3. 重启 RPCD：`/etc/init.d/rpcd restart`

**验证**：
```bash
# 检查 ACL 文件是否为有效 JSON
jsonlint /usr/share/rpcd/acl.d/luci-app-system-hub.json

# 列出所有 ubus 对象和方法
ubus list luci.system-hub

# 使用 ubus call 测试方法
ubus call luci.system-hub get_health
```

---

## 数据结构约定

### 健康指标结构（system-hub v0.1.0）

基于大量迭代，此结构提供清晰性和一致性：

```json
{
    "cpu": {
        "usage": 25,
        "status": "ok",
        "load_1m": "0.25",
        "load_5m": "0.30",
        "load_15m": "0.28",
        "cores": 4
    },
    "memory": {
        "total_kb": 4096000,
        "free_kb": 2048000,
        "available_kb": 3072000,
        "used_kb": 1024000,
        "buffers_kb": 512000,
        "cached_kb": 1536000,
        "usage": 25,
        "status": "ok"
    },
    "disk": {
        "total_kb": 30408704,
        "used_kb": 5447680,
        "free_kb": 24961024,
        "usage": 19,
        "status": "ok"
    },
    "temperature": {
        "value": 45,
        "status": "ok"
    },
    "network": {
        "wan_up": true,
        "status": "ok"
    },
    "services": {
        "running": 35,
        "failed": 2
    },
    "score": 92,
    "timestamp": "2025-12-26 10:30:00",
    "recommendations": [
        "2 service(s) enabled but not running. Check service status."
    ]
}
```

**关键原则**：
1. **嵌套对象**用于相关指标（cpu、memory、disk 等）
2. **一致的结构**：每个指标都有 `usage`（百分比）和 `status`（ok/warning/critical）
3. **原始值 + 计算值**：同时提供（例如 `used_kb` 和 `usage` 百分比）
4. **状态阈值**：ok（< warning）、warning（warning-critical）、critical（>= critical）
5. **总体评分**：仪表板的单一 0-100 健康评分
6. **动态建议**：基于阈值的可操作警报数组

### 状态值

对所有指标使用一致的状态字符串：
- `"ok"` - 正常运行（绿色）
- `"warning"` - 接近阈值（橙色）
- `"critical"` - 超过阈值（红色）
- `"error"` - 无法检索指标
- `"unknown"` - 指标不可用

### 时间戳格式

使用 ISO 8601 或一致的本地格式：
```bash
timestamp="$(date '+%Y-%m-%d %H:%M:%S')"  # 2025-12-26 10:30:00
```

### JSON 中的布尔值

在使用 jshn.sh 的 shell 脚本中：
```bash
json_add_boolean "wan_up" 1  # true
json_add_boolean "wan_up" 0  # false
```

在 JavaScript 中：
```javascript
if (health.network.wan_up) {
    // WAN 已连接
}
```

### 数组与单值

**对以下情况使用数组**：
- 相同类型的多个项目（服务、接口、挂载点）
- 可变长度数据

**对以下情况使用单值**：
- 系统范围的指标（CPU、内存、磁盘）
- 主要/聚合值（总体温度、总运行时间）

**示例 - 存储**：
```json
// 多个挂载点 - 使用数组
"storage": [
    {
        "mount": "/",
        "total_kb": 30408704,
        "used_kb": 5447680,
        "usage": 19
    },
    {
        "mount": "/mnt/usb",
        "total_kb": 128000000,
        "used_kb": 64000000,
        "usage": 50
    }
]

// 仅根文件系统 - 使用对象
"disk": {
    "total_kb": 30408704,
    "used_kb": 5447680,
    "usage": 19,
    "status": "ok"
}
```

---

## 常见错误和解决方案

### 1. RPC 错误："Object not found" (-32000)

**错误消息**：
```
RPC call to system-hub/status failed with error -32000: Object not found
```

**原因**：RPCD 脚本名称与 JavaScript 中的 ubus 对象名称不匹配

**解决方案**：
1. 检查 JavaScript 中的对象名称：
   ```bash
   grep -r "object:" luci-app-system-hub/htdocs --include="*.js"
   ```
   输出：`object: 'luci.system-hub'`

2. 重命名 RPCD 脚本以完全匹配：
   ```bash
   mv root/usr/libexec/rpcd/system-hub root/usr/libexec/rpcd/luci.system-hub
   ```

3. 确保脚本可执行：
   ```bash
   chmod +x root/usr/libexec/rpcd/luci.system-hub
   ```

4. 重启 RPCD：
   ```bash
   /etc/init.d/rpcd restart
   ```

### 2. JavaScript 错误："api.methodName is not a function"

**错误消息**：
```
Uncaught TypeError: api.getHealth is not a function
    at view.load (health.js:12)
```

**原因**：错误的导入模式 - 导入了类构造函数而不是实例

**解决方案**：
从：
```javascript
var api = L.require('system-hub.api');  // ❌ 错误
```

改为：
```javascript
'require system-hub/api as API';  // ✅ 正确
```

**为什么**：`L.require('module.path')` 返回原始类，`'require module/path as VAR'` 自动实例化。

### 3. RPC 错误："Access denied" (-32002)

**错误消息**：
```
RPC call to luci.system-hub/get_settings failed with error -32002: Access denied
```

**原因**：方法未在 ACL 文件中列出，或在错误的部分（读取与写入）

**解决方案**：
1. 打开 ACL 文件：`root/usr/share/rpcd/acl.d/luci-app-system-hub.json`

2. 将方法添加到适当的部分：
   ```json
   "read": {
       "ubus": {
           "luci.system-hub": [
               "get_settings"
           ]
       }
   }
   ```

3. 部署并重启 RPCD：
   ```bash
   scp luci-app-system-hub/root/usr/share/rpcd/acl.d/*.json router:/usr/share/rpcd/acl.d/
   ssh router "/etc/init.d/rpcd restart"
   ```

### 4. 显示错误："NaN%" 或未定义值

**错误**：仪表板显示 "NaN%"、"undefined" 或空值

**原因**：前端使用了错误的数据结构键（后端更改后已过时）

**解决方案**：
1. 检查后端输出：
   ```bash
   ubus call luci.system-hub get_health
   ```

2. 更新前端以匹配结构：
   ```javascript
   // ❌ 旧结构
   var cpuPercent = health.load / health.cores * 100;
   var memPercent = health.memory.percent;

   // ✅ 新结构
   var cpuPercent = health.cpu ? health.cpu.usage : 0;
   var memPercent = health.memory ? health.memory.usage : 0;
   ```

3. 添加 null/undefined 检查：
   ```javascript
   var temp = health.temperature?.value || 0;
   var loadAvg = health.cpu?.load_1m || '0.00';
   ```

### 5. HTTP 404：找不到视图文件

**错误消息**：
```
HTTP error 404 while loading class file '/luci-static/resources/view/netifyd/overview.js'
```

**原因**：菜单路径与实际视图文件位置不匹配

**解决方案**：
1. 检查菜单 JSON：
   ```bash
   cat root/usr/share/luci/menu.d/luci-app-netifyd-dashboard.json
   ```
   查找：`"path": "netifyd/overview"`

2. 检查实际文件位置：
   ```bash
   ls htdocs/luci-static/resources/view/
   ```
   文件位于：`view/netifyd-dashboard/overview.js`

3. 修复菜单路径或文件位置：
   ```json
   // 选项 1：更新菜单路径以匹配文件
   "path": "netifyd-dashboard/overview"

   // 选项 2：移动文件以匹配菜单
   mv view/netifyd-dashboard/ view/netifyd/
   ```

### 6. 构建错误："factory yields invalid constructor"

**错误消息**：
```
/luci-static/resources/system-hub/api.js: factory yields invalid constructor
```

**原因**：在 API 模块中使用了错误的模式（singleton、普通对象等）

**解决方案**：
始终使用 `baseclass.extend()`：
```javascript
return baseclass.extend({
    getStatus: callStatus,
    getHealth: callGetHealth,
    // ... 更多方法
});
```

不要使用：
- `baseclass.singleton({...})`
- 普通对象：`return {...}`
- `baseclass.prototype`

### 7. 更改后 RPCD 无响应

**症状**：对 RPCD 脚本的更改不生效

**解决方案**：
1. 验证脚本已部署：
   ```bash
   ssh router "ls -la /usr/libexec/rpcd/"
   ```

2. 检查脚本是否可执行：
   ```bash
   ssh router "chmod +x /usr/libexec/rpcd/luci.system-hub"
   ```

3. 重启 RPCD：
   ```bash
   ssh router "/etc/init.d/rpcd restart"
   ```

4. 清除浏览器缓存（Ctrl+Shift+R）

5. 检查 RPCD 日志：
   ```bash
   ssh router "logread | grep rpcd"
   ```

---

## 验证清单

在部署前使用此清单：

### 文件结构
- [ ] RPCD 脚本存在：`/usr/libexec/rpcd/luci.<模块名称>`
- [ ] RPCD 脚本可执行：`chmod +x`
- [ ] 菜单 JSON 存在：`/usr/share/luci/menu.d/luci-app-<模块>.json`
- [ ] ACL JSON 存在：`/usr/share/rpcd/acl.d/luci-app-<模块>.json`
- [ ] API 模块存在：`htdocs/luci-static/resources/<模块>/api.js`
- [ ] 视图存在：`htdocs/luci-static/resources/view/<模块>/*.js`

### 命名约定
- [ ] RPCD 脚本名称与 JavaScript 中的 ubus 对象匹配（包括 `luci.` 前缀）
- [ ] 菜单路径与视图文件目录结构匹配
- [ ] 所有 ubus 对象以 `luci.` 开头
- [ ] ACL 键与包名称匹配：`"luci-app-<模块>"`

### 代码验证
- [ ] API 模块使用 `baseclass.extend()` 模式
- [ ] 视图使用 `'require <模块>/api as API'` 模式导入 API
- [ ] 所有 rpc.declare() 调用包含正确的 `object`、`method`、`params`、`expect`
- [ ] RPCD 脚本输出有效 JSON（使用 `ubus call` 测试）
- [ ] 菜单 JSON 有效（使用 `jsonlint` 测试）
- [ ] ACL JSON 有效（使用 `jsonlint` 测试）

### 权限
- [ ] 所有读方法在 ACL `"read"` 部分
- [ ] 所有写方法在 ACL `"write"` 部分
- [ ] ACL 中的方法与 RPCD 脚本方法名称完全匹配

### 测试
- [ ] 运行验证脚本：`./secubox-tools/validate-modules.sh`
- [ ] 通过 ubus 测试每个方法：`ubus call luci.<模块> <方法>`
- [ ] 在浏览器中测试前端（检查控制台错误）
- [ ] 部署后清除浏览器缓存
- [ ] 验证 RPCD 重启：`/etc/init.d/rpcd restart`

### 自动化验证命令

```bash
# 运行全面验证
./secubox-tools/validate-modules.sh

# 验证特定模块
./secubox-tools/validate-module-generation.sh luci-app-system-hub

# 检查 JSON 语法
find luci-app-system-hub -name "*.json" -exec jsonlint {} \;

# 检查 shell 脚本
shellcheck luci-app-system-hub/root/usr/libexec/rpcd/*
```

---

## 测试和部署

### 使用 ubus 进行本地测试

在部署到路由器之前，本地测试 RPCD 脚本：

```bash
# 将 RPCD 脚本复制到本地 /tmp
cp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub /tmp/

# 设置可执行权限
chmod +x /tmp/luci.system-hub

# 测试 'list' 操作
/tmp/luci.system-hub list

# 使用方法测试 'call' 操作
/tmp/luci.system-hub call status

# 测试带参数的方法
echo '{"service":"network","action":"restart"}' | /tmp/luci.system-hub call service_action
```

### 部署脚本

使用部署脚本进行快速迭代：

```bash
#!/bin/bash
# deploy-system-hub.sh

ROUTER="root@192.168.8.191"

echo "正在将 system-hub 部署到 $ROUTER"

# 部署 API 模块
scp luci-app-system-hub/htdocs/luci-static/resources/system-hub/api.js \
    "$ROUTER:/www/luci-static/resources/system-hub/"

# 部署视图
scp luci-app-system-hub/htdocs/luci-static/resources/view/system-hub/*.js \
    "$ROUTER:/www/luci-static/resources/view/system-hub/"

# 部署 RPCD 后端
scp luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub \
    "$ROUTER:/usr/libexec/rpcd/"

# 部署 ACL
scp luci-app-system-hub/root/usr/share/rpcd/acl.d/luci-app-system-hub.json \
    "$ROUTER:/usr/share/rpcd/acl.d/"

# 设置权限并重启
ssh "$ROUTER" "chmod +x /usr/libexec/rpcd/luci.system-hub && /etc/init.d/rpcd restart"

echo "部署完成！请清除浏览器缓存（Ctrl+Shift+R）"
```

### 浏览器测试

1. 打开浏览器控制台（F12）
2. 导航到模块页面
3. 检查错误：
   - RPC 错误（object not found、method not found、access denied）
   - JavaScript 错误（api.method is not a function）
   - 404 错误（找不到视图文件）
4. 测试功能：
   - 数据加载正确显示
   - 操作有效（启动/停止服务、保存设置）
   - 没有 "NaN"、"undefined" 或空值

### 远程 ubus 测试

在路由器上测试 RPCD 方法：

```bash
# 列出所有方法
ssh router "ubus list luci.system-hub"

# 调用无参数方法
ssh router "ubus call luci.system-hub status"

# 调用带参数方法
ssh router "ubus call luci.system-hub service_action '{\"service\":\"network\",\"action\":\"restart\"}'"

# 格式化 JSON 输出
ssh router "ubus call luci.system-hub get_health | jsonlint"
```

### 调试技巧

**启用 RPCD 调试日志**：
```bash
# 编辑 /etc/init.d/rpcd
# 在 procd_set_param command 中添加 -v 标志
procd_set_param command "$PROG" -v

# 重启 RPCD
/etc/init.d/rpcd restart

# 监视日志
logread -f | grep rpcd
```

**启用 JavaScript 控制台日志**：
```javascript
// 添加到 api.js
console.log('API v0.1.0 已加载于', new Date().toISOString());

// 添加到视图
console.log('正在加载健康数据...');
API.getHealth().then(function(data) {
    console.log('健康数据:', data);
});
```

**测试 JSON 输出**：
```bash
# 在路由器上
/usr/libexec/rpcd/luci.system-hub call get_health | jsonlint

# 检查常见错误
# - 缺少逗号
# - 尾随逗号
# - 未加引号的键
# - 无效的转义序列
```

---

## 最佳实践总结

### 应该做的：
- 对所有 ubus 对象使用 `luci.` 前缀
- RPCD 脚本命名与 ubus 对象完全匹配
- 对 API 模块使用 `baseclass.extend()`
- 使用 `'require module/api as API'` 模式导入 API
- 在前端添加 null/undefined 检查：`health.cpu?.usage || 0`
- 部署前使用 `jsonlint` 验证 JSON
- 浏览器测试前先使用 `ubus call` 测试
- 后端更改后重启 RPCD
- 前端更改后清除浏览器缓存
- 提交前运行 `./secubox-tools/validate-modules.sh`

### 不应该做的：
- 使用没有 `luci.` 前缀的 ubus 对象名称
- 对 API 模块使用 `baseclass.singleton()` 或普通对象
- 使用 `L.require('module.path')` 导入 API（返回类而不是实例）
- 忘记将方法添加到 ACL 文件
- 在 ACL 部分混淆读/写方法
- 从 RPCD 脚本输出非 JSON
- 后端和前端之间使用不一致的数据结构
- 不先本地测试就部署
- 假设数据存在 - 始终检查 null/undefined
- 忘记使 RPCD 脚本可执行（`chmod +x`）

---

## 版本历史

**v1.0**（2025-12-26）
- 初始参考指南
- 基于 luci-app-secubox v1.0.0 和 luci-app-system-hub v0.1.0
- 记录了所有关键模式和常见错误
- 针对实际实现挑战进行了验证

---

## 参考资料

- **OpenWrt 文档**：https://openwrt.org/docs/guide-developer/start
- **LuCI 文档**：https://github.com/openwrt/luci/wiki
- **ubus 文档**：https://openwrt.org/docs/techref/ubus
- **UCI 文档**：https://openwrt.org/docs/guide-user/base-system/uci
- **jshn.sh 库**：OpenWrt 上的 `/usr/share/libubox/jshn.sh`

---

## 联系方式

如有问题或想为本参考指南做贡献：
- **作者**：CyberMind <contact@cybermind.fr>
- **项目**：SecuBox OpenWrt
- **仓库**：https://github.com/cybermind-fr/secubox-openwrt

---

**参考指南结束**
