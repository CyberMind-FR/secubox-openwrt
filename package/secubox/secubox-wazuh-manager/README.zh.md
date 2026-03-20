# SecuBox Wazuh Manager

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

SecuBox 的 LXC 容器中完整的 Wazuh SIEM/XDR 堆栈。

## 组件

| 组件 | 描述 | 端口 |
|------|------|------|
| **Wazuh Manager** | Agent 管理、日志分析、威胁检测 | 1514, 1515, 55000 |
| **Wazuh Indexer** | 基于 OpenSearch 的警报存储和搜索 | 9200 |
| **Wazuh Dashboard** | 可视化和管理的 Web UI | 5601 |

## 要求

- **内存**：推荐 4GB+（最低 2GB）
- **存储**：索引需要 20GB+
- **LXC**：OpenWrt 上的容器支持

## 快速开始

```bash
# 安装 Wazuh Manager（需要 10-15 分钟）
wazuh-managerctl install

# 启动容器
wazuh-managerctl start

# 配置 HAProxy 用于外部访问
wazuh-managerctl configure-haproxy

# 检查状态
wazuh-managerctl status
```

## CLI 参考

### 安装
| 命令 | 描述 |
|------|------|
| `wazuh-managerctl install` | 创建并设置 Wazuh LXC 容器 |
| `wazuh-managerctl uninstall` | 删除容器和数据 |
| `wazuh-managerctl upgrade` | 升级到最新版本 |

### 服务控制
| 命令 | 描述 |
|------|------|
| `wazuh-managerctl start` | 启动容器 |
| `wazuh-managerctl stop` | 停止容器 |
| `wazuh-managerctl restart` | 重启容器 |
| `wazuh-managerctl status` | 显示状态 |

### 配置
| 命令 | 描述 |
|------|------|
| `wazuh-managerctl configure-haproxy` | 设置 HAProxy vhost |
| `wazuh-managerctl configure-firewall` | 开放防火墙端口 |

### Agent 管理
| 命令 | 描述 |
|------|------|
| `wazuh-managerctl list-agents` | 列出已注册的 Agent |
| `wazuh-managerctl agent-info <id>` | 显示 Agent 详情 |
| `wazuh-managerctl remove-agent <id>` | 删除 Agent |

### API 和监控
| 命令 | 描述 |
|------|------|
| `wazuh-managerctl api-status` | 检查 API 状态 |
| `wazuh-managerctl api-token` | 生成 API token |
| `wazuh-managerctl logs [service]` | 显示日志 |
| `wazuh-managerctl alerts [n]` | 显示最近的警报 |
| `wazuh-managerctl stats` | 集群统计 |

### Shell 访问
| 命令 | 描述 |
|------|------|
| `wazuh-managerctl shell` | 在容器中打开 bash |
| `wazuh-managerctl exec <cmd>` | 执行命令 |

## UCI 配置

```
config wazuh_manager 'main'
    option enabled '1'
    option container_name 'wazuh'
    option lxc_path '/srv/lxc'
    option data_path '/srv/wazuh'

config network 'network'
    option ip_address '192.168.255.50'
    option gateway '192.168.255.1'
    option bridge 'br-lan'

config ports 'ports'
    option manager '1514'
    option api '55000'
    option dashboard '5601'
```

## 架构

```
                    +-------------------------------------+
                    |       Wazuh LXC 容器               |
                    |                                     |
  Agents ---------->|  +-------------+  +-------------+  |
  (1514/TCP)        |  |   Manager   |  |   Indexer   |  |
                    |  |    分析     |--|  OpenSearch |  |
  API ------------->|  +-------------+  +-------------+  |
  (55000/HTTPS)     |         |                |         |
                    |         v                v         |
  Dashboard ------->|      +-----------------------+     |
  (5601/HTTP)       |      |      Dashboard        |     |
                    |      |      可视化 UI        |     |
                    |      +-----------------------+     |
                    +-------------------------------------+
```

## 连接 Agent

在 SecuBox 上（已安装 secubox-app-wazuh）：

```bash
# 配置 Agent 连接到 Manager
wazuhctl configure 192.168.255.50

# 注册 Agent
wazuhctl register

# 启动 Agent
wazuhctl start
```

## 默认凭据

| 服务 | 用户名 | 密码 |
|------|--------|------|
| Dashboard | admin | admin |
| API | wazuh | wazuh |

**安装后请更改密码！**

## HAProxy 集成

运行 `wazuh-managerctl configure-haproxy` 后：

- Dashboard：`https://wazuh.gk2.secubox.in`
- 使用通配符 SSL 证书
- 启用 WAF bypass 以支持 WebSocket

## 数据持久化

数据存储在容器外部：

| 路径 | 内容 |
|------|------|
| `/srv/wazuh/manager` | Agent 密钥、规则、解码器 |
| `/srv/wazuh/indexer` | 警报索引 |

## 与 SecuBox 集成

- **CrowdSec**：Agent 监控 CrowdSec 日志
- **文件完整性**：监控 `/etc/config`、`/etc/init.d`
- **防火墙**：分析防火墙日志
- **HAProxy**：跟踪 Web 流量模式

## 参考资料

- [Wazuh 文档](https://documentation.wazuh.com/)
- [Wazuh GitHub](https://github.com/wazuh/wazuh)
- [Wazuh Docker](https://github.com/wazuh/wazuh-docker)
