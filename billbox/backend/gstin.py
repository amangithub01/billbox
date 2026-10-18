import re

# Official Indian GSTIN format specification:
# - 2 digits: State Code (01-38, 97, 99)
# - 10 characters: Permanent Account Number (PAN) [A-Z]{5}[0-9]{4}[A-Z]{1}
# - 1 character: Entity number of the same PAN holder in a state [1-9A-Z]
# - 1 character: Default letter 'Z' (or 'C' for certain authorities)
# - 1 character: Checksum digit [0-9A-Z]
_GSTIN_REGEX = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z|C]{1}[0-9A-Z]{1}$', re.IGNORECASE)

# Valid Indian State / Union Territory codes under GST
VALID_STATE_CODES = {
    f"{i:02d}" for i in range(1, 39)
}.union({"97", "99"})

def is_valid_gstin(gstin: str) -> bool:
    """Return True if GSTIN conforms to the Indian GST format and has a valid state code.
    Accepts uppercase or lowercase, and trims any extra whitespace.
    """
    if not gstin or not isinstance(gstin, str):
        return False
    clean = gstin.strip().upper()
    if len(clean) != 15:
        return False
    if not _GSTIN_REGEX.match(clean):
        return False
    state_code = clean[:2]
    return state_code in VALID_STATE_CODES

def format_gstin(gstin: str) -> str:
    """Normalize GSTIN by stripping whitespace and upper‑casing."""
    if not gstin:
        return ""
    return str(gstin).strip().upper()
