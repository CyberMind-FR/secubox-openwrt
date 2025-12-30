#!/bin/sh
# USB IoT Adapter Detection Library
# Version: 0.5.0
# Description: Detects and identifies Zigbee, Z-Wave, ModBus, and Serial USB adapters

# === VID:PID DATABASE ===

# Zigbee Adapters
ZIGBEE_DEVICES="
0451:16a8:Texas Instruments CC2531
1cf1:0030:Dresden Elektronik ConBee II
1a86:55d4:Sonoff Zigbee 3.0 USB Plus
10c4:ea60:Silicon Labs CP2102 (Generic Zigbee)
0424:2134:SMSC USB2134B
1a86:7523:CH340 (Sonoff Zigbee 3.0)
"

# Z-Wave Sticks
ZWAVE_DEVICES="
0658:0200:Aeotec Z-Stick Gen5
10c4:8a2a:Z-Wave.Me UZB
0658:0280:Aeotec Z-Stick 7
"

# ModBus RTU Adapters
MODBUS_DEVICES="
0403:6001:FTDI FT232 USB-Serial (ModBus)
067b:2303:Prolific PL2303 (ModBus)
1a86:7523:CH340 (ModBus)
10c4:ea60:CP210x UART Bridge (ModBus)
"

# Generic USB-Serial (fallback)
SERIAL_DEVICES="
0403:6001:FTDI FT232
067b:2303:Prolific PL2303
1a86:7523:QinHeng CH340
10c4:ea60:Silicon Labs CP210x
2341:0043:Arduino Uno
"

# === DETECTION FUNCTIONS ===

# Function: Detect adapter type by VID:PID
# Usage: detect_adapter_type "0451" "16a8"
# Returns: zigbee, zwave, modbus, serial, or unknown
detect_adapter_type() {
    local vid="$1"
    local pid="$2"
    local vidpid="${vid}:${pid}"

    # Check Zigbee
    echo "$ZIGBEE_DEVICES" | grep -q "^${vidpid}:" && echo "zigbee" && return 0

    # Check Z-Wave
    echo "$ZWAVE_DEVICES" | grep -q "^${vidpid}:" && echo "zwave" && return 0

    # Check ModBus
    echo "$MODBUS_DEVICES" | grep -q "^${vidpid}:" && echo "modbus" && return 0

    # Check Generic Serial
    echo "$SERIAL_DEVICES" | grep -q "^${vidpid}:" && echo "serial" && return 0

    echo "unknown"
}

# Function: Get friendly device name from database
# Usage: get_device_name "0451" "16a8"
# Returns: Device name string
get_device_name() {
    local vid="$1"
    local pid="$2"
    local vidpid="${vid}:${pid}"
    local name=""

    name="$(echo "$ZIGBEE_DEVICES $ZWAVE_DEVICES $MODBUS_DEVICES $SERIAL_DEVICES" | \
            grep "^${vidpid}:" | cut -d: -f3 | head -n1)"

    [ -n "$name" ] && echo "$name" || echo "USB Device ${vidpid}"
}

# Function: Find TTY device for USB device
# Usage: find_usb_tty "/sys/bus/usb/devices/1-1.2"
# Returns: /dev/ttyUSB0 or /dev/ttyACM0
find_usb_tty() {
    local base="$1"
    local sub node tty

    # Check device itself and subdirectories
    for sub in "$base" "$base"/* "$base"/*/*; do
        [ -d "$sub/tty" ] || continue
        for node in "$sub"/tty/*; do
            [ -e "$node" ] || continue
            tty="$(basename "$node")"
            if [ -e "/dev/$tty" ]; then
                echo "/dev/$tty"
                return 0
            fi
        done
    done

    return 1
}

# Function: Get serial port attributes
# Usage: get_serial_attributes "/dev/ttyUSB0"
# Returns: JSON object via json_add_object
get_serial_attributes() {
    local port="$1"
    local baud=""
    local databits=""
    local parity=""

    if [ -c "$port" ]; then
        # Use stty to get current settings if available
        if command -v stty >/dev/null 2>&1; then
            local settings="$(stty -F "$port" 2>/dev/null)"
            baud="$(echo "$settings" | grep -o 'speed [0-9]*' | awk '{print $2}')"
        fi
    fi

    json_add_object "attributes"
    json_add_string "baud" "${baud:-9600}"
    json_add_string "databits" "8"
    json_add_string "parity" "N"
    json_add_string "stopbits" "1"
    json_close_object
}

# Function: Test serial port connectivity
# Usage: test_serial_port "/dev/ttyUSB0"
# Returns: 0 (success) or 1 (fail)
test_serial_port() {
    local port="$1"

    # Check if device exists
    [ -c "$port" ] || return 1

    # Check if readable and writable
    [ -r "$port" ] || return 1
    [ -w "$port" ] || return 1

    # Try to open the port briefly (non-blocking test)
    if command -v timeout >/dev/null 2>&1; then
        timeout 1 cat "$port" >/dev/null 2>&1 &
        local pid=$!
        sleep 0.1
        kill $pid 2>/dev/null
        wait $pid 2>/dev/null
        return 0
    fi

    return 0
}

# Function: Get all USB devices with detailed info
# Returns: Newline-separated list of USB device info
get_all_usb_devices() {
    local devices=""

    for dev in /sys/bus/usb/devices/*; do
        [ -f "$dev/idVendor" ] || continue
        [ -f "$dev/idProduct" ] || continue

        local vendor="$(cat "$dev/idVendor" 2>/dev/null)"
        local product="$(cat "$dev/idProduct" 2>/dev/null)"
        local busnum="$(cat "$dev/busnum" 2>/dev/null)"
        local devnum="$(cat "$dev/devnum" 2>/dev/null)"
        local manufacturer="$(cat "$dev/manufacturer" 2>/dev/null || echo "Unknown")"
        local prod_name="$(cat "$dev/product" 2>/dev/null || echo "Unknown")"

        devices="${devices}${vendor}:${product}:${busnum}:${devnum}:${manufacturer}:${prod_name}\n"
    done

    printf "$devices"
}

# Function: Detect Zigbee adapters (JSON output)
# Requires jshn.sh to be sourced
# Usage: detect_zigbee_adapters
detect_zigbee_adapters() {
    json_add_array "zigbee"

    while IFS=: read -r vid pid name; do
        [ -z "$vid" ] && continue

        for dev in /sys/bus/usb/devices/*; do
            [ -f "$dev/idVendor" ] || continue
            local v="$(cat "$dev/idVendor")"
            local p="$(cat "$dev/idProduct")"

            [ "$v" = "$vid" ] && [ "$p" = "$pid" ] || continue

            local port="$(find_usb_tty "$dev")"
            local busnum="$(cat "$dev/busnum" 2>/dev/null)"
            local devnum="$(cat "$dev/devnum" 2>/dev/null)"

            json_add_object
            json_add_string "type" "zigbee"
            json_add_string "vid" "$vid"
            json_add_string "pid" "$pid"
            json_add_string "name" "$name"
            json_add_string "bus" "$busnum"
            json_add_string "device" "$devnum"
            [ -n "$port" ] && json_add_string "port" "$port"
            json_add_boolean "detected" 1
            json_close_object
        done
    done <<EOF
$(echo "$ZIGBEE_DEVICES" | grep -v '^$')
EOF

    json_close_array
}

# Function: Detect Z-Wave adapters (JSON output)
# Requires jshn.sh to be sourced
# Usage: detect_zwave_adapters
detect_zwave_adapters() {
    json_add_array "zwave"

    while IFS=: read -r vid pid name; do
        [ -z "$vid" ] && continue

        for dev in /sys/bus/usb/devices/*; do
            [ -f "$dev/idVendor" ] || continue
            local v="$(cat "$dev/idVendor")"
            local p="$(cat "$dev/idProduct")"

            [ "$v" = "$vid" ] && [ "$p" = "$pid" ] || continue

            local port="$(find_usb_tty "$dev")"
            local busnum="$(cat "$dev/busnum" 2>/dev/null)"
            local devnum="$(cat "$dev/devnum" 2>/dev/null)"

            json_add_object
            json_add_string "type" "zwave"
            json_add_string "vid" "$vid"
            json_add_string "pid" "$pid"
            json_add_string "name" "$name"
            json_add_string "bus" "$busnum"
            json_add_string "device" "$devnum"
            [ -n "$port" ] && json_add_string "port" "$port"
            json_add_boolean "detected" 1
            json_close_object
        done
    done <<EOF
$(echo "$ZWAVE_DEVICES" | grep -v '^$')
EOF

    json_close_array
}

# Function: Detect ModBus adapters (JSON output)
# Requires jshn.sh to be sourced
# Usage: detect_modbus_adapters
detect_modbus_adapters() {
    json_add_array "modbus"

    while IFS=: read -r vid pid name; do
        [ -z "$vid" ] && continue

        for dev in /sys/bus/usb/devices/*; do
            [ -f "$dev/idVendor" ] || continue
            local v="$(cat "$dev/idVendor")"
            local p="$(cat "$dev/idProduct")"

            [ "$v" = "$vid" ] && [ "$p" = "$pid" ] || continue

            local port="$(find_usb_tty "$dev")"
            local busnum="$(cat "$dev/busnum" 2>/dev/null)"
            local devnum="$(cat "$dev/devnum" 2>/dev/null)"

            json_add_object
            json_add_string "type" "modbus"
            json_add_string "vid" "$vid"
            json_add_string "pid" "$pid"
            json_add_string "name" "$name"
            json_add_string "bus" "$busnum"
            json_add_string "device" "$devnum"
            [ -n "$port" ] && json_add_string "port" "$port"
            json_add_boolean "detected" 1
            json_close_object
        done
    done <<EOF
$(echo "$MODBUS_DEVICES" | grep -v '^$')
EOF

    json_close_array
}

# Function: List all serial ports (JSON output)
# Requires jshn.sh to be sourced
# Usage: list_serial_ports
list_serial_ports() {
    json_add_array "serial_ports"

    for port in /dev/ttyUSB* /dev/ttyACM* /dev/ttyS*; do
        [ -c "$port" ] || continue

        json_add_object
        json_add_string "device" "$port"

        # Try to identify what's connected
        local usb_dev=""
        local vid="" pid=""

        # Find USB device backing this TTY
        local tty_name="$(basename "$port")"
        for dev in /sys/bus/usb/devices/*/tty/"$tty_name"; do
            if [ -e "$dev" ]; then
                usb_dev="$(dirname "$(dirname "$dev")")"
                vid="$(cat "$usb_dev/idVendor" 2>/dev/null)"
                pid="$(cat "$usb_dev/idProduct" 2>/dev/null)"
                break
            fi
        done

        if [ -n "$vid" ] && [ -n "$pid" ]; then
            json_add_string "vid" "$vid"
            json_add_string "pid" "$pid"
            local adapter_type="$(detect_adapter_type "$vid" "$pid")"
            json_add_string "type" "$adapter_type"
            local device_name="$(get_device_name "$vid" "$pid")"
            json_add_string "name" "$device_name"
        else
            json_add_string "type" "serial"
            json_add_string "name" "Serial Port"
        fi

        # Test connectivity
        if test_serial_port "$port"; then
            json_add_boolean "accessible" 1
        else
            json_add_boolean "accessible" 0
        fi

        get_serial_attributes "$port"

        json_close_object
    done

    json_close_array
}

# === LIBRARY LOADED SUCCESSFULLY ===
# Source this file in RPCD scripts with: . /usr/share/mqtt-bridge/usb-database.sh
