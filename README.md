# CareerNet
A web-based platform that allows job seekers and recruiters to connect. The System allows users to upload and manage their resumes/Cover letters. Furthermore, it tracks applications and follows the progress of their application.

## Technologies

- **Front end:** React, CSS, HTML, TypeScript
- **Back end:** Python, FastAPI
- **Database:** PostgreSQL (Neon Cloud)
- **Database tools:** SQLAlchemy (ORM), Alembic (migrations), SQLite (In-Memory Testing)
- **Testing frameworks:** 
  - **Vitest:** Frontend unit and configuration testing
  - **Pytest:** Backend integration and API testing (isolated via an in-memory SQLite database)
- **Version Control:** GitHub
- **CI/CD & DevOps:** GitHub Actions (Automated Pipelines)

## Team

- **Sayf** — Lead, Database Backend 
- **Lamees** - General Backend Developer
- **Dany** — Frontend Developer
- **Youssef** - General Backend Developer 
- **Krish** - Frontend Developer
- **Kaila** - Database Backend

## Problem
Job seekers keep their resumes, applications, and deadlines scattered across
emails, spreadsheets, and job sites, which makes it easy to lose track of
where each application stands. Recruiters also lack a simple place to post
jobs and follow applicants.

## Solution
CareerNet puts everything in one place. Job seekers manage their profile and
resumes, apply to jobs, and track each application's status. Recruiters post
jobs and review applicants.
## Features

**Job seekers**
- Account registration and login (#5, #6)
- Profile: name, headline, location, phone, summary and skills
- Resume upload, replace, download and delete (#16)
- Job search and filtering by keyword, location and category (#27)
- Apply to a job with a resume and an optional note
- Application status tracking: Applied, Under Review, Interview, Offered, Rejected (#17)

**Recruiters**
- Create job postings (#21)
- View the applicants for a posting (#23)
- Update an applicant's status (#24)

**In progress (Sprint 3)**
- Recruiters: list, edit and archive their postings, and filter applicants (#22, #25)
- Job seekers: applications dashboard with a status breakdown and activity over time (#19)
- Notifications for status changes, interview invitations, new applications and interview reminders (#18)

**Planned for Sprint 4**
- AI feature: resume feedback or job matching (#20, #26)
- Save jobs to favourites (#28)

## API

- All API paths start with `/api/v1`.
- Wrong or missing input returns `400` with a message in `detail`.
- The interactive API docs are at `/docs` when the backend is running (for example http://localhost:8000/docs).


## Set up
**Step 1: clone and pull the latest code**
- Ensure you're on the Main branch by running this on the terminal and have the latest update by running:
 ```bash
  git checkout main
  git pull origin main
  ```

**Step 2: Create a virtual environment**
- Run this on your terminal:
  ```bash
  python3 -m venv .venv
  ```

**Step 3: Activate virtual Environment**
- Ensure you're inside the (.venv) by running this on your terminal: (afterwards you should see  "(.venv)" at the beginning of the line)
  ```bash
  source .venv/bin/activate
  ```


**Step 4: install all dependencies**
 - Once inside (.venv) run this to install all dependencies:
```bash
  pip install -r requirements.txt
  ```

**Step 5: Environment variables**

In the root folder, create a file named exactly ".env" with:

- DATABASE_URL=your-database-link
JWT_SECRET_KEY=any-long-random-string (generate with:
python -c "import secrets; print(secrets.token_hex(32))")
CORS_ORIGINS=http://localhost:5173

Never commit this file. Each teammate creates their own.


### Frontend API configuration

The frontend uses `VITE_API_BASE_URL` to connect to the backend.

For local development, you can add this to your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If this variable is not provided, the frontend defaults to
`http://localhost:8000`.

The shared API helper automatically adds the `/api/v1` prefix
and includes the saved login token when available.

Step 6: Load sample jobs (optional)

* To fill the database with 18 sample job postings for testing search and applications, run this from the root folder:

```
python -m scripts.seed_jobs
```

* It's safe to run more than once: jobs that already exist are skipped, so nothing is duplicated.

## Run Steps:
 - We'll require two terminals to run the website.

### For the Backend run:
   ```bash
    uvicorn App.main:app --reload
  ```
### For the Frontend run: 
   ```bash
    npm install
    npm run dev
  ```

## Running Tests

Before submitting code, make sure all automated tests pass. The tests use their own temporary databases and never touch the shared Neon database. CI runs the same checks on every pull request into `main`.

**Backend** (from the repository root, with the virtual environment on):
```bash
.venv/bin/python -m pytest -q
```
On Windows PowerShell: `.\.venv\Scripts\python -m pytest -q`

**Frontend:**
```bash
npm test
```

More details on what is tested and how: [Documentation/TESTING.md](Documentation/TESTING.md).

**Test data:** `python -m scripts.seed_jobs` loads 18 sample jobs, and `python -m scripts.seed_demo_data` loads demo accounts, applications and notifications. Both write to the database in your `.env`, are safe to run twice, and are never run by the tests.

## Repository
https://github.com/Sayf-01/SOEN341-2026
