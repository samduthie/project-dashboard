from ninja import Router
from ninja.errors import HttpError

from apps.projects.services import SettingsService

from .schemas import SettingsOut, SettingsPatchIn

router = Router(tags=["settings"])


@router.patch("/settings", response=SettingsOut)
def update_settings(request, body: SettingsPatchIn):
    try:
        s = SettingsService.update_projects_root(body.projects_root)
    except ValueError as e:
        raise HttpError(400, str(e)) from e
    return SettingsOut(
        projects_root=s.projects_root,
        last_scan_at=s.last_scan_at,
    )
