# SecuBox Wazuh Agent

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

适用于 SecuBox 的 Wazuh 安全监控代理。提供端点检测与响应（EDR）、文件完整性监控（FIM）、日志分析和 SIEM 集成。

## 功能特性

- **端点检测**：OpenWrt 上的实时威胁检测
- **文件完整性监控**：跟踪关键系统文件的更改
- **日志分析**：监控 syslog、CrowdSec、防火墙日志
- **安全配置评估**：合规性检查
- **CrowdSec 集成**：同步威胁情报
- **Rootcheck**：检测 rootkit 和恶意软件

## 快速开始

```bash
# 安装 Wazuh 代理
wazuhctl install

# 配置管理器连接
wazuhctl configure 192.168.1.100

# 向管理器注册
wazuhctl register

# 启动代理
wazuhctl start

# 检查状态
wazuhctl status
```

## CLI 参考

### 安装
| 命令 | 描述 |
|------|------|
| `wazuhctl install` | 下载并安装 Wazuh 代理 |
| `wazuhctl uninstall` | 删除 Wazuh 代理 |
| `wazuhctl upgrade` | 升级到最新版本 |

### 配置
| 命令 | 描述 |
|------|------|
| `wazuhctl configure <ip>` | 配置管理器连接 |
| `wazuhctl register` | 向管理器注册代理 |
| `wazuhctl set-name <name>` | 设置代理主机名 |

### 服务控制
| 命令 | 描述 |
|------|------|
| `wazuhctl start` | 启动 Wazuh 代理 |
| `wazuhctl stop` | 停止 Wazuh 代理 |
| `wazuhctl restart` | 重启代理 |
| `wazuhctl status` | 显示代理状态 |

### 监控
| 命令 | 描述 |
|------|------|
| `wazuhctl info` | 显示代理信息 |
| `wazuhctl logs [n]` | 显示最后 n 行日志 |
| `wazuhctl alerts [n]` | 显示最近的警报 |

### 集成
| 命令 | 描述 |
|------|------|
| `wazuhctl crowdsec-sync` | 同步 CrowdSec 警报 |
| `wazuhctl configure-fim` | 配置 FIM 目录 |
| `wazuhctl configure-sca` | 启用 SCA 检查 |

## UCI 配置

```
config wazuh 'main'
    option enabled '1'
    option manager_ip '192.168.1.100'
    option manager_port '1514'
    option agent_name 'secubox'
    option protocol 'tcp'

config monitoring 'monitoring'
    option syslog '1'
    option crowdsec_alerts '1'
    option file_integrity '1'
    option rootcheck '1'

config fim 'fim'
    list directories '/etc'
    list directories '/usr/sbin'
    list directories '/etc/config'
    option realtime '1'
```

## 监控路径

默认文件完整性监控：
- `/etc` - 系统配置
- `/etc/config` - UCI 配置
- `/etc/init.d` - 初始化脚本
- `/usr/sbin` - 系统二进制文件

## CrowdSec 集成

Wazuh 监控 CrowdSec 日志以获取：
- 封禁决策
- 警报事件
- 威胁模式

手动同步：`wazuhctl crowdsec-sync`

## 要求

- Wazuh Manager（外部服务器或 SecuBox LXC）
- 到管理器 1514 端口的网络连接（TCP/UDP）
- 代理约需 35MB 内存

## 架构

```
SecuBox (Agent)          Wazuh Manager
+---------------+        +------------------+
| wazuhctl      |        | Wazuh Server     |
| ossec.conf    |------->| OpenSearch       |
| FIM/Rootcheck |        | Dashboard        |
+---------------+        +------------------+
```

## 参考资料

- [Wazuh 文档](https://documentation.wazuh.com/)
- [Wazuh GitHub](https://github.com/wazuh/wazuh)
- [代理安装](https://documentation.wazuh.com/current/installation-guide/wazuh-agent/)
