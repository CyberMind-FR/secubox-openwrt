# Double Caching Pattern — SecuBox Skill

## Overview

This pattern solves the common problem of LuCI dashboards timing out when RPC calls compute expensive aggregates from log files or database queries. The solution uses **two levels of caching**:

1. **Server-side static cache**: Cron job writes stats to JSON file
2. **Client-side progressive loading**: Show cached data immediately, enhance with async details

## When to Apply

Apply this pattern when:
- Dashboard shows aggregated stats (counts, totals, percentages)
- RPC handler reads/parses log files
- Data can be 1-60 seconds stale without user impact
- Users report "XHR timeout" errors in browser console

## Implementation

### Step 1: Create Stats Update Script

```bash
# /usr/sbin/<module>-stats-update
#!/bin/sh
CACHE_FILE="/tmp/secubox/<module>-stats.json"
mkdir -p /tmp/secubox

# Compute expensive stats here...
count=$(wc -l < /srv/module/data.log 2>/dev/null || echo 0)
status=$(pgrep module >/dev/null && echo true || echo false)

cat > "$CACHE_FILE" << EOF
{
  "running": $status,
  "count": $count,
  "updated": "$(date -Iseconds)"
}
EOF
```

### Step 2: Create Cron Job

```bash
# /etc/cron.d/<module>-stats
* * * * * root /usr/sbin/<module>-stats-update >/dev/null 2>&1
```

### Step 3: Add Cached RPCD Method

```sh
# In /usr/libexec/rpcd/luci.<module>
get_cached_status() {
    local cache="/tmp/secubox/<module>-stats.json"
    if [ -f "$cache" ]; then
        cat "$cache"
    else
        echo '{"running":false,"count":0,"updated":null}'
    fi
}

# In list_methods():
"status_cached":{}
```

### Step 4: Update LuCI JavaScript

```javascript
// Use cached method for fast initial load
var callStatus = rpc.declare({
    object: 'luci.<module>',
    method: 'status_cached'  // NOT 'status'
});

// Load with timeout protection
load: function() {
    return Promise.all([
        // Fast cached status
        callStatus().catch(function() { return {}; }),

        // Slower calls with short timeout
        Promise.race([
            callDetails(),
            new Promise(function(_, reject) {
                setTimeout(function() { reject('timeout'); }, 5000);
            })
        ]).catch(function() { return { details: [] }; })
    ]);
}
```

### Step 5: Progressive UI Enhancement

```javascript
render: function(data) {
    var status = data[0] || {};  // Always available (cached)
    var details = data[1] || {}; // May be empty on timeout

    // Always render status section
    view.appendChild(renderStatus(status));

    // Conditionally render details
    if (details.items && details.items.length > 0) {
        view.appendChild(renderDetails(details));
    } else {
        view.appendChild(E('p', {}, 'Loading details...'));
        // Optionally retry async
    }
}
```

## ACL Update

Add `status_cached` to ACL file:
```json
{
  "luci-app-<module>": {
    "read": {
      "ubus": {
        "luci.<module>": ["status", "status_cached", ...]
      }
    }
  }
}
```

## Cron Frequency Guide

| Data Type | Frequency | Rationale |
|-----------|-----------|-----------|
| Service status | 1 min | Cheap, users expect ~real-time |
| Log counts | 1 min | File system operations |
| Network stats | 1 min | netstat/ss calls |
| Heavy aggregates | 5 min | Database queries, large logs |
| External API data | 15+ min | Rate limits, network latency |

## Files Modified

When applying this pattern, you'll typically modify:
- `/usr/sbin/<module>-stats-update` (new)
- `/etc/cron.d/<module>-stats` (new)
- `/usr/libexec/rpcd/luci.<module>` (add cached method)
- `/www/luci-static/resources/view/<module>/status.js` (use cached call)
- `/usr/share/rpcd/acl.d/luci-app-<module>.json` (add to read ACL)

## Troubleshooting

### Cache file not updating
- Check cron daemon: `pgrep crond` or `/etc/init.d/cron status`
- Check script permissions: `chmod +x /usr/sbin/*-stats-update`
- Check for errors: `sh -x /usr/sbin/<module>-stats-update`

### Still getting timeouts
- Increase RPC timeout in JS: `Promise.race` timeout value
- Check if alerts/bans calls are the slow ones (move to separate tab)
- Verify HAProxy is not routing through slow WAF for LuCI

### Stale data shown
- Verify cron job is running: `cat /etc/cron.d/<module>-stats`
- Check cache file timestamp: `ls -la /tmp/secubox/<module>-stats.json`
