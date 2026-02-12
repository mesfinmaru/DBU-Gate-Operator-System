from backend.app import db
from sqlalchemy.orm import relationship
from datetime import datetime

class Asset(db.Model):
    __tablename__ = 'asset'
    
    asset_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    owner_student_id = db.Column(db.String(20), db.ForeignKey('student.student_id'), nullable=False)
    qr_signature = db.Column(db.String(500), unique=True, nullable=True)
    serial_number = db.Column(db.String(100), unique=True, nullable=False)
    brand = db.Column(db.String(50))
    color = db.Column(db.String(30))
    visible_specs = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')  # active, revoked, stolen
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    exit_logs = relationship('ExitLog', backref='asset', lazy=True)
    
    def to_dict(self):
        return {
            'asset_id': self.asset_id,
            'owner_student_id': self.owner_student_id,
            'serial_number': self.serial_number,
            'brand': self.brand,
            'color': self.color,
            'visible_specs': self.visible_specs,
            'status': self.status,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None
        }
