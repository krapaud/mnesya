"""Main application entry point.

This module initializes the FastAPI application, configures the database,
and registers all API routers. This is the entry point for the Mnesya backend.
"""

from app import create_app, init_app
import os
from app.api import authentication, user, caregiver, pairing, reminder, reminder_status_api, push_notification

# Initialize database
database_url = os.environ["DATABASE_URL"]
init_app(database_url)

# Create FastAPI app
app = create_app()

# Include routers
app.include_router(authentication.router)
app.include_router(user.router)
app.include_router(caregiver.router)
app.include_router(pairing.router)
app.include_router(reminder.router)
app.include_router(reminder_status_api.router)
app.include_router(push_notification.router)

@app.get("/")
async def root():
    """Root endpoint.
    
    Returns:
        dict: Welcome message
    """
    return {"message": "Welcome to Mnesya API"}
