# SecuBox Fabricator

🌐 **Languages:** English | [Français](README.fr.md) | [中文](README.zh.md)

Widget & Component Constructor for SecuBox platform.

## Features

7 tabs for building SecuBox components:

1. **📊 Collectors** - Stats collector builder (shell scripts with cron)
2. **🚀 Apps** - Streamlit app deployer
3. **📝 Blogs** - MetaBlogizer site management
4. **🌐 Statics** - Static HTML page generator
5. **🔌 Services** - Service exposure (Emancipate)
6. **🧩 Widgets** - HTML widget designer
7. **🪟 Embedder** - Portal page builder (embeds apps/services/blogs)

## Deployment

```bash
# Copy to router
scp app.py root@192.168.255.1:/srv/streamlit/apps/fabricator/

# Register instance
uci set streamlit.fabricator=instance
uci set streamlit.fabricator.name=fabricator
uci set streamlit.fabricator.app=fabricator
uci set streamlit.fabricator.port=8520
uci set streamlit.fabricator.enabled=1
uci commit streamlit

# Restart
/etc/init.d/streamlit restart
```

## Emancipation

```bash
streamlitctl emancipate fabricator fabric.gk2.secubox.in
```

## Access

- Local: http://192.168.255.1:8520
- External: https://fabric.gk2.secubox.in
