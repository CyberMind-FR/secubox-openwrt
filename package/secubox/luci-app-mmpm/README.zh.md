[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI MMPM 仪表板

用于通过 MMPM（MagicMirror 包管理器）管理 MagicMirror 模块的 LuCI Web 界面。

## 安装

```bash
opkg install luci-app-mmpm
```

## 访问

LuCI > 服务 > MMPM

## 选项卡

- **仪表板** -- 服务状态和 MagicMirror 概览
- **模块** -- 搜索、安装、更新和删除 MagicMirror 模块
- **Web GUI** -- 嵌入式 MMPM Web 界面
- **设置** -- MMPM 和 MagicMirror 配置

## RPCD 方法

服务：`luci.mmpm`

## 依赖项

- `luci-base`
- `secubox-app-mmpm`

## 许可证

Apache-2.0
