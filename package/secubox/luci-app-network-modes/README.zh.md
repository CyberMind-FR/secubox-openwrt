# LuCI 网络模式仪表板

**版本：** 0.3.6
**最后更新：** 2025-12-28
**状态：** 活跃

![版本](https://img.shields.io/badge/version-0.3.6-orange)
![许可证](https://img.shields.io/badge/license-Apache--2.0-green)
![OpenWrt](https://img.shields.io/badge/OpenWrt-21.02+-blue)

使用现代直观的界面为您的OpenWrt路由器配置不同的网络操作模式。

## 网络模式

### v0.3.6 新功能
- **WireGuard自动化：** 从中继面板直接生成密钥对、部署`wg0`接口以及推送MTU/MSS/BBR优化。
- **优化RPC：** 新的后端方法向UI和自动化代理公开MTU钳制、TCP BBR和WireGuard部署。
- **UI操作按钮：** 中继模式现在包含一键按钮用于密钥生成、接口部署和优化运行。
- **集成代理：** 路由器模式现在自动配置Squid/TinyProxy/Privoxy、透明HTTP重定向、DNS-over-HTTPS，以及带可选Let's Encrypt证书的nginx反向代理vhosts。

### 嗅探器桥接模式（内联/透传）
无IP地址的透明以太网桥接，用于内联流量分析。所有流量都通过设备。

**网络配置：**
- **透明桥接**模式（br-lan）不分配IP地址
- 所有桥接接口启用**混杂模式**
- **无DHCP服务器** - 在网络上不可见
- **无路由** - 纯第2层转发
- **内联部署** - 设备插入流量路径
- 网关和网络设备之间的完美插入点

**流量分析功能：**
- **Netifyd集成**用于实时深度包检测（DPI）
- **应用检测**（Netflix、YouTube、Zoom、torrent等）
- **协议识别**（HTTP/HTTPS、DNS、QUIC、SSH等）
- **流跟踪**及源/目标分析
- 按应用和协议的**带宽监控**

**用例：**
- **网络取证** - 捕获所有通过的流量
- **安全监控** - 内联检测异常和威胁
- **带宽分析** - 识别带宽消耗者
- **协议调试** - 调试网络问题
- **合规监控** - 记录所有网络活动

**物理设置（内联）：**
```
互联网路由器（网关）
        |
   [WAN端口] OpenWrt（桥接模式）[LAN端口]
        |
   网络设备（交换机、AP、客户端）
```

**优点：**
- 看到100%的网络流量
- 必要时可以应用防火墙规则
- 可以进行流量整形
- 单点故障（如果设备故障，网络中断）

### 嗅探器被动模式（带外/仅监控）
纯被动监控，不影响网络流量。设备只监听，流量不通过它。

**网络配置：**
- **监控模式**接口（无桥接，无转发）
- 用于数据包捕获的**混杂模式**
- 监控接口上**无IP地址**
- **只读** - 无法影响网络流量
- 通过**SPAN/镜像端口**或**网络TAP**连接

**流量分析功能：**
- **Netifyd集成**用于深度包检测
- 使用tcpdump/Wireshark的**完整数据包捕获**
- **应用和协议检测**
- **流分析**和带宽监控
- **零网络影响** - 对网络不可见

**用例：**
- **纯取证** - 无任何网络影响的监控
- **IDS/IPS** - 无内联风险的入侵检测
- **网络TAP监控** - 专用监控基础设施
- **安全环境** - 无中断生产流量的风险
- **长期监控** - 持续被动观察

**物理设置选项：**

**选项1：交换机SPAN/镜像端口**
```
互联网路由器
        |
   管理型交换机（带端口镜像）
        |-- [端口1-23] 正常流量
        +-- [端口24 SPAN] --> OpenWrt [eth0]（监控）
```

**选项2：网络TAP**
```
互联网路由器 --> [TAP设备] --> 交换机
                    |
               OpenWrt [eth0]（监控）
```

**选项3：集线器（传统）**
```
互联网路由器 --> [集线器] --> 交换机
                  |
             OpenWrt [eth0]（监控）
```

**优点：**
- 零网络影响 - 无单点故障
- 对网络完全不可见
- 无法被检测或攻击
- 非常适合合规和安全监控
- 需要SPAN端口、TAP或集线器
- 可能根据设置漏掉部分流量

**与SecuBox集成：**
两种模式都可以与以下无缝协作：
- **Netifyd仪表板**用于DPI可视化
- **CrowdSec**用于威胁检测
- **Netdata**用于指标和图表
- **Client Guardian**用于访问控制决策

### 接入点模式
具有高级优化的WiFi接入点。
- **802.11r**快速BSS过渡（漫游）
- **802.11k**无线电资源管理
- **802.11v**BSS过渡管理
- **频段引导**（偏好5GHz）
- **波束成形**支持
- 信道和发射功率配置

### 中继/扩展器模式
带WireGuard优化的网络中继。
- **Relayd**桥接用于网络扩展
- **WireGuard VPN**集成
- 隧道的**MTU优化**
- TCP的**MSS钳制**
- **TCP BBR**拥塞控制

### 路由器模式
带WAN、代理和HTTPS前端的完整路由器。
- **WAN协议**：DHCP、静态、PPPoE、L2TP
- 带防火墙的**NAT/伪装**
- **Web代理**：Squid、TinyProxy、Privoxy
- **透明代理**选项
- **DNS over HTTPS**支持
- **HTTPS反向代理**：Nginx、HAProxy、Caddy
- 带Let's Encrypt的**多虚拟主机**

### 路由器 + DMZ模式
为暴露的服务器创建专用DMZ网段，同时保持LAN流量隔离。
- 独立的DMZ接口，有自己的子网/DHCP范围
- 防火墙区域隔离（DMZ -> WAN转发，除非切换否则无DMZ -> LAN）
- 使用现有备份/确认工作流快速回滚
- 设计用于与VHost管理器结合托管应用（Zigbee2MQTT、Lyrion等）

## 功能特性

- 一键模式切换带备份
- 实时接口和服务状态
- 每个模式的优化配置
- 安全的设置管理
- 响应式设计
- 现代深色主题

## 安装

### 先决条件

- OpenWrt 21.02或更高版本
- LuCI Web界面

### 从源码安装

```bash
cd ~/openwrt/feeds/luci/applications/
git clone https://github.com/gkerma/luci-app-network-modes.git

cd ~/openwrt
./scripts/feeds update -a && ./scripts/feeds install -a
make menuconfig  # LuCI > Applications > luci-app-network-modes
make package/luci-app-network-modes/compile V=s
```

### 手动安装

```bash
scp luci-app-network-modes_*.ipk root@192.168.1.1:/tmp/
ssh root@192.168.1.1 "opkg install /tmp/luci-app-network-modes_*.ipk"
/etc/init.d/rpcd restart
```

### 访问

**网络 -> 网络模式**

## 模式特定依赖

### 嗅探器模式
```bash
opkg install netifyd
```

### 接入点模式
```bash
opkg install hostapd-openssl  # 用于WPA3/802.11r
```

### 中继模式
```bash
opkg install relayd wireguard-tools
```

### 路由器模式
```bash
# 代理
opkg install squid  # 或 tinyproxy、privoxy

# 反向代理
opkg install nginx-ssl  # 或 haproxy

# Let's Encrypt
opkg install acme acme-dnsapi
```

## 架构

```
+-------------------------------------------------------------+
|                    LuCI JavaScript                           |
|  (overview.js, sniffer.js, accesspoint.js, relay.js,        |
|                      router.js)                              |
+----------------------------+--------------------------------+
                             | ubus RPC
                             v
+-------------------------------------------------------------+
|                    RPCD后端                                  |
|             /usr/libexec/rpcd/network-modes                 |
+----------------------------+--------------------------------+
                             | UCI / Shell
                             v
+-------------------------------------------------------------+
|              OpenWrt配置                                     |
|     /etc/config/network, wireless, firewall, dhcp           |
+-------------------------------------------------------------+
```

## API方法

| 方法 | 描述 |
|------|------|
| `status` | 当前模式、接口、服务状态 |
| `modes` | 列出所有模式及配置 |
| `sniffer_config` | 嗅探器模式设置 |
| `ap_config` | 接入点模式设置 |
| `relay_config` | 中继模式设置 |
| `router_config` | 路由器模式设置 |
| `apply_mode` | 切换到不同模式 |
| `update_settings` | 更新模式特定设置 |
| `add_vhost` | 添加虚拟主机（路由器模式） |
| `generate_config` | 生成配置预览 |

## 配置文件

设置存储在`/etc/config/network-modes`：

```
config network-modes 'config'
    option current_mode 'router'
    option last_change '2024-12-19 15:30:00'
    option backup_config '1'

config mode 'sniffer'
    option mode_type 'bridge'  # 'bridge' 或 'passive'
    option bridge_interface 'br-lan'
    option monitor_interface 'eth0'  # 用于被动模式
    option netifyd_enabled '1'
    option promiscuous '1'
    option pcap_capture '0'
    option pcap_path '/tmp/captures'
    option mirror_port ''
    option capture_filter ''
    option span_port_source ''  # 用于带SPAN的被动模式

config mode 'accesspoint'
    option wifi_channel 'auto'
    option wifi_htmode 'VHT80'
    option wifi_txpower '20'
    option roaming_enabled '1'

config mode 'relay'
    option wireguard_enabled '1'
    option mtu_optimization '1'
    option mss_clamping '1'

config mode 'router'
    option wan_protocol 'dhcp'
    option nat_enabled '1'
    option firewall_enabled '1'
    option proxy_enabled '0'
    option https_frontend '0'
```

## 嗅探器模式示例

### 基本嗅探器桥接设置（内联）

1. **通过LuCI启用嗅探器桥接模式**：
   - 导航至 **网络 -> 网络模式**
   - 选择 **嗅探器桥接模式（内联）**
   - 启用 **Netifyd集成**
   - 点击 **应用模式**

2. **物理连接**：
   ```
   调制解调器/ISP -> [WAN] OpenWrt [LAN1-4] -> 交换机/设备
   ```

3. **验证配置**：
   ```bash
   # 检查桥接状态
   brctl show br-lan

   # 验证桥接上无IP
   ip addr show br-lan

   # 检查混杂模式
   ip link show br-lan | grep PROMISC

   # 验证Netifyd运行中
   /etc/init.d/netifyd status
   ```

### 被动嗅探器设置（带外）

#### 选项A：使用交换机SPAN端口

1. **配置交换机SPAN/镜像端口**：
   - 访问管理型交换机配置
   - 配置端口镜像：
     - **源端口**：要监控的端口（如上行端口）
     - **目标端口**：连接到OpenWrt的端口（如端口24）
     - **方向**：双向（入站+出站）

2. **配置OpenWrt被动模式**：
   ```bash
   # 通过UCI
   uci set network-modes.sniffer.mode_type='passive'
   uci set network-modes.sniffer.monitor_interface='eth0'
   uci set network-modes.sniffer.netifyd_enabled='1'
   uci commit network-modes

   # 应用配置
   ubus call network-modes apply_mode '{"mode":"sniffer"}'
   ```

### 高级捕获配置

**捕获HTTP流量到PCAP：**
```bash
# 通过UCI
uci set network-modes.sniffer.pcap_capture='1'
uci set network-modes.sniffer.pcap_path='/mnt/usb/captures'
uci set network-modes.sniffer.capture_filter='port 80 or port 443'
uci commit network-modes

# 手动tcpdump
tcpdump -i br-lan -w /tmp/capture.pcap port 80 or port 443
```

**监控特定应用：**
```bash
# 观察Netflix流量
tcpdump -i br-lan -n 'host nflxvideo.net or host netflix.com'

# 监控DNS查询
tcpdump -i br-lan -n 'port 53'

# 捕获BitTorrent
tcpdump -i br-lan -n 'port 6881:6889'
```

**按IP的实时带宽：**
```bash
# 使用iftop
iftop -i br-lan -P

# 使用nethogs（如果已安装）
nethogs br-lan

# 使用Netifyd API
ubus call luci.netifyd flows | jq '.flows[] | select(.bytes_total > 1000000)'
```

### 集成示例

**导出到Elasticsearch：**
```bash
# Netifyd可以导出到Elasticsearch用于集中日志
# 在/etc/netifyd.conf中配置
{
  "sink": {
    "type": "elasticsearch",
    "url": "http://elastic.local:9200",
    "index": "netifyd"
  }
}
```

**向Grafana提供数据：**
```bash
# Netifyd导出Prometheus指标
curl http://192.168.1.1:8081/metrics
```

**与CrowdSec集成：**
```bash
# CrowdSec可以解析Netifyd日志用于威胁检测
# 在/etc/crowdsec/acquis.yaml中配置
filenames:
  - /var/log/netifyd.log
labels:
  type: netifyd
```

### 性能调优

**优化高带宽网络（1Gbps+）：**
```bash
# 增加环形缓冲区大小
ethtool -G eth0 rx 4096 tx 4096
ethtool -G eth1 rx 4096 tx 4096

# 禁用硬件卸载以获得准确捕获
ethtool -K eth0 gro off gso off tso off
ethtool -K eth1 gro off gso off tso off

# 将桥接设置为转发模式
echo 1 > /proc/sys/net/bridge/bridge-nf-call-iptables
```

**USB存储用于PCAP捕获：**
```bash
# 挂载USB驱动器
mkdir -p /mnt/usb
mount /dev/sda1 /mnt/usb

# 配置轮转
uci set network-modes.sniffer.pcap_path='/mnt/usb/captures'
uci set network-modes.sniffer.pcap_rotation='daily'
uci set network-modes.sniffer.pcap_retention='7'
uci commit network-modes
```

### 故障排除

**看不到流量：**
```bash
# 验证桥接成员
brctl show

# 检查接口状态
ip link show

# 用tcpdump测试
tcpdump -i br-lan -c 10

# 检查Netifyd日志
logread | grep netifyd
```

**高CPU使用率：**
```bash
# 如果不需要则禁用DPI
uci set network-modes.sniffer.netifyd_enabled='0'

# 使用过滤器减少捕获范围
tcpdump -i br-lan 'not port 22' -w /dev/null

# 检查硬件卸载
ethtool -k eth0 | grep offload
```

## 安全

- 模式切换自动创建备份
- 私钥永不通过API暴露
- 基于ACL的访问控制
- 防火墙自动配置

## 贡献

欢迎贡献！请提交issues和pull requests。

## 许可证

Apache License 2.0 - 见[LICENSE](LICENSE)

## 致谢

- 为[OpenWrt](https://openwrt.org/)构建
- 由[Gandalf @ CyberMind.fr](https://cybermind.fr)开发

---

为灵活的网络而精心打造
