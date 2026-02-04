# secubox-app-dns-provider — TODO

## Pending

- [ ] Add GoDaddy provider adapter (`godaddy.sh`)
- [ ] Add Namecheap provider adapter (`namecheap.sh`)
- [ ] Implement `dnsctl update` for modifying existing records (currently must rm+add)
- [ ] Add batch record import/export (JSON or zone file format)
- [ ] Implement record caching to reduce API calls on list
- [ ] Add TTL validation per record type
- [ ] Wire ACME DNS-01 into haproxyctl `cert add --dns` flag
- [ ] Add DNS-01 challenge cleanup (remove _acme-challenge TXT records after issuance)
- [ ] Support OVH consumer key creation flow (`dnsctl ovh-auth`)
- [ ] Add rate limiting awareness per provider
- [ ] Integration test suite with mock API responses

## Multi-Node DNS Vision

- [ ] Mesh-aware dynamic DNS: each node announces its public IP to peers
- [ ] Local DNS relay: secubox-hosted DNS server that proxies to provider APIs
- [ ] Reverse DNS configuration via provider APIs
- [ ] Blockchain-backed DNS record anchoring (IPFS/ENS)
- [ ] Multi-provider failover: primary + secondary zone management
- [ ] Uncensored DNS mesh: peer-to-peer DNS resolution fallback
