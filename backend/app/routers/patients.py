from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_doctor

router = APIRouter()


@router.get("", response_model=List[schemas.PatientRead])
def list_patients(
    search: str | None = Query(default=None, description="Search by patient id or name"),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    query = db.query(models.Patient)
    if search:
        like = f"%{search.lower()}%"
        query = query.filter(
            func.lower(models.Patient.full_name).like(like) | func.lower(models.Patient.patient_id).like(like)
        )
    return query.order_by(models.Patient.created_at.desc()).all()


@router.post("", response_model=schemas.PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: schemas.PatientCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    existing = db.query(models.Patient).filter(models.Patient.patient_id == payload.patient_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient ID already exists")
    patient = models.Patient(**payload.model_dump(), created_by_id=user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=schemas.PatientRead)
def get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient

