from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth as auth_utils
from .. import models, schemas
from ..config import get_settings
from ..database import get_db

router = APIRouter()
settings = get_settings()


@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = auth_utils.get_password_hash(user_in.password)
    user = models.User(email=user_in.email, hashed_password=hashed_password, role="doctor")
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = auth_utils.create_access_token({"sub": str(user.id), "email": user.email})
    return schemas.Token(access_token=access_token)


@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = auth_utils.authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = auth_utils.create_access_token(
        data={"sub": str(user.id), "email": user.email}, expires_delta=access_token_expires
    )
    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserRead)
def me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return current_user

