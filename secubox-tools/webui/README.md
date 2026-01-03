# SecuBox WebUI Prototyper

FastAPI + Jinja2 mockup that emulates LuCI-like management of SecuBox plugins/modules on a local workstation. It virtualizes modules, presets, and command pipelines so developers can experiment without a router.

## Features
- **Module Catalog**: Browse 29+ auto-ingested SecuBox modules with live metadata from packages
- **AppStore**: Marketplace interface with categories, search, ratings, and reviews
- **Component Registry**: Reusable UI components from installed modules
- **Configuration Profiles**: Bundle modules and presets for different use cases
- **Template Generator**: UCI/network/firewall configuration templates
- **Settings**: Theme switching, language, backend connection (virtualized/SSH/HTTP)
- **Multi-theme Support**: SecuBox Light + LuCI Dark with seamless switching
- **Preset Runner**: Simulates multi-command pipelines with aggregated results/logs
- **Custom Context Console**: Feed JSON overrides into preset executions
- **HTMX Integration**: Partial updates for dynamic UI without page reloads
- **Alpine.js State**: Client-side reactivity and toast notifications

## Getting Started
```bash
cd secubox-tools/webui
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]  # or use UV/Poetry per preference
uvicorn app.main:app --reload --port 8100
```

Then visit `http://127.0.0.1:8100/` and toggle themes via the header controls.

## Project Layout
```
webui/
  app/                # FastAPI application package
  data/               # Fixture catalogs for modules, presets, commands
  templates/          # Jinja2 templates + multi-theme hierarchy
  static/             # Tailwind-ready CSS (currently handcrafted)
  scripts/            # Future ingest/automation helpers
```

## Regenerating the Module Catalog
The UI now ingests live metadata from `package/secubox/*` and root `luci-*` directories. Run the helper to refresh `data/modules.json` after editing packages:

```bash
# via helper script
cd secubox-tools/webui
./scripts/ingest_packages.py --pretty

# or using the installed CLI entry point
secubox-webui-ingest --pretty
```

This parser reads each Makefile (LUCI_TITLE, VERSION, DESCRIPTION, etc.), derives friendly names/tags, and assigns default secure contexts/actions for the virtualization mockups.

## Status

### Completed ✅
- ✅ Full navigation with 6 main sections (Modules, AppStore, Components, Profiles, Templates, Settings)
- ✅ Live package metadata ingestion from repository
- ✅ Multi-theme system (SecuBox Light / LuCI Dark)
- ✅ Preset virtualization engine with command simulation
- ✅ HTMX + Alpine.js integration for dynamic UI
- ✅ AppStore with categories, search, ratings, and reviews
- ✅ All HTML templates implemented
- ✅ Responsive card-based layouts
- ✅ API endpoints for programmatic access

### Next Steps
1. **Wire up interactive features**: Enable install/uninstall, profile activation, template generation
2. **Backend Integration**: Connect to real OpenWrt device via SSH or HTTP API
3. **Extend ingest flow**: Derive presets/commands from package metadata (ACLs, README checklists)
4. **Authentication**: Add session management for multi-user deployments
5. **Containerized dry-runs**: Extend virtualization engine to run in isolated containers
6. **Real-time updates**: WebSocket support for live system monitoring
