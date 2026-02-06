from datetime import date
from types import SimpleNamespace

from app.services.note_builder import build_note_text


def test_build_note_text_formats_sections():
    patient = SimpleNamespace(full_name="Jane Doe", patient_id="P123")
    template = SimpleNamespace(
        name="Septoplasty",
        region="Nose",
        text_blocks=["Septal deviation corrected on {deviation} side.", "Bleeding controlled: {bleeding_control}."],
    )
    selected_fields = {"deviation": "Left", "bleeding_control": True}
    therapy = ["antibiotics", "pain management"]
    follow_up = "Follow-up in 5 days"
    encounter_date = date(2025, 1, 1)

    text = build_note_text(
        patient=patient,
        template=template,
        selected_fields=selected_fields,
        therapy=therapy,
        follow_up=follow_up,
        encounter_date=encounter_date,
    )

    assert "Patient: Jane Doe (ID: P123)" in text
    assert "Septal deviation corrected on Left side." in text
    assert "Bleeding controlled: Yes." in text
    assert "Post-op / Therapy: antibiotics, pain management" in text
    assert "Follow-up: Follow-up in 5 days" in text

