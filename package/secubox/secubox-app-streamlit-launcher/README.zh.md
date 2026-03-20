[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Streamlit Launcher

带空闲关闭和内存管理的按需 Streamlit 应用启动器。

## 概述

Streamlit Launcher 通过以下方式优化受限设备的资源使用：

- **按需启动应用** - 首次访问时启动（延迟加载）
- **停止空闲应用** - 在可配置的超时后停止（默认：30 分钟）
- **管理内存压力** - 内存不足时停止低优先级应用
- **优先级系统** - 让关键应用运行更长时间

## 架构

```
+-------------+     +--------------+     +-----------------+
|   HAProxy   |---->|  mitmproxy   |---->| Streamlit       |
|   (vhost)   |     |  (WAF+track) |     | Launcher Daemon |
+-------------+     +--------------+     +--------+--------+
                           |                      |
                    跟踪访问               启动/停止
                           |                      |
                    +------v------+         +-----v-----+
                    | /tmp/access |         |  slforge  |
                    |   (touch)   |         |  start/   |
                    +-------------+         |   stop    |
                                            +-----------+
```

## 安装

```bash
opkg install secubox-app-streamlit-launcher
```

## CLI 参考

```bash
# 显示状态
streamlit-launcherctl status

# 列出所有应用及详情
streamlit-launcherctl list

# 手动启动/停止应用
streamlit-launcherctl start <app>
streamlit-launcherctl stop <app>

# 设置应用优先级（越高 = 运行时间越长）
streamlit-launcherctl priority <app> <value>

# 设置始终运行（永不自动停止）
streamlit-launcherctl priority <app> 100 1

# 手动运行空闲检查
streamlit-launcherctl check

# 运行内存压力检查
streamlit-launcherctl check-memory
```

## 配置

编辑 `/etc/config/streamlit-launcher`：

```
config global 'global'
    # 启用 launcher 守护进程
    option enabled '1'

    # 启用按需启动（相对于始终运行）
    option on_demand '1'

    # 停止应用前的不活动分钟数
    option idle_timeout '30'

    # 空闲检查间隔秒数
    option check_interval '60'

    # 强制停止应用前的最小可用内存（MB）
    option memory_threshold '100'

    # 等待应用启动的最大秒数
    option startup_timeout '30'

# 应用优先级（越高 = 运行时间越长）
config priority 'control'
    option app 'control'
    option value '100'
    option always_on '1'

config priority 'ytdownload'
    option app 'ytdownload'
    option value '30'
```

## 优先级系统

| 优先级 | 行为 |
|--------|------|
| 100 + always_on | 永不自动停止 |
| 80-99 | 内存压力时最后停止 |
| 50（默认） | 正常优先级 |
| 1-49 | 内存压力时最先停止 |

## 与 slforge 集成

launcher 与 `slforge`（Streamlit Forge）协同工作：

- `slforge` 管理应用配置、创建和基本启动/停止
- `streamlit-launcherctl` 添加按需和空闲管理

启用按需模式时：
1. 用户访问 `https://app.example.com`
2. HAProxy 路由到 mitmproxy
3. 如果应用已停止，mitmproxy 可通过 hook 触发启动
4. Launcher 启动应用并等待就绪
5. 请求被处理
6. 记录访问
7. 空闲超时后，应用被停止

## 访问跟踪

launcher 通过 `/tmp/streamlit-access/` 中的 touch 文件跟踪应用访问：

```bash
# 跟踪访问（重置空闲计时器）
streamlit-launcherctl track <app>

# 或直接
touch /tmp/streamlit-access/<app>
```

可通过以下方式触发：
- mitmproxy 请求 hook
- HAProxy 健康检查脚本
- 解析访问日志的 cron 任务

## 内存管理

当可用内存低于阈值时：

1. 应用按优先级排序（最低优先）
2. 低优先级应用逐个停止
3. 当内存恢复到阈值以上时停止
4. 始终运行的应用永不停止

## 服务控制

```bash
# 启用/启动守护进程
/etc/init.d/streamlit-launcher enable
/etc/init.d/streamlit-launcher start

# 检查守护进程状态
/etc/init.d/streamlit-launcher status

# 查看日志
logread -e streamlit-launcher
```

## 文件

| 路径 | 描述 |
|------|------|
| `/usr/sbin/streamlit-launcherctl` | CLI 工具 |
| `/etc/config/streamlit-launcher` | UCI 配置 |
| `/etc/init.d/streamlit-launcher` | Procd init 脚本 |
| `/tmp/streamlit-access/` | 访问跟踪文件 |
| `/usr/share/streamlit-launcher/loading.html` | 加载页面模板 |

## 示例：优化低内存环境

```bash
# 设置激进的超时（10 分钟）
uci set streamlit-launcher.global.idle_timeout='10'

# 降低内存阈值（150MB 可用时触发清理）
uci set streamlit-launcher.global.memory_threshold='150'

# 让 dashboard 始终运行
streamlit-launcherctl priority dashboard 100 1

# 降低重型应用的优先级
streamlit-launcherctl priority jupyter 20
streamlit-launcherctl priority analytics 30

uci commit streamlit-launcher
/etc/init.d/streamlit-launcher restart
```
