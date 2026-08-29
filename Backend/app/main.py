from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import engine, Base
from app.models import Role, User, Team, SocialAccount
from app.routes.auth import router as auth_router
from app.routes.social_accounts import router as social_accounts_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="SocialPilot API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(social_accounts_router)


@app.get("/")
def home():
    return {"message": "Welcome to SocialPilot API"}


@app.get("/test-db")
def test_database():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"message": "Database connected successfully"}