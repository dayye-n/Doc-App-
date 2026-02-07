from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


# Request/Response schemas for AI endpoints
class ParseNoteRequest(BaseModel):
    text: str


class ParsedNoteResponse(BaseModel):
    procedure: str
    side: str  # "left" | "right" | "bilateral" | "na"
    symptoms: List[str]
    findings: List[str]
    diagnosis: str
    medications: List[str]
    packing: str
    follow_up: str
    instructions: str
    red_flags: List[str]


class CheckNoteRequest(BaseModel):
    note_data: Dict[str, Any]


class CheckNoteResponse(BaseModel):
    warnings: List[str]
    score: int  # 0-100


class PatientInstructionsRequest(BaseModel):
    note_data: Dict[str, Any]


class PatientInstructionsResponse(BaseModel):
    discharge_text: str
    red_flags: List[str]
    follow_up: str


def mock_parse_note_from_text(text: str) -> ParsedNoteResponse:
    """
    Mock function that parses dictation text into structured note data.
    In production, this would call OpenAI API or similar.
    """
    text_lower = text.lower()
    
    # Extract procedure (look for common ENT procedures)
    procedure = "Tonsillectomy"
    if "septoplasty" in text_lower or "deviated septum" in text_lower:
        procedure = "Septoplasty"
    elif "adenoidectomy" in text_lower or "adenoids" in text_lower:
        procedure = "Adenoidectomy"
    elif "tympanostomy" in text_lower or "ear tubes" in text_lower:
        procedure = "Tympanostomy"
    elif "sinus" in text_lower:
        procedure = "Functional Endoscopic Sinus Surgery"
    
    # Extract side
    side = "na"
    if "left" in text_lower and "right" not in text_lower:
        side = "left"
    elif "right" in text_lower and "left" not in text_lower:
        side = "right"
    elif "bilateral" in text_lower or ("left" in text_lower and "right" in text_lower):
        side = "bilateral"
    
    # Extract symptoms
    symptoms = []
    if "pain" in text_lower:
        symptoms.append("Pain")
    if "bleeding" in text_lower or "hemorrhage" in text_lower:
        symptoms.append("Bleeding")
    if "infection" in text_lower or "drainage" in text_lower:
        symptoms.append("Infection")
    if "difficulty breathing" in text_lower or "obstruction" in text_lower:
        symptoms.append("Airway obstruction")
    if not symptoms:
        symptoms = ["Chronic condition"]
    
    # Extract findings
    findings = []
    if "enlarged" in text_lower:
        findings.append("Enlarged tissue")
    if "inflammation" in text_lower or "inflamed" in text_lower:
        findings.append("Inflammation")
    if "polyps" in text_lower:
        findings.append("Polyps")
    if "deviated" in text_lower:
        findings.append("Deviated septum")
    if not findings:
        findings = ["Standard findings"]
    
    # Extract diagnosis
    diagnosis = "Chronic condition requiring surgical intervention"
    if "recurrent" in text_lower:
        diagnosis = "Recurrent condition"
    if "acute" in text_lower:
        diagnosis = "Acute condition"
    
    # Extract medications
    medications = []
    if "antibiotic" in text_lower:
        medications.append("Antibiotics")
    if "pain" in text_lower or "analgesic" in text_lower:
        medications.append("Pain management")
    if "steroid" in text_lower:
        medications.append("Steroids")
    if not medications:
        medications = ["Standard post-op medications"]
    
    # Packing
    packing = "None"
    if "packing" in text_lower or "nasal packing" in text_lower:
        packing = "Nasal packing placed"
    
    # Follow-up
    follow_up = "Follow-up in 7-10 days"
    if "week" in text_lower:
        follow_up = "Follow-up in 1 week"
    elif "two weeks" in text_lower or "2 weeks" in text_lower:
        follow_up = "Follow-up in 2 weeks"
    
    # Instructions
    instructions = "Standard post-operative care instructions provided. Patient advised to avoid strenuous activity."
    if "diet" in text_lower:
        instructions += " Soft diet recommended."
    if "elevate" in text_lower or "head" in text_lower:
        instructions += " Keep head elevated."
    
    # Red flags
    red_flags = [
        "Excessive bleeding",
        "Fever > 101°F",
        "Severe pain not controlled by medication",
        "Difficulty breathing",
    ]
    
    return ParsedNoteResponse(
        procedure=procedure,
        side=side,
        symptoms=symptoms,
        findings=findings,
        diagnosis=diagnosis,
        medications=medications,
        packing=packing,
        follow_up=follow_up,
        instructions=instructions,
        red_flags=red_flags,
    )


def check_note_quality(note_data: Dict[str, Any]) -> CheckNoteResponse:
    """
    Rule-based note validation.
    Detects contradictions and missing required items.
    """
    warnings: List[str] = []
    score = 100
    
    # Check for side inconsistencies
    side = note_data.get("side", "").lower()
    selected_fields = note_data.get("selected_fields", {})
    
    # Check if procedure mentions left/right but side doesn't match
    procedure_name = str(note_data.get("procedure_name", "")).lower()
    if "left" in procedure_name and side not in ["left", "bilateral"]:
        warnings.append("Procedure mentions 'left' but side selection doesn't match")
        score -= 10
    if "right" in procedure_name and side not in ["right", "bilateral"]:
        warnings.append("Procedure mentions 'right' but side selection doesn't match")
        score -= 10
    
    # Check for missing required fields
    if not note_data.get("procedure_name"):
        warnings.append("Procedure name is missing")
        score -= 15
    
    if not note_data.get("selected_fields"):
        warnings.append("No procedure details filled in")
        score -= 20
    
    # Check therapy consistency
    therapy = note_data.get("therapy", [])
    follow_up = note_data.get("follow_up", "")
    
    if "antibiotics" in [t.lower() for t in therapy] and "infection" not in str(selected_fields).lower():
        warnings.append("Antibiotics prescribed but no infection documented")
        score -= 5
    
    if "packing" in str(selected_fields).lower() and "dressing change" not in [t.lower() for t in therapy]:
        warnings.append("Packing mentioned but no dressing change in therapy")
        score -= 5
    
    # Check follow-up consistency
    if not follow_up or follow_up.strip() == "":
        warnings.append("Follow-up instructions are missing")
        score -= 10
    
    # Ensure score doesn't go below 0
    score = max(0, score)
    
    return CheckNoteResponse(warnings=warnings, score=score)


def generate_patient_instructions(note_data: Dict[str, Any]) -> PatientInstructionsResponse:
    """
    Template-based patient instruction generator.
    Creates plain-language discharge instructions from note data.
    """
    procedure = note_data.get("procedure_name", "procedure")
    side = note_data.get("side", "na")
    therapy = note_data.get("therapy", [])
    follow_up = note_data.get("follow_up", "Follow-up in 7-10 days")
    selected_fields = note_data.get("selected_fields", {})
    
    # Build discharge text
    discharge_parts = [
        f"Following your {procedure.lower()}",
    ]
    
    if side and side != "na":
        discharge_parts.append(f"on the {side} side,")
    
    discharge_parts.append("please follow these instructions:")
    discharge_parts.append("")
    discharge_parts.append("ACTIVITY:")
    discharge_parts.append("- Rest for 24-48 hours")
    discharge_parts.append("- Avoid strenuous activity for 1 week")
    discharge_parts.append("- No heavy lifting for 2 weeks")
    discharge_parts.append("")
    
    discharge_parts.append("DIET:")
    if "tonsil" in procedure.lower() or "adenoid" in procedure.lower():
        discharge_parts.append("- Soft, cool foods for the first few days")
        discharge_parts.append("- Avoid hot, spicy, or acidic foods")
        discharge_parts.append("- Stay well hydrated")
    else:
        discharge_parts.append("- Regular diet as tolerated")
        discharge_parts.append("- Stay well hydrated")
    discharge_parts.append("")
    
    discharge_parts.append("MEDICATIONS:")
    if "antibiotics" in [t.lower() for t in therapy]:
        discharge_parts.append("- Take antibiotics as prescribed until finished")
    if "pain management" in [t.lower() for t in therapy]:
        discharge_parts.append("- Take pain medication as needed for discomfort")
    if not therapy:
        discharge_parts.append("- Take medications as prescribed by your doctor")
    discharge_parts.append("")
    
    if "packing" in str(selected_fields).lower():
        discharge_parts.append("CARE:")
        discharge_parts.append("- Nasal packing will be removed at follow-up")
        discharge_parts.append("- Do not attempt to remove packing yourself")
        discharge_parts.append("")
    
    discharge_text = "\n".join(discharge_parts)
    
    # Red flags
    red_flags = [
        "Excessive bleeding that soaks through bandages",
        "Fever greater than 101°F (38.3°C)",
        "Severe pain not relieved by prescribed medication",
        "Difficulty breathing or swallowing",
        "Signs of infection: increased redness, swelling, or pus",
    ]
    
    return PatientInstructionsResponse(
        discharge_text=discharge_text,
        red_flags=red_flags,
        follow_up=follow_up,
    )


@router.post("/parse-note", response_model=ParsedNoteResponse)
async def parse_note(request: ParseNoteRequest):
    """
    Parse dictation/transcript text into structured note data.
    Currently uses mock implementation; ready for OpenAI integration.
    """
    try:
        result = mock_parse_note_from_text(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing note: {str(e)}")


@router.post("/check-note", response_model=CheckNoteResponse)
async def check_note(request: CheckNoteRequest):
    """
    Validate note quality and detect contradictions.
    Returns warnings and a quality score (0-100).
    """
    try:
        result = check_note_quality(request.note_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking note: {str(e)}")


@router.post("/patient-instructions", response_model=PatientInstructionsResponse)
async def generate_patient_instructions_endpoint(request: PatientInstructionsRequest):
    """
    Generate patient-friendly discharge instructions from note data.
    """
    try:
        result = generate_patient_instructions(request.note_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating instructions: {str(e)}")
