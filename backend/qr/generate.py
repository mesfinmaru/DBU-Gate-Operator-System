import hmac, hashlib, base64, secrets
from datetime import datetime
from backend.config import Config

SECRET_KEY = Config.QR_SECRET_KEY.encode()

def generate_qr(asset_id, owner_student_id, serial_number):
    timestamp = int(datetime.utcnow().timestamp())
    nonce = secrets.token_hex(8)
    payload = f"{asset_id}|{owner_student_id}|{serial_number}|{nonce}|{timestamp}"
    signature = hmac.new(SECRET_KEY, payload.encode(), hashlib.sha256).hexdigest()
    qr_payload = f"{payload}|{signature}"
    return base64.urlsafe_b64encode(qr_payload.encode()).decode()
