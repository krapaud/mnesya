import os
import psycopg2

class config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'secret-key-mnesya')
    DEBUG=False

def get_database_url():
    """Get the database URL from environment variables."""
    return os.getenv('DATABASE_URL', 'postgresql://mnesya_user:mnesya_password@db:5432/mnesya_db')

class Config:
    env_file = ".env"