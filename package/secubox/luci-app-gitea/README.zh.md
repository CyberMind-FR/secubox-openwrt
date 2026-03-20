# LuCI Gitea 控制面板

[English](README.md) | [Francais](README.fr.md) | 中文

Gitea Git 托管服务管理控制面板。

## 安装

```bash
opkg install luci-app-gitea
```

## 访问

LuCI 菜单：**服务 -> Gitea**

## 选项卡

- **概览** -- 服务状态、容器健康状况、存储使用情况
- **仓库** -- 浏览和创建 Git 仓库
- **用户** -- 管理用户和管理员账户
- **设置** -- HTTP/SSH 端口、域名、数据路径、内存限制、注册策略

## RPCD 方法

后端：`luci.gitea`

| 方法 | 描述 |
|------|------|
| `get_status` | 服务和容器状态 |
| `get_stats` | 仓库和用户统计 |
| `get_config` | 获取 Gitea 配置 |
| `save_config` | 保存配置 |
| `start` | 启动 Gitea |
| `stop` | 停止 Gitea |
| `restart` | 重启 Gitea |
| `install` | 安装 Gitea 容器 |
| `uninstall` | 删除 Gitea 容器 |
| `update` | 更新 Gitea 到最新版本 |
| `get_logs` | 获取服务日志 |
| `list_repos` | 列出所有仓库 |
| `get_repo` | 获取仓库详情 |
| `list_users` | 列出所有用户 |
| `create_admin` | 创建管理员账户 |
| `create_user` | 创建用户账户 |
| `generate_token` | 生成 API 访问令牌 |
| `create_repo` | 创建新仓库 |
| `create_backup` | 创建数据备份 |
| `list_backups` | 列出可用备份 |
| `restore_backup` | 从备份恢复 |
| `get_install_progress` | 检查安装进度 |

## 依赖

- `luci-base`
- `secubox-app-gitea`

## 许可证

Apache-2.0
