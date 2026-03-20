[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox 控制台和 CLI 工具参考

**SecuBox 设备远程管理中心**

KISS 模块化自增强架构。

## 概览

两个应用程序用于集中管理多个 SecuBox 设备：

1. **secubox-console** - 面向 CLI 的管理工具（OpenWrt 原生）
2. **secubox-frontend** - 使用 Textual 的现代 TUI 仪表板（Linux/PC）

## 快速安装

### 在 SecuBox（OpenWrt）上
```bash
opkg install secubox-console
```

### 在任何 Linux PC 上
```bash
pip install textual paramiko httpx rich
python3 secubox_frontend.py
```

### 一行安装器
```bash
curl -sL https://feed.maegia.tv/install-console.sh | bash
```

---

## SecuBox CLI 工具词典

所有 `secubox-*` 命令行工具的完整参考。

### 核心系统工具

#### secubox-core
主要 SecuBox 控制中心 CLI。
```bash
secubox-core status      # 部署状态和服务健康
secubox-core info        # 系统和 SecuBox 信息
secubox-core config      # 管理配置设置
secubox-core services    # 列出已安装的服务
secubox-core version     # 版本信息
```

#### secubox-swiss
多用途瑞士军刀工具。
```bash
secubox-swiss            # 交互式菜单
secubox-swiss mesh       # 网状操作
secubox-swiss recover    # 恢复工具
secubox-swiss console    # 远程控制台
secubox-swiss mitm       # MITM 代理日志
```

#### secubox-state
系统状态管理和持久化。
```bash
secubox-state get <键>        # 查询状态
secubox-state set <键> <值>   # 更新状态
secubox-state list            # 列出所有状态
```

#### secubox-component
组件生命周期管理。
```bash
secubox-component list        # 列出组件
secubox-component status      # 组件状态
secubox-component update      # 更新组件
```

---

### 恢复和备份

#### secubox-recover
带有配置文件和快照的完整备份/恢复系统。
```bash
secubox-recover snapshot [名称]      # 创建快照
secubox-recover list                 # 列出快照
secubox-recover restore <名称>       # 恢复快照
secubox-recover profile save <名称>  # 保存配置文件
secubox-recover profile apply <名称> # 应用配置文件
secubox-recover apps sync            # 同步应用配置
secubox-recover reborn               # 生成重生脚本
```

#### secubox-recovery
配置备份和回滚。
```bash
secubox-recovery snapshot [名称]    # 创建配置快照
secubox-recovery list [--json]      # 列出快照
secubox-recovery restore <名称>     # 从快照恢复
secubox-recovery rollback           # 回滚到最新
secubox-recovery enter              # 交互式恢复模式
```

#### secubox-restore
从 Gitea 自恢复引导。
```bash
secubox-restore --interactive
secubox-restore <服务器> <所有者> <仓库> [令牌]
secubox-restore --branch dev --include-network
```

---

### 网状和 P2P 网络

#### secubox-mesh
P2P 网状网络配置。
```bash
secubox-mesh status      # 网状状态
secubox-mesh peers       # 列出对等节点
secubox-mesh sync        # 同步目录
secubox-mesh discover    # 发现对等节点
```

#### secubox-p2p
用于对等发现和联邦的 P2P Hub 管理器。
```bash
secubox-p2p daemon              # 运行发现守护进程
secubox-p2p discover [超时]     # mDNS 对等发现
secubox-p2p peers               # 列出已知对等节点
secubox-p2p add-peer <ip> [名称]# 手动添加对等节点
secubox-p2p remove-peer <id>    # 删除对等节点
secubox-p2p services            # 列出本地服务
secubox-p2p shared-services     # 从对等节点聚合
secubox-p2p sync                # 同步服务目录
secubox-p2p broadcast <命令>    # 在所有对等节点执行
secubox-p2p settings            # 显示 P2P 配置
```

---

### 服务注册和暴露

#### secubox-registry
与 HAProxy/Tor 集成的统一服务管理。
```bash
secubox-registry list                  # 列出已发布的服务
secubox-registry show <服务>           # 服务详情
secubox-registry publish <服务> --domain example.com --tor
secubox-registry unpublish <服务>      # 从注册表移除
secubox-registry landing               # 着陆页状态
secubox-registry categories            # 列出类别
```

#### secubox-exposure
端口管理、Tor 隐藏服务、HAProxy 后端。
```bash
secubox-exposure scan               # 发现监听端口
secubox-exposure conflicts          # 识别端口冲突
secubox-exposure fix-port <服务>    # 自动分配空闲端口
secubox-exposure status             # 暴露状态
secubox-exposure tor add <服务>     # 添加 Tor 隐藏服务
secubox-exposure tor list           # 列出 .onion 地址
secubox-exposure ssl add <服务> <域># 添加 HAProxy SSL 后端
```

---

### 应用管理

#### secubox-app
用于插件清单和安装的应用 CLI。
```bash
secubox-app list              # 显示所有插件
secubox-app show <插件>       # 插件清单详情
secubox-app install <插件>    # 带依赖安装
secubox-app remove <插件>     # 卸载插件
secubox-app status <插件>     # 插件状态
secubox-app update <插件>     # 更新到最新版本
secubox-app validate          # 验证所有清单
```

#### secubox-appstore
应用包发现和管理。
```bash
secubox-appstore list         # 可用应用
secubox-appstore search <查询># 搜索应用
secubox-appstore install <应用># 安装应用
secubox-appstore info <应用>  # 应用详情
```

---

### 包源管理

#### secubox-feed
本地和远程包源管理器。
```bash
secubox-feed update           # 重新生成 Packages 索引
secubox-feed sync             # 同步到 opkg-lists
secubox-feed fetch <url>      # 从 URL 下载 IPK
secubox-feed list             # 列出源中的包
secubox-feed info <包>        # 包元数据
secubox-feed install <包>     # 从源安装
secubox-feed install all      # 安装所有包
secubox-feed clean            # 删除旧版本
```

---

### 诊断和监控

#### secubox-diagnostics
全面的系统诊断。
```bash
secubox-diagnostics health       # 健康检查
secubox-diagnostics report       # 诊断报告
secubox-diagnostics logs         # 收集日志
secubox-diagnostics performance  # 资源使用
secubox-diagnostics network      # 网络诊断
```

#### secubox-log
中央日志聚合工具。
```bash
secubox-log --message "事件发生"
secubox-log --tag security --message "警报"
secubox-log --payload '{"键":"值"}'
secubox-log --snapshot           # 系统诊断快照
secubox-log --tail 50            # 最后 50 行
```

---

## 前端 TUI 应用

### 功能特性
- 带实时状态的多设备仪表板
- 设备发现（网络扫描、mDNS、网状 API）
- 基于 SSH 的远程命令执行
- 跨设备备份编排
- 选项卡界面：仪表板、警报、网状、设置
- 优雅降级：Textual -> Rich -> 简单 CLI

### 键盘快捷键
| 按键 | 操作 |
|------|------|
| `q` | 退出 |
| `r` | 刷新状态 |
| `s` | 同步所有设备 |
| `d` | 运行发现 |
| `b` | 备份已选择 |
| `Tab` | 切换选项卡 |

### 配置
```
~/.secubox-console/
├── devices.json      # 已保存的设备
├── plugins/          # 自定义插件
├── cache/            # 缓存数据
└── console.log       # 日志文件
```

---

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    SecuBox Console/Frontend                  │
├─────────────────────────────────────────────────────────────┤
│  核心命令    │  插件系统    │  SSH 管理器  │  TUI  │
├──────────────┼─────────────┼─────────────┼───────┤
│  设备存储    │  网状客户端  │  发现       │Textual│
└─────────────────────────────────────────────────────────────┘
         │                  │                 │
         ▼                  ▼                 ▼
   ┌──────────┐       ┌──────────┐      ┌──────────┐
   │ SecuBox  │  ...  │ SecuBox  │ ...  │ SecuBox  │
   │  节点 1  │       │  节点 2  │      │  节点 N  │
   └──────────┘       └──────────┘      └──────────┘
```

### 关键基础设施
- **配置**：基于 UCI（`/etc/config/secubox-*`）
- **通信**：UBUS JSON-RPC
- **Web 服务器**：uhttpd + LuCI
- **暴露**：HAProxy（域名、SSL）、Tor（.onion）
- **包**：带自定义源的 opkg
- **备份**：通过 Gitea 基于 Git
- **网状**：P2P 发现、同步、联邦
- **JSON 解析**：`jsonfilter`（不是 jq）

### 存储位置
- UCI 配置：`/etc/config/`
- 备份：`/overlay/secubox-backups/`
- 包源：`/www/secubox-feed/`
- P2P 状态：`/tmp/secubox-p2p-*.json`
- 日志：`/var/log/secubox.log`

---

## 插件开发

在 `~/.secubox-console/plugins/` 中创建插件：

```python
# my_plugin.py
PLUGIN_INFO = {
    "name": "my-plugin",
    "version": "1.0.0",
    "description": "我的自定义插件",
    "author": "您的名字",
    "commands": ["mycommand"]
}

def register_commands(console):
    console.register_command("mycommand", cmd_mycommand, "描述")

def cmd_mycommand(args):
    print("来自插件的问候！")
```

---

## 要求

- Python 3.8+
- `textual>=0.40.0` - 现代 TUI 框架
- `paramiko>=3.0.0` - SSH 连接
- `httpx>=0.25.0` - HTTP/API 调用
- `rich>=13.0.0` - 丰富控制台（后备）

---

## 许可证

MIT 许可证 - CyberMind 2026
