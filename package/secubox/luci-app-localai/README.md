# LuCI LocalAI Dashboard

Local LLM inference server management with OpenAI-compatible API.

## Installation

```bash
opkg install luci-app-localai
```

## Access

LuCI menu: **Services -> LocalAI**

## Tabs

- **Dashboard** -- Service health, loaded models, API endpoint status
- **Models** -- Install, remove, and manage LLM models
- **Chat** -- Interactive chat interface for testing models
- **Settings** -- API port, memory limits, runtime configuration

## RPCD Methods

Backend: `luci.localai`

| Method | Description |
|--------|-------------|
| `status` | Service status and runtime info |
| `models` | List installed models |
| `config` | Get configuration |
| `health` | API health check |
| `metrics` | Inference metrics and stats |
| `start` | Start LocalAI |
| `stop` | Stop LocalAI |
| `restart` | Restart LocalAI |
| `model_install` | Install a model by name |
| `model_remove` | Remove an installed model |
| `chat` | Send chat completion request |
| `complete` | Send text completion request |

## Dependencies

- `luci-base`
- `secubox-app-localai`

## License

Apache-2.0
