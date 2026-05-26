"""Add password_hash to usuarios

Revision ID: 002_add_password_hash
Revises: 001_initial_schema
Create Date: 2026-05-25

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_password_hash'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'usuarios',
        sa.Column('password_hash', sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('usuarios', 'password_hash')
