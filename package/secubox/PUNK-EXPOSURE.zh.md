# Punk Exposure Engine

> **Languages**: [English](PUNK-EXPOSURE.md) | [Francais](PUNK-EXPOSURE.fr.md) | 中文

## 愿景

每个 SecuBox 节点都是一个**生成式站点** — 它发现本地运行的服务，并提供统一的流程使任何服务可通过所有可用渠道访问：Tor .onion、传统 DNS/HTTPS、P2P 网状网络，或三者同时。

三个动词定义了工作流程：

- **Peek** — 扫描、发现、观察。什么在运行？什么已暴露？哪些域名已映射？哪些节点在线？
- **Poke** — 针对一个服务。选择暴露渠道。配置链接流程。
- **Emancipate** — 激活。服务变为可访问。DNS 记录被创建，证书被颁发，.onion 地址被生成，网状网络节点被通知。

## 架构

```
                          EMANCIPATE
                              |
             +----------------+----------------+
             |                |                |
         Tor Layer      DNS/SSL Layer      Mesh Layer
         (.onion)       (HTTPS+ACME)       (P2P peers)
             |                |                |
     tor-shield          haproxyctl        secubox-p2p
     hidden svc       + dns-provider-api   + gossip sync
                      + acme.sh
                              |
                     DNS Provider APIs
                    (OVH, Gandi, Cloudflare)
                              |
                     A/AAAA/CNAME records
                     created programmatically
```

## 组件

### 现有组件（已构建）

| 组件 | 包名 | 功能 |
|-----------|---------|--------------|
| 服务扫描器 | `secubox-app-exposure` | 使用 UCI/Docker/进程名称增强的 `netstat` 扫描 |
| Tor 暴露 | `secubox-app-tor` + `secubox-app-exposure` | `tor_add()` 创建隐藏服务目录 + torrc 条目 |
| SSL/HAProxy 暴露 | `secubox-app-haproxy` + `secubox-app-exposure` | `ssl_add()` 创建 HAProxy 后端 + vhost + ACME 证书 |
| ACME 证书 | `secubox-app-haproxy` | `acme.sh` 通过端口 8402 进行 HTTP-01 webroot 验证 |
| VHost 管理器 | `luci-app-vhost-manager` | 基于 Nginx 的 vhost CRUD，支持 ACME + 模板 |
| P2P 网状网络 | `secubox-p2p` | mDNS 发现、WireGuard 网状网络、服务注册表、gossip 链 |
| Master-Link | `secubox-master-link` | 使用 HMAC 令牌的层级节点接入 + 区块链审计 |
| 服务注册表 | `luci-app-service-registry` | 跨网状网络聚合服务、健康检查、着陆页 |
| Exposure 仪表板 | `luci-app-exposure` | KISS 单表视图：扫描 + 每个服务的 Tor/SSL 开关 |

### 缺失组件（待构建）

| 组件 | 目的 | 优先级 |
|-----------|---------|----------|
| **DNS 供应商 API** | 程序化 DNS 记录管理 (OVH, Gandi, Cloudflare) | **高** |
| **DNS-01 ACME** | 通配符证书 + 无端口 80 访问的域名 | **高** |
| **统一 Poke 流程** | 单一操作在所有渠道暴露服务 | 中等 |
| **Peek 聚合** | 组合视图：本地扫描 + 网状网络节点 + DNS 记录 + Tor | 中等 |
| **Emancipate 编排器** | 支持回滚的原子多渠道激活 | 中等 |

## DNS 供应商 API 集成

### 设计

新包：`secubox-app-dns-provider`

```
package/secubox/secubox-app-dns-provider/
  files/etc/config/dns-provider     # UCI: 供应商类型、API 密钥、区域
  files/etc/init.d/dns-provider     # (可选) 记录同步 cron
  files/usr/sbin/dnsctl             # CLI: record add/rm/list/sync
  files/usr/lib/secubox/dns/        # 供应商适配器
    ovh.sh                          # OVH API (app key + secret + consumer key)
    gandi.sh                        # Gandi LiveDNS (API 密钥)
    cloudflare.sh                   # Cloudflare (API 令牌 + zone ID)
```

### UCI 配置

```uci
config dns_provider 'main'
    option enabled '1'
    option provider 'ovh'          # ovh | gandi | cloudflare
    option zone 'example.com'      # 管理的 DNS 区域

config ovh 'ovh'
    option endpoint 'ovh-eu'       # ovh-eu | ovh-ca | ovh-us
    option app_key ''
    option app_secret ''
    option consumer_key ''

config gandi 'gandi'
    option api_key ''

config cloudflare 'cloudflare'
    option api_token ''
    option zone_id ''
```

### dnsctl 命令

```
dnsctl list                          # 列出区域中所有 DNS 记录
dnsctl add A myservice 1.2.3.4      # 创建 A 记录
dnsctl add CNAME blog mycdn.net     # 创建 CNAME
dnsctl rm A myservice               # 删除记录
dnsctl sync                         # 将本地 vhosts 同步到 DNS 记录
dnsctl verify myservice.example.com # 检查 DNS 传播
```

### acme.sh DNS-01 集成

一旦 `dnsctl` 工作正常，在 `haproxyctl cert add` 中启用 DNS-01 挑战：

```sh
# 当前 (仅 HTTP-01):
acme.sh --issue -d "$domain" --webroot /var/www/acme-challenge

# 新方式 (通过供应商的 DNS-01):
provider=$(uci -q get dns-provider.main.provider)
case "$provider" in
    ovh)
        export OVH_END_POINT=$(uci -q get dns-provider.ovh.endpoint)
        export OVH_APPLICATION_KEY=$(uci -q get dns-provider.ovh.app_key)
        export OVH_APPLICATION_SECRET=$(uci -q get dns-provider.ovh.app_secret)
        export OVH_CONSUMER_KEY=$(uci -q get dns-provider.ovh.consumer_key)
        acme.sh --issue -d "$domain" --dns dns_ovh
        ;;
    gandi)
        export GANDI_LIVEDNS_KEY=$(uci -q get dns-provider.gandi.api_key)
        acme.sh --issue -d "$domain" --dns dns_gandi_livedns
        ;;
    cloudflare)
        export CF_Token=$(uci -q get dns-provider.cloudflare.api_token)
        export CF_Zone_ID=$(uci -q get dns-provider.cloudflare.zone_id)
        acme.sh --issue -d "$domain" --dns dns_cf
        ;;
esac
```

这解锁了**通配符证书** (`*.example.com`) 和防火墙后面没有端口 80 的域名。

## Emancipate 流程

当用户 poke 一个服务并选择 "Emancipate" 时，编排器原子地运行所有选定的渠道：

```
用户选择：Gitea (端口 3001) → Emancipate [Tor + DNS + Mesh]

1. Tor 渠道:
   secubox-exposure tor add gitea 3001 80
   → 生成 .onion 地址

2. DNS 渠道:
   dnsctl add A gitea <public-ip>
   haproxyctl vhost add gitea.example.com 3001
   haproxyctl cert add gitea.example.com --dns
   → HTTPS 在 gitea.example.com 上线

3. Mesh 渠道:
   secubox-p2p publish gitea 3001 "Gitea"
   gossip_sync
   → 所有网状网络节点发现该服务

4. 注册表更新:
   服务注册表刷新
   着陆页重新生成
   Exposure 仪表板显示三个徽章
```

### 失败时回滚

如果任何渠道失败，先前完成的渠道不会被拆除 — 它们保持活动状态。失败会被报告，用户可以通过 Exposure 仪表板的开关重试或删除单个渠道。

## Peek：当前存在的功能

当前的 Exposure 仪表板 (`luci-app-exposure/services.js`) 已经实现了 Peek：

- 通过 `netstat -tlnp` 扫描所有监听端口
- 使用来自 uhttpd、streamlit、Docker、glances 配置的真实名称进行增强
- 通过后端端口交叉引用 Tor 隐藏服务
- 通过后端端口交叉引用 HAProxy vhosts
- 显示每个服务的 Tor 和 SSL 开关

### Peek 下一步需要

- **DNS 记录列** ：通过 `dnsctl list` 显示哪些服务有 DNS A/CNAME 记录
- **Mesh 可见性列**：显示哪些服务已发布到网状网络节点
- **多节点视图**：聚合所有网状网络节点的服务（已通过 `secubox-p2p get_shared_services` 可用）

## Poke：当前存在的功能

Exposure 仪表板中的开关已经是 "Poke" 操作：

- 切换 Tor ON → 模态框 → 服务名称 + onion 端口 → 启用
- 切换 SSL ON → 模态框 → 服务名称 + 域名 → 启用

### Poke 下一步需要

- **DNS 开关**：用于 DNS 记录管理的第三个开关列
- **Emancipate 按钮**：每个服务的 "全渠道暴露" 单一操作
- **供应商选择**：为域名选择哪个 DNS 区域/供应商

## 与现有包的集成点

| 包名 | 集成 | 方向 |
|---------|------------|-----------|
| `secubox-app-exposure` | Peek 扫描 + Tor/SSL 添加/删除 | 已工作 |
| `secubox-app-haproxy` | HAProxy vhost + ACME 证书 | 已工作 |
| `secubox-app-tor` | 隐藏服务生命周期 | 已工作 |
| `secubox-p2p` | 服务发布 + gossip 同步 | 添加 `publish` RPC 调用 |
| `luci-app-exposure` | 仪表板：添加 DNS 列 + Emancipate 按钮 | 前端扩展 |
| `secubox-app-dns-provider` | **新建**：通过供应商 API 的 DNS 记录 CRUD | 待构建 |
| `luci-app-dns-provider` | **新建**：供应商凭据的 LuCI 配置 | 待构建 |

## 实施顺序

1. **`secubox-app-dns-provider`** — CLI 工具 + UCI 配置 + 供应商适配器（先 OVH）
2. **haproxyctl 中的 DNS-01** — 将 `dnsctl` 连接到 ACME 流程作为 HTTP-01 的替代
3. **`luci-app-dns-provider`** — 供应商配置的 LuCI 前端
4. **Exposure 仪表板 DNS 列** — 添加 DNS 开关 + `dnsctl` 集成
5. **Emancipate 流程** — `secubox-exposure emancipate` 中的统一编排器
6. **Mesh 发布集成** — 将 `secubox-p2p publish` 连接到 Emancipate

## 命名约定

该项目使用朋克/DIY 隐喻：

| 术语 | 含义 | 技术等价物 |
|------|---------|---------------------|
| **Peek** | 发现、扫描、观察 | `secubox-exposure scan` + 服务注册表 |
| **Poke** | 瞄准、配置、对准 | 开关 + 模态配置 |
| **Emancipate** | 激活、释放、暴露 | 原子多渠道激活 |
| **Station** | 一个 SecuBox 节点 | 运行网状网络的 OpenWrt 设备 |
| **Generative** | 每个站点可以创建新端点 | Docker 应用 + 暴露渠道 |

## 安全考虑

- DNS 供应商 API 密钥存储在带有受限 ACL 的 UCI 中
- ACME 私钥在 `/etc/acme/` 中，权限为 600
- Tor 隐藏服务密钥在 `/var/lib/tor/` 中，所有者为 tor:tor
- Emancipate 流程永远不会暴露仅 127.0.0.1 的服务（扫描中有守卫）
- DNS 记录仅为用户明确 Poke 的服务创建
- 回滚不会自动删除 — 用户必须明确移除暴露
