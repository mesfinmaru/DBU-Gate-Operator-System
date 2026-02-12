from backend.app import db
from sqlalchemy.orm import relationship

class Student(db.Model):
    __tablename__ = 'student'
    
    student_id = db.Column(db.String(20), primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='active')  # active, blocked
    
    # Relationships
    assets = relationship('Asset', backref='owner', lazy=True)
    exit_logs = relationship('ExitLog', backref='student', lazy=True)
    
    def to_dict(self):
        return {
            'student_id': self.student_id,
            'full_name': self.full_name,
            'status': self.status
        }
