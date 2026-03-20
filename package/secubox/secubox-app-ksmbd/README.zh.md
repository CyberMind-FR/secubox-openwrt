# SecuBox ksmbd Mesh Media Server

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

用于 mesh 媒体分发的内核级 SMB3 文件服务器。

## 快速开始

```bash
# 启用媒体服务器
ksmbdctl enable

# 检查状态
ksmbdctl status

# 添加自定义共享
ksmbdctl add-share "Movies" /srv/movies --guest --readonly

# 添加认证用户
ksmbdctl add-user admin

# 注册到 mesh 以便发现
ksmbdctl mesh-register
```

## 默认共享

| 共享 | 路径 | 访问权限 |
|------|------|---------|
| Media | /srv/media | 访客读写 |
| Jellyfin | /srv/jellyfin/media | 访客只读 |
| Lyrion | /srv/lyrion/music | 访客只读 |
| Backup | /srv/backup | 认证读写 |

## 网络访问

- **macOS/Linux**：`smb://192.168.255.1/`
- **Windows**：`\\192.168.255.1\`

## 集成

- **mDNS**：通过 Avahi 自动宣布（ksmbd-avahi-service）
- **P2P Mesh**：`ksmbdctl mesh-register` 用于 mesh 发现
- **smbfs**：使用 `smbfsctl` 挂载远程共享
