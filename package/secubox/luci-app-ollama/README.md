# LuCI Ollama Dashboard

LuCI web interface for managing Ollama -- local large language model runtime.

## Installation

```bash
opkg install luci-app-ollama
```

## Access

LuCI > Services > Ollama

## Tabs

- **Dashboard** -- Service status and resource usage
- **Models** -- Pull, list, and remove LLM models
- **Chat** -- Interactive chat interface for loaded models
- **Settings** -- Ollama server configuration

## RPCD Methods

Service: `luci.ollama`

## Dependencies

- `luci-base`
- `secubox-app-ollama`

## License

Apache-2.0
