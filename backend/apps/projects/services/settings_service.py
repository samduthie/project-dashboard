from __future__ import annotations

from pathlib import Path

from django.db import transaction
from django.utils import timezone

from apps.projects.models import SiteSettings


DEFAULT_PROJECTS_ROOT = "/home/sam/projects/"


class SettingsService:
    """Load and persist site settings (singleton row)."""

    @staticmethod
    def get() -> SiteSettings:
        settings, _ = SiteSettings.objects.get_or_create(
            pk=1,
            defaults={"projects_root": DEFAULT_PROJECTS_ROOT},
        )
        return settings

    @staticmethod
    def update_projects_root(projects_root: str) -> SiteSettings:
        root = Path(projects_root).expanduser()
        resolved = root.resolve()
        if not resolved.is_dir():
            msg = f"Projects root is not a directory: {resolved}"
            raise ValueError(msg)
        normalized = str(resolved) + ("/" if not str(resolved).endswith("/") else "")
        with transaction.atomic():
            s = SettingsService.get()
            s.projects_root = normalized
            s.save(update_fields=["projects_root"])
        return s

    @staticmethod
    def touch_last_scan() -> SiteSettings:
        s = SettingsService.get()
        s.last_scan_at = timezone.now()
        s.save(update_fields=["last_scan_at"])
        return s
