from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, index=True, nullable=False)
    comment = Column(String, nullable=True)
    record_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship to automatically delete records if the zone is deleted
    records = relationship("DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan")

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "www.example.com"
    type = Column(String, nullable=False)  # e.g., "A", "CNAME", "TXT"
    ttl = Column(Integer, default=300)     # Time to live
    value = Column(String, nullable=False) # Record value/ip/target
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
    
# Yeh code file ke sabse end mein add karein

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary key=True, index=True)
    token = Column(String, unique=True, index=True)
    username = Column(String)