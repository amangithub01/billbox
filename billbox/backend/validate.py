import re
from datetime import date, datetime, timedelta
from typing import List, Dict
from .gstin import is_valid_gstin

# Tolerance for monetary comparisons (Rs)
_TOLERANCE = 1.0

def float_eq(a: float, b: float, tol: float = _TOLERANCE) -> bool:
    return abs(a - b) <= tol

def validate_invoice(invoice: dict) -> List[str]:
    """Validate an invoice dict against business rules.
    Returns a list of human‑readable flag messages (empty if no issues).
    """
    flags: List[str] = []
    # GSTIN validation
    gstin = invoice.get("vendor_gstin")
    if gstin:
        if not is_valid_gstin(gstin):
            flags.append("Invalid GSTIN format or checksum")
    else:
        flags.append("Missing Vendor GSTIN")
    # Date validation
    inv_date_str = invoice.get("date")
    if inv_date_str:
        try:
            inv_date = datetime.strptime(inv_date_str, "%Y-%m-%d").date()
            today = date.today()
            if inv_date > today:
                flags.append("Invoice date is in the future")
            if inv_date < today - timedelta(days=3*365):
                flags.append("Invoice date older than 3 years")
        except Exception:
            flags.append("Date format invalid (expected YYYY‑MM‑DD)")
    # Subtotal vs line items
    items = invoice.get("items", [])
    if items:
        sum_items = sum(item.get("amount", 0) for item in items)
        if not float_eq(sum_items, invoice.get("subtotal", 0)):
            flags.append(f"Subtotal mismatch (items sum {sum_items:.2f} vs subtotal {invoice.get('subtotal',0):.2f})")
        # Qty * rate vs amount per line
        for idx, item in enumerate(items, start=1):
            qty = item.get("qty", 0)
            rate = item.get("rate", 0)
            amt = item.get("amount", 0)
            if not float_eq(qty * rate, amt):
                flags.append(f"Line {idx} amount mismatch (qty*rate={qty*rate:.2f} vs amount={amt:.2f})")
    # Total vs components
    total = invoice.get("total", 0)
    calc_total = (invoice.get("subtotal", 0) + invoice.get("cgst", 0) +
                  invoice.get("sgst", 0) + invoice.get("igst", 0))
    if not float_eq(total, calc_total):
        flags.append(f"Total mismatch (components sum {calc_total:.2f} vs total {total:.2f})")
    # GST vs CGST/SGST/IGST consistency (simplified rule)
    if gstin:
        # If IGST is non‑zero, CGST and SGST should be zero and vice versa
        if invoice.get("igst", 0) > 0 and (invoice.get("cgst", 0) > 0 or invoice.get("sgst", 0) > 0):
            flags.append("IGST present together with CGST/SGST")
        if (invoice.get("cgst", 0) > 0 or invoice.get("sgst", 0) > 0) and invoice.get("igst", 0) > 0:
            flags.append("CGST/SGST present together with IGST")
    # Duplicate detection (by vendor+invoice_no+total or source_hash)
    # Duplicate check will be performed at DB level; placeholder flag
    # (actual duplicate detection logic resides in DB layer)
    return flags
