"""ASGI config for UniConnect backend."""

from pathlib import Path
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "uniconnect_backend.settings")

application = get_asgi_application()
