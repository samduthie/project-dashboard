from __future__ import annotations

from pathlib import Path

from django.db import transaction
from django.utils import timezone

from apps.projects.models import Project, SiteSettings

from .dashboard_layout import DashboardLayoutService
from .settings_service import SettingsService


class ProjectScanService:
    """Upsert projects from immediate children of projects_root."""

    @staticmethod
    def scan_from_settings() -> tuple[int, SiteSettings]:
        settings = SettingsService.get()
        root = Path(settings.projects_root).expanduser().resolve()
        if not root.is_dir():
            msg = f"Projects root is not a directory: {root}"
            raise ValueError(msg)

        count = 0
        with transaction.atomic():
            for child in sorted(root.iterdir()):
                if not child.is_dir():
                    continue
                name = child.name
                path_str = str(child.resolve())
                obj, created = Project.objects.update_or_create(
                    path=path_str,
                    defaults={
                        "name": name,
                        "is_imported": False,
                    },
                )
                if created:
                    DashboardLayoutService.append_to_projects_section(obj.pk)
                count += 1
            settings.last_scan_at = timezone.now()
            settings.save(update_fields=["last_scan_at"])
        return count, settings
