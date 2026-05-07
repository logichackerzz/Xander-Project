from sqlalchemy import Column, String, Float
from database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(String, primary_key=True)
    symbol = Column(String, nullable=False)
    yf_symbol = Column(String, nullable=False)
    market = Column(String, nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    cost_per_unit = Column(Float, nullable=False)


class WatchlistItem(Base):
    __tablename__ = "watchlist"

    symbol = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    market = Column(String, nullable=False, default="us")
