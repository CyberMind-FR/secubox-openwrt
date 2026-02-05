# SecuBox LocalAI

Native LLM server with OpenAI-compatible REST API. Supports GGUF models on ARM64 and x86_64.

**Version**: 3.9.0

## Features

- OpenAI-compatible REST API (`/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`)
- GGUF model support (LLaMA, Mistral, Phi, TinyLlama, etc.)
- ARM64 and x86_64 architectures
- **Agent Jobs Panel** (v3.9) — Schedule and manage background agentic tasks
- **Memory Reclaimer** (v3.9) — LRU eviction for loaded models
- Embeddings support (GTE-Small preset)

## Installation

```sh
opkg install secubox-app-localai

# Download the binary (first run)
localaictl install

# Install a model
localaictl model-install tinyllama

# Enable and start service
uci set localai.main.enabled=1
uci commit localai
/etc/init.d/localai enable
/etc/init.d/localai start
```

## Configuration

UCI config file: `/etc/config/localai`

```
config localai 'main'
    option enabled '0'
    option api_port '8081'
    option api_host '0.0.0.0'
    option models_path '/srv/localai/models'
    option threads '4'
    option context_size '2048'
```

## Model Presets

| Preset | Size | Description |
|--------|------|-------------|
| tinyllama | 669MB | TinyLlama 1.1B (chat) |
| phi2 | 1.6GB | Microsoft Phi-2 (chat) |
| mistral | 4.1GB | Mistral 7B Instruct (chat) |
| gte-small | 67MB | GTE Small (embeddings) |

```sh
localaictl model-install tinyllama
localaictl model-install gte-small   # For embeddings
```

## CLI Commands

```sh
# Install/Uninstall
localaictl install          # Download binary from GitHub
localaictl uninstall        # Remove binary

# Service
localaictl start            # Start service
localaictl stop             # Stop service
localaictl restart          # Restart service
localaictl status           # Show status
localaictl logs [-f]        # Show logs

# Models
localaictl models           # List installed models
localaictl model-install <name>  # Install model
localaictl model-remove <name>   # Remove model

# Backends
localaictl backends         # List available backends
```

## API Endpoints

Default port: 8081

| Endpoint | Description |
|----------|-------------|
| `/v1/models` | List loaded models |
| `/v1/chat/completions` | Chat completion |
| `/v1/completions` | Text completion |
| `/v1/embeddings` | Generate embeddings |
| `/readyz` | Health check |

## Files

- `/etc/config/localai` — UCI configuration
- `/usr/sbin/localaictl` — Controller CLI
- `/usr/bin/local-ai` — Binary (downloaded)
- `/srv/localai/models/` — Model storage

## Dependencies

- `libstdcpp`
- `libpthread`
- `wget-ssl`
- `ca-certificates`

## SecuBox Integration

LocalAI serves as the inference backend for SecuBox AI Gateway (Couche 2):
- Local-first LLM inference
- MCP Server integration for agent tools
- Supports Threat Analyst, CVE Triage, and other autonomous agents

## License

MIT

## Sources

- [LocalAI GitHub](https://github.com/mudler/LocalAI)
- [LocalAI v3.9.0 Release](https://github.com/mudler/LocalAI/releases)
