[English](README.md) | Francais | [中文](README.zh.md)

# SecuBox Ollama - Runtime LLM Local

Executez des grands modeles de langage localement sur votre appareil OpenWrt. Fournit une API REST compatible OpenAI avec support natif ARM64. Supporte LLaMA, Mistral, Phi, Gemma et d'autres modeles ouverts.

## Installation

```bash
opkg install secubox-app-ollama
```

## Configuration

Fichier de configuration UCI : `/etc/config/ollama`

```bash
uci set ollama.main.enabled='1'
uci set ollama.main.bind='0.0.0.0'
uci set ollama.main.port='11434'
uci set ollama.main.model_dir='/srv/ollama/models'
uci commit ollama
```

## Utilisation

```bash
ollamactl start              # Demarrer le service Ollama
ollamactl stop               # Arreter le service Ollama
ollamactl status             # Afficher le statut du service
ollamactl pull <model>       # Telecharger un modele
ollamactl list               # Lister les modeles installes
ollamactl remove <model>     # Supprimer un modele
ollamactl run <model>        # Lancer un chat interactif
```

## API

Point d'acces compatible OpenAI sur `http://<host>:11434` :

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello"
}'
```

## Modeles Supportes

LLaMA 3.x, Mistral, Phi-3, Gemma 2, CodeLlama, et tout modele compatible GGUF.

## Dependances

- `jsonfilter`
- `wget-ssl`

## Licence

Apache-2.0
