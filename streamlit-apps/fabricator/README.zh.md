# SecuBox Fabricator

🌐 **语言：** [English](README.md) | [Français](README.fr.md) | 中文

SecuBox 平台的小部件和组件构建器。

## 功能

7 个选项卡用于构建 SecuBox 组件：

1. **📊 收集器** - 统计收集器构建器（带 cron 的 shell 脚本）
2. **🚀 应用** - Streamlit 应用部署器
3. **📝 博客** - MetaBlogizer 站点管理
4. **🌐 静态页面** - 静态 HTML 页面生成器
5. **🔌 服务** - 服务暴露（Emancipate）
6. **🧩 小部件** - HTML 小部件设计器
7. **🪟 嵌入器** - 门户页面构建器（嵌入应用/服务/博客）

## 部署

```bash
# 复制到路由器
scp app.py root@192.168.255.1:/srv/streamlit/apps/fabricator/

# 注册实例
uci set streamlit.fabricator=instance
uci set streamlit.fabricator.name=fabricator
uci set streamlit.fabricator.app=fabricator
uci set streamlit.fabricator.port=8520
uci set streamlit.fabricator.enabled=1
uci commit streamlit

# 重启
/etc/init.d/streamlit restart
```

## 解放

```bash
streamlitctl emancipate fabricator fabric.gk2.secubox.in
```

## 访问

- 本地：http://192.168.255.1:8520
- 外部：https://fabric.gk2.secubox.in
