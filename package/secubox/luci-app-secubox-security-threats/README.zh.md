[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox 安全威胁仪表板

## 概述

统一的 LuCI 仪表板，集成 **netifyd DPI 安全风险**与 **CrowdSec 威胁情报**，实现全面的网络威胁监控和自动化阻止。

## 功能特性

- **实时威胁检测**：监控 netifyd 的 52 种安全风险类型
- **CrowdSec 集成**：与 CrowdSec 警报和决策关联
- **风险评分**：基于多个因素计算 0-100 风险分数
- **自动阻止**：可配置的自动威胁阻止规则
- **按主机分析**：按 IP 地址跟踪威胁
- **可视化仪表板**：统计、图表和实时威胁表

## 架构

```
netifyd DPI 引擎 → RPCD 后端 → ubus API → LuCI 仪表板
                          ↓
                    CrowdSec LAPI
                          ↓
                  nftables (阻止)
```

## 依赖项

- `luci-base`：LuCI 框架
- `rpcd`：远程过程调用守护进程
- `netifyd`：深度包检测引擎
- `crowdsec`：威胁情报和阻止
- `jq`：JSON 处理
- `jsonfilter`：UCI 兼容 JSON 过滤

## 安装

1. 编译软件包：
```bash
cd /path/to/openwrt
make package/secubox/luci-app-secubox-security-threats/compile
```

2. 在路由器上安装：
```bash
opkg install luci-app-secubox-security-threats_*.ipk
```

3. 重启服务：
```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 使用方法

### 访问仪表板

导航至：**管理 → SecuBox → 安全 → 威胁监控 → 仪表板**

### 配置自动阻止规则

编辑 `/etc/config/secubox_security_threats`：

```uci
config block_rule 'my_rule'
    option name '阻止恶意软件'
    option enabled '1'
    option threat_types 'malware'
    option duration '24h'
    option threshold '60'
```

应用更改：
```bash
uci commit secubox_security_threats
```

### 手动阻止

通过仪表板：
1. 点击威胁旁边的"阻止"按钮
2. 确认操作
3. IP 将通过 CrowdSec 被阻止

通过 CLI：
```bash
ubus call luci.secubox-security-threats block_threat '{"ip":"192.168.1.100","duration":"4h","reason":"测试"}'
```

### 将主机加入白名单

```bash
ubus call luci.secubox-security-threats whitelist_host '{"ip":"192.168.1.100","reason":"管理员工作站"}'
```

## 风险评分算法

**基础分数 (0-50)：** risk_count × 10（封顶）

**严重性权重：**
- 恶意软件指标（MALICIOUS_JA3、DGA）：+20
- Web 攻击（SQL 注入、XSS）：+15
- 网络异常（RISKY_ASN、DNS 隧道）：+10
- 协议威胁（BitTorrent、挖矿）：+5

**CrowdSec 关联：**
- 活跃决策：+30

**严重性级别：**
- 严重：≥80
- 高：60-79
- 中：40-59
- 低：<40

## 威胁类别

- **malware**：恶意 JA3、DGA 域名、可疑熵
- **web_attack**：SQL 注入、XSS、RCE 尝试
- **anomaly**：DNS 隧道、风险 ASN、单向流量
- **protocol**：BitTorrent、挖矿、Tor、未授权协议
- **tls_issue**：证书问题、弱加密套件

## 测试

### 后端（ubus CLI）
```bash
# 测试状态
ubus call luci.secubox-security-threats status

# 获取活跃威胁
ubus call luci.secubox-security-threats get_active_threats

# 测试阻止
ubus call luci.secubox-security-threats block_threat '{"ip":"192.168.1.100","duration":"4h","reason":"测试"}'

# 在 CrowdSec 中验证
cscli decisions list
```

### 前端
1. 在 LuCI 中导航到仪表板
2. 验证统计卡片显示
3. 验证威胁表已填充
4. 测试"阻止"按钮
5. 检查实时轮询（10 秒刷新）

## 故障排除

### 未检测到威胁
- 检查 netifyd 是否运行：`ps | grep netifyd`
- 验证 netifyd 数据：`cat /var/run/netifyd/status.json`
- 在配置中启用 netifyd 风险检测

### 自动阻止不工作
- 检查自动阻止是否启用：`uci get secubox_security_threats.global.auto_block_enabled`
- 验证阻止规则已启用：`uci show secubox_security_threats`
- 检查日志：`logread | grep security-threats`

### CrowdSec 集成问题
- 检查 CrowdSec 是否运行：`ps | grep crowdsec`
- 测试 cscli：`cscli version`
- 验证权限：`ls -l /usr/bin/cscli`

## 文件

**后端：**
- `/usr/libexec/rpcd/luci.secubox-security-threats` - RPCD 后端（模式 755）
- `/etc/config/secubox_security_threats` - UCI 配置

**前端：**
- `/www/luci-static/resources/secubox-security-threats/api.js` - API 封装
- `/www/luci-static/resources/view/secubox-security-threats/dashboard.js` - 仪表板视图

**配置：**
- `/usr/share/luci/menu.d/luci-app-secubox-security-threats.json` - 菜单
- `/usr/share/rpcd/acl.d/luci-app-secubox-security-threats.json` - 权限

**运行时：**
- `/tmp/secubox-threats-history.json` - 威胁历史（易失）

## 许可证

Apache-2.0

## 作者

CyberMind.fr - Gandalf

## 版本

1.0.0 (2026-01-07)
