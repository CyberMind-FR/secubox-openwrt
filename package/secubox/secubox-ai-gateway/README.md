# SecuBox AI Gateway

**Data Classifier (Sovereignty Engine) for ANSSI CSPN Compliance**

The AI Gateway implements intelligent routing of AI requests based on data sensitivity classification, ensuring data sovereignty and GDPR compliance.

## Features

- **Three-tier data classification**: LOCAL_ONLY, SANITIZED, CLOUD_DIRECT
- **Multi-provider support**: LocalAI > Mistral (EU) > Claude > GPT > Gemini > xAI
- **OpenAI-compatible API** on port 4050
- **PII sanitization** for EU provider tier
- **ANSSI CSPN audit logging**
- **Offline mode** for airgapped operation

## Classification Tiers

| Tier | Content | Destination |
|------|---------|-------------|
| `LOCAL_ONLY` | IPs, MACs, credentials, keys, logs | LocalAI (on-device) |
| `SANITIZED` | PII that can be scrubbed | Mistral EU (opt-in) |
| `CLOUD_DIRECT` | Generic queries | Any provider (opt-in) |

## Provider Hierarchy

1. **LocalAI** (Priority 0) - Always on-device, no API key needed
2. **Mistral** (Priority 1) - EU sovereign, GDPR compliant
3. **Claude** (Priority 2) - Anthropic
4. **OpenAI** (Priority 3) - GPT models
5. **Gemini** (Priority 4) - Google
6. **xAI** (Priority 5) - Grok models

All cloud providers are **opt-in** and require explicit configuration.

## CLI Reference

```sh
# Status
aigatewayctl status

# Classification testing
aigatewayctl classify "Server IP is 192.168.1.100"
aigatewayctl sanitize "User password=secret on 192.168.1.1"

# Provider management
aigatewayctl provider list
aigatewayctl provider enable mistral
aigatewayctl provider test localai

# Audit
aigatewayctl audit stats
aigatewayctl audit tail
aigatewayctl audit export

# Offline mode (forces LOCAL_ONLY)
aigatewayctl offline-mode on
aigatewayctl offline-mode off
```

## API Usage

The gateway provides an OpenAI-compatible API:

```sh
# Chat completion
curl -X POST http://127.0.0.1:4050/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is 2+2?"}]}'

# List models
curl http://127.0.0.1:4050/v1/models

# Health check
curl http://127.0.0.1:4050/health
```

## Configuration

### UCI Options

```sh
# Main configuration
uci set ai-gateway.main.enabled='1'
uci set ai-gateway.main.proxy_port='4050'
uci set ai-gateway.main.offline_mode='0'

# Enable Mistral (EU provider)
uci set ai-gateway.mistral.enabled='1'
uci set ai-gateway.mistral.api_key='your-api-key'
uci commit ai-gateway
```

### Classification Patterns

Edit `/etc/config/ai-gateway` to customize detection patterns:

```uci
config patterns 'local_only_patterns'
    list pattern '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'
    list pattern 'password|secret|token'
    list pattern 'BEGIN.*PRIVATE KEY'
```

## Audit Logging

Audit logs are stored in JSONL format for ANSSI CSPN compliance:

```
/var/log/ai-gateway/audit.jsonl
```

Each entry includes:
- Timestamp (ISO 8601)
- Request ID
- Classification decision
- Matched pattern
- Provider used
- Sanitization status

Export for compliance review:
```sh
aigatewayctl audit export
# Creates: /tmp/ai-gateway-audit-YYYYMMDD-HHMMSS.jsonl.gz
```

## ANSSI CSPN Compliance Points

1. **Data Sovereignty**: LOCAL_ONLY tier never sends data externally
2. **EU Preference**: Mistral (France) prioritized over US providers
3. **Audit Trail**: All classifications logged with timestamps
4. **Offline Capability**: Can operate fully airgapped
5. **Explicit Consent**: All cloud providers require opt-in

## File Locations

| Path | Description |
|------|-------------|
| `/etc/config/ai-gateway` | UCI configuration |
| `/usr/sbin/aigatewayctl` | CLI controller |
| `/usr/lib/ai-gateway/` | Library scripts |
| `/var/log/ai-gateway/audit.jsonl` | Audit log |
| `/tmp/ai-gateway/` | Runtime state |

## Dependencies

- `jsonfilter` (OpenWrt native)
- `wget-ssl` (HTTPS support)
- `secubox-app-localai` (optional, for local inference)

## License

MIT License - Copyright (C) 2026 CyberMind.fr
