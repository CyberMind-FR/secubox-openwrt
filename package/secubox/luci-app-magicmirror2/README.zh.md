# SecuBox MagicMirror2 管理器

[English](README.md) | [Francais](README.fr.md) | 中文

用于在基于 OpenWrt 的 SecuBox 系统上运行和管理 MagicMirror2 的完整生态系统。

## 概述

此软件包提供完整的 MagicMirror2 实现，包括：
- **基于 Docker 的 MagicMirror2** 安装和管理
- **LuCI Web 界面** 用于模块管理和配置
- **模块管理器** - 从 Web UI 安装、更新和删除 MM2 模块
- **配置编辑器** - 使用语法高亮和示例编辑 config.js
- **VHost 集成** - 通过带 SSL 的反向代理发布您的镜子
- **CLI 工具** - 为高级用户提供命令行控制

## 组件

### 1. secubox-app-magicmirror
提供基于 Docker 的 MagicMirror2 安装的 OpenWrt 软件包。

**位置**：`package/secubox/secubox-app-magicmirror/`

**文件**：
- `Makefile` - 软件包定义
- `files/etc/config/magicmirror` - UCI 配置
- `files/etc/init.d/magicmirror` - 初始化脚本
- `files/usr/sbin/magicmirrorctl` - 带模块管理的控制脚本

**功能**：
- 自动化 Docker 镜像管理
- 配置、模块和 CSS 的卷挂载
- CLI 模块管理（安装/删除/更新）
- 配置管理（显示/编辑/备份/恢复）

### 2. luci-app-magicmirror
用于管理 MagicMirror2 模块和配置的 LuCI Web 应用程序。

**位置**：`package/secubox/luci-app-magicmirror/`

**视图**：
- **概览**（`overview.js`）- 状态仪表板、服务控制、基本设置
- **模块**（`modules.js`）- 带安装/更新/删除的模块管理器
- **配置**（`config.js`）- 带验证和模板的配置编辑器

**RPCD 后端**：`/usr/libexec/rpcd/luci.magicmirror`
- `getStatus` - 服务状态和统计
- `listModules` - 列出已安装的模块
- `getConfig` - 获取配置内容
- `installModule` - 从 Git URL 安装模块
- `removeModule` - 删除已安装的模块
- `updateModule` - 将模块更新到最新版本
- `getModuleConfig` - 获取模块 README/配置
- `saveConfig` - 保存配置更改
- `restartService` - 重启 MagicMirror 服务

### 3. 应用商店集成

**入口位于**：`luci-app-secubox/appstore/apps.json`
```json
{
  "id": "secubox-app-magicmirror",
  "name": "MagicMirror2",
  "version": "2.28.0",
  "category": "iot",
  "description": "智能镜子平台...",
  "luci_app": "luci-app-magicmirror"
}
```

### 4. VHost 模板

**位置**：`luci-app-vhost-manager/htdocs/luci-static/resources/vhost-manager/templates.json`

```json
{
  "id": "magicmirror",
  "domain": "mirror.local",
  "backend": "http://127.0.0.1:8080",
  "port": 8080,
  "app_id": "secubox-app-magicmirror",
  "websocket_support": true
}
```

### 5. 插件清单

**位置**：`secubox-app/files/usr/share/secubox/plugins/catalog/magicmirror.json`

定义软件包元数据、要求、功能和向导步骤。

## 安装

### 快速安装
```bash
# 编译所有软件包
make package/secubox-app-magicmirror/compile
make package/luci-app-magicmirror/compile

# 在路由器上安装
opkg install secubox-app-magicmirror_*.ipk
opkg install luci-app-magicmirror_*.ipk

# 安装并启动
magicmirrorctl install
/etc/init.d/magicmirror enable
/etc/init.d/magicmirror start
```

### 通过 SecuBox 应用商店
1. 导航到 **SecuBox -> 应用商店**
2. 在 IoT 类别中找到 **MagicMirror2**
3. 点击 **安装**
4. 通过 **SecuBox -> IoT -> MagicMirror2** 进行配置

## 使用

### Web 界面

导航到：**SecuBox -> IoT -> MagicMirror2**

#### 概览选项卡
- 查看服务状态和统计信息
- 启动/停止/重启服务
- 配置基本设置（端口、时区、语言、单位）
- 快速访问镜子 Web 界面

#### 模块选项卡
- 查看所有已安装的模块
- 从 Git URL 安装新模块
- 将模块更新到最新版本
- 删除模块
- 查看模块信息和 README

**安装模块**：
1. 点击 **安装新模块**
2. 输入 Git URL（例如 `https://github.com/MichMich/MMM-WeatherChart`）
3. 点击 **安装**
4. 等待安装完成（可能需要几分钟）

#### 配置选项卡
- 在基于 Web 的编辑器中编辑 config.js
- 语法验证
- 模块位置参考图
- 示例配置
- 保存和自动重启选项

### 命令行

```bash
# 服务管理
magicmirrorctl install      # 安装和配置
magicmirrorctl status       # 显示容器状态
magicmirrorctl logs         # 查看日志
magicmirrorctl update       # 更新到最新镜像

# 模块管理
magicmirrorctl module list  # 列出已安装的模块
magicmirrorctl module install <git-url>
magicmirrorctl module update <模块名>
magicmirrorctl module remove <模块名>
magicmirrorctl module config <模块名>  # 显示配置

# 配置管理
magicmirrorctl config show    # 显示当前配置
magicmirrorctl config edit    # 在 vi 中编辑
magicmirrorctl config backup  # 备份当前配置
magicmirrorctl config restore # 从备份恢复
magicmirrorctl config reset   # 重置为默认值
```

### VHost 设置

1. 在 VHost 管理器中启用 MagicMirror：
   - 转到 **VHost 管理器 -> 内部服务**
   - 找到 **MagicMirror2**
   - 点击 **创建**
   - 配置域名（例如 `mirror.local`）
   - 如需要则启用 SSL

2. 通过域名访问：
   - `http://mirror.local`（或您配置的域名）
   - Network Tweaks 自动处理 DNS 解析

## 配置

### UCI 配置：`/etc/config/magicmirror`

```
config magicmirror 'main'
	option enabled '1'
	option image 'karsten13/magicmirror:latest'
	option config_path '/srv/magicmirror/config'
	option modules_path '/srv/magicmirror/modules'
	option css_path '/srv/magicmirror/css'
	option port '8080'
	option timezone 'UTC'
	option language 'en'
	option units 'metric'
```

### config.js 结构

位于：`/srv/magicmirror/config/config.js`

```javascript
let config = {
	address: "0.0.0.0",
	port: 8080,
	language: "en",
	timeFormat: 24,
	units: "metric",

	modules: [
		{
			module: "clock",
			position: "top_left"
		},
		{
			module: "weather",
			position: "top_right",
			config: {
				weatherProvider: "openweathermap",
				type: "current",
				location: "Paris",
				apiKey: "您的_API_密钥"
			}
		}
		// 在此添加更多模块
	]
};
```

## 模块位置

```
+==================================================+
|                   top_bar                        |
+==============+==============+====================+
|  top_left    |  top_center  |    top_right       |
+==============+==============+====================+
| upper_third  |middle_center |   upper_third      |
+==============+==============+====================+
| lower_third  |              |   lower_third      |
+==============+==============+====================+
| bottom_left  |bottom_center |   bottom_right     |
+==============+==============+====================+
|                  bottom_bar                      |
+==================================================+
```

## 热门模块

- **MMM-WeatherChart** - 天气预报图表
- **MMM-MyCalendar** - 增强型日历显示
- **MMM-NOAA** - NOAA 天气数据
- **MMM-Facial-Recognition** - 面部识别
- **MMM-Cryptocurrency** - 加密货币价格跟踪
- **MMM-Todoist** - Todoist 任务管理器
- **MMM-Spotify** - Spotify 正在播放
- **MMM-GooglePhotos** - Google 相册幻灯片

[浏览所有模块](https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules)

## 故障排除

### 镜子无法访问
1. 检查服务状态：`magicmirrorctl status`
2. 查看日志：`magicmirrorctl logs -f`
3. 验证端口：`uci get magicmirror.main.port`
4. 检查 Docker：`/etc/init.d/dockerd status`

### 模块安装失败
1. 确保已安装 git：`opkg install git git-http`
2. 检查 Git URL 是否正确
3. 查看安装日志：`cat /tmp/mm-install.log`
4. 尝试手动安装：`magicmirrorctl module install <url>`

### 配置未应用
1. 检查配置语法（必须是有效的 JavaScript）
2. 重启服务：`/etc/init.d/magicmirror restart`
3. 查看容器日志：`magicmirrorctl logs`
4. 如需要则恢复备份：`magicmirrorctl config restore`

### 容器无法启动
1. 检查 cgroups：`ls -la /sys/fs/cgroup`
2. 验证 Docker 正在运行：`/etc/init.d/dockerd status`
3. 检查磁盘空间：`df -h`
4. 手动拉取镜像：`docker pull karsten13/magicmirror:latest`

## 资源

- **官方网站**：https://magicmirror.builders/
- **文档**：https://docs.magicmirror.builders/
- **第三方模块**：https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules
- **社区论坛**：https://forum.magicmirror.builders/
- **GitHub**：https://github.com/MichMich/MagicMirror

## 许可证

Apache-2.0

## 作者

CyberMind Studio <contact@cybermind.fr>
