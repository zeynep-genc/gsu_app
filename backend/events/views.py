"""REST views for UniConnect."""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Club, Event, Favorite, Participation, Student
from .serializers import (
    ClubAuthSerializer,
    ClubRegistrationSerializer,
    EventSerializer,
    FavoriteSerializer,
    StudentRegistrationSerializer,
    StudentSerializer,
)


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
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")
        student = Student.objects.filter(email__iexact=email).first()
        if not student or not student.check_password(password):
            return Response(
                {"detail": "E-posta veya şifre hatalı."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"role": "student", "student": StudentSerializer(student).data}
        )


class ClubLoginView(APIView):
    def post(self, request):
        university = request.data.get("university", "").strip().lower()
        club_name = request.data.get("club_name", "").strip().lower()
        password = request.data.get("password", "")
        club = (
            Club.objects.filter(
                university__iexact=university, name__iexact=club_name
            ).first()
        )
        if not club or not club.check_password(password):
            return Response(
                {"detail": "Kulüp bilgileri doğrulanamadı."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"role": "club", "club": ClubAuthSerializer(club).data})


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
