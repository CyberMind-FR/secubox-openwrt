# SecuBox mitmproxy App

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

带有 mitmproxy 的 LXC 容器，用于 HTTPS 流量检查和威胁检测。

## 多实例支持

SecuBox 支持多个 mitmproxy 实例用于不同的流量：

| 实例 | 用途 | 代理端口 | Web 端口 | 模式 |
|------|------|----------|----------|------|
| **out** | LAN → 互联网（出站代理） | 8888 | 8089 | transparent |
| **in** | WAN → 服务（WAF/反向） | 8889 | 8090 | upstream |

### 实例命令

```bash
# 列出所有实例
mitmproxyctl list-instances

# 特定实例状态
mitmproxyctl status out
mitmproxyctl status in

# 进入实例 shell
mitmproxyctl shell in

# 启动/停止实例（通过 init.d）
/etc/init.d/mitmproxy start
/etc/init.d/mitmproxy stop
```

### UCI 配置

实例在 `/etc/config/mitmproxy` 中配置：

```
config instance 'out'
    option enabled '1'
    option description 'LAN->Internet Proxy'
    option container_name 'mitmproxy-out'
    option proxy_port '8888'
    option web_port '8089'
    option mode 'transparent'

config instance 'in'
    option enabled '1'
    option description 'WAF/Reverse Proxy'
    option container_name 'mitmproxy-in'
    option proxy_port '8889'
    option web_port '8090'
    option mode 'upstream'
    option haproxy_backend '1'
```

## 组件

| 组件 | 描述 |
|------|------|
| **LXC 容器** | 基于 Debian 的容器，带有 mitmproxy（每个实例一个） |
| **secubox_analytics.py** | mitmproxy 的威胁检测插件 |
| **haproxy_router.py** | HAProxy 后端路由插件 |
| **CrowdSec 集成** | 用于自动 IP 封禁的威胁日志记录 |

## 威胁检测模式

### 检测的攻击类型

| 类别 | 模式 |
|------|------|
| **SQL 注入** | UNION SELECT, OR 1=1, SLEEP(), BENCHMARK() |
| **XSS** | `<script>`, 事件处理程序, javascript: URL |
| **命令注入** | ; cat, \| ls, 反引号, $() |
| **路径遍历** | ../, %2e%2e/, file:// |
| **SSRF** | 内网 IP, 元数据端点 |
| **XXE** | <!ENTITY, SYSTEM, file:// |
| **LDAP 注入** | )(|, )(&, objectclass=* |
| **Log4Shell** | ${jndi:, ${env:, ldap:// |
| **SSTI** | {{...}}, ${...}, <%...%> |
| **原型污染** | __proto__, constructor[ |
| **GraphQL 滥用** | 深层嵌套, 内省 |
| **JWT 攻击** | alg:none, 暴露的令牌 |

### CVE 检测

| CVE | 描述 |
|-----|------|
| CVE-2021-44228 | Log4Shell（Log4j RCE） |
| CVE-2021-41773 | Apache 路径遍历 |
| CVE-2022-22965 | Spring4Shell |
| CVE-2023-34362 | MOVEit SQL 注入 |
| CVE-2024-3400 | PAN-OS 命令注入 |
| CVE-2024-21887 | Ivanti Connect Secure |
| CVE-2024-1709 | ScreenConnect 认证绕过 |
| CVE-2024-27198 | TeamCity 认证绕过 |

### 扫描器检测

检测安全扫描器：sqlmap、nikto、nuclei、burpsuite、nmap、dirb、gobuster、ffuf 等。

## CrowdSec 集成

威胁记录到 `/data/threats.log`（在主机上挂载为 `/srv/mitmproxy/threats.log`）。

CrowdSec 场景：
- `secubox/mitmproxy-attack` - 3 次 high/critical 攻击后封禁
- `secubox/mitmproxy-scanner` - 封禁激进的扫描器
- `secubox/mitmproxy-ssrf` - 封禁外部 SSRF 尝试
- `secubox/mitmproxy-cve` - CVE 漏洞利用立即封禁

## GeoIP

安装 GeoLite2-Country.mmdb 到 `/srv/mitmproxy/` 以进行国家检测：
```bash
curl -sL "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb" \
  -o /srv/mitmproxy/GeoLite2-Country.mmdb
```

## 文件路径

| 路径 | 描述 |
|------|------|
| `/srv/mitmproxy/` | 主机绑定挂载目录 |
| `/srv/mitmproxy/threats.log` | CrowdSec 威胁日志 |
| `/srv/mitmproxy/addons/` | mitmproxy 插件脚本 |
| `/srv/mitmproxy/GeoLite2-Country.mmdb` | GeoIP 数据库 |

## HAProxy 集成与路由

### 流量架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      互联网                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  HAProxy（端口 80/443）                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 前端：接收 HTTPS 请求                                     │   │
│  │ ACL：通过 Host 头路由到 vhosts                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 后端：mitmproxy_inspector (127.0.0.1:8890)               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  mitmproxy LXC 容器（端口 8890）                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ haproxy_router.py：通过 Host 头路由                       │   │
│  │ secubox_analytics.py：威胁检测                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│           将威胁记录到 /data/threats.log                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  后端服务                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Gitea   │  │ Streamlit│  │ Glances  │  │  LuCI    │        │
│  │  :3000   │  │  :8501   │  │  :61208  │  │  :8081   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 同步路由命令

将 HAProxy vhost 配置同步到 mitmproxy 路由表：

```bash
mitmproxyctl sync-routes
```

这会生成 `/srv/mitmproxy/haproxy-routes.json`：

```json
{
  "devel.cybermind.fr": ["192.168.255.1", 3000],
  "play.cybermind.fr": ["192.168.255.1", 8501],
  "glances.maegia.tv": ["192.168.255.1", 61208],
  "factory.maegia.tv": ["192.168.255.1", 7331]
}
```

### HAProxy 集成命令

| 命令 | 描述 |
|------|------|
| `mitmproxyctl haproxy-enable` | 为所有 vhosts 启用威胁检查 |
| `mitmproxyctl haproxy-disable` | 禁用检查，恢复直接后端 |
| `mitmproxyctl sync-routes` | 从当前 HAProxy 配置重新生成路由 |

### 启用 HAProxy 检查

```bash
# 启用检查模式
mitmproxyctl haproxy-enable

# 这将：
# 1. 创建 mitmproxy_inspector 后端 (127.0.0.1:8890)
# 2. 在 UCI 中存储原始后端 (haproxy.$vhost.original_backend)
# 3. 将所有 vhosts 重定向通过 mitmproxy
# 4. 同步路由映射
# 5. 重启服务
```

### 端口

| 端口 | 实例 | 服务 |
|------|------|------|
| 8888 | out | 代理端口（LAN 出站） |
| 8889 | in | 代理端口（HAProxy/WAF） |
| 8089 | out | mitmweb UI（出站） |
| 8090 | in | mitmweb UI（WAF） |

### haproxy_router.py 插件

路由插件：
- 从 `/data/haproxy-routes.json` 加载路由
- 通过 Host 头将请求路由到真实后端
- 在 `flow.metadata['original_host']` 中存储原始主机
- 未知主机回退到 LuCI (127.0.0.1:8081)

### 路由文件格式

```json
{
  "hostname": ["ip", port],
  "*.wildcard.domain": ["ip", port]
}
```

支持 `*.domain.tld` 模式的通配符匹配。

## 依赖

- `lxc` - 容器运行时
- `crowdsec` - 威胁情报（可选）
- `geoip2` - Python GeoIP 库（可选）
