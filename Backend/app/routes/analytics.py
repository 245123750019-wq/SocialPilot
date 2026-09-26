from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import SessionLocal
from app.models import (
    Post,
    PostAnalytics,
    Campaign,
    AudienceAnalytics,
    AudienceInsight,
    SocialAccount
)
from app.schemas.analytics import (
    PostAnalyticsCreate,
    PostAnalyticsResponse,
)
from app.schemas.audience_analytics import (
    AudienceAnalyticsCreate,
    AudienceAnalyticsResponse,
    AudienceInsightCreate,
    AudienceInsightResponse,
)
from app.core.security import get_current_user_id


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/posts/{post_id}",
    response_model=PostAnalyticsResponse
)
def create_post_analytics(
    post_id: int,
    analytics_data: PostAnalyticsCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    post = (
    db.query(Post)
    .filter(Post.post_id == post_id)
    .first()
    )

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found."
        )

    # Verify that the post belongs to a social account
    # owned by the current user.
    from app.models import SocialAccount

    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == post.account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this post."
        )

    total_engagements = (
        analytics_data.likes
        + analytics_data.comments
        + analytics_data.shares
    )

    if analytics_data.reach > 0:
        engagement_rate = (
            total_engagements / analytics_data.reach
        ) * 100
    else:
        engagement_rate = 0.0

    analytics = PostAnalytics(
        post_id=post_id,
        likes=analytics_data.likes,
        comments=analytics_data.comments,
        shares=analytics_data.shares,
        reach=analytics_data.reach,
        impressions=analytics_data.impressions,
        clicks=analytics_data.clicks,
        engagement_rate=engagement_rate,
    )

    db.add(analytics)
    db.commit()
    db.refresh(analytics)

    return analytics


@router.get(
    "/posts/{post_id}",
    response_model=PostAnalyticsResponse
)
def get_post_analytics(
    post_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    from app.models import SocialAccount

    post = db.query(Post).filter(
        Post.post_id == post_id
    ).first()

    if not post:
        raise HTTPException(
            status_code=404,
            detail="Post not found."
        )

    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == post.account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this post."
        )

    analytics = (
        db.query(PostAnalytics)
        .filter(
            PostAnalytics.post_id == post_id
        )
        .order_by(
            PostAnalytics.recorded_at.desc()
        )
        .first()
    )

    if not analytics:
        raise HTTPException(
            status_code=404,
            detail="Analytics not found for this post."
        )

    return analytics
@router.get("/campaigns/{campaign_id}")
def get_campaign_analytics(
    campaign_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Check campaign ownership
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
            detail="Campaign not found or does not belong to the current user."
        )

    # Get all posts belonging to the campaign
    posts = (
        db.query(Post)
        .filter(Post.campaign_id == campaign_id)
        .all()
    )

    post_ids = [post.post_id for post in posts]

    if not post_ids:
        return {
            "campaign_id": campaign_id,
            "campaign_name": campaign.campaign_name,
            "total_posts": 0,
            "total_likes": 0,
            "total_comments": 0,
            "total_shares": 0,
            "total_reach": 0,
            "total_impressions": 0,
            "total_clicks": 0,
            "average_engagement_rate": 0.0
        }

    analytics_records = (
        db.query(PostAnalytics)
        .filter(PostAnalytics.post_id.in_(post_ids))
        .all()
    )

    total_likes = sum(item.likes for item in analytics_records)
    total_comments = sum(item.comments for item in analytics_records)
    total_shares = sum(item.shares for item in analytics_records)
    total_reach = sum(item.reach for item in analytics_records)
    total_impressions = sum(item.impressions for item in analytics_records)
    total_clicks = sum(item.clicks for item in analytics_records)

    if analytics_records:
        average_engagement_rate = (
            sum(item.engagement_rate for item in analytics_records)
            / len(analytics_records)
        )
    else:
        average_engagement_rate = 0.0

    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign.campaign_name,
        "total_posts": len(post_ids),
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_shares": total_shares,
        "total_reach": total_reach,
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "average_engagement_rate": round(
            average_engagement_rate,
            2
        )
    }
@router.post(
    "/audience/{account_id}",
    response_model=AudienceAnalyticsResponse
)
def create_audience_analytics(
    account_id: int,
    analytics_data: AudienceAnalyticsCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    from app.models import SocialAccount

    # Check that the social account belongs to the current user
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Social account not found or does not belong to the current user."
        )

    analytics = AudienceAnalytics(
        account_id=account_id,
        followers_count=data.followers_count,
        follower_growth=data.follower_growth,
        recorded_at=datetime.utcnow(),
    )

    db.add(analytics)
    db.commit()
    db.refresh(analytics)

    return analytics


@router.get("/audience/{account_id}", response_model=list[AudienceAnalyticsResponse])
def get_audience_analytics(
    account_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    from app.models import SocialAccount

    # Check account ownership
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Social account not found or does not belong to the current user."
        )

    analytics = (
        db.query(AudienceAnalytics)
        .filter(AudienceAnalytics.account_id == account_id)
        .order_by(AudienceAnalytics.recorded_at.asc())
        .all()
    )

    if not analytics:
        raise HTTPException(
            status_code=404,
            detail="Audience analytics not found for this account."
        )

    return analytics
@router.post(
    "/audience-insights/{account_id}",
    response_model=AudienceInsightResponse
)
def create_audience_insight(
    account_id: int,
    insight_data: AudienceInsightCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Social account not found"
        )

    insight = AudienceInsight(
        account_id=account_id,
        age_group=insight_data.age_group,
        gender=insight_data.gender,
        location=insight_data.location,
        active_time=insight_data.active_time,
        audience_count=insight_data.audience_count,
        recorded_at=datetime.utcnow()
    )

    db.add(insight)
    db.commit()
    db.refresh(insight)

    return insight


@router.get(
    "/audience-insights/{account_id}",
    response_model=list[AudienceInsightResponse]
)
def get_audience_insights(
    account_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == account_id,
            SocialAccount.user_id == user_id
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Social account not found"
        )

    insights = (
        db.query(AudienceInsight)
        .filter(AudienceInsight.account_id == account_id)
        .order_by(AudienceInsight.recorded_at.asc())
        .all()
    )

    return insights