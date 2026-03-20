# SecuBox MQTT IoT Bridge

**版本：** 0.5.0-1
**状态：** 生产就绪
**类别：** 物联网与集成
**维护者：** CyberMind <contact@cybermind.fr>

为SecuBox路由器提供全面USB设备支持的MQTT物联网网桥。自动检测和配置USB物联网适配器（Zigbee、Z-Wave、ModBus、串口），并将它们桥接到MQTT代理以用于智能家居和工业物联网应用。

---

## 功能特性

### 核心功能
- **MQTT代理集成**：连接本地或远程MQTT代理
- **USB物联网适配器检测**：自动检测17种已知USB设备
- **多协议支持**：Zigbee、Z-Wave、ModBus RTU和通用USB串口
- **实时健康监控**：跟踪适配器状态（在线/错误/缺失/未知）
- **配置管理**：基于UCI的持久化配置
- **SecuBox主题集成**：与深色/浅色/赛博朋克主题一致的界面

### 支持的USB物联网适配器

#### Zigbee适配器（6种设备）
- **Texas Instruments CC2531** (VID:PID `0451:16a8`)
- **Dresden Elektronik ConBee II** (VID:PID `1cf1:0030`)
- **Sonoff Zigbee 3.0 USB Plus** (VID:PID `1a86:55d4`)
- **Silicon Labs CP2102** (VID:PID `10c4:ea60`) - 通用Zigbee
- **SMSC USB2134B** (VID:PID `0424:2134`)
- **CH340** (VID:PID `1a86:7523`) - Sonoff Zigbee 3.0

#### Z-Wave USB棒（3种设备）
- **Aeotec Z-Stick Gen5** (VID:PID `0658:0200`)
- **Aeotec Z-Stick 7** (VID:PID `0658:0280`)
- **Z-Wave.Me UZB** (VID:PID `10c4:8a2a`)

#### ModBus RTU适配器（4种设备）
- **FTDI FT232** (VID:PID `0403:6001`) - USB转串口
- **Prolific PL2303** (VID:PID `067b:2303`)
- **CH340** (VID:PID `1a86:7523`)
- **CP210x UART Bridge** (VID:PID `10c4:ea60`)

#### 通用USB串口适配器
- 通过`/dev/ttyUSB*`或`/dev/ttyACM*`检测的任何USB转串口适配器

---

## 视图

### 1. 概览 (`overview.js`)
- MQTT代理连接状态
- 已连接设备总数
- 按类型统计USB适配器（Zigbee/Z-Wave/ModBus/串口）
- 健康状态摘要（在线/错误/缺失/未知）
- 最近MQTT消息和主题
- 快捷操作（扫描USB、重新连接代理）

### 2. 适配器 (`adapters.js`)
- **已配置适配器网格**：所有UCI配置的适配器及状态
- **检测到的设备区域**：实时USB设备扫描结果
- **导入向导**：一键从检测到的设备导入到配置
- **适配器管理**：测试连接、配置、删除操作
- **健康指示器**：颜色编码状态（绿色=在线，红色=错误，黄色=缺失，灰色=未知）

---

## RPC方法（共7个）

### USB检测与管理

#### `get_usb_devices`
列出连接到系统的所有USB设备及供应商/产品信息。

**参数：** 无
**返回：**
```json
{
  "devices": [
    {
      "bus": "usb1",
      "device": "1-1",
      "vendor": "0451",
      "product": "16a8",
      "adapter_type": "zigbee",
      "device_name": "Texas Instruments CC2531",
      "port": "/dev/ttyUSB0"
    }
  ]
}
```

#### `detect_iot_adapters`
通过VID:PID与已知设备数据库匹配来识别物联网适配器。

**参数：** 无
**返回：**
```json
{
  "zigbee": [
    {
      "vendor": "0451",
      "product": "16a8",
      "name": "Texas Instruments CC2531",
      "port": "/dev/ttyUSB0"
    }
  ],
  "zwave": [],
  "modbus": []
}
```

#### `get_serial_ports`
列出所有串口（`/dev/ttyUSB*`、`/dev/ttyACM*`）及其属性。

**参数：** 无
**返回：**
```json
{
  "ports": [
    {
      "device": "/dev/ttyUSB0",
      "driver": "ch341",
      "vendor": "1a86",
      "product": "7523",
      "adapter_type": "zigbee"
    }
  ]
}
```

#### `get_adapter_info`
返回特定适配器的详细信息。

**参数：** `{ "adapter": "zigbee_cc2531" }`
**返回：**
```json
{
  "id": "zigbee_cc2531",
  "enabled": true,
  "type": "zigbee",
  "vendor": "0451",
  "product": "16a8",
  "port": "/dev/ttyUSB0",
  "baud": "115200",
  "channel": "11",
  "detected": true,
  "health": "online"
}
```

#### `test_connection`
测试串口的可访问性和可读性。

**参数：** `{ "port": "/dev/ttyUSB0" }`
**返回：**
```json
{
  "success": true,
  "port": "/dev/ttyUSB0",
  "readable": true,
  "writable": true,
  "error": null
}
```

#### `configure_adapter`
创建或更新UCI适配器配置。

**参数：**
```json
{
  "adapter_id": "zigbee_usb2134",
  "type": "zigbee",
  "vendor": "0424",
  "product": "2134",
  "port": "/dev/ttyUSB1",
  "baud": "115200",
  "enabled": true
}
```
**返回：** `{ "success": true }`

#### `get_adapter_status`
返回所有已配置适配器的实时健康状态。

**参数：** 无
**返回：**
```json
{
  "adapters": [
    {
      "id": "zigbee_cc2531",
      "health": "online",
      "port": "/dev/ttyUSB0",
      "detected": true,
      "last_seen": 1704046800
    }
  ]
}
```

---

## UCI配置

### 配置文件：`/etc/config/mqtt-bridge`

#### 配置示例

```
# MQTT代理设置
config broker 'broker'
    option host '127.0.0.1'
    option port '1883'
    option username 'secubox'
    option password 'secubox'
    option client_id 'mqtt-bridge-01'

# 网桥配置
config bridge 'bridge'
    option base_topic 'secubox/+/state'
    option retention '7'
    option auto_discovery '1'
    option poll_interval '30'

# USB监控
config monitor 'monitor'
    option interval '10'
    option usb_scan_enabled '1'
    option auto_configure '0'

# Zigbee适配器示例
config adapter 'zigbee_cc2531'
    option enabled '1'
    option type 'zigbee'
    option title 'Texas Instruments CC2531'
    option vendor '0451'
    option product '16a8'
    option port '/dev/ttyUSB0'
    option baud '115200'
    option channel '11'
    option pan_id '0x1A62'
    option permit_join '0'
    option detected '1'
    option health 'online'

# Z-Wave适配器示例
config adapter 'zwave_aeotec'
    option enabled '1'
    option type 'zwave'
    option title 'Aeotec Z-Stick Gen5'
    option vendor '0658'
    option product '0200'
    option port '/dev/ttyACM0'
    option baud '115200'
    option detected '0'
    option health 'unknown'

# ModBus RTU适配器示例
config adapter 'modbus_ftdi'
    option enabled '1'
    option type 'modbus'
    option title 'FTDI ModBus适配器'
    option vendor '0403'
    option product '6001'
    option port '/dev/ttyUSB1'
    option baud '9600'
    option parity 'N'
    option databits '8'
    option stopbits '1'
    option slave_id '1'
    option detected '1'
    option health 'online'
```

### 配置选项

#### Broker部分
- `host`：MQTT代理主机名或IP
- `port`：MQTT代理端口（默认：1883）
- `username`：认证用户名
- `password`：认证密码
- `client_id`：唯一客户端标识符

#### Bridge部分
- `base_topic`：设备消息的基础MQTT主题
- `retention`：消息保留天数
- `auto_discovery`：启用MQTT自动发现（0/1）
- `poll_interval`：轮询间隔（秒）

#### Monitor部分
- `interval`：USB扫描间隔（秒）
- `usb_scan_enabled`：启用自动USB扫描（0/1）
- `auto_configure`：自动配置检测到的适配器（0/1）

#### Adapter部分
- `enabled`：启用此适配器（0/1）
- `type`：适配器类型（zigbee/zwave/modbus/serial）
- `title`：人类可读名称
- `vendor`：USB供应商ID（VID）
- `product`：USB产品ID（PID）
- `port`：串口设备路径
- `baud`：波特率（9600、19200、38400、57600、115200等）
- `detected`：适配器当前是否检测到（0/1，自动更新）
- `health`：适配器健康状态（online/error/missing/unknown，自动更新）

#### Zigbee特定选项
- `channel`：Zigbee信道（11-26）
- `pan_id`：个人区域网络ID（十六进制）
- `permit_join`：允许新设备加入（0/1）

#### ModBus特定选项
- `parity`：奇偶校验位（N/E/O）
- `databits`：数据位（7/8）
- `stopbits`：停止位（1/2）
- `slave_id`：ModBus从机ID

---

## USB检测库

位置：`/usr/share/mqtt-bridge/usb-database.sh`

### 关键函数

#### `detect_adapter_type(vid, pid)`
将VID:PID与已知设备数据库匹配。

**返回：** `zigbee`、`zwave`、`modbus`、`serial`或`unknown`

#### `find_usb_tty(device_path)`
将USB设备路径映射到串口（`/dev/ttyUSB*`或`/dev/ttyACM*`）。

**返回：** 设备路径或空字符串

#### `test_serial_port(port)`
测试串口是否可访问。

**返回：** 0（成功）或1（失败）

#### `get_device_name(vid, pid)`
从数据库检索人类可读的设备名称。

**返回：** 设备名称字符串

---

## 安装

### 依赖

```bash
# 必需
opkg update
opkg install luci-base rpcd curl mosquitto

# 可选（用于特定协议）
opkg install python3-pyserial  # 串口通信
opkg install socat              # TCP/串口桥接
```

### 包安装

```bash
# 从GitHub Releases下载
wget https://github.com/CyberMind-FR/secubox-openwrt/releases/download/v0.5.0/luci-app-mqtt-bridge_0.5.0-1_all.ipk

# 安装
opkg install luci-app-mqtt-bridge_0.5.0-1_all.ipk

# 重启服务
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

---

## 使用指南

### 1. 初始设置

1. 导航至 **SecuBox -> 网络 -> MQTT IoT Bridge -> 概览**
2. 配置MQTT代理设置（主机、端口、凭据）
3. 点击 **保存并应用**

### 2. 检测USB适配器

1. 插入您的USB物联网适配器（Zigbee、Z-Wave等）
2. 进入 **适配器** 视图
3. 点击 **扫描USB设备**
4. 检测到的设备将出现在"检测到的设备"区域

### 3. 导入适配器

1. 在 **检测到的设备** 区域，找到您的适配器
2. 点击 **导入** 按钮
3. 适配器将自动添加到配置中
4. 如需要编辑适配器设置（信道、波特率等）

### 4. 测试连接

1. 在 **已配置适配器** 网格中选择一个适配器
2. 点击 **测试连接**
3. 检查状态指示器（绿色=成功，红色=失败）

### 5. 监控健康状态

- **在线**：适配器已连接并响应
- **错误**：连接失败或通信错误
- **缺失**：适配器之前检测到但现在已断开
- **未知**：状态尚未确定

---

## 故障排除

### 常见问题

#### 适配器未检测到

**症状：** USB适配器已插入但未出现在"检测到的设备"中

**解决方案：**
1. 检查USB设备是否被内核识别：
   ```bash
   lsusb
   dmesg | grep tty
   ```
2. 验证设备是否出现在sysfs中：
   ```bash
   ls /sys/bus/usb/devices/
   ```
3. 检查VID:PID是否在数据库中：
   ```bash
   cat /usr/share/mqtt-bridge/usb-database.sh | grep <VID>:<PID>
   ```

#### 端口权限错误

**症状：** 访问`/dev/ttyUSB*`时出现"Permission denied"

**解决方案：**
1. 验证RPCD脚本权限：
   ```bash
   chmod 755 /usr/libexec/rpcd/luci.mqtt-bridge
   ```
2. 检查设备节点权限：
   ```bash
   ls -l /dev/ttyUSB0
   chmod 666 /dev/ttyUSB0  # 临时修复
   ```

#### 健康状态显示"缺失"

**症状：** 适配器之前工作但现在显示"missing"状态

**解决方案：**
1. 检查USB设备是否仍然连接：
   ```bash
   lsusb
   ```
2. 验证串口是否存在：
   ```bash
   ls -l /dev/ttyUSB*
   ```
3. 重新插入USB适配器
4. 检查dmesg中的USB错误：
   ```bash
   dmesg | tail -20
   ```

### 调试命令

```bash
# 列出所有USB设备
ubus call luci.mqtt-bridge get_usb_devices

# 检测物联网适配器
ubus call luci.mqtt-bridge detect_iot_adapters

# 获取适配器状态
ubus call luci.mqtt-bridge get_adapter_status

# 测试串口
ubus call luci.mqtt-bridge test_connection '{"port":"/dev/ttyUSB0"}'

# 查看MQTT bridge配置
uci show mqtt-bridge

# 检查RPCD日志
logread | grep mqtt-bridge
```

---

## API参考

### JavaScript API模块

位置：`htdocs/luci-static/resources/mqtt-bridge/api.js`

```javascript
// 导入API模块
'require mqtt-bridge/api as API';

// 获取USB设备
API.getUSBDevices().then(function(devices) {
    console.log('USB设备:', devices);
});

// 检测物联网适配器
API.detectIoTAdapters().then(function(adapters) {
    console.log('Zigbee:', adapters.zigbee);
    console.log('Z-Wave:', adapters.zwave);
    console.log('ModBus:', adapters.modbus);
});

// 配置适配器
API.configureAdapter({
    adapter_id: 'zigbee_cc2531',
    type: 'zigbee',
    vendor: '0451',
    product: '16a8',
    port: '/dev/ttyUSB0',
    baud: '115200',
    enabled: true
}).then(function(result) {
    console.log('已配置:', result.success);
});

// 获取适配器状态
API.getAdapterStatus().then(function(status) {
    console.log('适配器状态:', status.adapters);
});
```

---

## 集成示例

### Home Assistant

```yaml
# configuration.yaml
mqtt:
  broker: <openwrt-router-ip>
  port: 1883
  username: secubox
  password: secubox
  discovery: true
  discovery_prefix: homeassistant
```

### Zigbee2MQTT

```yaml
# configuration.yaml
homeassistant: true
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://<openwrt-router-ip>
serial:
  port: /dev/ttyUSB0
  adapter: zstack
```

### Node-RED

```javascript
// MQTT输入节点配置
{
    "server": "<openwrt-router-ip>:1883",
    "topic": "secubox/+/state",
    "qos": "0",
    "username": "secubox",
    "password": "secubox"
}
```

---

## 开发

### 项目结构

```
luci-app-mqtt-bridge/
|-- Makefile
|-- README.md
|-- htdocs/
|   +-- luci-static/
|       +-- resources/
|           |-- mqtt-bridge/
|           |   +-- api.js          # API模块
|           +-- view/
|               +-- mqtt-bridge/
|                   |-- overview.js  # 概览仪表板
|                   +-- adapters.js  # USB适配器管理
|-- root/
    |-- etc/
    |   +-- config/
    |       +-- mqtt-bridge         # UCI配置
    +-- usr/
        |-- libexec/
        |   +-- rpcd/
        |       +-- luci.mqtt-bridge  # RPCD后端
        +-- share/
            |-- luci/
            |   +-- menu.d/
            |       +-- luci-app-mqtt-bridge.json
            |-- rpcd/
            |   +-- acl.d/
            |       +-- luci-app-mqtt-bridge.json
            +-- mqtt-bridge/
                +-- usb-database.sh  # USB检测库
```

### 添加新USB设备

要添加新USB物联网适配器的支持：

1. 编辑 `/usr/share/mqtt-bridge/usb-database.sh`
2. 将VID:PID添加到适当的数据库：
   ```bash
   ZIGBEE_DEVICES="
   ...
   <VID>:<PID>:您的设备名称
   "
   ```
3. 重启RPCD：`/etc/init.d/rpcd restart`

---

## 许可证

Apache License 2.0

---

## 维护者

**CyberMind.fr**
GitHub: @gkerma
Email: contact@cybermind.fr

---

## 版本历史

### v0.5.0 (2025-12-30)
- 完整的USB物联网适配器支持
- 向VID:PID数据库添加17种已知设备
- 创建adapters.js视图用于USB管理
- 增强overview.js带适配器统计
- 实现7个新RPCD方法用于USB操作
- 添加实时健康监控
- SecuBox主题集成（深色/浅色/赛博朋克）

### v0.4.0 (2025-11)
- 初始MQTT代理集成
- 基本设备管理
- 设置配置

---

## 资源

- **GitHub仓库**：https://github.com/CyberMind-FR/secubox-openwrt
- **文档**：https://gkerma.github.io/secubox-openwrt/
- **Issue追踪**：https://github.com/CyberMind-FR/secubox-openwrt/issues
- **在线演示**：https://secubox.cybermood.eu

---

*最后更新：2025-12-30*
