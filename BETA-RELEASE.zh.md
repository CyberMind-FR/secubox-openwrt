# SecuBox v1.0.0 Beta 版本

🌐 **语言：** [English](BETA-RELEASE.md) | [Français](BETA-RELEASE.fr.md) | 中文

**发布日期：** 2026-03-15
**状态：** Beta — 已准备好进行渗透测试和漏洞赏金计划
**发布者：** [CyberMind.fr](https://cybermind.fr)

---

## 安全研究人员快速入门

### 获取代码

```bash
git clone https://github.com/CyberMind-FR/secubox-openwrt.git
cd secubox-openwrt
```

### 测试构建

```bash
# 选项 1：使用预编译包（推荐）
./secubox-tools/local-build.sh build all

# 选项 2：使用 OpenWrt SDK 构建
cd ~/openwrt-sdk/package/
ln -s /path/to/secubox-openwrt secubox
make package/secubox/luci-app-secubox-portal/compile V=s
```

### 部署到测试路由器

```bash
scp bin/packages/*/secubox/*.ipk root@192.168.255.1:/tmp/
ssh root@192.168.255.1 'opkg install /tmp/luci-app-*.ipk'
```

---

## 攻击面概览

### 第一层：网络边界

| 组件 | 端口 | 协议 | 攻击向量 |
|------|------|------|----------|
| HAProxy | 80, 443 | HTTP/S | 头部注入、SNI 攻击、SSL 剥离 |
| mitmproxy WAF | 22222 | HTTP | WAF 绕过、规则逃逸、内存耗尽 |
| CrowdSec Bouncer | - | nftables | 规则绕过、IP 欺骗 |
| fw4/nftables | - | L3/L4 | 防火墙逃逸、分片攻击 |

### 第二层：应用代理

| 组件 | 端口 | 协议 | 攻击向量 |
|------|------|------|----------|
| LuCI (uhttpd) | 443 | HTTPS | 认证绕过、XSS、CSRF、路径遍历 |
| RPCD (ubus) | Unix | JSON-RPC | 权限提升、注入 |
| Tor Shield | 9050 | SOCKS5 | 去匿名化、电路分析 |

### 第三层：LXC 容器

| 容器 | 端口 | 服务 | 攻击向量 |
|------|------|------|----------|
| Jellyfin | 8096 | 媒体 | 路径遍历、转码漏洞 |
| Nextcloud | 8080 | 云存储 | SSRF、文件上传、WebDAV 滥用 |
| Gitea | 3000 | Git | 通过钩子实现 RCE、仓库注入 |
| Streamlit | 8501+ | Python | 代码执行、pickle 反序列化 |
| PhotoPrism | 2342 | 照片 | AI 模型投毒、EXIF 注入 |

### 第四层：网状/P2P

| 组件 | 端口 | 协议 | 攻击向量 |
|------|------|------|----------|
| P2P 中心 | 8333 | WebSocket | 消息注入、节点冒充 |
| Master Link | 51820 | WireGuard | 密钥窃取、加入时中间人攻击 |
| Vortex DNS | 53 | DNS | 缓存投毒、区域传输 |

---

## 高价值目标

### 关键文件（写入权限 = Root）

```
/etc/config/network          # 网络配置
/etc/config/firewall         # 防火墙规则
/etc/config/haproxy          # 反向代理路由
/etc/config/crowdsec         # CrowdSec 代理配置
/etc/shadow                  # 密码哈希
/etc/dropbear/authorized_keys
```

### RPCD 处理程序（Shell 代码）

```
/usr/libexec/rpcd/luci.*     # LuCI 后端脚本
/usr/sbin/*ctl               # CLI 工具（crowdsecctl、haproxyctl 等）
/usr/lib/secubox/            # 共享库
```

### 密钥

```
/etc/config/smtp-relay       # SMTP 凭证（option password）
/etc/config/wireguard        # WireGuard 私钥
/etc/config/dns-provider     # DNS API 密钥（Gandi、OVH、Cloudflare）
/srv/mitmproxy/*.pem         # TLS 证书
/etc/crowdsec/local_api_credentials.yaml
```

---

## 已知薄弱点（主动披露）

### 1. RPCD Shell 注入风险

许多 RPCD 处理程序使用带有 UCI 数据的 shell 脚本：
```sh
# 示例模式（潜在漏洞）
local value=$(uci get config.section.option)
eval "command $value"  # ← 如果 UCI 值包含 $(...)，则存在 shell 注入
```

**检查：** `/usr/libexec/rpcd/` 中的所有 `luci.*` 处理程序

### 2. WAF 绕过机会

mitmproxy WAF 使用模式匹配：
- 大型请求体可能耗尽内存
- 分块编码边界情况
- 多部分表单解析特殊情况
- WebSocket 升级处理

**检查：** `/srv/mitmproxy/haproxy_router.py`

### 3. LXC 容器逃逸

容器以有限权限运行，但：
- 部分容器有到主机路径的绑定挂载
- cgroup v2 限制可能可绕过
- 每个容器的命名空间隔离程度不同

**检查：** `/srv/lxc/*/config`

### 4. P2P 网状信任

Master Link 使用首次接触信任：
- 初始 WireGuard 密钥交换可能可被拦截
- Gossip 消息已签名但信任链较浅

**检查：** `/usr/sbin/master-linkctl`、`/usr/sbin/secubox-p2p`

### 5. 跨站脚本攻击 (XSS)

LuCI 视图渲染用户控制的数据：
- 主机名、MAC 地址、用户评论
- 仪表板中显示的日志条目
- HTML 邮件中的报告内容

**检查：** `htdocs/luci-static/resources/view/*/` 中的所有 JavaScript 文件

---

## 漏洞赏金范围

### 范围内

| 严重程度 | 类别 | 示例 |
|----------|------|------|
| **关键** | RCE、认证绕过 | RPCD 中的 shell 注入、硬编码凭证 |
| **高危** | 权限提升 | LXC 逃逸、带 RCE 的 WAF 绕过 |
| **中危** | 信息泄露 | 凭证泄漏、路径遍历 |
| **低危** | DoS、XSS | 内存耗尽、日志中的存储型 XSS |

### 范围外

- 自身 DoS 攻击（用户使自己的路由器崩溃）
- 社会工程
- 需要物理访问的攻击
- 第三方软件漏洞（OpenWrt 核心、上游包）
- 无影响的速率限制绕过

---

## 报告

### 联系方式

- **电子邮件：** security@cybermind.fr
- **GPG 密钥：** 可按需提供
- **GitHub Issues：** [github.com/CyberMind-FR/secubox-openwrt/security](https://github.com/CyberMind-FR/secubox-openwrt/security)

### 报告格式

```
## 摘要
[一句话描述]

## 严重程度
[关键/高危/中危/低危]

## 受影响组件
[包名称、文件路径、RPCD 方法]

## 复现步骤
1. ...
2. ...
3. ...

## 概念验证
[代码、截图或视频]

## 影响
[攻击者能够实现什么？]

## 建议修复
[可选]
```

### 响应时间

| 阶段 | 时间 |
|------|------|
| 确认收到 | 24 小时 |
| 分类 | 72 小时 |
| 修复（关键） | 7 天 |
| 修复（高危/中危） | 30 天 |
| 公开披露 | 90 天 |

---

## 测试环境设置

### VirtualBox 虚拟机

```bash
# 构建 VM 镜像
./secubox-tools/c3box-vm-builder.sh full

# 导入到 VirtualBox
VBoxManage import secubox-v1.0.0-beta.ova
```

### Docker（有限）

```bash
# 仅 LuCI 测试
docker run -p 8080:80 ghcr.io/cybermind-fr/secubox-luci:beta
```

### 实体硬件

推荐：x86-64 迷你电脑或 ARM64 单板计算机（NanoPi R4S、Raspberry Pi 4）

---

## 法律声明

这是一个授权的安全研究计划。参与即表示您同意：

1. 仅在您拥有或有权测试的系统上进行测试
2. 不访问、修改或删除超出证明漏洞所需的数据
3. 在公开披露前负责任地报告漏洞
4. 不将发现的漏洞用于恶意目的

**许可证：** Apache-2.0
**© 2024-2026 CyberMind.fr**

---

## 致谢

报告有效漏洞的安全研究人员将在以下位置获得致谢：
- `SECURITY.md` 荣誉榜
- 发布说明
- 项目网站

**Ex Tenebris, Lux Securitas**
