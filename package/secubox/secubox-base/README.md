# SecuBox Base Utilities

Shared utility scripts used by other SecuBox packages. This is not a buildable OpenWrt package -- it provides common shell functions and helper scripts that are sourced or called by other SecuBox components.

## Key Files

| Path | Description |
|------|-------------|
| `/usr/sbin/secubox-network-health` | Network health monitoring script |

## Usage

The network health monitor can be run directly:

```bash
/usr/sbin/secubox-network-health
```

## Note

This package may be absorbed into `secubox-core` in a future release. New shared utilities should be added to `secubox-core` instead.

## License

Apache-2.0
