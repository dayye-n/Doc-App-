from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, constr


# Authentication schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[EmailStr] = None


# Patient schemas
class PatientBase(BaseModel):
    patient_id: str
    full_name: str
    date_of_birth: Optional[date] = None
    notes: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    notes: Optional[str] = None


class PatientRead(PatientBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Procedure templates
class ProcedureField(BaseModel):
    name: str
    label: str
    type: str = Field(pattern="^(checkbox|dropdown|text-short)$")
    options: Optional[List[str]] = None


class ProcedureTemplateRead(BaseModel):
    id: UUID
    region: str
    name: str
    fields: List[ProcedureField]
    text_blocks: List[str]

    model_config = ConfigDict(from_attributes=True)


# Notes
class NoteCreate(BaseModel):
    patient_id: UUID
    template_id: UUID
    encounter_date: Optional[date] = None
    selected_fields: Dict[str, Any]
    therapy: List[str] = Field(default_factory=list)
    follow_up: Optional[str] = None
    final_text: Optional[str] = None


class NoteRead(BaseModel):
    id: UUID
    patient_id: UUID
    template_id: UUID
    encounter_date: date
    region: str
    procedure_name: str
    selected_fields: Dict[str, Any]
    therapy: List[str]
    follow_up: Optional[str]
    final_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteUpdate(BaseModel):
    selected_fields: Dict[str, Any] | None = None
    therapy: List[str] | None = None
    follow_up: Optional[str] = None
    final_text: Optional[str] = None
