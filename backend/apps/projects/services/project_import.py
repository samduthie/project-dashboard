from __future__ import annotations

from pathlib import Path

from django.db import transaction

from apps.projects.models import Project

from .dashboard_layout import DashboardLayoutService


class ProjectImportService:
    """Register a project directory by absolute path (any location on disk)."""

    @staticmethod
    def import_path(raw_path: str) -> Project:
        p = Path(raw_path).expanduser()
        try:
            resolved = p.resolve()
        except OSError as e:
            msg = f"Invalid path: {raw_path}"
            raise ValueError(msg) from e
        if not resolved.is_dir():
            msg = f"Path is not a directory: {resolved}"
            raise ValueError(msg)
        path_str = str(resolved)
        name = resolved.name
        with transaction.atomic():
            project, created = Project.objects.update_or_create(
                path=path_str,
                defaults={
                    "name": name,
                    "is_imported": True,
                },
            )
            if created:
                DashboardLayoutService.append_to_projects_section(project.pk)
        return project
