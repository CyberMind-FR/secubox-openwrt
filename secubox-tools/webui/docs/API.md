# SecuBox WebUI API Documentation

## Base URL
Development: `http://127.0.0.1:8100`

## HTML Endpoints (Browser UI)

### Main Navigation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page - Module catalog |
| `/appstore` | GET | AppStore marketplace |
| `/components` | GET | Component registry |
| `/profiles` | GET | Configuration profiles |
| `/templates` | GET | Configuration templates |
| `/settings` | GET | Settings & preferences |

### Module Management

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/modules/grid` | GET | Module grid partial (HTMX) | `theme`, `tag` |
| `/modules/{module_id}` | GET | Module detail page | - |

### AppStore

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/appstore` | GET | AppStore page | `category`, `search`, `installed`, `theme` |
| `/appstore/grid` | GET | AppStore grid partial (HTMX) | `category`, `search`, `theme` |
| `/appstore/{item_id}` | GET | App detail page | - |
| `/appstore/{item_id}/install` | POST | Install app (mock) | - |

### Preset Execution

| Endpoint | Method | Description | Body |
|----------|--------|-------------|------|
| `/presets/{preset_id}/run` | POST | Run preset (simple) | - |
| `/presets/run` | POST | Run preset with context | `preset_id` (form), `context_json` (form) |

## JSON API Endpoints

### Modules

**GET /api/modules**

Returns list of all modules.

Response:
```json
{
  "modules": [
    {
      "id": "luci-app-auth-guardian",
      "name": "Auth Guardian",
      "category": "LuCI Application",
      "version": "0.4.0",
      "summary": "Comprehensive authentication and session management...",
      "health": "stable",
      "tags": ["auth", "guardian"],
      "secure_contexts": ["ui-sandbox"],
      "actions": ["Preview UI", "Run Diagnostics"]
    }
  ]
}
```

### Presets

**GET /api/presets**

Returns list of all presets.

Response:
```json
{
  "presets": [
    {
      "id": "core-snapshot",
      "name": "Device Snapshot",
      "description": "Capture full device state",
      "module": "secubox-core",
      "command_sequence": ["snapshot", "validate"],
      "parameters": {},
      "expected_outcome": "Complete device snapshot"
    }
  ]
}
```

**POST /api/presets/{preset_id}/run**

Execute a preset with optional context.

Request Body:
```json
{
  "context": {
    "mode": "dry-run",
    "verbose": true
  }
}
```

Response:
```json
{
  "preset": { ... },
  "summary": "Preset 'Device Snapshot' completed for SecuBox Core",
  "context": {
    "module": "SecuBox Core",
    "mode": "dry-run"
  },
  "commands": [
    {
      "command_id": "snapshot",
      "name": "System Snapshot",
      "log": "Snapshot completed successfully...",
      "status": "ok"
    }
  ],
  "warnings": null
}
```

## Query Parameters

### Common Parameters

- `theme` - Theme selection (`secubox` or `luci`)
- `tag` - Filter by tag
- `category` - Filter by category
- `search` - Search query string
- `installed` - Boolean, show only installed items
- `module_id` - Filter by module ID
- `template_type` - Filter templates by type

## Theme Support

All HTML endpoints accept a `?theme=` parameter:
- `?theme=secubox` - SecuBox Light theme (default)
- `?theme=luci` - LuCI Dark theme

## Static Assets

- `/static/css/` - Stylesheets
- `/static/js/` - JavaScript files
- `/static/images/` - Images and icons

## Interactive Features (HTMX)

Many endpoints return HTML partials for HTMX:
- `hx-get="/modules/grid?tag=security"` - Load filtered modules
- `hx-post="/presets/run"` - Run preset with form data
- `hx-get="/appstore/grid?search=vpn"` - Search apps

## Development Tools

- `/docs` - Auto-generated OpenAPI documentation (Swagger UI)
- `/redoc` - ReDoc API documentation
- `/openapi.json` - OpenAPI schema
