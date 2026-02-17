#!/bin/bash
# Wazuh Agent LXC Container Startup Script
# Includes watchdog to ensure wazuh-agentd stays running

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export HOME=/root

# DNS
echo "nameserver 1.1.1.1" > /etc/resolv.conf

# Start Wazuh agent
if [ -x /var/ossec/bin/wazuh-control ]; then
    /var/ossec/bin/wazuh-control start
fi

# Watchdog - check every 60 seconds if wazuh-agentd is running
while true; do
    sleep 60
    if ! pgrep -x wazuh-agentd > /dev/null 2>&1; then
        echo "[$(date)] WATCHDOG: wazuh-agentd not running, restarting..." >> /var/log/wazuh-watchdog.log
        /var/ossec/bin/wazuh-control restart
    fi
done
