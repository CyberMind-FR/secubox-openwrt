[English](README.md) | [Francais](README.fr.md) | 中文

# LuCI Ollama 仪表板

用于管理 Ollama 的 LuCI Web 界面 -- 本地大语言模型运行时。

## 安装

```bash
opkg install luci-app-ollama
```

## 访问

LuCI > 服务 > Ollama

## 标签页

- **仪表板** -- 服务状态和资源使用情况
- **模型** -- 拉取、列出和删除 LLM 模型
- **聊天** -- 已加载模型的交互式聊天界面
- **设置** -- Ollama 服务器配置

## RPCD 方法

服务：`luci.ollama`

## 依赖

- `luci-base`
- `secubox-app-ollama`

## 许可证

Apache-2.0
