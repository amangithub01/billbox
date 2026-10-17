import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from .gstin import format_gstin

# Regular expressions for date and number normalization
_DATE_REGEX = re.compile(r"^(\d{2})[\-/](\d{2})[\-/](\d{2,4})$")
_NUMBER_REGEX = re.compile(r"[^0-9.,-]")

def _parse_date(value: str) -> Optional[str]:
    """Convert various Indian date formats to ISO YYYY-MM-DD.
    Accepts DD-MM-YYYY, DD/MM/YYYY, DD-MM-YY, DD/MM/YY.
    Returns ISO string or None if parsing fails.
    """
    m = _DATE_REGEX.match(value.strip())
    if not m:
        return None
    day, month, year = m.groups()
    year = int(year)
    if year < 100:
        # assume 2000s for two‑digit years less than 50, else 1900s
        year += 2000 if year < 50 else 1900
    try:
        dt = datetime(year=int(year), month=int(month), day=int(day))
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None

def _parse_number(value: str) -> Optional[float]:
    """Normalize numbers like "1,031.00" or "Rs. 1031" to float.
    Removes commas, currency symbols, and extracts numeric part.
    """
    # Strip whitespace and known prefixes/suffixes
    cleaned = value.strip()
    # Remove any non‑numeric characters except dot, minus, comma
    cleaned = _NUMBER_REGEX.sub("", cleaned)
    # Remove commas used as thousand separators
    cleaned = cleaned.replace(",", "")
    try:
        return float(cleaned)
    except Exception:
        return None

def normalize(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize fields in the raw extraction dict.
    - Trim whitespace on all string fields
    - Upper‑case GSTIN and format it
    - Convert dates to ISO format
    - Convert numeric strings to float
    Fields that cannot be parsed are left as‑is.
    """
    normalized: Dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, str):
            val = value.strip()
            if key == "vendor_gstin":
                normalized[key] = format_gstin(val)
            elif "date" in key.lower():
                iso = _parse_date(val)
                normalized[key] = iso if iso else val
            elif isinstance(val, str) and (any(c.isdigit() for c in val) or any(c in val for c in ".,-")):
                num = _parse_number(val)
                normalized[key] = num if num is not None else val
            else:
                normalized[key] = val
        elif isinstance(value, list):
            # Assume list of dicts for line items
            normalized[key] = [normalize(item) if isinstance(item, dict) else item for item in value]
        else:
            normalized[key] = value
    return normalized
