from ninja import Router

from apps.projects.services import ProjectQueryService

from .schemas import ProjectOut
from .serialization import projects_to_out

router = Router(tags=["projects"])


@router.get("/projects", response=list[ProjectOut])
def list_projects(request):
    rows = ProjectQueryService.list_with_mtime()
    return projects_to_out(rows)
