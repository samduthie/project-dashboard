from ninja import Router

from apps.projects.services import SettingsService

from .schemas import SettingsOut

router = Router(tags=["settings"])


@router.get("/settings", response=SettingsOut)
def get_settings(request):
    s = SettingsService.get()
    return SettingsOut(
        projects_root=s.projects_root,
        last_scan_at=s.last_scan_at,
    )
