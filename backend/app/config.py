import os
import psycopg2

class config:
    SECRET_KEY = os.environ["SECRET_KEY"]
    DEBUG=False

def get_database_url():
    """Get the database URL from environment variables."""
    return os.environ["DATABASE_URL"]

class Config:
    env_file = ".env"