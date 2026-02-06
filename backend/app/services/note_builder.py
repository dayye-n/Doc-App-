from datetime import date
from typing import Any, Dict, List

from ..models import Patient, ProcedureTemplate


class _SafeDict(dict):
    def __missing__(self, key):
        return "N/A"


def format_field_value(value: Any) -> str:
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if value is None:
        return "N/A"
    return str(value)


def build_note_text(
    patient: Patient,
    template: ProcedureTemplate,
    selected_fields: Dict[str, Any],
    therapy: List[str],
    follow_up: str | None,
    encounter_date: date,
) -> str:
    """Construct the clinical note text using template blocks and selected values."""
    formatted_fields = {k: format_field_value(v) for k, v in selected_fields.items()}
    findings_lines: List[str] = []
    for block in template.text_blocks:
        text = block.format_map(_SafeDict(formatted_fields))
        if text.strip():
            findings_lines.append(f"- {text.strip()}")

    therapy_text = ", ".join(therapy) if therapy else "None"
    follow_up_text = follow_up or "As needed"

    sections = [
        f"Patient: {patient.full_name} (ID: {patient.patient_id})",
        f"Date: {encounter_date.isoformat()}",
        "",
        "Findings:",
        "\n".join(findings_lines) if findings_lines else "- No specific findings provided.",
        "",
        f"Procedure Performed: {template.name}",
        "",
        f"Post-op / Therapy: {therapy_text}",
        f"Follow-up: {follow_up_text}",
    ]
    return "\n".join(sections)

