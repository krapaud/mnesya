from app import create_app, init_app
import os

# Initialize database
database_url = os.getenv('DATABASE_URL', 'postgresql://mnesya_user:mnesya_password@localhost:5432/mnesya_db')
init_app(database_url)

# Create FastAPI app
app = create_app()

@app.get("/")
async def root():
    return {"message": "Welcome to Mnesya API"}
