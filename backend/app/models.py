import uuid
import random
import string
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


def gen_zone_id():
    # Mimic AWS style hosted zone ids, e.g. Z1PA6795UKMFR9
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=13))


def gen_record_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # plaintext - mock auth only


class Session(Base):
    __tablename__ = "sessions"

    token = Column(String, primary_key=True, index=True)
    username = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=gen_zone_id)
    domain_name = Column(String, nullable=False, index=True)
    type = Column(String, default="Public")  # Public | Private
    comment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    records = relationship(
        "DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan"
    )


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=gen_record_id)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    value = Column(Text, nullable=False)
    ttl = Column(Integer, default=300)
    created_at = Column(DateTime, default=datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
