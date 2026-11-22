import App.models  # noqa: F401  (registers every model so the foreign keys resolve)
from App.models.job import Job
from App.database.connection import SessionLocal


# Fixed lists shared with the frontend filters and the API cheat sheet.
CATEGORIES = [
    "Software Development",
    "Data and AI",
    "Design",
    "Marketing",
    "Finance",
    "Customer Support",
]

LOCATIONS = ["Montreal", "Toronto", "Vancouver", "Ottawa", "Quebec City", "Remote"]


SAMPLE_JOBS = [
    # Software Development
    {
        "title": "Junior Python Developer",
        "company": "Maple Byte Labs",
        "location": "Montreal",
        "category": "Software Development",
        "description": (
            "Join a small backend team building internal tools with Python and FastAPI. "
            "You will write API endpoints, fix bugs and add tests with guidance from senior developers. "
            "Experience with SQL and Git is an asset."
        ),
        "status": "open",
    },
    {
        "title": "Full Stack Developer",
        "company": "Northwind Digital",
        "location": "Toronto",
        "category": "Software Development",
        "description": (
            "Build features end to end for a web platform used by small businesses. "
            "You will work with React on the frontend and Node.js on the backend. "
            "We value clean code, code reviews and clear communication."
        ),
        "status": "open",
    },
    {
        "title": "Backend Developer",
        "company": "CloudPine Software",
        "location": "Remote",
        "category": "Software Development",
        "description": (
            "Design and maintain REST APIs and PostgreSQL databases for a growing SaaS product. "
            "You will improve performance, write migrations and monitor services in production. "
            "This is a fully remote role within Canadian time zones."
        ),
        "status": "open",
    },
    # Data and AI
    {
        "title": "Data Analyst",
        "company": "Capital Insights Group",
        "location": "Ottawa",
        "category": "Data and AI",
        "description": (
            "Turn raw data into reports and dashboards that guide business decisions. "
            "You will write SQL queries, clean datasets and present findings to managers. "
            "Familiarity with Python or Power BI is a plus."
        ),
        "status": "open",
    },
    {
        "title": "Machine Learning Developer",
        "company": "Coastal AI",
        "location": "Vancouver",
        "category": "Data and AI",
        "description": (
            "Help train, evaluate and deploy machine learning models for text classification. "
            "You will prepare datasets, run experiments and package models as APIs. "
            "Knowledge of Python and scikit-learn or PyTorch is required."
        ),
        "status": "open",
    },
    {
        "title": "Data Engineering Intern",
        "company": "Laurentian Analytics",
        "location": "Quebec City",
        "category": "Data and AI",
        "description": (
            "Support the data team in building pipelines that move data between systems. "
            "You will write Python scripts, schedule jobs and check data quality. "
            "This four-month internship is open to students in computer science or engineering."
        ),
        "status": "open",
    },
    # Design
    {
        "title": "UX Designer",
        "company": "Studio Boreal",
        "location": "Montreal",
        "category": "Design",
        "description": (
            "Research user needs and turn them into wireframes and prototypes. "
            "You will run usability tests and work closely with developers during implementation. "
            "A portfolio showing your design process is required."
        ),
        "status": "open",
    },
    {
        "title": "UI Designer",
        "company": "Pixelfield",
        "location": "Remote",
        "category": "Design",
        "description": (
            "Create clean, accessible interfaces for web and mobile apps. "
            "You will maintain the design system in Figma and prepare assets for developers. "
            "Attention to detail and consistency is essential."
        ),
        "status": "open",
    },
    {
        "title": "Product Designer",
        "company": "Northwind Digital",
        "location": "Toronto",
        "category": "Design",
        "description": (
            "Own the design of new product features from idea to launch. "
            "You will balance user feedback, business goals and technical limits. "
            "Experience working in agile teams is an asset."
        ),
        "status": "open",
    },
    # Marketing
    {
        "title": "Marketing Coordinator",
        "company": "Evergreen Outdoor Co",
        "location": "Vancouver",
        "category": "Marketing",
        "description": (
            "Plan and run email and social media campaigns for an outdoor gear brand. "
            "You will track campaign results and suggest improvements. "
            "Strong writing skills and organization are a must."
        ),
        "status": "open",
    },
    {
        "title": "Social Media Specialist",
        "company": "Fleur de Lys Media",
        "location": "Quebec City",
        "category": "Marketing",
        "description": (
            "Manage social media accounts for several local businesses. "
            "You will create posts, reply to followers and report on engagement each month. "
            "Bilingual English and French candidates are preferred."
        ),
        "status": "open",
    },
    {
        "title": "Content Writer",
        "company": "Capital Insights Group",
        "location": "Ottawa",
        "category": "Marketing",
        "description": (
            "Write blog posts, case studies and newsletters about data and technology. "
            "You will work with subject experts to explain complex topics in plain language. "
            "Samples of published writing are required."
        ),
        "status": "open",
    },
    # Finance
    {
        "title": "Junior Financial Analyst",
        "company": "Lakeshore Financial",
        "location": "Toronto",
        "category": "Finance",
        "description": (
            "Support budgeting, forecasting and monthly reporting. "
            "You will build spreadsheet models and explain changes in the numbers to managers. "
            "A degree in finance, accounting or economics is preferred."
        ),
        "status": "open",
    },
    {
        "title": "Accounting Assistant",
        "company": "Mont Royal Accounting",
        "location": "Montreal",
        "category": "Finance",
        "description": (
            "Help with bookkeeping, invoices and bank reconciliations for small business clients. "
            "You will enter transactions and prepare documents for tax season. "
            "This posting is closed and kept for testing."
        ),
        "status": "closed",
    },
    {
        "title": "Payroll Clerk",
        "company": "Evergreen Outdoor Co",
        "location": "Vancouver",
        "category": "Finance",
        "description": (
            "Process bi-weekly payroll for about 150 employees. "
            "You will update employee records, check hours and answer pay questions. "
            "Experience with payroll software is an asset."
        ),
        "status": "open",
    },
    # Customer Support
    {
        "title": "Customer Support Representative",
        "company": "CloudPine Software",
        "location": "Remote",
        "category": "Customer Support",
        "description": (
            "Help customers by email and chat with questions about our software. "
            "You will troubleshoot common issues and pass complex cases to the technical team. "
            "Patience and clear communication are key."
        ),
        "status": "open",
    },
    {
        "title": "Technical Support Developer",
        "company": "Rideau Systems",
        "location": "Ottawa",
        "category": "Customer Support",
        "description": (
            "Investigate customer-reported bugs and write small fixes and scripts. "
            "You will reproduce issues, read logs and work with the development team. "
            "Basic programming experience in Python or JavaScript is required."
        ),
        "status": "open",
    },
    {
        "title": "Client Success Associate",
        "company": "Laurentian Analytics",
        "location": "Quebec City",
        "category": "Customer Support",
        "description": (
            "Onboard new clients and make sure they get value from our analytics platform. "
            "You will run training sessions and check in with clients regularly. "
            "French and English are both required for this role."
        ),
        "status": "open",
    },
]


def seed_jobs():
    db = SessionLocal()
    added = 0
    skipped = 0
    try:
        for data in SAMPLE_JOBS:
            exists = (
                db.query(Job)
                .filter(Job.title == data["title"], Job.company == data["company"])
                .first()
            )
            if exists:
                skipped += 1
                continue

            # recruiter_id is left empty: sample jobs have no recruiter.
            db.add(Job(**data))
            added += 1

        db.commit()
        print(f"Sample jobs: {added} added, {skipped} already existed.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_jobs()