#!/usr/bin/env python3
"""
Enrich SecuBox catalog with pkg_version, changelog, and widget data
"""

import json
import re
from pathlib import Path
from datetime import datetime

CATALOG_FILE = Path("package/secubox/secubox-core/root/usr/share/secubox/catalog.json")
PACKAGE_DIR = Path("package/secubox")

def get_pkg_release(pkg_id):
    """Get PKG_VERSION and PKG_RELEASE from Makefile"""
    makefile = PACKAGE_DIR / pkg_id / "Makefile"
    if not makefile.exists():
        return None

    try:
        content = makefile.read_text()
        version_match = re.search(r'PKG_VERSION:?=(.+)', content)
        release_match = re.search(r'PKG_RELEASE:?=(.+)', content)

        if version_match and release_match:
            version = version_match.group(1).strip()
            release = release_match.group(1).strip()
            return f"{version}-{release}"
    except Exception as e:
        print(f"Error reading {makefile}: {e}")

    return None

def generate_changelog(app_id, version, category):
    """Generate sample changelog for an app"""
    changelog = {
        version: {
            "date": "2026-01-04",
            "changes": []
        }
    }

    # Add version-specific changes based on category
    if category == "security":
        changelog[version]["changes"] = [
            "Enhanced security protocols",
            "Added new authentication methods",
            "Improved session management"
        ]
    elif category == "network":
        changelog[version]["changes"] = [
            "Optimized network performance",
            "Added new routing features",
            "Fixed connection stability issues"
        ]
    elif category == "monitoring":
        changelog[version]["changes"] = [
            "Added new metrics visualization",
            "Improved dashboard performance",
            "Enhanced data collection"
        ]
    elif category == "iot":
        changelog[version]["changes"] = [
            "Added support for new devices",
            "Improved automation rules",
            "Enhanced device discovery"
        ]
    else:
        changelog[version]["changes"] = [
            "General improvements and bug fixes",
            "Enhanced user interface",
            "Performance optimizations"
        ]

    return changelog

def generate_widget_config(app_id, category):
    """Generate widget configuration based on category"""
    widget = {
        "enabled": False,
        "template": "default",
        "refresh_interval": 30,
        "metrics": []
    }

    if category == "security":
        widget["enabled"] = True
        widget["template"] = "security-widget"
        widget["metrics"] = [
            {
                "id": "active_sessions",
                "label": "Active Sessions",
                "type": "counter",
                "source": "ubus",
                "method": f"{app_id.replace('-', '.')}.get_stats"
            },
            {
                "id": "blocked_attempts",
                "label": "Blocked Attempts",
                "type": "counter",
                "source": "ubus"
            }
        ]
    elif category == "network":
        widget["enabled"] = True
        widget["template"] = "network-widget"
        widget["refresh_interval"] = 10
        widget["metrics"] = [
            {
                "id": "bandwidth_usage",
                "label": "Bandwidth Usage",
                "type": "gauge",
                "source": "ubus"
            },
            {
                "id": "active_connections",
                "label": "Active Connections",
                "type": "counter",
                "source": "ubus"
            }
        ]
    elif category == "monitoring":
        widget["enabled"] = True
        widget["template"] = "monitoring-widget"
        widget["refresh_interval"] = 15
        widget["metrics"] = [
            {
                "id": "cpu_usage",
                "label": "CPU Usage",
                "type": "percentage",
                "source": "file",
                "path": "/proc/stat"
            },
            {
                "id": "memory_usage",
                "label": "Memory Usage",
                "type": "percentage",
                "source": "file",
                "path": "/proc/meminfo"
            }
        ]

    return widget

def enrich_catalog():
    """Enrich the catalog with pkg_version, changelog, and widget data"""
    print("Loading catalog...")
    with open(CATALOG_FILE, 'r') as f:
        catalog = json.load(f)

    print(f"Found {len(catalog['plugins'])} plugins")

    enriched_count = 0
    for plugin in catalog['plugins']:
        app_id = plugin['id']
        version = plugin['version']
        category = plugin.get('category', 'system')

        # Add pkg_version
        pkg_version = get_pkg_release(app_id)
        if pkg_version:
            plugin['pkg_version'] = pkg_version
            print(f"✓ {app_id}: pkg_version = {pkg_version}")
        else:
            # Fallback: use version + "-1"
            plugin['pkg_version'] = f"{version}-1"
            print(f"⚠ {app_id}: using fallback pkg_version = {version}-1")

        # Add app_version (same as version for now)
        plugin['app_version'] = version

        # Add changelog
        if not plugin.get('changelog'):
            plugin['changelog'] = generate_changelog(app_id, version, category)
            print(f"✓ {app_id}: added changelog")

        # Add widget configuration
        if not plugin.get('widget'):
            plugin['widget'] = generate_widget_config(app_id, category)
            widget_status = "enabled" if plugin['widget']['enabled'] else "disabled"
            print(f"✓ {app_id}: added widget ({widget_status})")

        enriched_count += 1

    # Add widget_template to categories
    if 'categories' in catalog:
        catalog['categories']['security']['widget_template'] = 'security-widget'
        catalog['categories']['network']['widget_template'] = 'network-widget'
        catalog['categories']['monitoring']['widget_template'] = 'monitoring-widget'
        catalog['categories']['iot']['widget_template'] = 'custom-widget'
        catalog['categories']['media']['widget_template'] = 'custom-widget'
        catalog['categories']['productivity']['widget_template'] = 'custom-widget'
        catalog['categories']['system']['widget_template'] = 'custom-widget'

    # Update metadata
    catalog['metadata'] = {
        "catalog_version": "2.0",
        "schema_version": "2.0",
        "last_updated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    print(f"\nEnriched {enriched_count} plugins")

    # Save enriched catalog
    print("Saving enriched catalog...")
    with open(CATALOG_FILE, 'w') as f:
        json.dump(catalog, f, indent=2)

    print(f"✓ Catalog saved to {CATALOG_FILE}")

if __name__ == "__main__":
    enrich_catalog()
