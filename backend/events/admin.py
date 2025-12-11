from django.contrib import admin

from .models import Club, Event, Favorite, Participation, Student, Tag


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ("name", "university", "city")
    search_fields = ("name", "university")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("email", "username", "university", "department", "grade")
    search_fields = ("email", "username", "university")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ("name",)


class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 0
    readonly_fields = ("student", "status", "created_at")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "club", "date", "category", "capacity", "participants_count")
    search_fields = ("title", "club__name", "category")
    list_filter = ("category", "club__university")
    inlines = [ParticipationInline]


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("student", "event", "created_at")
    search_fields = ("student__email", "event__title")
