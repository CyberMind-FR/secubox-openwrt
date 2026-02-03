# SecuBox Ollama - Local LLM Runtime

Run large language models locally on your OpenWrt device. Provides an OpenAI-compatible REST API with native ARM64 support. Supports LLaMA, Mistral, Phi, Gemma, and other open models.

## Installation

```bash
opkg install secubox-app-ollama
```

## Configuration

UCI config file: `/etc/config/ollama`

```bash
uci set ollama.main.enabled='1'
uci set ollama.main.bind='0.0.0.0'
uci set ollama.main.port='11434'
uci set ollama.main.model_dir='/srv/ollama/models'
uci commit ollama
```

## Usage

```bash
ollamactl start              # Start Ollama service
ollamactl stop               # Stop Ollama service
ollamactl status             # Show service status
ollamactl pull <model>       # Download a model
ollamactl list               # List installed models
ollamactl remove <model>     # Remove a model
ollamactl run <model>        # Run interactive chat
```

## API

OpenAI-compatible endpoint at `http://<host>:11434`:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello"
}'
```

## Supported Models

LLaMA 3.x, Mistral, Phi-3, Gemma 2, CodeLlama, and any GGUF-compatible model.

## Dependencies

- `jsonfilter`
- `wget-ssl`

## License

Apache-2.0
