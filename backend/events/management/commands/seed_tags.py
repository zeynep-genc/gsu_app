from django.core.management.base import BaseCommand

from events.models import Tag


CURATED_TAGS = [
    # Popular interests / activities
    "yapay zeka",
    "robotik",
    "veri bilimi",
    "makine öğrenmesi",
    "web geliştirme",
    "mobil uygulama",
    "tasarım",
    "grafik tasarım",
    "fotoğrafçılık",
    "video prodüksiyon",
    "girişimcilik",
    "start-up",
    "kariyer",
    "staj",
    "mentorluk",
    "hackathon",
    "atölye",
    "seminer",
    "konferans",
    "etkinlik yönetimi",
    "projeler",
    "topluluk hizmeti",
    "gönüllülük",
    "spor",
    "futbol",
    "basketbol",
    "voleybol",
    "yüzme",
    "yoga",
    "sağlık",
    "psikoloji",
    "medya",
    "muzik",
    "koru",
    "orchestra",
    "tiyatro",
    "sahne sanatları",
    "okuma kulübü",
    "satranç",
    "tasarım odaklı düşünme",
    "sürdürülebilirlik",
    "çevre",
    "iklim değişikliği",
    "politik aktivizm",
    "insan hakları",
    "hukuk",
    "ekonomi",
    "pazarlama",
    "finans",
    "yönetim",
    "insan kaynakları",
    "vergi",
    "yedek parça",
    # Academic departments (common)
    "bilgisayar mühendisliği",
    "elektrik elektronik mühendisliği",
    "endüstri mühendisliği",
    "makine mühendisliği",
    "inşaat mühendisliği",
    "kimya mühendisliği",
    "mimarlık",
    "işletme",
    "iktisat",
    "hukuk fakültesi",
    "tıp fakültesi",
    "psikoloji bölümü",
    "sosyoloji",
    "matematik",
    "fizik",
    "kimya",
    "biyoloji",
    "istatistik",
    "biyomedikal mühendisliği",
    "endüstri ürünleri tasarımı",
    "gıda mühendisliği",
    "çeşitlilik ve kapsayıcılık",
    # Technology / tools
    "python",
    "javascript",
    "react",
    "vue",
    "nodejs",
    "django",
    "flask",
    "docker",
    "kubernetes",
    "ci/cd",
    "git",
    "linux",
    "aws",
    "azure",
    "gcp",
    # Career skills
    "cv hazırlama",
    "mülakat",
    "networking",
    "sunum becerileri",
    "liderlik",
    "takım çalışması",
    "problem çözme",
    "yaratıcı düşünme",
    "veri analizi",
    "iş zekası",
    # Hobbies & lifestyle
    "yemek",
    "mutfak",
    "kültür",
    "seyahat",
    "doğa yürüyüşü",
    "kamp",
    "oyun geliştirme",
    "masa oyunları",
    "kodlama",
    "blockchain",
    "kripto",
    "biyoteknoloji",
    "enerji",
    "uzay teknolojileri",
    "dijital sanat",
    "3d modelleme",
]


class Command(BaseCommand):
    help = "Seed curated tags into the events.Tag table."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Show tags that would be created without saving.")

    def handle(self, *args, **options):
        dry = options.get("dry_run")
        created = 0
        for name in CURATED_TAGS:
            name_norm = (name or "").strip().lower()
            if not name_norm:
                continue
            obj, was_created = Tag.objects.get_or_create(name=name_norm)
            if was_created:
                created += 1
                if dry:
                    self.stdout.write(self.style.SUCCESS(f"[DRY] Would create: {name_norm}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"Created tag: {name_norm}"))
        if dry:
            self.stdout.write(self.style.WARNING("Dry-run complete."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Seeding complete. {created} tags created."))
