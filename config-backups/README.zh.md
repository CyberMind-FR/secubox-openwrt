# SecuBox 配置备份

[English](README.md) | [Francais](README.fr.md) | 中文

SecuBox 路由器运行时配置的版本控制备份。

## 结构

```
config-backups/
├── bind/
│   ├── named.conf           # BIND 主配置
│   ├── named.conf.zones     # Zone 声明
│   └── zones/               # Zone 文件
│       ├── maegia.tv.zone
│       ├── ganimed.fr.zone
│       ├── secubox.in.zone
│       └── ...
```

## 从路由器同步

```bash
# 同步所有 BIND 配置
ssh root@192.168.255.1 "cat /etc/bind/named.conf.zones" > config-backups/bind/named.conf.zones
ssh root@192.168.255.1 "cat /etc/bind/zones/*.zone" # 按文件

# 同步到路由器（恢复）
scp config-backups/bind/zones/*.zone root@192.168.255.1:/etc/bind/zones/
ssh root@192.168.255.1 "/etc/init.d/named restart"
```

## 本地 Gitea 镜像

私有配置仓库：`git.maegia.tv:gandalf/secubox-configs`
