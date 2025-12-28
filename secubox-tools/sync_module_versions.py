#!/usr/bin/env python3
"""Synchronize module versions and website progress bars."""
from __future__ import annotations
import re
import sys
from pathlib import Path
import difflib
import subprocess

RE_WEBSITE = re.compile(
    r'(<div class="module-progress-fill" style="width:)([0-9.]+)(%;"></div>\s*</div>\s*<div class="module-progress-label">v)'
    r'([0-9]+\.[0-9]+\.[0-9]+)(?:\s*·\s*)([0-9.]+)(\s*/ 1.00</div>)'
)


def version_ratio(ver: str) -> float:
    major, minor, patch = map(int, ver.split('.'))
    return major + minor / 10 + patch / 100


def update_website(html: Path) -> bool:
    text = html.read_text()

    def repl(match: re.Match) -> str:
        ver = match.group(4)
        ratio = version_ratio(ver)
        width = f"{ratio * 100:.0f}".rstrip('0').rstrip('.')
        label = f"{ratio:.2f}".rstrip('0').rstrip('.')
        return f"{match.group(1)}{width}{match.group(3)}{ver} · {label}{match.group(6)}"

    new_text, count = RE_WEBSITE.subn(repl, text)
    if count:
        if new_text == text:
            return False
        diff = difflib.unified_diff(
            text.splitlines(keepends=True),
            new_text.splitlines(keepends=True),
            fromfile=str(html),
            tofile=str(html)
        )
        diff_text = ''.join(diff)
        if not diff_text:
            return False
        subprocess.run(['patch', str(html)], input=diff_text.encode(), check=True)
        return True
    return False


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    site_dir = repo_root.parent / 'secubox-website'

    targets = [site_dir / 'index.html', site_dir / 'campaign.html']
    overall = False

    for html in targets:
        if not html.exists():
            print(f'Skipping missing file: {html}', file=sys.stderr)
            continue
        if update_website(html):
            print(f'Updated {html.name}')
            overall = True

    print('Website progress sync', 'done' if overall else 'no changes')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
