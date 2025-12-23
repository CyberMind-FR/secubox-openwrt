#!/bin/sh
# generate-rpcd-files.sh
# Generate missing RPCD scripts and ACL files for SecuBox modules
#
# Usage: ./generate-rpcd-files.sh <module-name>
# Example: ./generate-rpcd-files.sh vhost-manager

MODULE="$1"

if [ -z "$MODULE" ]; then
    echo "Usage: $0 <module-name>"
    echo "Example: $0 vhost-manager"
    exit 1
fi

# Convert module name for different uses
# vhost-manager -> vhost_manager (for shell variables)
# vhost-manager -> vhost-manager (for ubus)
MODULE_UNDERSCORE=$(echo "$MODULE" | tr '-' '_')
UBUS_NAME="luci.$MODULE"
PKG_NAME="luci-app-$MODULE"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Generating RPCD files for: $MODULE"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================
# Create RPCD script
# ============================================
RPCD_SCRIPT="/usr/libexec/rpcd/$MODULE"

echo "→ Creating RPCD script: $RPCD_SCRIPT"

cat > "$RPCD_SCRIPT" << 'RPCD_EOF'
#!/bin/sh
# RPCD backend for MODULE_PLACEHOLDER
# Provides ubus interface: luci.MODULE_PLACEHOLDER

. /lib/functions.sh
. /usr/share/libubox/jshn.sh

# Initialize JSON
json_init

case "$1" in
    list)
        # List available methods
        json_add_object "status"
        json_close_object
        json_add_object "get_config"
        json_close_object
        json_add_object "set_config"
            json_add_string "config" "object"
        json_close_object
        json_add_object "get_stats"
        json_close_object
        json_dump
        ;;
    
    call)
        case "$2" in
            status)
                # Return module status
                json_add_boolean "enabled" 1
                json_add_string "status" "running"
                json_add_string "version" "2.0.0"
                json_add_string "module" "MODULE_PLACEHOLDER"
                
                # Check if service is running (customize per module)
                # Example: check nginx for vhost-manager
                # if pgrep -x nginx > /dev/null 2>&1; then
                #     json_add_boolean "service_running" 1
                # else
                #     json_add_boolean "service_running" 0
                # fi
                
                json_add_boolean "service_running" 1
                json_dump
                ;;
            
            get_config)
                # Return current configuration
                json_add_object "config"
                
                # Read from UCI if available
                if [ -f "/etc/config/MODULE_UNDERSCORE_PLACEHOLDER" ]; then
                    config_load "MODULE_UNDERSCORE_PLACEHOLDER"
                    # Add config values here
                    json_add_boolean "enabled" 1
                else
                    json_add_boolean "enabled" 0
                fi
                
                json_close_object
                json_dump
                ;;
            
            set_config)
                # Set configuration
                read -r input
                
                # Parse input JSON
                json_load "$input"
                json_get_var config config
                
                # Apply configuration via UCI
                # uci set MODULE_UNDERSCORE_PLACEHOLDER.global.enabled="$enabled"
                # uci commit MODULE_UNDERSCORE_PLACEHOLDER
                
                json_init
                json_add_boolean "success" 1
                json_add_string "message" "Configuration updated"
                json_dump
                ;;
            
            get_stats)
                # Return statistics
                json_add_object "stats"
                json_add_int "uptime" "$(cat /proc/uptime | cut -d. -f1)"
                json_add_string "timestamp" "$(date -Iseconds)"
                json_close_object
                json_dump
                ;;
            
            *)
                # Unknown method
                json_add_int "error" -32601
                json_add_string "message" "Method not found"
                json_dump
                ;;
        esac
        ;;
esac
RPCD_EOF

# Replace placeholders
sed -i "s/MODULE_PLACEHOLDER/$MODULE/g" "$RPCD_SCRIPT"
sed -i "s/MODULE_UNDERSCORE_PLACEHOLDER/$MODULE_UNDERSCORE/g" "$RPCD_SCRIPT"

chmod +x "$RPCD_SCRIPT"
echo "  ✓ Created and made executable"

# ============================================
# Create ACL file
# ============================================
ACL_FILE="/usr/share/rpcd/acl.d/${PKG_NAME}.json"

echo "→ Creating ACL file: $ACL_FILE"

cat > "$ACL_FILE" << ACL_EOF
{
    "luci-app-$MODULE": {
        "description": "Grant access to LuCI app $MODULE",
        "read": {
            "ubus": {
                "$UBUS_NAME": ["status", "get_config", "get_stats"]
            },
            "uci": ["$MODULE_UNDERSCORE"]
        },
        "write": {
            "ubus": {
                "$UBUS_NAME": ["set_config"]
            },
            "uci": ["$MODULE_UNDERSCORE"]
        }
    }
}
ACL_EOF

echo "  ✓ Created ACL file"

# ============================================
# Create Menu file (if not exists)
# ============================================
MENU_FILE="/usr/share/luci/menu.d/${PKG_NAME}.json"

if [ ! -f "$MENU_FILE" ]; then
    echo "→ Creating Menu file: $MENU_FILE"
    
    # Convert module name to title
    TITLE=$(echo "$MODULE" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
    
    cat > "$MENU_FILE" << MENU_EOF
{
    "admin/services/$MODULE_UNDERSCORE": {
        "title": "$TITLE",
        "order": 50,
        "action": {
            "type": "view",
            "path": "$MODULE/main"
        },
        "depends": {
            "acl": ["luci-app-$MODULE"],
            "uci": {
                "$MODULE_UNDERSCORE": true
            }
        }
    }
}
MENU_EOF
    
    echo "  ✓ Created menu file"
else
    echo "→ Menu file already exists: $MENU_FILE"
fi

# ============================================
# Create UCI config (if not exists)
# ============================================
UCI_CONFIG="/etc/config/$MODULE_UNDERSCORE"

if [ ! -f "$UCI_CONFIG" ]; then
    echo "→ Creating UCI config: $UCI_CONFIG"
    
    cat > "$UCI_CONFIG" << UCI_EOF
config global 'global'
    option enabled '1'
    option version '2.0.0'
UCI_EOF
    
    echo "  ✓ Created UCI config"
else
    echo "→ UCI config already exists: $UCI_CONFIG"
fi

# ============================================
# Restart services
# ============================================
echo ""
echo "→ Restarting rpcd..."
/etc/init.d/rpcd restart

echo "→ Clearing LuCI cache..."
rm -rf /tmp/luci-*

# Wait for rpcd to initialize
sleep 2

# ============================================
# Verify
# ============================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Verification"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check ubus registration
if ubus list "$UBUS_NAME" > /dev/null 2>&1; then
    echo "✓ $UBUS_NAME is registered in ubus"
    echo ""
    echo "Available methods:"
    ubus -v list "$UBUS_NAME"
    
    echo ""
    echo "Testing status call:"
    ubus call "$UBUS_NAME" status
else
    echo "✗ $UBUS_NAME is NOT registered"
    echo ""
    echo "Debug steps:"
    echo "  1. Check script: cat $RPCD_SCRIPT"
    echo "  2. Test manually: echo '{\"method\":\"list\"}' | $RPCD_SCRIPT"
    echo "  3. Check logs: logread | grep rpcd"
fi

echo ""
echo "Done!"
