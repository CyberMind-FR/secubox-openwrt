[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# LuCI App - 密钥存储管理器 (KSM)

**版本：** 0.4.0
**最后更新：** 2025-12-28
**状态：** 活跃


适用于 OpenWrt 的集中式加密密钥管理系统，支持 Nitrokey 和 YubiKey 设备的硬件安全模块 (HSM)。

## 概述

密钥存储管理器为 OpenWrt 上的加密密钥、证书、机密和 SSH 密钥管理提供全面的解决方案。它支持基于软件的密钥存储和使用 USB 安全令牌的硬件支持加密操作。

### 功能特性

- **加密密钥管理**
  - 生成 RSA、ECDSA 和 Ed25519 密钥
  - 支持 PEM、DER 和 PKCS#12 格式的密钥导入/导出
  - 支持 shred 的安全删除
  - 密钥元数据跟踪和组织

- **硬件安全模块 (HSM) 支持**
  - 自动检测 Nitrokey 和 YubiKey 设备
  - 芯片上密钥生成
  - PIN 管理和安全
  - 硬件支持的加密操作

- **证书管理**
  - 生成证书签名请求 (CSR)
  - 导入 SSL/TLS 证书
  - 证书链验证
  - 过期警报（< 30 天）

- **机密存储**
  - 加密存储 API 密钥、密码和令牌
  - 分类的机密组织
  - 自动机密轮换（可选）
  - 访问审计日志

- **SSH 密钥管理**
  - 生成 SSH 密钥对（RSA、ECDSA、Ed25519）
  - 将密钥部署到远程主机
  - 支持 SSH 证书
  - 公钥导出和共享

- **审计日志**
  - 全面的活动跟踪
  - 导出日志为 CSV 格式
  - 可过滤的审计时间线
  - 用户操作责任追溯

## 安装

### 依赖项

该模块需要以下软件包：

- `luci-base`
- `rpcd`
- `openssl-util`
- `gnupg2`
- `nitropy`（用于 Nitrokey 支持）
- `yubikey-manager`（用于 YubiKey 支持）
- `opensc`（智能卡框架）
- `libccid`（USB CCID 驱动程序）
- `pcscd`（PC/SC 守护程序）

### 从软件包安装

```bash
# 将软件包传输到路由器
scp luci-app-ksm-manager_*.ipk root@192.168.1.1:/tmp/

# 在路由器上安装
ssh root@192.168.1.1
opkg update
opkg install /tmp/luci-app-ksm-manager_*.ipk

# 重启服务
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### 从源代码编译

```bash
# 在 OpenWrt SDK 中
make package/luci-app-ksm-manager/compile V=s
make package/luci-app-ksm-manager/install

# 软件包将位于 bin/packages/*/base/
```

## 初始设置

### 1. 安装 HSM 驱动程序（如果使用硬件令牌）

对于 Nitrokey 设备：

```bash
opkg install nitropy python3-pip
```

对于 YubiKey 设备：

```bash
opkg install yubikey-manager
```

### 2. 配置 USB 权限

确保您的用户可以访问 USB 设备：

```bash
# 为 Nitrokey 添加 udev 规则
cat > /etc/udev/rules.d/60-nitrokey.rules <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="20a0", ATTR{idProduct}=="42b1", MODE="0660", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="20a0", ATTR{idProduct}=="42b2", MODE="0660", GROUP="plugdev"
EOF

# 为 YubiKey 添加 udev 规则
cat > /etc/udev/rules.d/70-yubikey.rules <<EOF
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", MODE="0660", GROUP="plugdev"
EOF

# 重新加载 udev 规则
udevadm control --reload-rules
```

### 3. 初始化密钥库

访问 LuCI Web 界面：

1. 导航到 **安全 -> 密钥存储管理器 -> 概览**
2. 密钥库将在首次访问时自动初始化
3. 在 **安全 -> 密钥存储管理器 -> 设置** 中配置参数

## 使用指南

### 管理密钥

#### 生成新密钥

1. 进入 **密钥** 选项卡
2. 选择密钥类型（RSA、ECDSA 或 Ed25519）
3. 选择密钥大小（RSA 推荐 4096 位）
4. 输入用于识别的标签
5. 可选设置用于加密的密码短语
6. 点击 **生成**

#### 导入现有密钥

1. 进入 **密钥** 选项卡
2. 滚动到 **导入现有密钥** 部分
3. 输入标签
4. 选择格式（PEM、DER 或 PKCS#12）
5. 粘贴密钥数据或上传文件
6. 如果已加密，输入密码短语
7. 点击 **导入**

#### 导出密钥

1. 在表格中找到密钥
2. 点击 **导出**
3. 选择格式以及是否包含私钥
4. 点击 **导出** 进行下载

### 使用硬件安全模块

#### 初始化 HSM 设备

1. 通过 USB 连接 Nitrokey 或 YubiKey
2. 进入 **HSM 设备** 选项卡
3. 点击 **扫描设备**
4. 选择检测到的设备
5. 点击 **初始化**
6. 设置管理员 PIN（6-32 个字符）
7. 设置用户 PIN（6-32 个字符）

**重要：** 安全存储 PIN。如果忘记，需要恢复出厂设置。

#### 在 HSM 上生成密钥

1. 进入 **HSM 设备** 选项卡
2. 选择已初始化的设备
3. 点击 **生成密钥**
4. 选择密钥类型和大小
5. 输入标签
6. 在提示时提供用户 PIN

在芯片上生成的密钥永远不会离开硬件设备。

### 证书管理

#### 生成证书签名请求 (CSR)

1. 进入 **证书** 选项卡
2. 选择现有密钥或生成新密钥
3. 输入通用名称 (CN)，例如 `example.com`
4. 可选添加组织、国家
5. 点击 **生成**
6. 复制 CSR 并提交给证书颁发机构

#### 导入证书

1. 从 CA 收到签名证书后
2. 进入 **证书** 选项卡
3. 选择关联的密钥
4. 粘贴证书数据（PEM 格式）
5. 可选包含证书链
6. 点击 **导入**

#### 验证证书

1. 在表格中找到证书
2. 点击 **验证**
3. 检查有效性状态、链验证和过期时间

### 管理机密

#### 存储机密

1. 进入 **机密** 选项卡
2. 输入描述性标签（例如 "GitHub API 密钥"）
3. 选择类别（API 密钥、密码、令牌等）
4. 输入机密值
5. 如需要启用自动轮换
6. 点击 **添加**

#### 检索机密

1. 在表格中找到机密
2. 点击 **查看**
3. **警告：** 访问将被记录
4. 复制机密到剪贴板
5. 机密将在 30 秒后自动隐藏

#### 轮换机密

1. 在表格中找到机密
2. 点击 **轮换**
3. 输入新的机密值
4. 确认轮换

### SSH 密钥管理

#### 生成 SSH 密钥对

1. 进入 **SSH 密钥** 选项卡
2. 输入标签
3. 选择密钥类型（推荐 Ed25519）
4. 添加可选注释
5. 点击 **生成**
6. 复制公钥进行部署

#### 部署到远程主机

1. 从列表中选择 SSH 密钥
2. 点击部署部分
3. 输入目标主机名/IP
4. 输入目标用户名
5. 点击 **部署**

或者，手动将公钥复制到远程主机的 `~/.ssh/authorized_keys`。

### 审计日志

#### 查看活动

1. 进入 **审计日志** 选项卡
2. 查看按时间顺序的活动时间线
3. 按日期、用户、操作或资源过滤
4. 日志每 15 秒自动刷新

#### 导出日志

1. 点击 **导出日志 (CSV)**
2. CSV 文件将下载包含所有审计条目
3. 在电子表格软件中打开进行分析

### 设置

#### 配置密钥库

1. 进入 **设置** 选项卡
2. 设置密钥库路径（默认：`/etc/ksm/keystore.db`）
3. 配置自动锁定超时
4. 启用/禁用自动备份
5. 设置备份计划（cron 格式）

#### 审计设置

- 启用/禁用审计日志
- 设置保留期（默认：90 天）
- 选择日志级别（Info、Warning、Error）

#### 告警设置

- 证书过期阈值（默认：30 天）
- 机密轮换提醒
- HSM 断开连接告警

#### 备份和恢复

**创建备份：**
1. 点击 **创建加密备份**
2. 输入强密码短语
3. 确认密码短语
4. 下载加密存档

**恢复备份：**
1. 点击 **从备份恢复**
2. 选择备份文件
3. 输入备份密码短语
4. 确认恢复（将覆盖现有数据）

## 安全最佳实践

### 密钥管理

1. **使用强密码短语：** 最少 16 个字符，包含大小写字母、数字和符号
2. **密钥大小：** 使用 4096 位 RSA 或 Ed25519 以获得最大安全性
3. **安全删除：** 删除敏感密钥时始终启用"安全擦除"
4. **定期轮换：** 每 90 天轮换 SSH 密钥和机密
5. **硬件存储：** 尽可能使用 HSM 存储生产密钥

### HSM 使用

1. **PIN 复杂性：** 使用不同的管理员和用户 PIN（最少 8 个字符）
2. **PIN 存储：** 将 PIN 存储在密码管理器中，而不是设备上
3. **备份令牌：** 保留备份 HSM 设备用于灾难恢复
4. **物理安全：** 不使用时妥善保管 HSM 设备
5. **重试限制：** HSM 在 PIN 尝试失败后会锁定 - 做好相应计划

### 证书管理

1. **监控过期：** 为 30 天内过期的证书启用告警
2. **验证链：** 部署前始终验证证书链
3. **提前续期：** 在过期前 2 周续期证书
4. **吊销：** 保持吊销程序文档化
5. **中间 CA：** 将中间证书与终端实体证书一起存储

### 机密存储

1. **访问日志：** 定期查看审计日志以发现未授权访问
2. **最小权限：** 仅向必要用户授予机密访问权限
3. **自动轮换：** 为 API 密钥和令牌启用
4. **加密：** 机密使用 AES-256-GCM 加密
5. **备份加密：** 始终使用强密码短语加密备份

## 故障排除

### HSM 未检测到

**问题：** Nitrokey 或 YubiKey 未出现在设备列表中

**解决方案：**
1. 检查 USB 连接 - 尝试不同的端口
2. 验证驱动程序已安装：`lsusb` 应显示设备
3. 检查权限：`ls -la /dev/hidraw*`
4. 重启 pcscd：`/etc/init.d/pcscd restart`
5. 检查 `/etc/udev/rules.d/` 中的 udev 规则

### 权限被拒绝错误

**问题：** 无法访问 /dev/hidraw* 或密钥库文件

**解决方案：**
1. 将用户添加到 `plugdev` 组：`usermod -a -G plugdev www-data`
2. 检查文件权限：`ls -la /etc/ksm/`
3. 验证 RPCD 以正确用户运行
4. 检查 `/usr/share/rpcd/acl.d/` 中的 ACL 配置

### 密钥库已锁定

**问题：** 访问密钥时出现"密钥库已锁定"错误

**解决方案：**
1. 通过 设置 -> 密钥库 -> 解锁 进行解锁
2. 检查自动锁定超时设置
3. 验证密钥库文件存在：`/etc/ksm/keystore.db`
4. 检查磁盘空间：`df -h /etc/ksm`

### 证书验证失败

**问题：** 证书链验证错误

**解决方案：**
1. 确保已导入中间证书
2. 检查证书顺序（终端实体 -> 中间 -> 根）
3. 验证证书未过期
4. 检查系统时钟是否正确：`date`
5. 更新 CA 包：`opkg update && opkg upgrade ca-bundle`

### 备份恢复失败

**问题：** 无法从备份恢复

**解决方案：**
1. 验证备份文件完整性（检查文件大小）
2. 确保密码短语正确
3. 检查可用磁盘空间
4. 在其他系统上尝试备份进行测试
5. 如果备份损坏，请联系支持

## API 参考

### RPC 方法

RPCD 后端（`luci.ksm-manager`）提供 22 个方法：

**状态和信息：**
- `status()` - 获取服务状态
- `get_info()` - 获取系统信息

**HSM 管理：**
- `list_hsm_devices()` - 列出已连接的 HSM 设备
- `get_hsm_status(serial)` - 获取 HSM 设备状态
- `init_hsm(serial, admin_pin, user_pin)` - 初始化 HSM
- `generate_hsm_key(serial, key_type, key_size, label)` - 在 HSM 上生成密钥

**密钥管理：**
- `list_keys()` - 列出所有密钥
- `generate_key(type, size, label, passphrase)` - 生成新密钥
- `import_key(label, key_data, format, passphrase)` - 导入密钥
- `export_key(id, format, include_private, passphrase)` - 导出密钥
- `delete_key(id, secure_erase)` - 删除密钥

**证书管理：**
- `generate_csr(key_id, subject_dn, san_list)` - 生成 CSR
- `import_certificate(key_id, cert_data, chain)` - 导入证书
- `list_certificates()` - 列出证书
- `verify_certificate(cert_id)` - 验证证书

**机密管理：**
- `store_secret(label, secret_data, category, auto_rotate)` - 存储机密
- `retrieve_secret(secret_id)` - 检索机密
- `list_secrets()` - 列出机密
- `rotate_secret(secret_id, new_secret_data)` - 轮换机密

**SSH 管理：**
- `generate_ssh_key(label, key_type, comment)` - 生成 SSH 密钥
- `deploy_ssh_key(key_id, target_host, target_user)` - 部署 SSH 密钥

**审计：**
- `get_audit_logs(limit, offset, filter_type)` - 获取审计日志

## 文件位置

- **密钥库数据库：** `/etc/ksm/keystore.db`
- **配置：** `/etc/ksm/config.json`
- **密钥：** `/etc/ksm/keys/`
- **证书：** `/etc/ksm/certs/`
- **机密：** `/etc/ksm/secrets/`
- **审计日志：** `/var/log/ksm-audit.log`
- **RPCD 后端：** `/usr/libexec/rpcd/luci.ksm-manager`

## 开发

### 项目结构

```
luci-app-ksm-manager/
├── Makefile
├── README.md
├── htdocs/luci-static/resources/
│   ├── view/ksm-manager/
│   │   ├── overview.js
│   │   ├── keys.js
│   │   ├── hsm.js
│   │   ├── certificates.js
│   │   ├── secrets.js
│   │   ├── ssh.js
│   │   ├── audit.js
│   │   └── settings.js
│   └── ksm-manager/
│       └── api.js
└── root/
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.ksm-manager
        └── share/
            ├── luci/menu.d/
            │   └── luci-app-ksm-manager.json
            └── rpcd/acl.d/
                └── luci-app-ksm-manager.json
```

### 运行测试

```bash
# 验证 shell 脚本
shellcheck root/usr/libexec/rpcd/luci.ksm-manager

# 验证 JSON 文件
jsonlint root/usr/share/luci/menu.d/luci-app-ksm-manager.json
jsonlint root/usr/share/rpcd/acl.d/luci-app-ksm-manager.json

# 测试 RPCD 方法
ubus call luci.ksm-manager status
ubus call luci.ksm-manager list_keys
```

## 贡献

欢迎贡献！请：

1. 遵循 OpenWrt 编码标准
2. 提交前在实际硬件上测试
3. 为新功能更新文档
4. 包含验证测试

## 许可证

Copyright (C) 2025 SecuBox Project

根据 Apache License, Version 2.0 授权

## 支持

- **Issues：** [GitHub Issues](https://github.com/secubox/luci-app-ksm-manager/issues)
- **文档：** [SecuBox Wiki](https://wiki.secubox.org)
- **论坛：** [OpenWrt Forum - SecuBox](https://forum.openwrt.org/tag/secubox)

## 更新日志

### 版本 1.0.0 (2025-01-XX)

- 初始版本
- 完整 HSM 支持（Nitrokey、YubiKey）
- 加密密钥管理
- 带 CSR 生成的证书管理
- 加密的机密存储
- SSH 密钥管理和部署
- 全面的审计日志
- 备份和恢复功能
