from django.urls import path
from .views import create_note,post_note

urlpatterns = [
    path('api/', create_note,name='create note'),
    path('post/', post_note,name='create note'),

]