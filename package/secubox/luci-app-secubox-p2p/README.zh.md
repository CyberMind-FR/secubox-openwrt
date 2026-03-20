[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI SecuBox P2P Hub

SecuBox 点对点网状网络管理、节点发现和分布式服务的 LuCI Web 界面。

## 安装

```bash
opkg install luci-app-secubox-p2p
```

## 访问

LuCI > SecuBox > MirrorBox

## 选项卡

- **概览** -- P2P 网络状态摘要
- **P2P Hub** -- 中央枢纽管理和连接
- **节点** -- 已发现的节点和连接状态
- **服务** -- 跨网状网络的分布式服务
- **配置文件** -- 节点身份和配置文件配置
- **网状网络** -- 网状拓扑和路由
- **工厂** -- 设备配置和 Gitea 备份集成
- **设置** -- P2P 网络配置

## 依赖项

- `luci-base`
- `secubox-p2p`

## 许可证

Apache-2.0
