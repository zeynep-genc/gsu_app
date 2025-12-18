from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import Tag, Student, Event, Club
import unicodedata
import re


class Command(BaseCommand):
    help = "Remove Tag entries whose name matches university names used in Student/Event/Club records"

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip confirmation prompt and delete matching tags",
        )

    def handle(self, *args, **options):
        yes = options.get("yes", False)

        def normalize(s: str) -> str:
            s = (s or "").strip().lower()
            s = unicodedata.normalize("NFKD", s)
            s = "".join(ch for ch in s if not unicodedata.combining(ch))
            s = re.sub(r"[^a-z0-9\s]", "", s)
            s = re.sub(r"\s+", " ", s).strip()
            return s

        uni_names = set()
        for val in Student.objects.all().values_list("university", flat=True):
            if val:
                uni_names.add(normalize(val))
        for val in Event.objects.all().values_list("university", flat=True):
            if val:
                uni_names.add(normalize(val))
        for val in Club.objects.all().values_list("university", flat=True):
            if val:
                uni_names.add(normalize(val))

        if not uni_names:
            self.stdout.write(self.style.NOTICE("No university names found in Student/Event/Club records."))
            return

        # find tags that match any university name or look like a university tag
        to_delete = []
        for tag in Tag.objects.all():
            if not tag.name:
                continue
            n = normalize(tag.name)
            # exact match to a university name
            if n in uni_names:
                to_delete.append(tag)
                continue
            # contains the token 'universite' (catch 'üniversitesi' variants)
            if "universite" in n:
                to_delete.append(tag)
                continue
            # contains any university name token as substring
            for uni in uni_names:
                if uni and uni in n:
                    to_delete.append(tag)
                    break

        if not to_delete:
            self.stdout.write(self.style.SUCCESS("No tags matched university names."))
            return

        self.stdout.write(self.style.WARNING(f"Found {len(to_delete)} tag(s) that match university names:"))
        for t in to_delete:
            self.stdout.write(f" - {t.name}")

        if not yes:
            confirm = input("Delete these tags? Type 'yes' to confirm: ")
            if confirm.lower() != "yes":
                self.stdout.write(self.style.NOTICE("Aborted by user."))
                return

        with transaction.atomic():
            for t in to_delete:
                self.stdout.write(self.style.NOTICE(f"Deleting tag: {t.name}"))
                t.delete()

        self.stdout.write(self.style.SUCCESS(f"Deleted {len(to_delete)} tag(s)."))
