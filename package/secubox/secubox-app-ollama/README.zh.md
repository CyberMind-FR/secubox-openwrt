[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Ollama - 本地 LLM 运行时

在您的 OpenWrt 设备上本地运行大型语言模型。提供兼容 OpenAI 的 REST API，原生支持 ARM64。支持 LLaMA、Mistral、Phi、Gemma 和其他开放模型。

## 安装

```bash
opkg install secubox-app-ollama
```

## 配置

UCI 配置文件：`/etc/config/ollama`

```bash
uci set ollama.main.enabled='1'
uci set ollama.main.bind='0.0.0.0'
uci set ollama.main.port='11434'
uci set ollama.main.model_dir='/srv/ollama/models'
uci commit ollama
```

## 使用方法

```bash
ollamactl start              # 启动 Ollama 服务
ollamactl stop               # 停止 Ollama 服务
ollamactl status             # 显示服务状态
ollamactl pull <model>       # 下载模型
ollamactl list               # 列出已安装的模型
ollamactl remove <model>     # 删除模型
ollamactl run <model>        # 运行交互式聊天
```

## API

兼容 OpenAI 的端点位于 `http://<host>:11434`：

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello"
}'
```

## 支持的模型

LLaMA 3.x、Mistral、Phi-3、Gemma 2、CodeLlama，以及任何兼容 GGUF 的模型。

## 依赖

- `jsonfilter`
- `wget-ssl`

## 许可证

Apache-2.0
