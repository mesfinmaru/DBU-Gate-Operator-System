from backend.app import db
from werkzeug.security import generate_password_hash, check_password_hash

class Operator(db.Model):
    __tablename__ = 'operator'
    
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='gate_operator')  # admin, gate_operator
    
    # Relationships
    exit_logs = db.relationship('ExitLog', backref='operator', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'username': self.username,
            'role': self.role
        }
