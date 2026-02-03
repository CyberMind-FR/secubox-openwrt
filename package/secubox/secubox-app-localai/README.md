# SecuBox LocalAI

Native LLM server with OpenAI-compatible REST API. Supports GGUF models on ARM64 and x86_64.

## Installation

```sh
opkg install secubox-app-localai
```

## Configuration

UCI config file: `/etc/config/localai`

```
config localai 'main'
    option enabled '0'
    option port '8080'
    option models_path '/srv/localai/models'
```

## Usage

```sh
# Install the binary (downloaded on first run)
localaictl install

# Start / stop the service
localaictl start
localaictl stop

# Check status
localaictl status

# Download a model
localaictl model-pull <model-name>
```

The binary is downloaded from GitHub releases on first `localaictl install`.

## Features

- OpenAI-compatible REST API
- GGUF model support (LLaMA, Mistral, Phi, TinyLlama, etc.)
- ARM64 and x86_64 architectures

## Files

- `/etc/config/localai` -- UCI configuration
- `/usr/sbin/localaictl` -- controller CLI
- `/srv/localai/models/` -- model storage directory

## Dependencies

- `libstdcpp`
- `libpthread`
- `wget-ssl`
- `ca-certificates`

## License

MIT
