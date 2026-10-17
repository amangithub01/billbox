import re

# GSTIN format: 15 characters – 2 digit state code, 10 PAN, 1 entity code, 1 checksum
_GSTIN_REGEX = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$')

def checksum(gstin: str) -> bool:
    """Validate the Mod-36 checksum of a GSTIN.
    The checksum algorithm is the same as that used for PAN.
    Returns True if checksum matches, False otherwise.
    """
    # The last character is the checksum
    char_set = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    factor = 2
    total = 0
    # Exclude the last character
    for char in reversed(gstin[:-1]):
        code_point = char_set.find(char)
        add = factor * code_point
        # Add sum of digits of add (i.e., add // 36 + add % 36)
        total += (add // 36) + (add % 36)
        factor = 1 if factor == 2 else 2
    # Compute checksum character
    checksum_index = (36 - (total % 36)) % 36
    return char_set[checksum_index] == gstin[-1]

def is_valid_gstin(gstin: str) -> bool:
    """Return True if GSTIN matches regex and checksum.
    The input is case‑insensitive; it will be upper‑cased before testing.
    """
    gstin = gstin.strip().upper()
    if not _GSTIN_REGEX.match(gstin):
        return False
    return checksum(gstin)

def format_gstin(gstin: str) -> str:
    """Normalize GSTIN by stripping whitespace and upper‑casing.
    Returns the formatted GSTIN string.
    """
    return gstin.strip().upper()
