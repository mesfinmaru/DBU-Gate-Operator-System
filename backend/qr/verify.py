import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from flask import current_app
from backend.models.asset import Asset

def generate_qr_signature(asset):
    timestamp = int(datetime.utcnow().timestamp())
    nonce = secrets.token_hex(8)
    message = f"{asset.asset_id}|{asset.owner_student_id}|{asset.serial_number}|{nonce}|{timestamp}"
    signature = hmac.new(
        current_app.config["QR_SECRET_KEY"].encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    qr_data = f"{message}|{signature}"
    return base64.urlsafe_b64encode(qr_data.encode()).decode()

def verify_qr(qr_data):
    try:
        decoded = base64.urlsafe_b64decode(qr_data.encode()).decode()
        parts = decoded.split('|')
        if len(parts) != 6:
            return None

        asset_id, student_id, serial_number, nonce, timestamp, signature = parts
        message = f"{asset_id}|{student_id}|{serial_number}|{nonce}|{timestamp}"
        expected_signature = hmac.new(
            current_app.config["QR_SECRET_KEY"].encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            return None
        qr_time = datetime.fromtimestamp(int(timestamp))
        current_time = datetime.utcnow()
        if current_time - qr_time > timedelta(hours=current_app.config.get("QR_VALIDITY_HOURS", 24)):
            return None
        asset = Asset.query.get(int(asset_id))
        if not asset or asset.serial_number != serial_number:
            return None
        if str(asset.owner_student_id) != str(student_id):
            return None
        return asset
    except Exception:
        return None
