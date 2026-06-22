"""Add profesor_jefe role and profesor_jefe_cursos table

Revision ID: 006_add_profesor_jefe
Revises: 005_rename_admin_to_inspector
Create Date: 2026-06-18

"""
from alembic import op
import sqlalchemy as sa


revision = '006_add_profesor_jefe'
down_revision = '005_rename_admin_to_inspector'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE roleenum ADD VALUE 'profesor_jefe'")
    op.create_table(
        'profesor_jefe_cursos',
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('grado', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('usuario_id', 'grado')
    )


def downgrade() -> None:
    op.drop_table('profesor_jefe_cursos')
