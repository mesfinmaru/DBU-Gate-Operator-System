import os
from datetime import timedelta

def _get_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost/dbu_gate_system"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "60")))
    QR_SECRET_KEY = os.getenv("QR_SECRET_KEY", "qr-secret-key-change-in-production")
    QR_VALIDITY_HOURS = int(os.getenv("QR_VALIDITY_HOURS", "24"))
    EXIT_TOKEN_SECRET_KEY = os.getenv("EXIT_TOKEN_SECRET_KEY", QR_SECRET_KEY)
    EXIT_TOKEN_TTL_SECONDS = int(os.getenv("EXIT_TOKEN_TTL_SECONDS", "300"))
    ENFORCE_HTTPS = _get_bool("ENFORCE_HTTPS", True)
    ALLOW_OPERATOR_SELF_REGISTRATION = _get_bool("ALLOW_OPERATOR_SELF_REGISTRATION", False)
    BOOTSTRAP_ADMIN_TOKEN = os.getenv("BOOTSTRAP_ADMIN_TOKEN")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", "1048576"))
    DEBUG = _get_bool("FLASK_DEBUG", False)
