# LuCI Mail Server Manager

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

SecuBox 邮件服务器、Webmail 和 Mesh 备份的统一 Web 仪表板。

## 功能

- **服务器状态**：容器状态、域名、用户、存储、SSL、mesh
- **端口监控**：SMTP (25)、Submission (587)、SMTPS (465)、IMAPS (993)、POP3S (995)
- **用户管理**：添加/删除邮件账户，查看邮箱统计
- **别名管理**：创建邮件转发别名
- **DNS 设置**：一键创建 MX、SPF、DMARC 记录
- **SSL 设置**：ACME DNS-01 证书自动化
- **Webmail 集成**：配置 Roundcube 容器
- **Mesh 备份**：P2P 备份同步

## 安装

```bash
opkg install luci-app-mailserver
```

## 位置

**Services -> Mail Server**

## RPCD 方法

| 方法 | 参数 | 描述 |
|--------|------------|-------------|
| `status` | - | 获取服务器状态（状态、域名、用户、端口、SSL） |
| `user_list` | - | 列出邮件用户及邮箱统计 |
| `alias_list` | - | 列出邮件别名 |
| `webmail_status` | - | 获取 webmail 容器状态 |
| `logs` | `lines` | 获取邮件服务器日志 |
| `install` | - | 安装邮件服务器容器 |
| `start` | - | 启动邮件服务器 |
| `stop` | - | 停止邮件服务器 |
| `restart` | - | 重启邮件服务器 |
| `user_add` | `email`, `password` | 添加邮件用户 |
| `user_del` | `email` | 删除邮件用户 |
| `user_passwd` | `email`, `password` | 修改用户密码 |
| `alias_add` | `alias`, `target` | 添加邮件别名 |
| `dns_setup` | - | 创建 MX/SPF/DMARC 记录 |
| `ssl_setup` | - | 获取 SSL 证书 |
| `webmail_configure` | - | 配置 Roundcube |
| `mesh_backup` | - | 创建 mesh 备份 |
| `mesh_sync` | `mode` | 与 mesh 同步（push/pull） |

## 仪表板部分

### 服务器状态
- 容器运行状态
- 域名 FQDN
- 用户数量
- 存储使用情况
- SSL 证书有效性
- Webmail 状态
- Mesh 备份状态
- 端口状态指示器

### 快捷操作
- 启动/停止服务器
- 设置 DNS 记录
- 设置 SSL 证书
- 配置 webmail
- 创建 mesh 备份

### 邮件用户
- 邮件地址
- 邮箱大小
- 邮件数量
- 删除操作

### 邮件别名
- 别名地址
- 转发目标

## 依赖

- `secubox-app-mailserver` - 后端 CLI
- `luci-base` - LuCI 框架
