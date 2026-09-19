import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .models import NezaratRegion, PageContent, User
from .security import hash_password

def seed_database(db: Session) -> None:
    admin_email = settings.admin_email.strip().lower() or None
    admin_phone = settings.admin_phone.strip() or None
    admin = db.scalar(select(User).where(User.email == admin_email)) if admin_email else None
    if not admin and admin_phone:
        admin = db.scalar(select(User).where(User.phone == admin_phone))
    if not admin:
        admin = User(
            full_name=settings.admin_name,
            email=admin_email,
            phone=admin_phone,
            password_hash=hash_password(settings.admin_password),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.flush()
    elif admin_phone and not admin.phone:
        admin.phone = admin_phone

    if settings.seed_initial_data:
        region_items = [(str(number), f"منطقه {number}") for number in range(1, 23)] + [
            ("lavasan", "لواسان"),
            ("shemshak", "شمشک"),
            ("karaj", "سایر مناطق تهران"),
        ]
        for order, (slug, name) in enumerate(region_items):
            region = db.scalar(select(NezaratRegion).where(NezaratRegion.slug == slug))
            if not region:
                db.add(NezaratRegion(slug=slug, name=name, display_order=order))
            else:
                region.name = name

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
