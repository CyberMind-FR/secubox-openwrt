[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox 元目录

虚拟图书馆系统，将 MetaBlogizer 站点、Streamlit 应用和其他服务聚合到按主题**虚拟书籍**组织的统一目录中。

## 概述

```
+---------------------------------------------------------------+
|                    META CATALOGER                              |
|              "SecuBox 虚拟图书馆"                               |
+---------------------------------------------------------------+
|  虚拟书籍（自动生成的集合）                                      |
|  |-- 占卜与易经                                                 |
|  |   |-- lldh360.maegia.tv (HERMES-360 神谕)                   |
|  |   +-- yijing.gk2.secubox.in                                 |
|  |-- 交互式可视化                                               |
|  |   +-- wall.maegia.tv (MAGIC-CHESS-360)                      |
|  |-- 数据与分析                                                 |
|  |   +-- control.gk2.secubox.in (SecuBox Control)              |
|  +-- 出版物与博客                                               |
|      +-- gandalf.maegia.tv                                      |
+---------------------------------------------------------------+
```

## CLI 命令

```bash
# 完整目录同步（扫描 + 索引 + 分配书籍 + 生成着陆页）
metacatalogctl sync

# 扫描特定来源
metacatalogctl scan                    # 所有来源
metacatalogctl scan metablogizer       # 仅 MetaBlogizer 站点
metacatalogctl scan streamlit          # 仅 Streamlit 应用

# 索引管理
metacatalogctl index list              # 列出所有已索引条目
metacatalogctl index show <id>         # 显示条目详情
metacatalogctl index refresh           # 重建索引

# 虚拟书籍
metacatalogctl books list              # 列出所有书籍及条目数量
metacatalogctl books show <book-id>    # 显示书籍内容

# 搜索
metacatalogctl search <query>          # 跨目录全文搜索

# 维护
metacatalogctl status                  # 显示目录统计
metacatalogctl landing                 # 仅重新生成着陆页
```

## UCI 配置

配置文件位于 `/etc/config/metacatalog`：

```uci
config metacatalog 'main'
    option enabled '1'
    option data_dir '/srv/metacatalog'
    option auto_scan_interval '3600'
    option landing_path '/www/metacatalog/index.html'

# 内容来源
config source 'metablogizer'
    option enabled '1'
    option type 'metablogizer'
    option path '/srv/metablogizer/sites'

config source 'streamlit'
    option enabled '1'
    option type 'streamlit'
    option config '/etc/config/streamlit-forge'

# 虚拟书籍定义
config book 'divination'
    option name 'Divination & I-Ching'
    option icon '🔮'
    option color '#cc00ff'
    option description '神谕工具和占卜系统'
    list keywords 'iching'
    list keywords 'oracle'
    list keywords 'divination'
    list domain_patterns 'lldh'
    list domain_patterns 'yijing'

config book 'visualization'
    option name 'Interactive Visualizations'
    option icon '🎮'
    option color '#00ff88'
    list keywords 'canvas'
    list keywords 'animation'
    list domain_patterns 'wall'
```

## 文件结构

```
/etc/config/metacatalog          # UCI 配置
/usr/sbin/metacatalogctl         # CLI 工具
/srv/metacatalog/
|-- index.json                   # 主目录索引
|-- books.json                   # 带条目的虚拟书籍
|-- entries/                     # 各条目的 JSON 文件
|   |-- lldh360-maegia-tv.json
|   +-- ...
+-- cache/                       # 扫描缓存
/www/metacatalog/
|-- index.html                   # 着陆页（道棱镜主题）
+-- api/
    |-- index.json               # API：所有条目
    +-- books.json               # API：所有书籍
```

## 默认虚拟书籍

| ID | 名称 | 图标 | 关键词 |
|----|------|------|--------|
| divination | 占卜与易经 | 🔮 | iching, oracle, hexagram, yijing, bazi |
| visualization | 交互式可视化 | 🎮 | canvas, animation, 3d, game |
| analytics | 数据与分析 | 📊 | dashboard, data, analytics, metrics |
| publications | 出版物与博客 | 📝 | blog, article, press, news |
| security | 安全工具 | 🛡️ | security, waf, firewall, crowdsec |
| media | 媒体与娱乐 | 🎬 | video, audio, streaming, media |

## 自动分配

条目根据以下内容自动分配到书籍：
- **关键词**：与条目标题、描述和提取的关键词匹配
- **域名模式**：与条目域名匹配

在 UCI 中配置规则：
```bash
uci add_list metacatalog.divination.keywords='tarot'
uci add_list metacatalog.divination.domain_patterns='tarot'
uci commit metacatalog
metacatalogctl sync
```

## Cron 集成

通过 `/etc/cron.d/metacatalog` 配置每小时自动同步：
```
0 * * * * root /usr/sbin/metacatalogctl sync --quiet >/dev/null 2>&1
```

## API 访问

着陆页和 JSON API 可通过以下地址访问：
- 着陆页：`https://secubox.in/metacatalog/`
- 条目：`https://secubox.in/metacatalog/api/index.json`
- 书籍：`https://secubox.in/metacatalog/api/books.json`

## 依赖

- `jsonfilter` - JSON 解析（libubox）
- `coreutils-stat` - 文件时间戳

## 集成

- **MetaBlogizer**：自动扫描 `/srv/metablogizer/sites/` 中已发布的站点
- **Streamlit Forge**：读取 `/etc/config/streamlit-forge` 获取应用定义
- **HAProxy**：检查 vhost 的 SSL/WAF 状态以获取暴露信息
