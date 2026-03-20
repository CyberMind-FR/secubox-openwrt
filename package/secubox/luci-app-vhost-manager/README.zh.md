# VHost Manager - 反向代理和SSL证书管理

**版本：** 2.0.0
**最后更新：** 2026-01-01
**状态：** 活跃

用于管理nginx反向代理虚拟主机和通过Let's Encrypt获取SSL证书的LuCI应用程序，集成了服务模板和重定向管理功能。

## 功能特性

### 内部服务目录 (v2.0+)
- **预配置服务模板** - 19个即用型内部服务
- **一键激活** - 使用最佳SSL、认证和WebSocket设置部署服务
- **实时状态** - 自动刷新仪表板显示活跃/已配置服务
- **智能功能检测** - 自动SSL、认证和WebSocket配置
- **分类组织** - 按类型分组的服务（物联网、媒体、安全、生产力等）
- **自动刷新** - 每10秒实时更新
- **现代网格界面** - 响应式卡片布局，带功能徽章

### 重定向规则管理 (v2.0+)
- **预建重定向模板** - 6种常见重定向模式（CDN缓存、隐私重定向、故障转移）
- **HTTP重定向代码** - 支持301（永久）、302（临时）、307（临时，保留方法）
- **模板激活** - 一键部署重定向规则
- **活跃重定向仪表板** - 已配置重定向的实时状态
- **分类组织** - 按用例分组的模板（生产力、媒体、安全、网络）
- **自动刷新** - 每10秒实时更新

### 虚拟主机管理 (v1.0+)
- 创建和管理nginx反向代理配置
- 支持HTTP和HTTPS虚拟主机
- 部署前后端连接测试
- WebSocket协议支持
- HTTP Basic认证
- 配置更改时自动重载nginx
- **启用/禁用开关** - 无需删除即可快速控制服务
- **删除按钮** - 带确认的清洁VHost删除

### SSL证书管理 (v1.0+)
- 通过acme.sh提供Let's Encrypt证书
- 证书状态监控和过期跟踪
- 颜色编码的过期警告（红色 < 7天，橙色 < 30天）
- 证书详情查看器
- 自动证书续期支持

### 访问日志监控 (v1.0+)
- 实时nginx访问日志查看器
- 按域名过滤日志
- 可配置行数显示（50-500行）
- 终端风格日志显示

### 配置文件激活系统 (v2.0+)
- **基于模板部署** - 从预配置模板创建VHost
- **智能功能配置** - 根据服务需求自动设置SSL/认证/WebSocket
- **模板说明** - 激活时显示上下文信息
- **确认对话框** - 部署前审查设置
- **激活/停用** - 带视觉反馈的简易模板管理

## 安装

```bash
opkg update
opkg install luci-app-vhost-manager
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

## 依赖

- **luci-base**：LuCI框架
- **rpcd**：用于后端通信的RPC守护进程
- **nginx-ssl**：带SSL支持的Nginx Web服务器
- **acme**：用于Let's Encrypt证书的ACME客户端
- **curl**：用于后端测试的HTTP客户端

## 配置

### UCI配置 (`/etc/config/vhosts`)

虚拟主机现在位于`/etc/config/vhosts`，允许其他SecuBox组件声明式安装代理。安装时会放置一个默认文件；像其他UCI配置一样编辑它：

```bash
config global 'global'
	option enabled '1'
	option auto_reload '1'

config vhost 'myapp'
	option domain 'app.example.com'
	option upstream 'http://127.0.0.1:8080'
	option tls 'acme'          # off|acme|manual
	option cert_path '/etc/custom/fullchain.pem'   # tls=manual时使用
	option key_path '/etc/custom/privkey.pem'
	option auth '1'
	option auth_user 'admin'
	option auth_pass 'secretpassword'
	option websocket '1'
	option enabled '1'
```

> 旧版安装可能仍提供`/etc/config/vhost_manager`以保持向后兼容，但RPC后端现在专门从`/etc/config/vhosts`生成`/etc/nginx/conf.d/*.conf`。

### 选项

#### 全局部分
- `enabled`：启用/禁用VHost Manager（默认：1）
- `auto_reload`：配置更改时自动重载nginx（默认：1）
- `log_retention`：访问日志保留天数（默认：30）

#### VHost部分
- `domain`：此虚拟主机的域名（必需）
- `upstream`：要代理的后端URL（必需，例如 http://192.168.1.100:8080）
- `tls`：TLS策略（`off`、`acme`或`manual`）
- `cert_path` / `key_path`：`tls=manual`时需要指向PEM文件
- `auth`：启用HTTP Basic认证（默认：0）
- `auth_user` / `auth_pass`：`auth=1`时使用的凭据
- `websocket`：启用WebSocket头（默认：0）
- `enabled`：禁用vhost但不删除（默认：1）

## 使用方法

### Web界面

在LuCI中导航至 **服务 -> VHost Manager**。

#### 概览选项卡
- 系统状态（Nginx运行中、ACME可用性）
- 虚拟主机统计（SSL启用、认证保护、WebSocket）
- 证书数量和过期状态
- 最近虚拟主机列表

#### 虚拟主机选项卡
- 添加新虚拟主机
- 编辑现有配置
- 保存前测试后端连接
- 启用/禁用SSL、认证、WebSocket
- 删除虚拟主机

#### 证书选项卡
- 请求新的Let's Encrypt证书
- 查看已安装证书及过期日期
- 证书详情查看器
- 颜色编码的过期警告

#### 日志选项卡
- 按域名查看nginx访问日志
- 选择显示行数（50-500）
- 实时日志流

#### 内部服务选项卡 (v2.0+)

内部服务选项卡为流行的自托管应用程序提供19个预配置服务模板的目录。

**仪表板指标：**
- **活跃** - 当前启用并运行的服务
- **已配置** - 有VHost条目的服务总数
- **可用** - 目录中的模板总数

**活跃服务网格：**

每个已配置服务显示：
- 服务图标和名称
- 状态徽章（活跃/禁用）
- 类别和描述
- 域名、后端URL和端口
- 功能徽章（SSL、认证、WebSocket）
- 三个操作按钮：
  - **编辑** - 导航到VHost配置
  - **启用/禁用** - 切换服务状态
  - **删除** - 删除VHost配置（带确认）

**服务模板：**

模板按类别组织：

| 类别 | 服务 |
|------|------|
| **核心服务** | LuCI UI |
| **监控** | Netdata |
| **安全** | CrowdSec、Vaultwarden |
| **网络** | NoDogSplash、AdGuard Home、Uptime Kuma |
| **物联网与家庭自动化** | Domoticz、Zigbee2MQTT、Home Assistant、MagicMirror |
| **媒体** | Lyrion Music Server、Jellyfin |
| **AI与机器学习** | LocalAI |
| **生产力** | Citadel、ISPConfig、Mail-in-a-Box、Nextcloud、Gitea |
| **托管与控制面板** | Portainer |

**模板激活工作流程：**

1. 点击任意模板上的 **激活**
2. 查看激活对话框显示：
   - 服务名称和图标
   - 域名和后端URL
   - 所需功能（SSL、认证、WebSocket）
   - 特殊说明（例如"Nextcloud处理自己的认证"）
3. 点击 **激活** 创建VHost
4. 服务自动配置最佳设置

**示例：激活Nextcloud**

模板配置：
```
图标：云
名称：Nextcloud
域名：cloud.local
后端：http://127.0.0.1:80
端口：80
类别：生产力
功能：
  - 需要SSL/TLS
  - WebSocket支持
说明："Nextcloud处理自己的认证。在config.php中配置可信域名。"
```

激活后：
- 在`cloud.local`创建VHost
- 自动配置SSL（ACME模式）
- 启用WebSocket头
- 后端代理到端口80
- 服务在仪表板中标记为"活跃"

#### 重定向选项卡 (v2.0+)

重定向选项卡管理nginx HTTP重定向规则，提供常见用例的预建模板。

**仪表板指标：**
- **活跃** - 当前启用的重定向规则
- **总计** - 所有已配置的重定向
- **模板** - 可用重定向模板

**活跃重定向网格：**

每个已配置重定向显示：
- 重定向图标
- 域名
- 状态徽章（活跃/禁用）
- 源域名
- 目标URL
- HTTP代码徽章（301、302、307）
- 三个操作按钮：
  - **编辑** - 导航到VHost配置
  - **启用/禁用** - 切换重定向状态
  - **删除** - 删除重定向规则（带确认）

**重定向模板：**

| 模板 | HTTP代码 | 类别 | 用例 |
|------|----------|------|------|
| **Nextcloud到LAN** | 301 | 生产力 | 强制远程用户使用LAN托管的Nextcloud |
| **Steam CDN缓存** | 302 | 媒体 | 将下载重定向到本地缓存 |
| **YouTube到Invidious** | 307 | 媒体 | 隐私友好的YouTube重定向 |
| **邮件故障转移** | 302 | 生产力 | 故障转移到备用邮件服务 |
| **广告拦截重定向** | 301 | 安全 | 将广告服务器重定向到localhost |
| **CDN到本地缓存** | 302 | 网络 | 本地缓存CDN资源 |

**HTTP重定向代码：**

- **301（永久）** - 浏览器缓存重定向，用于永久移动
- **302（临时）** - 浏览器不缓存，用于临时重定向
- **307（临时，保留方法）** - 类似302但保留HTTP方法（POST/GET）

### 命令行

#### 列出虚拟主机

```bash
ubus call luci.vhost-manager list_vhosts
```

#### 获取VHost Manager状态

```bash
ubus call luci.vhost-manager status
```

#### 添加虚拟主机

```bash
ubus call luci.vhost-manager add_vhost '{
  "domain": "app.example.com",
  "backend": "http://192.168.1.100:8080",
  "tls_mode": "acme",
  "auth": true,
  "auth_user": "admin",
  "auth_pass": "secret",
  "websocket": true,
  "enabled": true
}'
```

#### 测试后端连接

```bash
ubus call luci.vhost-manager test_backend '{
  "backend": "http://192.168.1.100:8080"
}'
```

#### 请求SSL证书

```bash
ubus call luci.vhost-manager request_cert '{
  "domain": "app.example.com",
  "email": "admin@example.com"
}'
```

#### 列出证书

```bash
ubus call luci.vhost-manager list_certs
```

#### 重载Nginx

```bash
ubus call luci.vhost-manager reload_nginx
```

#### 获取访问日志

```bash
ubus call luci.vhost-manager get_access_logs '{
  "domain": "app.example.com",
  "lines": 100
}'
```

## Nginx配置

VHost Manager在`/etc/nginx/conf.d/`中生成nginx配置文件。

### 生成的配置示例（仅HTTP）

```nginx
server {
    listen 80;
    server_name app.example.com;

    access_log /var/log/nginx/app.example.com.access.log;
    error_log /var/log/nginx/app.example.com.error.log;

    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 生成的配置示例（带WebSocket的HTTPS）

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/acme/app.example.com/fullchain.cer;
    ssl_certificate_key /etc/acme/app.example.com/app.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/app.example.com.access.log;
    error_log /var/log/nginx/app.example.com.error.log;

    location / {
        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### 带认证的示例

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/acme/app.example.com/fullchain.cer;
    ssl_certificate_key /etc/acme/app.example.com/app.example.com.key;

    location / {
        auth_basic "受限访问";
        auth_basic_user_file /etc/nginx/htpasswd/app.example.com;

        proxy_pass http://192.168.1.100:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL证书工作流程

1. **DNS配置**：确保您的域名指向路由器的公网IP
2. **端口转发**：将端口80和443转发到您的路由器
3. **请求证书**：使用证书选项卡请求Let's Encrypt证书
4. **配置VHost**：为虚拟主机启用SSL
5. **监控过期**：证书90天后过期，在证书选项卡中监控

### ACME证书位置

- 证书：`/etc/acme/{domain}/fullchain.cer`
- 私钥：`/etc/acme/{domain}/{domain}.key`
- ACME账户：`/etc/acme/account.conf`

## ubus API参考

### status()

获取VHost Manager和nginx状态。

**返回：**
```json
{
  "nginx_running": true,
  "nginx_version": "1.23.3",
  "acme_available": true,
  "acme_version": "3.0.5",
  "vhost_count": 5
}
```

### list_vhosts()

列出所有已配置的虚拟主机。

### get_vhost(domain)

获取特定虚拟主机的详细信息。

**参数：**
- `domain`：域名

### add_vhost(payload)

添加新虚拟主机。

**参数：**
- `domain`：域名（必需）
- `backend`：后端URL（必需）
- `tls_mode`：`off`、`acme`或`manual`（必需）
- `auth`：启用认证（布尔值）
- `auth_user` / `auth_pass`：启用auth时的凭据
- `websocket`：启用WebSocket（布尔值）
- `enabled`：禁用vhost但不删除（布尔值）
- `cert_path` / `key_path`：`tls_mode=manual`时必需

### update_vhost(payload)

更新现有虚拟主机。

**参数：** 与`add_vhost`相同。省略的字段保留其先前的值。

### delete_vhost(domain)

删除虚拟主机。

### test_backend(backend)

测试到后端服务器的连接。

### request_cert(domain, email)

请求Let's Encrypt SSL证书。

### list_certs()

列出所有已安装的SSL证书。

### reload_nginx()

重载nginx配置。

### get_access_logs(domain, lines)

获取域名的nginx访问日志。

## 故障排除

### Nginx无法启动

检查nginx配置语法：
```bash
nginx -t
```

查看nginx错误日志：
```bash
logread | grep nginx
```

### 证书请求失败

确保：
1. 域名DNS指向您的公网IP
2. 端口80和443已转发到您的路由器
3. 防火墙允许端口80和443的入站连接
4. 没有其他服务使用端口80（acme.sh需要它进行验证）

检查ACME日志：
```bash
cat /var/log/acme.log
```

### 后端无法访问

手动测试后端：
```bash
curl -I http://192.168.1.100:8080
```

检查后端是否在监听：
```bash
netstat -tuln | grep 8080
```

### WebSocket不工作

确保：
1. 在虚拟主机配置中启用了WebSocket支持
2. 后端应用程序支持WebSocket
3. 代理超时时间不要太短（默认：86400秒）

### 认证不工作

检查htpasswd文件是否存在：
```bash
ls -l /etc/nginx/.luci-app-vhost-manager_{domain}
```

## 安全注意事项

1. **SSL证书**：生产服务始终使用HTTPS
2. **强密码**：HTTP Basic认证使用强密码
3. **后端安全**：确保后端服务不能从互联网直接访问
4. **防火墙规则**：配置防火墙只允许必要的端口
5. **日志监控**：定期检查访问日志以发现可疑活动
6. **证书续期**：监控证书过期并确保自动续期正常工作

## 许可证

Apache-2.0

## 维护者

SecuBox Project <support@secubox.com>

## 版本

2.0.0
