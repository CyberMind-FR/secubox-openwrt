[English](README.md) | [Francais](README.fr.md) | 中文

# luci-app-client-guardian

**版本:** 0.4.0
**最后更新:** 2025-12-28
**状态:** 活跃

**OpenWrt 网络访问控制和强制门户仪表板**

Client Guardian 是一个新一代的 OpenWrt 网络访问控制（NAC）系统，包含强制门户、实时监控、区域管理和短信/邮件警报功能。

![Client Guardian Dashboard](https://cybermind.fr/images/client-guardian-hero.png)

## 功能特性

### 实时监控
- 自动检测新客户端（MAC + DHCP 主机名）
- 实时在线/离线状态
- 每客户端流量历史（接收/发送）
- 首次连接/最后活动时间

### 区域管理

| 区域 | 描述 | 互联网 | 本地网络 | 隔离 |
|------|------|--------|----------|------|
| **私有 LAN** | 可信网络 | 是 | 是 | 否 |
| **IoT** | 物联网设备 | 是 | 否 | 是 |
| **儿童** | 过滤访问 | 是（过滤） | 是 | 否 |
| **访客** | 受限访问 | 是（受限） | 否 | 是 |
| **隔离区** | 未批准 | 否（门户） | 否 | 是 |
| **封禁** | 已禁止 | 否 | 否 | 是 |

### 默认策略：隔离
- 所有未识别的新客户端 -> **自动隔离**
- 仅可访问强制门户
- 需要手动批准才能完全访问
- 防止入侵

### 新一代强制门户
- 现代化可定制界面
- 密码认证/注册
- 服务条款接受
- 可配置会话时长
- 可定制 Logo 和颜色

### 家长控制
- **时间段限制**：夜间封锁、上学时间
- **内容过滤**：成人、暴力、赌博
- **强制安全搜索**：Google、Bing、YouTube
- **YouTube 限制模式**
- **自定义 URL 黑白名单**
- **每日屏幕时间配额**

### 短信和邮件警报
- 检测到新客户端
- 被禁客户端尝试连接
- 配额超限
- 可疑活动（端口扫描等）
- 可定制模板
- 短信提供商：Twilio、Nexmo、OVH

## 安装

### 前置要求

```bash
opkg update
opkg install luci-base rpcd dnsmasq-full iptables uhttpd
```

### 可选组件

```bash
# 用于通知
opkg install msmtp curl

# 用于 DNS 过滤
opkg install adblock

# 用于带宽配额
opkg install sqm-scripts
```

### 安装软件包

```bash
# 从源码安装
git clone https://github.com/gkerma/luci-app-client-guardian.git
cd luci-app-client-guardian
make install

# 重启 rpcd
/etc/init.d/rpcd restart
```

## 使用方法

### 典型工作流程

1. **新客户端连接** -> 自动进入隔离区
2. **发送警报** -> 短信/邮件通知管理员
3. **管理员检查** -> 在 LuCI 仪表板中
4. **决定**：
   - **批准** -> 分配到区域（LAN、IoT、儿童...）
   - **封禁** -> 永久阻止

### 客户端操作

| 操作 | 描述 |
|------|------|
| 批准 | 退出隔离区，分配区域 |
| 封禁 | 阻止所有网络访问 |
| 隔离 | 重新隔离 |
| 修改 | 更改名称、区域、配额 |

## 配置

### UCI 文件 `/etc/config/client-guardian`

```bash
# 全局配置
config client-guardian 'config'
    option enabled '1'
    option default_policy 'quarantine'
    option scan_interval '30'
    option portal_enabled '1'

# 邮件警报
config email 'email'
    option enabled '1'
    option smtp_server 'smtp.gmail.com'
    option smtp_port '587'
    option smtp_user 'user@gmail.com'
    list recipients 'admin@example.com'

# 短信警报（Twilio）
config sms 'sms'
    option enabled '1'
    option provider 'twilio'
    option api_key 'ACxxxxx'
    option api_secret 'xxxxx'
    list recipients '+8613812345678'

# 自定义区域
config zone 'gaming'
    option name 'Gaming'
    option network 'lan'
    option internet_access '1'
    option bandwidth_limit '0'
    option time_restrictions '0'

# 已知客户端
config client 'mon_pc'
    option name '办公电脑'
    option mac 'AA:BB:CC:DD:EE:FF'
    option zone 'lan_private'
    option status 'approved'
    option static_ip '192.168.1.10'
```

## 架构

```
+--------------------------------------------------------------+
|                      LuCI Web 界面                            |
|  +----------+----------+----------+----------+----------+    |
|  | 概览     | 客户端   |  区域    | 门户     | 家长控制 |    |
|  +----------+----------+----------+----------+----------+    |
+--------------------------------------------------------------+
|                        RPCD 后端                              |
|  +---------------------------------------------------------+ |
|  | status | clients | zones | approve | ban | quarantine   | |
|  +---------------------------------------------------------+ |
+--------------------------------------------------------------+
|                     系统集成                                  |
|  +-----------+-----------+-----------+-------------------+   |
|  |  dnsmasq  | iptables  | arptables | uhttpd（门户）   |   |
|  |  (DHCP)   | (防火墙)  | (MAC)     |                   |   |
|  +-----------+-----------+-----------+-------------------+   |
+--------------------------------------------------------------+
|                       警报系统                                |
|  +-------------------+------------------------------------+  |
|  |   邮件 (msmtp)    |      短信 (Twilio/Nexmo/OVH)       |  |
|  +-------------------+------------------------------------+  |
+--------------------------------------------------------------+
```

## RPCD API

| 方法 | 描述 | 参数 |
|------|------|------|
| `status` | 系统全局状态 | - |
| `clients` | 列出所有客户端 | - |
| `zones` | 列出所有区域 | - |
| `parental` | 家长控制配置 | - |
| `portal` | 强制门户配置 | - |
| `alerts` | 警报配置 | - |
| `logs` | 事件日志 | `limit`, `level` |
| `approve_client` | 批准客户端 | `mac`, `name`, `zone` |
| `ban_client` | 封禁客户端 | `mac`, `reason` |
| `quarantine_client` | 隔离客户端 | `mac` |
| `update_client` | 修改客户端 | `section`, `name`, `zone`... |
| `update_zone` | 修改区域 | `id`, `name`, `bandwidth_limit`... |
| `update_portal` | 修改门户 | `title`, `subtitle`... |
| `send_test_alert` | 发送测试警报 | `type` (email/sms) |

## 安全性

- **默认隔离**：未经批准无法访问
- **区域隔离**：IoT 与 LAN 隔离
- **入侵检测**：实时警报
- **完整历史**：所有连接日志
- **ACL**：API 细粒度权限

## 主题

- **主色调**：安全红 (#ef4444)
- **背景**：深色模式 (#0f0a0a)
- **区域**：每种类型不同颜色
- **动画**：隔离区脉冲、警报发光

## 软件包结构

```
luci-app-client-guardian/
+-- Makefile
+-- README.md
+-- htdocs/luci-static/resources/
|   +-- client-guardian/
|   |   +-- api.js
|   |   +-- dashboard.css
|   +-- view/client-guardian/
|       +-- overview.js
|       +-- clients.js
|       +-- zones.js
|       +-- portal.js
|       +-- parental.js
|       +-- alerts.js
|       +-- logs.js
+-- root/
    +-- etc/
    |   +-- config/client-guardian
    +-- usr/
        +-- libexec/rpcd/client-guardian
        +-- share/
            +-- luci/menu.d/luci-app-client-guardian.json
            +-- rpcd/acl.d/luci-app-client-guardian.json
```

## 路线图

- [x] 实时监控
- [x] 区域管理
- [x] 强制门户
- [x] 家长控制
- [x] 邮件/短信警报
- [ ] Pi-hole 集成
- [ ] 图形统计（历史记录）
- [ ] 移动应用
- [ ] 外部 REST API
- [ ] Home Assistant 集成

## 许可证

Apache-2.0 - 参见 [LICENSE](LICENSE)

## 作者

**Gandalf** - [CyberMind.fr](https://cybermind.fr)

---

*使用 Client Guardian 保护您的网络*
