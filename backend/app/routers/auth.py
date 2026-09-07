from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app import models, schemas
from app.auth import create_session_token, get_current_user, SESSION_COOKIE_NAME

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(payload: schemas.LoginRequest, response: Response, db: DBSession = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == payload.username,
        models.User.password == payload.password,
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_session_token(db, user.username)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
    )
    return {"username": user.username}


@router.post("/logout")
def logout(response: Response, r53_session: str = Cookie(default=None), db: DBSession = Depends(get_db)):
    if r53_session:
        db.query(models.Session).filter(models.Session.token == r53_session).delete()
        db.commit()
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"message": "Logged out"}


@router.get("/me", response_model=schemas.UserOut)
def me(username: str = Depends(get_current_user)):
    return {"username": username}
