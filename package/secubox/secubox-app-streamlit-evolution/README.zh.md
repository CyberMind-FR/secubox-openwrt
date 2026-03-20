# SecuBox Evolution Dashboard

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

展示 SecuBox 项目演进的交互式 Streamlit 仪表板。

## 功能特性

- **实时 GitHub 同步**：从 master 分支获取 HISTORY.md、WIP.md、TODO.md、README.md
- **里程碑跟踪**：解析并显示带日期的项目里程碑
- **搜索**：跨所有项目文件的全文搜索
- **时间线视图**：项目演进的可视化时间线
- **功能分布**：显示功能类别分布的图表
- **暗色赛博朋克主题**：与 SecuBox 设计语言一致

## 部署

1. 将 `secubox_evolution.py` 复制到 `/srv/streamlit/apps/`
2. 添加实例：`uci set streamlit.secubox_evolution=instance && uci set streamlit.secubox_evolution.enabled='1' && uci set streamlit.secubox_evolution.app='secubox_evolution' && uci set streamlit.secubox_evolution.port='8510' && uci commit streamlit`
3. 重启：`/etc/init.d/streamlit restart`
4. 访问：`http://<device-ip>:8510`

## 依赖

- streamlit >= 1.32.0
- pandas >= 2.0.0
- requests >= 2.31.0

## 数据源

- GitHub：`https://raw.githubusercontent.com/gkerma/secubox-openwrt/master/.claude/`
- 自动刷新：5 分钟缓存 TTL
