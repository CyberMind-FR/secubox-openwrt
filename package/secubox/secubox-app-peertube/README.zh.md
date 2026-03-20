# SecuBox PeerTube

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

在 LXC Debian 容器中运行的联邦视频流媒体平台。

## 功能特性

- **PeerTube 实例**：支持 ActivityPub 联邦的自托管视频平台
- **视频导入**：通过 yt-dlp 从 YouTube、Vimeo 和 1000 多个网站导入视频
- **多轨字幕**：自动下载和同步多种语言的字幕
- **视频分析**：转录提取和 Claude AI 分析（peertube-analyse）
- **直播流媒体**：RTMP 输入和 HLS 输出

## 组件

| 组件 | 描述 |
|------|------|
| `peertubectl` | 容器管理的主控制脚本 |
| `peertube-import` | 带字幕同步的视频导入 |
| `peertube-analyse` | 转录提取和 AI 分析 |

## 视频导入

从外部平台导入视频，自动同步字幕。

### CLI 使用方法

```bash
# 基本导入
peertube-import https://youtube.com/watch?v=xxx

# 导入多种字幕语言
peertube-import --lang fr,en,de,es https://youtube.com/watch?v=xxx

# 导入为未列出的视频
peertube-import --privacy 2 https://youtube.com/watch?v=xxx

# 导入到指定频道
peertube-import --channel 2 https://vimeo.com/xxx
```

### 选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `--lang <codes>` | 字幕语言（逗号分隔） | `fr,en` |
| `--channel <id>` | PeerTube 频道 ID | `1` |
| `--privacy <level>` | 1=公开，2=未列出，3=私密 | `1` |
| `--output <dir>` | 下载临时目录 | `/tmp/peertube-import` |
| `--peertube <url>` | PeerTube 实例 URL | 从 UCI 配置读取 |

### 门户集成

通过 SecuBox 门户 -> 智能与分析 -> 视频导入 访问

门户提供：
- 视频源 URL 输入框
- 语言选择复选框
- 隐私级别选择器
- 实时进度跟踪
- 导入视频的直接链接

### CGI 端点

```bash
# 启动导入任务
curl -X POST http://192.168.255.1/cgi-bin/peertube-import \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=xxx","languages":"fr,en"}'

# 响应：{"success": true, "job_id": "import_xxx"}

# 检查状态
curl "http://192.168.255.1/cgi-bin/peertube-import-status?job_id=import_xxx"

# 响应（进行中）：
# {"status": "downloading", "progress": 45, "job_id": "import_xxx"}

# 响应（已完成）：
# {"success": true, "video_url": "https://tube.example.com/w/uuid"}
```

## 配置

UCI 配置文件：`/etc/config/peertube`

```
config peertube 'main'
    option enabled '1'
    option data_path '/srv/peertube'

config peertube 'server'
    option hostname 'tube.example.com'
    option port '9001'
    option https '1'

config peertube 'admin'
    option username 'root'
    option password 'changeme'

config peertube 'transcoding'
    option enabled '1'
    option threads '2'
    list resolutions '480p'
    list resolutions '720p'
```

## 依赖

- `lxc`, `lxc-common` - 容器运行时
- `wget-ssl` - HTTPS 下载
- `tar`, `jsonfilter` - 归档和 JSON 处理
- `yt-dlp` - 视频下载（pip install）
- `node` - yt-dlp 的 JavaScript 运行时（opkg install）

## 支持的导入源

yt-dlp 支持 1000 多个网站，包括：
- YouTube、YouTube Music
- Vimeo
- Dailymotion
- Twitch（VODs）
- Twitter/X
- TikTok
- 以及更多...

详见：https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md

## 版本

- 包版本：1.2.0
- yt-dlp：2026.2.4（推荐）
- Node.js：20.20.0（用于 YouTube JS 运行时）
