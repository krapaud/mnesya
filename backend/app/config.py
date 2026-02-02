import os
import psycopg2

class config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'secret-key-mnesya')
    DEBUG=False

conn = psycopg2.connect(database = "datacamp_courses", 
                        user = "mnesya_user", 
                        host= 'localhost',
                        password = "mnesya_password",
                        port = 5432)

class Config:
    env_file = ".env"