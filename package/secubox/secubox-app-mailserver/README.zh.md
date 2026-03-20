# SecuBox Mail Server

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

在 LXC 容器中运行的自定义邮件服务器（Postfix + Dovecot），支持 mesh 备份。

## 功能特性

- **Postfix** - 支持虚拟域的 SMTP 服务器
- **Dovecot** - 带 LMTP 投递的 IMAP/POP3
- **Rspamd** - 垃圾邮件过滤
- **OpenDKIM** - 邮件签名
- **Mesh 备份** - 与其他 SecuBox 节点的 P2P 备份同步
- **Webmail 集成** - 与 Roundcube 容器配合使用

## 安装

```bash
opkg install secubox-app-mailserver
```

## 快速开始

```bash
# 1. 配置域名
uci set mailserver.main.domain='example.com'
uci set mailserver.main.hostname='mail'
uci commit mailserver

# 2. 安装容器
mailctl install

# 3. 设置 DNS 记录（MX、SPF、DMARC）
mailctl dns-setup

# 4. 获取 SSL 证书
mailctl ssl-setup

# 5. 添加邮件用户
mailctl user add user@example.com

# 6. 启用并启动
uci set mailserver.main.enabled=1
uci commit mailserver
/etc/init.d/mailserver start

# 7. 配置 webmail
mailctl webmail configure
```

## CLI 参考

### 服务控制

```bash
mailctl start      # 启动邮件服务器
mailctl stop       # 停止邮件服务器
mailctl restart    # 重启邮件服务器
mailctl status     # 显示状态
```

### 用户管理

```bash
mailctl user add user@domain.com    # 添加用户（提示输入密码）
mailctl user del user@domain.com    # 删除用户
mailctl user list                   # 列出所有用户
mailctl user passwd user@domain.com # 更改密码
```

### 别名

```bash
mailctl alias add info@domain.com user@domain.com
mailctl alias list
```

### SSL 证书

```bash
mailctl ssl-setup    # 通过 DNS-01 获取 Let's Encrypt 证书
mailctl ssl-status   # 显示证书信息
```

### DNS 集成

```bash
mailctl dns-setup    # 通过 dnsctl 创建 MX、SPF、DMARC 记录
```

### Mesh 备份

```bash
mailctl mesh backup              # 为 mesh 同步创建备份
mailctl mesh restore <文件>       # 从备份恢复
mailctl mesh sync push           # 推送到 mesh peers
mailctl mesh sync pull           # 从 mesh peers 拉取
mailctl mesh add-peer <peer_id>  # 添加 mesh peer
mailctl mesh peers               # 列出已配置的 peers
mailctl mesh enable              # 启用 mesh 同步
mailctl mesh disable             # 禁用 mesh 同步
```

### Webmail

```bash
mailctl webmail status      # 检查 Roundcube 状态
mailctl webmail configure   # 将 Roundcube 指向此服务器
```

### 诊断

```bash
mailctl logs         # 查看邮件日志（最后 50 行）
mailctl logs 100     # 查看最后 100 行
mailctl test user@external.com   # 发送测试邮件
```

## UCI 配置

```
config mailserver 'main'
    option enabled '0'
    option hostname 'mail'
    option domain 'example.com'
    option postmaster 'postmaster'
    option data_path '/srv/mailserver'
    option container 'mailserver'

config ports 'ports'
    option smtp '25'
    option submission '587'
    option smtps '465'
    option imap '143'
    option imaps '993'
    option pop3 '110'
    option pop3s '995'

config features 'features'
    option spam_filter '1'
    option virus_scan '0'
    option dkim '1'
    option spf '1'
    option dmarc '1'
    option fail2ban '1'

config ssl 'ssl'
    option type 'letsencrypt'

config webmail 'webmail'
    option enabled '1'
    option container 'secubox-webmail'
    option port '8026'

config mesh 'mesh'
    option enabled '0'
    option backup_peers ''
    option sync_interval '3600'
```

## 数据结构

```
/srv/mailserver/
├── config/          # Postfix/Dovecot 配置
│   ├── vmailbox     # 虚拟邮箱映射
│   ├── valias       # 虚拟别名映射
│   └── users        # Dovecot 用户数据库
├── mail/            # Maildir 存储
│   └── example.com/
│       └── user/
│           ├── cur/
│           ├── new/
│           └── tmp/
└── ssl/             # SSL 证书
    ├── fullchain.pem
    └── privkey.pem
```

## 所需 DNS 记录

`mailctl dns-setup` 命令通过 `dnsctl` 创建以下记录：

| 类型 | 名称 | 值 |
|------|------|-----|
| A | mail | `<公网IP>` |
| MX | @ | `10 mail.example.com.` |
| TXT | @ | `v=spf1 mx a:mail.example.com ~all` |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:postmaster@example.com` |
| TXT | mail._domainkey | `v=DKIM1; k=rsa; p=<公钥>` |

## 端口

| 端口 | 协议 | 描述 |
|------|------|------|
| 25 | SMTP | 邮件传输（服务器到服务器） |
| 587 | Submission | 邮件提交（客户端到服务器） |
| 465 | SMTPS | 安全 SMTP |
| 143 | IMAP | 邮件访问 |
| 993 | IMAPS | 安全 IMAP |
| 110 | POP3 | 邮件下载（可选） |
| 995 | POP3S | 安全 POP3（可选） |
| 4190 | Sieve | 邮件过滤规则 |

## 依赖

- `lxc` - 容器运行时
- `secubox-app-dns-provider` - DNS 记录管理
- `acme` - SSL 证书自动化（可选）
- `secubox-p2p` - Mesh 备份同步（可选）
