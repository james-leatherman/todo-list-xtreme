from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.auth import router as auth_router
from app.todos import router as todos_router
from app import models

app = FastAPI(
    title="Todo List Xtreme API",
    description="A to-do list API with photo upload support",
    version="0.1.0",
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(todos_router, prefix="/todos", tags=["todos"])

# Mount static files directory for serving uploaded photos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    return {"message": "Welcome to Todo List Xtreme API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    # Try to query something simple to test database connection
    try:
        # Just count users
        user_count = db.query(models.User).count()
        return {"status": "connected", "user_count": user_count}
    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
