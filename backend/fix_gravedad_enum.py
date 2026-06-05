"""Fix gravedadenum values: rename from lowercase to uppercase to match SQLAlchemy enum names."""
from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    conn.execute(text("ALTER TYPE gravedadenum RENAME VALUE 'leve' TO 'LEVE'"))
    conn.execute(text("ALTER TYPE gravedadenum RENAME VALUE 'media' TO 'MEDIA'"))
    conn.execute(text("ALTER TYPE gravedadenum RENAME VALUE 'grave' TO 'GRAVE'"))
    conn.execute(text("ALTER TYPE gravedadenum RENAME VALUE 'muy_grave' TO 'MUY_GRAVE'"))
    conn.commit()
    print("gravedadenum values updated to uppercase successfully")
