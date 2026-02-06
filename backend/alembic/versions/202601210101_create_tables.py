"""create initial tables

Revision ID: 202601210101
Revises:
Create Date: 2026-01-21 01:01:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "202601210101_create_tables"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="doctor"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("patient_id", sa.String(length=100), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_patients_patient_id", "patients", ["patient_id"])
    op.create_table(
        "procedure_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("fields", postgresql.JSONB(), nullable=False),
        sa.Column("text_blocks", postgresql.JSONB(), nullable=False),
    )
    op.create_index("ix_templates_region", "procedure_templates", ["region"])
    op.create_table(
        "notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("template_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("procedure_templates.id"), nullable=False),
        sa.Column("encounter_date", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("procedure_name", sa.String(length=255), nullable=False),
        sa.Column("selected_fields", postgresql.JSONB(), nullable=False),
        sa.Column("therapy", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("follow_up", sa.String(length=255), nullable=True),
        sa.Column("final_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_index("ix_notes_patient_id", "notes", ["patient_id"])
    op.create_index("ix_notes_created_at", "notes", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_notes_created_at", table_name="notes")
    op.drop_index("ix_notes_patient_id", table_name="notes")
    op.drop_table("notes")
    op.drop_index("ix_templates_region", table_name="procedure_templates")
    op.drop_table("procedure_templates")
    op.drop_index("ix_patients_patient_id", table_name="patients")
    op.drop_table("patients")
    op.drop_table("users")

