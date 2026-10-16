from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.publishing_log import PublishingLog
from app.services.social_analytics_service import (
    fetch_instagram_metrics,
    fetch_facebook_metrics,
    fetch_instagram_follower_count,
    fetch_facebook_follower_count,
    fetch_youtube_subscriber_count,
)


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


    # Use only the latest analytics snapshot for each post.
    latest_records = []

    for post_id in post_ids:
        latest = (
            db.query(PostAnalytics)
            .filter(PostAnalytics.post_id == post_id)
            .order_by(
                PostAnalytics.recorded_at.desc().nullslast(),
                PostAnalytics.analytics_id.desc(),
            )
            .first()
        )

        if latest:
            latest_records.append(latest)

    total_likes = sum(item.likes or 0 for item in latest_records)
    total_comments = sum(item.comments or 0 for item in latest_records)
    total_shares = sum(item.shares or 0 for item in latest_records)
    total_reach = sum(item.reach or 0 for item in latest_records)
    total_impressions = sum(item.impressions or 0 for item in latest_records)
    total_clicks = sum(item.clicks or 0 for item in latest_records)

    if latest_records:
        average_engagement_rate = (
            sum(item.engagement_rate or 0.0 for item in latest_records)
            / len(latest_records)
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



@router.post("/audience/{account_id}/refresh")
def refresh_audience_analytics(
    account_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.account_id == account_id,
            SocialAccount.user_id == user_id,
        )
        .first()
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Social account not found.",
        )

    platform = account.platform.strip().lower()

    if platform not in ("instagram", "facebook", "youtube"):
        raise HTTPException(
            status_code=400,
            detail="Audience refresh currently supports Instagram, Facebook, and YouTube only.",
        )

    if not account.access_token:
        raise HTTPException(
            status_code=400,
            detail="Social account has no saved access token.",
        )

    platform_account_id = account.platform_account_id
    if not platform_account_id:
        raise HTTPException(
            status_code=400,
            detail="Platform account ID is not saved for this account.",
        )


    try:
        if platform == "instagram":
            followers_count = fetch_instagram_follower_count(
                platform_account_id,
                account.access_token,
            )
        elif platform == "facebook":
            followers_count = fetch_facebook_follower_count(
                platform_account_id,
                account.access_token,
            )
        else:
            followers_count = fetch_youtube_subscriber_count(
                platform_account_id,
                account.access_token,
                account.refresh_token,
            )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail=f"Could not retrieve audience count from {account.platform}.",
        )


    previous = (
        db.query(AudienceAnalytics)
        .filter(AudienceAnalytics.account_id == account_id)
        .order_by(AudienceAnalytics.recorded_at.desc())
        .first()
    )

    if previous and previous.followers_count == followers_count:
        return {
            "account_id": account_id,
            "followers_count": followers_count,
            "follower_growth": 0,
            "recorded_at": previous.recorded_at,
            "message": "Follower count unchanged; no duplicate snapshot saved.",
        }

    growth = (
        followers_count - previous.followers_count
        if previous
        else 0
    )

    snapshot = AudienceAnalytics(
        account_id=account_id,
        followers_count=followers_count,
        follower_growth=growth,
        recorded_at=datetime.utcnow(),
    )

    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return {
        "account_id": account_id,
        "followers_count": followers_count,
        "follower_growth": growth,
        "recorded_at": snapshot.recorded_at,
        "message": f"Real {account.platform} audience snapshot saved.",
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

@router.get("/published-posts")
def get_published_post_metrics(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Fetch current engagement metrics for the user's real published posts."""

    results = (
        db.query(PublishingLog, Post, SocialAccount)
        .join(Post, PublishingLog.post_id == Post.post_id)
        .join(SocialAccount, Post.account_id == SocialAccount.account_id)
        .filter(
            SocialAccount.user_id == user_id,
            PublishingLog.status == "published",
            PublishingLog.external_post_id.isnot(None),
            Post.status == "published",
        )
        .order_by(PublishingLog.published_at.desc().nullslast())
        .all()
    )

    response = []

    for log, post, account in results:
        metrics = {
            "likes": None,
            "comments": None,
            "shares": None,
            "reach": None,
            "saved": None,
            "error": None,
        }

        try:
            if not account.access_token:
                raise ValueError("No access token is saved for this account.")

            platform = (account.platform or "").lower()

            if platform == "instagram":
                metrics.update(
                    fetch_instagram_metrics(
                        log.external_post_id,
                        account.access_token,
                    )
                )
            elif platform == "facebook":
                metrics.update(
                    fetch_facebook_metrics(
                        log.external_post_id,
                        account.access_token,
                    )
                )
            else:
                raise ValueError(
                    f"Metrics are not supported for {account.platform} yet."
                )

        except Exception as exc:
            # Keep the post visible even if its metrics cannot be fetched.
            metrics["error"] = str(exc)

        response.append(
            {
                "post_id": post.post_id,
                "log_id": log.log_id,
                "platform": account.platform,
                "username": account.username,
                "content": post.content or "",
                "media_url": post.media_url,
                "external_post_id": log.external_post_id,
                "published_at": (
                    log.published_at.isoformat()
                    if log.published_at
                    else None
                ),
                "metrics": metrics,
            }
        )

    return response
