from ninja import NinjaAPI

from apps.projects.api import (
    dashboard_layout,
    get_settings,
    git_pull,
    git_push,
    import_project,
    listening_ports,
    list_projects,
    scan_projects,
    update_project,
    update_settings,
)

api = NinjaAPI(
    urls_namespace="projects",
    title="Project Board API",
)

api.add_router("", get_settings.router)
api.add_router("", update_settings.router)
api.add_router("", list_projects.router)
api.add_router("", dashboard_layout.router)
api.add_router("", scan_projects.router)
api.add_router("", import_project.router)
api.add_router("", update_project.router)
api.add_router("", git_pull.router)
api.add_router("", git_push.router)
api.add_router("", listening_ports.router)
