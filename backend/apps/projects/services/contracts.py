from dataclasses import dataclass
from typing import Protocol


class PathPolicyProtocol(Protocol):
    def is_allowed(self, path: str) -> bool:
        """Return True if filesystem/git operations are permitted for this path."""
        ...


@dataclass(frozen=True, slots=True)
class GitResult:
    exit_code: int
    stdout: str
    stderr: str
