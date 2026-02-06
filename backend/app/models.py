import uuid
from datetime import datetime, date
from typing import Any, Dict, List

from sqlalchemy import Column, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="doctor", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patients: Mapped[List["Patient"]] = relationship("Patient", back_populates="created_by")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="created_by")


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_by: Mapped["User | None"] = relationship("User", back_populates="patients")
    notes_rel: Mapped[List["Note"]] = relationship("Note", back_populates="patient")


class ProcedureTemplate(Base):
    __tablename__ = "procedure_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    fields: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    text_blocks: Mapped[List[str]] = mapped_column(JSONB, nullable=False)


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("procedure_templates.id"), nullable=False)
    encounter_date: Mapped[date] = mapped_column(Date, default=date.today)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    procedure_name: Mapped[str] = mapped_column(String(255), nullable=False)
    selected_fields: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    therapy: Mapped[List[str]] = mapped_column(JSONB, default=list)
    follow_up: Mapped[str | None] = mapped_column(String(255), nullable=True)
    final_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="notes_rel")
    created_by: Mapped["User | None"] = relationship("User", back_populates="notes")
    template: Mapped["ProcedureTemplate"] = relationship("ProcedureTemplate")
