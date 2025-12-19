"""Database models for UniConnect."""

from django.contrib.auth.hashers import check_password, make_password
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Club(TimeStampedModel):
    name = models.CharField(max_length=255)
    university = models.CharField(max_length=255)
    city = models.CharField(max_length=120, blank=True, default="")
    description = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    password = models.CharField(max_length=128)

    def __str__(self) -> str:
        return f"{self.university} - {self.name}"

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)


class Tag(TimeStampedModel):
    name = models.CharField(max_length=60, unique=True)

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class Student(TimeStampedModel):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    university = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    grade = models.PositiveSmallIntegerField(default=1)
    password = models.CharField(max_length=128)

    interests = models.ManyToManyField(
        Tag, related_name="interested_students", blank=True
    )

    def __str__(self) -> str:
        return self.username

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)


class Event(TimeStampedModel):
    club = models.ForeignKey(Club, related_name="events", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=120)
    city = models.CharField(max_length=120)
    university = models.CharField(max_length=255)
    date = models.DateField()
    map_url = models.URLField(blank=True)
    capacity = models.PositiveIntegerField(default=50)
    participants_count = models.PositiveIntegerField(default=0)
    waiting_list_count = models.PositiveIntegerField(default=0)
    tags = models.ManyToManyField(Tag, related_name="events", blank=True)

    class Meta:
        ordering = ("date",)

    def __str__(self) -> str:
        return f"{self.title} ({self.club.name})"

    @property
    def is_full(self) -> bool:
        return self.participants_count >= self.capacity > 0


class Participation(TimeStampedModel):
    STATUS_CONFIRMED = "confirmed"
    STATUS_WAITLISTED = "waitlisted"
    STATUS_CHOICES = [
        (STATUS_CONFIRMED, "Katıldı"),
        (STATUS_WAITLISTED, "Beklemede"),
    ]

    student = models.ForeignKey(
        Student, related_name="participations", on_delete=models.CASCADE
    )
    event = models.ForeignKey(
        Event, related_name="participations", on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_CONFIRMED
    )

    class Meta:
        unique_together = ("student", "event")
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.student.username} -> {self.event.title} ({self.status})"


class Favorite(TimeStampedModel):
    student = models.ForeignKey(
        Student, related_name="favorites", on_delete=models.CASCADE
    )
    event = models.ForeignKey(
        Event, related_name="favorited_by", on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ("student", "event")
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.student.username} ♥ {self.event.title}"
