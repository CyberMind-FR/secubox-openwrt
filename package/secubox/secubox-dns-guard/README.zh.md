# SecuBox DNS Guard

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

SecuBox OpenWrt 安全设备的 AI 驱动 DNS 异常检测守护进程。

## 功能特性

### 异常检测算法

| 检测器 | 描述 |
|--------|------|
| **DGA 检测** | 使用香农熵分析识别域名生成算法（DGA）模式 |
| **DNS 隧道** | 使用子域长度和编码模式检测通过 DNS 的数据外泄 |
| **速率异常** | 标记具有异常查询速率或唯一域名计数的客户端 |
| **已知恶意** | 将域名与威胁情报黑名单进行匹配 |
| **TLD 异常** | 识别可疑 TLD 和 punycode/IDN 同形异义字攻击 |

### AI 驱动分析

- LocalAI 集成实现智能威胁评估
- 自动严重性分类（严重/高/中/低）
- 域名分类（BLOCK/MONITOR/SAFE）
- 模式分析和恶意软件家族识别
- 自然语言威胁解释

### 审批工作流

- 可信检测的自动应用模式（mitmproxy 风格）
- 人工审批的队列模式（CrowdSec/WAF 风格）
- 每个检测器的置信度阈值
- 被阻止域名的详细审计跟踪

## 安装

```bash
opkg update
opkg install secubox-dns-guard
```

## 配置

编辑 `/etc/config/dns-guard`：

```
config dns-guard 'main'
    option enabled '1'
    option interval '60'                    # 分析间隔（秒）
    option localai_url 'http://127.0.0.1:8081'
    option localai_model 'tinyllama-1.1b-chat-v1.0.Q4_K_M'
    option auto_apply_blocks '0'            # 0=队列，1=自动应用
    option min_confidence '80'              # 阻止的最低置信度
    option max_blocks_per_cycle '10'
```

### 检测器配置

每个检测器可以单独启用/禁用，并设置自定义阈值：

```
config detector 'dga'
    option enabled '1'
    option entropy_threshold '3.2'         # 香农熵阈值
    option min_length '12'                 # 最小域名长度

config detector 'tunneling'
    option enabled '1'
    option max_subdomain_length '63'
    option txt_rate_limit '10'             # TXT 查询/分钟

config detector 'rate_anomaly'
    option enabled '1'
    option queries_per_minute '100'
    option unique_domains_per_minute '50'
```

## CLI 使用

```bash
# 服务管理
/etc/init.d/dns-guard start
/etc/init.d/dns-guard stop
/etc/init.d/dns-guard status

# 手动命令
dns-guard status              # 显示 Agent 状态
dns-guard run                 # 运行单次分析周期
dns-guard analyze             # 分析但不阻止
dns-guard check <domain>      # 检查特定域名

# 统计信息
dns-guard stats               # 查询统计
dns-guard top-domains         # 查询最多的域名
dns-guard top-clients         # DNS 客户端排名

# 阻止管理
dns-guard list-pending        # 显示待处理的阻止
dns-guard approve <id>        # 批准待处理的阻止
dns-guard reject <id>         # 拒绝待处理的阻止
dns-guard approve-all         # 批准所有待处理的阻止
dns-guard show-blocklist      # 显示活动黑名单
```

## 示例输出

### 域名检查
```
$ dns-guard check k8s7g2x9m4p1n3v6.badsite.xyz

=== 域名检查：k8s7g2x9m4p1n3v6.badsite.xyz ===

DGA 检测：
  子域名：k8s7g2x9m4p1n3v6（长度：16）
  熵值：3.58
  结果：可疑
  {"domain":"k8s7g2x9m4p1n3v6.badsite.xyz","type":"dga","confidence":85}

TLD 异常检测：
  TLD：.xyz
  结果：可疑
  {"domain":"k8s7g2x9m4p1n3v6.badsite.xyz","type":"tld_anomaly","confidence":50}

=== AI 分析 ===
风险评估：高
威胁类型：可能是基于 DGA 的恶意软件 C2 通信
指标：
- 高熵子域名（3.58）表明是算法生成
- 可疑 TLD（.xyz）常被恶意软件滥用
- 模式与已知 DGA 家族一致
建议：阻止
```

### 状态
```
$ dns-guard status

=== DNS Guard 状态 ===

已启用：是
间隔：60秒
LocalAI：http://127.0.0.1:8081
模型：tinyllama-1.1b-chat-v1.0.Q4_K_M

LocalAI 状态：在线

自动应用阻止：否（排队）
最低置信度：80%
每周期最大阻止数：10

=== 检测器 ===
  dga             [已启用]（域名生成算法检测）
  tunneling       [已启用]（DNS 隧道和数据外泄检测）
  rate_anomaly    [已启用]（异常查询速率检测）
  known_bad       [已启用]（已知恶意域名检测）
  tld_anomaly     [已启用]（异常 TLD 模式检测）

待处理阻止：3
活动阻止：47
警报（24小时）：156

上次运行：2026-02-05T14:32:00+00:00
```

## 集成

### dnsmasq

DNS Guard 在启动时自动启用 dnsmasq 查询日志：

```
logqueries=1
logfacility=/var/log/dnsmasq.log
```

被阻止的域名添加到 `/etc/dnsmasq.d/dns-guard-blocklist.conf`。

### AdGuard Home

AdGuard Home 用户的可选集成：

```
config target 'adguardhome_blocklist'
    option enabled '1'
    option output_path '/etc/adguardhome/filters/dns-guard.txt'
```

### LuCI 仪表板

安装 `luci-app-dnsguard` 获取 Web 界面：

```bash
opkg install luci-app-dnsguard
```

## 文件

| 路径 | 描述 |
|------|------|
| `/etc/config/dns-guard` | UCI 配置 |
| `/usr/bin/dns-guard` | 主 CLI |
| `/usr/lib/dns-guard/` | 库模块 |
| `/var/lib/dns-guard/` | 运行时状态（警报、待处理阻止） |
| `/etc/dnsmasq.d/dns-guard-blocklist.conf` | 生成的黑名单 |
| `/etc/dns-guard/blocklists/` | 外部黑名单文件 |

## 威胁情报

将外部黑名单添加到 `/etc/dns-guard/blocklists/`：

```bash
# 下载 abuse.ch URLhaus 域名
wget -O /etc/dns-guard/blocklists/urlhaus.txt \
  https://urlhaus.abuse.ch/downloads/hostfile/

# 下载恶意域名列表
wget -O /etc/dns-guard/blocklists/malwaredomains.txt \
  https://mirror1.malwaredomains.com/files/justdomains
```

## 许可证

Apache-2.0

## 作者

CyberMind <contact@cybermind.fr>
