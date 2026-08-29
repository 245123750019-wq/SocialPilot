from fastapi import FastAPI
from sqlalchemy import text

from app.database.database import engine, Base
from app.models import Role, User, Team, SocialAccount
from app.routes.auth import router as auth_router
from app.routes.social_accounts import router as social_accounts_router
from app.routes.rbac import router as rbac_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SocialPilot API")
app.include_router(auth_router)
app.include_router(rbac_router)
app.include_router(social_accounts_router)


@app.get("/")
def home():
    return {"message": "Welcome to SocialPilot API"}


@app.get("/test-db")
def test_database():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"message": "Database connected successfully"}