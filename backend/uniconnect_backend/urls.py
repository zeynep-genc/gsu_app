"""URL configuration for UniConnect backend."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", lambda request: JsonResponse({"status": "running", "name": "UniConnect API"})),
    path("api/", include("events.urls")),
]
