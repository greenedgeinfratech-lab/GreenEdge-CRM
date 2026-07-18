import re
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

# GSTIN Format: 2 digits (State Code) + 10 digits (PAN) + 1 digit (Entity Number) + Z + 1 alphanumeric character
GSTIN_REGEX = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
validate_gstin = RegexValidator(
    regex=GSTIN_REGEX,
    message='Enter a valid GSTIN format (e.g., 22AAAAA0000A1Z5)',
    code='invalid_gstin'
)

# PAN Format: 5 Letters + 4 Numbers + 1 Letter
PAN_REGEX = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
validate_pan = RegexValidator(
    regex=PAN_REGEX,
    message='Enter a valid PAN format (e.g., ABCDE1234F)',
    code='invalid_pan'
)

# CIN Format: L/U + 5 Digits + State Code (2 Letters) + Year (4 Digits) + PLC/PTC/etc (3 Letters) + 6 Digits
CIN_REGEX = r'^([LU]{1})([0-9]{5})([A-Z]{2})([0-9]{4})([A-Z]{3})([0-9]{6})$'
validate_cin = RegexValidator(
    regex=CIN_REGEX,
    message='Enter a valid Corporate Identity Number (CIN)',
    code='invalid_cin'
)

# Mobile Number Format: 10 Digits starting with 6-9 (Indian standard)
MOBILE_REGEX = r'^[6-9]\d{9}$'
validate_mobile = RegexValidator(
    regex=MOBILE_REGEX,
    message='Enter a valid 10-digit mobile number starting with 6-9',
    code='invalid_mobile'
)

# PIN Code Format: 6 Digits
PINCODE_REGEX = r'^[1-9][0-9]{5}$'
validate_pincode = RegexValidator(
    regex=PINCODE_REGEX,
    message='Enter a valid 6-digit PIN code',
    code='invalid_pincode'
)

def validate_gst_matches_pan(gstin, pan):
    """
    Validates if the provided GSTIN belongs to the provided PAN.
    The PAN is embedded in characters 3 to 12 (0-indexed 2 to 11) of the GSTIN.
    """
    if gstin and pan:
        embedded_pan = gstin[2:12]
        if embedded_pan != pan:
            raise ValidationError("The PAN embedded in the GSTIN does not match the provided PAN.")
