#!/usr/bin/env python3
"""
Refresh requirements (architectures + min specs) for SecuBox App Store manifests.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_DIR = REPO_ROOT / "plugins" / "catalog"

RUNTIME_DEFAULTS: Dict[str, Dict[str, int]] = {
    "native": {"min_ram_mb": 128, "min_storage_mb": 30},
    "docker": {"min_ram_mb": 512, "min_storage_mb": 512},
    "lxc": {"min_ram_mb": 256, "min_storage_mb": 256},
    "hybrid": {"min_ram_mb": 256, "min_storage_mb": 256},
}

CATEGORY_DEFAULTS: Dict[str, Dict[str, int]] = {
    "system": {"min_ram_mb": 256, "min_storage_mb": 40},
    "security": {"min_ram_mb": 256, "min_storage_mb": 60},
    "monitoring": {"min_ram_mb": 512, "min_storage_mb": 200},
    "media": {"min_ram_mb": 256, "min_storage_mb": 60},
    "networking": {"min_ram_mb": 128, "min_storage_mb": 40},
    "iot": {"min_ram_mb": 128, "min_storage_mb": 50},
    "storage": {"min_ram_mb": 256, "min_storage_mb": 200},
}

SPEC_OVERRIDES: Dict[str, Dict[str, int]] = {
    "secubox-hub": {"min_ram_mb": 128, "min_storage_mb": 20},
    "network-modes": {"min_storage_mb": 30},
    "wireguard-dashboard": {"min_ram_mb": 128, "min_storage_mb": 40},
    "mqtt-bridge": {"min_storage_mb": 60},
    "client-guardian": {"min_storage_mb": 80},
    "ksm-manager": {"min_storage_mb": 100},
    "crowdsec-dashboard": {"min_ram_mb": 512, "min_storage_mb": 300},
    "vhost-manager": {"min_ram_mb": 256, "min_storage_mb": 200},
    "cdn-cache": {"min_ram_mb": 256, "min_storage_mb": 1024},
    "domoticz": {"min_ram_mb": 512, "min_storage_mb": 1024},
    "zigbee2mqtt": {"min_ram_mb": 256, "min_storage_mb": 512},
    "lyrion": {"min_ram_mb": 1024, "min_storage_mb": 2048},
}

ARCH_DEFAULTS: Dict[str, List[str]] = {
    "native": ["arm64", "armv7", "x86_64", "mipsel"],
    "docker": ["arm64", "x86_64"],
    "lxc": ["arm64", "x86_64"],
    "hybrid": ["arm64", "x86_64"],
}

ARCH_OVERRIDES: Dict[str, List[str]] = {
    "zigbee2mqtt": ["arm64"],
}


def compute_specs(manifest_id: str, manifest: Dict) -> Dict[str, int]:
    runtime = (manifest.get("runtime") or manifest.get("type") or "native").lower()
    specs = dict(RUNTIME_DEFAULTS.get(runtime, RUNTIME_DEFAULTS["native"]))
    category = (manifest.get("category") or "").lower()
    if category in CATEGORY_DEFAULTS:
        for key, value in CATEGORY_DEFAULTS[category].items():
            specs[key] = max(specs.get(key, 0), value)
    if manifest_id in SPEC_OVERRIDES:
        specs.update(SPEC_OVERRIDES[manifest_id])
    return specs


def compute_arch(manifest_id: str, runtime: str) -> List[str]:
    if manifest_id in ARCH_OVERRIDES:
        return ARCH_OVERRIDES[manifest_id]
    return ARCH_DEFAULTS.get(runtime, ARCH_DEFAULTS["native"])


def apply_updates(path: Path) -> bool:
    data = json.loads(path.read_text())
    manifest_id = data.get("id") or path.stem
    runtime = (data.get("runtime") or data.get("type") or "native").lower()
    specs = compute_specs(manifest_id, data)
    requirements = data.setdefault("requirements", {})
    changed = False

    for key, value in specs.items():
        if requirements.get(key) != value:
            requirements[key] = value
            changed = True

    arch = compute_arch(manifest_id, runtime)
    if requirements.get("arch") != arch:
        requirements["arch"] = arch
        changed = True

    if changed:
        path.write_text(json.dumps(data, indent=2) + "\n")
    return changed


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh manifest requirement metadata.")
    parser.add_argument("--check", action="store_true", help="Only report drifts.")
    args = parser.parse_args()

    if not MANIFEST_DIR.is_dir():
        raise SystemExit(f"Manifest directory not found: {MANIFEST_DIR}")

    dirty = []
    for manifest_path in sorted(MANIFEST_DIR.glob("*.json")):
        if args.check:
            original = manifest_path.read_text()
            changed = apply_updates(manifest_path)
            if changed:
                dirty.append(manifest_path)
                manifest_path.write_text(original)
        else:
            if apply_updates(manifest_path):
                print(f"[updated] {manifest_path.relative_to(REPO_ROOT)}")

    if args.check:
        if dirty:
            for path in dirty:
                print(f"[drift] {path.relative_to(REPO_ROOT)}")
            raise SystemExit(1)
        print("All manifest specs look good.")


if __name__ == "__main__":
    main()
