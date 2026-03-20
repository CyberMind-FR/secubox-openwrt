# SecuBox WebUI 原型器

[English](README.md) | [Francais](README.fr.md) | 中文

FastAPI + Jinja2 模拟器，在本地工作站上模拟类似 LuCI 的 SecuBox 插件/模块管理。它虚拟化模块、预设和命令管道，使开发人员无需路由器即可进行实验。

## 功能
- **模块目录**：浏览 29+ 个自动导入的 SecuBox 模块，从软件包获取实时元数据
- **AppStore**：带有分类、搜索、评分和评论的市场界面
- **组件注册表**：来自已安装模块的可复用 UI 组件
- **配置文件**：为不同用例捆绑模块和预设
- **模板生成器**：UCI/network/firewall 配置模板
- **设置**：主题切换、语言、后端连接（虚拟化/SSH/HTTP）
- **多主题支持**：SecuBox Light + LuCI Dark 无缝切换
- **预设运行器**：模拟多命令管道，聚合结果/日志
- **自定义上下文控制台**：向预设执行注入 JSON 覆盖
- **HTMX 集成**：无需页面重载的部分更新动态 UI
- **Alpine.js 状态**：客户端响应性和 toast 通知

## 开始使用
```bash
cd secubox-tools/webui
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]  # 或根据偏好使用 UV/Poetry
uvicorn app.main:app --reload --port 8100
```

然后访问 `http://127.0.0.1:8100/` 并通过页眉控件切换主题。

## 项目结构
```
webui/
  app/                # FastAPI 应用程序包
  data/               # 模块、预设、命令的固定数据目录
  templates/          # Jinja2 模板 + 多主题层次结构
  static/             # Tailwind 就绪的 CSS（目前手工制作）
  scripts/            # 未来的导入/自动化辅助工具
```

## 重新生成模块目录
UI 现在从 `package/secubox/*` 和根目录 `luci-*` 目录导入实时元数据。编辑软件包后运行辅助脚本刷新 `data/modules.json`：

```bash
# 通过辅助脚本
cd secubox-tools/webui
./scripts/ingest_packages.py --pretty

# 或使用已安装的 CLI 入口点
secubox-webui-ingest --pretty
```

此解析器读取每个 Makefile（LUCI_TITLE、VERSION、DESCRIPTION 等），派生友好的名称/标签，并为虚拟化模拟分配默认的安全上下文/操作。

## 状态

### 已完成
- 完整导航，包含 6 个主要部分（模块、AppStore、组件、配置文件、模板、设置）
- 从仓库实时导入软件包元数据
- 多主题系统（SecuBox Light / LuCI Dark）
- 带命令模拟的预设虚拟化引擎
- HTMX + Alpine.js 集成实现动态 UI
- 带分类、搜索、评分和评论的 AppStore
- 所有 HTML 模板已实现
- 响应式卡片布局
- 用于编程访问的 API 端点

### 下一步
1. **连接交互功能**：启用安装/卸载、配置文件激活、模板生成
2. **后端集成**：通过 SSH 或 HTTP API 连接到真实 OpenWrt 设备
3. **扩展导入流程**：从软件包元数据（ACL、README 检查清单）派生预设/命令
4. **认证**：为多用户部署添加会话管理
5. **容器化 Dry-run**：扩展虚拟化引擎以在隔离容器中运行
6. **实时更新**：WebSocket 支持实时系统监控
