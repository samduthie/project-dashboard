from __future__ import annotations

from django.db import transaction
from django.db.models import Max

from apps.projects.models import Project


class DashboardLayoutService:
    """Bulk-assign board section and order; helpers for new projects."""

    @staticmethod
    def append_to_projects_section(project_id: int) -> None:
        """Place a newly created project at the end of the Projects section."""
        mx = (
            Project.objects.filter(board_section=Project.BoardSection.PROJECTS)
            .exclude(pk=project_id)
            .aggregate(m=Max("board_order"))["m"]
            or 0
        )
        Project.objects.filter(pk=project_id).update(
            board_section=Project.BoardSection.PROJECTS,
            board_order=mx + 1,
        )

    @staticmethod
    @transaction.atomic
    def apply_layout(starred: list[int], projects: list[int], archived: list[int]) -> None:
        combined = starred + projects + archived
        if len(combined) != len(set(combined)):
            msg = "Duplicate project ids in layout"
            raise ValueError(msg)

        all_ids = set(Project.objects.values_list("pk", flat=True))
        if set(combined) != all_ids:
            msg = "Layout must list every project id exactly once"
            raise ValueError(msg)

        for i, pk in enumerate(starred):
            Project.objects.filter(pk=pk).update(
                board_section=Project.BoardSection.STARRED,
                board_order=i,
            )
        for i, pk in enumerate(projects):
            Project.objects.filter(pk=pk).update(
                board_section=Project.BoardSection.PROJECTS,
                board_order=i,
            )
        for i, pk in enumerate(archived):
            Project.objects.filter(pk=pk).update(
                board_section=Project.BoardSection.ARCHIVED,
                board_order=i,
            )
