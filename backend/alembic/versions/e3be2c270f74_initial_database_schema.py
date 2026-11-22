"""initial database schema

Revision ID: e3be2c270f74
Revises: 
Create Date: 2026-10-08 19:55:31.589735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3be2c270f74'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    # create initial database schema for the job portal application

    # Existing Sprint 1 users table
    sa.Enum(
        "JOB_SEEKER",
        "RECRUITER",
        name="userrole"
    ).create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(50), nullable=False),
        sa.Column("email", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "JOB_SEEKER",
                "RECRUITER",
                name="userrole",
                create_type=False
            ),
            nullable=False
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email")
    )

    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_full_name", "users", ["full_name"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Professional profiles
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(100)),
        sa.Column("headline", sa.String(255)),
        sa.Column("location", sa.String(100)),
        sa.Column("phone", sa.String(30)),
        sa.Column("summary", sa.Text()),
        sa.Column("skills", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("user_id")
    )

    op.create_index("ix_profiles_id", "profiles", ["id"])

    # Uploaded resumes
    op.create_table(
        "resume_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("file_data", sa.LargeBinary(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"])
    )

    op.create_index("ix_resume_files_id", "resume_files", ["id"])

    # Job postings
    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recruiter_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("location", sa.String(100), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["recruiter_id"], ["users.id"])
    )

    op.create_index("ix_jobs_id", "jobs", ["id"])


def downgrade() -> None:
    #reverse the initial database schema changes

    op.drop_index("ix_jobs_id", table_name="jobs")
    op.drop_table("jobs")

    op.drop_index("ix_resume_files_id", table_name="resume_files")
    op.drop_table("resume_files")

    op.drop_index("ix_profiles_id", table_name="profiles")
    op.drop_table("profiles")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_full_name", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")

    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
