from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .admin_panel import ADMIN_PUBLIC_URL, setup_admin
from .config import settings
from .database import Base, SessionLocal, engine
from .routers import admin, auth, public
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.media_root.mkdir(parents=True, exist_ok=True)
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


settings.media_root.mkdir(parents=True, exist_ok=True)
app = FastAPI(
    title=settings.app_name,
    version="3.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount(settings.media_url, StaticFiles(directory=settings.media_root), name="media")
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(public.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)


@app.get("/admin", include_in_schema=False)
def admin_entry():
    return RedirectResponse(f"{ADMIN_PUBLIC_URL}/", status_code=307)


@app.get("/admin/", include_in_schema=False)
def admin_home():
    return RedirectResponse(f"{ADMIN_PUBLIC_URL}/management", status_code=307)


setup_admin(app)


@app.get("/", include_in_schema=False)
def root():
    return {"name": settings.app_name, "docs": "/docs", "admin": f"{ADMIN_PUBLIC_URL}/", "api": settings.api_prefix}


@app.get("/health/live", tags=["Health"])
def live():
    return {"status": "ok"}


@app.get("/health/ready", tags=["Health"])
def ready():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready"}
