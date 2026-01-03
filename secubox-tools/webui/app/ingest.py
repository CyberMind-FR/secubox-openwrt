"""Ingest package metadata into the WebUI module catalog."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from .config import settings

REPO_ROOT = settings.project_root.parent.parent
PACKAGE_ROOT = REPO_ROOT / "package" / "secubox"
TOP_LEVEL_PATTERNS = ("luci-app-*", "luci-theme-*")

ASSIGN_RE = re.compile(r"^([A-Za-z0-9_]+)\s*(?::|\+)?=\s*(.+)$")
AFFECTED_PREFIXES = ("luci-app-", "luci-theme-", "secubox-app-")
ALLOWED_EXACT = {"secubox-core", "secubox-app"}

CATEGORY_MAP = {
    "luci-app": "LuCI Application",
    "luci-theme": "LuCI Theme",
    "secubox-app": "SecuBox Service",
}

SECURE_CONTEXTS = {
    "luci-app": ["ui-sandbox"],
    "luci-theme": ["theme-assets"],
    "secubox-app": ["service-sandbox"],
}

ACTIONS = {
    "luci-app": ["Preview UI", "Run Diagnostics"],
    "luci-theme": ["Preview Theme", "Export Assets"],
    "secubox-app": ["Simulate Service", "Push Config"],
}


class ModuleRecord(Dict[str, object]):
    pass


def is_allowed_name(name: str) -> bool:
    if name in ALLOWED_EXACT:
        return True
    return any(name.startswith(prefix) for prefix in AFFECTED_PREFIXES)


def read_makefile(path: Path) -> Dict[str, str]:
    metadata: Dict[str, str] = {}
    with path.open() as handle:
        for raw in handle:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            match = ASSIGN_RE.match(line)
            if match:
                key, value = match.groups()
                metadata[key] = value.strip()
    return metadata


def read_readme_summary(module_dir: Path) -> Optional[str]:
    for candidate in ("README.md", "README"):
        doc = module_dir / candidate
        if not doc.exists():
            continue
        for raw in doc.read_text().splitlines():
            text = raw.strip()
            if not text or text.startswith("#"):
                continue
            return text
    return None


def derive_category(pkg_name: str) -> str:
    if pkg_name == "secubox-core":
        return "Framework"
    for prefix, category in CATEGORY_MAP.items():
        if pkg_name.startswith(prefix):
            return category
    return "SecuBox Package"


def derive_secure_contexts(pkg_name: str) -> List[str]:
    if pkg_name == "secubox-core":
        return ["privileged"]
    for prefix, contexts in SECURE_CONTEXTS.items():
        if pkg_name.startswith(prefix):
            return contexts
    return ["module-sandbox"]


def derive_actions(pkg_name: str) -> List[str]:
    if pkg_name == "secubox-core":
        return ["Device Snapshot", "Catalog Sync", "Profile Merge"]
    for prefix, actions in ACTIONS.items():
        if pkg_name.startswith(prefix):
            return actions
    return ["Inspect", "Simulate"]


def derive_tags(pkg_name: str) -> List[str]:
    tokens = [token for token in pkg_name.split("-") if token not in {"luci", "app", "secubox", "theme", "core"}]
    return tokens or [pkg_name]


def humanize_name(pkg_name: str) -> str:
    cleaned = pkg_name
    for prefix in AFFECTED_PREFIXES:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break
    cleaned = cleaned.replace("-", " ").strip()
    return cleaned.title() if cleaned else pkg_name


def detect_health(info: Dict[str, str]) -> str:
    release = info.get("PKG_RELEASE", "").lower()
    desc = " ".join(info.get(key, "") for key in ("LUCI_DESCRIPTION", "TITLE", "PKG_DESCRIPTION")).lower()
    if "beta" in release or "beta" in desc:
        return "beta"
    if "rc" in release:
        return "testing"
    return "stable"


def create_module_record(module_dir: Path) -> ModuleRecord:
    makefile = module_dir / "Makefile"
    if not makefile.exists():
        raise FileNotFoundError(f"{module_dir} missing Makefile")

    data = read_makefile(makefile)
    raw_pkg_name = data.get("PKG_NAME", module_dir.name)
    pkg_name = raw_pkg_name if is_allowed_name(raw_pkg_name) else module_dir.name
    title = data.get("LUCI_TITLE") or data.get("TITLE")
    display_name = title.split(" - ")[0].strip() if title else ""
    if not display_name or display_name.startswith("("):
        display_name = humanize_name(pkg_name)

    summary = (
        data.get("LUCI_DESCRIPTION")
        or data.get("PKG_DESCRIPTION")
        or (title.split(" - ", 1)[1].strip() if title and " - " in title else None)
        or read_readme_summary(module_dir)
        or "No summary provided."
    )

    record: ModuleRecord = ModuleRecord(
        id=pkg_name,
        name=display_name,
        category=derive_category(pkg_name),
        version=data.get("PKG_VERSION", "0.0.0"),
        summary=summary,
        health=detect_health(data),
        tags=derive_tags(pkg_name),
        secure_contexts=derive_secure_contexts(pkg_name),
        actions=derive_actions(pkg_name),
    )
    return record


def gather_module_dirs() -> Iterable[Path]:
    seen = set()

    for pattern in TOP_LEVEL_PATTERNS:
        for path in settings.project_root.parent.glob(pattern):
            if path.is_dir() and is_allowed_name(path.name):
                resolved = path.resolve()
                if resolved not in seen:
                    seen.add(resolved)
                    yield path

    if PACKAGE_ROOT.exists():
        for path in PACKAGE_ROOT.iterdir():
            if path.is_dir() and not path.name.startswith('.') and is_allowed_name(path.name):
                resolved = path.resolve()
                if resolved not in seen:
                    seen.add(resolved)
                    yield path


def write_records(records: List[ModuleRecord], output: Path, pretty: bool) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w") as handle:
        if pretty:
            json.dump(records, handle, indent=2)
        else:
            json.dump(records, handle)


def ingest(pretty: bool = False, output: Optional[Path] = None) -> Path:
    destination = output or (settings.data_dir / "modules.json")
    records: List[ModuleRecord] = []
    for module_dir in gather_module_dirs():
        try:
            records.append(create_module_record(module_dir))
        except Exception as exc:  # noqa: BLE001
            print(f"⚠️  Skipping {module_dir}: {exc}")

    records.sort(key=lambda item: str(item["name"]).lower())
    write_records(records, destination, pretty)
    print(f"✅ Wrote {len(records)} modules to {destination}")
    return destination


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate WebUI module metadata from repository packages.")
    parser.add_argument("--output", type=Path, default=settings.data_dir / "modules.json", help="Destination JSON file")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    return parser


def main(argv: Optional[List[str]] = None) -> None:
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    ingest(pretty=args.pretty, output=args.output)


if __name__ == "__main__":
    main()
