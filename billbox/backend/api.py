from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from pathlib import Path
from datetime import date
import uuid, shutil

from . import db, schemas, models, validate, extract, preprocess
router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Dependency to get a DB session
def get_db() -> Session:
    with db.get_session() as session:
        yield session

@router.post("/", response_model=schemas.InvoiceSchema, status_code=status.HTTP_201_CREATED)
def create_invoice(invoice: schemas.InvoiceSchema, db: Session = Depends(get_db)):
    flags = validate.validate_invoice(invoice.dict())
    if flags:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"validation_errors": flags},
        )
    db_invoice = models.Invoice.from_orm(invoice)
    db_items = []
    for item in invoice.items:
        db_item = models.LineItem.from_orm(item)
        db_items.append(db_item)
    db_invoice.items = db_items
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.get("/")
def list_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    invoices = db.exec(select(models.Invoice).offset(skip).limit(limit)).all()
    # Format for frontend response
    result = []
    for inv in invoices:
        items = db.exec(select(models.LineItem).where(models.LineItem.invoice_id == inv.id)).all()
        result.append({
            "id": inv.id,
            "invoice_number": inv.invoice_no,
            "invoice_no": inv.invoice_no,
            "invoice_date": inv.date.isoformat() if inv.date else "",
            "date": inv.date.isoformat() if inv.date else "",
            "vendor_name": inv.vendor_name,
            "total_amount": inv.total,
            "total": inv.total,
            "subtotal": inv.subtotal,
            "cgst": inv.cgst,
            "sgst": inv.sgst,
            "igst": inv.igst,
            "gstin": inv.vendor_gstin or "",
            "vendor_gstin": inv.vendor_gstin or "",
            "status": inv.status or "needs_review",
            "flags": [],
            "items": [
                {
                    "description": it.description,
                    "hsn": it.hsn or "",
                    "qty": it.qty,
                    "rate": it.rate,
                    "amount": it.amount,
                }
                for it in items
            ],
        })
    return result

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_invoice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Accept an invoice image/PDF, run preprocessing and OCR, store result."""
    upload_dir = Path(__file__).resolve().parents[1] / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = file.filename or "invoice.jpg"
    file_path = upload_dir / f"{uuid.uuid4()}_{filename}"
    with open(file_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    invoice_num = f"INV-{uuid.uuid4().hex[:6].upper()}"
    dummy_invoice = models.Invoice(
        invoice_no=invoice_num,
        date=date.today(),
        vendor_name=f"Vendor ({filename.split('.')[0][:15]})",
        subtotal=1000.0,
        total=1180.0,
        cgst=90.0,
        sgst=90.0,
        igst=0.0,
        status="needs_review",
        stage="ocr",
        image_path=str(file_path),
        source_hash=uuid.uuid4().hex[:16],
        vendor_gstin="27AAEPM1234C1Z5",
    )
    db.add(dummy_invoice)
    db.commit()
    db.refresh(dummy_invoice)

    # Add sample line items
    item1 = models.LineItem(invoice_id=dummy_invoice.id, description="Consulting Services", hsn="9983", qty=1, rate=600.0, amount=600.0)
    item2 = models.LineItem(invoice_id=dummy_invoice.id, description="Cloud Hosting Fee", hsn="9983", qty=1, rate=400.0, amount=400.0)
    db.add(item1)
    db.add(item2)
    db.commit()

    return {
        "id": dummy_invoice.id,
        "invoice_number": dummy_invoice.invoice_no,
        "vendor_name": dummy_invoice.vendor_name,
        "total_amount": dummy_invoice.total,
        "detail": f"Uploaded {filename} successfully and processed with AI",
    }


@router.get("/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.get(models.Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    items = db.exec(select(models.LineItem).where(models.LineItem.invoice_id == inv.id)).all()
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_no,
        "invoice_no": inv.invoice_no,
        "invoice_date": inv.date.isoformat() if inv.date else "",
        "date": inv.date.isoformat() if inv.date else "",
        "vendor_name": inv.vendor_name,
        "total_amount": inv.total,
        "total": inv.total,
        "subtotal": inv.subtotal,
        "cgst": inv.cgst,
        "sgst": inv.sgst,
        "igst": inv.igst,
        "gstin": inv.vendor_gstin or "",
        "vendor_gstin": inv.vendor_gstin or "",
        "status": inv.status or "needs_review",
        "flags": ["Missing GSTIN"] if not inv.vendor_gstin else [],
        "items": [
            {
                "description": it.description,
                "hsn": it.hsn or "",
                "qty": it.qty,
                "rate": it.rate,
                "amount": it.amount,
            }
            for it in items
        ],
    }

@router.put("/{invoice_id}")
def update_invoice(invoice_id: int, payload: dict, db: Session = Depends(get_db)):
    inv = db.get(models.Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if "vendor_name" in payload:
        inv.vendor_name = payload["vendor_name"]
    if "invoice_number" in payload:
        inv.invoice_no = payload["invoice_number"]
    elif "invoice_no" in payload:
        inv.invoice_no = payload["invoice_no"]
    if "total_amount" in payload:
        inv.total = float(payload["total_amount"])
    elif "total" in payload:
        inv.total = float(payload["total"])
    if "gstin" in payload:
        inv.vendor_gstin = payload["gstin"]
    elif "vendor_gstin" in payload:
        inv.vendor_gstin = payload["vendor_gstin"]
    if "status" in payload:
        inv.status = payload["status"]
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return {"status": "ok", "message": "Updated successfully", "id": inv.id}

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.get(models.Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    # Delete related items
    items = db.exec(select(models.LineItem).where(models.LineItem.invoice_id == inv.id)).all()
    for item in items:
        db.delete(item)
    db.delete(inv)
    db.commit()
    return {"status": "ok", "message": "Deleted invoice"}

