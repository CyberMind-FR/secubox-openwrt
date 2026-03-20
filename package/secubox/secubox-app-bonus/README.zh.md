# luci-app-secubox-bonus

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

SecuBox 附加内容包 - SecuBox 模块的营销和文档网站。

## 描述

此软件包提供官方 SecuBox 文档、演示和营销内容，以静态 HTML 页面形式通过路由器的 Web 界面访问。

## 内容

- **演示页面**（16 个模块）：SecuBox 模块的交互式演示
  - Auth Guardian、Bandwidth Manager、CDN Cache、Client Guardian
  - CrowdSec、KSM Manager、Media Flow、Netdata、Netifyd
  - Network Modes、SecuBox Hub、Traffic Shaper、VHost Manager、WireGuard

- **博客文章**：安装指南和教程
  - Auth Guardian 安装指南
  - Bandwidth Manager 指南
  - 使用 VHost Manager 的本地 SaaS

- **营销**：活动和着陆页面

- **国际化**：多语言支持（13 种语言）
  - 英语、法语、德语、西班牙语、葡萄牙语、意大利语
  - 荷兰语、俄语、阿拉伯语、中文、日语、韩语、印地语

## 安装

### 从软件包

```bash
opkg update
opkg install luci-app-secubox-bonus
```

### 从源码

```bash
make package/luci-app-secubox-bonus/compile
```

## 访问

安装后，内容可在以下位置访问：

```
http://<路由器IP>/luci-static/secubox/
```

### URLs

- 主页：`/luci-static/secubox/index.html`
- 演示页面：`/luci-static/secubox/demo-<module>.html`
- 博客文章：`/luci-static/secubox/blog/<article>.html`
- 活动页面：`/luci-static/secubox/campaign.html`

## 文件结构

```
/www/luci-static/secubox/
├── index.html                    # 主着陆页
├── campaign.html                 # 营销活动
├── demo-*.html                   # 模块演示（16 个文件）
├── blog/                         # 教程和指南
│   ├── auth-guardian-setup.html
│   ├── bandwidth-manager-guide.html
│   └── local-saas-vhost.html
└── i18n/                         # 翻译（13 种语言）
    └── *.json
```

## 软件包信息

- **版本**：0.1.0-1
- **许可证**：Apache-2.0
- **维护者**：CyberMind <contact@cybermind.fr>
- **大小**：约 500KB（36 个文件）
- **依赖**：luci-base

## 开发

源内容在 `secubox-website` 仓库中维护，并在构建期间同步到此软件包。

### 更新内容

要更新网站内容：

1. 更新 `~/CyberMindStudio/_files/secubox-website/` 中的文件
2. 重新构建软件包或使用部署脚本：

```bash
./secubox-tools/deploy-website.sh root@192.168.8.205 ~/CyberMindStudio/_files/secubox-website
```

## 注意事项

- 此软件包仅包含静态文件（HTML、JS、JSON）
- 不需要后端/RPCD 组件
- 无菜单集成 - 通过直接 URL 访问内容
- 文件为只读，由 uhttpd 提供服务
- 内容更新需要重新安装软件包或手动部署

## 另请参阅

- `luci-app-secubox` - SecuBox Hub（主控制面板）
- `luci-theme-secubox` - SecuBox 主题和 UI 组件
- 文档：https://secubox.cybermood.eu/
