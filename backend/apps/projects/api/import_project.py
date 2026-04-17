from ninja import Router
from ninja.errors import HttpError

from apps.projects.services import ProjectImportService, ProjectQueryService

from .schemas import ImportIn, ProjectOut
from .serialization import project_row_to_out

router = Router(tags=["projects"])


@router.post("/projects/import", response=ProjectOut)
def import_project(request, body: ImportIn):
    try:
        p = ProjectImportService.import_path(body.path)
    except ValueError as e:
        raise HttpError(400, str(e)) from e
    r = ProjectQueryService.get_with_mtime(p.id)
    if r is None:
        raise HttpError(500, "Import failed")
    return project_row_to_out(r)
