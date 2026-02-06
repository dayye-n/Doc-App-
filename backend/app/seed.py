from typing import List
import uuid

from sqlalchemy.orm import Session

from . import models
from .auth import get_password_hash
from .config import get_settings


def seed_initial_admin(db: Session) -> None:
    """Create a default admin/doctor account if missing."""
    settings = get_settings()
    email = settings.default_admin_email
    password = settings.default_admin_password
    if not email or not password:
        return
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return
    admin = models.User(
        email=email,
        hashed_password=get_password_hash(password),
        role="doctor",
    )
    db.add(admin)
    db.commit()


def seed_initial_templates(db: Session) -> None:
    """Insert initial procedure templates if they do not exist."""
    existing = {tpl.name for tpl in db.query(models.ProcedureTemplate).all()}
    initial_templates: List[dict] = [
        {
            "id": uuid.uuid4(),
            "region": "Nose",
            "name": "Septoplasty",
            "fields": [
                {"name": "deviation", "label": "Septal deviation", "type": "dropdown", "options": ["Left", "Right", "Bilateral"]},
                {"name": "approach", "label": "Approach", "type": "dropdown", "options": ["Endonasal", "Open"]},
                {"name": "bleeding_control", "label": "Bleeding controlled", "type": "checkbox"},
            ],
            "text_blocks": [
                "Septoplasty performed for {deviation} deviation using {approach} approach.",
                "Hemostasis status: {bleeding_control}.",
            ],
        },
        {
            "id": uuid.uuid4(),
            "region": "Nose",
            "name": "Turbinate reduction",
            "fields": [
                {"name": "side", "label": "Side", "type": "dropdown", "options": ["Left", "Right", "Bilateral"]},
                {"name": "technique", "label": "Technique", "type": "dropdown", "options": ["Radiofrequency", "Submucosal resection", "Coblation"]},
                {"name": "packing", "label": "Nasal packing", "type": "checkbox"},
            ],
            "text_blocks": [
                "Inferior turbinate reduction on {side} side using {technique}.",
                "Nasal packing applied: {packing}.",
            ],
        },
        {
            "id": uuid.uuid4(),
            "region": "Left Ear",
            "name": "Tympanoplasty",
            "fields": [
                {"name": "graft", "label": "Graft material", "type": "dropdown", "options": ["Temporalis fascia", "Cartilage", "Perichondrium"]},
                {"name": "ossicular_chain", "label": "Ossicular chain", "type": "dropdown", "options": ["Intact", "Reconstructed"]},
                {"name": "perforation_size", "label": "Perforation size", "type": "dropdown", "options": ["Small", "Moderate", "Large"]},
            ],
            "text_blocks": [
                "Left tympanic membrane {perforation_size} perforation addressed with tympanoplasty.",
                "Graft material: {graft}; ossicular chain status: {ossicular_chain}.",
            ],
        },
        {
            "id": uuid.uuid4(),
            "region": "Right Ear",
            "name": "Tympanoplasty",
            "fields": [
                {"name": "graft", "label": "Graft material", "type": "dropdown", "options": ["Temporalis fascia", "Cartilage", "Perichondrium"]},
                {"name": "ossicular_chain", "label": "Ossicular chain", "type": "dropdown", "options": ["Intact", "Reconstructed"]},
                {"name": "perforation_size", "label": "Perforation size", "type": "dropdown", "options": ["Small", "Moderate", "Large"]},
            ],
            "text_blocks": [
                "Right tympanic membrane {perforation_size} perforation addressed with tympanoplasty.",
                "Graft material: {graft}; ossicular chain status: {ossicular_chain}.",
            ],
        },
        {
            "id": uuid.uuid4(),
            "region": "Left Ear",
            "name": "Ear examination",
            "fields": [
                {"name": "cerumen", "label": "Cerumen impaction", "type": "checkbox"},
                {"name": "infection", "label": "Signs of infection", "type": "checkbox"},
                {"name": "hearing", "label": "Hearing assessment", "type": "dropdown", "options": ["Normal", "Mild loss", "Moderate loss", "Severe loss"]},
            ],
            "text_blocks": [
                "Left ear examined. Cerumen impaction: {cerumen}. Infection present: {infection}.",
                "Hearing: {hearing}.",
            ],
        },
        {
            "id": uuid.uuid4(),
            "region": "Right Ear",
            "name": "Ear examination",
            "fields": [
                {"name": "cerumen", "label": "Cerumen impaction", "type": "checkbox"},
                {"name": "infection", "label": "Signs of infection", "type": "checkbox"},
                {"name": "hearing", "label": "Hearing assessment", "type": "dropdown", "options": ["Normal", "Mild loss", "Moderate loss", "Severe loss"]},
            ],
            "text_blocks": [
                "Right ear examined. Cerumen impaction: {cerumen}. Infection present: {infection}.",
                "Hearing: {hearing}.",
            ],
        },
        {
            "id": uuid.uuid4(),
            "region": "Throat",
            "name": "Tonsillectomy",
            "fields": [
                {"name": "tonsil_grade", "label": "Tonsil grade", "type": "dropdown", "options": ["1+", "2+", "3+", "4+"]},
                {"name": "bleeding", "label": "Hemostasis achieved", "type": "checkbox"},
                {"name": "specimen", "label": "Specimen sent to pathology", "type": "checkbox"},
            ],
            "text_blocks": [
                "Tonsillectomy performed for grade {tonsil_grade} hypertrophy.",
                "Hemostasis achieved: {bleeding}. Specimen to pathology: {specimen}.",
            ],
        },
        {
            "id": uuid.uuid4(),
            "region": "Neck",
            "name": "Neck examination",
            "fields": [
                {"name": "lymph_nodes", "label": "Lymph nodes", "type": "dropdown", "options": ["Normal", "Tender", "Enlarged"]},
                {"name": "masses", "label": "Palpable masses", "type": "checkbox"},
                {"name": "range_of_motion", "label": "Range of motion", "type": "dropdown", "options": ["Full", "Limited"]},
            ],
            "text_blocks": [
                "Neck examined: lymph nodes {lymph_nodes}, palpable masses: {masses}.",
                "Range of motion: {range_of_motion}.",
            ],
        },
    ]

    to_create = [item for item in initial_templates if item["name"] not in existing]
    if not to_create:
        return

    for tpl in to_create:
        db.add(models.ProcedureTemplate(**tpl))
    db.commit()
