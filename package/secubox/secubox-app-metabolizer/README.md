# Metabolizer Blog Pipeline

A full CMS pipeline integrating Gitea, Streamlit, and HexoJS for SecuBox OpenWrt.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      METABOLIZER PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   GITEA      │───►│  STREAMLIT   │───►│   HEXOJS     │───► PORTAL   │
│  │   Storage    │    │   CMS App    │    │   Generator  │    (static)  │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│        │                    │                    │                       │
│   Clone from           Edit posts           clean →                      │
│   GitHub URL           + media           generate →                      │
│                                            publish                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

- **Gitea Integration** - Mirror GitHub repos, store blog content locally
- **Streamlit CMS** - Web-based markdown editor with live preview
- **HexoJS Generator** - Static site generation with cyberpunk theme
- **Webhook Automation** - Auto-rebuild on git push
- **Portal Access** - Static blog served at `/blog/`

## Installation

```bash
opkg install secubox-app-metabolizer
metabolizerctl install
```

## Dependencies

- `secubox-app-gitea` - Git repository server
- `secubox-app-streamlit` - Streamlit application server
- `secubox-app-hexojs` - Static site generator
- `rsync` - File synchronization
- `git` - Version control

## Quick Start

### 1. Install the Pipeline

```bash
metabolizerctl install
```

This will:
- Create `blog-content` repo in Gitea
- Deploy CMS app to Streamlit
- Configure webhooks for auto-rebuild

### 2. Mirror from GitHub (Optional)

```bash
metabolizerctl mirror https://github.com/user/my-blog.git
```

### 3. Access the CMS

Open `http://<router-ip>:8501` in your browser.

### 4. View Your Blog

Navigate to `http://<router-ip>/blog/`

## Commands

| Command | Description |
|---------|-------------|
| `metabolizerctl install` | Setup repos, webhooks, deploy CMS |
| `metabolizerctl uninstall` | Remove metabolizer setup |
| `metabolizerctl status` | Show pipeline status (JSON) |
| `metabolizerctl mirror <url>` | Clone GitHub repo to Gitea |
| `metabolizerctl sync` | Pull latest from all repos |
| `metabolizerctl build` | Run Hexo clean → generate → publish |
| `metabolizerctl publish` | Copy static site to portal |
| `metabolizerctl cms deploy` | Deploy CMS app to Streamlit |
| `metabolizerctl cms update` | Pull and restart CMS |

## CMS Pages

### Editor (`/pages/1_editor.py`)

Two-column markdown editor with:
- Live preview
- YAML front matter editor (title, date, categories, tags)
- Save as draft or publish directly
- Trigger Hexo build from UI

### Posts (`/pages/2_posts.py`)

Manage your content:
- View published posts and drafts
- Edit, delete, publish/unpublish
- Sync from Git
- Rebuild blog

### Media (`/pages/3_media.py`)

Media library:
- Drag-and-drop image upload
- Gallery view with thumbnails
- Copy markdown code for embedding
- Auto-sync to blog

### Settings (`/pages/4_settings.py`)

Pipeline controls:
- Service status (Gitea, Streamlit, HexoJS)
- Git operations (pull, status, mirror)
- Build pipeline (clean, generate, publish)
- Portal configuration

## Configuration

UCI config at `/etc/config/metabolizer`:

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

## Data Flow

```
1. Author writes post in Streamlit CMS
         │
         ▼
2. CMS commits + pushes to Gitea
         │
         ▼
3. Gitea webhook triggers metabolizer-webhook
         │
         ▼
4. Webhook runs: sync → build → publish
         │
         ├─► git pull content repo
         ├─► rsync posts to Hexo source
         ├─► hexoctl clean
         ├─► hexoctl generate
         └─► rsync public/ to /www/blog/
                  │
                  ▼
5. Blog accessible at http://router/blog/
```

## Directory Structure

```
/srv/metabolizer/
├── content/              # Blog content git repo
│   ├── _posts/          # Published markdown files
│   ├── _drafts/         # Draft posts
│   └── images/          # Media files

/srv/hexojs/site/
├── source/_posts/       # Hexo source (synced from content)
└── public/              # Generated static site

/www/blog/               # Portal static files (published)
```

## Webhook Integration

The webhook listener runs on port 8088 (configurable) and handles:

- **Content repo push** → Sync + Build + Publish
- **CMS repo push** → Update Streamlit app

Webhook URL: `http://<router-ip>:8088/webhook`

## Troubleshooting

### Check service status

```bash
metabolizerctl status
```

### View logs

```bash
logread | grep metabolizer
```

### Manual rebuild

```bash
metabolizerctl sync
metabolizerctl build
```

### Reset pipeline

```bash
metabolizerctl uninstall
metabolizerctl install
```

## License

MIT License - CyberMind Studio
