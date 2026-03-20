# ZKP Hamiltonian

:globe_with_meridians: **语言:** [English](README.md) | [Français](README.fr.md) | 中文

基于哈密顿回路问题（Blum 1986）的零知识证明（ZKP）库，通过 Fiat-Shamir 启发式实现 NIZK 转换。

**CyberMind.FR / SecuBox** — 版本 0.1.0

## 概述

该库实现了一个零知识证明（ZKP）协议，允许证明者向验证者证明其知道图中的哈密顿回路，而无需透露回路本身。

### 安全属性

- **完备性**：诚实的证明者拥有 H 的知识时总能说服验证者
- **可靠性**：欺骗者失败的概率 >= 1 - 2^(-128)
- **零知识性**：验证者不会了解到关于 H 的任何信息

## 构建

### 前提条件

- CMake >= 3.16
- OpenSSL（用于 SHA3-256）
- C99 编译器

### 构建命令

```bash
mkdir build && cd build
cmake ..
make

# 运行测试
ctest --output-on-failure

# 或单独运行测试
./test_crypto
./test_graph
./test_protocol
./test_nizk
```

### OpenWrt 构建

```bash
make package/zkp-hamiltonian/compile V=s
```

## 使用方法

### CLI 工具

#### 生成密钥对

```bash
zkp_keygen -n 50 -r 1.0 -o identity
# 创建：identity.graph（公开）、identity.key（保密！）
```

#### 生成证明

```bash
zkp_prover -g identity.graph -k identity.key -o auth.proof
```

#### 验证证明

```bash
zkp_verifier -g identity.graph -p auth.proof
# 退出码：0=接受，1=拒绝，2=错误
```

### C API

```c
#include "zkp_hamiltonian.h"

// 生成密钥对
Graph G;
HamiltonianCycle H;
zkp_generate_graph(50, 1.0, &G, &H);

// 证明者：生成证明
NIZKProof proof;
zkp_prove(&G, &H, &proof);

// 验证者：验证证明
ZKPResult result = zkp_verify(&G, &proof);
if (result == ZKP_ACCEPT) {
    // 已认证！
}
```

## 协议概述

1. **设置**：证明者生成 (G, H)，其中 H 是 G 中的哈密顿回路
2. **证明生成**：
   - 生成随机排列 pi
   - 计算 G' = pi(G)
   - 使用 SHA3-256 对 G' 中的每条边进行承诺
   - 通过 Fiat-Shamir 计算挑战：c = H(G, G', 承诺)
   - 如果 c=0：揭示 pi 和所有 nonce（同构证明）
   - 如果 c=1：揭示 pi(H) 和回路边的 nonce（哈密顿证明）
3. **验证**：
   - 重新计算 Fiat-Shamir 挑战
   - 验证响应是否匹配承诺

## 文件结构

```
zkp-hamiltonian/
├── include/
│   ├── zkp_types.h       # 类型定义
│   ├── zkp_crypto.h      # 密码学原语
│   ├── zkp_graph.h       # 图操作
│   └── zkp_hamiltonian.h # 主 API
├── src/
│   ├── zkp_crypto.c      # SHA3-256、承诺、RNG
│   ├── zkp_graph.c       # 图操作
│   ├── zkp_prove.c       # NIZK 证明生成
│   ├── zkp_verify.c      # NIZK 证明验证
│   └── zkp_serialize.c   # 二进制序列化
├── tests/
│   ├── test_crypto.c     # 密码学原语测试
│   ├── test_graph.c      # 图操作测试
│   ├── test_protocol.c   # 协议完备性/可靠性
│   └── test_nizk.c       # 完整 NIZK 测试 + 基准测试
├── tools/
│   ├── zkp_keygen.c      # 密钥生成 CLI
│   ├── zkp_prover.c      # 证明生成 CLI
│   └── zkp_verifier.c    # 证明验证 CLI
├── CMakeLists.txt
└── README.md
```

## 配置

### 构建选项（CMake）

| 选项 | 默认值 | 描述 |
|------|--------|------|
| `OPENWRT_BUILD` | OFF | 启用 OpenWrt 优化 |
| `BUILD_TESTS` | ON | 构建测试可执行文件 |
| `BUILD_TOOLS` | ON | 构建 CLI 工具 |
| `BUILD_SHARED_LIBS` | OFF | 构建共享库 |
| `ZKP_MAX_N` | 128 | 最大图节点数 |

### 推荐参数

| 参数 | 推荐值 | 描述 |
|------|--------|------|
| n（节点） | 50-80 | 图大小 |
| extra_ratio | 0.5-1.5 | 诱饵边比例 |

## SecuBox 集成

详见 `SECUBOX_INTEGRATION.md`：
- 与 `secubox-auth` 集成
- 网络协议（ZKP_HELLO、ZKP_PROOF 等）
- UCI 配置
- LuCI 仪表板

## 许可证

GPL-2.0-or-later

Copyright (C) 2026 CyberMind.FR / SecuBox
