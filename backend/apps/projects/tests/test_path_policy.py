import tempfile
from pathlib import Path

from django.test import TestCase

from apps.projects.services.path_policy import PathPolicy


class PathPolicyTests(TestCase):
    def test_allows_under_projects_root(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sub = root / "child"
            sub.mkdir()
            p = PathPolicy(root, frozenset())
            self.assertTrue(p.is_allowed(str(sub)))

    def test_allows_registered_exact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "root"
            root.mkdir()
            other = Path(tmp) / "elsewhere"
            other.mkdir()
            p = PathPolicy(root, frozenset({other.resolve()}))
            self.assertTrue(p.is_allowed(str(other)))

    def test_denies_outside(self) -> None:
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            root = Path(a)
            outside = Path(b) / "x"
            outside.mkdir(parents=True)
            p = PathPolicy(root, frozenset())
            self.assertFalse(p.is_allowed(str(outside)))
