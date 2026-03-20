[English](README.md) | [Francais](README.fr.md) | 中文

# OpenWrt Auth Guardian

**版本:** 0.4.0
**最后更新:** 2025-12-28
**状态:** 活跃

全面的身份验证和会话管理系统。

## 功能特性

### 强制门户
- 可定制的欢迎页面
- Logo 和品牌支持
- 服务条款接受

### OAuth 集成
- Google 登录
- GitHub 认证
- Facebook 登录
- Twitter/X 登录

### 凭证系统
- 生成访问码
- 限时有效期
- 带宽限制

### 会话管理
- 安全 Cookie（HttpOnly、SameSite）
- 会话超时控制
- 并发会话限制

### 绕过规则
- MAC 白名单
- IP 白名单
- 域名例外

## 安装

```bash
opkg update
opkg install luci-app-auth-guardian
```

## 许可证

MIT 许可证 - CyberMind Security
