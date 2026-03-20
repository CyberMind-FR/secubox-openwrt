# LuCI PicoBrew 控制面板

[English](README.md) | [Francais](README.fr.md) | 中文

用于管理 PicoBrew 酿造控制器的 LuCI Web 界面 -- 配方和会话监控。

## 安装

```bash
opkg install luci-app-picobrew
```

## 访问

LuCI > 服务 > PicoBrew

## 选项卡

- **仪表板** -- 酿造会话状态、配方概览和控制器状态
- **设置** -- PicoBrew 服务配置

## RPCD 方法

服务：`luci.picobrew`

## 依赖

- `luci-base`
- `secubox-app-picobrew`

## 许可证

Apache-2.0
