[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox AI Gateway

**数据分类器（主权引擎）- 符合 ANSSI CSPN 合规要求**

AI Gateway 基于数据敏感度分类实现 AI 请求的智能路由，确保数据主权和 GDPR 合规。

## 功能特性

- **三级数据分类**：LOCAL_ONLY、SANITIZED、CLOUD_DIRECT
- **多提供商支持**：LocalAI > Mistral (EU) > Claude > GPT > Gemini > xAI
- **兼容 OpenAI 的 API**，端口 4050
- **PII 脱敏处理**，用于 EU 提供商层
- **ANSSI CSPN 审计日志**
- **离线模式**，用于隔离网络操作

## 分类层级

| 层级 | 内容 | 目标 |
|------|------|------|
| `LOCAL_ONLY` | IP、MAC、凭据、密钥、日志 | LocalAI（设备本地） |
| `SANITIZED` | 可脱敏的 PII | Mistral EU（需选择加入） |
| `CLOUD_DIRECT` | 通用查询 | 任何提供商（需选择加入） |

## 提供商优先级

1. **LocalAI**（优先级 0）- 始终在设备本地，无需 API 密钥
2. **Mistral**（优先级 1）- EU 主权，符合 GDPR
3. **Claude**（优先级 2）- Anthropic
4. **OpenAI**（优先级 3）- GPT 模型
5. **Gemini**（优先级 4）- Google
6. **xAI**（优先级 5）- Grok 模型

所有云提供商都需要**明确选择加入**并进行显式配置。

## CLI 参考

```sh
# 状态
aigatewayctl status

# 分类测试
aigatewayctl classify "服务器 IP 是 192.168.1.100"
aigatewayctl sanitize "用户密码=secret 在 192.168.1.1"

# 提供商管理
aigatewayctl provider list
aigatewayctl provider enable mistral
aigatewayctl provider test localai

# 审计
aigatewayctl audit stats
aigatewayctl audit tail
aigatewayctl audit export

# 离线模式（强制 LOCAL_ONLY）
aigatewayctl offline-mode on
aigatewayctl offline-mode off
```

## API 使用

网关提供兼容 OpenAI 的 API：

```sh
# 聊天完成
curl -X POST http://127.0.0.1:4050/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"2+2等于多少？"}]}'

# 列出模型
curl http://127.0.0.1:4050/v1/models

# 健康检查
curl http://127.0.0.1:4050/health
```

## 配置

### UCI 选项

```sh
# 主配置
uci set ai-gateway.main.enabled='1'
uci set ai-gateway.main.proxy_port='4050'
uci set ai-gateway.main.offline_mode='0'

# 启用 Mistral（EU 提供商）
uci set ai-gateway.mistral.enabled='1'
uci set ai-gateway.mistral.api_key='您的-api-密钥'
uci commit ai-gateway
```

### 分类模式

编辑 `/etc/config/ai-gateway` 来自定义检测模式：

```uci
config patterns 'local_only_patterns'
    list pattern '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'
    list pattern 'password|secret|token'
    list pattern 'BEGIN.*PRIVATE KEY'
```

## 审计日志

审计日志以 JSONL 格式存储，符合 ANSSI CSPN 合规要求：

```
/var/log/ai-gateway/audit.jsonl
```

每个条目包括：
- 时间戳（ISO 8601）
- 请求 ID
- 分类决策
- 匹配的模式
- 使用的提供商
- 脱敏状态

导出用于合规审查：
```sh
aigatewayctl audit export
# 创建：/tmp/ai-gateway-audit-YYYYMMDD-HHMMSS.jsonl.gz
```

## ANSSI CSPN 合规要点

1. **数据主权**：LOCAL_ONLY 层永不向外发送数据
2. **EU 优先**：Mistral（法国）优先于美国提供商
3. **审计跟踪**：所有分类都记录时间戳
4. **离线能力**：可完全隔离运行
5. **明确同意**：所有云提供商需要选择加入

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/ai-gateway` | UCI 配置 |
| `/usr/sbin/aigatewayctl` | CLI 控制器 |
| `/usr/lib/ai-gateway/` | 库脚本 |
| `/var/log/ai-gateway/audit.jsonl` | 审计日志 |
| `/tmp/ai-gateway/` | 运行时状态 |

## 依赖项

- `jsonfilter`（OpenWrt 原生）
- `wget-ssl`（HTTPS 支持）
- `secubox-app-localai`（可选，用于本地推理）

## 许可证

MIT 许可证 - 版权所有 (C) 2026 CyberMind.fr
