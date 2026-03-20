# SecuBox CDN 缓存

[English](README.md) | [Francais](README.fr.md) | 中文

**版本：** 0.5.0
**状态：** 活跃

SecuBox 的缓存代理，通过本地缓存频繁访问的内容来减少带宽使用。基于 nginx 构建，针对不同内容类型具有智能缓存策略。

## 功能

- **透明缓存代理** - 自动缓存 HTTP 内容
- **基于策略的缓存** - 针对 Windows 更新、Linux 仓库、Android 应用、Steam 游戏的不同规则
- **带宽节省** - 减少所有 LAN 客户端的重复下载
- **缓存管理** - 按域名清除、过期旧内容、预加载 URL
- **实时统计** - 命中率、节省的带宽、缓存最多的域名
- **LuCI 仪表板** - 用于配置和监控的完整 Web 界面

## 架构

```
LAN 客户端
     |
     v
[CDN 缓存代理 :3128]  <-- nginx 缓存代理
     |
     v
  互联网
```

## 快速开始

```bash
# 启用并启动
uci set cdn-cache.main.enabled=1
uci commit cdn-cache
/etc/init.d/cdn-cache start

# 配置客户端使用代理：192.168.255.1:3128
```

## 配置

### UCI 配置

```
/etc/config/cdn-cache

config cdn_cache 'main'
    option enabled '1'
    option cache_dir '/var/cache/cdn'
    option cache_size '1024'          # 最大缓存大小（MB）
    option max_object_size '512'      # 单个对象最大大小（MB）
    option cache_valid '1440'         # 默认缓存有效期（分钟）
    option listen_port '3128'         # 代理监听端口
    option transparent '0'            # 透明代理模式
    option log_level 'warn'

# 特定内容类型的缓存策略
config cache_policy 'windows_update'
    option name 'Windows Update'
    option domains 'windowsupdate.com download.microsoft.com'
    option extensions 'exe msu cab msi'
    option cache_time '10080'         # 7 天
    option max_size '2048'
    option priority '10'

config cache_policy 'linux_repos'
    option name 'Linux Repositories'
    option domains 'archive.ubuntu.com deb.debian.org mirrors.kernel.org'
    option extensions 'deb rpm pkg.tar.zst'
    option cache_time '4320'          # 3 天
    option max_size '1024'
    option priority '10'

# 排除项（永不缓存）
config exclusion 'banking'
    option name 'Banking Sites'
    option domains 'bank.com paypal.com'
    option reason 'Security sensitive'
```

### 客户端配置

#### 手动代理
在客户端设备上设置 HTTP 代理：
- **代理地址：** 192.168.255.1
- **代理端口：** 3128

#### 透明模式
启用透明模式以自动重定向 HTTP 流量：
```bash
uci set cdn-cache.main.transparent=1
uci commit cdn-cache
/etc/init.d/cdn-cache restart
```

## RPCD API

### 状态和统计

| 方法 | 参数 | 描述 |
|------|------|------|
| `status` | - | 服务状态、缓存信息、运行时间 |
| `stats` | - | 命中/未命中计数、节省的带宽 |
| `cache_list` | - | 列出缓存项（前 100 个） |
| `top_domains` | - | 按缓存使用排名的域名 |
| `cache_size` | - | 已用/最大/空闲缓存空间 |
| `bandwidth_savings` | period | 一段时间内的节省（24h/7d/30d） |
| `hit_ratio` | period | 一段时间内的命中率 |
| `logs` | count | 最近的日志条目 |

### 缓存管理

| 方法 | 参数 | 描述 |
|------|------|------|
| `purge_cache` | - | 清除全部缓存 |
| `purge_domain` | domain | 清除特定域名的缓存 |
| `purge_expired` | - | 删除过期条目 |
| `preload_url` | url | 获取并缓存 URL |
| `clear_stats` | - | 重置统计 |

### 配置

| 方法 | 参数 | 描述 |
|------|------|------|
| `set_enabled` | enabled | 启用/禁用服务 |
| `policies` | - | 列出缓存策略 |
| `add_policy` | name, domains, extensions, cache_time, max_size | 创建策略 |
| `remove_policy` | id | 删除策略 |
| `exclusions` | - | 列出排除项 |
| `add_exclusion` | name, domains, reason | 创建排除项 |
| `remove_exclusion` | id | 删除排除项 |
| `set_limits` | max_size_mb, cache_valid | 设置缓存限制 |
| `restart` | - | 重启服务 |

### 示例

```bash
# 检查状态
ubus call luci.cdn-cache status

# 获取统计
ubus call luci.cdn-cache stats

# 清除域名缓存
ubus call luci.cdn-cache purge_domain '{"domain":"example.com"}'

# 添加自定义策略
ubus call luci.cdn-cache add_policy '{
  "name": "Game Updates",
  "domains": "cdn.steampowered.com epicgames.com",
  "extensions": "pak bundle",
  "cache_time": 10080,
  "max_size": 4096
}'

# 设置缓存限制（2GB，48 小时有效期）
ubus call luci.cdn-cache set_limits '{"max_size_mb": 2048, "cache_valid": 2880}'
```

## Nginx 缓存配置

服务在 `/var/etc/cdn-cache-nginx.conf` 生成 nginx 配置：

- **缓存区**：64MB 密钥区，可配置的最大大小
- **缓存层级**：2 级目录结构以提高性能
- **过期内容**：在上游错误时提供过期内容（500、502、503、504）
- **缓存锁**：防止缓存未命中时的惊群效应
- **健康检查**：`/cdn-cache-health` 端点

### 响应头

缓存响应包括：
- `X-Cache-Status`：HIT、MISS、EXPIRED、STALE、UPDATING
- `X-Cache-Date`：原始响应日期

## 默认缓存策略

| 策略 | 域名 | 扩展名 | 持续时间 |
|------|------|--------|----------|
| Windows Update | windowsupdate.com, download.microsoft.com | exe, msu, cab, msi | 7 天 |
| Linux Repos | archive.ubuntu.com, deb.debian.org | deb, rpm, pkg.tar.zst | 3 天 |
| Android Apps | play.googleapis.com | apk, obb | 7 天 |
| Steam Games | steamcontent.com | - | 7 天 |
| Static Content | * | js, css, png, jpg, woff | 1 天 |

## 文件

| 文件 | 描述 |
|------|------|
| `/etc/config/cdn-cache` | UCI 配置 |
| `/etc/init.d/cdn-cache` | 初始化脚本 |
| `/var/etc/cdn-cache-nginx.conf` | 生成的 nginx 配置 |
| `/var/cache/cdn/` | 缓存存储目录 |
| `/var/run/cdn-cache.pid` | PID 文件 |
| `/var/run/cdn-cache-stats.json` | 统计文件 |
| `/var/log/cdn-cache/access.log` | 访问日志 |
| `/var/log/cdn-cache/error.log` | 错误日志 |
| `/usr/libexec/rpcd/luci.cdn-cache` | RPCD 后端 |

## 故障排除

### 服务无法启动
```bash
# 检查 nginx 语法
nginx -t -c /var/etc/cdn-cache-nginx.conf

# 检查错误日志
cat /var/log/cdn-cache/error.log
```

### 缓存不工作
```bash
# 验证代理正在监听
netstat -tlnp | grep 3128

# 用 curl 测试
curl -x http://192.168.255.1:3128 http://example.com -I

# 检查缓存状态头
curl -x http://192.168.255.1:3128 http://example.com -I | grep X-Cache
```

### 检查缓存内容
```bash
# 列出缓存文件
ls -la /var/cache/cdn/

# 缓存大小
du -sh /var/cache/cdn/
```

### 清除所有缓存
```bash
ubus call luci.cdn-cache purge_cache
# 或手动
rm -rf /var/cache/cdn/*
/etc/init.d/cdn-cache restart
```

## 性能

使用最佳配置：
- **命中率**：重复内容通常为 60-80%
- **带宽节省**：减少 40-60%
- **延迟**：缓存命中 < 1ms

## 依赖

- `nginx-full` - 带代理和缓存模块的 Nginx
- `luci-base` - LuCI 框架
- `rpcd` - RPC 守护进程

## 许可证

Apache-2.0 - CyberMind.fr
