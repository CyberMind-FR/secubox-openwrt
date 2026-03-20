[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Vortex DNS

网状多动态子域委派系统。

## 架构

```
主节点 (*.secubox.io)
├── 从节点 node1.secubox.io
│   └── 服务: git.node1.secubox.io, web.node1.secubox.io
├── 子主节点 region1.secubox.io
│   ├── 从节点 a.region1.secubox.io
│   └── 从节点 b.region1.secubox.io
└── 从节点 node2.secubox.io
```

## 功能特性

- **通配符委派**：主节点拥有 `*.域名`，将子区域委派给从节点
- **First Peek**：服务在网状网络上被发现时自动注册
- **Gossip 同步**：暴露配置通过 P2P 网状网络传播
- **子主控**：层次化委派（主节点 → 子主节点 → 从节点）
- **多提供商**：通过 dns-provider 支持 OVH、Gandi、Cloudflare

## CLI 参考

```bash
# 主节点操作
vortexctl master init secubox.io          # 初始化为主节点
vortexctl master delegate 192.168.1.100 node1  # 委派子区域
vortexctl master list-slaves              # 列出已委派的区域

# 从节点操作
vortexctl slave join <主节点_ip> <令牌>    # 加入主节点层次结构
vortexctl slave status                    # 显示从节点状态

# 网状操作
vortexctl mesh status                     # 网状 DNS 状态
vortexctl mesh sync                       # 强制与对等节点同步
vortexctl mesh publish <服务> <域名>       # 发布到网状网络

# 通用
vortexctl status                          # 整体状态
vortexctl daemon                          # 运行同步守护进程
```

## 配置

```uci
config vortex 'main'
    option enabled '1'
    option mode 'master|slave|submaster|standalone'
    option sync_interval '300'

config master 'master'
    option enabled '1'
    option wildcard_domain 'secubox.io'
    option dns_provider 'ovh'
    option auto_delegate '1'

config slave 'slave'
    option enabled '0'
    option parent_master '192.168.1.1'
    option delegated_zone 'node1'

config mesh 'mesh'
    option gossip_enabled '1'
    option first_peek '1'
    option auto_register '1'
```

## SecuBox v0.19 MirrorNetworking 层的一部分
