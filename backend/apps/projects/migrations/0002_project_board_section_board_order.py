from django.db import migrations, models


def assign_initial_board_order(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    for i, pk in enumerate(Project.objects.order_by("name").values_list("pk", flat=True)):
        Project.objects.filter(pk=pk).update(board_order=i)


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="board_section",
            field=models.CharField(
                choices=[
                    ("starred", "Starred"),
                    ("projects", "Projects"),
                    ("archived", "Archived"),
                ],
                db_index=True,
                default="projects",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="board_order",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(assign_initial_board_order, migrations.RunPython.noop),
    ]
