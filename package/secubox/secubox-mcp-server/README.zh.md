[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox MCP 服务器

SecuBox 的模型上下文协议（MCP）服务器。通过 stdio 上的 JSON-RPC 2.0 向 AI 助手（Claude Desktop、Cursor、VS Code）公开设备安全数据。

**版本**：1.0.0

## 概述

MCP（模型上下文协议）是 Anthropic 的开放协议，允许 AI 助手访问本地数据源。该服务器为 AI 工具提供 SecuBox 安全数据，用于：

- 实时威胁情报分析
- CVE 漏洞查询和缓解建议
- WAF 过滤规则建议
- 安全态势评估
- 网络和系统监控

## 安装

```sh
opkg install secubox-mcp-server
```

## 可用工具

### 安全工具

| 工具 | 描述 |
|------|------|
| `crowdsec.alerts` | 获取活跃的 CrowdSec 安全警报 |
| `crowdsec.decisions` | 获取活跃的阻止决策 |
| `waf.logs` | 从 mitmproxy 获取 WAF 威胁事件 |

### 网络工具

| 工具 | 描述 |
|------|------|
| `network.flows` | 获取网络流量摘要 |
| `wireguard.status` | 获取 VPN 隧道状态 |
| `dns.queries` | 获取 DNS 查询统计 |

### 系统工具

| 工具 | 描述 |
|------|------|
| `system.metrics` | 获取 CPU、内存、磁盘、温度 |
| `uci.get` | 读取 OpenWrt UCI 配置 |
| `uci.set` | 写入 UCI 配置（默认禁用）|

### AI 工具（需要 LocalAI）

| 工具 | 描述 |
|------|------|
| `ai.analyze_threats` | AI 分析 CrowdSec 警报并提供建议 |
| `ai.cve_lookup` | CVE 漏洞分析和缓解建议 |
| `ai.suggest_waf_rules` | AI 建议的 mitmproxy/WAF 过滤模式 |
| `ai.explain_ban` | 解释为什么某个 IP 被封禁 |
| `ai.security_posture` | 安全态势评估 |

## Claude Desktop 集成

添加到 `~/.config/claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "secubox": {
      "command": "ssh",
      "args": ["root@192.168.255.1", "/usr/bin/secubox-mcp"]
    }
  }
}
```

然后重启 Claude Desktop。提问示例：
- "我的路由器上当前有什么安全威胁？"
- "分析 CVE-2024-1234 并建议缓解措施"
- "我的网络流量摘要是什么？"
- "根据最近的攻击建议 WAF 规则"

## 配置

UCI 配置：`/etc/config/mcp-server`

```uci
config mcp-server 'main'
    option enabled '1'

    # 工具白名单 - 只有这些工具可以被调用
    list allowed_tool 'crowdsec.alerts'
    list allowed_tool 'crowdsec.decisions'
    list allowed_tool 'waf.logs'
    list allowed_tool 'dns.queries'
    list allowed_tool 'network.flows'
    list allowed_tool 'system.metrics'
    list allowed_tool 'wireguard.status'
    list allowed_tool 'uci.get'
    # list allowed_tool 'uci.set'  # 默认禁用

    # AI 工具（需要 LocalAI）
    list allowed_tool 'ai.analyze_threats'
    list allowed_tool 'ai.cve_lookup'
    list allowed_tool 'ai.suggest_waf_rules'
    list allowed_tool 'ai.explain_ban'
    list allowed_tool 'ai.security_posture'

    # 数据主权分类
    option classification 'local_only'
```

### 启用/禁用工具

```sh
# 启用 uci.set（注意 - 允许配置更改）
uci add_list mcp-server.main.allowed_tool='uci.set'
uci commit mcp-server

# 禁用工具
uci del_list mcp-server.main.allowed_tool='ai.security_posture'
uci commit mcp-server
```

## 测试

### 本地测试协议

```sh
# 初始化
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | /usr/bin/secubox-mcp

# 列出工具
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | /usr/bin/secubox-mcp

# 调用工具
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"system.metrics","arguments":{}}}' | /usr/bin/secubox-mcp
```

### 通过 SSH 测试

```sh
ssh root@192.168.255.1 '/usr/bin/secubox-mcp' <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"crowdsec.alerts","arguments":{"limit":10}}}
EOF
```

## LocalAI 集成

AI 工具需要设备上运行 LocalAI：

```sh
# 安装并启动 LocalAI
opkg install secubox-app-localai
localaictl install
localaictl model-install tinyllama
uci set localai.main.enabled=1
uci commit localai
/etc/init.d/localai start
```

AI 工具将自动使用 `http://127.0.0.1:8081` 上的 LocalAI 进行分析。

## 安全考虑

1. **工具白名单**：只有 UCI 配置中列出的工具可以被调用
2. **uci.set 禁用**：默认禁用写访问
3. **敏感数据阻止**：uci.get 阻止 password/secret/key 字段
4. **需要 SSH**：MCP 通过 SSH 运行 - 需要密钥认证
5. **数据分类**：所有数据默认标记为 LOCAL_ONLY
6. **无云端升级**：服务器完全在设备上运行

## 文件

| 文件 | 描述 |
|------|------|
| `/usr/bin/secubox-mcp` | 主 MCP 服务器 |
| `/usr/lib/secubox-mcp/protocol.sh` | JSON-RPC 协议处理器 |
| `/usr/lib/secubox-mcp/tools/*.sh` | 工具实现 |
| `/etc/config/mcp-server` | UCI 配置 |

## 依赖

- `jsonfilter` — JSON 解析（OpenWrt 原生）
- `cscli` — CrowdSec CLI（用于 crowdsec 工具）
- `wg` — WireGuard 工具（用于 wireguard 工具）
- `secubox-app-localai` — LocalAI（用于 AI 工具）

## 协议

MCP 使用 stdio 上的 JSON-RPC 2.0：

- **传输**：stdin/stdout
- **协议版本**：2024-11-05
- **方法**：`initialize`、`tools/list`、`tools/call`、`ping`

## 许可证

MIT

## 参考

- [模型上下文协议规范](https://modelcontextprotocol.io/)
- [Claude Desktop MCP 指南](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [SecuBox 文档](https://secubox.dev/docs)
