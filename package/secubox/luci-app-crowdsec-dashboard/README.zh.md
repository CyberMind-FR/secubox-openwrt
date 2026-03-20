[English](README.md) | [Francais](README.fr.md) | 中文

# LuCI CrowdSec 仪表板

**版本:** 0.4.0
**最后更新:** 2025-12-28
**状态:** 活跃

一个现代化、响应式、动态的仪表板，用于监控 OpenWrt 路由器上的 CrowdSec 安全系统。

![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02%2B-blue)
![CrowdSec](https://img.shields.io/badge/CrowdSec-1.4%2B-green)

<p align="center">
  <img src="screenshots/overview.png" alt="仪表板概览" width="800">
</p>

## 功能特性

- **实时概览** - 一目了然地监控活跃封禁、警报和 bouncer 状态
- **决策管理** - 直接从界面查看、搜索、过滤和管理 IP 封禁
- **警报历史** - 浏览和分析安全警报，包含详细事件信息
- **指标仪表板** - CrowdSec 引擎指标、解析器和场景的综合视图
- **响应式设计** - 在桌面、平板和移动设备上完美运行
- **自动刷新** - 数据每 30-60 秒自动更新
- **深色主题** - 针对低光环境优化的工业网络安全美学

## 安装

### 从 OpenWrt 软件包仓库安装（推荐）

```bash
opkg update
opkg install luci-app-crowdsec-dashboard
```

### 手动安装

1. 从 [Releases](https://github.com/YOUR_USERNAME/luci-app-crowdsec-dashboard/releases) 页面下载最新版本

2. 传输到您的 OpenWrt 设备：
```bash
scp luci-app-crowdsec-dashboard_*.ipk root@router:/tmp/
```

3. 安装软件包：
```bash
opkg install /tmp/luci-app-crowdsec-dashboard_*.ipk
```

4. 重启 uhttpd：
```bash
/etc/init.d/uhttpd restart
/etc/init.d/rpcd restart
```

### 从源码编译

1. 克隆到您的 OpenWrt 编译环境：
```bash
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/YOUR_USERNAME/luci-app-crowdsec-dashboard.git
```

2. 更新 feeds 并选择软件包：
```bash
cd ~/openwrt
./scripts/feeds update -a
./scripts/feeds install -a
make menuconfig
# 导航至 LuCI → Applications → luci-app-crowdsec-dashboard
```

3. 编译：
```bash
make package/luci-app-crowdsec-dashboard/compile V=s
```

## 系统要求

- OpenWrt 21.02 或更高版本
- 已安装并运行的 CrowdSec 安全引擎
- CrowdSec Firewall Bouncer（推荐）
- LuCI Web 界面

### 推荐的 CrowdSec 软件包：
```bash
opkg install crowdsec crowdsec-firewall-bouncer
```

## 截图

### 概览仪表板
实时统计、热门场景和国家可视化。

### 决策管理器
功能完整的表格，支持搜索、排序、批量操作和手动封禁。

### 警报历史
所有安全事件的时间顺序视图，带过滤选项。

### 指标视图
详细的引擎指标、bouncer 状态和 hub 组件。

## 架构

```
luci-app-crowdsec-dashboard/
├── Makefile                          # OpenWrt 编译指令
├── htdocs/
│   └── luci-static/resources/
│       ├── crowdsec-dashboard/
│       │   ├── api.js               # RPC API 模块
│       │   └── dashboard.css        # 网络安全主题样式
│       └── view/crowdsec-dashboard/
│           ├── overview.js          # 主仪表板视图
│           ├── decisions.js         # 决策管理
│           ├── alerts.js            # 警报历史
│           └── metrics.js           # 指标显示
├── root/
│   ├── usr/libexec/rpcd/
│   │   └── crowdsec                 # RPCD 后端（shell 脚本）
│   └── usr/share/
│       ├── luci/menu.d/             # 菜单配置
│       └── rpcd/acl.d/              # ACL 权限
└── po/                              # 翻译文件
```

## API 端点

仪表板通过 `crowdsec` RPCD 模块使用 ubus RPC 调用：

| 方法 | 描述 |
|------|------|
| `decisions` | 获取所有活跃决策 |
| `alerts` | 获取警报历史（带限制） |
| `metrics` | 获取 Prometheus 指标 |
| `bouncers` | 列出已注册的 bouncers |
| `machines` | 列出已注册的机器 |
| `hub` | 获取 hub 状态（集合、解析器、场景） |
| `status` | 获取服务状态 |
| `stats` | 获取聚合的仪表板统计 |
| `ban` | 添加手动 IP 封禁 |
| `unban` | 移除 IP 封禁 |

## 自定义

### 更改主题

编辑 `/htdocs/luci-static/resources/crowdsec-dashboard/dashboard.css`：

```css
:root {
    --cs-bg-primary: #0a0e14;
    --cs-accent-green: #00d4aa;
    /* ... 根据需要修改颜色 */
}
```

### 添加新指标

1. 在 `/root/usr/libexec/rpcd/crowdsec` 中添加 RPC 方法
2. 在 `/htdocs/luci-static/resources/crowdsec-dashboard/api.js` 中声明 RPC 调用
3. 在相应的视图文件中创建 UI 组件

## 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 此仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m '添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 Apache License 2.0 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 致谢

- [CrowdSec](https://crowdsec.net/) - 开源安全引擎
- [OpenWrt](https://openwrt.org/) - 让您的网络由您做主的自由
- [LuCI](https://github.com/openwrt/luci) - OpenWrt 配置界面

## 联系方式

**Gandalf** - CyberMind.fr

- 网站：[https://cybermind.fr](https://cybermind.fr)
- GitHub：[@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

<p align="center">
  为 OpenWrt 和 CrowdSec 社区倾心打造
</p>
