# SecuBox Jitsi Meet

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

为 SecuBox 提供端到端加密的自托管视频会议。

## 功能特性

- **安全视频通话**：端到端加密的视频会议
- **无需账户**：访客无需注册即可加入
- **屏幕共享**：与参与者共享您的屏幕
- **聊天和表情**：会议内聊天和表情反应
- **分组讨论室**：将会议分成更小的小组
- **录制**：可选录制到 Dropbox（需要配置）
- **移动端支持**：提供 iOS 和 Android 应用
- **HAProxy 集成**：自动 SSL 和反向代理设置
- **Mesh 联邦**：在 SecuBox mesh 网络上宣布服务

## 系统要求

- Docker 和 docker-compose
- 2GB+ 内存（推荐 4GB）
- 公共域名，DNS 指向您的 SecuBox
- SSL 证书（通过 Let's Encrypt 或 HAProxy）

## 快速开始

```bash
# 安装
opkg install secubox-app-jitsi luci-app-jitsi

# 配置域名
uci set jitsi.main.domain='meet.example.com'
uci set jitsi.main.enabled='1'
uci commit jitsi

# 安装 Docker 容器
jitsctl install

# 启动服务
/etc/init.d/jitsi start
```

## 配置

### 通过 LuCI
在 LuCI Web 界面中导航到 **Services > Jitsi Meet**。

### 通过 CLI
```bash
# 显示状态
jitsctl status

# 查看日志
jitsctl logs

# 添加认证用户
jitsctl add-user admin 密码

# 重新生成配置
jitsctl generate-config

# 重启容器
jitsctl restart
```

### UCI 选项

```
config jitsi 'main'
    option enabled '1'
    option domain 'meet.example.com'
    option timezone 'Asia/Shanghai'

config jitsi 'web'
    option port '8443'
    option enable_guests '1'
    option enable_auth '0'
    option default_language 'zh'

config jitsi 'jvb'
    option port '10000'
    option enable_tcp_fallback '0'
    option stun_servers 'meet-jit-si-turnrelay.jitsi.net:443'

config jitsi 'security'
    option lobby_enabled '1'
    option password_required '0'
    option jwt_enabled '0'
```

## HAProxy 集成

如果安装了 secubox-app-haproxy，Jitsi 将自动配置 vhost：

```bash
jitsctl configure-haproxy
```

这将创建：
- 443 端口上的 HTTPS 前端
- 用于实时通信的 WebSocket 支持
- SSL 终止（使用您的证书）

## 防火墙

需要以下端口：

| 端口 | 协议 | 描述 |
|------|------|------|
| 443 | TCP | HTTPS（通过 HAProxy） |
| 8443 | TCP | 直接 Web 访问 |
| 10000 | UDP | 视频/音频流 |
| 4443 | TCP | TCP 回退（可选） |

防火墙规则在安装期间自动添加。

## Mesh 集成

启用 mesh 联邦以：
- 在 SecuBox mesh 网络上宣布 Jitsi
- 自动注册 DNS 条目（例如 meet.c3box.mesh.local）
- 启用多节点视频桥部署

```bash
uci set jitsi.mesh.enabled='1'
uci commit jitsi
/etc/init.d/jitsi restart
```

## 故障排除

### 容器无法启动
```bash
# 检查 Docker 状态
docker ps -a

# 查看容器日志
jitsctl logs web
jitsctl logs prosody
jitsctl logs jicofo
jitsctl logs jvb
```

### 视频/音频不工作
1. 检查防火墙上 UDP 端口 10000 是否开放
2. 验证 STUN 服务器可访问
3. 如果在严格 NAT 后面，启用 TCP 回退

### 认证问题
```bash
# 列出用户
jitsctl list-users

# 重置用户密码
jitsctl remove-user admin
jitsctl add-user admin 新密码
```

## 备份与恢复

```bash
# 创建备份
jitsctl backup /tmp/jitsi-backup.tar.gz

# 恢复
jitsctl restore /tmp/jitsi-backup.tar.gz
```

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    HAProxy (443)                        │
│                    SSL 终止                              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                Docker 网络：meet.jitsi                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐    │
│  │   Web   │ │ Prosody │ │ Jicofo  │ │     JVB     │    │
│  │  :8443  │ │  :5222  │ │  :8888  │ │ :10000/UDP  │    │
│  │ React   │ │  XMPP   │ │  Focus  │ │   Media     │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 许可证

Apache 2.0 - 详见 LICENSE 文件。
