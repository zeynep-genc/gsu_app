"""REST serializers for UniConnect."""

from rest_framework import serializers

from .models import Club, Event, Favorite, Participation, Student, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name")


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ("id", "name", "university", "city", "description", "email")


class EventSerializer(serializers.ModelSerializer):
    club = ClubSerializer(read_only=True)
    club_id = serializers.PrimaryKeyRelatedField(
        queryset=Club.objects.all(), source="club", write_only=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "category",
            "city",
            "university",
            "date",
            "map_url",
            "capacity",
            "participants_count",
            "waiting_list_count",
            "club",
            "club_id",
            "tags",
            "tag_names",
        )

    def _assign_tags(self, instance: Event, tag_names: list[str]) -> None:
        if not tag_names:
            instance.tags.clear()
            return
        normalized = []
        for raw in tag_names:
            stripped = raw.strip().lower()
            if stripped:
                normalized.append(stripped)
        tags = []
        for name in normalized:
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        instance.tags.set(tags)

    def create(self, validated_data):
        tag_names = validated_data.pop("tag_names", [])
        event = super().create(validated_data)
        self._assign_tags(event, tag_names)
        return event

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tag_names", None)
        event = super().update(instance, validated_data)
        if tag_names is not None:
            self._assign_tags(event, tag_names)
        return event


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = (
            "id",
            "email",
            "username",
            "university",
            "department",
            "grade",
        )


class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Student
        fields = (
            "id",
            "email",
            "username",
            "university",
            "department",
            "grade",
            "password",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")
        student = Student(**validated_data)
        student.set_password(password)
        student.save()
        return student


class ClubAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ("id", "name", "university", "city", "description", "email")


class ClubRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Club
        fields = (
            "id",
            "name",
            "university",
            "city",
            "description",
            "email",
            "password",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")
        club = Club(**validated_data)
        club.set_password(password)
        club.save()
        return club


class ParticipationSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model = Participation
        fields = ("id", "student", "event", "status", "created_at")


class FavoriteSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    event_id = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), source="event", write_only=True
    )

    class Meta:
        model = Favorite
        fields = ("id", "student", "event", "event_id", "created_at")
        read_only_fields = ("student", "event", "created_at")
