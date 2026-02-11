# Generated manually for email verification token max_length fix
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0009_emailverificationtoken'),
    ]

    operations = [
        migrations.AlterField(
            model_name='emailverificationtoken',
            name='token',
            field=models.CharField(max_length=100),
        ),
    ]
