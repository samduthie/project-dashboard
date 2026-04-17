from ninja import Router
from ninja.errors import HttpError

from apps.projects.services import ProjectQueryService
from apps.projects.services.dashboard_layout import DashboardLayoutService

from .schemas import DashboardLayoutIn, ProjectOut
from .serialization import projects_to_out

router = Router(tags=["projects"])


@router.post("/projects/dashboard-layout", response=list[ProjectOut])
def save_dashboard_layout(request, body: DashboardLayoutIn):
    try:
        DashboardLayoutService.apply_layout(
            body.starred,
            body.projects,
            body.archived,
        )
    except ValueError as e:
        raise HttpError(400, str(e)) from e
    rows = ProjectQueryService.list_with_mtime()
    return projects_to_out(rows)
