import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from flask import current_app

def generate_exit_token(student_id, operator_id, has_assets):
    timestamp = int(datetime.utcnow().timestamp())
    nonce = secrets.token_hex(8)
    payload = f"{student_id}|{operator_id}|{int(has_assets)}|{nonce}|{timestamp}"
    signature = hmac.new(
        current_app.config["EXIT_TOKEN_SECRET_KEY"].encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    token = f"{payload}|{signature}"
    return base64.urlsafe_b64encode(token.encode()).decode()

def verify_exit_token(token, student_id, operator_id, require_has_assets=None):
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        parts = decoded.split("|")
        if len(parts) != 6:
            return False
        token_student_id, token_operator_id, has_assets, nonce, timestamp, signature = parts
        payload = f"{token_student_id}|{token_operator_id}|{has_assets}|{nonce}|{timestamp}"
        expected_signature = hmac.new(
            current_app.config["EXIT_TOKEN_SECRET_KEY"].encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            return False
        ttl_seconds = current_app.config.get("EXIT_TOKEN_TTL_SECONDS", 300)
        token_time = datetime.fromtimestamp(int(timestamp))
        if datetime.utcnow() - token_time > timedelta(seconds=ttl_seconds):
            return False
        if str(token_student_id) != str(student_id):
            return False
        if str(token_operator_id) != str(operator_id):
            return False
        if require_has_assets is not None and int(has_assets) != int(require_has_assets):
            return False
        return True
    except Exception:
        return False
