# 迁移计划: Netifyd 到 nDPId

🌐 **Languages:** [English](../DOCS/MIGRATION-NETIFYD-TO-NDPID.md) | [Français](../DOCS-fr/MIGRATION-NETIFYD-TO-NDPID.md) | 中文

## 执行摘要

本文档提供了一个全面的迁移计划，将 SecuBox OpenWrt 项目中的 **Netifyd v5.2.1** 替换为 **nDPId**，同时保持与现有 CrowdSec 和 Netdata 消费者的完全兼容性。

**关键发现**: Netifyd 和 nDPId 都构建在 **nDPI**（底层 DPI 库）之上。Netifyd 本质上是 nDPI 的一个功能丰富的包装器，带有云集成，而 nDPId 是一个极简、高性能的守护进程，具有微服务架构。

---

## 当前架构分析

### Netifyd 集成概览

| 组件 | 位置 | 用途 |
|------|------|------|
| 基础包 | `secubox-app-netifyd` | Netifyd v5.2.1 DPI 引擎 |
| LuCI 应用 | `luci-app-secubox-netifyd` | 带实时监控的 Web UI |
| RPCD 后端 | `/usr/libexec/rpcd/luci.secubox-netifyd` | 15 个读取 + 9 个写入 RPC 方法 |
| UCI 配置 | `/etc/config/secubox-netifyd` | 功能开关、插件、sinks |
| 状态文件 | `/var/run/netifyd/status.json` | 汇总统计（不是流） |
| Socket | `/var/run/netifyd/netifyd.sock` | JSON 流接口 |
| 收集器 | `/usr/bin/netifyd-collector` | 周期性统计到 `/tmp/netifyd-stats.json` |

### 当前数据消费者

1. **CrowdSec**: 没有直接集成。独立运行。
2. **Netdata**: 单独的仪表板。通过 `/proc` 读取系统指标，不是 DPI 数据。
3. **LuCI 仪表板**: 通过 RPCD 后端的主要消费者。

### Netifyd 输出格式

**汇总统计** (`/var/run/netifyd/status.json`):
```json
{
  "flow_count": 150,
  "flows_active": 42,
  "devices": [...],
  "stats": {
    "br-lan": {
      "ip_bytes": 1234567,
      "wire_bytes": 1345678,
      "tcp": 1200,
      "udp": 300,
      "icmp": 50
    }
  },
  "dns_hint_cache": { "cache_size": 500 },
  "uptime": 86400
}
```

**流数据** (启用 sink 时，非默认):
```json
{
  "flow_id": "abc123",
  "src_ip": "192.168.1.100",
  "dst_ip": "8.8.8.8",
  "src_port": 54321,
  "dst_port": 443,
  "protocol": "tcp",
  "application": "google",
  "category": "search_engine",
  "bytes_rx": 1500,
  "bytes_tx": 500,
  "packets_rx": 10,
  "packets_tx": 5
}
```

---

## nDPId 架构

### 核心组件

| 组件 | 用途 |
|------|------|
| **nDPId** | 使用 libpcap + libnDPI 的流量捕获守护进程 |
| **nDPIsrvd** | 将事件分发给多个消费者的 Broker |
| **libnDPI** | 核心 DPI 库（与 Netifyd 共享） |

### nDPId 事件系统

**消息格式**: `[5位长度][JSON]\n`
```
01223{"flow_event_id":7,"flow_event_name":"detection-update",...}\n
```

**事件类别**:

| 类别 | 事件 | 描述 |
|------|------|------|
| 错误 | 17 种 | 数据包处理失败、内存问题 |
| 守护进程 | 4 种 | init, shutdown, reconnect, status |
| 数据包 | 2 种 | packet, packet-flow (base64 编码) |
| 流 | 9 种 | new, end, idle, update, detected, guessed, detection-update, not-detected, analyse |

### nDPId 流事件示例

```json
{
  "flow_event_id": 5,
  "flow_event_name": "detected",
  "thread_id": 0,
  "packet_id": 12345,
  "source": "eth0",
  "flow_id": 1001,
  "flow_state": "finished",
  "flow_src_packets_processed": 15,
  "flow_dst_packets_processed": 20,
  "flow_first_seen": 1704067200000,
  "flow_src_last_pkt_time": 1704067260000,
  "flow_dst_last_pkt_time": 1704067258000,
  "flow_idle_time": 2000,
  "flow_src_tot_l4_payload_len": 1500,
  "flow_dst_tot_l4_payload_len": 2000,
  "l3_proto": "ip4",
  "src_ip": "192.168.1.100",
  "dst_ip": "142.250.185.78",
  "l4_proto": "tcp",
  "src_port": 54321,
  "dst_port": 443,
  "ndpi": {
    "proto": "TLS.Google",
    "proto_id": 91,
    "proto_by_ip": 0,
    "encrypted": 1,
    "breed": "Safe",
    "category_id": 5,
    "category": "Web"
  }
}
```

---

## 迁移策略

### 第一阶段: 兼容层开发

创建一个翻译守护进程，将 nDPId 事件转换为 Netifyd 兼容格式。

**新组件**: `secubox-ndpid-compat`

```
nDPId → nDPIsrvd → secubox-ndpid-compat → 现有消费者
                                        ↓
                    /var/run/netifyd/status.json (兼容)
                    /tmp/netifyd-stats.json (兼容)
                    RPCD 后端 (不变)
```

### 第二阶段: 软件包开发

#### 2.1 新软件包: `secubox-app-ndpid`

**Makefile**:
```makefile
PKG_NAME:=ndpid
PKG_VERSION:=1.7.0
PKG_RELEASE:=1
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/utoni/nDPId.git

DEPENDS:=+libndpi +libpcap +libjson-c +libpthread
```

**构建要求**:
- libnDPI >=5.0.0
- libpcap
- libjson-c
- CMake 构建系统

#### 2.2 新软件包: `secubox-ndpid-compat`

翻译层脚本：
1. 连接到 nDPIsrvd socket
2. 将流事件聚合为 Netifyd 兼容格式
3. 写入 `/var/run/netifyd/status.json`
4. 提供相同的 RPCD 接口

### 第三阶段: 输出格式翻译

#### 3.1 状态文件翻译映射

| Netifyd 字段 | nDPId 来源 | 翻译逻辑 |
|--------------|------------|----------|
| `flow_count` | 流事件计数 | 在 `new` 时增加，在 `end`/`idle` 时减少 |
| `flows_active` | 活动流跟踪 | 计算没有 `end`/`idle` 事件的流 |
| `stats.{iface}.tcp` | `l4_proto == "tcp"` | 按接口聚合 |
| `stats.{iface}.udp` | `l4_proto == "udp"` | 按接口聚合 |
| `stats.{iface}.ip_bytes` | `flow_*_tot_l4_payload_len` | 按接口求和 |
| `uptime` | 守护进程 `status` 事件 | 直接映射 |

#### 3.2 流数据翻译映射

| Netifyd 字段 | nDPId 字段 | 注释 |
|--------------|------------|------|
| `src_ip` | `src_ip` | 直接 |
| `dst_ip` | `dst_ip` | 直接 |
| `src_port` | `src_port` | 直接 |
| `dst_port` | `dst_port` | 直接 |
| `protocol` | `l4_proto` | 小写 |
| `application` | `ndpi.proto` | 从 "TLS.Google" 解析 → "google" |
| `category` | `ndpi.category` | 直接 |
| `bytes_rx` | `flow_dst_tot_l4_payload_len` | 注意：反转（从流视角 dst=rx） |
| `bytes_tx` | `flow_src_tot_l4_payload_len` | 注意：反转 |

#### 3.3 应用名称规范化

nDPId 使用 `TLS.Google`、`QUIC.YouTube` 等格式。规范化为小写基础名：
```
TLS.Google → google
QUIC.YouTube → youtube
HTTP.Facebook → facebook
DNS → dns
```

### 第四阶段: 消费者兼容性

#### 4.1 CrowdSec 集成（新）

由于没有现有的 CrowdSec 集成，我们可以正确设计它：

**采集配置** (`/etc/crowdsec/acquis.d/ndpid.yaml`):
```yaml
source: file
filenames:
  - /tmp/ndpid-flows.log
labels:
  type: ndpid
---
source: journalctl
journalctl_filter:
  - "_SYSTEMD_UNIT=ndpid.service"
labels:
  type: syslog
```

**解析器** (`/etc/crowdsec/parsers/s02-enrich/ndpid-flows.yaml`):
```yaml
name: secubox/ndpid-flows
description: "解析 nDPId 流检测事件"
filter: "evt.Parsed.program == 'ndpid'"
onsuccess: next_stage
statics:
  - parsed: flow_application
    expression: evt.Parsed.ndpi_proto
nodes:
  - grok:
      pattern: '%{IP:src_ip}:%{INT:src_port} -> %{IP:dst_ip}:%{INT:dst_port} %{WORD:proto} %{DATA:app}'
```

**场景** (`/etc/crowdsec/scenarios/ndpid-suspicious-app.yaml`):
```yaml
type: leaky
name: secubox/ndpid-suspicious-app
description: "检测可疑应用程序使用"
filter: evt.Parsed.flow_application in ["bittorrent", "tor", "vpn_udp"]
groupby: evt.Parsed.src_ip
capacity: 5
leakspeed: 10m
blackhole: 1h
labels:
  remediation: true
```

#### 4.2 Netdata 集成（新）

为 nDPId 创建自定义 Netdata 收集器：

**收集器** (`/usr/lib/netdata/plugins.d/ndpid.chart.sh`):
```bash
#!/bin/bash
# nDPId Netdata 收集器

NDPID_STATUS="/var/run/netifyd/status.json"

# 图表定义
cat << EOF
CHART ndpid.flows '' "网络流" "流" ndpid ndpid.flows area
DIMENSION active '' absolute 1 1
DIMENSION total '' absolute 1 1
EOF

while true; do
    if [ -f "$NDPID_STATUS" ]; then
        active=$(jq -r '.flows_active // 0' "$NDPID_STATUS")
        total=$(jq -r '.flow_count // 0' "$NDPID_STATUS")
        echo "BEGIN ndpid.flows"
        echo "SET active = $active"
        echo "SET total = $total"
        echo "END"
    fi
    sleep 1
done
```

### 第五阶段: 插件系统迁移

#### 5.1 IPSet 操作

Netifyd 插件 → nDPId 外部处理器：

| Netifyd 插件 | nDPId 等效 |
|--------------|------------|
| `libnetify-plugin-ipset.so` | 消费流事件的外部脚本 |
| `libnetify-plugin-nftables.so` | 外部 nftables 更新器 |

**nDPId 流操作脚本** (`/usr/bin/ndpid-flow-actions`):
```bash
#!/bin/bash
# 处理 nDPId 事件并更新 ipsets

socat -u UNIX-RECV:/tmp/ndpid-actions.sock - | while read -r line; do
    # 解析 5 位长度前缀
    json="${line:5}"

    event=$(echo "$json" | jq -r '.flow_event_name')
    app=$(echo "$json" | jq -r '.ndpi.proto' | tr '.' '\n' | tail -1 | tr '[:upper:]' '[:lower:]')

    case "$event" in
        detected)
            case "$app" in
                bittorrent)
                    src_ip=$(echo "$json" | jq -r '.src_ip')
                    ipset add secubox-bittorrent "$src_ip" timeout 900 2>/dev/null
                    ;;
            esac
            ;;
    esac
done
```

---

## 实施阶段

### 第一阶段: 基础 (第1-2周)

1. [ ] 创建 `secubox-app-ndpid` 软件包
2. [ ] 为 OpenWrt 构建 nDPId + nDPIsrvd
3. [ ] 测试基本流检测
4. [ ] 创建 UCI 配置模式

### 第二阶段: 兼容层 (第3-4周)

1. [ ] 开发 `secubox-ndpid-compat` 翻译守护进程
2. [ ] 实现 status.json 生成
3. [ ] 实现流事件聚合
4. [ ] 用现有 LuCI 仪表板测试

### 第三阶段: RPCD 后端更新 (第5周)

1. [ ] 更新 RPCD 方法以使用 nDPId 数据
2. [ ] 确保所有 15 个读取方法正常工作
3. [ ] 确保所有 9 个写入方法正常工作
4. [ ] 测试 LuCI 应用兼容性

### 第四阶段: 消费者集成 (第6-7周)

1. [ ] 创建 CrowdSec 解析器/场景
2. [ ] 创建 Netdata 收集器
3. [ ] 测试端到端数据流
4. [ ] 记录新集成

### 第五阶段: 迁移与清理 (第8周)

1. [ ] 为现有用户创建迁移脚本
2. [ ] 更新文档
3. [ ] 移除 Netifyd 软件包（可选，可以共存）
4. [ ] 最终测试和发布

---

## 迁移后的文件结构

```
package/secubox/
├── secubox-app-ndpid/              # 新: nDPId 软件包
│   ├── Makefile
│   ├── files/
│   │   ├── ndpid.config            # UCI 配置
│   │   ├── ndpid.init              # procd init 脚本
│   │   └── ndpisrvd.init           # nDPIsrvd init
│   └── patches/                    # 如需要的 OpenWrt 补丁
│
├── secubox-ndpid-compat/           # 新: 兼容层
│   ├── Makefile
│   └── files/
│       ├── ndpid-compat.lua        # 翻译守护进程
│       ├── ndpid-flow-actions      # IPSet/nftables 处理器
│       └── ndpid-collector         # 统计聚合器
│
├── luci-app-secubox-netifyd/       # 修改: 与两者兼容
│   └── root/usr/libexec/rpcd/
│       └── luci.secubox-netifyd    # 为 nDPId 兼容更新
│
└── secubox-app-netifyd/            # 弃用: 保留作为后备
```

---

## 配置映射

### UCI 配置翻译

**Netifyd** (`/etc/config/secubox-netifyd`):
```
config settings 'settings'
    option enabled '1'
    option socket_type 'unix'

config sink 'sink'
    option enabled '1'
    option type 'unix'
    option unix_path '/tmp/netifyd-flows.json'
```

**nDPId** (`/etc/config/secubox-ndpid`):
```
config ndpid 'main'
    option enabled '1'
    option interfaces 'br-lan br-wan'
    option collector_socket '/tmp/ndpid-collector.sock'

config ndpisrvd 'distributor'
    option enabled '1'
    option listen_socket '/tmp/ndpisrvd.sock'
    option tcp_port '7000'

config compat 'compat'
    option enabled '1'
    option netifyd_status '/var/run/netifyd/status.json'
    option netifyd_socket '/var/run/netifyd/netifyd.sock'
```

---

## 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| 检测准确性差异 | 中 | 两者都使用 libnDPI；预期结果相似 |
| 性能退化 | 低 | nDPId 更轻量；应该提高性能 |
| 插件兼容性 | 高 | 必须在外部重新实现流操作 |
| 破坏现有仪表板 | 高 | 兼容层确保相同的输出格式 |
| 缺少 Netifyd 功能 | 中 | 记录功能差距；优先处理关键功能 |

### 功能比较

| 功能 | Netifyd | nDPId | 迁移影响 |
|------|---------|-------|----------|
| 协议检测 | 是 | 是 | 无 |
| 应用检测 | 是 | 是 | 无 |
| 流跟踪 | 是 | 是 | 无 |
| JSON 输出 | 是 | 是 | 需要格式翻译 |
| Socket 流 | 是 | 是 | 格式不同 |
| 云集成 | 是 | 否 | 功能移除 |
| 插件架构 | 内置 | 外部 | 重新实现 |
| 内存占用 | ~50MB | ~15MB | 改进 |
| 启动时间 | ~5s | ~1s | 改进 |

---

## 测试计划

### 单元测试

1. **翻译准确性**: 验证 nDPId 事件正确映射到 Netifyd 格式
2. **统计聚合**: 验证流计数、字节数、数据包数匹配
3. **应用检测**: 比较两个引擎之间的检测结果

### 集成测试

1. **LuCI 仪表板**: 所有视图正确渲染
2. **RPCD 方法**: 所有 24 个方法返回预期数据
3. **IPSet 操作**: BitTorrent/流媒体检测触发 ipset 更新
4. **CrowdSec 解析**: 流事件被解析且场景触发

### 性能测试

1. **吞吐量**: 测量最大流/秒
2. **内存**: 比较负载下的 RAM 使用
3. **CPU**: 比较流量突发期间的 CPU 使用

---

## 回滚计划

如果迁移失败：

1. 停止 nDPId 服务: `/etc/init.d/ndpid stop && /etc/init.d/ndpisrvd stop`
2. 启动 Netifyd: `/etc/init.d/netifyd start`
3. 兼容层自动检测并切换来源
4. 无数据丢失；两者可以共存

---

## 参考

- [nDPId GitHub 仓库](https://github.com/utoni/nDPId)
- [nDPI 库](https://github.com/ntop/nDPI)
- [Netifyd 文档](https://www.netify.ai/documentation/)
- [CrowdSec 采集](https://docs.crowdsec.net/docs/data_sources/intro)
- [Netdata 外部插件](https://learn.netdata.cloud/docs/agent/collectors/plugins.d)

---

## 附录 A: nDPId 事件模式参考

### 流事件字段

```json
{
  "flow_event_id": "整数 (0-8)",
  "flow_event_name": "字符串 (new|end|idle|update|detected|guessed|detection-update|not-detected|analyse)",
  "thread_id": "整数",
  "packet_id": "整数",
  "source": "字符串 (接口名)",
  "flow_id": "整数",
  "flow_state": "字符串 (skipped|finished|info)",
  "l3_proto": "字符串 (ip4|ip6)",
  "src_ip": "字符串",
  "dst_ip": "字符串",
  "l4_proto": "字符串 (tcp|udp|icmp|...)",
  "src_port": "整数",
  "dst_port": "整数",
  "flow_src_packets_processed": "整数",
  "flow_dst_packets_processed": "整数",
  "flow_first_seen": "整数 (毫秒时间戳)",
  "flow_src_tot_l4_payload_len": "整数 (字节)",
  "flow_dst_tot_l4_payload_len": "整数 (字节)",
  "ndpi": {
    "proto": "字符串 (例如 TLS.Google)",
    "proto_id": "整数",
    "encrypted": "整数 (0|1)",
    "breed": "字符串 (Safe|Acceptable|Fun|Unsafe|...)",
    "category_id": "整数",
    "category": "字符串"
  }
}
```

### 守护进程状态事件字段

```json
{
  "daemon_event_id": 3,
  "daemon_event_name": "status",
  "global_ts_usec": "整数",
  "uptime": "整数 (秒)",
  "packets": "整数",
  "packet_bytes": "整数",
  "flows_active": "整数",
  "flows_idle": "整数",
  "flows_detected": "整数",
  "compressions": "整数",
  "decompressions": "整数"
}
```

---

## 附录 B: 兼容层示例代码

```lua
#!/usr/bin/env lua
-- secubox-ndpid-compat: nDPId 到 Netifyd 格式翻译器

local socket = require("socket")
local json = require("cjson")

local NDPISRVD_SOCK = "/tmp/ndpisrvd.sock"
local OUTPUT_STATUS = "/var/run/netifyd/status.json"
local UPDATE_INTERVAL = 1

-- 状态跟踪
local state = {
    flows = {},
    flow_count = 0,
    flows_active = 0,
    stats = {},
    devices = {},
    uptime = 0,
    start_time = os.time()
}

-- 处理传入的 nDPId 事件
local function process_event(raw)
    -- 去除 5 位长度前缀
    local json_str = raw:sub(6)
    local ok, event = pcall(json.decode, json_str)
    if not ok then return end

    local event_name = event.flow_event_name or event.daemon_event_name

    if event_name == "new" then
        state.flows[event.flow_id] = event
        state.flow_count = state.flow_count + 1
        state.flows_active = state.flows_active + 1

    elseif event_name == "end" or event_name == "idle" then
        state.flows[event.flow_id] = nil
        state.flows_active = state.flows_active - 1

    elseif event_name == "detected" then
        if state.flows[event.flow_id] then
            state.flows[event.flow_id].detected = event.ndpi
        end
        -- 更新接口统计
        local iface = event.source or "unknown"
        if not state.stats[iface] then
            state.stats[iface] = {ip_bytes=0, tcp=0, udp=0, icmp=0}
        end
        local proto = event.l4_proto or ""
        if proto == "tcp" then state.stats[iface].tcp = state.stats[iface].tcp + 1 end
        if proto == "udp" then state.stats[iface].udp = state.stats[iface].udp + 1 end
        if proto == "icmp" then state.stats[iface].icmp = state.stats[iface].icmp + 1 end
        local bytes = (event.flow_src_tot_l4_payload_len or 0) + (event.flow_dst_tot_l4_payload_len or 0)
        state.stats[iface].ip_bytes = state.stats[iface].ip_bytes + bytes

    elseif event_name == "status" then
        state.uptime = event.uptime or (os.time() - state.start_time)
    end
end

-- 生成 Netifyd 兼容的 status.json
local function generate_status()
    return json.encode({
        flow_count = state.flow_count,
        flows_active = state.flows_active,
        stats = state.stats,
        devices = state.devices,
        uptime = state.uptime,
        dns_hint_cache = { cache_size = 0 }
    })
end

-- 主循环
local function main()
    -- 创建输出目录
    os.execute("mkdir -p /var/run/netifyd")

    local sock = socket.unix()
    local ok, err = sock:connect(NDPISRVD_SOCK)
    if not ok then
        print("连接 nDPIsrvd 失败: " .. (err or "未知"))
        os.exit(1)
    end

    sock:settimeout(0.1)

    local last_write = 0
    while true do
        local line, err = sock:receive("*l")
        if line then
            process_event(line)
        end

        -- 周期性写入状态文件
        local now = os.time()
        if now - last_write >= UPDATE_INTERVAL then
            local f = io.open(OUTPUT_STATUS, "w")
            if f then
                f:write(generate_status())
                f:close()
            end
            last_write = now
        end
    end
end

main()
```

---

*文档版本: 1.0*
*创建日期: 2026-01-09*
*作者: Claude Code 助手*
