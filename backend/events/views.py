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
    ClubUpdateSerializer,
    EventSerializer,
    FavoriteSerializer,
    ParticipationSerializer,
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

    @action(detail=True, methods=["post"], url_path="notify")
    def notify_participants(self, request, pk=None):
        event = self.get_object()
        participants = Participation.objects.filter(event=event, status=Participation.STATUS_CONFIRMED)
        participant_emails = participants.values_list("student__email", flat=True).distinct()
        count = len(participant_emails)
        subject = request.data.get("subject") or f"{event.title} hakkında bilgilendirme"
        # Actual mailing would happen here; for now we just log the intent.
        logger.info(
            "Kulüp e-postası: etkinlik %s için '%s' başlıklı mesaj %d kişiye gönderildi.",
            event.id,
            subject,
            count,
        )
        return Response(
            {
                "message": f"{count} kişiye mail gönderildi.",
                "recipient_count": count,
            }
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
        past_tag_ids = list(
            Tag.objects.filter(events__participations__student=student)
            .values_list("id", flat=True)
        )

        tag_ids = list({*interest_ids, *past_tag_ids})
        if not tag_ids:
            return Response(
                {
                    "recommendations": [],
                    "message": "İlgi alanı veya geçmiş katıldığınız etkinliklerden öneriye veri bulunamadı.",
                }
            )

        today = timezone.localdate()
        events = (
            Event.objects.annotate(
                score=Count("tags", filter=Q(tags__in=tag_ids))
            )
            .filter(score__gt=0, date__gte=today)
            .annotate(popularity=F("participants_count"))
            .order_by("-score", "-popularity", "date")[:50]
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


class StudentParticipationsView(APIView):
    """List participations (events) for a student."""

    def get(self, request, pk=None):
        student = get_object_or_404(Student, pk=pk)
        participations = (
            Participation.objects.filter(student=student)
            .select_related("event", "event__club")
            .order_by("-created_at")
        )
        serializer = ParticipationSerializer(participations, many=True)
        return Response({"participations": serializer.data})


class ClubProfileView(APIView):
    """Retrieve or update a club profile by PK."""

    def get(self, request, pk=None):
        club = get_object_or_404(Club, pk=pk)
        return Response(ClubAuthSerializer(club).data)

    def patch(self, request, pk=None):
        club = get_object_or_404(Club, pk=pk)
        serializer = ClubUpdateSerializer(club, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        club = serializer.save()
        return Response(
            {"message": "Kulüp güncellendi.", "club": ClubAuthSerializer(club).data}
        )
