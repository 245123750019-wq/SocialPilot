from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import engine, Base
from app.models import User, SocialAccount
from app.routes.auth import router as auth_router
from app.routes.posts import router as posts_router
from app.routes.scheduled_posts import router as scheduled_posts_router
from app.routes.social_accounts import router as social_accounts_router
from app.routes.publishing_queue import router as publishing_queue_router
from app.routes.publishing_logs import router as publishing_logs_router
from app.routes.campaigns import router as campaigns_router
from app.routes.analytics import router as analytics_router
from app.routes import uploads
from app.services.queue_scheduler import start_scheduler, stop_scheduler



# Base.metadata.create_all(bind=engine)

app = FastAPI(title="SocialPilot API")




app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://socialpilot-beta.vercel.app",
        "https://socialpilot-17hzag5jm-245123750019-wq.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(auth_router)
app.include_router(social_accounts_router)
app.include_router(scheduled_posts_router)
app.include_router(posts_router)
app.include_router(publishing_queue_router)
app.include_router(publishing_logs_router)
app.include_router(campaigns_router)
app.include_router(analytics_router)
app.include_router(uploads.router)

@app.on_event("startup")
def startup_event():
    start_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()
@app.get("/")
def home():
    return {"message": "Welcome to SocialPilot API"}


@app.get("/test-db")
def test_database():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"message": "Database connected successfully"}