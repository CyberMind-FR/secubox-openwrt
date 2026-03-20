# LuCI Streamlit 控制面板

[English](README.md) | [Francais](README.fr.md) | 中文

用于管理 Streamlit 应用程序实例的 LuCI Web 界面，支持 Gitea 集成。

## 安装

```bash
opkg install luci-app-streamlit
```

## 访问

LuCI > 服务 > Streamlit

## 选项卡

- **仪表板** -- 运行中的实例、状态和资源使用情况
- **设置** -- 实例配置和 Gitea 仓库集成

## 功能

- 多实例 Streamlit 管理
- 从 Gitea 仓库部署应用
- 每个实例的启动/停止控制

## RPCD 方法

服务：`luci.streamlit`

## 依赖

- `luci-base`
- `secubox-app-streamlit`

## 许可证

Apache-2.0
