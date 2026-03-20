# SecuBox HexoJS

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

适用于 OpenWrt 的自托管静态博客生成器，集成 Gitea。

## 功能特性

- Hexo 8.x 静态站点生成器，搭配 Node.js 22 LTS
- CyberMind 主题，支持暗色模式和现代设计
- Gitea 集成用于内容管理
- 使用 Markdown 进行文章和页面管理
- 图片和文件的媒体库
- 支持 GitHub Pages 部署
- 本地测试预览服务器

在 Alpine Linux 的 LXC 容器中运行。

## 安装

```bash
# 安装软件包
opkg install secubox-app-hexojs

# 设置容器并创建站点
hexoctl install
hexoctl site create default

# 启用并启动服务
uci set hexojs.main.enabled=1
uci commit hexojs
/etc/init.d/hexojs enable
/etc/init.d/hexojs start
```

预览地址：`http://<路由器IP>:4000`

## 命令

### 容器管理

```bash
hexoctl install           # 下载并设置 LXC 容器
hexoctl uninstall         # 移除容器（保留数据）
hexoctl update            # 更新 Hexo 和依赖
hexoctl status            # 显示服务状态
hexoctl shell             # 在容器中打开 shell
hexoctl logs              # 查看容器日志
hexoctl exec <cmd>        # 在容器中执行命令
```

### 站点管理

```bash
hexoctl site create <名称>   # 创建新的 Hexo 站点
hexoctl site list            # 列出所有站点
hexoctl site delete <名称>   # 删除站点
```

### 内容命令

```bash
hexoctl new post "标题"     # 创建新博客文章
hexoctl new page "标题"     # 创建新页面
hexoctl new draft "标题"    # 创建新草稿
hexoctl publish <slug>       # 发布草稿
hexoctl list posts           # 列出所有文章（JSON）
hexoctl list drafts          # 列出所有草稿（JSON）
```

### 构建命令

```bash
hexoctl serve               # 启动预览服务器（端口 4000）
hexoctl build               # 生成静态文件
hexoctl clean               # 清理生成的文件
hexoctl deploy              # 部署到配置的目标
```

## Gitea 集成

从 Gitea 仓库同步博客内容。

### 设置

```bash
# 启用 Gitea 集成
uci set hexojs.gitea.enabled=1
uci set hexojs.gitea.url='http://192.168.255.1:3000'
uci set hexojs.gitea.user='admin'
uci set hexojs.gitea.token='你的gitea访问令牌'
uci set hexojs.gitea.content_repo='blog-content'
uci set hexojs.gitea.content_branch='main'
uci commit hexojs
```

### 命令

```bash
hexoctl gitea setup         # 在容器中配置 git 凭据
hexoctl gitea clone         # 从 Gitea 克隆内容仓库
hexoctl gitea sync          # 拉取最新内容并同步到 Hexo
hexoctl gitea status        # 显示 Gitea 同步状态（JSON）
```

### 工作流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Gitea     │───►│   HexoJS    │───►│   Portal    │
│   内容      │    │   构建       │    │   静态      │
└─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │
  blog-content/      hexo generate      /www/blog/
   _posts/*.md         public/          index.html
```

1. 在 Gitea 仓库中创建/编辑文章
2. 运行 `hexoctl gitea sync` 拉取更改
3. 运行 `hexoctl build` 生成静态站点
4. 静态文件位于 `/srv/hexojs/site/public/`

### 内容仓库结构

```
blog-content/
├── _posts/           # 已发布的文章
│   └── 2025-01-24-hello-world.md
├── _drafts/          # 草稿
├── images/           # 媒体文件
├── about/            # 关于页面
├── portfolio/        # 作品集页面
└── services/         # 服务页面
```

## 配置

编辑 `/etc/config/hexojs`：

```
config hexojs 'main'
    option enabled '1'
    option http_port '4000'
    option data_path '/srv/hexojs'
    option active_site 'default'
    option memory_limit '512M'

config site 'default'
    option title '我的博客'
    option subtitle '自托管于 OpenWrt'
    option author 'Admin'
    option language 'zh-CN'
    option theme 'cybermind'
    option url 'http://localhost:4000'
    option root '/'
    option per_page '10'

config deploy 'deploy'
    option type 'git'
    option repo ''
    option branch 'gh-pages'

config gitea 'gitea'
    option enabled '0'
    option url 'http://192.168.255.1:3000'
    option user 'admin'
    option token ''
    option content_repo 'blog-content'
    option content_branch 'main'
    option auto_sync '0'

config theme_config 'theme'
    option default_mode 'dark'
    option allow_toggle '1'
    option accent_color '#f97316'
```

## 目录结构

```
/srv/hexojs/
├── site/                    # Hexo 站点
│   ├── source/
│   │   ├── _posts/          # 博客文章
│   │   ├── _drafts/         # 草稿
│   │   └── images/          # 媒体
│   ├── themes/
│   │   └── cybermind/       # CyberMind 主题
│   ├── public/              # 生成的静态文件
│   └── _config.yml          # Hexo 配置
├── content/                 # 克隆的 Gitea 内容仓库
├── themes/                  # 共享主题
└── media/                   # 共享媒体
```

## CyberMind 主题

内置暗色主题，包含：

- 响应式设计
- 暗色/亮色模式切换
- 橙色强调色（#f97316）
- 终端风格 logo
- 分类和标签支持
- 应用作品集部分

## 故障排除

### 容器无法启动

```bash
# 检查容器状态
lxc-info -n hexojs

# 查看日志
hexoctl logs

# 重新安装容器
hexoctl uninstall
hexoctl install
```

### Gitea 克隆失败

```bash
# 验证凭据
hexoctl gitea status

# 重新设置 git 凭据
hexoctl gitea setup

# 检查令牌是否有仓库访问权限
curl -H "Authorization: token 你的令牌" \
  http://192.168.255.1:3000/api/v1/user/repos
```

### 构建错误

```bash
# 清理并重建
hexoctl clean
hexoctl build

# 在容器内检查
hexoctl shell
cd /opt/hexojs/site
npm install
hexo generate --debug
```

## 与 Metabolizer 集成

HexoJS 与 Metabolizer CMS 管道协同工作：

```
Streamlit CMS → Gitea → HexoJS → Portal
   (编辑)      (存储)  (构建)   (服务)
```

查看 `secubox-app-metabolizer` 获取完整的 CMS 体验。

## 许可证

MIT License - CyberMind Studio 2025
