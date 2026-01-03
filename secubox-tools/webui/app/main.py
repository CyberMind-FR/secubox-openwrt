from __future__ import annotations

import json
from collections import Counter
from typing import Dict, List

from fastapi import FastAPI, Form, HTTPException, Request, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .config import settings
from .models import ExecutionResult, Module, Preset, RunPresetPayload
from .services import DataStore
from .websockets import command_center_websocket

app = FastAPI(title="SecuBox WebUI Prototyper", version="0.1.0")
store = DataStore()
templates = Jinja2Templates(directory=str(settings.project_root / "templates"))

app.mount(
    "/static",
    StaticFiles(directory=str(settings.project_root / "static")),
    name="static",
)

THEMES = {
    "secubox": "themes/secubox_light.html",
    "luci": "themes/luci_dark.html",
}

EMOJI_MAP = {
    "LuCI Application": "🧩",
    "LuCI Theme": "🎨",
    "SecuBox Service": "🛡️",
    "Framework": "⚙️",
    "SecuBox Package": "📦",
}

TAG_EMOJI_MAP = {
    "network": "🛰️",
    "security": "🛡️",
    "monitoring": "📡",
    "storage": "💾",
    "automation": "🤖",
    "profile": "📦",
}


def resolve_theme(theme_param: str | None) -> str:
    if not theme_param:
        return THEMES["secubox"]
    return THEMES.get(theme_param, THEMES["secubox"])


def emoji_for_module(module: Module) -> str:
    for tag in module.tags:
        if tag in TAG_EMOJI_MAP:
            return TAG_EMOJI_MAP[tag]
    return EMOJI_MAP.get(module.category, "🧩")


def filter_modules(modules: List[Module], tag: str | None) -> List[Module]:
    if not tag:
        return modules
    return [module for module in modules if tag in module.tags]


def gather_top_tags(modules: List[Module], limit: int = 6) -> List[str]:
    counter: Counter[str] = Counter()
    for module in modules:
        counter.update(module.tags)
    return [tag for tag, _ in counter.most_common(limit)]


@app.get("/", response_class=HTMLResponse)
async def index(request: Request, theme: str | None = None, tag: str | None = None) -> HTMLResponse:
    theme_template = resolve_theme(theme)
    modules = store.list_modules()
    filtered = filter_modules(modules, tag)
    top_tags = gather_top_tags(modules)
    presets = store.list_presets()
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "modules": filtered,
            "presets": presets,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
            "emoji_for_module": emoji_for_module,
            "available_tags": top_tags,
            "active_tag": tag,
        },
    )


@app.get("/modules/grid", response_class=HTMLResponse)
async def module_grid(request: Request, theme: str | None = None, tag: str | None = None) -> HTMLResponse:
    modules = filter_modules(store.list_modules(), tag)
    return templates.TemplateResponse(
        "partials/module_grid.html",
        {
            "request": request,
            "modules": modules,
            "emoji_for_module": emoji_for_module,
            "selected_theme": theme or "secubox",
        },
    )


@app.get("/modules/{module_id}", response_class=HTMLResponse)
async def module_detail(request: Request, module_id: str, theme: str | None = None) -> HTMLResponse:
    try:
        module = store.get_module(module_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Module not found")

    theme_template = resolve_theme(theme)
    return templates.TemplateResponse(
        "module_detail.html",
        {
            "request": request,
            "module": module,
            "theme_template": theme_template,
        },
    )


@app.post("/presets/{preset_id}/run", response_class=HTMLResponse)
async def run_preset(request: Request, preset_id: str) -> HTMLResponse:
    try:
        preset = store.get_preset(preset_id)
        module = store.get_module(preset.module)
        backend = store.get_backend()
        result = await backend.run_preset(preset, module)
    except KeyError:
        raise HTTPException(status_code=404, detail="Preset not found")

    return templates.TemplateResponse(
        "partials/run_result.html",
        {
            "request": request,
            "result": result,
        },
    )


@app.post("/presets/run", response_class=HTMLResponse)
async def run_custom_preset(
    request: Request,
    preset_id: str = Form(...),
    context_json: str = Form(""),
) -> HTMLResponse:
    extra_context = None
    context_input = context_json.strip()
    if context_input:
        try:
            extra_context = json.loads(context_input)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {exc.msg}")

    try:
        preset = store.get_preset(preset_id)
        module = store.get_module(preset.module)
        backend = store.get_backend()
        result = await backend.run_preset(preset, module, extra_context=extra_context)
    except KeyError:
        raise HTTPException(status_code=404, detail="Preset not found")

    return templates.TemplateResponse(
        "partials/run_result.html",
        {
            "request": request,
            "result": result,
        },
    )


# =================================================================
# PHASE 3: AppStore Section
# =================================================================


@app.get("/appstore", response_class=HTMLResponse)
async def appstore(
    request: Request,
    theme: str | None = None,
    category: str | None = None,
    search: str | None = None,
    installed: bool = False,
) -> HTMLResponse:
    theme_template = resolve_theme(theme)
    items = store.list_appstore_items(installed_only=installed)

    # Filter by category
    if category:
        items = [item for item in items if item.category == category]

    # Search filter
    if search:
        search_lower = search.lower()
        items = [
            item
            for item in items
            if search_lower in item.name.lower() or search_lower in item.summary.lower()
        ]

    # Gather unique categories
    all_items = store.list_appstore_items()
    categories = sorted(list(set(item.category for item in all_items)))

    return templates.TemplateResponse(
        "appstore.html",
        {
            "request": request,
            "items": items,
            "categories": categories,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
            "active_category": category,
            "search_query": search or "",
            "show_installed": installed,
        },
    )


@app.get("/appstore/grid", response_class=HTMLResponse)
async def appstore_grid(
    request: Request,
    theme: str | None = None,
    category: str | None = None,
    search: str | None = None,
) -> HTMLResponse:
    items = store.list_appstore_items()

    if category:
        items = [item for item in items if item.category == category]
    if search:
        search_lower = search.lower()
        items = [
            item
            for item in items
            if search_lower in item.name.lower() or search_lower in item.summary.lower()
        ]

    return templates.TemplateResponse(
        "partials/appstore_grid.html",
        {
            "request": request,
            "items": items,
            "selected_theme": theme or "secubox",
        },
    )


@app.get("/appstore/{item_id}", response_class=HTMLResponse)
async def appstore_detail(
    request: Request, item_id: str, theme: str | None = None
) -> HTMLResponse:
    try:
        item = store.get_appstore_item(item_id)
        reviews = store.get_reviews_for_app(item_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="App not found")

    theme_template = resolve_theme(theme)
    return templates.TemplateResponse(
        "appstore_detail.html",
        {
            "request": request,
            "item": item,
            "reviews": reviews,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
        },
    )


@app.post("/appstore/{item_id}/install", response_class=HTMLResponse)
async def install_app(request: Request, item_id: str) -> HTMLResponse:
    """Install an app (virtualized - updates JSON state)."""
    try:
        item = store.get_appstore_item(item_id)

        if item.installed:
            return templates.TemplateResponse(
                "partials/install_result.html",
                {
                    "request": request,
                    "status": "error",
                    "message": f"{item.name} is already installed!",
                    "item": item,
                },
            )

        # Simulate installation
        updated_item = store.update_appstore_item(item_id, {'installed': True})

        return templates.TemplateResponse(
            "partials/install_result.html",
            {
                "request": request,
                "status": "success",
                "message": f"Successfully installed {item.name}!",
                "item": updated_item,
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="App not found")


@app.post("/appstore/{item_id}/uninstall", response_class=HTMLResponse)
async def uninstall_app(request: Request, item_id: str) -> HTMLResponse:
    """Uninstall an app."""
    try:
        item = store.get_appstore_item(item_id)

        if not item.installed:
            return templates.TemplateResponse(
                "partials/install_result.html",
                {
                    "request": request,
                    "status": "error",
                    "message": f"{item.name} is not installed!",
                    "item": item,
                },
            )

        # Simulate uninstallation
        updated_item = store.update_appstore_item(item_id, {'installed': False})

        return templates.TemplateResponse(
            "partials/install_result.html",
            {
                "request": request,
                "status": "success",
                "message": f"Successfully uninstalled {item.name}!",
                "item": updated_item,
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="App not found")


@app.post("/appstore/{item_id}/update", response_class=HTMLResponse)
async def update_app(request: Request, item_id: str) -> HTMLResponse:
    """Update an app to latest version."""
    try:
        item = store.get_appstore_item(item_id)

        if not item.installed:
            return templates.TemplateResponse(
                "partials/install_result.html",
                {
                    "request": request,
                    "status": "error",
                    "message": f"{item.name} is not installed!",
                    "item": item,
                },
            )

        if not item.update_available:
            return templates.TemplateResponse(
                "partials/install_result.html",
                {
                    "request": request,
                    "status": "info",
                    "message": f"{item.name} is already up to date!",
                    "item": item,
                },
            )

        # Simulate update
        updated_item = store.update_appstore_item(item_id, {'update_available': False})

        return templates.TemplateResponse(
            "partials/install_result.html",
            {
                "request": request,
                "status": "success",
                "message": f"Successfully updated {item.name} to version {item.version}!",
                "item": updated_item,
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="App not found")


# =================================================================
# API Endpoints
# =================================================================


@app.get("/api/modules")
async def api_modules() -> Dict[str, list[Module]]:
    return {"modules": store.list_modules()}


@app.get("/api/presets")
async def api_presets() -> Dict[str, list[Preset]]:
    return {"presets": store.list_presets()}


@app.post("/api/presets/{preset_id}/run", response_model=ExecutionResult)
async def api_run_preset(preset_id: str, payload: RunPresetPayload | None = None) -> ExecutionResult:
    extra_context = payload.context if payload else None
    try:
        preset = store.get_preset(preset_id)
        module = store.get_module(preset.module)
        backend = store.get_backend()
        return await backend.run_preset(preset, module, extra_context=extra_context)
    except KeyError:
        raise HTTPException(status_code=404, detail="Preset not found")


# =================================================================
# PHASE 4: Components, Profiles, Templates, Settings
# =================================================================


@app.get("/components", response_class=HTMLResponse)
async def components(
    request: Request,
    theme: str | None = None,
    module_id: str | None = None,
) -> HTMLResponse:
    theme_template = resolve_theme(theme)
    components = store.list_components(module_id=module_id)
    modules = store.list_modules()
    return templates.TemplateResponse(
        "components.html",
        {
            "request": request,
            "components": components,
            "modules": modules,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
            "active_module": module_id,
        },
    )


@app.get("/profiles", response_class=HTMLResponse)
async def profiles(request: Request, theme: str | None = None) -> HTMLResponse:
    theme_template = resolve_theme(theme)
    profiles = store.list_profiles()
    return templates.TemplateResponse(
        "profiles.html",
        {
            "request": request,
            "profiles": profiles,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
        },
    )


@app.get("/templates", response_class=HTMLResponse)
async def templates_view(
    request: Request,
    theme: str | None = None,
    template_type: str | None = None,
) -> HTMLResponse:
    theme_template = resolve_theme(theme)
    template_items = store.list_templates(template_type=template_type)

    # Get unique template types
    all_templates = store.list_templates()
    template_types = sorted(list(set(t.template_type for t in all_templates)))

    return templates.TemplateResponse(
        "templates.html",
        {
            "request": request,
            "templates": template_items,
            "template_types": template_types,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
            "active_type": template_type,
        },
    )


@app.get("/settings", response_class=HTMLResponse)
async def settings_view(request: Request, theme: str | None = None) -> HTMLResponse:
    theme_template = resolve_theme(theme)
    settings_data = store.get_settings()
    devices = store.list_devices()
    return templates.TemplateResponse(
        "settings.html",
        {
            "request": request,
            "settings": settings_data,
            "devices": devices,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
            "available_themes": list(THEMES.keys()),
        },
    )


@app.post("/settings/save", response_class=HTMLResponse)
async def save_settings(
    request: Request,
    theme: str = Form(...),
    language: str = Form(...),
    backend_type: str = Form(...),
    auto_update: bool = Form(False),
    notifications: bool = Form(False),
    advanced_mode: bool = Form(False),
    openwrt_host: str = Form("192.168.1.1"),
    openwrt_port: int = Form(80),
    openwrt_username: str = Form("root"),
    openwrt_password: str = Form(""),
    openwrt_protocol: str = Form("http"),
) -> HTMLResponse:
    """Save settings and return success partial."""
    updates = {
        'theme': theme,
        'language': language,
        'backend_type': backend_type,
        'auto_update': auto_update,
        'notifications': notifications,
        'advanced_mode': advanced_mode,
    }

    # Build openwrt_connection config if using HTTP backend
    if backend_type == "http":
        updates['openwrt_connection'] = {
            'host': openwrt_host,
            'port': openwrt_port,
            'username': openwrt_username,
            'password': openwrt_password,
            'protocol': openwrt_protocol,
        }

    try:
        settings_data = store.update_settings(updates)
        # Reload backend to use new settings
        store.reload_backend()

        return templates.TemplateResponse(
            "partials/settings_result.html",
            {
                "request": request,
                "status": "success",
                "message": "Settings saved successfully! Backend reloaded.",
                "settings": settings_data,
            },
        )
    except Exception as e:
        return templates.TemplateResponse(
            "partials/settings_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to save settings: {str(e)}",
            },
        )


@app.post("/settings/reset", response_class=HTMLResponse)
async def reset_settings(request: Request) -> HTMLResponse:
    """Reset settings to defaults."""
    try:
        settings_data = store.reset_settings_to_defaults()
        return templates.TemplateResponse(
            "partials/settings_result.html",
            {
                "request": request,
                "status": "success",
                "message": "Settings reset to defaults!",
                "settings": settings_data,
            },
        )
    except Exception as e:
        return templates.TemplateResponse(
            "partials/settings_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to reset settings: {str(e)}",
            },
        )


@app.post("/api/backend/test", response_class=HTMLResponse)
async def test_backend_connection(request: Request) -> HTMLResponse:
    """Test connection to configured backend."""
    try:
        backend = store.get_backend()
        success = await backend.test_connection()

        if success:
            return templates.TemplateResponse(
                "partials/settings_result.html",
                {
                    "request": request,
                    "status": "success",
                    "message": f"Connection test successful! Backend type: {store.settings_data.backend_type}",
                },
            )
        else:
            return templates.TemplateResponse(
                "partials/settings_result.html",
                {
                    "request": request,
                    "status": "error",
                    "message": "Connection test failed. Please check your settings.",
                },
            )
    except Exception as e:
        return templates.TemplateResponse(
            "partials/settings_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Connection test failed: {str(e)}",
            },
        )


# =================================================================
# Device Management Endpoints
# =================================================================


@app.post("/devices/add", response_class=HTMLResponse)
async def add_device(
    request: Request,
    device_name: str = Form(...),
    device_emoji: str = Form("🌐"),
    device_description: str = Form(""),
    device_connection_type: str = Form("http"),
    device_host: str = Form("192.168.1.1"),
    device_port: int = Form(80),
    device_protocol: str = Form("http"),
    device_username: str = Form("root"),
    device_password: str = Form(""),
) -> HTMLResponse:
    """Add new device."""
    try:
        from .models import Device
        import uuid

        # Generate unique ID
        device_id = f"device-{uuid.uuid4().hex[:8]}"

        # Create device
        device = Device(
            id=device_id,
            name=device_name,
            emoji=device_emoji,
            description=device_description,
            connection_type=device_connection_type,
            host=device_host,
            port=device_port,
            protocol=device_protocol,
            username=device_username,
            password=device_password,
            active=False,  # Don't auto-activate
        )

        store.add_device(device)

        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "success",
                "message": f"Device '{device_name}' added successfully!",
                "reload_page": True,
            },
        )
    except Exception as e:
        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to add device: {str(e)}",
            },
        )


@app.post("/devices/{device_id}/activate", response_class=HTMLResponse)
async def activate_device_endpoint(
    request: Request, device_id: str
) -> HTMLResponse:
    """Activate device and switch backend connection."""
    try:
        device = store.activate_device(device_id)

        # Test connection to new device
        backend = store.get_backend()
        connection_test = await backend.test_connection()

        if connection_test:
            return templates.TemplateResponse(
                "partials/device_action_result.html",
                {
                    "request": request,
                    "status": "success",
                    "message": f"Switched to device '{device.name}' successfully!",
                    "connection_details": f"Connected to {device.host}:{device.port}",
                    "reload_page": True,
                },
            )
        else:
            return templates.TemplateResponse(
                "partials/device_action_result.html",
                {
                    "request": request,
                    "status": "error",
                    "message": f"Device '{device.name}' activated but connection test failed!",
                    "connection_details": f"Could not reach {device.host}:{device.port}",
                },
            )

    except KeyError:
        raise HTTPException(status_code=404, detail="Device not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to activate device: {str(e)}",
            },
        )


@app.post("/devices/{device_id}/test", response_class=HTMLResponse)
async def test_device_connection(
    request: Request, device_id: str
) -> HTMLResponse:
    """Test connection to specific device (without activating)."""
    try:
        device = store.get_device(device_id)

        # Create temporary backend for this device
        from .backends.http import HTTPBackend
        from .backends.virtualized import VirtualizedBackend

        if device.connection_type == "http":
            connection_config = {
                'host': device.host,
                'port': device.port,
                'username': device.username,
                'password': device.password,
                'protocol': device.protocol,
            }
            temp_backend = HTTPBackend(connection_config)
        elif device.connection_type == "virtualized":
            temp_backend = VirtualizedBackend(store)
        else:
            raise ValueError(f"Unsupported connection type: {device.connection_type}")

        # Test connection
        success = await temp_backend.test_connection()

        if success:
            return templates.TemplateResponse(
                "partials/device_action_result.html",
                {
                    "request": request,
                    "status": "success",
                    "message": f"Connection to '{device.name}' successful!",
                    "connection_details": f"{device.host}:{device.port} ({device.connection_type})",
                },
            )
        else:
            return templates.TemplateResponse(
                "partials/device_action_result.html",
                {
                    "request": request,
                    "status": "error",
                    "message": f"Connection to '{device.name}' failed!",
                    "connection_details": f"Could not reach {device.host}:{device.port}",
                },
            )

    except KeyError:
        raise HTTPException(status_code=404, detail="Device not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Connection test failed: {str(e)}",
            },
        )


@app.get("/devices/{device_id}/edit", response_class=HTMLResponse)
async def get_device_edit_form(
    request: Request, device_id: str
) -> HTMLResponse:
    """Get edit form for device."""
    try:
        device = store.get_device(device_id)
        return templates.TemplateResponse(
            "partials/device_edit_modal.html",
            {
                "request": request,
                "device": device,
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Device not found")


@app.post("/devices/{device_id}/update", response_class=HTMLResponse)
async def update_device_endpoint(
    request: Request,
    device_id: str,
    device_name: str = Form(...),
    device_emoji: str = Form("🌐"),
    device_description: str = Form(""),
    device_host: str = Form(...),
    device_port: int = Form(80),
    device_protocol: str = Form("http"),
    device_username: str = Form(...),
    device_password: str = Form(""),
) -> HTMLResponse:
    """Update device configuration."""
    try:
        updates = {
            'name': device_name,
            'emoji': device_emoji,
            'description': device_description,
            'host': device_host,
            'port': device_port,
            'protocol': device_protocol,
            'username': device_username,
        }

        # Only update password if provided
        if device_password:
            updates['password'] = device_password

        device = store.update_device(device_id, updates)

        # If this is the active device, reload backend
        if device.active:
            store.reload_backend()

        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "success",
                "message": f"Device '{device_name}' updated successfully!",
                "reload_page": True,
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Device not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to update device: {str(e)}",
            },
        )


@app.delete("/devices/{device_id}", response_class=HTMLResponse)
async def delete_device_endpoint(
    request: Request, device_id: str
) -> HTMLResponse:
    """Delete device."""
    try:
        device = store.get_device(device_id)
        device_name = device.name

        store.delete_device(device_id)

        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "success",
                "message": f"Device '{device_name}' deleted successfully!",
                "reload_page": True,
            },
        )
    except ValueError as e:
        # Cannot delete active device
        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "error",
                "message": str(e),
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Device not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/device_action_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to delete device: {str(e)}",
            },
        )


# =================================================================
# Command Center WebSocket Endpoint
# =================================================================


@app.websocket("/ws/command-center")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time command center data streaming."""
    await command_center_websocket(websocket, store)


# =================================================================
# Profile Management Endpoints
# =================================================================


@app.post("/profiles/{profile_id}/activate", response_class=HTMLResponse)
async def activate_profile(request: Request, profile_id: str) -> HTMLResponse:
    """Activate a profile (deactivates others)."""
    try:
        profile = store.update_profile(profile_id, active=True)

        # Simulate profile activation (virtualized)
        modules_loaded = len(profile.modules)
        presets_loaded = len(profile.presets)

        return templates.TemplateResponse(
            "partials/profile_action_result.html",
            {
                "request": request,
                "status": "success",
                "action": "activated",
                "profile": profile,
                "message": f"Profile '{profile.name}' activated! Loaded {modules_loaded} modules and {presets_loaded} presets.",
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/profile_action_result.html",
            {
                "request": request,
                "status": "error",
                "action": "activate",
                "message": f"Failed to activate profile: {str(e)}",
            },
        )


@app.post("/profiles/{profile_id}/deactivate", response_class=HTMLResponse)
async def deactivate_profile(request: Request, profile_id: str) -> HTMLResponse:
    """Deactivate a profile."""
    try:
        profile = store.update_profile(profile_id, active=False)

        return templates.TemplateResponse(
            "partials/profile_action_result.html",
            {
                "request": request,
                "status": "success",
                "action": "deactivated",
                "profile": profile,
                "message": f"Profile '{profile.name}' deactivated.",
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/profile_action_result.html",
            {
                "request": request,
                "status": "error",
                "action": "deactivate",
                "message": f"Failed to deactivate profile: {str(e)}",
            },
        )


@app.post("/profiles/{profile_id}/reload", response_class=HTMLResponse)
async def reload_profile(request: Request, profile_id: str) -> HTMLResponse:
    """Reload active profile (re-apply configuration)."""
    try:
        profile = store.get_profile(profile_id)
        if not profile.active:
            raise HTTPException(status_code=400, detail="Profile is not active")

        # Simulate reload
        return templates.TemplateResponse(
            "partials/profile_action_result.html",
            {
                "request": request,
                "status": "success",
                "action": "reloaded",
                "profile": profile,
                "message": f"Profile '{profile.name}' reloaded successfully.",
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/profile_action_result.html",
            {
                "request": request,
                "status": "error",
                "action": "reload",
                "message": f"Failed to reload profile: {str(e)}",
            },
        )


# =================================================================
# Template Generation Endpoints
# =================================================================


@app.post("/templates/{template_id}/generate", response_class=HTMLResponse)
async def generate_template_endpoint(
    request: Request,
    template_id: str,
    variables_json: str = Form(""),
) -> HTMLResponse:
    """Generate configuration from template."""
    try:
        template = store.get_template(template_id)

        # Parse variables from form
        variables = {}
        if variables_json.strip():
            try:
                variables = json.loads(variables_json)
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON: {e.msg}")

        # Generate configuration
        output = store.generate_template(template_id, variables)

        return templates.TemplateResponse(
            "partials/template_result.html",
            {
                "request": request,
                "status": "success",
                "template": template,
                "output": output,
                "variables": variables,
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Template not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/template_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Generation failed: {str(e)}",
            },
        )


@app.get("/templates/{template_id}/preview", response_class=HTMLResponse)
async def preview_template(request: Request, template_id: str) -> HTMLResponse:
    """Show template preview modal."""
    try:
        template = store.get_template(template_id)

        return templates.TemplateResponse(
            "partials/template_preview.html",
            {
                "request": request,
                "template": template,
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Template not found")


# =================================================================
# Workspace & Project Hub Endpoints
# =================================================================


@app.get("/workspace", response_class=HTMLResponse)
async def workspace(request: Request, theme: str | None = None) -> HTMLResponse:
    """Main workspace interface - project hub and module kit browser."""
    theme_template = resolve_theme(theme)
    projects = store.list_projects()
    module_kits = store.list_module_kits()
    workspace_data = store.get_workspace()
    devices = store.list_devices()

    return templates.TemplateResponse(
        "workspace.html",
        {
            "request": request,
            "projects": projects,
            "module_kits": module_kits,
            "workspace": workspace_data,
            "devices": devices,
            "theme_template": theme_template,
            "selected_theme": theme or "secubox",
        },
    )


@app.post("/workspace/projects/{project_id}/activate", response_class=HTMLResponse)
async def activate_project_endpoint(request: Request, project_id: str) -> HTMLResponse:
    """Activate a project (deactivates others)."""
    try:
        project = store.activate_project(project_id)

        return templates.TemplateResponse(
            "partials/workspace_project_result.html",
            {
                "request": request,
                "status": "success",
                "project": project,
                "message": f"Switched to project '{project.name}' ({project.project_type})",
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Project not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/workspace_project_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to activate project: {str(e)}",
            },
        )


@app.post("/workspace/kits/{kit_id}/install", response_class=HTMLResponse)
async def install_kit_endpoint(request: Request, kit_id: str) -> HTMLResponse:
    """Install module kit to active project."""
    try:
        kit = store.get_module_kit(kit_id)
        active_project = store.get_active_project()

        if not active_project:
            return templates.TemplateResponse(
                "partials/workspace_kit_result.html",
                {
                    "request": request,
                    "status": "error",
                    "message": "No active project. Please select a project first.",
                },
            )

        # Add kit's modules to project
        for module_id in kit.modules:
            if module_id not in active_project.modules:
                active_project.modules.append(module_id)

        # Add kit's presets to project
        for preset_id in kit.presets:
            if preset_id not in active_project.profiles:
                active_project.profiles.append(preset_id)

        # Save updated project
        store.update_project(active_project.id, {
            "modules": active_project.modules,
            "profiles": active_project.profiles,
        })

        # Update kit download count
        store.update_module_kit(kit_id, {"downloads": kit.downloads + 1})

        return templates.TemplateResponse(
            "partials/workspace_kit_result.html",
            {
                "request": request,
                "status": "success",
                "kit": kit,
                "project": active_project,
                "message": f"Kit '{kit.name}' installed to project '{active_project.name}'! Added {len(kit.modules)} modules.",
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Kit not found")
    except Exception as e:
        return templates.TemplateResponse(
            "partials/workspace_kit_result.html",
            {
                "request": request,
                "status": "error",
                "message": f"Failed to install kit: {str(e)}",
            },
        )


@app.get("/workspace/kits", response_class=HTMLResponse)
async def list_kits_endpoint(request: Request, category: str | None = None) -> HTMLResponse:
    """Browse module kits filtered by category."""
    kits = store.list_module_kits(category=category)

    return templates.TemplateResponse(
        "partials/workspace_module_kits.html",
        {
            "request": request,
            "module_kits": kits,
            "category_filter": category,
        },
    )
