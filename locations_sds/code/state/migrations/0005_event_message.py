# Generated by Django 3.2.16 on 2023-10-31 14:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('state', '0004_auto_20231027_1623'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='message',
            field=models.CharField(blank=True, max_length=256, null=True),
        ),
    ]
