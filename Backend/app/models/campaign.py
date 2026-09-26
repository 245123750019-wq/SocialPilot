from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Numeric
from app.database.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    campaign_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    campaign_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    budget = Column(Numeric(12, 2), default=0)
    revenue = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime, nullable=True)
    @property
    def roi_percentage(self):
        if not self.budget or self.budget == 0:
            return 0.0

        return float(
            ((self.revenue - self.budget) / self.budget) * 100
        )