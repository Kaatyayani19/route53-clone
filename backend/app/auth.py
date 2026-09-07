import secrets
from fastapi import APIRouter, Response, HTTPException, Depends, Cookie
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app import models
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

SESSION_COOKIE_NAME = "r53_session"

class LoginRequest(BaseModel):
    username: str
    password: str

def create_session_token(db: DBSession, username: str) -> str:
    token = secrets.token_hex(24)
    session = models.Session(token=token, username=username)
    db.add(session)
    db.commit()
    return token

def get_current_user(
    r53_session: str = Cookie(default=None),
    db: DBSession = Depends(get_db),
):
    if not r53_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = db.query(models.Session).filter(
        models.Session.token == r53_session
    ).first()
    
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    return session.username

@router.post("/login")
def login(data: LoginRequest, response: Response, db: DBSession = Depends(get_db)):
    if not data.username or not data.password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    token = create_session_token(db, data.username)
    response.set_cookie(
        key=SESSION_COOKIE_NAME, 
        value=token, 
        httponly=True, 
        samesite="none", 
        secure=True
    )
    return {"message": "Logged in successfully", "username": data.username}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        samesite="none",
        secure=True
    )
    return {"message": "Logged out successfully"}