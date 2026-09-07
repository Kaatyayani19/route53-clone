from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


def _to_out(zone: models.HostedZone, db: DBSession) -> schemas.HostedZoneOut:
    count = db.query(func.count(models.DNSRecord.id)).filter(
        models.DNSRecord.hosted_zone_id == zone.id
    ).scalar()
    return schemas.HostedZoneOut(
        id=zone.id,
        domain_name=zone.domain_name,
        type=zone.type,
        comment=zone.comment or "",
        created_at=zone.created_at,
        record_count=count or 0,
    )


@router.get("", response_model=List[schemas.HostedZoneOut])
def list_hosted_zones(
    search: Optional[str] = Query(default=None),
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    query = db.query(models.HostedZone)
    if search:
        query = query.filter(models.HostedZone.domain_name.ilike(f"%{search}%"))
    zones = query.order_by(models.HostedZone.created_at.desc()).all()
    return [_to_out(z, db) for z in zones]


@router.post("", response_model=schemas.HostedZoneOut, status_code=201)
def create_hosted_zone(
    payload: schemas.HostedZoneCreate,
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    zone = models.HostedZone(
        domain_name=payload.domain_name.strip().lower(),
        type=payload.type,
        comment=payload.comment,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)

    # Seed default NS + SOA records, mimicking real Route53 behavior
    ns_record = models.DNSRecord(
        hosted_zone_id=zone.id,
        name=zone.domain_name,
        type="NS",
        value="ns-1.awsdns-00.com.\nns-2.awsdns-00.net.\nns-3.awsdns-00.org.\nns-4.awsdns-00.co.uk.",
        ttl=172800,
    )
    soa_record = models.DNSRecord(
        hosted_zone_id=zone.id,
        name=zone.domain_name,
        type="SOA",
        value="ns-1.awsdns-00.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400",
        ttl=900,
    )
    db.add_all([ns_record, soa_record])
    db.commit()
    db.refresh(zone)

    return _to_out(zone, db)


@router.get("/{zone_id}", response_model=schemas.HostedZoneOut)
def get_hosted_zone(
    zone_id: str,
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return _to_out(zone, db)


@router.put("/{zone_id}", response_model=schemas.HostedZoneOut)
def update_hosted_zone(
    zone_id: str,
    payload: schemas.HostedZoneUpdate,
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    if payload.comment is not None:
        zone.comment = payload.comment
    if payload.type is not None:
        zone.type = payload.type

    db.commit()
    db.refresh(zone)
    return _to_out(zone, db)


@router.delete("/{zone_id}", status_code=204)
def delete_hosted_zone(
    zone_id: str,
    db: DBSession = Depends(get_db),
    username: str = Depends(get_current_user),
):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    db.delete(zone)
    db.commit()
    return None
