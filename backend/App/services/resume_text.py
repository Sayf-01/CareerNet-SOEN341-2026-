# KA-12: turns a resume file (PDF or Word .docx) into plain text for the AI feedback feature.
# Never log the resume text, and never put it in an error message.

import io
import re

from docx import Document
from pypdf import PdfReader

PDF = "application/pdf"
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

MIN_CHARS = 50  # less than this means there is nothing useful to read
MAX_CHARS = 12_000  # longer resumes are cut, to keep the AI request small

NOT_SUPPORTED = "Old .doc files are not supported. Please upload a PDF or .docx file."
NO_TEXT = "No readable text was found. A scanned file has no text."
UNREADABLE = "This file could not be read. It may be damaged or password-protected."


class ResumeTextError(Exception):
    """The resume has no text we can read. The message is safe to show to the user."""


def _read_pdf(data: bytes) -> str:
    # one line of text per page; pages with no text (scans) give ""
    reader = PdfReader(io.BytesIO(data))
    if reader.is_encrypted:
        raise ResumeTextError(UNREADABLE)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _read_docx(data: bytes) -> str:
    # paragraphs first, then every table cell (many resumes put skills in tables)
    document = Document(io.BytesIO(data))
    parts = [paragraph.text for paragraph in document.paragraphs]
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                parts.append(cell.text)
    return "\n".join(parts)


def _clean(text: str) -> str:
    # collapse repeated spaces and tabs, drop blank lines, trim the ends
    text = re.sub(r"[ \t\f\v\u00a0]+", " ", text.replace("\r", "\n"))
    lines = [line.strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


def extract_resume_text(content_type: str, data: bytes) -> str:
    """Returns the resume's text, or raises ResumeTextError with a message for the user."""
    try:
        if content_type == PDF:
            raw = _read_pdf(data)
        elif content_type == DOCX:
            raw = _read_docx(data)
        else:  # application/msword (.doc) and anything else
            raise ResumeTextError(NOT_SUPPORTED)
    except ResumeTextError:
        raise
    except Exception:
        # broken file: replace the library's error so no file content can leak into the message
        raise ResumeTextError(UNREADABLE) from None

    text = _clean(raw)
    if len(text) < MIN_CHARS:
        raise ResumeTextError(NO_TEXT)
    return text[:MAX_CHARS]