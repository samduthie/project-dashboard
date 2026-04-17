from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone

from django.db.models import Case, IntegerField, When

from apps.projects.models import Project


@dataclass(frozen=True, slots=True)
class ProjectRow:
    id: int
    name: str
    path: str
    description: str
    icon: str
    is_imported: bool
    last_updated: datetime | None
    board_section: str
    board_order: int


def _project_queryset_ordered():
    return Project.objects.annotate(
        _section_rank=Case(
            When(board_section=Project.BoardSection.STARRED, then=0),
            When(board_section=Project.BoardSection.PROJECTS, then=1),
            When(board_section=Project.BoardSection.ARCHIVED, then=2),
            default=3,
            output_field=IntegerField(),
        )
    ).order_by("_section_rank", "board_order", "name")


class ProjectQueryService:
    @staticmethod
    def get_with_mtime(project_id: int) -> ProjectRow | None:
        try:
            p = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return None
        mtime: datetime | None = None
        if os.path.isdir(p.path):
            try:
                ts = os.path.getmtime(p.path)
                mtime = datetime.fromtimestamp(ts, tz=timezone.utc)
            except OSError:
                mtime = None
        return ProjectRow(
            id=p.id,
            name=p.name,
            path=p.path,
            description=p.description,
            icon=p.icon or "folder-kanban",
            is_imported=p.is_imported,
            last_updated=mtime,
            board_section=p.board_section,
            board_order=p.board_order,
        )

    @staticmethod
    def list_with_mtime() -> list[ProjectRow]:
        rows: list[ProjectRow] = []
        for p in _project_queryset_ordered().iterator():
            mtime: datetime | None = None
            if os.path.isdir(p.path):
                try:
                    ts = os.path.getmtime(p.path)
                    mtime = datetime.fromtimestamp(ts, tz=timezone.utc)
                except OSError:
                    mtime = None
            rows.append(
                ProjectRow(
                    id=p.id,
                    name=p.name,
                    path=p.path,
                    description=p.description,
                    icon=p.icon or "folder-kanban",
                    is_imported=p.is_imported,
                    last_updated=mtime,
                    board_section=p.board_section,
                    board_order=p.board_order,
                )
            )
        return rows
