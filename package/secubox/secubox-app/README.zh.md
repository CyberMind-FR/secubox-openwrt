[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox App Store CLI

用于管理 SecuBox App Store 清单的命令行助手。

## 安装

```sh
opkg install secubox-app
```

## 使用方法

```sh
# 列出可用应用
secubox-app list

# 显示应用清单详情
secubox-app info <app-name>

# 安装应用
secubox-app install <app-name>
```

默认插件清单位于 `/usr/share/secubox/plugins/`。

## 文件

- `/usr/sbin/secubox-app` -- 主 CLI
- `/usr/share/secubox/plugins/` -- 应用清单

## 依赖项

- `jsonfilter`

## 许可证

Apache-2.0
