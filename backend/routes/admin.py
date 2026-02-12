from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.student import Student
from backend.models.asset import Asset
from backend.models.operator import Operator
from backend.qr.verify import generate_qr_signature
from backend.app import db

bp = Blueprint("admin", __name__, url_prefix="/admin")

@bp.route("/register-asset", methods=["POST"])
@jwt_required()
def register_asset():
    """Register new asset with QR generation"""
    # Check if user is admin
    operator_id = get_jwt_identity()
    operator = Operator.query.get(operator_id)
    
    if not operator or operator.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.json
    
    # Validate required fields
    required_fields = ["owner_student_id", "serial_number"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    serial_number = str(data["serial_number"]).strip()
    if len(serial_number) < 3:
        return jsonify({"error": "serial_number is too short"}), 400
    
    # Check if student exists and is active
    student = Student.query.get(data["owner_student_id"])
    if not student:
        return jsonify({"error": "Student not found"}), 404
    
    if student.status != "active":
        return jsonify({"error": "Student is not active"}), 400
    
    # Check for existing asset with same serial number
    existing_asset = Asset.query.filter_by(serial_number=serial_number).first()
    
    if existing_asset:
        # Return existing asset details for review
        return jsonify({
            "status": "CONFLICT",
            "message": "Asset with this serial number already exists",
            "existing_asset": existing_asset.to_dict()
        }), 409
    
    # Create new asset
    asset = Asset(
        owner_student_id=data["owner_student_id"],
        serial_number=serial_number,
        brand=data.get("brand"),
        color=data.get("color"),
        visible_specs=data.get("visible_specs"),
        status="active"
    )
    
    db.session.add(asset)
    db.session.commit()
    
    # Generate QR signature after asset has ID
    qr_signature = generate_qr_signature(asset)
    asset.qr_signature = qr_signature
    
    db.session.commit()
    
    return jsonify({
        "message": "Asset registered successfully",
        "asset": asset.to_dict(),
        "qr_data": qr_signature,
        "student": student.to_dict()
    }), 201

@bp.route("/assets", methods=["GET"])
@jwt_required()
def get_all_assets():
    """Get all registered assets"""
    operator_id = get_jwt_identity()
    operator = Operator.query.get(operator_id)
    
    if not operator or operator.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    assets = Asset.query.all()
    
    return jsonify({
        "assets": [asset.to_dict() for asset in assets]
    }), 200

@bp.route("/asset/<int:asset_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def manage_asset(asset_id):
    """Get, update, or delete asset"""
    operator_id = get_jwt_identity()
    operator = Operator.query.get(operator_id)
    
    if not operator or operator.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    asset = Asset.query.get_or_404(asset_id)
    
    if request.method == "GET":
        return jsonify({"asset": asset.to_dict()}), 200
    
    elif request.method == "PUT":
        data = request.json
        
        # Update asset fields
        if "status" in data:
            asset.status = data["status"]
        
        regenerate_qr = False
        if "owner_student_id" in data:
            # Verify new student exists
            student = Student.query.get(data["owner_student_id"])
            if not student:
                return jsonify({"error": "Student not found"}), 404
            asset.owner_student_id = data["owner_student_id"]
            regenerate_qr = True
        
        if regenerate_qr:
            asset.qr_signature = generate_qr_signature(asset)
        db.session.commit()
        
        return jsonify({
            "message": "Asset updated successfully",
            "asset": asset.to_dict()
        }), 200
    
    elif request.method == "DELETE":
        db.session.delete(asset)
        db.session.commit()
        
        return jsonify({"message": "Asset deleted successfully"}), 200

@bp.route("/students", methods=["GET"])
@jwt_required()
def get_all_students():
    """Get all students"""
    operator_id = get_jwt_identity()
    operator = Operator.query.get(operator_id)
    
    if not operator or operator.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    students = Student.query.all()
    
    return jsonify({
        "students": [student.to_dict() for student in students]
    }), 200

@bp.route("/statistics", methods=["GET"])
@jwt_required()
def get_statistics():
    """Get system statistics"""
    operator_id = get_jwt_identity()
    operator = Operator.query.get(operator_id)
    
    if not operator or operator.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    from models.exit_log import ExitLog
    from sqlalchemy import func
    
    # Get counts
    total_students = Student.query.count()
    active_students = Student.query.filter_by(status='active').count()
    total_assets = Asset.query.count()
    active_assets = Asset.query.filter_by(status='active').count()
    total_exits = ExitLog.query.count()
    
    # Get recent exits (last 24 hours)
    from datetime import datetime, timedelta
    yesterday = datetime.utcnow() - timedelta(hours=24)
    recent_exits = ExitLog.query.filter(ExitLog.timestamp >= yesterday).count()
    
    # Get exit results
    allowed_exits = ExitLog.query.filter_by(result='ALLOWED').count()
    blocked_exits = ExitLog.query.filter_by(result='BLOCKED').count()
    
    return jsonify({
        "statistics": {
            "total_students": total_students,
            "active_students": active_students,
            "total_assets": total_assets,
            "active_assets": active_assets,
            "total_exits": total_exits,
            "recent_exits_24h": recent_exits,
            "allowed_exits": allowed_exits,
            "blocked_exits": blocked_exits
        }
    }), 200
