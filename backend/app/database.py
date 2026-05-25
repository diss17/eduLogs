from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.config import DATABASE_URL

# Convert postgresql:// to postgresql+psycopg:// for psycopg3 driver
database_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")

# NullPool is crucial for NeonDB (serverless) to avoid idle connection timeouts
engine = create_engine(
    database_url,
    poolclass=NullPool,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
