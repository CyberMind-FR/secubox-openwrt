from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from jinja2 import Environment

from .config import settings
from .models import (
    AppStoreItem,
    Command,
    CommandResult,
    ComponentRegistry,
    Device,
    ExecutionResult,
    Module,
    ModuleKit,
    Preset,
    Profile,
    Project,
    Review,
    Settings,
    Template,
    Workspace,
)

if TYPE_CHECKING:
    from .backends.base import BackendBase


class DataStore:
    """Loads module/preset/command fixtures and keeps them in memory."""

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self.data_dir = data_dir or settings.data_dir
        self.modules: Dict[str, Module] = {}
        self.presets: Dict[str, Preset] = {}
        self.commands: Dict[str, Command] = {}
        self.appstore_items: Dict[str, AppStoreItem] = {}
        self.components: Dict[str, ComponentRegistry] = {}
        self.profiles: Dict[str, Profile] = {}
        self.templates: Dict[str, Template] = {}
        self.devices: Dict[str, Device] = {}
        self.settings_data: Settings = Settings()
        self.reviews: Dict[str, List[Review]] = {}

        # Phase 3: Workspace & Project Hub data
        self.projects: Dict[str, Project] = {}
        self.module_kits: Dict[str, ModuleKit] = {}
        self.workspace_data: Workspace = Workspace()

        self._write_lock = threading.Lock()
        self._backend: Optional["BackendBase"] = None
        self.reload()

    def _load_file(self, filename: str) -> List[Dict[str, Any]]:
        path = self.data_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Missing fixture: {path}")
        with path.open() as fp:
            return json.load(fp)

    def _load_optional(self, filename: str, model_class) -> Dict[str, Any]:
        """Load optional data file with fallback to empty dict."""
        path = self.data_dir / filename
        if not path.exists():
            return {}
        with path.open() as fp:
            data = json.load(fp)
            if isinstance(data, list):
                return {item["id"]: model_class(**item) for item in data}
            return {}

    def _load_reviews(self, filename: str) -> Dict[str, List[Review]]:
        """Load reviews grouped by app_id."""
        path = self.data_dir / filename
        if not path.exists():
            return {}
        with path.open() as fp:
            reviews_data = json.load(fp)
            grouped: Dict[str, List[Review]] = {}
            for review_dict in reviews_data:
                review = Review(**review_dict)
                if review.app_id not in grouped:
                    grouped[review.app_id] = []
                grouped[review.app_id].append(review)
            return grouped

    def reload(self) -> None:
        # Original data
        self.modules = {item["id"]: Module(**item) for item in self._load_file("modules.json")}
        self.presets = {item["id"]: Preset(**item) for item in self._load_file("presets.json")}
        self.commands = {item["id"]: Command(**item) for item in self._load_file("commands.json")}

        # New data (Phase 2)
        self.appstore_items = self._load_optional("appstore.json", AppStoreItem)
        self.components = self._load_optional("components.json", ComponentRegistry)
        self.profiles = self._load_optional("profiles.json", Profile)
        self.templates = self._load_optional("templates.json", Template)
        self.devices = self._load_optional("devices.json", Device)
        self.reviews = self._load_reviews("reviews.json")

        # Load settings (single object)
        settings_path = self.data_dir / "settings.json"
        if settings_path.exists():
            with settings_path.open() as fp:
                self.settings_data = Settings(**json.load(fp))

        # Phase 3: Workspace & Project Hub data
        self.projects = self._load_optional("projects.json", Project)
        self.module_kits = self._load_optional("module_kits.json", ModuleKit)

        # Load workspace (single object)
        workspace_path = self.data_dir / "workspace.json"
        if workspace_path.exists():
            with workspace_path.open() as fp:
                self.workspace_data = Workspace(**json.load(fp))

        # Migrate from settings.openwrt_connection if devices.json doesn't exist
        if not self.devices and self.settings_data.openwrt_connection:
            self._migrate_device_from_settings()

    def list_modules(self) -> List[Module]:
        return list(self.modules.values())

    def list_presets(self) -> List[Preset]:
        return list(self.presets.values())

    def get_module(self, module_id: str) -> Module:
        return self.modules[module_id]

    def get_preset(self, preset_id: str) -> Preset:
        return self.presets[preset_id]

    def get_command(self, command_id: str) -> Command:
        return self.commands[command_id]

    # New methods for Phase 2 data types
    def list_appstore_items(self, installed_only: bool = False) -> List[AppStoreItem]:
        items = list(self.appstore_items.values())
        if installed_only:
            return [item for item in items if item.installed]
        return items

    def get_appstore_item(self, item_id: str) -> AppStoreItem:
        return self.appstore_items[item_id]

    def list_components(self, module_id: Optional[str] = None) -> List[ComponentRegistry]:
        components = list(self.components.values())
        if module_id:
            return [c for c in components if c.module_id == module_id]
        return components

    def get_component(self, component_id: str) -> ComponentRegistry:
        return self.components[component_id]

    def list_profiles(self) -> List[Profile]:
        return sorted(self.profiles.values(), key=lambda p: p.priority, reverse=True)

    def get_profile(self, profile_id: str) -> Profile:
        return self.profiles[profile_id]

    def list_templates(self, template_type: Optional[str] = None) -> List[Template]:
        templates = list(self.templates.values())
        if template_type:
            return [t for t in templates if t.template_type == template_type]
        return templates

    def get_template(self, template_id: str) -> Template:
        return self.templates[template_id]

    def get_reviews_for_app(self, app_id: str) -> List[Review]:
        return self.reviews.get(app_id, [])

    def get_settings(self) -> Settings:
        return self.settings_data

    def _save_file(self, filename: str, data: Any) -> None:
        """Thread-safe JSON file writer with pretty formatting."""
        path = self.data_dir / filename
        with self._write_lock:
            with path.open('w') as fp:
                json.dump(data, fp, indent=2)

    def update_settings(self, updates: Dict[str, Any]) -> Settings:
        """Update settings and persist to data/settings.json."""
        for key, value in updates.items():
            if hasattr(self.settings_data, key):
                setattr(self.settings_data, key, value)

        self._save_file('settings.json', self.settings_data.model_dump())
        return self.settings_data

    def reset_settings_to_defaults(self) -> Settings:
        """Reset settings to defaults and persist."""
        self.settings_data = Settings()
        self._save_file('settings.json', self.settings_data.model_dump())
        return self.settings_data

    def update_profile(self, profile_id: str, active: bool) -> Profile:
        """Activate/deactivate a profile (deactivates others if activating)."""
        if active:
            # Deactivate all other profiles first
            for prof in self.profiles.values():
                prof.active = False

        profile = self.profiles[profile_id]
        profile.active = active

        # Persist all profiles
        profiles_list = [p.model_dump() for p in self.profiles.values()]
        self._save_file('profiles.json', profiles_list)

        return profile

    def update_appstore_item(self, item_id: str, updates: Dict[str, Any]) -> AppStoreItem:
        """Update app installation status in data/appstore.json."""
        item = self.appstore_items[item_id]
        for key, value in updates.items():
            if hasattr(item, key):
                setattr(item, key, value)

        # Persist all items
        items_list = [i.model_dump() for i in self.appstore_items.values()]
        self._save_file('appstore.json', items_list)

        return item

    def generate_template(self, template_id: str, variables: Dict[str, Any]) -> str:
        """Render Jinja2 template with merged variables."""
        template = self.templates[template_id]
        env = Environment(trim_blocks=True, lstrip_blocks=True)
        jinja_template = env.from_string(template.content)

        # Merge with default variables
        merged_vars = {**template.variables, **variables}
        return jinja_template.render(**merged_vars)

    # =================================================================
    # Device Management Methods
    # =================================================================

    def _migrate_device_from_settings(self) -> None:
        """One-time migration from settings.openwrt_connection to devices.json."""
        conn = self.settings_data.openwrt_connection
        if not conn:
            return

        device = Device(
            id="migrated-device",
            name="Migrated Device",
            emoji="🌐",
            description="Auto-migrated from settings",
            host=conn.get("host", "192.168.1.1"),
            port=conn.get("port", 80),
            username=conn.get("username", "root"),
            password=conn.get("password", ""),
            protocol=conn.get("protocol", "http"),
            connection_type=self.settings_data.backend_type,
            active=True,
            tags=["migrated"],
        )

        self.devices[device.id] = device
        devices_list = [d.model_dump() for d in self.devices.values()]
        self._save_file('devices.json', devices_list)

    def list_devices(self) -> List[Device]:
        """Get all devices sorted by active status (active first), then by name."""
        return sorted(self.devices.values(), key=lambda d: (not d.active, d.name))

    def get_device(self, device_id: str) -> Device:
        """Get device by ID."""
        return self.devices[device_id]

    def get_active_device(self) -> Optional[Device]:
        """Get currently active device."""
        for device in self.devices.values():
            if device.active:
                return device
        return None

    def add_device(self, device: Device) -> Device:
        """Add new device to collection."""
        self.devices[device.id] = device
        devices_list = [d.model_dump() for d in self.devices.values()]
        self._save_file('devices.json', devices_list)
        return device

    def update_device(self, device_id: str, updates: Dict[str, Any]) -> Device:
        """Update device configuration."""
        device = self.devices[device_id]
        for key, value in updates.items():
            if hasattr(device, key):
                setattr(device, key, value)

        devices_list = [d.model_dump() for d in self.devices.values()]
        self._save_file('devices.json', devices_list)
        return device

    def delete_device(self, device_id: str) -> None:
        """Delete device. Cannot delete active device."""
        device = self.devices.get(device_id)
        if device and device.active:
            raise ValueError("Cannot delete active device. Switch to another device first.")

        del self.devices[device_id]
        devices_list = [d.model_dump() for d in self.devices.values()]
        self._save_file('devices.json', devices_list)

    def activate_device(self, device_id: str) -> Device:
        """Activate device (deactivates all others) and reload backend."""
        from datetime import datetime

        # Deactivate all devices
        for dev in self.devices.values():
            dev.active = False

        # Activate target device
        device = self.devices[device_id]
        device.active = True

        # Update last_connected timestamp
        device.last_connected = datetime.now().isoformat()

        # Persist changes
        devices_list = [d.model_dump() for d in self.devices.values()]
        self._save_file('devices.json', devices_list)

        # Force backend reload to reconnect to new device
        self.reload_backend()

        return device

    def get_backend(self) -> "BackendBase":
        """
        Get backend instance based on current settings.

        Uses lazy initialization and caching. Backend is created on first access
        and cached for subsequent calls.

        Returns:
            BackendBase: Configured backend instance (Virtualized or HTTP)
        """
        if self._backend is None:
            from .backends.factory import get_backend
            self._backend = get_backend(self.settings_data, self)
        return self._backend

    def reload_backend(self) -> None:
        """
        Force backend reload.

        Call this after settings change to ensure new backend configuration
        takes effect.
        """
        self._backend = None

    # =================================================================
    # Project Hub & Workspace Management Methods
    # =================================================================

    def list_projects(self) -> List[Project]:
        """Get all projects sorted by active status (active first), then by name."""
        return sorted(self.projects.values(), key=lambda p: (not p.active, p.name))

    def get_project(self, project_id: str) -> Project:
        """Get project by ID."""
        return self.projects[project_id]

    def get_active_project(self) -> Optional[Project]:
        """Get currently active project."""
        for project in self.projects.values():
            if project.active:
                return project
        return None

    def add_project(self, project: Project) -> Project:
        """Add new project to collection."""
        self.projects[project.id] = project
        projects_list = [p.model_dump() for p in self.projects.values()]
        self._save_file('projects.json', projects_list)
        return project

    def update_project(self, project_id: str, updates: Dict[str, Any]) -> Project:
        """Update project configuration."""
        project = self.projects[project_id]
        for key, value in updates.items():
            if hasattr(project, key):
                setattr(project, key, value)

        projects_list = [p.model_dump() for p in self.projects.values()]
        self._save_file('projects.json', projects_list)
        return project

    def delete_project(self, project_id: str) -> None:
        """Delete project. Cannot delete active project."""
        project = self.projects.get(project_id)
        if project and project.active:
            raise ValueError("Cannot delete active project. Switch to another project first.")

        del self.projects[project_id]
        projects_list = [p.model_dump() for p in self.projects.values()]
        self._save_file('projects.json', projects_list)

    def activate_project(self, project_id: str) -> Project:
        """Activate project (deactivates all others)."""
        from datetime import datetime

        # Deactivate all projects
        for proj in self.projects.values():
            proj.active = False

        # Activate target project
        project = self.projects[project_id]
        project.active = True

        # Update last_accessed timestamp
        project.last_accessed = datetime.now().isoformat()

        # Persist changes
        projects_list = [p.model_dump() for p in self.projects.values()]
        self._save_file('projects.json', projects_list)

        # Update workspace to track active project
        self.workspace_data.active_project = project_id
        self._save_file('workspace.json', self.workspace_data.model_dump())

        return project

    def list_module_kits(self, category: Optional[str] = None) -> List[ModuleKit]:
        """Get all module kits, optionally filtered by category."""
        kits = list(self.module_kits.values())
        if category:
            kits = [k for k in kits if k.category == category]
        return sorted(kits, key=lambda k: (-k.rating, -k.downloads))

    def get_module_kit(self, kit_id: str) -> ModuleKit:
        """Get module kit by ID."""
        return self.module_kits[kit_id]

    def add_module_kit(self, kit: ModuleKit) -> ModuleKit:
        """Add new module kit to collection."""
        self.module_kits[kit.id] = kit
        kits_list = [k.model_dump() for k in self.module_kits.values()]
        self._save_file('module_kits.json', kits_list)
        return kit

    def update_module_kit(self, kit_id: str, updates: Dict[str, Any]) -> ModuleKit:
        """Update module kit data."""
        kit = self.module_kits[kit_id]
        for key, value in updates.items():
            if hasattr(kit, key):
                setattr(kit, key, value)

        kits_list = [k.model_dump() for k in self.module_kits.values()]
        self._save_file('module_kits.json', kits_list)
        return kit

    def get_workspace(self) -> Workspace:
        """Get current workspace state."""
        return self.workspace_data

    def update_workspace(self, updates: Dict[str, Any]) -> Workspace:
        """Update workspace state and persist."""
        for key, value in updates.items():
            if hasattr(self.workspace_data, key):
                setattr(self.workspace_data, key, value)

        self._save_file('workspace.json', self.workspace_data.model_dump())
        return self.workspace_data
