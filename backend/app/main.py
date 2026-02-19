from app import create_app, init_app
import os
from app.api import authentication, user, caregiver, pairing, reminder

# Initialize database
database_url = os.getenv('DATABASE_URL', 'postgresql://mnesya_user:mnesya_password@localhost:5432/mnesya_db')
init_app(database_url)

# Create FastAPI app
app = create_app()

# Include routers
app.include_router(authentication.router)
app.include_router(user.router)
app.include_router(caregiver.router)
app.include_router(pairing.router)
app.include_router(reminder.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Mnesya API"}
