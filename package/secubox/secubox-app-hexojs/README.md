# SecuBox HexoJS

Self-hosted static blog generator for OpenWrt with Gitea integration.

## Features

- Hexo 8.x static site generator with Node.js 22 LTS
- CyberMind theme with dark mode and modern design
- Gitea integration for content management
- Post and page management with Markdown
- Media library for images and files
- GitHub Pages deployment support
- Preview server for local testing

Runs in LXC container with Alpine Linux.

## Installation

```bash
# Install the package
opkg install secubox-app-hexojs

# Setup container and create site
hexoctl install
hexoctl site create default

# Enable and start service
uci set hexojs.main.enabled=1
uci commit hexojs
/etc/init.d/hexojs enable
/etc/init.d/hexojs start
```

Preview at `http://<router-ip>:4000`

## Commands

### Container Management

```bash
hexoctl install           # Download and setup LXC container
hexoctl uninstall         # Remove container (keeps data)
hexoctl update            # Update Hexo and dependencies
hexoctl status            # Show service status
hexoctl shell             # Open shell in container
hexoctl logs              # View container logs
hexoctl exec <cmd>        # Execute command in container
```

### Site Management

```bash
hexoctl site create <name>   # Create new Hexo site
hexoctl site list            # List all sites
hexoctl site delete <name>   # Delete a site
```

### Content Commands

```bash
hexoctl new post "Title"     # Create new blog post
hexoctl new page "Title"     # Create new page
hexoctl new draft "Title"    # Create new draft
hexoctl publish <slug>       # Publish a draft
hexoctl list posts           # List all posts (JSON)
hexoctl list drafts          # List all drafts (JSON)
```

### Build Commands

```bash
hexoctl serve               # Start preview server (port 4000)
hexoctl build               # Generate static files
hexoctl clean               # Clean generated files
hexoctl deploy              # Deploy to configured target
```

## Gitea Integration

Sync blog content from a Gitea repository.

### Setup

```bash
# Enable Gitea integration
uci set hexojs.gitea.enabled=1
uci set hexojs.gitea.url='http://192.168.255.1:3000'
uci set hexojs.gitea.user='admin'
uci set hexojs.gitea.token='your-gitea-access-token'
uci set hexojs.gitea.content_repo='blog-content'
uci set hexojs.gitea.content_branch='main'
uci commit hexojs
```

### Commands

```bash
hexoctl gitea setup         # Configure git credentials in container
hexoctl gitea clone         # Clone content repo from Gitea
hexoctl gitea sync          # Pull latest content and sync to Hexo
hexoctl gitea status        # Show Gitea sync status (JSON)
```

### Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Gitea     │───►│   HexoJS    │───►│   Portal    │
│   Content   │    │   Build     │    │   Static    │
└─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │
  blog-content/      hexo generate      /www/blog/
   _posts/*.md         public/          index.html
```

1. Create/edit posts in Gitea repository
2. Run `hexoctl gitea sync` to pull changes
3. Run `hexoctl build` to generate static site
4. Static files available in `/srv/hexojs/site/public/`

### Content Repository Structure

```
blog-content/
├── _posts/           # Published posts
│   └── 2025-01-24-hello-world.md
├── _drafts/          # Draft posts
├── images/           # Media files
├── about/            # About page
├── portfolio/        # Portfolio page
└── services/         # Services page
```

## Configuration

Edit `/etc/config/hexojs`:

```
config hexojs 'main'
    option enabled '1'
    option http_port '4000'
    option data_path '/srv/hexojs'
    option active_site 'default'
    option memory_limit '512M'

config site 'default'
    option title 'My Blog'
    option subtitle 'Self-hosted on OpenWrt'
    option author 'Admin'
    option language 'en'
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

## Directory Structure

```
/srv/hexojs/
├── site/                    # Hexo site
│   ├── source/
│   │   ├── _posts/          # Blog posts
│   │   ├── _drafts/         # Drafts
│   │   └── images/          # Media
│   ├── themes/
│   │   └── cybermind/       # CyberMind theme
│   ├── public/              # Generated static files
│   └── _config.yml          # Hexo config
├── content/                 # Cloned Gitea content repo
├── themes/                  # Shared themes
└── media/                   # Shared media
```

## CyberMind Theme

Included dark theme with:

- Responsive design
- Dark/light mode toggle
- Orange accent color (#f97316)
- Terminal-style logo
- Categories and tags support
- Apps portfolio section

## Troubleshooting

### Container not starting

```bash
# Check container status
lxc-info -n hexojs

# View logs
hexoctl logs

# Reinstall container
hexoctl uninstall
hexoctl install
```

### Gitea clone fails

```bash
# Verify credentials
hexoctl gitea status

# Re-setup git credentials
hexoctl gitea setup

# Check token has repo access
curl -H "Authorization: token YOUR_TOKEN" \
  http://192.168.255.1:3000/api/v1/user/repos
```

### Build errors

```bash
# Clean and rebuild
hexoctl clean
hexoctl build

# Check inside container
hexoctl shell
cd /opt/hexojs/site
npm install
hexo generate --debug
```

## Integration with Metabolizer

HexoJS works with the Metabolizer CMS pipeline:

```
Streamlit CMS → Gitea → HexoJS → Portal
   (edit)      (store)  (build)  (serve)
```

See `secubox-app-metabolizer` for the full CMS experience.

## License

MIT License - CyberMind Studio 2025
