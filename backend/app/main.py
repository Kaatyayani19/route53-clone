from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routers import hosted_zones, records

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Route53 Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hosted_zones.router)
app.include_router(records.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Route53 Clone API"}