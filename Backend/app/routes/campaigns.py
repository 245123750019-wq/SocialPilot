from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.post import Post
from app.models.campaign import Campaign
from app.models.social_account import SocialAccount
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
)
from app.core.security import get_current_user_id


router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[CampaignResponse])
def get_campaigns(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaigns = (
        db.query(Campaign)
        .filter(Campaign.user_id == user_id)
        .order_by(Campaign.campaign_id.desc())
        .all()
    )

    return campaigns

@router.get("/{campaign_id}/report")
def get_campaign_report(
    campaign_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == user_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    posts = (
        db.query(Post)
        .filter(
            Post.campaign_id == campaign_id
        )
        .all()
    )

    total_posts = len(posts)

    status_breakdown = {
        "scheduled": 0,
        "published": 0,
        "failed": 0,
        "cancelled": 0
    }

    platform_breakdown = {}

    for post in posts:

        if post.status in status_breakdown:
            status_breakdown[post.status] += 1

        if post.account_id:
            account = (
                db.query(SocialAccount)
                .filter(
                    SocialAccount.account_id == post.account_id
                )
                .first()
            )

            if account:
                platform = account.platform
                platform_breakdown[platform] = (
                    platform_breakdown.get(platform, 0) + 1
                )

    return {
        "campaign_id": campaign.campaign_id,
        "campaign_name": campaign.campaign_name,
        "status": campaign.status,
        "start_date": campaign.start_date,
        "end_date": campaign.end_date,
        "total_posts": total_posts,
        "status_breakdown": status_breakdown,
        "platform_breakdown": platform_breakdown
    }
@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == user_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    return campaign
@router.get("/{campaign_id}/summary")
def get_campaign_summary(
    campaign_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == user_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    posts = (
        db.query(Post)
        .filter(
            Post.campaign_id == campaign_id
        )
        .all()
    )

    total_posts = len(posts)

    scheduled_posts = sum(
        1 for post in posts
        if post.status == "scheduled"
    )

    published_posts = sum(
        1 for post in posts
        if post.status == "published"
    )

    failed_posts = sum(
        1 for post in posts
        if post.status == "failed"
    )

    cancelled_posts = sum(
        1 for post in posts
        if post.status == "cancelled"
    )

    return {
        "campaign_id": campaign.campaign_id,
        "campaign_name": campaign.campaign_name,
        "status": campaign.status,
        "start_date": campaign.start_date,
        "end_date": campaign.end_date,
        "total_posts": total_posts,
        "scheduled_posts": scheduled_posts,
        "published_posts": published_posts,
        "failed_posts": failed_posts,
        "cancelled_posts": cancelled_posts
    }

@router.get("/{campaign_id}/posts")
def get_campaign_posts(
    campaign_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == user_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    posts = (
        db.query(Post)
        .filter(
            Post.campaign_id == campaign_id
        )
        .order_by(Post.post_id.desc())
        .all()
    )

    return posts
@router.post("/", response_model=CampaignResponse)
def create_campaign(
    campaign_data: CampaignCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaign = Campaign(
        user_id=user_id,
        campaign_name=campaign_data.campaign_name,
        description=campaign_data.description,
        status=campaign_data.status,
        start_date=campaign_data.start_date,
        end_date=campaign_data.end_date,
        budget=campaign_data.budget,
        revenue=campaign_data.revenue,
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return campaign


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    campaign_data: CampaignUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == user_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    update_data = campaign_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)

    return campaign


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.campaign_id == campaign_id,
            Campaign.user_id == user_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    db.delete(campaign)
    db.commit()

    return {
        "message": "Campaign deleted successfully"
    }