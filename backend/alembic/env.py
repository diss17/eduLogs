"""alembic environment for eduLogs."""
from logging.config import fileConfig
from alembic import context
import sys
from pathlib import Path

# Add the backend root to the path so 'app' is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import Base, engine  # usa el engine ya configurado con psycopg3

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model's MetaData object for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations en modo offline (sin conexión activa)."""
    from app.config import DATABASE_URL
    url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations en modo online (con conexión activa)."""
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
