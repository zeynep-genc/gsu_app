"""Seed the database with demo data."""

from datetime import date

from django.core.management.base import BaseCommand

from events.models import Club, Event, Student, Tag


class Command(BaseCommand):
    help = "Seed demo users, clubs and events for local development."

    def handle(self, *args, **options):
        student, created = Student.objects.get_or_create(
            email="zeynepbetul@gmail.com",
            defaults={
                "username": "zeynep_betul",
                "university": "Galatasaray Üniversitesi",
                "department": "Bilgisayar Mühendisliği",
                "grade": 4,
            },
        )
        if created:
            student.set_password("123456")
            student.save()
            self.stdout.write(self.style.SUCCESS("Öğrenci hesabı oluşturuldu."))
        else:
            self.stdout.write("Öğrenci hesabı zaten var.")

        clubs_data = [
            {
                "name": "Bilgisayar Mühendisliği Kulübü",
                "university": "Galatasaray Üniversitesi",
                "city": "İstanbul",
                "description": "Yazılım, yapay zeka ve veri bilimi etkinlikleri.",
                "email": "bilgisayar@gsu.edu.tr",
                "password": "kulup123",
            },
            {
                "name": "Girişimcilik Kulübü",
                "university": "Boğaziçi Üniversitesi",
                "city": "İstanbul",
                "description": "Start-up kültürü ve girişimcilik sohbetleri.",
                "email": "girisim@boun.edu.tr",
                "password": "girisim123",
            },
            {
                "name": "Sosyal Sorumluluk Topluluğu",
                "university": "Ege Üniversitesi",
                "city": "İzmir",
                "description": "Gönüllülük ve toplumsal fayda projeleri.",
                "email": "sosyal@ege.edu.tr",
                "password": "sosyal123",
            },
        ]

        clubs = {}
        for data in clubs_data:
            club, created = Club.objects.get_or_create(
                name=data["name"],
                university=data["university"],
                defaults={
                    "city": data["city"],
                    "description": data["description"],
                    "email": data["email"],
                },
            )
            if created or not club.password:
                club.set_password(data["password"])
                club.save()
            clubs[data["name"]] = club

        default_map = (
            "https://www.openstreetmap.org/export/embed.html?bbox=29.004,41.040,29.012,41.046&layer=mapnik&marker=41.043,29.008"
        )

        events_data = [
            {
                "title": "Yapay Zeka Atölyesi",
                "club": clubs["Bilgisayar Mühendisliği Kulübü"],
                "university": "Galatasaray Üniversitesi",
                "city": "İstanbul",
                "category": "Teknoloji",
                "date": date(2025, 3, 12),
                "capacity": 60,
                "map_url": default_map,
                "tags": ["yapay zeka", "atölye"],
            },
            {
                "title": "Girişimcilik Sohbetleri",
                "club": clubs["Girişimcilik Kulübü"],
                "university": "Boğaziçi Üniversitesi",
                "city": "İstanbul",
                "category": "Kariyer",
                "date": date(2025, 3, 18),
                "capacity": 80,
                "map_url": default_map,
                "tags": ["girişimcilik", "start-up"],
            },
            {
                "title": "Sosyal Sorumluluk Projesi Tanıtımı",
                "club": clubs["Sosyal Sorumluluk Topluluğu"],
                "university": "Ege Üniversitesi",
                "city": "İzmir",
                "category": "Sosyal",
                "date": date(2025, 3, 20),
                "capacity": 40,
                "map_url": "https://www.openstreetmap.org/export/embed.html?bbox=27.126,38.414,27.142,38.426&layer=mapnik&marker=38.420,27.135",
                "tags": ["gönüllülük"],
            },
        ]

        for data in events_data:
            event, created = Event.objects.get_or_create(
                title=data["title"],
                club=data["club"],
                defaults={
                    "university": data["university"],
                    "city": data["city"],
                    "category": data["category"],
                    "date": data["date"],
                    "capacity": data["capacity"],
                    "map_url": data["map_url"],
                },
            )
            if created:
                tags = [
                    Tag.objects.get_or_create(name=tag.lower())[0]
                    for tag in data.get("tags", [])
                ]
                event.tags.set(tags)
                event.save()
                self.stdout.write(self.style.SUCCESS(f"{event.title} eklendi."))
            else:
                self.stdout.write(f"{event.title} zaten mevcut.")

        self.stdout.write(self.style.SUCCESS("Demo verileri hazır."))
