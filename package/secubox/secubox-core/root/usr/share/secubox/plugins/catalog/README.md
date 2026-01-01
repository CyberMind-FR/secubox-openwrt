# SecuBox Module Catalog

This directory contains module catalog entries for the SecuBox AppStore.

## Structure

Each module has its own JSON file:
- `<module-id>.json` - Module manifest and metadata

## Module Catalog Format

```json
{
  "id": "module-name",
  "name": "Display Name",
  "version": "1.0.0",
  "category": "networking",
  "runtime": "native",
  "packages": {
    "required": ["package-name"],
    "recommended": ["optional-package"]
  },
  "capabilities": ["capability-1", "capability-2"],
  "requirements": {
    "min_ram_mb": 64,
    "min_storage_mb": 10
  }
}
```

## Categories

- `networking` - Network services and utilities
- `security` - Security and threat detection
- `monitoring` - System and network monitoring
- `iot` - IoT and home automation
- `media` - Media streaming and entertainment
- `system` - System utilities and management

## Adding New Modules

1. Create a new JSON file: `<module-id>.json`
2. Define the manifest with required fields:
   - `id`, `name`, `version`
   - `category`, `runtime`
   - `packages`, `capabilities`

3. Test installation:
   ```bash
   secubox app install <module-id>
   ```

## Notes

- Module catalog files are used by `secubox-appstore` for module discovery
- The `luci-app-secubox/appstore/apps.json` file contains the master catalog
- Individual module files here provide detailed metadata for advanced features
