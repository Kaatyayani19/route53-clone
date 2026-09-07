from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal
from app import models
from app.routers import auth, hosted_zones, records

Base.metadata.create_all(bind=engine)

# Seed a default mock user if none exists
def seed_default_user():
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.username == "admin").first():
            db.add(models.User(username="admin", password="admin123"))
            db.commit()
    finally:
        db.close()

seed_default_user()

app = FastAPI(title="Route53 Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
