from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.database import engine, Base
from src.api import auth, profile, entreprise, interactions, survey, admin, announcements, badge
from fastapi.staticfiles import StaticFiles

# Création des tables dans PostgreSQL (pratique pour commencer avant Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EMSI Forum API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes avec le préfixe /api
app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(entreprise.router, prefix="/api")
app.include_router(interactions.router, prefix="/api")
app.include_router(survey.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(announcements.router, prefix="/api")
app.include_router(badge.router, prefix="/api")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    return {"message": "L'API du Forum EMSI est en ligne !"}