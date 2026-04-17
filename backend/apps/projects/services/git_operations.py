from __future__ import annotations

import subprocess
from pathlib import Path

from apps.projects.models import Project

from .contracts import GitResult
from .path_policy import PathPolicy


GIT_TIMEOUT_SEC = 120


class GitOperationsService:
    def __init__(self, path_policy: PathPolicy) -> None:
        self._policy = path_policy

    def _run_git(self, project: Project, args: list[str]) -> GitResult:
        cwd = Path(project.path)
        if not cwd.is_dir():
            msg = f"Project path is not a directory: {cwd}"
            raise ValueError(msg)
        if not self._policy.is_allowed(project.path):
            msg = "Git operations are not allowed for this path."
            raise PermissionError(msg)
        cmd = ["git", *args]
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=GIT_TIMEOUT_SEC,
            check=False,
        )
        return GitResult(
            exit_code=proc.returncode,
            stdout=proc.stdout or "",
            stderr=proc.stderr or "",
        )

    def pull(self, project_id: int) -> GitResult:
        project = Project.objects.get(pk=project_id)
        return self._run_git(project, ["pull"])

    def push(self, project_id: int) -> GitResult:
        project = Project.objects.get(pk=project_id)
        return self._run_git(project, ["push"])
