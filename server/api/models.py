from django.db import models

# Create your models here.
class Note(models.Model):
    title = models.CharField(max_length=10)
    content = models.TextField(max_length=400)