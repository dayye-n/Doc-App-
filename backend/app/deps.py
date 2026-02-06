from fastapi import Depends, HTTPException, status

from . import auth
from .models import User


def get_current_doctor(user: User = Depends(auth.get_current_user)) -> User:
    if user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can access this resource")
    return user

