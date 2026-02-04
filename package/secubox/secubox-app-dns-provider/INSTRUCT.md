# secubox-app-dns-provider — Setup Instructions

## Build

```bash
# Sync to local feed
rsync -av --delete package/secubox/secubox-app-dns-provider/ secubox-tools/local-feed/secubox-app-dns-provider/
rsync -av --delete package/secubox/luci-app-dns-provider/ secubox-tools/local-feed/luci-app-dns-provider/

# Build
./secubox-tools/local-build.sh build secubox-app-dns-provider
./secubox-tools/local-build.sh build luci-app-dns-provider
```

## Quick Deploy (Development)

```bash
# Backend scripts
scp package/secubox/secubox-app-dns-provider/files/usr/sbin/dnsctl root@192.168.255.1:/usr/sbin/
scp package/secubox/secubox-app-dns-provider/files/usr/lib/secubox/dns/*.sh root@192.168.255.1:/usr/lib/secubox/dns/
scp package/secubox/secubox-app-dns-provider/files/etc/config/dns-provider root@192.168.255.1:/etc/config/

# Make dnsctl executable
ssh root@192.168.255.1 'chmod +x /usr/sbin/dnsctl'

# RPCD + LuCI
scp package/secubox/luci-app-dns-provider/root/usr/libexec/rpcd/luci.dns-provider root@192.168.255.1:/usr/libexec/rpcd/
chmod +x on router: ssh root@192.168.255.1 'chmod +x /usr/libexec/rpcd/luci.dns-provider'
scp package/secubox/luci-app-dns-provider/root/usr/share/luci/menu.d/luci-app-dns-provider.json root@192.168.255.1:/usr/share/luci/menu.d/
scp package/secubox/luci-app-dns-provider/root/usr/share/rpcd/acl.d/luci-app-dns-provider.json root@192.168.255.1:/usr/share/rpcd/acl.d/
scp package/secubox/luci-app-dns-provider/htdocs/luci-static/resources/view/dns-provider/*.js root@192.168.255.1:/www/luci-static/resources/view/dns-provider/

# Restart + clear cache
ssh root@192.168.255.1 '/etc/init.d/rpcd restart && rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/*'
```

## Configuration

```bash
# Set provider (ovh, gandi, cloudflare)
uci set dns-provider.main.provider='ovh'
uci set dns-provider.main.zone='example.com'
uci set dns-provider.main.enabled='1'

# OVH credentials (from api.ovh.com/createToken)
uci set dns-provider.ovh.endpoint='ovh-eu'
uci set dns-provider.ovh.app_key='YOUR_APP_KEY'
uci set dns-provider.ovh.app_secret='YOUR_APP_SECRET'
uci set dns-provider.ovh.consumer_key='YOUR_CONSUMER_KEY'

# OR Gandi
uci set dns-provider.gandi.api_key='YOUR_PAT_TOKEN'

# OR Cloudflare
uci set dns-provider.cloudflare.api_token='YOUR_API_TOKEN'
uci set dns-provider.cloudflare.zone_id='YOUR_ZONE_ID'

uci commit dns-provider
```

## Testing

```bash
dnsctl status              # Verify config
dnsctl test                # Test API credentials
dnsctl list                # List zone records
dnsctl add A test 1.2.3.4  # Create test record
dnsctl verify test.example.com  # Check propagation
dnsctl rm A test           # Cleanup
```
