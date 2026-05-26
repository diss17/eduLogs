"""Generated Alembic migration version file

Revision ID: 001_initial_schema
Create Date: 2026-05-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create usuarios table
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('nombre', sa.String(length=255), nullable=False),
        sa.Column('apellido', sa.String(length=255), nullable=False),
        sa.Column('rol', sa.Enum('admin', 'profesor', 'funcionario', name='roleenum'), nullable=False, server_default='funcionario'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_usuarios_email'), 'usuarios', ['email'], unique=True)
    op.create_index(op.f('ix_usuarios_id'), 'usuarios', ['id'], unique=False)

    # Create alumnos table
    op.create_table(
        'alumnos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('nombre', sa.String(length=255), nullable=False),
        sa.Column('apellido', sa.String(length=255), nullable=False),
        sa.Column('grado', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_alumnos_email'), 'alumnos', ['email'], unique=True)
    op.create_index(op.f('ix_alumnos_id'), 'alumnos', ['id'], unique=False)

    # Create incidentes table
    op.create_table(
        'incidentes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('titulo', sa.String(length=255), nullable=False),
        sa.Column('descripcion', sa.String(length=2000), nullable=False),
        sa.Column('categoria', sa.Enum('bullying', 'violencia', 'inasistencia', 'otro', name='categoriaenum'), nullable=False),
        sa.Column('estado', sa.Enum('abierto', 'en_progreso', 'cerrado', name='estadoenum'), nullable=False, server_default='abierto'),
        sa.Column('ubicacion', sa.String(length=255), nullable=False),
        sa.Column('funcionario_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['funcionario_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_incidentes_id'), 'incidentes', ['id'], unique=False)

    # Create incidente_alumnos association table
    op.create_table(
        'incidente_alumnos',
        sa.Column('incidente_id', sa.Integer(), nullable=False),
        sa.Column('alumno_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['alumno_id'], ['alumnos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['incidente_id'], ['incidentes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('incidente_id', 'alumno_id')
    )


def downgrade() -> None:
    op.drop_table('incidente_alumnos')
    op.drop_index(op.f('ix_incidentes_id'), table_name='incidentes')
    op.drop_table('incidentes')
    op.drop_index(op.f('ix_alumnos_id'), table_name='alumnos')
    op.drop_index(op.f('ix_alumnos_email'), table_name='alumnos')
    op.drop_table('alumnos')
    op.drop_index(op.f('ix_usuarios_id'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_email'), table_name='usuarios')
    op.drop_table('usuarios')
