"""add application updated_at and fix status default

Revision ID: 16d4c4e691bf
Revises: b7d4e2a91c05
Create Date: 2026-10-26 21:49:18.396976

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '16d4c4e691bf'
down_revision: Union[str, Sequence[str], None] = 'b7d4e2a91c05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the timestamp as nullable first, preserving existing rows.
    with op.batch_alter_table("applications") as batch_op:
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )

    # Give existing applications their original submission time.
    op.execute(
        "UPDATE applications "
        "SET updated_at = applied_at "
        "WHERE updated_at IS NULL"
    )

    # Require timestamps and use the new application status default.
    with op.batch_alter_table("applications") as batch_op:
        batch_op.alter_column(
            "updated_at",
            existing_type=sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        )
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=20),
            existing_nullable=False,
            server_default="Applied",
        )

    # Normalize existing records using the old default.
    op.execute(
        "UPDATE applications "
        "SET status = 'Applied' "
        "WHERE status = 'submitted'"
    )


def downgrade() -> None:
    with op.batch_alter_table("applications") as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=sa.String(length=20),
            existing_nullable=False,
            server_default="submitted",
        )
        batch_op.drop_column("updated_at")
