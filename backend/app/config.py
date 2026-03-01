"""Configuration module.

This module defines application configuration settings and provides
utility functions for accessing environment variables.
"""

import os
import psycopg2


class config:
    """Configuration class for application settings.
    
    Attributes:
        SECRET_KEY (str): Secret key for JWT token encoding/decoding
        DEBUG (bool): Debug mode flag
    """
    SECRET_KEY = os.environ["SECRET_KEY"]
    DEBUG = False


def get_database_url():
    """Get the database URL from environment variables.
    
    Returns:
        str: Database connection URL
    """
    return os.environ["DATABASE_URL"]


class Config:
    """Configuration class for environment settings.
    
    Attributes:
        env_file (str): Path to environment file
    """
    env_file = ".env"
