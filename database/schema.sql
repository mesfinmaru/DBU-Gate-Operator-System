-- Database Schema for DBU Gate Exit System

-- Student table
CREATE TABLE student (
    student_id VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
);

-- Operator table
CREATE TABLE operator (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'gate_operator'
);

-- Asset table
CREATE TABLE asset (
    asset_id SERIAL PRIMARY KEY,
    owner_student_id VARCHAR(20) REFERENCES student(student_id),
    qr_signature VARCHAR(500) UNIQUE,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(50),
    color VARCHAR(30),
    visible_specs TEXT,
    status VARCHAR(20) DEFAULT 'active',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exit log table
CREATE TABLE exit_log (
    log_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_id VARCHAR(20) REFERENCES student(student_id),
    asset_id INTEGER REFERENCES asset(asset_id),
    operator_id INTEGER REFERENCES operator(user_id),
    result VARCHAR(20) NOT NULL,
    reason TEXT
);

-- Create indexes for performance
CREATE INDEX idx_exit_log_timestamp ON exit_log(timestamp DESC);
CREATE INDEX idx_exit_log_student_id ON exit_log(student_id);
CREATE INDEX idx_asset_owner ON asset(owner_student_id);
CREATE INDEX idx_asset_status ON asset(status);
CREATE INDEX idx_student_status ON student(status);

-- Insert sample data (optional)
INSERT INTO student (student_id, full_name, status) VALUES
    ('STU001', 'John Doe', 'active'),
    ('STU002', 'Jane Smith', 'active'),
    ('STU003', 'Bob Johnson', 'blocked');

INSERT INTO operator (username, password_hash, role) VALUES
    ('admin', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin'),
    ('operator1', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'gate_operator');

-- Note: Password hash is for 'password' - Change in production!