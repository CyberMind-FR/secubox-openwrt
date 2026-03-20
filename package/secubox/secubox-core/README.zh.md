[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox Core 框架

**版本**：1.0.0
**许可证**：GPL-2.0
**类别**：管理

## 概览

SecuBox Core 是模块化 SecuBox 系统的基础框架。它通过基于插件的架构为管理基于 OpenWrt 的安全设备提供统一的基础设施。

## 功能特性

### 核心能力

- **模块化应用商店**：基于插件的模块发现、安装和管理
- **配置文件系统**：声明式配置文件、模板和宏
- **统一 CLI**：单一 `secubox` 命令处理所有操作
- **健康监控**：全面的诊断和健康检查
- **恢复系统**：自动快照、回滚和灾难恢复
- **ubus 集成**：用于 LuCI 和第三方集成的完整 RPC API

### 架构

```
secubox-core
├── 核心服务
│   ├── secubox-core 守护进程 (procd)
│   ├── ubus RPC 接口
│   └── 健康监控
│
├── 模块管理
│   ├── AppStore 目录
│   ├── 模块发现
│   ├── 依赖解析
│   └── 生命周期钩子
│
├── 配置
│   ├── 配置文件引擎
│   ├── 模板渲染
│   └── 宏执行
│
└── 操作
    ├── 诊断
    ├── 快照/恢复
    └── 验证
```

## 安装

### 从包安装

```bash
opkg update
opkg install secubox-core
```

### 从源码安装

```bash
# 在 OpenWrt buildroot 中
make package/secubox/secubox-core/compile
make package/secubox/secubox-core/install
```

## 快速入门

### 1. 检查系统状态

```bash
secubox device status
```

输出：
```
Version: 0.8.0
Uptime: 1 day, 3:42
CPU Load: 0.45
Memory: 45%
Storage: 12%
WAN: 192.0.2.1 (eth0)
LAN: 192.168.1.1
```

### 2. 浏览可用模块

```bash
secubox app list
```

### 3. 安装模块

```bash
secubox app install wireguard-vpn
```

### 4. 运行健康检查

```bash
secubox diag health
```

## CLI 参考

### 主要命令

```bash
secubox <命令> [子命令] [选项]
```

| 命令      | 描述                           |
|-----------|--------------------------------|
| `app`     | 管理模块和 AppStore             |
| `profile` | 管理配置文件和模板              |
| `device`  | 设备信息和管理                  |
| `net`     | 网络管理                       |
| `diag`    | 诊断和健康检查                  |
| `ai`      | AI 助手（可选，实验性）          |

### App 命令

```bash
secubox app list                 # 列出所有模块
secubox app search <查询>        # 搜索模块
secubox app info <模块>          # 显示模块详情
secubox app install <模块>       # 安装模块
secubox app remove <模块>        # 删除模块
secubox app update [模块]        # 更新模块
secubox app health               # 检查模块健康
```

### 配置文件命令

```bash
secubox profile list                  # 列出可用配置文件
secubox profile show <配置文件>        # 显示配置文件详情
secubox profile apply <配置文件>       # 应用配置文件
secubox profile validate <配置文件>    # 验证配置文件语法
secubox profile export [文件]          # 导出当前配置
```

### 设备命令

```bash
secubox device info           # 显示设备信息
secubox device status         # 显示系统状态
secubox device reboot         # 重启设备
secubox device factory-reset  # 恢复出厂设置
secubox device backup [文件]  # 备份配置
```

### 诊断命令

```bash
secubox diag health           # 运行健康检查
secubox diag logs [服务]      # 查看系统日志
secubox diag trace <目标>     # 网络追踪
secubox diag report           # 生成诊断报告
```

## 配置

### UCI 配置

**文件**：`/etc/config/secubox`

```
config core 'main'
    option enabled '1'
    option log_level 'info'
    option appstore_url 'https://repo.secubox.org/catalog'
    option health_check_interval '300'
    option ai_enabled '0'

config security 'enforcement'
    option sandboxing '1'
    option module_signature_check '0'
    option auto_update_check '1'

config diagnostics 'settings'
    option health_threshold_cpu '80'
    option health_threshold_memory '90'
    option health_threshold_storage '85'
```

### 目录

| 路径                                    | 用途                          |
|-----------------------------------------|-------------------------------|
| `/etc/config/secubox`                   | UCI 配置                      |
| `/etc/secubox/profiles/`                | 配置文件定义                  |
| `/etc/secubox/templates/`               | 配置模板                      |
| `/etc/secubox/macros/`                  | 可重用宏                      |
| `/usr/share/secubox/plugins/catalog/`   | 模块目录                      |
| `/usr/share/secubox/modules/`           | 模块元数据                    |
| `/var/run/secubox/`                     | 运行时状态                    |
| `/var/log/secubox/`                     | 日志文件                      |
| `/overlay/secubox-backups/`             | 配置快照                      |

## 模块系统

### 模块目录

模块通过 JSON 格式的目录条目被发现：

**位置**：`/usr/share/secubox/plugins/catalog/<模块-id>.json`

示例：
```json
{
  "id": "wireguard-vpn",
  "name": "WireGuard VPN 管理器",
  "version": "1.0.0",
  "category": "networking",
  "runtime": "native",
  "packages": {
    "required": ["luci-app-wireguard-vpn", "wireguard-tools"]
  },
  "capabilities": ["vpn-server", "vpn-client"],
  "requirements": {
    "min_ram_mb": 64,
    "min_storage_mb": 10
  }
}
```

### 模块生命周期

1. **发现**：扫描目录获取可用模块
2. **验证**：检查清单和依赖项
3. **预安装**：执行预安装钩子
4. **安装**：安装 opkg 包
5. **后安装**：后安装配置
6. **健康检查**：验证模块健康

### 钩子

模块可以定义生命周期钩子：

- `pre_install`：安装前运行
- `post_install`：安装后运行
- `pre_remove`：删除前运行
- `post_remove`：删除后运行

## 配置文件系统

### 配置文件结构

配置文件是声明式的 YAML/JSON 配置：

```yaml
profile:
  id: home-office
  name: "家庭办公网络"

modules:
  required:
    - wireguard-vpn
    - dns-filter
    - bandwidth-manager

uci_overrides:
  network:
    lan:
      ipaddr: "192.168.10.1"
      netmask: "255.255.255.0"
```

### 应用配置文件

```bash
# 先模拟运行
secubox profile apply home-office --dryrun

# 应用配置文件
secubox profile apply home-office
```

## 恢复和快照

### 自动快照

快照会自动创建：
- 在应用配置文件之前
- 在安装模块之前
- 在首次启动时

### 手动快照

```bash
# 创建快照
secubox-recovery snapshot "my-snapshot"

# 列出快照
secubox-recovery list

# 从快照恢复
secubox-recovery restore my-snapshot
```

### 恢复模式

```bash
secubox-recovery enter
```

## ubus API

### 可用对象

```bash
ubus list luci.secubox
```

对象：
- `luci.secubox` - 核心操作
- `luci.secubox.appstore` - 模块管理（旧版）
- `luci.secubox.profile` - 配置文件管理（旧版）
- `luci.secubox.diagnostics` - 健康检查（旧版）

### 使用示例

```bash
# 获取系统状态
ubus call luci.secubox getStatus

# 列出模块
ubus call luci.secubox getModules

# 安装模块
ubus call luci.secubox installModule '{"module":"wireguard-vpn"}'

# 运行诊断
ubus call luci.secubox runDiagnostics '{"target":"all"}'
```

## 健康监控

### 健康检查

系统监控：
- CPU 负载
- 内存使用
- 存储容量
- 网络连接
- 模块状态
- 服务健康

### 阈值

在 `/etc/config/secubox` 中配置：

```
config diagnostics 'settings'
    option health_threshold_cpu '80'
    option health_threshold_memory '90'
    option health_threshold_storage '85'
```

### 自动检查

健康检查每 5 分钟自动运行（可配置）：

```
uci set secubox.main.health_check_interval='300'
uci commit secubox
```

## 安全

### 模块验证

启用签名验证：

```bash
uci set secubox.enforcement.module_signature_check='1'
uci commit secubox
```

### 沙箱

模块以资源限制运行（当内核支持时）：

```
procd_set_param cgroup.memory.limit_in_bytes 134217728  # 128 MB
```

### ACL 集成

所有 ubus 方法都受 LuCI ACL 系统保护。

## 故障排除

### 检查服务状态

```bash
/etc/init.d/secubox-core status
```

### 查看日志

```bash
logread | grep secubox
```

或

```bash
tail -f /var/log/secubox/core.log
```

### 重启服务

```bash
/etc/init.d/secubox-core restart
```

### 重置为默认值

```bash
uci revert secubox
/etc/init.d/secubox-core restart
```

### 恢复

如果系统无响应：

```bash
secubox-recovery enter
```

## 依赖项

**必需**：
- `libubox`
- `libubus`
- `libuci`
- `rpcd`
- `bash`
- `coreutils-base64`
- `jsonfilter`

**可选**：
- `python3`（用于 YAML 配置文件支持）
- `signify-openbsd` 或 `openssl`（用于签名验证）

## 文件

### 可执行文件

- `/usr/sbin/secubox` - 主 CLI 入口点
- `/usr/sbin/secubox-core` - 核心守护进程
- `/usr/sbin/secubox-appstore` - AppStore 管理器
- `/usr/sbin/secubox-profile` - 配置文件引擎
- `/usr/sbin/secubox-diagnostics` - 诊断系统
- `/usr/sbin/secubox-recovery` - 恢复工具
- `/usr/sbin/secubox-verify` - 验证工具

### RPCD 脚本

- `/usr/libexec/rpcd/luci.secubox` - 主 ubus 接口

### Init 脚本

- `/etc/init.d/secubox-core` - procd 服务
- `/etc/uci-defaults/99-secubox-firstboot` - 首次启动配置

## 许可证

GPL-2.0

## 支持

- 文档：https://docs.secubox.org
- 问题：https://github.com/CyberMind-FR/secubox-openwrt/issues
- 社区：https://forum.secubox.org
