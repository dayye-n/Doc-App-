from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_doctor

router = APIRouter()


@router.get("", response_model=List[schemas.ProcedureTemplateRead])
def list_templates(
    region: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    query = db.query(models.ProcedureTemplate)
    if region:
        query = query.filter(models.ProcedureTemplate.region == region)
    return query.order_by(models.ProcedureTemplate.name.asc()).all()

