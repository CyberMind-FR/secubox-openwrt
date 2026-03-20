# MMPM - MagicMirror Package Manager

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

基于 Web 的 MagicMirror 模块管理图形界面。提供包管理器界面，用于发现、安装和配置 MagicMirror2 模块。

## 安装

```bash
opkg install secubox-app-mmpm
```

需要先安装 MagicMirror2。

## 配置

UCI 配置文件：`/etc/config/mmpm`

```bash
uci set mmpm.main.enabled='1'
uci set mmpm.main.port='7890'
uci commit mmpm
```

## 使用方法

```bash
mmpmctl start          # 启动 MMPM 服务
mmpmctl stop           # 停止 MMPM 服务
mmpmctl status         # 显示服务状态
mmpmctl list           # 列出已安装的模块
mmpmctl search <name>  # 搜索可用模块
mmpmctl install <mod>  # 安装模块
mmpmctl remove <mod>   # 删除模块
```

## 依赖

- `secubox-app-magicmirror2`

## 许可证

Apache-2.0
