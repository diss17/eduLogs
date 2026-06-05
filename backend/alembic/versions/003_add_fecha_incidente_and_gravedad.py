"""Add fecha_incidente and gravedad to incidentes

Revision ID: 003_add_fecha_gravedad
Revises: 002_add_password_hash
Create Date: 2026-06-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_fecha_gravedad'
down_revision = '002_add_password_hash'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DO $$ BEGIN CREATE TYPE gravedadenum AS ENUM ('leve', 'media', 'grave', 'muy_grave'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.add_column(
        'incidentes',
        sa.Column('fecha_incidente', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'incidentes',
        sa.Column(
            'gravedad',
            sa.Enum('leve', 'media', 'grave', 'muy_grave', name='gravedadenum', create_type=False),
            nullable=True,
        )
    )


def downgrade() -> None:
    op.drop_column('incidentes', 'gravedad')
    op.drop_column('incidentes', 'fecha_incidente')
    op.execute("DROP TYPE gravedadenum")
