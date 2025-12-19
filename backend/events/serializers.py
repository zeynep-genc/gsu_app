"""REST serializers for UniConnect."""

from rest_framework import serializers

from .models import Club, Event, Favorite, Participation, Student, Tag


def normalize_tag_name(s: str) -> str:
 
    s = (s or "").strip().lower()
    s = " ".join(s.split())
    return s


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
            "description",
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
            name = normalize_tag_name(raw)
            if name:
                normalized.append(name)

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

    interests = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = (
            "id",
            "email",
            "username",
            "university",
            "department",
            "grade",
            "interests",
        )


class StudentRegistrationSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, min_length=6)
    username = serializers.CharField(required=False, allow_blank=True)

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

        # grade: string gelirse int'e çevir
        raw_grade = validated_data.get("grade")
        if isinstance(raw_grade, str):
            if raw_grade.lower() == "hazirlik":
                validated_data["grade"] = 0
            else:
                try:
                    validated_data["grade"] = int(raw_grade)
                except (TypeError, ValueError):
                    validated_data["grade"] = 1

        # username yoksa email local-part
        if not validated_data.get("username"):
            email = validated_data.get("email", "")
            base = email.split("@")[0] if "@" in email else (email or "user")
            username = base
            counter = 1
            while Student.objects.filter(username=username).exists():
                username = f"{base}{counter}"
                counter += 1
            validated_data["username"] = username

        student = Student(**validated_data)
        student.set_password(password)
        student.save()
        return student


class StudentUpdateSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Student
        fields = (
            "email",
            "username",
            "university",
            "department",
            "grade",
            "password",
            "tag_names",
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        tag_names = validated_data.pop("tag_names", None)

        for key, val in validated_data.items():
            setattr(instance, key, val)

        if password:
            instance.set_password(password)

        instance.save()

        if tag_names is not None:
            normalized = []
            for raw in tag_names:
                name = normalize_tag_name(raw)
                if name:
                    normalized.append(name)

            tags = []
            for name in normalized:
                tag, _ = Tag.objects.get_or_create(name=name)
                tags.append(tag)

            instance.interests.set(tags)

        return instance


class ClubAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ("id", "name", "university", "city", "description", "email")


class ClubRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    city = serializers.CharField(required=False, allow_blank=True, default="")

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

    def validate_email(self, value):
        cleaned = (value or "").strip().lower()
        if not cleaned.endswith(".edu.tr"):
            raise serializers.ValidationError("E-posta edu.tr uzantılı olmalıdır.")
        return cleaned

    def create(self, validated_data):
        password = validated_data.pop("password")
        club = Club(**validated_data)
        club.set_password(password)
        club.save()
        return club


class ClubUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Club
        fields = ("name", "university", "city", "description", "email", "password")

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for key, value in validated_data.items():
            setattr(instance, key, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

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
