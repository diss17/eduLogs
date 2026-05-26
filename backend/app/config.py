import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/edulogs"
)

DEBUG = os.getenv("DEBUG", "False").lower() == "true"
