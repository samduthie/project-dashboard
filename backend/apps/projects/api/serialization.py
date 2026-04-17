from apps.projects.services import ProjectRow, SettingsService, build_path_policy
from apps.projects.services.path_policy import PathPolicy
from apps.projects.services.repo_web_url import repo_web_url_for_path

from .schemas import ProjectOut


def _row_to_out(r: ProjectRow, policy: PathPolicy) -> ProjectOut:
    return ProjectOut(
        id=r.id,
        name=r.name,
        path=r.path,
        description=r.description,
        icon=r.icon,
        is_imported=r.is_imported,
        last_updated=r.last_updated,
        board_section=r.board_section,
        board_order=r.board_order,
        repo_url=repo_web_url_for_path(r.path, policy),
    )


def projects_to_out(rows: list[ProjectRow]) -> list[ProjectOut]:
    policy = build_path_policy(SettingsService.get().projects_root)
    return [_row_to_out(r, policy) for r in rows]


def project_row_to_out(r: ProjectRowType) -> ProjectOut:
    policy = build_path_policy(SettingsService.get().projects_root)
    return _row_to_out(r, policy)
