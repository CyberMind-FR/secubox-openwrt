from __future__ import annotations

from pathlib import Path


class Settings:
    """Runtime configuration for the WebUI."""

    def __init__(self) -> None:
        self.project_root = Path(__file__).resolve().parent.parent
        self.data_dir = self.project_root / "data"
        self.theme_dir = self.project_root / "templates" / "themes"


settings = Settings()
