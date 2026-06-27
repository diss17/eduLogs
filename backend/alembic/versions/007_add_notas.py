"""Add notas table

Revision ID: 007_add_notas
Revises: 006_add_profesor_jefe
Create Date: 2026-06-26

"""
from alembic import op
import sqlalchemy as sa


revision = '007_add_notas'
down_revision = '006_add_profesor_jefe'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'notas',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('incidente_id', sa.Integer(), sa.ForeignKey('incidentes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('autor_id', sa.Integer(), sa.ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True),
        sa.Column('contenido', sa.String(length=2000), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('notas')
