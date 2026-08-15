from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0034_user_department_user_ip_restriction_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="department",
        ),
        migrations.RemoveField(
            model_name="user",
            name="ip_restriction",
        ),
        migrations.RemoveField(
            model_name="user",
            name="is_two_factor_enabled",
        ),
        migrations.RemoveField(
            model_name="user",
            name="location_branch",
        ),
        migrations.RemoveField(
            model_name="user",
            name="reporting_manager",
        ),
        migrations.RemoveField(
            model_name="user",
            name="team_assignment",
        ),
    ]
