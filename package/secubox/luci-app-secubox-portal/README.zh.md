[English](README.md) | [Francais](README.fr.md) | 中文

# SecuBox Portal

所有 SecuBox 应用程序的统一 Web UI 入口点 -- 提供顶级 SecuBox 导航和选项卡式仪表板。

## 安装

```bash
opkg install luci-app-secubox-portal
```

## 访问

LuCI > SecuBox（顶级菜单）

## 板块

- **仪表板** -- 所有 SecuBox 服务的聚合概览
- **服务** -- 服务子菜单容器
- **应用** -- 应用启动器和目录
- **设置** -- 全局 SecuBox 设置

### 公共页面（无需登录）

- 漏洞赏金
- 众筹活动
- 开发状态

## 依赖项

- `luci-base`
- `luci-theme-secubox`

## 许可证

Apache-2.0
