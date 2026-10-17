from typing import List, Optional, Dict, Any, Union
from datetime import date
from pydantic import BaseModel, Field, field_validator, ValidationInfo

class LineItemSchema(BaseModel):
    description: str
    hsn: Optional[str] = None
    qty: float
    rate: float
    amount: float

    @field_validator('qty', 'rate', 'amount')
    @classmethod
    def non_negative(cls, v: float, info: ValidationInfo):
        if v < 0:
            raise ValueError(f"{info.field_name} must be non-negative")
        return v

class InvoiceSchema(BaseModel):
    id: Optional[Union[int, str]] = None
    status: str = Field("needs_review", description="processing | needs_review | approved | failed")
    stage: str = "ocr"
    vendor_name: str
    vendor_gstin: Optional[str] = None
    invoice_no: str
    date: date
    items: List[LineItemSchema] = []
    subtotal: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total: float
    category: Optional[str] = None
    flags: List[str] = []
    field_confidence: Dict[str, float] = {}
    image_path: Optional[str] = None
    created_at: Optional[date] = None
    source_hash: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str):
        allowed = {"processing", "needs_review", "approved", "failed"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v

    @field_validator('date')
    @classmethod
    def not_future(cls, v: date):
        if v > date.today():
            raise ValueError("invoice date cannot be in the future")
        return v
