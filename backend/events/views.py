"""REST views for UniConnect."""

import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Club, Event, Favorite, Participation, Student, Tag
from .serializers import (
    ClubAuthSerializer,
    ClubRegistrationSerializer,
    EventSerializer,
    FavoriteSerializer,
    StudentRegistrationSerializer,
    StudentSerializer,
    StudentUpdateSerializer,
)
# Import JWT tokens lazily inside views to avoid import-time failures
RefreshToken = None

logger = logging.getLogger(__name__)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("club").prefetch_related("tags")
    serializer_class = EventSerializer

    @action(detail=True, methods=["post"], url_path="join")
    def join(self, request, pk=None):
        event = self.get_object()
        student_id = request.data.get("student_id")
        if not student_id:
            return Response(
                {"detail": "student_id zorunludur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        student = get_object_or_404(Student, pk=student_id)
        with transaction.atomic():
            participation, created = Participation.objects.get_or_create(
                student=student, event=event
            )
            if not created:
                return Response(
                    {"detail": "Bu etkinliğe zaten katılım isteğiniz var."},
                    status=status.HTTP_200_OK,
                )

            if event.is_full:
                participation.status = Participation.STATUS_WAITLISTED
                event.waiting_list_count += 1
                message = "Etkinlik kontenjanı dolu. Bekleme listesine eklendiniz."
            else:
                participation.status = Participation.STATUS_CONFIRMED
                event.participants_count += 1
                message = "Katılım isteğiniz alındı."

            participation.save()
            event.save()

        serializer = self.get_serializer(event)
        return Response(
            {"event": serializer.data, "message": message, "status": participation.status}
        )


class StudentLoginView(APIView):
    def post(self, request):
        try:
            email = request.data.get("email", "").strip().lower()
            password = request.data.get("password", "")
            student = Student.objects.filter(email__iexact=email).first()
            if not student or not student.check_password(password):
                return Response(
                    {"detail": "E-posta veya şifre hatalı."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # create JWT tokens (import lazily so manage.py won't fail if package missing)
            try:
                from rest_framework_simplejwt.tokens import RefreshToken as _RefreshToken
            except Exception:
                logger.exception("JWT library not available for student login")
                return Response({"detail": "Sunucuda JWT kütüphanesi bulunamadı."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            refresh = _RefreshToken.for_user(student)
            return Response(
                {
                    "role": "student",
                    "student": StudentSerializer(student).data,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }
            )
        except Exception as e:
            logger.exception("Student login error")
            return Response({"detail": f"Sunucu hatası: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClubLoginView(APIView):
    def post(self, request):
        try:
            university = request.data.get("university", "").strip()
            club_name = request.data.get("club_name", "").strip()
            password = request.data.get("password", "")

            club = Club.objects.filter(
                university__iexact=university,
                name__iexact=club_name
            ).first()

            if not club or not club.check_password(password):
                return Response(
                    {"detail": "Kulüp bilgileri doğrulanamadı."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                from rest_framework_simplejwt.tokens import RefreshToken as _RefreshToken
            except Exception:
                logger.exception("JWT library not available for club login")
                return Response({"detail": "Sunucuda JWT kütüphanesi bulunamadı."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            refresh = _RefreshToken.for_user(club)
            return Response({
                "role": "club",
                "club": ClubAuthSerializer(club).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })
        except Exception as e:
            logger.exception("Club login error")
            return Response({"detail": f"Sunucu hatası: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class StudentRegisterView(APIView):
    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response(
            {"message": "Öğrenci kaydı tamamlandı.", "student": StudentSerializer(student).data},
            status=status.HTTP_201_CREATED,
        )


class ClubRegisterView(APIView):
    def post(self, request):
        serializer = ClubRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        club = serializer.save()
        return Response(
            {"message": "Kulüp kaydı tamamlandı.", "club": ClubAuthSerializer(club).data},
            status=status.HTTP_201_CREATED,
        )


class FavoriteView(APIView):
    def get(self, request):
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response(
                {"detail": "student_id zorunludur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        favorites = Favorite.objects.filter(student_id=student_id).select_related("event", "event__club")
        event_ids = list(favorites.values_list("event_id", flat=True))
        serializer = FavoriteSerializer(favorites, many=True)
        return Response({"event_ids": event_ids, "favorites": serializer.data})

    def post(self, request):
        student_id = request.data.get("student_id")
        event_id = request.data.get("event_id")
        if not student_id or not event_id:
            return Response(
                {"detail": "student_id ve event_id zorunludur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        student = get_object_or_404(Student, pk=student_id)
        event = get_object_or_404(Event, pk=event_id)
        Favorite.objects.get_or_create(student=student, event=event)
        return Response({"detail": "Favorilere eklendi."}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        student_id = request.data.get("student_id")
        event_id = request.data.get("event_id")
        if not student_id or not event_id:
            return Response(
                {"detail": "student_id ve event_id zorunludur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        favorite = Favorite.objects.filter(student_id=student_id, event_id=event_id).first()
        if favorite:
            favorite.delete()
            return Response({"detail": "Favoriden çıkarıldı."})
        return Response({"detail": "Favori bulunamadı."}, status=status.HTTP_404_NOT_FOUND)


class RecommendationView(APIView):
    """Simple recommendations based on student's interests (tag overlap)."""

    def get(self, request):
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response({"detail": "student_id zorunludur."}, status=status.HTTP_400_BAD_REQUEST)
        student = get_object_or_404(Student, pk=student_id)
        from django.db.models import Count, Q, F
        from django.utils import timezone

        interest_ids = list(student.interests.values_list("id", flat=True))

        today = timezone.localdate()

        if interest_ids:
            # Score by number of overlapping tags, then by popularity and recency
            # Include events regardless of date so we surface relevant items even
            # if sample data dates are in the past.
            events = (
                Event.objects.annotate(
                    score=Count("tags", filter=Q(tags__in=interest_ids))
                )
                .filter(score__gt=0)
                .annotate(popularity=F("participants_count"))
                .order_by("-score", "-popularity", "date")[:50]
            )
        else:
            # Fallback: recommend popular upcoming events from the same university,
            # then global popular events if none found.
            events = (
                Event.objects.filter(date__gte=today, university__iexact=student.university)
                .annotate(popularity=F("participants_count"))
                .order_by("-popularity", "date")[:50]
            )
            if not events.exists():
                events = (
                    Event.objects.filter(date__gte=today)
                    .annotate(popularity=F("participants_count"))
                    .order_by("-popularity", "date")[:50]
                )

        serializer = EventSerializer(events, many=True)
        return Response({"recommendations": serializer.data})


class MetaTagsView(APIView):
    """Return tag suggestions for typeahead. Query param `q` filters by name."""

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        qs = Tag.objects.all()
        if q:
            qs = qs.filter(name__icontains=q)
        tags = qs.order_by("name")[0:50]
        # return list of simple objects
        data = [{"id": t.id, "name": t.name} for t in tags]
        return Response(data)


class StudentProfileView(APIView):
    """Retrieve or update a student profile by PK.

    Note: authentication is not enforced here; caller should ensure student_id
    matches authenticated user in a production setup.
    """

    def get(self, request, pk=None):
        student = get_object_or_404(Student, pk=pk)
        return Response(StudentSerializer(student).data)

    def patch(self, request, pk=None):
        student = get_object_or_404(Student, pk=pk)
        serializer = StudentUpdateSerializer(student, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response({"message": "Profil güncellendi.", "student": StudentSerializer(student).data})
