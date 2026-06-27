"""Add derivacion field to incidentes

Revision ID: 008_add_derivacion_to_incidentes
Revises: 007_add_notas
Create Date: 2026-06-26

"""
from alembic import op
import sqlalchemy as sa


revision = '008_add_derivacion_to_incidentes'
down_revision = '007_add_notas'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('incidentes', sa.Column('derivacion', sa.String(length=2000), nullable=True))


def downgrade() -> None:
    op.drop_column('incidentes', 'derivacion')
