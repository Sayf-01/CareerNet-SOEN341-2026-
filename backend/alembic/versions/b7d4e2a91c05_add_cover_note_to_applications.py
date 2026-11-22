"""add cover_note to applications

Revision ID: b7d4e2a91c05
Revises: 3f0afa113594
Create Date: 2026-10-26 20:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b7d4e2a91c05'
down_revision: Union[str, Sequence[str], None] = '3f0afa113594'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('applications', sa.Column('cover_note', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('applications') as batch_op:
        batch_op.drop_column('cover_note')