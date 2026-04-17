from __future__ import annotations

import os
import re
import signal
import subprocess
from dataclasses import dataclass

from apps.projects.models import Project

_SS_LINE = re.compile(
    r"""^(\S+)\s+(\S+)\s+\d+\s+\d+\s+         # netid state recv send
        (\S+)\s+                             # local addr:port
        (\S+)\s+                             # peer
        (.*)$""",
    re.VERBOSE,
)
_USERS = re.compile(r'users:\(\(\"([^\"]+)\",pid=(\d+)')
_LOCAL_PORT = re.compile(r":(\d+)$")


@dataclass(frozen=True, slots=True)
class ListeningPortRow:
    port: int
    name: str
    tech: str
    pid: int | None


@dataclass(frozen=True, slots=True)
class _RawRow:
    port: int
    local: str
    comm: str
    pid: int


def _parse_local_port(local: str) -> int | None:
    m = _LOCAL_PORT.search(local)
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


def _is_loopback(local: str) -> bool:
    if local.startswith("127."):
        return True
    if local.startswith("[::ffff:127."):
        return True
    return local in ("[::1]", "::1", "[::]:*", "*")


def _read_proc_cwd(pid: int) -> str | None:
    try:
        return os.path.realpath(f"/proc/{pid}/cwd")
    except OSError:
        return None


def _read_cmdline(pid: int) -> str:
    try:
        with open(f"/proc/{pid}/cmdline", "rb") as f:
            raw = f.read()
    except OSError:
        return ""
    return raw.replace(b"\x00", b" ").decode(errors="replace").strip()


def _infer_tech(comm: str, cmdline: str) -> str:
    low = cmdline.lower()
    if "sandbox" in comm.lower():
        return "Dev sandbox"
    if "vite" in low:
        return "Vite"
    if "uvicorn" in low:
        return "FastAPI / Uvicorn"
    if "gunicorn" in low:
        return "Gunicorn"
    if "hypercorn" in low:
        return "Hypercorn"
    if "daphne" in low:
        return "Daphne"
    if "manage.py" in low and "runserver" in low:
        return "Django dev server"
    if "flask" in low or "werkzeug" in low:
        return "Flask"
    if "next" in low and "node" in low:
        return "Next.js"
    if "webpack" in low:
        return "Webpack"
    if comm in ("node", "nodejs"):
        return "Node"
    if comm.startswith("python"):
        return "Python"
    if comm in ("ruby",):
        return "Ruby"
    if comm in ("java",):
        return "Java"
    if comm in ("docker-proxy",):
        return "Docker"
    if comm:
        return comm
    return "—"


def _match_project_name(cwd: str, projects: list[tuple[str, str]]) -> str | None:
    """projects: list of (resolved_path, name). Longest path prefix wins."""
    best_name: str | None = None
    best_len = -1
    cwd_norm = os.path.normpath(cwd)
    for path, name in projects:
        path_n = os.path.normpath(path)
        if cwd_norm == path_n or cwd_norm.startswith(path_n + os.sep):
            if len(path_n) > best_len:
                best_len = len(path_n)
                best_name = name
    return best_name


def _run_ss() -> str:
    try:
        r = subprocess.run(
            ["ss", "-tulpn"],
            capture_output=True,
            text=True,
            timeout=8,
            check=False,
        )
    except FileNotFoundError:
        return ""
    if r.returncode != 0:
        return r.stdout or ""
    return r.stdout or ""


def _collect_raw_listen_rows() -> list[_RawRow]:
    text = _run_ss()
    if not text.strip():
        return []

    raw: list[_RawRow] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("Netid"):
            continue
        m = _SS_LINE.match(line)
        if not m:
            continue
        local = m.group(3)
        port = _parse_local_port(local)
        if port is None:
            continue
        um = _USERS.search(line)
        if not um:
            raw.append(_RawRow(port=port, local=local, comm="", pid=0))
            continue
        comm = um.group(1)
        try:
            pid = int(um.group(2))
        except ValueError:
            pid = 0
        raw.append(_RawRow(port=port, local=local, comm=comm, pid=pid))

    raw.sort(key=lambda r: (r.port, 0 if _is_loopback(r.local) else 1))
    return raw


def _pid_for_port(port: int) -> int | None:
    rows = [r for r in _collect_raw_listen_rows() if r.port == port and r.pid > 0]
    if not rows:
        return None
    rows.sort(key=lambda r: (0 if _is_loopback(r.local) else 1))
    return rows[0].pid


def _proc_owned_by_euid(pid: int) -> bool:
    try:
        st = os.stat(f"/proc/{pid}")
    except OSError:
        return False
    return st.st_uid == os.geteuid()


class ListeningPortsService:
    @staticmethod
    def list_ports() -> list[ListeningPortRow]:
        raw = _collect_raw_listen_rows()
        if not raw:
            return []

        projects: list[tuple[str, str]] = []
        for p in Project.objects.all().iterator():
            rp = os.path.realpath(p.path) if os.path.exists(p.path) else os.path.normpath(p.path)
            projects.append((rp, p.name))

        seen: set[int] = set()
        out: list[ListeningPortRow] = []
        for row in raw:
            if row.port in seen:
                continue
            seen.add(row.port)

            name: str
            tech: str
            pid_out: int | None
            if row.pid and row.comm:
                cmdline = _read_cmdline(row.pid)
                tech = _infer_tech(row.comm, cmdline)
                cwd = _read_proc_cwd(row.pid)
                proj = _match_project_name(cwd, projects) if cwd else None
                name = proj if proj else row.comm
                pid_out = row.pid
            elif row.comm:
                name = row.comm
                tech = _infer_tech(row.comm, "")
                pid_out = row.pid if row.pid else None
            else:
                name = "(unknown)"
                tech = "—"
                pid_out = None

            out.append(
                ListeningPortRow(port=row.port, name=name, tech=tech, pid=pid_out),
            )

        out.sort(key=lambda r: r.port)
        return out

    @staticmethod
    def kill_port(port: int) -> tuple[bool, str]:
        pid = _pid_for_port(port)
        if pid is None:
            return False, "No process found for this port."
        if not _proc_owned_by_euid(pid):
            return False, "Cannot stop a process owned by another user."
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            return False, "Process already exited."
        except PermissionError:
            return (
                False,
                "Permission denied — run the API as the same user as the process.",
            )
        return True, f"Sent SIGTERM to PID {pid}."

    @staticmethod
    def logs_for_port(port: int) -> tuple[str, str]:
        """Returns (text, source) where source is journalctl | unavailable | none | error."""
        pid = _pid_for_port(port)
        if pid is None:
            return "No process found for this port.", "none"

        journalctl = _which("journalctl")
        if journalctl:
            for args in (
                [journalctl, f"_PID={pid}", "-n", "15", "--no-pager"],
                [journalctl, f"_PID={pid}", "-n", "15", "--no-pager", "--user"],
            ):
                try:
                    r = subprocess.run(
                        args,
                        capture_output=True,
                        text=True,
                        timeout=8,
                        check=False,
                    )
                except subprocess.TimeoutExpired:
                    return "Journal query timed out.", "error"
                if r.returncode == 0 and r.stdout.strip():
                    return r.stdout.rstrip(), "journalctl"

        return (
            f"No journal lines for PID {pid}.\n\n"
            "journalctl only shows output for processes logged by systemd (typical "
            "for system services). Dev servers started in a terminal usually have "
            "no journal — use that terminal for logs.",
            "unavailable",
        )


def _which(name: str) -> str | None:
    for d in os.environ.get("PATH", "/usr/bin:/bin").split(os.pathsep):
        p = os.path.join(d, name)
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None
