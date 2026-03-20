# SecuBox 模块实现指南

> **语言:** [English](../docs/module-implementation-guide.md) | [Francais](../docs-fr/module-implementation-guide.md) | **中文**

**版本:** 1.0.0
**最后更新:** 2025-12-28
**状态:** 活跃
**目的:** 重新生成与在线演示匹配的 SecuBox 模块的完整指南

---

## 另请参阅

- **自动化简报:** [CODEX.md](codex.md)
- **模块提示词:** [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)
- **代码模板:** [CODE-TEMPLATES.md](code-templates.md)
- **快速命令:** [QUICK-START.md](quick-start.md)

---

## 快速导航

- **[FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md)** - 全部 15 个模块的完整功能规格
- **[CODE-TEMPLATES.md](code-templates.md)** - 即用型代码模板和实现示例
- **[DEVELOPMENT-GUIDELINES.md](development-guidelines.md)** - 完整的开发指南和设计系统
- **[QUICK-START.md](quick-start.md)** - 常见任务的快速参考
- **[CLAUDE.md](claude.md)** - 构建系统和架构参考

---

## 文档概述

本指南向您展示如何使用全面的文档来重新生成或创建与 **secubox.cybermood.eu** 在线演示匹配的 SecuBox 模块。

### 包含内容

1. **功能规格** - 全部 15 个模块的详细需求
2. **代码模板** - 可运行的实现示例
3. **设计系统** - CSS 变量、字体、组件
4. **验证工具** - 自动化测试和修复
5. **部署脚本** - 本地构建和远程部署

---

## 实现工作流程

### 步骤 1: 选择您的方法

**选项 A: 使用 Claude.ai 进行代码生成**
1. 打开 [claude.ai](https://claude.ai)
2. 从 [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md) 复制相关的模块提示词
3. 粘贴提示词并请求实现
4. Claude 将根据模板生成所有必需的文件
5. 审查并集成生成的代码

**选项 B: 使用模板进行手动实现**
1. 从 [CODE-TEMPLATES.md](code-templates.md) 复制模板
2. 将占位符替换为模块特定的值
3. 实现模块特定的逻辑
4. 验证和测试

**选项 C: 混合方法（推荐）**
1. 使用 Claude.ai 进行初始代码生成
2. 使用模板和指南进行优化
3. 使用自动化工具进行验证
4. 部署并在目标设备上测试

---

## 分步指南: 使用 Claude.ai 重新生成模块

### 示例: 重新生成 System Hub 模块

#### 1. 收集上下文

在向 Claude 提问之前，收集这些资源:

```bash
# 阅读模块规格
cat FEATURE-REGENERATION-PROMPTS.md | grep -A 200 "System Hub"

# 查看设计系统
cat DEVELOPMENT-GUIDELINES.md | grep -A 100 "Design System"

# 检查现有实现（如果有）
ls -la luci-app-system-hub/
```

#### 2. 准备提示词

为 Claude.ai 创建一个全面的提示词:

```
我需要为 OpenWrt LuCI 框架实现 System Hub 模块。

重要约束:
- OpenWrt 使用 LuCI 框架（不是 React/Vue）
- JavaScript 使用 L.view.extend() 模式（不是 ES6 模块）
- 后端是 RPCD（shell 脚本）通过 ubus 通信
- CSS 必须使用 system-hub/common.css 中的变量
- 所有代码必须是生产就绪的并匹配在线演示
- 严格遵循设计系统

技术要求:
- RPCD 脚本必须命名为: luci.system-hub
- 菜单路径必须与视图文件位置匹配
- 所有颜色使用 CSS 变量 (--sh-*)
- 支持暗黑模式 [data-theme="dark"]
- 实现适当的错误处理
- 为异步操作添加加载状态

参考文档:
1. 在线演示: https://secubox.cybermood.eu/system-hub
2. 功能规格: [从 FEATURE-REGENERATION-PROMPTS.md 粘贴]
3. 代码模板: [从 CODE-TEMPLATES.md 粘贴相关模板]

请提供:
1. 完整的 JavaScript 视图文件 (overview.js, services.js, 等)
2. RPCD 后端脚本 (luci.system-hub)
3. API 模块 (system-hub/api.js)
4. CSS 样式 (system-hub/dashboard.css)
5. 菜单配置 JSON
6. ACL 配置 JSON

确保所有代码与在线演示的视觉设计和功能匹配。
```

#### 3. 生成代码

将您的提示词粘贴到 Claude.ai 并让它生成实现。

#### 4. 审查生成的代码

根据这些要求检查生成的代码:

**API 模块检查清单:**
- [ ] 使用 `'use strict';`
- [ ] 引入 `baseclass` 和 `rpc`
- [ ] 所有 RPC 方法使用 `rpc.declare()`
- [ ] 对象名称与 RPCD 脚本名称匹配 (`luci.system-hub`)
- [ ] 如需要包含辅助函数
- [ ] 从 `baseclass.extend()` 导出

**视图模块检查清单:**
- [ ] 扩展 `view.extend()`
- [ ] 实现返回 Promise 的 `load()` 方法
- [ ] 实现 `render(data)` 方法
- [ ] 使用 `E()` 辅助函数进行 DOM 构建
- [ ] 实现 `poll.add()` 用于自动刷新
- [ ] 使用 try/catch 进行适当的错误处理
- [ ] 使用 `ui.showModal()` 显示加载状态
- [ ] 使用 `ui.addNotification()` 进行用户反馈

**RPCD 后端检查清单:**
- [ ] 以 `#!/bin/sh` 开头
- [ ] 源代码包含 `/lib/functions.sh` 和 `/usr/share/libubox/jshn.sh`
- [ ] 实现带有方法声明的 `list` case
- [ ] 实现带有方法路由的 `call` case
- [ ] 所有方法使用 `json_*` 函数输出有效的 JSON
- [ ] 适当的参数验证
- [ ] 带有适当消息的错误处理

**菜单 JSON 检查清单:**
- [ ] 路径遵循 `admin/secubox/<category>/<module>`
- [ ] 第一个条目使用 `"type": "firstchild"`
- [ ] 视图条目使用带有正确 `"path"` 的 `"type": "view"`
- [ ] 路径与视图文件位置匹配
- [ ] 菜单定位的适当 `"order"` 值
- [ ] 依赖正确的 ACL 条目

**ACL JSON 检查清单:**
- [ ] 条目名称与包名称匹配
- [ ] 所有读取方法列在 `"read"."ubus"` 下
- [ ] 所有写入方法列在 `"write"."ubus"` 下
- [ ] ubus 对象名称与 RPCD 脚本名称匹配
- [ ] 如需要授予 UCI 配置访问权限

**CSS 检查清单:**
- [ ] 导入 `system-hub/common.css`
- [ ] 使用 CSS 变量 (`var(--sh-*)`)
- [ ] 使用 `[data-theme="dark"]` 支持暗黑模式
- [ ] 响应式网格布局
- [ ] 平滑的过渡和动画
- [ ] 数值使用 JetBrains Mono 字体

#### 5. 集成到代码库

```bash
# 创建模块目录结构
mkdir -p luci-app-system-hub/htdocs/luci-static/resources/system-hub
mkdir -p luci-app-system-hub/htdocs/luci-static/resources/view/system-hub
mkdir -p luci-app-system-hub/root/usr/libexec/rpcd
mkdir -p luci-app-system-hub/root/usr/share/luci/menu.d
mkdir -p luci-app-system-hub/root/usr/share/rpcd/acl.d

# 将生成的文件复制到适当的位置
# （从 Claude 的输出复制到相应的文件）

# 将 RPCD 脚本设置为可执行
chmod +x luci-app-system-hub/root/usr/libexec/rpcd/luci.system-hub
```

#### 6. 验证实现

```bash
# 首先修复权限（关键）
./secubox-tools/fix-permissions.sh --local

# 运行全面验证（7 项检查）
./secubox-tools/validate-modules.sh

# 预期输出:
# 所有检查通过
# 或
# 发现错误并提供具体的修复说明
```

#### 7. 本地构建

```bash
# 构建单个模块
./secubox-tools/local-build.sh build luci-app-system-hub

# 或构建所有模块
./secubox-tools/local-build.sh build

# 或完整验证 + 构建
./secubox-tools/local-build.sh full
```

#### 8. 部署到测试路由器

```bash
# 传输包
scp build/x86-64/luci-app-system-hub*.ipk root@192.168.1.1:/tmp/

# 在路由器上安装
ssh root@192.168.1.1 << 'EOF'
opkg install /tmp/luci-app-system-hub*.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
EOF

# 在已部署的路由器上修复权限（如需要）
./secubox-tools/fix-permissions.sh --remote
```

#### 9. 在浏览器中测试

1. 导航到 `http://192.168.1.1/cgi-bin/luci`
2. 转到 SecuBox -> System -> System Hub
3. 验证:
   - 页面加载无错误
   - 数据正确显示
   - 操作正常工作（按钮、表单）
   - 自动刷新更新数据
   - 样式与演示匹配
   - 暗黑模式正常工作
   - 响应式设计在移动设备上正常工作

#### 10. 迭代和优化

如果发现问题:
1. 检查浏览器控制台的 JavaScript 错误
2. 检查路由器日志: `ssh root@192.168.1.1 "logread | tail -50"`
3. 验证 RPCD 方法是否工作: `ubus call luci.system-hub status`
4. 在本地文件中修复问题
5. 重新构建和重新部署
6. 再次测试

---

## 常见实现模式

### 模式 1: 多标签页仪表板

**示例:** 带有 9 个标签页的 System Hub

```javascript
// 在 render() 中
var tabs = [
	{ id: 'overview', title: '概览', icon: '🏠' },
	{ id: 'services', title: '服务', icon: '⚙️' },
	{ id: 'logs', title: '日志', icon: '📋' }
];

var activeTab = 'overview';

// 渲染标签页导航
var tabNav = E('div', { 'class': 'sh-nav-tabs' },
	tabs.map(function(tab) {
		return E('div', {
			'class': 'sh-nav-tab' + (activeTab === tab.id ? ' active' : ''),
			'click': function() {
				// 切换标签页逻辑
				document.querySelectorAll('.sh-nav-tab').forEach(function(t) {
					t.classList.remove('active');
				});
				this.classList.add('active');
				// 显示/隐藏标签页内容
			}
		}, [
			E('span', {}, tab.icon),
			E('span', {}, tab.title)
		]);
	})
);

// 渲染标签页内容
var tabContent = E('div', { 'class': 'tab-content' }, [
	// 概览标签页
	E('div', { 'class': 'tab-pane' + (activeTab === 'overview' ? ' active' : ''), 'data-tab': 'overview' }, [
		this.renderOverviewContent()
	]),
	// 服务标签页
	E('div', { 'class': 'tab-pane' + (activeTab === 'services' ? ' active' : ''), 'data-tab': 'services' }, [
		this.renderServicesContent()
	])
]);
```

### 模式 2: 带数据过滤的筛选标签页

**示例:** 带分类筛选的 SecuBox 模块网格

```javascript
// 筛选标签页
var filterTabs = E('div', { 'class': 'sh-filter-tabs' }, [
	E('div', {
		'class': 'sh-filter-tab active',
		'data-filter': 'all',
		'click': function(ev) {
			document.querySelectorAll('.sh-filter-tab').forEach(function(t) {
				t.classList.remove('active');
			});
			this.classList.add('active');
			self.filterModules('all');
		}
	}, [
		E('span', { 'class': 'sh-tab-icon' }, '📦'),
		E('span', { 'class': 'sh-tab-label' }, '全部')
	]),
	E('div', {
		'class': 'sh-filter-tab',
		'data-filter': 'security',
		'click': function(ev) {
			document.querySelectorAll('.sh-filter-tab').forEach(function(t) {
				t.classList.remove('active');
			});
			this.classList.add('active');
			self.filterModules('security');
		}
	}, [
		E('span', { 'class': 'sh-tab-icon' }, '🛡️'),
		E('span', { 'class': 'sh-tab-label' }, '安全')
	])
]);

// 筛选函数
filterModules: function(category) {
	var modules = document.querySelectorAll('.module-card');
	modules.forEach(function(module) {
		if (category === 'all' || module.dataset.category === category) {
			module.style.display = 'block';
		} else {
			module.style.display = 'none';
		}
	});
}
```

### 模式 3: 实时日志查看器

**示例:** System Hub 日志标签页

```javascript
// 带自动滚动和自动刷新的日志视图
renderLogsTab: function() {
	var self = this;
	var autoScroll = true;
	var autoRefresh = true;
	var refreshInterval = 5; // 秒

	var logsContainer = E('div', { 'class': 'logs-container' });

	// 加载日志
	var loadLogs = function() {
		API.getLogs(100, '').then(function(result) {
			var logs = result.logs || [];

			dom.content(logsContainer,
				logs.map(function(log) {
					return E('div', { 'class': 'log-line' }, log);
				})
			);

			// 自动滚动到底部
			if (autoScroll) {
				logsContainer.scrollTop = logsContainer.scrollHeight;
			}
		});
	};

	// 初始加载
	loadLogs();

	// 自动刷新
	if (autoRefresh) {
		setInterval(loadLogs, refreshInterval * 1000);
	}

	return E('div', {}, [
		// 控制区
		E('div', { 'class': 'logs-controls' }, [
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': autoScroll,
					'change': function() { autoScroll = this.checked; }
				}),
				' 自动滚动'
			]),
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': autoRefresh,
					'change': function() { autoRefresh = this.checked; }
				}),
				' 自动刷新'
			]),
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'click': loadLogs
			}, '立即刷新')
		]),
		// 日志显示区
		logsContainer
	]);
}
```

### 模式 4: 带确认的操作按钮

**示例:** 服务管理按钮

```javascript
// 渲染带确认的操作按钮
renderActionButton: function(service, action, label, btnClass) {
	var self = this;

	return E('button', {
		'class': 'sh-btn ' + btnClass,
		'click': function(ev) {
			// 显示确认对话框
			ui.showModal(_('确认操作'), [
				E('p', {}, _('您确定要 %s 服务 %s 吗？').format(action, service)),
				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'sh-btn sh-btn-secondary',
						'click': ui.hideModal
					}, _('取消')),
					E('button', {
						'class': 'sh-btn sh-btn-primary',
						'click': function() {
							ui.hideModal();
							self.performServiceAction(service, action);
						}
					}, _('确认'))
				])
			]);
		}
	}, label);
},

// 执行服务操作
performServiceAction: function(service, action) {
	var self = this;

	ui.showModal(_('正在执行操作'), [
		E('p', {}, E('em', { 'class': 'spinning' }, _('请稍候...')))
	]);

	API.serviceAction(service, action).then(function(result) {
		ui.hideModal();

		if (result.success) {
			ui.addNotification(null, E('p', _('操作成功完成')), 'success');
			self.handleRefresh();
		} else {
			ui.addNotification(null, E('p', _('操作失败: %s').format(result.message)), 'error');
		}
	}).catch(function(error) {
		ui.hideModal();
		ui.addNotification(null, E('p', _('错误: %s').format(error.message)), 'error');
	});
}
```

### 模式 5: 带验证的表单

**示例:** 设置页面

```javascript
renderSettingsForm: function() {
	var self = this;
	var settings = this.settingsData || {};

	return E('form', { 'class': 'settings-form' }, [
		// 文本输入
		E('div', { 'class': 'form-group' }, [
			E('label', {}, '主机名'),
			E('input', {
				'type': 'text',
				'class': 'form-control',
				'value': settings.hostname || '',
				'id': 'input-hostname'
			})
		]),

		// 带验证的数字输入
		E('div', { 'class': 'form-group' }, [
			E('label', {}, '刷新间隔（秒）'),
			E('input', {
				'type': 'number',
				'class': 'form-control',
				'value': settings.refresh_interval || 30,
				'min': 10,
				'max': 300,
				'id': 'input-refresh'
			})
		]),

		// 复选框
		E('div', { 'class': 'form-group' }, [
			E('label', {}, [
				E('input', {
					'type': 'checkbox',
					'checked': settings.auto_refresh || false,
					'id': 'input-auto-refresh'
				}),
				' 启用自动刷新'
			])
		]),

		// 提交按钮
		E('div', { 'class': 'form-actions' }, [
			E('button', {
				'class': 'sh-btn sh-btn-primary',
				'type': 'submit',
				'click': function(ev) {
					ev.preventDefault();
					self.handleSaveSettings();
				}
			}, '保存设置')
		])
	]);
},

handleSaveSettings: function() {
	var hostname = document.getElementById('input-hostname').value;
	var refreshInterval = parseInt(document.getElementById('input-refresh').value);
	var autoRefresh = document.getElementById('input-auto-refresh').checked;

	// 验证
	if (!hostname) {
		ui.addNotification(null, E('p', _('主机名是必填项')), 'error');
		return;
	}

	if (refreshInterval < 10 || refreshInterval > 300) {
		ui.addNotification(null, E('p', _('刷新间隔必须在 10 到 300 秒之间')), 'error');
		return;
	}

	// 通过 API 保存
	API.saveSettings(hostname, refreshInterval, autoRefresh).then(function(result) {
		if (result.success) {
			ui.addNotification(null, E('p', _('设置保存成功')), 'success');
		} else {
			ui.addNotification(null, E('p', _('保存设置失败: %s').format(result.message)), 'error');
		}
	});
}
```

---

## 模块特定说明

### System Hub (luci-app-system-hub)
- **复杂度:** 高 - 9 个标签页，众多功能
- **关键功能:** 健康监控、服务管理、系统日志、备份/恢复
- **特殊要求:** 与 SecuBox 集成获取组件列表
- **依赖:** 调用 `luci.secubox` 进行模块枚举

### WireGuard 仪表板 (luci-app-wireguard-dashboard)
- **复杂度:** 中等
- **关键功能:** 对等节点管理、二维码生成、流量统计
- **特殊要求:** 二维码生成（使用 qrencode 或 JavaScript 库）
- **依赖:** WireGuard 工具（`wg` 命令）

### CrowdSec 仪表板 (luci-app-crowdsec-dashboard)
- **复杂度:** 中等
- **关键功能:** 威胁情报、决策管理、防护器
- **特殊要求:** 解析 CrowdSec CLI 输出
- **依赖:** CrowdSec（`cscli` 命令）

### Netdata 仪表板 (luci-app-netdata-dashboard)
- **复杂度:** 低 - 主要是嵌入 iframe
- **关键功能:** 嵌入式 Netdata 界面、快速指标概览
- **特殊要求:** Netdata API 集成
- **依赖:** Netdata 服务

### 网络模式 (luci-app-network-modes)
- **复杂度:** 高 - UCI 操作
- **关键功能:** 网络拓扑向导、配置预览
- **特殊要求:** UCI 配置验证、回滚机制
- **依赖:** Network、firewall、DHCP 配置

#### 可用模式 (v0.3.6)
生产版本现在包含九个完全支持的配置文件。每个配置文件在 `network-modes.<mode>` 下公开自己的 RPC (`*_config`)、视图和默认值:

| 模式 ID | 描述 | 显著特性 |
| --- | --- | --- |
| `router` | 标准路由器 | NAT + 防火墙、DHCP、代理/HTTPS 前端辅助 |
| `doublenat` | ISP CPE 后面 | WAN DHCP 客户端、隔离的 LAN/访客桥接、UPnP/DMZ 控制 |
| `multiwan` | 双上行链路 | 健康检查、故障转移保持计时器、负载均衡/mwan3 |
| `vpnrelay` | VPN 网关 | WireGuard/OpenVPN、kill switch、DNS 覆盖、分隔隧道 |
| `bridge` | 二层直通 | 无 NAT、所有端口桥接、DHCP 客户端 |
| `accesspoint` | WiFi AP | 桥接上游、禁用路由/DHCP、802.11r/k/v 开关 |
| `relay` | WiFi 中继器 | STA+AP、relayd/WDS、WireGuard 辅助、MTU/MSS 调优 |
| `travel` | 便携路由器 | 客户端 WiFi 扫描、MAC 克隆、WPA3 热点、沙盒 LAN |
| `sniffer` | TAP/嗅探器 | 混杂桥接、Netifyd 集成、pcap 支持 |

添加另一个模式时，更新: UCI 默认值 (`root/etc/config/network-modes`)、RPC 脚本 (`get_<mode>_config`、`update_settings`、`generate_config`、`set_mode` 允许列表)、JS API/视图/菜单和文档。

---

## 故障排除指南

### 问题: "Object not found" 错误

**症状:**
```
RPC call to luci.module-name/method failed with error -32000: Object not found
```

**诊断:**
```bash
# 1. 检查 RPCD 脚本是否存在且可执行
ls -la luci-app-module-name/root/usr/libexec/rpcd/

# 2. 检查 RPCD 脚本名称是否与 ubus 对象匹配
grep "object:" luci-app-module-name/htdocs/luci-static/resources/module-name/api.js

# 3. 手动测试 RPCD 脚本
ssh root@router "/usr/libexec/rpcd/luci.module-name list"

# 4. 检查 RPCD 日志
ssh root@router "logread | grep rpcd | tail -20"
```

**解决方案:**
1. 重命名 RPCD 脚本以匹配 ubus 对象名称（必须包含 `luci.` 前缀）
2. 使脚本可执行: `chmod +x luci.module-name`
3. 重启 RPCD: `/etc/init.d/rpcd restart`
4. 如果已部署则重新安装包

### 问题: 视图未加载 (404)

**症状:**
```
HTTP error 404 while loading class file '/luci-static/resources/view/module-name/overview.js'
```

**诊断:**
```bash
# 1. 检查菜单路径
cat luci-app-module-name/root/usr/share/luci/menu.d/*.json | grep "path"

# 2. 检查视图文件是否存在
ls -la luci-app-module-name/htdocs/luci-static/resources/view/

# 3. 验证路径匹配
# 菜单: "path": "module-name/overview"
# 文件: view/module-name/overview.js
```

**解决方案:**
1. 更新菜单路径以匹配视图文件位置
2. 或移动视图文件以匹配菜单路径
3. 重新构建和重新部署包

### 问题: CSS 未应用

**症状:**
- 页面无样式
- 缺少颜色、字体或布局

**诊断:**
```bash
# 1. 检查浏览器控制台的 CSS 404 错误
# （打开浏览器开发者工具）

# 2. 验证视图文件中的 CSS 导入
grep "stylesheet" luci-app-module-name/htdocs/luci-static/resources/view/*/overview.js

# 3. 检查 CSS 文件是否存在
ls -la luci-app-module-name/htdocs/luci-static/resources/module-name/dashboard.css
```

**解决方案:**
1. 验证 CSS 导入路径: `L.resource('module-name/dashboard.css')`
2. 导入 common.css: `@import url('../system-hub/common.css');`
3. 检查文件权限: CSS 文件为 `644`
4. 清除浏览器缓存 (Ctrl+Shift+R)

### 问题: 数据未更新

**症状:**
- 仪表板显示过时数据
- 自动刷新不工作

**诊断:**
```bash
# 1. 检查 poll 是否已注册
# （在 render() 方法中查找 poll.add()）

# 2. 检查 API 调用是否返回 Promise
# （验证方法从 rpc.declare() 返回结果）

# 3. 直接测试 API 方法
ssh root@router "ubus call luci.module-name status"
```

**解决方案:**
1. 在 render() 方法中添加 poll.add()
2. 验证 poll 回调中的 API 调用返回 Promise
3. 确保 updateDashboard() 更新正确的 DOM 元素
4. 检查浏览器控制台的 JavaScript 错误

---

## 最佳实践

### 1. 代码组织

**应该做:**
- 将相关代码放在一起（API 方法、辅助函数）
- 使用描述性的变量和函数名
- 为复杂逻辑添加注释
- 将大函数拆分为小的辅助函数

**不应该做:**
- 把所有代码放在一个巨大的函数中
- 使用单字母变量名（循环中除外）
- 重复代码 - 改为创建辅助函数
- 在生产代码中保留注释掉的代码

### 2. 错误处理

**应该做:**
```javascript
API.getData().then(function(result) {
	if (result && result.data) {
		// 处理数据
	} else {
		console.warn('没有返回数据');
		// 显示空状态
	}
}).catch(function(error) {
	console.error('API 错误:', error);
	ui.addNotification(null, E('p', '加载数据失败'), 'error');
});
```

**不应该做:**
```javascript
API.getData().then(function(result) {
	// 不检查就处理数据
	result.data.forEach(function(item) { ... }); // 如果 data 为 null 会崩溃
});
```

### 3. 性能

**应该做:**
- 使用 poll.add() 而不是 setInterval 进行自动刷新
- 更新特定 DOM 元素而不是完全重新渲染
- 对搜索输入进行防抖
- 只在需要时才延迟加载数据

**不应该做:**
- 每次更新都重新渲染整个视图
- 轮询过于频繁（<10 秒）
- 预先加载所有数据
- 在 render() 中执行耗时操作

### 4. 用户体验

**应该做:**
- 显示加载状态（旋转器、骨架屏）
- 为操作提供反馈（成功/错误通知）
- 确认破坏性操作（删除、重启）
- 使用描述性的错误消息

**不应该做:**
- 让用户等待而没有反馈
- 静默失败
- 通用错误消息（"发生错误"）
- 允许破坏性操作而不确认

---

## 部署检查清单

部署到生产环境之前:

- [ ] **代码质量**
  - [ ] 所有验证检查通过
  - [ ] 控制台没有 JavaScript 错误
  - [ ] 没有 shell 脚本错误 (shellcheck)
  - [ ] 所有 JSON 文件有效 (jsonlint)

- [ ] **功能**
  - [ ] 所有标签页/页面正确加载
  - [ ] 所有操作按预期工作
  - [ ] 数据正确显示
  - [ ] 自动刷新更新数据
  - [ ] 表单验证输入
  - [ ] 错误处理工作正常

- [ ] **设计**
  - [ ] 视觉上与在线演示匹配
  - [ ] 暗黑模式工作正常
  - [ ] 在移动设备上响应式
  - [ ] 与其他模块一致
  - [ ] 没有布局问题

- [ ] **性能**
  - [ ] 页面快速加载 (<2s)
  - [ ] 自动刷新不会冻结 UI
  - [ ] 没有内存泄漏
  - [ ] 高效的数据获取

- [ ] **安全**
  - [ ] ACL 权限正确
  - [ ] 前端和后端都有输入验证
  - [ ] 没有硬编码的凭据
  - [ ] 安全的命令执行（无注入）

- [ ] **文档**
  - [ ] README.md 已更新
  - [ ] 复杂代码有注释
  - [ ] 菜单条目有描述
  - [ ] ACL 条目有描述

---

## 其他资源

### 文档
- [LuCI API 参考](https://openwrt.github.io/luci/api/)
- [OpenWrt 开发者指南](https://openwrt.org/docs/guide-developer/start)
- [UCI 配置](https://openwrt.org/docs/guide-user/base-system/uci)
- [ubus 文档](https://openwrt.org/docs/techref/ubus)

### 在线演示
- **主演示:** https://secubox.cybermood.eu
- **System Hub:** https://secubox.cybermood.eu/system-hub
- **CrowdSec:** https://secubox.cybermood.eu/crowdsec
- **WireGuard:** https://secubox.cybermood.eu/wireguard

### 内部文档
- [FEATURE-REGENERATION-PROMPTS.md](feature-regeneration-prompts.md) - 所有模块规格
- [CODE-TEMPLATES.md](code-templates.md) - 实现模板
- [DEVELOPMENT-GUIDELINES.md](development-guidelines.md) - 完整开发指南
- [QUICK-START.md](quick-start.md) - 快速参考
- [CLAUDE.md](claude.md) - 构建系统参考

### 工具
- [SecuBox Tools](https://github.com/CyberMind-FR/secubox-openwrt/tree/master/secubox-tools/) - 验证、构建、部署脚本
- [GitHub Actions](https://github.com/CyberMind-FR/secubox-openwrt/tree/master/.github/workflows/) - CI/CD 工作流程
- [Templates](https://github.com/CyberMind-FR/secubox-openwrt/tree/master/templates/) - 模块模板

---

## 获取帮助

如果您遇到本指南未涵盖的问题:

1. **查看现有模块:** 查看工作模块作为参考实现
2. **运行验证:** `./secubox-tools/validate-modules.sh` 进行自动化检查
3. **查看日志:** 在路由器上运行 `logread | grep -i error`
4. **查阅文档:** 阅读 DEVELOPMENT-GUIDELINES.md 获取详细说明
5. **联系支持:** support@cybermind.fr

---

**文档版本:** 1.0.0
**最后更新:** 2025-12-27
**维护者:** CyberMind.fr
**在线演示:** https://secubox.cybermood.eu
