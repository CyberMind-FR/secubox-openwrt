[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Master-Link

SecuBox 设备的安全网状接入。主节点生成一次性加入令牌，提供 secubox IPK 包，并通过基于区块链的信任机制批准新的对等节点。支持嵌套层次结构，已批准的节点可以成为子主节点。

## 概览

```
  主节点（深度 0）
  ├── 对等节点 A（深度 1）
  ├── 子主节点 B（深度 1）
  │   ├── 对等节点 C（深度 2）
  │   └── 对等节点 D（深度 2）
  └── 对等节点 E（深度 1）
```

## 安装

```bash
opkg install secubox-master-link luci-app-master-link
```

## 配置

```bash
# /etc/config/master-link

config master-link 'main'
    option enabled '1'
    option role 'master'          # master | peer | sub-master
    option upstream ''            # 上游主节点 IP（对等节点/子主节点用）
    option depth '0'              # 嵌套深度（0 = 根主节点）
    option max_depth '3'          # 最大嵌套深度
    option token_ttl '3600'       # 令牌有效期（秒）
    option auto_approve '0'       # 自动批准加入请求
    option ipk_path '/www/secubox-feed/secubox-master-link_*.ipk'
```

## 加入协议

1. **主节点生成令牌** — 一次性 HMAC-SHA256 令牌，带 TTL
2. **新节点打开登录页面** — `http://<主节点>:7331/master-link/?token=...`
3. **新节点下载 IPK** — 通过 `/api/master-link/ipk` 进行令牌验证下载
4. **新节点发送加入请求** — 向主节点提交指纹 + 地址
5. **主节点批准** — TOFU 密钥交换，记录区块链区块，将对等节点添加到网状网络
6. **可选：提升为子主节点** — 已批准的对等节点可以接入自己的对等节点

## CGI 端点

所有端点在端口 7331 上的 `/api/master-link/` 下提供服务。

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/token` | POST | 仅本地 | 生成加入令牌 |
| `/join` | POST | 令牌 | 提交加入请求 |
| `/approve` | POST | 仅本地 | 批准/拒绝对等节点 |
| `/status` | GET | 公开/本地 | 网状状态 |
| `/ipk` | POST | 令牌 | 下载 secubox IPK |

## RPCD API

```bash
ubus call luci.master_link status '{}'
ubus call luci.master_link peers '{}'
ubus call luci.master_link tree '{}'
ubus call luci.master_link token_generate '{}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"approve"}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"reject","reason":"..."}'
ubus call luci.master_link approve '{"fingerprint":"...","action":"promote"}'
ubus call luci.master_link token_cleanup '{}'
```

## 区块链区块类型

| 类型 | 描述 |
|------|------|
| `join_request` | 新节点请求加入 |
| `peer_approved` | 主节点批准对等节点 |
| `peer_rejected` | 主节点拒绝对等节点 |
| `peer_promoted` | 对等节点提升为子主节点 |
| `token_generated` | 审计：令牌已创建 |

## 安全性

- **令牌**：HMAC-SHA256，一次性使用，时间限制（默认 1 小时）
- **TOFU**：首次加入通过指纹交换建立信任
- **深度限制**：`max_depth` 防止无限嵌套
- **链完整性**：所有操作记录为区块链区块
- **审计跟踪**：令牌生命周期和对等节点事件可通过链查询

## 依赖项

- `secubox-p2p` — 网状网络和区块链
- `openssl-util` — HMAC 令牌生成
- `curl` — 对等节点通知

## 许可证

Apache-2.0
