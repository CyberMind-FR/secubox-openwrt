# Metabolizer 博客管道

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

为 SecuBox OpenWrt 集成 Gitea、Streamlit 和 HexoJS 的完整 CMS 管道。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      METABOLIZER 管道                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   GITEA      │───►│  STREAMLIT   │───►│   HEXOJS     │───► PORTAL   │
│  │   存储       │    │   CMS 应用   │    │   生成器     │    (静态)    │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│        │                    │                    │                       │
│   从 GitHub              编辑文章           clean →                      │
│   URL 克隆              + 媒体           generate →                      │
│                                            publish                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 功能特性

- **Gitea 集成** - 镜像 GitHub 仓库，本地存储博客内容
- **Streamlit CMS** - 带实时预览的 Web markdown 编辑器
- **HexoJS 生成器** - 带赛博朋克主题的静态站点生成
- **Webhook 自动化** - git push 时自动重建
- **Portal 访问** - 静态博客服务于 `/blog/`

## 安装

```bash
opkg install secubox-app-metabolizer
metabolizerctl install
```

## 依赖

- `secubox-app-gitea` - Git 仓库服务器
- `secubox-app-streamlit` - Streamlit 应用服务器
- `secubox-app-hexojs` - 静态站点生成器
- `rsync` - 文件同步
- `git` - 版本控制

## 快速开始

### 1. 安装管道

```bash
metabolizerctl install
```

这将：
- 在 Gitea 中创建 `blog-content` 仓库
- 将 CMS 应用部署到 Streamlit
- 配置自动重建的 webhooks

### 2. 从 GitHub 镜像（可选）

```bash
metabolizerctl mirror https://github.com/user/my-blog.git
```

### 3. 访问 CMS

在浏览器中打开 `http://<路由器IP>:8501`。

### 4. 查看您的博客

导航到 `http://<路由器IP>/blog/`

## 命令

| 命令 | 描述 |
|------|------|
| `metabolizerctl install` | 设置仓库、webhooks，部署 CMS |
| `metabolizerctl uninstall` | 移除 metabolizer 设置 |
| `metabolizerctl status` | 显示管道状态（JSON） |
| `metabolizerctl mirror <url>` | 将 GitHub 仓库克隆到 Gitea |
| `metabolizerctl sync` | 从所有仓库拉取最新内容 |
| `metabolizerctl build` | 运行 Hexo clean → generate → publish |
| `metabolizerctl publish` | 将静态站点复制到 portal |
| `metabolizerctl cms deploy` | 将 CMS 应用部署到 Streamlit |
| `metabolizerctl cms update` | 拉取并重启 CMS |

## CMS 页面

### 编辑器（`/pages/1_editor.py`）

双栏 markdown 编辑器，具有：
- 实时预览
- YAML front matter 编辑器（标题、日期、分类、标签）
- 保存为草稿或直接发布
- 从 UI 触发 Hexo 构建

### 文章（`/pages/2_posts.py`）

管理您的内容：
- 查看已发布的文章和草稿
- 编辑、删除、发布/取消发布
- 从 Git 同步
- 重建博客

### 媒体（`/pages/3_media.py`）

媒体库：
- 拖放图片上传
- 带缩略图的画廊视图
- 复制 markdown 代码以嵌入
- 自动同步到博客

### 设置（`/pages/4_settings.py`）

管道控制：
- 服务状态（Gitea、Streamlit、HexoJS）
- Git 操作（pull、status、mirror）
- 构建管道（clean、generate、publish）
- Portal 配置

## 配置

UCI 配置位于 `/etc/config/metabolizer`：

```
config metabolizer 'main'
    option enabled '1'
    option gitea_url 'http://127.0.0.1:3000'
    option webhook_port '8088'

config content 'content'
    option repo_name 'blog-content'
    option repo_path '/srv/metabolizer/content'

config hexo 'hexo'
    option source_path '/srv/hexojs/site/source/_posts'
    option public_path '/srv/hexojs/site/public'
    option portal_path '/www/blog'
    option auto_publish '1'

config portal 'portal'
    option enabled '1'
    option url_path '/blog'
```

## 数据流

```
1. 作者在 Streamlit CMS 中写文章
         │
         ▼
2. CMS commit + push 到 Gitea
         │
         ▼
3. Gitea webhook 触发 metabolizer-webhook
         │
         ▼
4. Webhook 运行：sync → build → publish
         │
         ├─► git pull 内容仓库
         ├─► rsync 文章到 Hexo source
         ├─► hexoctl clean
         ├─► hexoctl generate
         └─► rsync public/ 到 /www/blog/
                  │
                  ▼
5. 博客可在 http://路由器/blog/ 访问
```

## 目录结构

```
/srv/metabolizer/
├── content/              # 博客内容 git 仓库
│   ├── _posts/          # 已发布的 markdown 文件
│   ├── _drafts/         # 草稿
│   └── images/          # 媒体文件

/srv/hexojs/site/
├── source/_posts/       # Hexo source（从 content 同步）
└── public/              # 生成的静态站点

/www/blog/               # Portal 静态文件（已发布）
```

## Webhook 集成

Webhook 监听器运行在端口 8088（可配置），处理：

- **内容仓库 push** → Sync + Build + Publish
- **CMS 仓库 push** → 更新 Streamlit 应用

Webhook URL：`http://<路由器IP>:8088/webhook`

## 故障排除

### 检查服务状态

```bash
metabolizerctl status
```

### 查看日志

```bash
logread | grep metabolizer
```

### 手动重建

```bash
metabolizerctl sync
metabolizerctl build
```

### 重置管道

```bash
metabolizerctl uninstall
metabolizerctl install
```

## 许可证

MIT License - CyberMind Studio
