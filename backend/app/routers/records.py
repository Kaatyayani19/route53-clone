from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.schemas import VALID_RECORD_TYPES

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["records"])


def _get_zone_or_404(zone_id: str, db: DBSession) -> models.HostedZone:
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.get("", response_model=List[schemas.DNSRecordOut])
def list_records(
    zone_id: str,
    search: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None),
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, db)
    query = db.query(models.DNSRecord).filter(models.DNSRecord.hosted_zone_id == zone_id)
    if search:
        query = query.filter(models.DNSRecord.name.ilike(f"%{search}%"))
    if type:
        query = query.filter(models.DNSRecord.type == type)
    return query.order_by(models.DNSRecord.created_at.asc()).all()


@router.post("", response_model=schemas.DNSRecordOut, status_code=201)
def create_record(
    zone_id: str,
    payload: schemas.DNSRecordCreate,
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, db)
    if payload.type not in VALID_RECORD_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid record type. Must be one of {VALID_RECORD_TYPES}")

    record = models.DNSRecord(
        hosted_zone_id=zone_id,
        name=payload.name.strip(),
        type=payload.type,
        value=payload.value.strip(),
        ttl=payload.ttl,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=schemas.DNSRecordOut)
def update_record(
    zone_id: str,
    record_id: str,
    payload: schemas.DNSRecordUpdate,
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, db)
    record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.hosted_zone_id == zone_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if payload.name is not None:
        record.name = payload.name.strip()
    if payload.type is not None:
        if payload.type not in VALID_RECORD_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid record type. Must be one of {VALID_RECORD_TYPES}")
        record.type = payload.type
    if payload.value is not None:
        record.value = payload.value.strip()
    if payload.ttl is not None:
        record.ttl = payload.ttl

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(
    zone_id: str,
    record_id: str,
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, db)
    record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.hosted_zone_id == zone_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return None
