from ninja import Router
from ninja.errors import HttpError

from apps.projects.services import ProjectScanService

from .schemas import ScanResultOut

router = Router(tags=["projects"])


@router.post("/projects/scan", response=ScanResultOut)
def scan_projects(request):
    try:
        count, settings = ProjectScanService.scan_from_settings()
    except ValueError as e:
        raise HttpError(400, str(e)) from e
    return ScanResultOut(
        scanned_count=count,
        last_scan_at=settings.last_scan_at,
    )
