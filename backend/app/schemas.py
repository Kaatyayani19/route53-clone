from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str

    class Config:
        from_attributes = True

# --- DNS Record Schemas ---
class DNSRecordCreate(BaseModel):
    name: str
    type: str # e.g. "A", "CNAME", "TXT"
    ttl: Optional[int] = 300
    value: str

class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ttl: Optional[int] = None
    value: Optional[str] = None

class DNSRecordResponse(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    type: str
    ttl: int
    value: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Hosted Zone Schemas ---
class HostedZoneCreate(BaseModel):
    name: str
    comment: Optional[str] = None

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None

class HostedZoneResponse(BaseModel):
    id: str
    name: str
    comment: Optional[str] = None
    record_count: int
    created_at: datetime

    class Config:
        from_attributes = True

HostedZoneOut = HostedZoneResponse