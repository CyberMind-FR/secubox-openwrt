   #!/bin/bash
   # Deploy SecuBox dashboard updates to router

   ROUTER="root@192.168.8.191"
   BASE_DIR="/home/reepost/CyberMindStudio/_files/secubox-openwrt"

   echo "🚀 Deploying SecuBox v0.0.5-beta dashboard to router..."

   # Copy dashboard files
   echo "📦 Copying dashboard.js..."
   scp "$BASE_DIR/luci-app-secubox/htdocs/luci-static/resources/view/secubox/dashboard.js" \
       $ROUTER:/www/luci-static/resources/view/secubox/dashboard.js

   echo "📦 Copying dashboard.css..."
   scp "$BASE_DIR/luci-app-secubox/htdocs/luci-static/resources/secubox/dashboard.css" \
       $ROUTER:/www/luci-static/resources/secubox/dashboard.css

   echo "📦 Copying alerts.js..."
   scp "$BASE_DIR/luci-app-secubox/htdocs/luci-static/resources/view/secubox/alerts.js" \
       $ROUTER:/www/luci-static/resources/view/secubox/alerts.js

   echo "📦 Copying alerts.css..."
   scp "$BASE_DIR/luci-app-secubox/htdocs/luci-static/resources/secubox/alerts.css" \
       $ROUTER:/www/luci-static/resources/secubox/alerts.css

   echo "📦 Copying monitoring.js..."
   scp "$BASE_DIR/luci-app-secubox/htdocs/luci-static/resources/view/secubox/monitoring.js" \
       $ROUTER:/www/luci-static/resources/view/secubox/monitoring.js

   echo "📦 Copying monitoring.css..."
   scp "$BASE_DIR/luci-app-secubox/htdocs/luci-static/resources/secubox/monitoring.css" \
       $ROUTER:/www/luci-static/resources/secubox/monitoring.css

   # Fix permissions on router
   echo "🔧 Fixing permissions on router..."
   ssh $ROUTER << 'REMOTE_EOF'
   chmod 644 /www/luci-static/resources/view/secubox/*.js
   chmod 644 /www/luci-static/resources/secubox/*.css
   rm -rf /tmp/luci-*
   echo "✅ Permissions fixed and cache cleared"
REMOTE_EOF

   echo ""
   echo "✅ Deployment complete!"
   echo "📱 Please refresh your browser with Ctrl+F5"
   echo ""
