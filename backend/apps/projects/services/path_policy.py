from __future__ import annotations

from pathlib import Path

from apps.projects.models import Project

from .contracts import PathPolicyProtocol


class PathPolicy(PathPolicyProtocol):
    """Paths under projects_root or matching a registered Project path are allowed."""

    def __init__(self, projects_root: Path, registered_paths: frozenset[Path]) -> None:
        self._root = projects_root.resolve()
        self._registered = registered_paths

    def is_allowed(self, path: str) -> bool:
        try:
            resolved = Path(path).resolve()
        except OSError:
            return False
        if resolved in self._registered:
            return True
        try:
            resolved.relative_to(self._root)
            return True
        except ValueError:
            return False


def build_path_policy(projects_root: str) -> PathPolicy:
    root = Path(projects_root).expanduser()
    registered = frozenset(
        Path(p.path).resolve()
        for p in Project.objects.all().only("path")
    )
    return PathPolicy(root, registered)
