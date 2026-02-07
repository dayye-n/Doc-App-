from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, SessionLocal, engine
from .routers import ai, auth, notes, patients, templates
from .seed import seed_initial_admin, seed_initial_templates

settings = get_settings()

app = FastAPI(title="Dr.Tools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    # Ensure tables exist for local dev; migrations are recommended for prod.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_admin(db)
        seed_initial_templates(db)
    finally:
        db.close()


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(templates.router, prefix="/templates", tags=["templates"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


@app.get("/")
def read_root():
    return {"status": "ok", "service": "Dr.Tools API"}
