[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox PhotoPrism

自托管的 Google Photos 替代方案，具有 AI 驱动的功能，在 LXC 容器中运行。

## 功能特性

- **AI 人脸识别** - 自动检测和分组人脸
- **物体检测** - 按物体、场景、颜色搜索照片
- **地点/地图** - 在世界地图上查看照片
- **全文搜索** - 搜索所有元数据
- **相册和分享** - 组织和分享收藏
- **RAW 支持** - 处理相机 RAW 文件
- **视频播放** - 带转码的视频流

## 快速开始

```bash
# 安装 PhotoPrism（创建 LXC 容器）
photoprismctl install

# 启动服务
/etc/init.d/photoprism start

# 访问相册
http://192.168.255.1:2342
```

## CLI 命令

| 命令 | 描述 |
|------|------|
| `install` | 创建带 PhotoPrism 的 LXC 容器 |
| `uninstall` | 删除容器（保留照片） |
| `start/stop/restart` | 服务生命周期 |
| `status` | RPCD 的 JSON 状态 |
| `logs [N]` | 显示最后 N 行日志 |
| `shell` | 打开容器 shell |
| `index` | 触发照片索引 |
| `import` | 从收件箱文件夹导入 |
| `passwd [pass]` | 重置管理员密码 |
| `backup` | 创建数据库备份 |
| `configure-haproxy <domain>` | 设置 HAProxy + SSL |
| `emancipate <domain>` | 完整公开暴露 |

## 照片管理

### 添加照片

1. **直接复制**：将文件复制到 `/srv/photoprism/originals/`
2. **导入收件箱**：复制到 `/srv/photoprism/import/`，运行 `photoprismctl import`
3. **WebDAV**：在 PhotoPrism 设置中启用 WebDAV

### 触发索引

添加照片后，运行索引：

```bash
photoprismctl index
```

## 公开暴露

使用 HAProxy + SSL 将相册暴露到互联网：

```bash
photoprismctl emancipate photos.example.com
```

这将配置：
- 带 Let's Encrypt SSL 的 HAProxy vhost
- mitmproxy WAF 路由
- DNS 记录（如果 dnsctl 可用）

## 配置

UCI 配置位于 `/etc/config/photoprism`：

```
config photoprism 'main'
    option enabled '1'
    option http_port '2342'
    option memory_limit '2G'

config photoprism 'features'
    option face_recognition '1'
    option object_detection '1'
    option places '1'
```

## 资源要求

- **内存**：推荐 2GB（最低 1GB）
- **存储**：容器约 500MB + 您的照片
- **CPU**：AI 索引是 CPU 密集型的

## LuCI 仪表板

访问路径：服务 > PhotoPrism

功能：
- 状态卡片（照片、视频、存储）
- 启动/停止/索引/导入按钮
- AI 功能开关
- 公开暴露表单

## 数据路径

| 路径 | 内容 |
|------|------|
| `/srv/photoprism/originals` | 您的照片和视频 |
| `/srv/photoprism/storage` | 缓存、缩略图、数据库 |
| `/srv/photoprism/import` | 上传收件箱 |

## 安全

- 流量通过 mitmproxy WAF（无绕过）
- 管理员密码存储在 UCI 中
- 容器以有限权限运行
