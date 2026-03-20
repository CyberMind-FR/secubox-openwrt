# CrowdSec Custom Scenarios for SecuBox

> **Languages:** [English](README.md) | [Francais](README.fr.md) | 中文

用于 SecuBox Web 界面和服务保护的自定义 CrowdSec 配置。

## 安装

```sh
opkg install secubox-app-crowdsec-custom
```

## 包含的场景

- HTTP 认证暴力破解检测
- 路径扫描/枚举检测
- LuCI / uhttpd 认证失败监控
- Nginx 反向代理监控
- HAProxy 后端保护和认证监控
- Gitea Web、SSH 和 API 暴力破解检测
- Streamlit 应用洪水攻击和认证保护
- Webapp 通用认证暴力破解保护
- 受信任网络的白名单增强

## 提供的内容

- `/etc/crowdsec/parsers/` 下的解析器
- `/etc/crowdsec/scenarios/` 下的场景
- `/etc/crowdsec/acquis.d/` 下的采集配置
- 白名单增强配置文件

## 依赖

- `crowdsec`
- `crowdsec-firewall-bouncer`

## 许可证

Apache-2.0
