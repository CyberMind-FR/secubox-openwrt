# SecuBox Threat Analyst

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

SecuBox 的 AI 驱动自主威胁分析和过滤器生成代理。

**版本**：1.0.0
**作者**：CyberMind <devel@CyberMind.fr>

## 概述

Threat Analyst 监控来自 CrowdSec、mitmproxy 和 netifyd DPI 的安全事件，使用 LocalAI 进行智能分析，并自动生成以下过滤规则：

- **mitmproxy**：用于 HTTP/HTTPS 检测的 Python 过滤模式
- **CrowdSec**：自定义场景和解析器
- **WAF**：Web 应用防火墙的 JSON 规则集

## 功能特性

- 跨多个来源的实时威胁关联
- AI 驱动的攻击模式识别（通过 LocalAI）
- 自动生成 mitmproxy/CrowdSec/WAF 规则
- 生成规则的审批工作流（排队或自动应用）
- 带 AI 聊天界面的 LuCI 仪表板
- 周期性分析守护进程

## 安装

```sh
opkg install secubox-threat-analyst
opkg install luci-app-threat-analyst

# 启用并启动守护进程
uci set threat-analyst.main.enabled=1
uci commit threat-analyst
/etc/init.d/threat-analyst enable
/etc/init.d/threat-analyst start
```

## CLI 命令

```sh
threat-analyst status          # 显示 Agent 状态
threat-analyst run             # 运行单次分析周期
threat-analyst daemon          # 作为后台守护进程运行
threat-analyst analyze         # 分析威胁（不生成规则）
threat-analyst generate        # 生成所有规则
threat-analyst gen-mitmproxy   # 仅生成 mitmproxy 过滤器
threat-analyst gen-crowdsec    # 仅生成 CrowdSec 场景
threat-analyst gen-waf         # 仅生成 WAF 规则
threat-analyst list-pending    # 列出待处理规则
threat-analyst approve <id>    # 批准待处理规则
threat-analyst reject <id>     # 拒绝待处理规则
```

## 配置

UCI 配置：`/etc/config/threat-analyst`

```uci
config threat-analyst 'main'
    option enabled '1'
    option interval '300'           # 分析间隔（秒）

    # AI Gateway（首选）- 处理数据分类和主权
    option ai_gateway_url 'http://127.0.0.1:4050'
    # LocalAI（备用）- 网关不可用时直接连接
    option localai_url 'http://127.0.0.1:8081'
    option localai_model 'tinyllama-1.1b-chat-v1.0.Q4_K_M'

    # 自动应用设置
    option auto_apply_mitmproxy '1' # 自动应用 mitmproxy 过滤器
    option auto_apply_crowdsec '0'  # CrowdSec 排队等待审批
    option auto_apply_waf '0'       # WAF 排队等待审批

    option min_confidence '70'      # 规则的最低 AI 置信度
    option max_rules_per_cycle '5'  # 每周期最大规则数
```

## AI Gateway 集成

Threat Analyst 通过 AI Gateway 路由 AI 请求以符合数据主权合规：

1. **Gateway（首选）**：在路由到提供商之前处理数据分类和个人信息脱敏
2. **LocalAI（备用）**：网关不可用时在设备上直接推理

AI Gateway 确保威胁数据（IP、MAC、日志）保持 LOCAL_ONLY，永不离开设备。

## LuCI 仪表板

导航到：**SecuBox > 安全 > Threat Analyst**

功能：
- **状态面板**：守护进程状态、LocalAI 状态、威胁计数
- **AI 聊天**：与威胁分析 AI 的交互式聊天
- **待处理规则**：批准/拒绝生成的规则
- **威胁表**：最近的安全事件

## 数据来源

| 来源 | 类型 | 路径 |
|------|------|------|
| CrowdSec | 警报 | `cscli alerts list` |
| mitmproxy | 威胁 | `/srv/mitmproxy/threats.log` |
| netifyd | DPI | `/var/run/netifyd/status.json` |

## 生成的规则

### mitmproxy 过滤器
输出：`/etc/mitmproxy/ai_filters.py`

带有 IP 黑名单、URL 模式、User-Agent 检测的 Python 类。

### CrowdSec 场景
输出：`/etc/crowdsec/scenarios/ai-generated.yaml`

用于 AI 检测到的攻击模式的 YAML 场景。

### WAF 规则
输出：`/etc/mitmproxy/waf_ai_rules.json`

用于 SQL 注入、XSS、路径遍历、扫描器检测的 JSON 规则集。

## 依赖项

- `secubox-mcp-server` — AI 集成的 MCP 协议
- `jsonfilter` — JSON 解析
- `secubox-app-localai` — LocalAI 推理（推荐）
- `crowdsec` — CrowdSec 集成（可选）
- `mitmproxy` — WAF 集成（可选）

## 架构

```
+-------------+  +-------------+  +-------------+
|  CrowdSec   |  |  mitmproxy  |  |   netifyd   |
+------+------+  +------+------+  +------+------+
       |                |                |
       +----------------+----------------+
                        |
                +-------v-------+
                |    收集器     |
                +-------+-------+
                        |
                +-------v-------+
                |    LocalAI    |
                |     分析      |
                +-------+-------+
                        |
       +----------------+----------------+
       |                |                |
+------v------+  +------v------+  +------v------+
|  mitmproxy  |  |  CrowdSec   |  |    WAF      |
|    过滤器   |  |    场景     |  |    规则     |
+-------------+  +-------------+  +-------------+
```

## 许可证

MIT

## 属于

SecuBox AI Gateway（第 2 层）— v0.18
