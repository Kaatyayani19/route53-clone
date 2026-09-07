import secrets
from fastapi import Cookie, HTTPException, Depends
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app import models

SESSION_COOKIE_NAME = "r53_session"


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
