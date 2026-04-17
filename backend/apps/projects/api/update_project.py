from ninja import Router
from django.shortcuts import get_object_or_404

from apps.projects.models import Project

from .schemas import ProjectOut, UpdateProjectIn
from .serialization import project_row_to_out

router = Router(tags=["projects"])


@router.patch("/projects/{project_id}", response=ProjectOut)
def update_project(request, project_id: int, body: UpdateProjectIn):
    p = get_object_or_404(Project, pk=project_id)
    if body.description is not None:
        p.description = body.description
    if body.name is not None:
        p.name = body.name
    if body.icon is not None:
        p.icon = body.icon
    p.save()
    from apps.projects.services import ProjectQueryService

    r = ProjectQueryService.get_with_mtime(p.id)
    if r is None:
        from ninja.errors import HttpError

        raise HttpError(500, "Update failed")
    return project_row_to_out(r)
