from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/hosted-zones",
    tags=["DNS Records"]
)

@router.post("/{zone_id}/records", response_model=schemas.DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_dns_record(zone_id: str, record: schemas.DNSRecordCreate, db: Session = Depends(get_db)):
    # Verify hosted zone exists
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted Zone not found")
    
    new_record = models.DNSRecord(
        hosted_zone_id=zone_id,
        name=record.name,
        type=record.type,
        ttl=record.ttl,
        value=record.value
    )
    db.add(new_record)
    
    # Increment the record count on the hosted zone
    zone.record_count += 1
    
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/{zone_id}/records", response_model=List[schemas.DNSRecordResponse])
def get_dns_records(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted Zone not found")
    
    return db.query(models.DNSRecord).filter(models.DNSRecord.hosted_zone_id == zone_id).all()

@router.delete("/{zone_id}/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dns_record(zone_id: str, record_id: str, db: Session = Depends(get_db)):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted Zone not found")
        
    record = db.query(models.DNSRecord).filter(models.DNSRecord.id == record_id, models.DNSRecord.hosted_zone_id == zone_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DNS Record not found")
        
    db.delete(record)
    
    # Decrement the record count safely
    if zone.record_count > 0:
        zone.record_count -= 1
        
    db.commit()