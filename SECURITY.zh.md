# 安全政策

🌐 **语言：** [English](SECURITY.md) | [Français](SECURITY.fr.md) | 中文

## SecuBox 安全披露政策

本文档描述了 SecuBox 固件的安全政策，符合
**欧盟网络韧性法案 (CRA) 第 13 条第 6 款**对 I 类产品的要求。

**制造商：** CyberMind Produits SASU
**联系人：** Gérald Kerma，Notre-Dame-du-Cruet，萨瓦省，法国
**网站：** https://cybermind.fr | https://secubox.in

---

## 支持的版本

| 版本 | 支持状态 | 支持截止 |
|------|----------|----------|
| 1.0.x   | ✅ 当前版本（Beta）| 积极开发中 |
| 0.19.x  | ✅ LTS        | 2027年3月 |
| 0.18.x  | ⚠️ 仅安全更新 | 2026年9月 |
| < 0.18  | ❌ 已终止支持        | 不再支持 |

### v1.0.0 Beta 版本

v1.0.0 Beta 版本现已开放安全测试。请参阅 [BETA-RELEASE.md](BETA-RELEASE.md) 了解：
- 攻击面概览
- 高价值目标
- 已知薄弱点（主动披露）
- 漏洞赏金范围和报告指南

**支持政策：**
- **当前版本：** 所有错误修复和安全补丁
- **LTS（长期支持）：** 仅关键安全补丁，18个月
- **仅安全更新：** 仅关键漏洞，下一主要版本发布后6个月
- **已终止支持：** 无更新，强烈建议升级

---

## 报告漏洞

我们认真对待安全漏洞。如果您发现安全问题，
请负责任地报告。

### 主要联系方式

**电子邮件：** security@cybermind.fr

**PGP 密钥：** [0xABCD1234](https://secubox.in/pgp/security-key.asc)
**指纹：** `1234 5678 9ABC DEF0 1234 5678 9ABC DEF0 1234 5678`

### 备用联系方式

对于需要立即处理的关键漏洞：
- **电话：** +33 (0)4 79 XX XX XX（法国工作时间）
- **Signal：** 可通过电子邮件申请

### 加密通信

我们**强烈建议**使用 PGP 加密提交漏洞报告。
我们的公钥可在以下位置获取：
- https://secubox.in/pgp/security-key.asc
- https://keys.openpgp.org（搜索：security@cybermind.fr）

### 报告内容

请提供：
1. **描述：** 漏洞的清晰描述
2. **影响：** 潜在的安全影响（机密性、完整性、可用性）
3. **受影响版本：** 哪些 SecuBox 版本受到影响
4. **复现步骤：** 逐步复现说明
5. **概念验证：** 代码、日志或截图（如适用）
6. **建议修复：** 如果您有的话（可选）

### 响应时间表

| 阶段 | 时间 |
|------|------|
| 确认收到 | 48小时内 |
| 初步分类 | 5个工作日内 |
| 状态更新 | 调查期间每7天 |
| 修复开发 | 取决于严重程度（见下文）|
| 公开披露 | 修复后90天，或协调披露 |

**基于严重程度的修复时间：**
- **关键（CVSS 9.0+）：** 7天
- **高危（CVSS 7.0-8.9）：** 30天
- **中危（CVSS 4.0-6.9）：** 60天
- **低危（CVSS < 4.0）：** 下一常规版本

---

## 软件物料清单 (SBOM)

根据 CRA 附件 I 的要求，我们为所有版本发布机器可读格式的 SBOM。

### SBOM 位置

SBOM 附加在每个 GitHub Release 中：
- **CycloneDX 1.6：** `secubox-VERSION.cdx.json`
- **SPDX 2.3：** `secubox-VERSION.spdx.json`
- **CVE 报告：** `secubox-VERSION-cve-report.json`
- **校验和：** `checksums.sha256`

**直接链接：** https://github.com/cybermind/secubox/releases/latest

### SBOM 内容

我们的 SBOM 包括：
- 所有 OpenWrt 基础包
- SecuBox 自定义包及其依赖
- 内核模块和固件 blob
- 加密库及版本
- 许可证信息（SPDX 标识符）
- 每个组件的 PURL（包 URL）标识符

### 验证 SBOM 完整性

```bash
# 下载 SBOM 和校验和
wget https://github.com/cybermind/secubox/releases/latest/download/secubox-0.20.cdx.json
wget https://github.com/cybermind/secubox/releases/latest/download/checksums.sha256

# 验证校验和
sha256sum -c checksums.sha256 --ignore-missing
```

---

## 漏洞披露 (VEX)

我们使用**漏洞可利用性交换 (VEX)** 文档来传达
影响 SecuBox 组件的 CVE 状态。

### VEX 政策

请参阅 [docs/vex-policy.md](docs/vex-policy.md) 了解我们完整的 VEX 处理政策。

**状态定义：**
- `not_affected`：CVE 不影响 SecuBox（组件未使用，条件不满足）
- `affected`：CVE 影响 SecuBox，正在修复中
- `fixed`：CVE 已在指定版本中修复
- `under_investigation`：正在分析中

VEX 文档与发布版本一起发布：
- `secubox-VERSION.vex.json`（CycloneDX VEX 格式）

---

## CRA 合规声明

### 欧盟网络韧性法案 — I 类声明

SecuBox 是欧盟网络韧性法案（法规 2024/XXX）下的 **I 类产品**，
因为它是具有网络连接功能的路由器/VPN 设备。

**合规状态：**
- ✅ SBOM 以机器可读格式发布（CycloneDX + SPDX）
- ✅ 已建立漏洞披露联系方式
- ✅ 已实施安全更新机制（opkg + secubox-update）
- ✅ 默认安全配置
- ⏳ ANSSI CSPN 认证：进行中（目标 2026年第三季度）

### 认证路径

我们正在为 SecuBox 申请 **ANSSI CSPN（一级安全认证）**
认证，预计于 2026年第三季度完成。

**认证范围：**
- 防火墙功能
- VPN（WireGuard）实现
- 入侵检测（CrowdSec 集成）
- 安全启动链
- 更新完整性验证

---

## 安全架构

### 纵深防御

SecuBox 实施多层安全：

1. **网络分段：** VLAN 隔离，访客网络分离
2. **WAF 保护：** 基于 mitmproxy 的 Web 应用防火墙
3. **入侵检测：** CrowdSec 社区威胁情报
4. **加密 VPN：** 采用现代加密技术的 WireGuard
5. **访问控制：** 支持 MFA 的 SSO 门户
6. **审计日志：** 全面的安全事件日志记录

### 数据主权

SecuBox 包含一个**AI 网关**，强制执行数据分类：
- **LOCAL_ONLY：** 敏感数据（IP、凭证）永不离开设备
- **SANITIZED：** 在欧盟云处理（Mistral）前清除 PII
- **CLOUD_DIRECT：** 发送到用户选择的提供商的通用查询

详见 [AI 网关文档](docs/ai-gateway.md)。

---

## 第三方组件

SecuBox 基于以下组件构建：
- **OpenWrt：** GPL-2.0，https://openwrt.org
- **CrowdSec：** MIT，https://crowdsec.net
- **WireGuard：** GPL-2.0，https://wireguard.com
- **mitmproxy：** MIT，https://mitmproxy.org

我们监控上游安全公告并及时集成补丁。

---

## 安全开发实践

- **代码审查：** 所有更改都需要同行审查
- **依赖扫描：** CI/CD 中的自动 CVE 扫描
- **SBOM 生成：** 每次发布自动生成
- **可重现构建：** 强制执行 SOURCE_DATE_EPOCH
- **签名发布：**（计划中）发布版本的 cosign 签名

---

## 联系方式

- **安全相关：** security@cybermind.fr
- **技术支持：** support@cybermind.fr
- **商务合作：** contact@cybermind.fr

**地址：**
CyberMind Produits SASU
Notre-Dame-du-Cruet
73130 萨瓦省，法国

---

## 荣誉榜

负责任地披露漏洞的安全研究人员：

| 研究人员 | 日期 | 严重程度 | 描述 |
|----------|------|----------|------|
| *您的名字* | — | — | — |

我们感谢所有帮助使 SecuBox 更安全的贡献者。

---

_最后更新：2026-03-15_
_文档版本：1.1_
