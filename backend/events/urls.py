"""Events API URL definitions."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ClubLoginView,
    ClubRegisterView,
    EventViewSet,
    FavoriteView,
    StudentLoginView,
    StudentRegisterView,
    RecommendationView,  
    MetaTagsView,        
    StudentProfileView,  
)

router = DefaultRouter()
router.register(r"events", EventViewSet, basename="event")

urlpatterns = [
    path("auth/student-login/", StudentLoginView.as_view(), name="student-login"),
    path("auth/club-login/", ClubLoginView.as_view(), name="club-login"),
    path("auth/student-register/", StudentRegisterView.as_view(), name="student-register"),
    path("auth/club-register/", ClubRegisterView.as_view(), name="club-register"),

    path("favorites/", FavoriteView.as_view(), name="favorites"),

    path("meta/tags/", MetaTagsView.as_view(), name="meta-tags"),
    path("students/<int:pk>/", StudentProfileView.as_view(), name="student-profile"),

    path("recommendations/", RecommendationView.as_view(), name="recommendations"),  # ✅ ekle

    path("", include(router.urls)),
]
