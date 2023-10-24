# Generated by Django 3.2.16 on 2023-10-01 21:11

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('identity_manager', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='identifierpattern',
            name='label',
            field=models.CharField(help_text='label describing what this pattern is for', max_length=50),
        ),
        migrations.AlterField(
            model_name='identityentry',
            name='description',
            field=models.CharField(blank=True, max_length=300, null=True),
        ),
        migrations.AlterField(
            model_name='identityentry',
            name='type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='identities', to='identity_manager.identitytype'),
        ),
    ]
