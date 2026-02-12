from backend.app import db
from datetime import datetime

class ExitLog(db.Model):
    __tablename__ = 'exit_log'
    
    log_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    student_id = db.Column(db.String(20), db.ForeignKey('student.student_id'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('asset.asset_id'), nullable=True)
    operator_id = db.Column(db.Integer, db.ForeignKey('operator.user_id'), nullable=False)
    result = db.Column(db.String(20), nullable=False)  # ALLOWED, BLOCKED
    reason = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'log_id': self.log_id,
            'timestamp': self.timestamp.isoformat(),
            'student_id': self.student_id,
            'asset_id': self.asset_id,
            'operator_id': self.operator_id,
            'result': self.result,
            'reason': self.reason
        }
