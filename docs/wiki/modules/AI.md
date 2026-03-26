# AI Modules

SecuBox integrates AI capabilities through 8 specialized modules with data sovereignty controls.

---

## Overview

| Layer | Components |
|-------|------------|
| **Gateway** | AI Gateway (routing, classification) |
| **Inference** | LocalAI, Ollama (local LLMs) |
| **Analysis** | Threat Analyst, CVE Triage, Network Anomaly |
| **Memory** | LocalRecall (persistent AI memory) |
| **Insights** | AI Insights dashboard |

---

## AI Gateway

**Package**: `secubox-ai-gateway` + `luci-app-ai-gateway`

Data sovereignty engine with intelligent provider routing.

![AI Gateway](../../screenshots/router/ai-gateway.png)

### Data Classification

| Tier | Description | Destination |
|------|-------------|-------------|
| **LOCAL_ONLY** | Raw network data, IPs, MACs, logs | Never leaves device |
| **SANITIZED** | Anonymized patterns, scrubbed IPs | Mistral EU (opt-in) |
| **CLOUD_DIRECT** | Generic queries, no sensitive data | Claude/GPT (opt-in) |

### Provider Hierarchy

1. **LocalAI** (local inference, always available)
2. **Mistral** (EU sovereign, GDPR compliant)
3. **Claude** (Anthropic)
4. **OpenAI GPT**
5. **Google Gemini**
6. **xAI Grok**

### CLI

```bash
aigatewayctl status           # Gateway status
aigatewayctl classify "text"  # Classify data tier
aigatewayctl sanitize "text"  # Sanitize sensitive data
aigatewayctl provider list    # List providers
aigatewayctl audit            # View audit log
aigatewayctl login claude     # Configure provider
```

### RPCD Methods

| Method | Description |
|--------|-------------|
| `status` | Gateway status |
| `classify` | Classify data tier |
| `sanitize` | Sanitize text |
| `providers` | List providers |
| `audit` | Get audit log |
| `login` | Configure provider |

---

## LocalAI

**Package**: `secubox-app-localai` + `luci-app-localai`

Local LLM inference server (LocalAI 3.9+).

![LocalAI](../../screenshots/router/localai.png)

### Features

- OpenAI-compatible API
- Multiple model support
- GPU acceleration (optional)
- Embeddings generation
- Voice transcription

### Supported Models

| Model | Size | Use Case |
|-------|------|----------|
| TinyLlama | 1.1B | Fast chat, simple queries |
| Mistral 7B | 7B | General purpose |
| CodeLlama | 7B | Code generation |
| Whisper | - | Audio transcription |

### CLI

```bash
localaictl status             # Service status
localaictl models             # List models
localaictl download <model>   # Download model
localaictl chat "Hello"       # Quick chat
```

### API

```bash
# OpenAI-compatible endpoint
curl http://localhost:4050/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"tinyllama","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Ollama

**Package**: `secubox-app-ollama` + `luci-app-ollama`

Ollama LLM server for easy model management.

![Ollama](../../screenshots/router/ollama.png)

### Features

- Simple model management
- Streaming responses
- Custom modelfiles
- GPU support

### CLI

```bash
ollama list                   # List models
ollama pull llama2            # Download model
ollama run llama2 "Hello"     # Chat
```

---

## Threat Analyst

**Package**: `secubox-threat-analyst` + `luci-app-threat-analyst`

AI-powered threat correlation and analysis.

![Threat Analyst](../../screenshots/router/threat-analyst.png)

### Features

- Multi-source correlation
- AI threat scoring
- Attack pattern detection
- Automated response
- Incident timeline

### Data Sources

| Source | Type |
|--------|------|
| CrowdSec | IDS alerts, decisions |
| WAF | HTTP blocks, patterns |
| DPI | Network flows |
| DNS | Query logs |
| Auth | Login attempts |

### CLI

```bash
threat-analystctl status      # Status
threat-analystctl analyze     # Run analysis
threat-analystctl report      # Generate report
```

---

## CVE Triage

**Package**: `secubox-cve-triage` + `luci-app-cve-triage`

AI-powered vulnerability prioritization.

![CVE Triage](../../screenshots/router/cve.png)

### Features

- CVE database integration
- Risk scoring
- Patch recommendations
- Affected package detection
- Priority ranking

### Scoring Factors

| Factor | Weight |
|--------|--------|
| CVSS Score | 40% |
| Exploitability | 25% |
| Affected Systems | 20% |
| Mitigation Available | 15% |

---

## Network Anomaly

**Package**: `secubox-network-anomaly` + `luci-app-network-anomaly`

AI network traffic anomaly detection.

![Network Anomaly](../../screenshots/router/anomaly.png)

### Features

- Baseline learning
- Deviation detection
- Pattern recognition
- Alert generation
- Automated response

### Detection Types

| Type | Description |
|------|-------------|
| Volume | Unusual traffic volume |
| Pattern | Abnormal traffic patterns |
| Protocol | Protocol anomalies |
| Timing | Unusual timing patterns |

---

## LocalRecall

**Package**: `secubox-localrecall` + `luci-app-localrecall`

Persistent AI memory system.

![LocalRecall](../../screenshots/router/localrecall.png)

### Features

- Context persistence
- Vector storage
- Semantic search
- Memory management
- Privacy controls

### Use Cases

- Conversation history
- Knowledge base
- Configuration memory
- Incident memory

---

## AI Insights

**Package**: `luci-app-ai-insights`

AI-powered system insights dashboard.

![AI Insights](../../screenshots/router/ai-insights.png)

### Features

- System health analysis
- Security recommendations
- Performance insights
- Trend analysis
- Predictive alerts

### Insight Types

| Type | Description |
|------|-------------|
| Security | Threat patterns, vulnerabilities |
| Performance | Resource optimization |
| Network | Traffic patterns |
| Config | Configuration improvements |

---

## Configuration

### Enable AI Features

```bash
# Enable AI Gateway
uci set ai-gateway.main.enabled='1'
uci set ai-gateway.main.local_only='1'  # Disable cloud providers
uci commit ai-gateway

# Configure LocalAI
uci set localai.main.enabled='1'
uci set localai.main.model='tinyllama'
uci commit localai

# Start services
/etc/init.d/ai-gateway start
/etc/init.d/localai start
```

### Provider Configuration

```bash
# Configure cloud providers (optional)
aigatewayctl login mistral    # Mistral EU
aigatewayctl login claude     # Anthropic Claude
aigatewayctl login openai     # OpenAI
```

---

## Privacy & Sovereignty

### Data Never Leaves Device

When `local_only='1'`:
- All inference runs locally
- No cloud API calls
- Full data sovereignty
- GDPR compliant

### ANSSI CSPN Compliance

AI Gateway supports ANSSI certification requirements:
- Data classification audit trail
- Encryption in transit/at rest
- Access control logging
- Provider verification

---

See also:
- [Security Modules](Security.md)
- [Architecture](../Architecture.md)
- [API Reference](../API.md)

---

*SecuBox v1.0.0*
