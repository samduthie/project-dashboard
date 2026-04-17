from django.test import TestCase

from apps.projects.services.repo_web_url import normalize_git_remote_to_https


class NormalizeGitRemoteTests(TestCase):
    def test_https_github_strips_git_suffix(self) -> None:
        self.assertEqual(
            normalize_git_remote_to_https("https://github.com/org/repo.git"),
            "https://github.com/org/repo",
        )

    def test_git_at_form(self) -> None:
        self.assertEqual(
            normalize_git_remote_to_https("git@github.com:org/repo.git"),
            "https://github.com/org/repo",
        )

    def test_ssh_url(self) -> None:
        self.assertEqual(
            normalize_git_remote_to_https("ssh://git@github.com/org/repo.git"),
            "https://github.com/org/repo",
        )

    def test_git_protocol(self) -> None:
        self.assertEqual(
            normalize_git_remote_to_https("git://github.com/org/repo.git"),
            "https://github.com/org/repo",
        )
