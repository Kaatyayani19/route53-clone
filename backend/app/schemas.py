from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ---------- Auth ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    username: str


# ---------- Hosted Zones ----------
class HostedZoneCreate(BaseModel):
    domain_name: str = Field(..., min_length=1)
    type: str = "Public"
    comment: str = ""


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None
    type: Optional[str] = None


class HostedZoneOut(BaseModel):
    id: str
    domain_name: str
    type: str
    comment: str
    created_at: datetime
    record_count: int = 0

    class Config:
        from_attributes = True


# ---------- DNS Records ----------
VALID_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"]


class DNSRecordCreate(BaseModel):
    name: str = Field(..., min_length=1)
    type: str
    value: str = Field(..., min_length=1)
    ttl: int = 300


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    value: Optional[str] = None
    ttl: Optional[int] = None


class DNSRecordOut(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    type: str
    value: str
    ttl: int
    created_at: datetime

    class Config:
        from_attributes = True
