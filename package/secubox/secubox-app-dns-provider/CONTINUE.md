# secubox-app-dns-provider — Continue / Next Steps

## Immediate Next Steps

1. **Test on router**: Deploy dnsctl + adapters, configure OVH/Gandi/Cloudflare credentials, verify CRUD operations
2. **Test LuCI views**: Deploy RPCD handler + JS views, verify settings form saves correctly, test record operations from UI
3. **ACME DNS-01 integration**: Wire `dnsctl acme-dns01` into haproxyctl's certificate management flow

## Phase 2: Additional Providers

4. **GoDaddy adapter** (`godaddy.sh`): REST API with API Key + Secret, similar pattern to Cloudflare
5. **Namecheap adapter** (`namecheap.sh`): XML API with API Key + IP whitelist
6. **Self-hosted relay**: Local DNS server (dnsmasq or PowerDNS) that syncs records to upstream providers

## Phase 3: Multi-Node DNS Mesh

7. **Mesh DNS announcement**: Each secubox node announces its public IP and managed domains to P2P peers
8. **Dynamic DNS updater**: Periodic public IP check + auto-update records when IP changes
9. **Reverse DNS**: Provider API calls to configure PTR records
10. **DNS failover**: Multi-provider configuration for redundancy

## Phase 4: Decentralized DNS

11. **Blockchain anchoring**: Anchor DNS records to ENS/Handshake for censorship resistance
12. **Peer DNS cache**: Mesh nodes share DNS resolution cache
13. **Uncensored resolution**: Fallback to mesh peer DNS when upstream resolvers are filtered

## Integration Points

- **Device Intelligence**: "Expose via DNS" action from device context → create DNS record + HAProxy vhost + ACME cert
- **HAProxy**: Auto-sync vhosts to DNS when domains are configured
- **Exposure Engine**: Link exposed services to DNS management
- **P2P Mesh**: Federate DNS records across mesh nodes
