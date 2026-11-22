# KA-12 tests for App/services/resume_text.py

import pytest

from App.services.resume_text import DOCX, PDF, ResumeTextError, extract_resume_text
from tests.resume_samples import SAMPLE_RESUME_TEXT, make_docx_bytes, make_pdf_bytes


def test_pdf_words_come_back():
    text = extract_resume_text(PDF, make_pdf_bytes(SAMPLE_RESUME_TEXT))
    for word in ["Alex Morgan", "FastAPI", "PostgreSQL", "Concordia"]:
        assert word in text


def test_docx_words_and_table_cells_come_back():
    data = make_docx_bytes(SAMPLE_RESUME_TEXT, table_rows=[["Skill", "Level"], ["Kubernetes", "Advanced"]])
    text = extract_resume_text(DOCX, data)
    assert "Alex Morgan" in text
    assert "Kubernetes" in text  # from the table
    assert "Advanced" in text


def test_extra_spaces_and_blank_lines_are_cleaned():
    messy = "   Line one    has     spaces   \n\n\n\n\nLine two\t\tafter tabs\n\n" + SAMPLE_RESUME_TEXT
    text = extract_resume_text(DOCX, make_docx_bytes(messy))
    assert "Line one has spaces" in text
    assert "Line two after tabs" in text
    assert "  " not in text  # no double spaces
    assert "\n\n" not in text  # no blank lines
    assert text == text.strip()


def test_long_text_is_cut_at_12000_characters():
    long_text = ("resume " * 3000)[:20000]
    text = extract_resume_text(DOCX, make_docx_bytes(long_text))
    assert len(text) == 12000


def test_pdf_with_no_text_raises():
    with pytest.raises(ResumeTextError, match="No readable text was found"):
        extract_resume_text(PDF, make_pdf_bytes(""))


def test_random_bytes_called_pdf_raise():
    with pytest.raises(ResumeTextError):
        extract_resume_text(PDF, b"this is not really a pdf file" * 20)


@pytest.mark.parametrize("content_type", ["application/msword", "image/png"])
def test_doc_and_unknown_types_raise(content_type):
    with pytest.raises(ResumeTextError, match="Old .doc files are not supported"):
        extract_resume_text(content_type, b"anything")


def test_error_message_never_contains_resume_text():
    # too short to use: the error must not repeat what was in the file
    with pytest.raises(ResumeTextError) as short_error:
        extract_resume_text(DOCX, make_docx_bytes("SECRETWORD Alex"))
    assert "SECRETWORD" not in str(short_error.value)

    # broken file that contains a secret word: same rule
    with pytest.raises(ResumeTextError) as broken_error:
        extract_resume_text(PDF, b"%PDF-1.4 SECRETWORD broken")
    assert "SECRETWORD" not in str(broken_error.value)