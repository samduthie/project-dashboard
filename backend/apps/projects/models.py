from django.db import models


class SiteSettings(models.Model):
    """Singleton (pk=1): global app configuration."""

    projects_root = models.CharField(
        max_length=4096,
        default="/home/sam/projects/",
        help_text="Directory whose immediate subdirectories are scanned as projects.",
    )
    last_scan_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Site settings"

    def __str__(self) -> str:
        return "Site settings"


class Project(models.Model):
    class BoardSection(models.TextChoices):
        STARRED = "starred", "Starred"
        PROJECTS = "projects", "Projects"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=255)
    path = models.CharField(max_length=4096, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=64, blank=True, default="folder-kanban")
    is_imported = models.BooleanField(
        default=False,
        help_text="True if added via import path rather than root scan.",
    )
    board_section = models.CharField(
        max_length=16,
        choices=BoardSection.choices,
        default=BoardSection.PROJECTS,
        db_index=True,
    )
    board_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["board_section", "board_order", "name"]

    def __str__(self) -> str:
        return self.name
