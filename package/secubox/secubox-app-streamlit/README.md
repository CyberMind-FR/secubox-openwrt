# SecuBox Streamlit Platform

Multi-instance Streamlit hosting platform for OpenWrt with LXC containers and Gitea integration.

## Features

- **Multi-instance support**: Run multiple Streamlit apps on different ports
- **Folder-based apps**: Each app in its own directory with dependencies
- **Gitea integration**: Clone and sync apps directly from Gitea repositories
- **LXC isolation**: Apps run in isolated Alpine Linux container
- **Auto-dependency install**: `requirements.txt` processed automatically

## Quick Start

### 1. Install & Enable

```bash
opkg install secubox-app-streamlit
/etc/init.d/streamlit enable
streamlitctl install
```

### 2. Create Your First App

```bash
streamlitctl app create myapp
streamlitctl instance add myapp 8502
/etc/init.d/streamlit restart
```

Access at: `http://<device-ip>:8502`

## Deploy from Gitea

The platform integrates with Gitea for source-controlled app deployment.

### Setup Gitea Credentials

```bash
# Configure Gitea connection
uci set streamlit.gitea.enabled=1
uci set streamlit.gitea.url='http://192.168.255.1:3000'
uci set streamlit.gitea.user='admin'
uci set streamlit.gitea.token='your-access-token'
uci commit streamlit

# Store git credentials in container
streamlitctl gitea setup
```

### Clone App from Gitea Repository

**Method 1: Using streamlitctl (recommended)**

```bash
# Clone using repo shorthand (user/repo)
streamlitctl gitea clone yijing CyberMood/yijing-oracle

# Add instance on port
streamlitctl instance add yijing 8505

# Restart to apply
/etc/init.d/streamlit restart
```

**Method 2: Manual Clone + UCI Config**

```bash
# Clone directly to apps directory
git clone http://192.168.255.1:3000/CyberMood/yijing-oracle.git /srv/streamlit/apps/yijing

# Register in UCI
uci set streamlit.yijing=app
uci set streamlit.yijing.name='Yijing Oracle'
uci set streamlit.yijing.path='yijing/app.py'
uci set streamlit.yijing.enabled='1'
uci set streamlit.yijing.port='8505'
uci commit streamlit

# Add instance and restart
streamlitctl instance add yijing 8505
/etc/init.d/streamlit restart
```

### Update App from Gitea

```bash
# Pull latest changes
streamlitctl gitea pull yijing

# Restart to apply changes
/etc/init.d/streamlit restart
```

## App Folder Structure

Each app lives in `/srv/streamlit/apps/<appname>/`:

```
/srv/streamlit/apps/myapp/
├── app.py              # Main entry point (or main.py, <appname>.py)
├── requirements.txt    # Python dependencies (auto-installed)
├── .streamlit/         # Optional Streamlit config
│   └── config.toml
└── ...                 # Other files (pages/, data/, etc.)
```

**Main file detection order**: `app.py` > `main.py` > `<appname>.py` > first `.py` file

## CLI Reference

### Container Management

```bash
streamlitctl install      # Setup LXC container
streamlitctl uninstall    # Remove container (keeps apps)
streamlitctl update       # Update Streamlit version
streamlitctl status       # Show platform status
streamlitctl logs [app]   # View logs
streamlitctl shell        # Open container shell
```

### App Management

```bash
streamlitctl app list                    # List all apps
streamlitctl app create <name>           # Create new app folder
streamlitctl app delete <name>           # Delete app
streamlitctl app deploy <name> <path>    # Deploy from path/archive
```

### Instance Management

```bash
streamlitctl instance list               # List instances
streamlitctl instance add <app> <port>   # Add instance
streamlitctl instance remove <name>      # Remove instance
streamlitctl instance start <name>       # Start single instance
streamlitctl instance stop <name>        # Stop single instance
```

### Gitea Integration

```bash
streamlitctl gitea setup                 # Configure git credentials
streamlitctl gitea clone <name> <repo>   # Clone from Gitea
streamlitctl gitea pull <name>           # Pull latest changes
```

## UCI Configuration

Main config: `/etc/config/streamlit`

```
config streamlit 'main'
    option enabled '1'
    option http_port '8501'
    option data_path '/srv/streamlit'
    option memory_limit '512M'

config streamlit 'gitea'
    option enabled '1'
    option url 'http://192.168.255.1:3000'
    option user 'admin'
    option token 'your-token'

config app 'myapp'
    option name 'My App'
    option enabled '1'
    option repo 'user/myapp'

config instance 'myapp'
    option app 'myapp'
    option port '8502'
    option enabled '1'
```

## Example: Complete Gitea Workflow

```bash
# 1. Create repo in Gitea with your Streamlit app
#    - app.py (main file)
#    - requirements.txt (dependencies)

# 2. Configure streamlit platform
uci set streamlit.gitea.enabled=1
uci set streamlit.gitea.url='http://192.168.255.1:3000'
uci set streamlit.gitea.user='admin'
uci set streamlit.gitea.token='abc123'
uci commit streamlit

# 3. Clone and deploy
streamlitctl gitea setup
streamlitctl gitea clone myapp admin/my-streamlit-app
streamlitctl instance add myapp 8502
/etc/init.d/streamlit restart

# 4. Access app
curl http://192.168.255.1:8502

# 5. Update from Gitea when code changes
streamlitctl gitea pull myapp
/etc/init.d/streamlit restart
```

## HAProxy Integration

To expose Streamlit apps via HAProxy vhost:

```bash
# Add backend for app
uci add haproxy backend
uci set haproxy.@backend[-1].name='streamlit_myapp'
uci set haproxy.@backend[-1].mode='http'
uci add_list haproxy.@backend[-1].server='myapp 192.168.255.1:8502'
uci commit haproxy

# Add vhost
uci add haproxy vhost
uci set haproxy.@vhost[-1].name='myapp_vhost'
uci set haproxy.@vhost[-1].domain='myapp.example.com'
uci set haproxy.@vhost[-1].backend='streamlit_myapp'
uci set haproxy.@vhost[-1].ssl='1'
uci commit haproxy

/etc/init.d/haproxy restart
```

## Troubleshooting

**Container won't start:**
```bash
streamlitctl status
lxc-info -n streamlit
```

**App not loading:**
```bash
streamlitctl logs myapp
streamlitctl shell
# Inside container:
cd /srv/apps/myapp && streamlit run app.py
```

**Git clone fails:**
```bash
# Check credentials
streamlitctl gitea setup
# Test manually
git clone http://admin:token@192.168.255.1:3000/user/repo.git /tmp/test
```

## License

Copyright (C) 2025 CyberMind.fr
