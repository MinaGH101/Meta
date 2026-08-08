import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .models import NezaratRegion, PageContent, User
from .security import hash_password

def seed_database(db: Session) -> None:
    admin = db.scalar(select(User).where(User.email == settings.admin_email.lower()))
    if not admin:
        db.add(User(full_name=settings.admin_name, email=settings.admin_email.lower(), password_hash=hash_password(settings.admin_password), role="admin", is_active=True))
        db.flush()

    if settings.seed_initial_data:
        region_items = [(str(number), f"منطقه {number}") for number in range(1, 23)] + [("lavasan", "لواسان"), ("karaj", "کرج")]
        for order, (slug, name) in enumerate(region_items):
            if not db.scalar(select(NezaratRegion).where(NezaratRegion.slug == slug)):
                db.add(NezaratRegion(slug=slug, name=name, display_order=order))

        defaults = {
            "landing": ("هلدینگ متا", {"subtitle": "META HOLDING"}),
            "tarrahi": ("طراحی", {"intro": "پروژه‌های طراحی"}),
            "nezarat": ("نظارت", {"intro": "پروژه‌های نظارت"}),
            "ejra": ("اجرا", {"intro": "پروژه‌های اجرا"}),
            "about": ("درباره ما", {"intro": "هلدینگ متا"}),
            "contact": ("تماس با ما", {"address": "", "phone": "", "email": ""}),
        }
        for key, (title, content) in defaults.items():
            if not db.scalar(select(PageContent).where(PageContent.key == key)):
                db.add(PageContent(key=key, title=title, content_json=json.dumps(content, ensure_ascii=False)))

    db.commit()
