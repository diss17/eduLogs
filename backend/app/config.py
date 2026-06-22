import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/edulogs")

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "480"))
