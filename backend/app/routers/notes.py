from datetime import date
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_doctor
from ..services.note_builder import build_note_text
from ..services.pdf import render_note_pdf

router = APIRouter()


@router.post("", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: schemas.NoteCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    patient = db.query(models.Patient).filter(models.Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    template = db.query(models.ProcedureTemplate).filter(models.ProcedureTemplate.id == payload.template_id).first()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    encounter_date = payload.encounter_date or date.today()
    final_text = payload.final_text or build_note_text(
        patient=patient,
        template=template,
        selected_fields=payload.selected_fields,
        therapy=payload.therapy,
        follow_up=payload.follow_up,
        encounter_date=encounter_date,
    )

    note = models.Note(
        patient_id=payload.patient_id,
        template_id=payload.template_id,
        encounter_date=encounter_date,
        region=template.region,
        procedure_name=template.name,
        selected_fields=payload.selected_fields,
        therapy=payload.therapy,
        follow_up=payload.follow_up,
        final_text=final_text,
        created_by_id=user.id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("", response_model=List[schemas.NoteRead])
def list_notes(
    patient_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    query = db.query(models.Note)
    if patient_id:
        query = query.filter(models.Note.patient_id == patient_id)
    return query.order_by(models.Note.created_at.desc()).all()


@router.get("/{note_id}", response_model=schemas.NoteRead)
def get_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=schemas.NoteRead)
def update_note(
    note_id: UUID,
    payload: schemas.NoteUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    patient = db.query(models.Patient).filter(models.Patient.id == note.patient_id).first()
    template = db.query(models.ProcedureTemplate).filter(models.ProcedureTemplate.id == note.template_id).first()
    if not patient or not template:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Related patient or template missing")

    if payload.selected_fields is not None:
        note.selected_fields = payload.selected_fields
    if payload.therapy is not None:
        note.therapy = payload.therapy
    if payload.follow_up is not None:
        note.follow_up = payload.follow_up

    if payload.final_text:
        note.final_text = payload.final_text
    else:
        note.final_text = build_note_text(
            patient=patient,
            template=template,
            selected_fields=note.selected_fields,
            therapy=note.therapy,
            follow_up=note.follow_up,
            encounter_date=note.encounter_date,
        )

    db.commit()
    db.refresh(note)
    return note


@router.post("/{note_id}/pdf")
def note_pdf(
    note_id: UUID,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_doctor),
):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    pdf_buffer = render_note_pdf(note.final_text)
    headers = {"Content-Disposition": f'attachment; filename="note-{note_id}.pdf"'}
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
