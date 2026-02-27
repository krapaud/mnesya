from app import create_app, init_app
import os
import logging
from app.api import authentication, user, caregiver, pairing, reminder, reminder_status_api, push_notification
from app.services.scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)

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

# Start background scheduler for push notifications
start_scheduler()

@app.get("/")
async def root():
    return {"message": "Welcome to Mnesya API"}
