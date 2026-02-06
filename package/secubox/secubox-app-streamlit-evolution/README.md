# SecuBox Evolution Dashboard

Interactive Streamlit dashboard showing SecuBox project evolution.

## Features

- **Real-time GitHub sync**: Fetches HISTORY.md, WIP.md, TODO.md, README.md from master branch
- **Milestone tracking**: Parses and displays project milestones with dates
- **Search**: Full-text search across all project files
- **Timeline view**: Visual timeline of project evolution
- **Feature distribution**: Charts showing feature category breakdown
- **Dark cyberpunk theme**: Matches SecuBox design language

## Deployment

1. Copy `secubox_evolution.py` to `/srv/streamlit/apps/`
2. Add instance: `uci set streamlit.secubox_evolution=instance && uci set streamlit.secubox_evolution.enabled='1' && uci set streamlit.secubox_evolution.app='secubox_evolution' && uci set streamlit.secubox_evolution.port='8510' && uci commit streamlit`
3. Restart: `/etc/init.d/streamlit restart`
4. Access: `http://<device-ip>:8510`

## Dependencies

- streamlit >= 1.32.0
- pandas >= 2.0.0
- requests >= 2.31.0

## Data Sources

- GitHub: `https://raw.githubusercontent.com/gkerma/secubox-openwrt/master/.claude/`
- Auto-refresh: 5 minutes cache TTL
