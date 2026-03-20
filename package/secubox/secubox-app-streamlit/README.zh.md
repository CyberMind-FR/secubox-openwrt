# SecuBox Streamlit Platform

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

适用于 OpenWrt 的多实例 Streamlit 托管平台，支持 LXC 容器和 Gitea 集成。

## 功能特性

- **多实例支持**：在不同端口运行多个 Streamlit 应用
- **基于文件夹的应用**：每个应用在独立目录中包含其依赖
- **Gitea 集成**：直接从 Gitea 仓库克隆和同步应用
- **LXC 隔离**：应用在隔离的 Alpine Linux 容器中运行
- **自动依赖安装**：自动处理 `requirements.txt`

## 快速开始

### 1. 安装并启用

```bash
opkg install secubox-app-streamlit
/etc/init.d/streamlit enable
streamlitctl install
```

### 2. 创建您的第一个应用

```bash
streamlitctl app create myapp
streamlitctl instance add myapp 8502
/etc/init.d/streamlit restart
```

访问：`http://<device-ip>:8502`

## 从 Gitea 部署

该平台与 Gitea 集成，支持版本控制的应用部署。

### 配置 Gitea 凭证

```bash
# 配置 Gitea 连接
uci set streamlit.gitea.enabled=1
uci set streamlit.gitea.url='http://192.168.255.1:3000'
uci set streamlit.gitea.user='admin'
uci set streamlit.gitea.token='your-access-token'
uci commit streamlit

# 在容器中存储 git 凭证
streamlitctl gitea setup
```

### 从 Gitea 仓库克隆应用

**方法 1：使用 streamlitctl（推荐）**

```bash
# 使用仓库简写克隆（用户/仓库）
streamlitctl gitea clone yijing CyberMood/yijing-oracle

# 在指定端口添加实例
streamlitctl instance add yijing 8505

# 重启以应用更改
/etc/init.d/streamlit restart
```

**方法 2：手动克隆 + UCI 配置**

```bash
# 直接克隆到 apps 目录
git clone http://192.168.255.1:3000/CyberMood/yijing-oracle.git /srv/streamlit/apps/yijing

# 在 UCI 中注册
uci set streamlit.yijing=app
uci set streamlit.yijing.name='Yijing Oracle'
uci set streamlit.yijing.path='yijing/app.py'
uci set streamlit.yijing.enabled='1'
uci set streamlit.yijing.port='8505'
uci commit streamlit

# 添加实例并重启
streamlitctl instance add yijing 8505
/etc/init.d/streamlit restart
```

### 从 Gitea 更新应用

```bash
# 拉取最新更改
streamlitctl gitea pull yijing

# 重启以应用更改
/etc/init.d/streamlit restart
```

## 应用文件夹结构

每个应用位于 `/srv/streamlit/apps/<appname>/`：

```
/srv/streamlit/apps/myapp/
├── app.py              # 主入口点（或 main.py、<appname>.py）
├── requirements.txt    # Python 依赖（自动安装）
├── .streamlit/         # 可选的 Streamlit 配置
│   └── config.toml
└── ...                 # 其他文件（pages/、data/ 等）
```

**主文件检测顺序**：`app.py` > `main.py` > `<appname>.py` > 第一个 `.py` 文件

## CLI 参考

### 容器管理

```bash
streamlitctl install      # 设置 LXC 容器
streamlitctl uninstall    # 移除容器（保留应用）
streamlitctl update       # 更新 Streamlit 版本
streamlitctl status       # 显示平台状态
streamlitctl logs [app]   # 查看日志
streamlitctl shell        # 打开容器 shell
```

### 应用管理

```bash
streamlitctl app list                    # 列出所有应用
streamlitctl app create <name>           # 创建新的应用文件夹
streamlitctl app delete <name>           # 删除应用
streamlitctl app deploy <name> <path>    # 从路径/归档部署
```

### 实例管理

```bash
streamlitctl instance list               # 列出实例
streamlitctl instance add <app> <port>   # 添加实例
streamlitctl instance remove <name>      # 移除实例
streamlitctl instance start <name>       # 启动单个实例
streamlitctl instance stop <name>        # 停止单个实例
```

### Gitea 集成

```bash
streamlitctl gitea setup                 # 配置 git 凭证
streamlitctl gitea clone <name> <repo>   # 从 Gitea 克隆
streamlitctl gitea pull <name>           # 拉取最新更改
```

## UCI 配置

主配置：`/etc/config/streamlit`

```
config streamlit 'main'
    option enabled '1'
    option http_port '8501'
    option data_path '/srv/streamlit'
    option memory_limit '512M'

config streamlit 'gitea'
    option enabled '1'
    option url 'http://192.168.255.1:3000'
    option user 'admin'
    option token 'your-token'

config app 'myapp'
    option name 'My App'
    option enabled '1'
    option repo 'user/myapp'

config instance 'myapp'
    option app 'myapp'
    option port '8502'
    option enabled '1'
```

## 示例：完整的 Gitea 工作流

```bash
# 1. 在 Gitea 中创建包含 Streamlit 应用的仓库
#    - app.py（主文件）
#    - requirements.txt（依赖）

# 2. 配置 streamlit 平台
uci set streamlit.gitea.enabled=1
uci set streamlit.gitea.url='http://192.168.255.1:3000'
uci set streamlit.gitea.user='admin'
uci set streamlit.gitea.token='abc123'
uci commit streamlit

# 3. 克隆并部署
streamlitctl gitea setup
streamlitctl gitea clone myapp admin/my-streamlit-app
streamlitctl instance add myapp 8502
/etc/init.d/streamlit restart

# 4. 访问应用
curl http://192.168.255.1:8502

# 5. 代码更改时从 Gitea 更新
streamlitctl gitea pull myapp
/etc/init.d/streamlit restart
```

## HAProxy 集成

通过 HAProxy vhost 暴露 Streamlit 应用：

```bash
# 为应用添加后端
uci add haproxy backend
uci set haproxy.@backend[-1].name='streamlit_myapp'
uci set haproxy.@backend[-1].mode='http'
uci add_list haproxy.@backend[-1].server='myapp 192.168.255.1:8502'
uci commit haproxy

# 添加 vhost
uci add haproxy vhost
uci set haproxy.@vhost[-1].name='myapp_vhost'
uci set haproxy.@vhost[-1].domain='myapp.example.com'
uci set haproxy.@vhost[-1].backend='streamlit_myapp'
uci set haproxy.@vhost[-1].ssl='1'
uci commit haproxy

/etc/init.d/haproxy restart
```

## 故障排除

**容器无法启动：**
```bash
streamlitctl status
lxc-info -n streamlit
```

**应用无法加载：**
```bash
streamlitctl logs myapp
streamlitctl shell
# 在容器内：
cd /srv/apps/myapp && streamlit run app.py
```

**git 克隆失败：**
```bash
# 检查凭证
streamlitctl gitea setup
# 手动测试
git clone http://admin:token@192.168.255.1:3000/user/repo.git /tmp/test
```

## 许可证

Copyright (C) 2025 CyberMind.fr
