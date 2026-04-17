from ninja import Router
from ninja.errors import HttpError

from apps.projects.models import Project
from apps.projects.services import GitOperationsService, SettingsService, build_path_policy

from .schemas import GitOpIn, GitResultOut

router = Router(tags=["git"])


@router.post("/git/push", response=GitResultOut)
def git_push(request, body: GitOpIn):
    settings = SettingsService.get()
    policy = build_path_policy(settings.projects_root)
    svc = GitOperationsService(policy)
    try:
        result = svc.push(body.project_id)
    except Project.DoesNotExist as e:
        raise HttpError(404, "Project not found") from e
    except PermissionError as e:
        raise HttpError(403, str(e)) from e
    except ValueError as e:
        raise HttpError(400, str(e)) from e
    return GitResultOut(
        exit_code=result.exit_code,
        stdout=result.stdout,
        stderr=result.stderr,
    )
