[English](README.md) | [Francais](README.fr.md) | 中文

# LuCI LocalAI 仪表板

本地 LLM 推理服务器管理，提供 OpenAI 兼容 API。

## 安装

```bash
opkg install luci-app-localai
```

## 访问

LuCI 菜单：**服务 -> LocalAI**

## 标签页

- **仪表板** -- 服务健康状态、已加载模型、API 端点状态
- **模型** -- 安装、删除和管理 LLM 模型
- **聊天** -- 用于测试模型的交互式聊天界面
- **设置** -- API 端口、内存限制、运行时配置

## RPCD 方法

后端：`luci.localai`

| 方法 | 描述 |
|------|------|
| `status` | 服务状态和运行时信息 |
| `models` | 列出已安装模型 |
| `config` | 获取配置 |
| `health` | API 健康检查 |
| `metrics` | 推理指标和统计 |
| `start` | 启动 LocalAI |
| `stop` | 停止 LocalAI |
| `restart` | 重启 LocalAI |
| `model_install` | 按名称安装模型 |
| `model_remove` | 删除已安装的模型 |
| `chat` | 发送聊天完成请求 |
| `complete` | 发送文本完成请求 |

## 依赖

- `luci-base`
- `secubox-app-localai`

## 许可证

Apache-2.0
