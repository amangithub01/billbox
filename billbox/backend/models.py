from typing import Optional, List
from datetime import date
from sqlmodel import SQLModel, Field, Relationship

class LineItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: Optional[int] = Field(default=None, foreign_key="invoice.id")
    description: str
    hsn: Optional[str] = None
    qty: float
    rate: float
    amount: float

class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    status: str = Field(index=True)  # processing | needs_review | approved | failed
    stage: str
    vendor_name: str
    vendor_gstin: Optional[str] = None
    invoice_no: str
    date: date
    subtotal: float
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total: float
    category: Optional[str] = None
    image_path: str
    created_at: Optional[date] = None
    source_hash: str
    # Relationships
    items: List[LineItem] = Relationship(back_populates="invoice")

LineItem.invoice = Relationship(back_populates="items")

class Correction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    vendor_key: str
    field: str
    wrong_value: str
    right_value: str
    count: int = Field(default=1)
