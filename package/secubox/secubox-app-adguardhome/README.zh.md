# SecuBox AdGuard Home

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

在 SecuBox 驱动的 OpenWrt 系统上运行的网络级广告拦截器，基于 Docker 运行，支持 DNS-over-HTTPS/TLS 和详细分析。

## 安装

```sh
opkg install secubox-app-adguardhome
```

## 配置

UCI 配置文件：`/etc/config/adguardhome`

```
config adguardhome 'main'
    option enabled '0'
    option port '3000'
```

## 使用

```sh
# 启动 / 停止服务
/etc/init.d/adguardhome start
/etc/init.d/adguardhome stop

# 控制器 CLI
adguardhomectl status
adguardhomectl install
adguardhomectl remove
```

## 文件

- `/etc/config/adguardhome` -- UCI 配置
- `/etc/init.d/adguardhome` -- init 脚本
- `/usr/sbin/adguardhomectl` -- 控制器 CLI

## 依赖

- `dockerd`
- `docker`
- `containerd`

## 许可证

Apache-2.0
