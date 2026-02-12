#!/bin/sh
#
# IoT Guard - Device Classification Module
#
# Classifies IoT devices by vendor OUI, traffic patterns, and heuristics.
#

# ============================================================================
# OUI-Based Classification
# ============================================================================

# Known IoT manufacturer OUIs
# Format: OUI_PREFIX|Vendor|Class|Risk
IOT_OUIS="
40:B4:CD|Ring|camera|medium
18:B4:30|Nest Labs|thermostat|low
00:17:88|Philips Hue|lighting|low
28:6C:07|Xiaomi|mixed|high
DC:4F:22|Tuya|mixed|high
50:C7:BF|TP-Link|plug|medium
2C:AA:8E|Wyze|camera|medium
60:01:94|Espressif|diy|high
F0:27:2D|Amazon|assistant|medium
30:FD:38|Google|assistant|medium
78:8A:20|Ubiquiti|networking|low
B4:FB:E4|Ubiquiti|networking|low
74:D4:35|Gree|hvac|medium
E4:5E:1B|Orvibo|plug|high
D0:73:D5|Lifx|lighting|low
00:0E:58|Sonos|media|low
B8:27:EB|Raspberry Pi|diy|high
DC:A6:32|Raspberry Pi|diy|high
E4:5F:01|Raspberry Pi|diy|high
AC:BC:32|Samsung TV|media|medium
78:BD:BC|Samsung|media|medium
CC:2D:21|Tenda|networking|medium
7C:A9:6B|Synology|nas|low
00:11:32|Synology|nas|low
B0:BE:76|TP-Link Tapo|plug|medium
54:AF:97|TP-Link Tapo|camera|medium
68:FF:7B|TP-Link Kasa|plug|medium
"

classify_by_oui() {
    local mac="$1"
    local oui=$(echo "$mac" | cut -d':' -f1-3 | tr '[:lower:]' '[:upper:]')

    echo "$IOT_OUIS" | while IFS='|' read -r prefix vendor class risk; do
        [ -z "$prefix" ] && continue
        if [ "$oui" = "$prefix" ]; then
            echo "$vendor|$class|$risk"
            return 0
        fi
    done
}

# ============================================================================
# Traffic-Based Classification
# ============================================================================

classify_by_traffic() {
    local mac="$1"
    local db="${2:-/var/lib/iot-guard/iot-guard.db}"

    # Get cloud dependencies
    local domains=$(sqlite3 "$db" "SELECT domain FROM cloud_deps WHERE mac='$mac';" 2>/dev/null)

    # Match cloud services to device types
    echo "$domains" | while read -r domain; do
        case "$domain" in
            *ring.com*|*nest.com*|*wyze.com*)
                echo "camera"
                return
                ;;
            *alexa.amazon.com*|*google.home*)
                echo "assistant"
                return
                ;;
            *tuya*|*smart-life*|*tuyacloud*)
                echo "mixed"
                return
                ;;
            *hue*|*lifx*|*wiz*)
                echo "lighting"
                return
                ;;
            *sonos*|*spotify*|*pandora*)
                echo "media"
                return
                ;;
        esac
    done

    echo "unknown"
}

# ============================================================================
# Hostname-Based Classification
# ============================================================================

classify_by_hostname() {
    local hostname="$1"
    hostname=$(echo "$hostname" | tr '[:upper:]' '[:lower:]')

    case "$hostname" in
        *cam*|*camera*|*ipcam*|*nvr*|*dvr*)
            echo "camera"
            ;;
        *thermostat*|*nest*|*ecobee*|*hvac*)
            echo "thermostat"
            ;;
        *light*|*hue*|*bulb*|*lamp*)
            echo "lighting"
            ;;
        *plug*|*outlet*|*switch*|*socket*)
            echo "plug"
            ;;
        *echo*|*alexa*|*google-home*|*homepod*)
            echo "assistant"
            ;;
        *tv*|*roku*|*firestick*|*chromecast*|*sonos*)
            echo "media"
            ;;
        *lock*|*doorbell*|*ring*)
            echo "lock"
            ;;
        *sensor*|*motion*|*door-sensor*)
            echo "sensor"
            ;;
        *esp*|*raspberry*|*arduino*)
            echo "diy"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# ============================================================================
# Combined Classification
# ============================================================================

classify_device_full() {
    local mac="$1"
    local hostname="$2"
    local vendor="$3"
    local db="$4"

    # Priority 1: OUI-based classification
    local oui_result=$(classify_by_oui "$mac")
    if [ -n "$oui_result" ]; then
        echo "$oui_result"
        return
    fi

    # Priority 2: Hostname-based classification
    if [ -n "$hostname" ] && [ "$hostname" != "unknown" ]; then
        local host_class=$(classify_by_hostname "$hostname")
        if [ "$host_class" != "unknown" ]; then
            echo "$vendor|$host_class|medium"
            return
        fi
    fi

    # Priority 3: Traffic-based classification
    if [ -n "$db" ] && [ -f "$db" ]; then
        local traffic_class=$(classify_by_traffic "$mac" "$db")
        if [ "$traffic_class" != "unknown" ]; then
            echo "$vendor|$traffic_class|medium"
            return
        fi
    fi

    # Fallback
    echo "${vendor:-Unknown}|unknown|unknown"
}
