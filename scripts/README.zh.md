# 文档发布脚本

[English](README.md) | [Francais](README.fr.md) | 中文

**版本：** 1.0.0
**最后更新：** 2025-12-28
**用途：** SecuBox 文档的自动发布脚本

---

## 可用脚本

### 1. setup-wiki.sh
**用途：** 将 DOCS/ 同步到 GitHub Wiki

**使用方法：**
```bash
./scripts/setup-wiki.sh
```

**执行操作：**
- 克隆 wiki 仓库
- 创建带导航的首页
- 创建侧边栏
- 复制所有文档文件
- 修复内部链接为 wiki 格式
- 提交并推送到 wiki

**前提条件：**
- 已安装 Git
- 在 GitHub 仓库设置中启用 Wiki
- 拥有 GitHub 的 SSH 访问权限

**耗时：** 约 2 分钟

---

### 2. setup-github-pages.sh
**用途：** 使用 MkDocs Material 主题创建 GitHub Pages 站点

**使用方法：**
```bash
./scripts/setup-github-pages.sh
```

**执行操作：**
- 如需要则安装 MkDocs
- 创建 mkdocs.yml 配置
- 生成 docs/ 目录结构
- 创建精美的首页
- 复制所有文档文件
- 修复内部链接为 web 格式
- 构建预览站点

**前提条件：**
- 已安装 Python 3.x
- 已安装 pip3
- 约 100MB 磁盘空间

**耗时：** 约 10 分钟（首次）

---

## 选择哪个脚本？

### 使用 `setup-wiki.sh` 如果：
- 您想要快速设置（2 分钟）
- 仅内部文档
- 简单导航即可满足需求
- 不需要主题定制

### 使用 `setup-github-pages.sh` 如果：
- 您想要专业外观
- 公开文档
- 需要自定义域名支持
- 需要深色模式支持
- 需要更好的移动端体验

**我们的建议：** 使用 GitHub Pages 作为 SecuBox 的专业文档。

完整设置说明请参见 [WIKI-SETUP-GUIDE.md](../WIKI-SETUP-GUIDE.md)。

---

## 快速开始

### 选项 1：GitHub Wiki

```bash
# 1. 在 GitHub 设置中启用 Wiki
# 2. 运行脚本
./scripts/setup-wiki.sh

# 3. 访问：
# https://github.com/CyberMind-FR/secubox-openwrt/wiki
```

### 选项 2：GitHub Pages（推荐）

```bash
# 1. 安装依赖
sudo apt-get install python3 python3-pip
pip3 install mkdocs mkdocs-material pymdown-extensions

# 2. 运行脚本
./scripts/setup-github-pages.sh

# 3. 本地测试
mkdocs serve

# 4. 提交并推送
git add mkdocs.yml docs/
git commit -m "Add GitHub Pages documentation"
git push

# 5. 在 GitHub 设置中启用
# Settings → Pages → Source: master, Folder: /docs

# 6. 访问：
# https://gkerma.github.io/secubox-openwrt/
```

---

## 脚本功能

### setup-wiki.sh

| 功能 | 状态 |
|---------|--------|
| 自动克隆 wiki 仓库 | 已完成 |
| 创建首页 | 已完成 |
| 创建侧边栏导航 | 已完成 |
| 复制所有文档 | 已完成 |
| 修复内部链接 | 已完成 |
| 存档整理 | 已完成 |
| 自动提交和推送 | 已完成 |
| 错误处理 | 已完成 |

### setup-github-pages.sh

| 功能 | 状态 |
|---------|--------|
| 依赖检查 | 已完成 |
| 自动安装 MkDocs | 已完成 |
| Material 主题 | 已完成 |
| 深色/浅色模式 | 已完成 |
| 搜索功能 | 已完成 |
| Mermaid 图表 | 已完成 |
| 移动端响应式 | 已完成 |
| 自定义 CSS | 已完成 |
| 存档整理 | 已完成 |
| 构建预览 | 已完成 |
| 链接修复 | 已完成 |
| 错误处理 | 已完成 |

---

## 更新文档

### GitHub Wiki

直接重新运行脚本：
```bash
./scripts/setup-wiki.sh
```

DOCS/ 中的所有更改将同步到 wiki。

### GitHub Pages

```bash
# 选项 1：完全重新同步
./scripts/setup-github-pages.sh

# 选项 2：手动更新
cp DOCS/CHANGED-FILE.md docs/changed-file.md
mkdocs build
git add docs/
git commit -m "Update docs"
git push
```

---

## 故障排除

### setup-wiki.sh

**错误："Wiki repository doesn't exist"**
- 首先在 GitHub 仓库设置中启用 Wiki
- URL：https://github.com/CyberMind-FR/secubox-openwrt/settings

**错误："Permission denied"**
- 确保已为 GitHub 配置 SSH 密钥
- 测试：`ssh -T git@github.com`

### setup-github-pages.sh

**错误："mkdocs: command not found"**
- 安装 MkDocs：`pip3 install mkdocs mkdocs-material`
- 或重新运行脚本（自动安装）

**错误："No module named 'material'"**
- 安装主题：`pip3 install mkdocs-material`

**错误："Build failed"**
- 检查 mkdocs.yml 语法
- 测试：`mkdocs build --strict`
- 检查 Python 版本：`python3 --version`（需要 3.6+）

---

## 比较

| 方面 | Wiki 脚本 | Pages 脚本 |
|--------|-------------|--------------|
| **设置时间** | 2 分钟 | 10 分钟 |
| **依赖** | 仅 Git | Python、MkDocs |
| **结果** | 基础 wiki | 专业站点 |
| **主题** | 默认 | Material Design |
| **功能** | 基础 | 高级 |
| **移动端** | 一般 | 优秀 |
| **SEO** | 基础 | 良好 |
| **自定义域名** | 否 | 是 |

---

## 自定义

### Wiki

编辑 wiki 仓库中生成的文件：
```bash
git clone https://github.com/CyberMind-FR/secubox-openwrt.wiki.git
cd secubox-openwrt.wiki
# 编辑 _Sidebar.md、Home.md 等
git commit -am "Customize wiki"
git push
```

### GitHub Pages

编辑 mkdocs.yml 和 docs/stylesheets/extra.css：
```bash
# 更改主题颜色
vim mkdocs.yml

# 更改自定义样式
vim docs/stylesheets/extra.css

# 重新构建
mkdocs build
```

---

## 支持

**脚本问题：**
- 检查脚本输出中的错误消息
- 验证已安装依赖
- 确保 DOCS/ 目录存在

**需要帮助：**
- 参见：[WIKI-SETUP-GUIDE.md](../WIKI-SETUP-GUIDE.md)
- 创建 GitHub issue
- 邮箱：support@cybermind.fr

---

## 脚本维护

**更新脚本：**
```bash
# 编辑脚本
vim scripts/setup-wiki.sh
vim scripts/setup-github-pages.sh

# 测试更改
./scripts/setup-wiki.sh --dry-run  # （如果已实现）

# 提交
git add scripts/
git commit -m "Update wiki setup scripts"
git push
```

---

**最后更新：** 2025-12-28
**维护者：** CyberMind.fr
**许可证：** Apache-2.0
