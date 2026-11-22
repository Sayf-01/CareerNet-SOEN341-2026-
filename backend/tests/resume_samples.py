# KA-12: sample resume files for tests. Lamees and Youssef reuse these builders.
# fpdf2's basic fonts only support plain Latin letters, so keep sample text simple.

import io

from docx import Document
from fpdf import FPDF

SAMPLE_RESUME_TEXT = """Alex Morgan
Junior Software Developer, Montreal, Quebec
alex.morgan@example.com

Summary
Software engineering student who enjoys building web applications and working with databases.
I like clean code, clear tests and learning new tools with a team.

Experience
Backend Developer Intern, Northwind Labs, Summer 2026
Built REST endpoints with Python and FastAPI for an internal booking system.
Wrote database models and migrations with SQLAlchemy and Alembic on PostgreSQL.
Added unit tests with pytest and helped the team keep the test suite green.

Teaching Assistant, Concordia University, Fall 2025
Helped students debug their first Java programs during weekly lab sessions.

Education
Bachelor of Engineering in Software Engineering, Concordia University, expected 2028

Skills
Python, FastAPI, SQLAlchemy, PostgreSQL, React, TypeScript, Git, Docker

Projects
CareerNet: a job board where job seekers apply to postings and recruiters review applicants.
"""


def make_pdf_bytes(text: str) -> bytes:
    # builds a real PDF containing the text; an empty text gives a PDF with no text (like a scan)
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)
    if text:
        pdf.multi_cell(0, 8, text)
    return bytes(pdf.output())


def make_docx_bytes(text: str, table_rows=None) -> bytes:
    # builds a real .docx: one paragraph per line, plus an optional table (list of rows of cells)
    document = Document()
    for line in text.split("\n"):
        document.add_paragraph(line)
    if table_rows:
        table = document.add_table(rows=len(table_rows), cols=len(table_rows[0]))
        for r, row in enumerate(table_rows):
            for c, value in enumerate(row):
                table.cell(r, c).text = value
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()