from app import create_app, init_app
import os
from app.api.authentication import router as auth_router
from app.api.user import router as user_router

# Initialize database
database_url = os.getenv('DATABASE_URL', 'postgresql://mnesya_user:mnesya_password@localhost:5432/mnesya_db')
init_app(database_url)

# Create FastAPI app
app = create_app()

# Include routers
app.include_router(auth_router)
app.include_router(user_router)

@app.get("/")
async def root():
    return {"message": "Welcome to Mnesya API"}
