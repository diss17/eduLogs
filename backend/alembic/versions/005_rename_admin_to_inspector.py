"""Rename roleenum 'admin' to 'inspector'

Revision ID: 005_rename_admin_to_inspector
Revises: 004_enum_values_lowercase
Create Date: 2026-06-18

"""
from alembic import op


revision = '005_rename_admin_to_inspector'
down_revision = '004_enum_values_lowercase'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE roleenum RENAME VALUE 'admin' TO 'inspector'")


def downgrade() -> None:
    op.execute("ALTER TYPE roleenum RENAME VALUE 'inspector' TO 'admin'")
