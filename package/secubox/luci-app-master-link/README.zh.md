[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI App Master-Link

SecuBox Master-Link 网状网络管理的 LuCI Web 界面。

## 安装

```bash
opkg install luci-app-master-link
```

需要 `secubox-master-link`（自动作为依赖项安装）。

## 访问

在 LuCI 菜单中选择 **SecuBox > 网状管理**。

## 选项卡

### 概览

根据节点角色进行调整：

- **主节点**：角色徽章、网状统计（对等节点、深度、链高度）、生成令牌按钮（带有可用于二维码的 URL）
- **对等节点**：角色徽章、上游主节点信息、自身深度、同步状态
- **子主节点**：上游信息 + 下游对等节点数量

### 加入请求（仅限主节点/子主节点）

- 表格：主机名、IP、指纹、时间戳、状态
- 操作：批准、拒绝、提升为子主节点
- 每 10 秒自动刷新

### 网状树

- 层次视图：主节点 → 对等节点 → 子主节点 → 其对等节点
- 深度指示器和角色徽章
- 每个节点的在线/离线状态

## RPCD 方法

所有调用通过 `luci.master_link` ubus 对象进行：

| 方法 | 描述 |
|------|------|
| `status` | 节点状态和网状统计 |
| `peers` | 列出所有对等节点及加入详情 |
| `tree` | 网状拓扑树 |
| `token_generate` | 创建一次性加入令牌 |
| `approve` | 批准、拒绝或提升对等节点 |
| `token_cleanup` | 删除过期令牌 |

## 文件

| 文件 | 用途 |
|------|------|
| `root/usr/share/luci/menu.d/luci-app-master-link.json` | 菜单入口 |
| `root/usr/share/rpcd/acl.d/luci-app-master-link.json` | ACL 权限 |
| `root/usr/libexec/rpcd/luci.master_link` | RPCD 端点 |
| `htdocs/luci-static/resources/view/secubox/master-link.js` | LuCI 视图 |

## 许可证

Apache-2.0
