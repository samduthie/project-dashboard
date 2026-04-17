from __future__ import annotations

import subprocess
from pathlib import Path
from urllib.parse import urlparse

from .path_policy import PathPolicy

GIT_REMOTE_TIMEOUT_SEC = 4


def normalize_git_remote_to_https(remote: str) -> str | None:
    """Turn common git remote forms into an https URL suitable for opening in a browser."""
    u = remote.strip()
    if not u:
        return None
    lower = u.lower()
    if lower.startswith("https://") or lower.startswith("http://"):
        base = u.rstrip("/")
        if base.endswith(".git"):
            base = base[:-4]
        return base
    if u.startswith("git@"):
        rest = u[4:]
        if ":" not in rest:
            return None
        host, path = rest.split(":", 1)
        path = path.rstrip("/").removesuffix(".git")
        if not path:
            return None
        return f"https://{host}/{path}"
    if lower.startswith("git://"):
        rest = u[6:].rstrip("/").removesuffix(".git")
        if not rest:
            return None
        return f"https://{rest}"
    if lower.startswith("ssh://"):
        parsed = urlparse(u)
        host = parsed.hostname
        if not host:
            return None
        path = parsed.path or ""
        path = path.rstrip("/").removesuffix(".git")
        if path.startswith("/"):
            path = path[1:]
        if not path:
            return None
        return f"https://{host}/{path}"
    return None


def repo_web_url_for_path(path: str, policy: PathPolicy) -> str | None:
    if not policy.is_allowed(path):
        return None
    cwd = Path(path)
    if not cwd.is_dir():
        return None
    try:
        proc = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=GIT_REMOTE_TIMEOUT_SEC,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        return None
    return normalize_git_remote_to_https((proc.stdout or "").strip())
