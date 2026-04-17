from datetime import datetime

from ninja import Schema


class SettingsOut(Schema):
    projects_root: str
    last_scan_at: datetime | None


class SettingsPatchIn(Schema):
    projects_root: str


class ProjectOut(Schema):
    id: int
    name: str
    path: str
    description: str
    icon: str
    is_imported: bool
    last_updated: datetime | None
    board_section: str
    board_order: int
    repo_url: str | None = None


class DashboardLayoutIn(Schema):
    starred: list[int]
    projects: list[int]
    archived: list[int]


class ImportIn(Schema):
    path: str


class UpdateProjectIn(Schema):
    description: str | None = None
    name: str | None = None
    icon: str | None = None


class GitOpIn(Schema):
    project_id: int


class GitResultOut(Schema):
    exit_code: int
    stdout: str
    stderr: str


class ScanResultOut(Schema):
    scanned_count: int
    last_scan_at: datetime | None


class ListeningPortOut(Schema):
    port: int
    name: str
    tech: str
    pid: int | None = None


class PortKillOut(Schema):
    ok: bool
    message: str


class PortLogsOut(Schema):
    text: str
    source: str
