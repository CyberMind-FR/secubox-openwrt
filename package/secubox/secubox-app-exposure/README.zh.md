[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox 服务暴露管理器

用于管理服务暴露的统一后端：端口冲突检测、Tor 隐藏服务和 HAProxy SSL 反向代理配置。

## 安装

```sh
opkg install secubox-app-exposure
```

## 配置

UCI 配置文件：`/etc/config/secubox-exposure`

```
config exposure 'main'
    option enabled '1'
```

## 使用方法

```sh
# 检查端口冲突
secubox-exposure check-ports

# 管理 Tor 隐藏服务
secubox-exposure tor-add <service>
secubox-exposure tor-remove <service>

# 管理 HAProxy 反向代理条目
secubox-exposure haproxy-add <service>
secubox-exposure haproxy-remove <service>
```

## 文件

- `/etc/config/secubox-exposure` -- UCI 配置
- `/usr/sbin/secubox-exposure` -- 主 CLI

## 依赖

- `secubox-core`

## 许可证

MIT
