from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def render_note_pdf(note_text: str) -> BytesIO:
    """Render the provided note text into a simple PDF."""
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    x_margin = 50
    y = height - 50
    line_height = 16

    for line in note_text.splitlines():
        pdf.drawString(x_margin, y, line)
        y -= line_height
        if y < 50:
            pdf.showPage()
            y = height - 50

    pdf.save()
    buffer.seek(0)
    return buffer

