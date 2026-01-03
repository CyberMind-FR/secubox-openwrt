from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Module(BaseModel):
    id: str
    name: str
    category: str
    version: str = Field(default="0.0.0")
    summary: str
    health: str = Field(default="stable")
    tags: List[str] = Field(default_factory=list)
    secure_contexts: List[str] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)


class Command(BaseModel):
    id: str
    name: str
    summary: str
    result_template: str
    tags: List[str] = Field(default_factory=list)
    default_context: Dict[str, Any] = Field(default_factory=dict)


class Preset(BaseModel):
    id: str
    name: str
    description: str
    module: str
    command_sequence: List[str] = Field(default_factory=list)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    expected_outcome: str = Field(default="")


class CommandResult(BaseModel):
    command_id: str
    name: str
    log: str
    status: str = "ok"


class ExecutionResult(BaseModel):
    preset: Preset
    summary: str
    context: Dict[str, Any]
    commands: List[CommandResult]
    warnings: Optional[List[str]] = None


class RunPresetPayload(BaseModel):
    context: Optional[Dict[str, Any]] = None


# =================================================================
# PHASE 2: New Data Models for Extended Sections
# =================================================================


class AppStoreItem(BaseModel):
    """Represents an app in the marketplace catalog."""
    id: str
    name: str
    emoji: str = Field(default="📦")
    category: str
    version: str = Field(default="0.0.0")
    author: str = Field(default="SecuBox Team")
    rating: float = Field(default=0.0, ge=0, le=5)
    downloads: int = Field(default=0)
    summary: str
    description: str = Field(default="")
    screenshots: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    license: str = Field(default="GPL-3.0")
    repository_url: str = Field(default="")
    documentation_url: str = Field(default="")
    installed: bool = Field(default=False)
    update_available: bool = Field(default=False)
    size_mb: float = Field(default=0.0)


class Review(BaseModel):
    """AppStore review/rating."""
    id: str
    app_id: str
    author: str
    rating: int = Field(ge=1, le=5)
    comment: str
    date: str
    helpful_count: int = Field(default=0)


class ComponentRegistry(BaseModel):
    """Represents a reusable UI component from modules."""
    id: str
    name: str
    emoji: str = Field(default="🎨")
    module_id: str
    component_type: str  # "widget", "panel", "modal", "form", "table"
    description: str
    preview_url: str = Field(default="")
    props: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class Profile(BaseModel):
    """System configuration profile (bundle of modules + presets)."""
    id: str
    name: str
    emoji: str = Field(default="📦")
    description: str
    author: str = Field(default="System")
    modules: List[str] = Field(default_factory=list)  # Module IDs
    presets: List[str] = Field(default_factory=list)  # Preset IDs
    config_overrides: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    active: bool = Field(default=False)
    priority: int = Field(default=0)  # For ordering


class Template(BaseModel):
    """Configuration generation template."""
    id: str
    name: str
    emoji: str = Field(default="📄")
    description: str
    template_type: str  # "uci", "network", "firewall", "custom"
    content: str  # Jinja2 template content
    variables: Dict[str, Any] = Field(default_factory=dict)
    required_modules: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    examples: List[Dict[str, Any]] = Field(default_factory=list)


class Settings(BaseModel):
    """WebUI and system settings."""
    id: str = Field(default="global")
    theme: str = Field(default="secubox")
    language: str = Field(default="en")
    backend_type: str = Field(default="virtualized")  # "virtualized", "ssh", "http"
    openwrt_connection: Dict[str, Any] = Field(default_factory=dict)
    # Example: {"type": "ssh", "host": "192.168.1.1", "port": 22, "username": "root"}
    auto_update: bool = Field(default=False)
    notifications: bool = Field(default=True)
    advanced_mode: bool = Field(default=False)


class Device(BaseModel):
    """OpenWrt device connection configuration."""
    id: str
    name: str
    emoji: str = Field(default="🌐")
    description: str = Field(default="")

    # Connection details
    host: str
    port: int = Field(default=80)
    username: str = Field(default="root")
    password: str = Field(default="")
    protocol: str = Field(default="http")  # "http" or "https"
    connection_type: str = Field(default="http")  # "http", "ssh", or "virtualized"

    # Metadata
    active: bool = Field(default=False)  # Only one active at a time
    tags: List[str] = Field(default_factory=list)
    last_connected: Optional[str] = None  # ISO timestamp
    firmware_version: Optional[str] = None  # Detected OpenWrt version

    # Advanced settings
    timeout: int = Field(default=30)  # Connection timeout in seconds
    verify_ssl: bool = Field(default=False)  # SSL certificate verification


# =================================================================
# PHASE 3: Workspace & Project Hub Models
# =================================================================


class Project(BaseModel):
    """Multi-device deployment project for workspace hub."""
    id: str
    name: str
    emoji: str = Field(default="🚀")
    description: str

    # Project metadata
    project_type: str  # "production", "staging", "development", "personal"
    url: Optional[str] = None  # e.g., "cybermind.fr", "cybermood.eu"
    tags: List[str] = Field(default_factory=list)

    # Resources
    devices: List[str] = Field(default_factory=list)  # Device IDs
    profiles: List[str] = Field(default_factory=list)  # Profile IDs
    modules: List[str] = Field(default_factory=list)  # Module IDs installed in project

    # State
    active: bool = Field(default=False)
    last_accessed: Optional[str] = None
    workspace_state: Dict[str, Any] = Field(default_factory=dict)  # Saved workspace layout/config

    # Collaboration (future)
    owner: str = Field(default="admin")
    collaborators: List[str] = Field(default_factory=list)
    visibility: str = Field(default="private")  # "private", "team", "public"


class ModuleKit(BaseModel):
    """Curated bundle of modules for specific use cases."""
    id: str
    name: str
    emoji: str = Field(default="📦")
    description: str
    version: str = Field(default="1.0.0")
    author: str

    # Bundle contents
    modules: List[str] = Field(default_factory=list)  # Module IDs
    presets: List[str] = Field(default_factory=list)  # Preset IDs
    templates: List[str] = Field(default_factory=list)  # Template IDs

    # Metadata
    category: str  # "security", "networking", "monitoring", "full-stack"
    tags: List[str] = Field(default_factory=list)
    use_cases: List[str] = Field(default_factory=list)

    # Installation
    dependencies: List[str] = Field(default_factory=list)
    conflicts: List[str] = Field(default_factory=list)
    min_openwrt_version: str = Field(default="23.05")

    # Stats
    downloads: int = Field(default=0)
    rating: float = Field(default=0.0, ge=0, le=5)
    verified: bool = Field(default=False)


class Workspace(BaseModel):
    """Active workspace state for project hub."""
    id: str = Field(default="default")
    active_project: Optional[str] = None
    active_device: Optional[str] = None

    # Canvas state for module composition
    canvas_modules: List[Dict[str, Any]] = Field(default_factory=list)  # Positioned modules
    connections: List[Dict[str, Any]] = Field(default_factory=list)  # Module connections/data flow

    # UI state
    layout: str = Field(default="grid")  # "grid", "kanban", "timeline", "graph"
    filters: Dict[str, Any] = Field(default_factory=dict)
    sidebar_collapsed: bool = Field(default=False)
