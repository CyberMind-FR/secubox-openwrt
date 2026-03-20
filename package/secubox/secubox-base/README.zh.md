[English](README.md) | [Francais](README.fr.md) | [中文](README.zh.md)

# SecuBox 基础工具

其他 SecuBox 包使用的共享工具脚本。这不是一个可编译的 OpenWrt 包 -- 它提供通用的 shell 函数和辅助脚本，供其他 SecuBox 组件引用或调用。

## 关键文件

| 路径 | 描述 |
|------|------|
| `/usr/sbin/secubox-network-health` | 网络健康监控脚本 |

## 使用方法

网络健康监控器可以直接运行：

```bash
/usr/sbin/secubox-network-health
```

## 注意

此包可能在未来版本中被合并到 `secubox-core`。新的共享工具应该添加到 `secubox-core` 中。

## 许可证

Apache-2.0
