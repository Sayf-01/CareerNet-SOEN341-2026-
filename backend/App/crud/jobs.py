from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from App.models.job import Job

# Largest page size allowed
MAX_PAGE_SIZE = 100


# Search jobs by keyword, location and category, one page at a time.
# Returns the jobs for the page and the total number of matches.
def search_jobs(
    db: Session,
    keyword: str = None,
    location: str = None,
    category: str = None,
    page: int = 1,
    page_size: int = 10,
    include_closed: bool = False,
):
    query = db.query(Job)

    # Only show open jobs unless asked otherwise
    if not include_closed:
        query = query.filter(Job.status == "open")

    # Keyword can be in the title, company or description (any case)
    if keyword and keyword.strip():
        pattern = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                Job.title.ilike(pattern),
                Job.company.ilike(pattern),
                Job.description.ilike(pattern),
            )
        )

    # Location must match exactly (any case)
    if location and location.strip():
        query = query.filter(func.lower(Job.location) == location.strip().lower())

    # Category must match exactly (any case)
    if category and category.strip():
        query = query.filter(func.lower(Job.category) == category.strip().lower())

    # Count all matches before limiting to one page
    total = query.count()

    # Keep page values in a sensible range
    page = max(page, 1)
    page_size = min(max(page_size, 1), MAX_PAGE_SIZE)

    # Newest jobs first, then take the requested page
    items = (
        query.order_by(Job.posted_at.desc(), Job.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"items": items, "total": total, "page": page, "page_size": page_size}


# Get one job by id, or None if it does not exist
def get_job(db: Session, job_id: int):
    return db.query(Job).filter(Job.id == job_id).first()