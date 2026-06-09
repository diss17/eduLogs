from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.config import DATABASE_URL

# Convert postgresql:// to postgresql+psycopg:// for psycopg3 driver
database_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")

# Remove channel_binding=require which can hang on some Windows/SSL configs
if "channel_binding=require" in database_url:
    database_url = database_url.replace("channel_binding=require", "channel_binding=prefer")

# NullPool is crucial for NeonDB (serverless) to avoid idle connection timeouts
engine = create_engine(
    database_url,
    poolclass=NullPool,
    echo=False,
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
