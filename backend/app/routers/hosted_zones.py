from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/hosted-zones",
    tags=["Hosted Zones"]
)

@router.get("", response_model=List[schemas.HostedZoneResponse])
def list_hosted_zones(db: Session = Depends(get_db)):
    return db.query(models.HostedZone).all()

@router.post("", response_model=schemas.HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(zone: schemas.HostedZoneCreate, db: Session = Depends(get_db)):
    db_zone = models.HostedZone(
        name=zone.name,
        comment=zone.comment
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.get("/{zone_id}", response_model=schemas.HostedZoneResponse)
def get_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
    return zone

@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted Zone not found")
    db.delete(zone)
    db.commit()
    return None