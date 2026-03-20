# SecuBox Cookie Tracker

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

SecuBox InterceptoR 的 HTTP Cookie 分类和跟踪工具。

## 功能特性

- **Cookie 提取** - 通过 mitmproxy 从 HTTP 流量中捕获 Cookie
- **自动分类** - 将 Cookie 分类为必要、功能性、分析、广告或跟踪类型
- **SQLite 数据库** - 支持搜索和过滤的持久化存储
- **已知跟踪器数据库** - 100+ 预配置的跟踪器域名
- **Vortex 集成** - 将被阻止的域名提供给 Vortex 防火墙
- **CLI 管理** - 完整的命令行界面用于 Cookie 管理

## 安装

```bash
opkg install secubox-cookie-tracker
```

需要 `secubox-app-mitmproxy` 进行流量拦截。

## 快速开始

```bash
# 初始化数据库
cookie-trackerctl init

# 查看状态
cookie-trackerctl status

# 列出 Cookie
cookie-trackerctl list

# 阻止跟踪域名
cookie-trackerctl block doubleclick.net
```

## CLI 命令

| 命令 | 描述 |
|------|------|
| `status [--json]` | 显示统计摘要 |
| `init [force]` | 初始化/重置数据库 |
| `reload` | 从 UCI 重新加载跟踪器规则 |
| `list [options]` | 使用过滤器列出 Cookie |
| `show <domain>` | 显示域名的 Cookie |
| `classify <domain> <name> <cat>` | 手动分类 Cookie |
| `block <domain>` | 阻止来自域名的所有 Cookie |
| `unblock <domain>` | 解除域名阻止 |
| `report [--json]` | 生成 Cookie 报告 |
| `export [file]` | 导出数据库为 CSV |
| `import <file>` | 从 TSV 导入跟踪器规则 |
| `feed-vortex` | 将被阻止的域名提供给 Vortex |
| `stats` | 详细统计信息 |

## Cookie 类别

| 类别 | 描述 | 默认操作 |
|------|------|----------|
| `essential` | 网站功能必需 | 允许 |
| `functional` | 用户偏好、设置 | 允许 |
| `analytics` | 用于网站改进的使用跟踪 | 警报 |
| `advertising` | 广告定向和重定向 | 阻止 |
| `tracking` | 跨站跟踪、指纹识别 | 阻止 |
| `unknown` | 尚未分类 | 允许 |

## mitmproxy 集成

将 addon 添加到您的 mitmproxy 配置：

```bash
# /etc/config/mitmproxy
config filtering 'filtering'
    option addon_script '/usr/lib/secubox/cookie-tracker/mitmproxy-addon.py'
```

或与主分析 addon 一起加载：

```bash
mitmdump -s /usr/lib/secubox/cookie-tracker/mitmproxy-addon.py \
         -s /srv/mitmproxy/addons/secubox_analytics.py
```

## UCI 配置

```
# /etc/config/cookie-tracker
config cookie_tracker 'main'
    option enabled '1'
    option auto_classify '1'
    option block_tracking '0'
    option block_advertising '0'

config tracker_rule 'custom'
    option pattern '_my_tracker'
    option category 'tracking'
```

## 数据库架构

```sql
CREATE TABLE cookies (
    id INTEGER PRIMARY KEY,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'unknown',
    first_seen INTEGER,
    last_seen INTEGER,
    count INTEGER DEFAULT 1,
    client_mac TEXT,
    blocked INTEGER DEFAULT 0,
    UNIQUE(domain, name)
);

CREATE TABLE tracker_domains (
    domain TEXT PRIMARY KEY,
    category TEXT,
    source TEXT
);
```

## 示例

```bash
# 列出所有跟踪 Cookie
cookie-trackerctl list --category tracking

# 列出特定域名的 Cookie
cookie-trackerctl list --domain google.com

# 生成仪表板 JSON 报告
cookie-trackerctl report --json

# 导出所有数据
cookie-trackerctl export /tmp/cookies.csv

# 阻止并同步到 Vortex
cookie-trackerctl block ads.example.com
cookie-trackerctl feed-vortex
```

## 依赖项

- secubox-app-mitmproxy（用于流量拦截）
- sqlite3-cli
- jsonfilter

## 许可证

GPL-3.0
