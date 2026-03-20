[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI 备份管理器

SecuBox 备份管理 Web 仪表板。

## 功能特性

- 备份状态概览（存储路径、使用情况、上次备份时间）
- 完整/配置/容器备份的快速操作按钮
- LXC 容器列表，包含状态、大小和备份数量
- 备份历史表，包含文件、类型、大小和日期
- 一键容器备份

## 安装

```bash
opkg install luci-app-backup
```

## 位置

**系统 → 备份管理器**

## RPCD 方法

| 方法 | 参数 | 描述 |
|------|------|------|
| `status` | - | 获取备份状态和统计 |
| `list` | `type` | 列出备份 (all/config/containers/services) |
| `container_list` | - | 列出带备份信息的 LXC 容器 |
| `create` | `type` | 创建备份 (full/config/containers/services) |
| `restore` | `file`, `dry_run` | 从备份文件恢复 |
| `cleanup` | - | 删除旧备份 |
| `container_backup` | `name` | 备份特定容器 |
| `container_restore` | `name`, `file` | 恢复特定容器 |

## 依赖项

- `secubox-app-backup` - 后端 CLI
- `luci-base` - LuCI 框架
