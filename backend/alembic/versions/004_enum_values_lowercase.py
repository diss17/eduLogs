"""Enum values to lowercase

Revision ID: 004_enum_values_lowercase
Revises: 003_add_fecha_gravedad
Create Date: 2026-06-17

"""
from alembic import op


revision = '004_enum_values_lowercase'
down_revision = '003_add_fecha_gravedad'
branch_labels = None
depends_on = None


_RENAMES = [
    ("roleenum", "ADMIN", "admin"),
    ("roleenum", "PROFESOR", "profesor"),
    ("roleenum", "FUNCIONARIO", "funcionario"),
    ("categoriaenum", "BULLYING", "bullying"),
    ("categoriaenum", "VIOLENCIA", "violencia"),
    ("categoriaenum", "INASISTENCIA", "inasistencia"),
    ("categoriaenum", "OTRO", "otro"),
    ("estadoenum", "ABIERTO", "abierto"),
    ("estadoenum", "EN_PROGRESO", "en_progreso"),
    ("estadoenum", "CERRADO", "cerrado"),
    ("gravedadenum", "LEVE", "leve"),
    ("gravedadenum", "MEDIA", "media"),
    ("gravedadenum", "GRAVE", "grave"),
    ("gravedadenum", "MUY_GRAVE", "muy_grave"),
]


def upgrade() -> None:
    for type_name, old, new in _RENAMES:
        op.execute(f"ALTER TYPE {type_name} RENAME VALUE '{old}' TO '{new}'")


def downgrade() -> None:
    for type_name, old, new in _RENAMES:
        op.execute(f"ALTER TYPE {type_name} RENAME VALUE '{new}' TO '{old}'")
