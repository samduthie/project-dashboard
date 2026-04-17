from django.contrib import admin

from .models import Project, SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "path", "is_imported", "updated_at")
    search_fields = ("name", "path")
