# SecuBox MCP Server

Model Context Protocol (MCP) server for SecuBox. Exposes device security data to AI assistants (Claude Desktop, Cursor, VS Code) via JSON-RPC 2.0 over stdio.

**Version**: 1.0.0

## Overview

MCP (Model Context Protocol) is an open protocol by Anthropic that allows AI assistants to access local data sources. This server provides SecuBox security data to AI tools for:

- Real-time threat intelligence analysis
- CVE vulnerability lookups with mitigation advice
- WAF filter rule suggestions
- Security posture assessments
- Network and system monitoring

## Installation

```sh
opkg install secubox-mcp-server
```

## Available Tools

### Security Tools

| Tool | Description |
|------|-------------|
| `crowdsec.alerts` | Get active CrowdSec security alerts |
| `crowdsec.decisions` | Get active blocking decisions |
| `waf.logs` | Get WAF threat events from mitmproxy |

### Network Tools

| Tool | Description |
|------|-------------|
| `network.flows` | Get network traffic summary |
| `wireguard.status` | Get VPN tunnel status |
| `dns.queries` | Get DNS query statistics |

### System Tools

| Tool | Description |
|------|-------------|
| `system.metrics` | Get CPU, memory, disk, temperature |
| `uci.get` | Read OpenWrt UCI configuration |
| `uci.set` | Write UCI configuration (disabled by default) |

### AI-Powered Tools (Requires LocalAI)

| Tool | Description |
|------|-------------|
| `ai.analyze_threats` | AI analysis of CrowdSec alerts with recommendations |
| `ai.cve_lookup` | CVE vulnerability analysis and mitigation advice |
| `ai.suggest_waf_rules` | AI-suggested mitmproxy/WAF filter patterns |
| `ai.explain_ban` | Explain why an IP was banned |
| `ai.security_posture` | Security posture assessment |

## Claude Desktop Integration

Add to `~/.config/claude/claude_desktop_config.json`:

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

Then restart Claude Desktop. Ask questions like:
- "What are the current security threats on my router?"
- "Analyze CVE-2024-1234 and suggest mitigations"
- "What's my network traffic summary?"
- "Suggest WAF rules based on recent attacks"

## Configuration

UCI config: `/etc/config/mcp-server`

```uci
config mcp-server 'main'
    option enabled '1'

    # Tool whitelist - only these tools can be invoked
    list allowed_tool 'crowdsec.alerts'
    list allowed_tool 'crowdsec.decisions'
    list allowed_tool 'waf.logs'
    list allowed_tool 'dns.queries'
    list allowed_tool 'network.flows'
    list allowed_tool 'system.metrics'
    list allowed_tool 'wireguard.status'
    list allowed_tool 'uci.get'
    # list allowed_tool 'uci.set'  # Disabled by default

    # AI tools (require LocalAI)
    list allowed_tool 'ai.analyze_threats'
    list allowed_tool 'ai.cve_lookup'
    list allowed_tool 'ai.suggest_waf_rules'
    list allowed_tool 'ai.explain_ban'
    list allowed_tool 'ai.security_posture'

    # Data classification for sovereignty
    option classification 'local_only'
```

### Enable/Disable Tools

```sh
# Enable uci.set (careful - allows config changes)
uci add_list mcp-server.main.allowed_tool='uci.set'
uci commit mcp-server

# Disable a tool
uci del_list mcp-server.main.allowed_tool='ai.security_posture'
uci commit mcp-server
```

## Testing

### Test Protocol Locally

```sh
# Initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | /usr/bin/secubox-mcp

# List tools
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | /usr/bin/secubox-mcp

# Call a tool
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"system.metrics","arguments":{}}}' | /usr/bin/secubox-mcp
```

### Test via SSH

```sh
ssh root@192.168.255.1 '/usr/bin/secubox-mcp' <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"crowdsec.alerts","arguments":{"limit":10}}}
EOF
```

## LocalAI Integration

The AI-powered tools require LocalAI running on the device:

```sh
# Install and start LocalAI
opkg install secubox-app-localai
localaictl install
localaictl model-install tinyllama
uci set localai.main.enabled=1
uci commit localai
/etc/init.d/localai start
```

AI tools will automatically use LocalAI at `http://127.0.0.1:8081` for analysis.

## Security Considerations

1. **Tool Whitelist**: Only tools listed in UCI config can be invoked
2. **uci.set Disabled**: Write access disabled by default
3. **Sensitive Data Blocked**: uci.get blocks password/secret/key fields
4. **SSH Required**: MCP runs over SSH - requires key authentication
5. **Data Classification**: All data marked LOCAL_ONLY by default
6. **No Cloud Escalation**: Server runs entirely on device

## Files

| File | Description |
|------|-------------|
| `/usr/bin/secubox-mcp` | Main MCP server |
| `/usr/lib/secubox-mcp/protocol.sh` | JSON-RPC protocol handler |
| `/usr/lib/secubox-mcp/tools/*.sh` | Tool implementations |
| `/etc/config/mcp-server` | UCI configuration |

## Dependencies

- `jsonfilter` — JSON parsing (OpenWrt native)
- `cscli` — CrowdSec CLI (for crowdsec tools)
- `wg` — WireGuard tools (for wireguard tools)
- `secubox-app-localai` — LocalAI (for AI tools)

## Protocol

MCP uses JSON-RPC 2.0 over stdio:

- **Transport**: stdin/stdout
- **Protocol Version**: 2024-11-05
- **Methods**: `initialize`, `tools/list`, `tools/call`, `ping`

## License

MIT

## References

- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [SecuBox Documentation](https://secubox.dev/docs)
