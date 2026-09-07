from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import hosted_zones, records
from app import auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Route53 Clone API")

# Update CORS to specifically allow your Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://route53-clone-wheat.vercel.app", 
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hosted_zones.router)
app.include_router(records.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Route53 Clone API"}