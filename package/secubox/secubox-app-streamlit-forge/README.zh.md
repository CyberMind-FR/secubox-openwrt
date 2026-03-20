[English](README.md) | [Francais](README.fr.md) | 中文

# Streamlit Forge

SecuBox 的 Streamlit 应用发布平台。

## 概述

Streamlit Forge 是一个用于创建、管理和发布 Streamlit 应用的综合平台。从模板创建应用、管理实例、通过 HAProxy 使用 SSL 暴露服务，并发布到 SecuBox mesh 目录。

## 功能特性

- **应用模板** - Basic、Dashboard、Data-Viewer 入门模板
- **实例管理** - 启动、停止、重启应用实例
- **端口分配** - 自动端口分配
- **HAProxy 集成** - 一条命令完成 vhost + SSL 暴露
- **Mesh 发布** - 在 SecuBox mesh 网络中共享应用
- **UCI 配置** - 持久化应用设置

## 安装

```bash
opkg install secubox-app-streamlit-forge
```

## CLI 使用方法

```bash
# 应用管理
slforge create <name> [options]
  --from-template <tpl>   # 使用模板 (basic, dashboard, data-viewer)
  --from-upload <zip>     # 从 ZIP 文件创建
  --from-git <url>        # 从 Git 仓库克隆

slforge list              # 列出所有应用
slforge info <app>        # 显示应用详情
slforge delete <app>      # 删除应用

# 实例控制
slforge start <app>       # 启动应用实例
slforge stop <app>        # 停止应用实例
slforge restart <app>     # 重启应用
slforge status [app]      # 显示状态
slforge logs <app> [-f]   # 查看日志

# 配置
slforge config <app> list         # 列出配置
slforge config <app> get <key>    # 获取值
slforge config <app> set <k> <v>  # 设置值

# 发布
slforge expose <app> [--domain <d>]  # 创建 vhost + SSL
slforge hide <app>                   # 移除公共访问
slforge publish <app>                # 添加到 mesh 目录
slforge unpublish <app>              # 从 mesh 移除

# Launcher 集成（按需启动）
slforge launcher status              # 显示 launcher 状态
slforge launcher priority <app> <n>  # 设置应用优先级 (1-100)
slforge launcher always-on <app>     # 标记为始终运行

# 模板
slforge templates         # 列出可用模板
```

## 示例工作流

```bash
# 1. 从 dashboard 模板创建应用
slforge create mydashboard --from-template dashboard

# 2. 启动应用
slforge start mydashboard
# URL: http://192.168.255.1:8501

# 3. 使用 SSL 暴露
slforge expose mydashboard --domain mydashboard.gk2.secubox.in

# 4. 发布到 mesh 目录
slforge publish mydashboard
```

## 模板

### Basic
带侧边栏和两列布局的最小 Streamlit 应用。

### Dashboard
多页面仪表板，包含：
- 带增量指示器的指标卡片
- 折线图和面积图
- 带 CSV 导出的数据表
- 设置页面

### Data-Viewer
CSV/Excel 数据浏览器，包含：
- 文件上传（CSV、XLSX）
- 动态列过滤
- 直方图和散点图
- 统计摘要
- 相关性矩阵

## 配置

UCI 配置：`/etc/config/streamlit-forge`

```
config forge 'main'
    option enabled '1'
    option gitea_url 'http://127.0.0.1:3000'
    option gitea_org 'streamlit-apps'
    option apps_dir '/srv/streamlit/apps'
    option previews_dir '/srv/streamlit/previews'
    option base_domain 'apps.secubox.in'
    option default_port_start '8501'
    option default_memory '512M'

config app 'myapp'
    option name 'myapp'
    option enabled '1'
    option port '8501'
    option entrypoint 'app.py'
    option memory '512M'
    option domain 'myapp.gk2.secubox.in'
```

## 应用目录结构

```
/srv/streamlit/apps/<app>/
|-- src/                  # 应用源代码
|   |-- app.py           # Streamlit 主入口
|   |-- requirements.txt # Python 依赖
|   +-- ...
|-- data/                # 持久化数据
+-- config.json          # 运行时配置
```

## LuCI 界面

安装 `luci-app-streamlit-forge` 获取 **服务 > Streamlit Forge** 的 Web 界面。

功能：
- 状态仪表板（运行中/总应用数、LXC 状态）
- 带模板选择的创建应用对话框
- 应用表格，支持启动/停止/打开/暴露/发布/删除
- 自动刷新轮询

## 运行时

应用在 `streamlit` LXC 容器内运行：
- 应用挂载在容器内的 `/srv/apps/`
- 预装 Streamlit 的 Python virtualenv
- 端口转发到主机网络

## 依赖

- python3, python3-pip
- lxc, lxc-common
- jsonfilter

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/streamlit-forge` | UCI 配置 |
| `/usr/sbin/slforge` | CLI 工具 |
| `/srv/streamlit/apps/` | 应用源目录 |
| `/srv/streamlit/previews/` | 生成的预览 |
| `/usr/share/streamlit-forge/templates/` | 应用模板 |
| `/var/run/streamlit-*.pid` | PID 文件 |
| `/var/log/streamlit-*.log` | 应用日志 |

## Mesh 目录清单

发布的应用会在 `/usr/share/secubox/plugins/catalog/` 创建清单：

```json
{
  "id": "streamlit-myapp",
  "name": "myapp",
  "type": "streamlit-app",
  "version": "1.0.0",
  "category": "apps",
  "runtime": "streamlit",
  "actions": {
    "start": "slforge start myapp",
    "stop": "slforge stop myapp"
  }
}
```

## 按需 Launcher

安装 `secubox-app-streamlit-launcher` 进行资源优化：

- **延迟加载** - 应用仅在首次访问时启动
- **空闲关闭** - 在可配置的超时后停止应用（默认：30 分钟）
- **内存管理** - 内存不足时强制停止低优先级应用
- **优先级系统** - 让关键应用运行更长时间

### Launcher 命令

```bash
# 检查 launcher 状态
slforge launcher status

# 设置应用优先级（越高 = 运行时间越长，最大 100）
slforge launcher priority myapp 75

# 标记为始终运行（永不自动停止）
slforge launcher always-on dashboard
```

### 优先级级别

| 优先级 | 行为 |
|--------|------|
| 100 + always_on | 永不自动停止 |
| 80-99 | 内存压力时最后停止 |
| 50（默认） | 正常优先级 |
| 1-49 | 内存压力时最先停止 |

### 工作原理

1. 用户访问 `https://app.example.com`
2. 如果应用已停止，launcher 按需启动
3. 记录应用访问时间
4. 空闲超时后，应用自动停止
5. 内存压力触发低优先级应用关闭

完整配置请参阅 `secubox-app-streamlit-launcher` README。

## 模块清单 (NFO)

应用可以包含 `README.nfo` 清单文件，包含以下元数据：
- **身份** - 名称、版本、作者、许可证
- **分类** - 类别、关键词、标签
- **运行时** - 端口、内存、依赖
- **动态** - 用于生成内容集成的 AI 上下文

### NFO 命令

```bash
# 为现有应用生成 README.nfo
slforge nfo init myapp

# 查看 NFO 摘要
slforge nfo info myapp

# 编辑清单
slforge nfo edit myapp

# 验证清单
slforge nfo validate myapp

# 导出为 JSON（用于 API）
slforge nfo json myapp

# 从带 NFO 的目录安装应用
slforge nfo install /path/to/myapp
```

### NFO 文件结构

```nfo
[identity]
id=myapp
name=My Application
version=1.0.0
author=CyberMind

[description]
short=系统指标仪表板
long=<<EOF
多行详细描述...
EOF

[tags]
category=administration
keywords=dashboard,monitoring,metrics

[runtime]
type=streamlit
port=8501
memory=512M

[dynamics]
prompt_context=<<EOF
此应用显示系统指标。
用户可以请求图表或数据导出。
EOF
capabilities=data-visualization,export
input_types=api,json
output_types=charts,tables,csv
```

### 捆绑安装器

应用可以包含读取 NFO 的 `install.sh`：

```bash
# 从目录安装
cd /path/to/myapp
./install.sh

# 或使用 slforge
slforge nfo install /path/to/myapp
```

完整规范请参阅 `/usr/share/streamlit-forge/NFO-SPEC.md`。

### 生成式 AI 集成

`[dynamics]` 部分为 AI 助手提供上下文：

```nfo
[dynamics]
prompt_context=<<EOF
此应用是数据可视化仪表板。
它可以显示图表、表格并导出数据。
可用数据：CPU、内存、网络指标。
EOF

capabilities=data-visualization,real-time-updates,export
input_types=json,api,prometheus
output_types=charts,tables,csv,pdf
```

AI 系统可以读取此上下文以了解应用的功能以及如何协助用户。

## 文件位置

| 路径 | 描述 |
|------|------|
| `/etc/config/streamlit-forge` | UCI 配置 |
| `/usr/sbin/slforge` | CLI 工具 |
| `/srv/streamlit/apps/` | 应用源目录 |
| `/srv/streamlit/apps/<app>/README.nfo` | 应用清单 |
| `/srv/streamlit/previews/` | 生成的预览 |
| `/usr/share/streamlit-forge/templates/` | 应用模板 |
| `/usr/share/streamlit-forge/lib/nfo-parser.sh` | NFO 解析器库 |
| `/usr/share/streamlit-forge/nfo-template.nfo` | NFO 模板 |
| `/usr/share/streamlit-forge/install.sh` | 捆绑安装器 |
| `/var/run/streamlit-*.pid` | PID 文件 |
| `/var/log/streamlit-*.log` | 应用日志 |
