[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox LocalAI

原生 LLM 服务器，具有兼容 OpenAI 的 REST API。支持 ARM64 和 x86_64 上的 GGUF 模型。

**版本**：3.9.0

## 功能特性

- 兼容 OpenAI 的 REST API（`/v1/chat/completions`、`/v1/completions`、`/v1/embeddings`）
- GGUF 模型支持（LLaMA、Mistral、Phi、TinyLlama 等）
- ARM64 和 x86_64 架构
- **Agent Jobs 面板**（v3.9）-- 调度和管理后台代理任务
- **内存回收器**（v3.9）-- 已加载模型的 LRU 驱逐
- 嵌入向量支持（GTE-Small 预设）

## 安装

```sh
opkg install secubox-app-localai

# 下载二进制文件（首次运行）
localaictl install

# 安装模型
localaictl model-install tinyllama

# 启用并启动服务
uci set localai.main.enabled=1
uci commit localai
/etc/init.d/localai enable
/etc/init.d/localai start
```

## 配置

UCI 配置文件：`/etc/config/localai`

```
config localai 'main'
    option enabled '0'
    option api_port '8081'
    option api_host '0.0.0.0'
    option models_path '/srv/localai/models'
    option threads '4'
    option context_size '2048'
```

## 模型预设

| 预设 | 大小 | 描述 |
|------|------|------|
| tinyllama | 669MB | TinyLlama 1.1B（聊天） |
| phi2 | 1.6GB | Microsoft Phi-2（聊天） |
| mistral | 4.1GB | Mistral 7B Instruct（聊天） |
| gte-small | 67MB | GTE Small（嵌入向量） |

```sh
localaictl model-install tinyllama
localaictl model-install gte-small   # 用于嵌入向量
```

## CLI 命令

```sh
# 安装/卸载
localaictl install          # 从 GitHub 下载二进制文件
localaictl uninstall        # 删除二进制文件

# 服务
localaictl start            # 启动服务
localaictl stop             # 停止服务
localaictl restart          # 重启服务
localaictl status           # 显示状态
localaictl logs [-f]        # 显示日志

# 模型
localaictl models           # 列出已安装的模型
localaictl model-install <name>  # 安装模型
localaictl model-remove <name>   # 删除模型

# 后端
localaictl backends         # 列出可用后端
```

## API 端点

默认端口：8081

| 端点 | 描述 |
|------|------|
| `/v1/models` | 列出已加载的模型 |
| `/v1/chat/completions` | 聊天补全 |
| `/v1/completions` | 文本补全 |
| `/v1/embeddings` | 生成嵌入向量 |
| `/readyz` | 健康检查 |

## 文件

- `/etc/config/localai` -- UCI 配置
- `/usr/sbin/localaictl` -- 控制器 CLI
- `/usr/bin/local-ai` -- 二进制文件（已下载）
- `/srv/localai/models/` -- 模型存储

## 依赖

- `libstdcpp`
- `libpthread`
- `wget-ssl`
- `ca-certificates`

## SecuBox 集成

LocalAI 作为 SecuBox AI Gateway（第 2 层）的推理后端：
- 本地优先的 LLM 推理
- 用于代理工具的 MCP Server 集成
- 支持威胁分析师、CVE 分类和其他自主代理

## 许可证

MIT

## 来源

- [LocalAI GitHub](https://github.com/mudler/LocalAI)
- [LocalAI v3.9.0 Release](https://github.com/mudler/LocalAI/releases)
