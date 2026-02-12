from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models.student import Student
from backend.models.asset import Asset
from backend.models.exit_log import ExitLog
from backend.qr.verify import verify_qr
from backend.utils.crypto import generate_exit_token, verify_exit_token
from backend.app import db

def _is_valid_student_id(student_id):
    return bool(student_id and len(student_id) >= 3)

bp = Blueprint("gate", __name__, url_prefix="/gate/exit")

@bp.route("/scan-student", methods=["POST"])
@jwt_required()
def scan_student():
    """Step 1: Verify student is active"""
    student_id = request.json.get("student_id")
    operator_id = get_jwt_identity()
    
    if not student_id:
        return jsonify({"status": "BLOCKED", "reason": "Student ID required"}), 400
    if not _is_valid_student_id(student_id):
        return jsonify({"status": "BLOCKED", "reason": "Invalid student ID format"}), 400
    
    student = Student.query.get(student_id)
    
    if not student:
        # Log blocked attempt
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Student not found"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Student not found"}), 404
    
    if student.status != "active":
        # Log blocked attempt
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason=f"Student inactive: {student.status}"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Student inactive"}), 403
    
    # Check if student has registered assets
    assets = Asset.query.filter_by(owner_student_id=student_id, status='active').all()
    has_assets = len(assets) > 0
    
    return jsonify({
        "status": "OK",
        "student": student.to_dict(),
        "has_assets": has_assets,
        "asset_count": len(assets),
        "exit_token": generate_exit_token(student_id, operator_id, has_assets)
    }), 200

@bp.route("/scan-asset", methods=["POST"])
@jwt_required()
def scan_asset():
    """Step 2: Verify asset and ownership"""
    data = request.json
    student_id = data.get("student_id")
    qr_data = data.get("qr_data")
    exit_token = data.get("exit_token")
    operator_id = get_jwt_identity()
    
    if not student_id or not qr_data or not exit_token:
        return jsonify({"status": "BLOCKED", "reason": "Student ID, QR data, and exit token required"}), 400
    if not _is_valid_student_id(student_id):
        return jsonify({"status": "BLOCKED", "reason": "Invalid student ID format"}), 400
    if not verify_exit_token(exit_token, student_id, operator_id, require_has_assets=True):
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Invalid or expired exit token"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Invalid or expired exit token"}), 403
    
    # Verify student exists and is active
    student = Student.query.get(student_id)
    if not student or student.status != "active":
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Student invalid or inactive"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Student invalid or inactive"}), 403
    
    # Verify QR
    asset = verify_qr(qr_data)
    if not asset:
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Invalid QR"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Invalid QR"}), 403
    
    # Check ownership
    if str(asset.owner_student_id) != str(student_id):
        log = ExitLog(
            student_id=student_id,
            asset_id=asset.asset_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Ownership mismatch"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Ownership mismatch"}), 403
    
    # Check asset status
    if asset.status != "active":
        reason = f"Asset {asset.status}"
        log = ExitLog(
            student_id=student_id,
            asset_id=asset.asset_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason=reason
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": reason}), 403
    
    # ALLOWED - Create exit log
    log = ExitLog(
        student_id=student_id,
        asset_id=asset.asset_id,
        operator_id=operator_id,
        result="ALLOWED",
        reason="Exit verified successfully"
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        "status": "ALLOWED",
        "reason": "Exit verified successfully",
        "student": student.to_dict(),
        "asset": asset.to_dict()
    }), 200

@bp.route("/exit-without-asset", methods=["POST"])
@jwt_required()
def exit_without_asset():
    """Student exit without carrying any asset"""
    student_id = request.json.get("student_id")
    exit_token = request.json.get("exit_token")
    operator_id = get_jwt_identity()
    
    if not student_id or not exit_token:
        return jsonify({"status": "BLOCKED", "reason": "Student ID and exit token required"}), 400
    if not _is_valid_student_id(student_id):
        return jsonify({"status": "BLOCKED", "reason": "Invalid student ID format"}), 400
    if not verify_exit_token(exit_token, student_id, operator_id, require_has_assets=False):
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Invalid or expired exit token"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Invalid or expired exit token"}), 403
    
    student = Student.query.get(student_id)
    if not student or student.status != "active":
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Student invalid or inactive"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Student invalid or inactive"}), 403

    assets = Asset.query.filter_by(owner_student_id=student_id, status='active').all()
    if len(assets) > 0:
        log = ExitLog(
            student_id=student_id,
            operator_id=operator_id,
            result="BLOCKED",
            reason="Registered assets present"
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"status": "BLOCKED", "reason": "Registered assets present"}), 403
    
    # Log exit without asset
    log = ExitLog(
        student_id=student_id,
        operator_id=operator_id,
        result="ALLOWED",
        reason="Exit without registered assets"
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        "status": "ALLOWED",
        "reason": "Exit without assets verified",
        "student": student.to_dict()
    }), 200

@bp.route("/logs", methods=["GET"])
@jwt_required()
def get_exit_logs():
    """Get recent exit logs"""
    operator_id = get_jwt_identity()
    limit = request.args.get("limit", 50, type=int)
    
    logs = ExitLog.query.order_by(ExitLog.timestamp.desc()).limit(limit).all()
    
    return jsonify({
        "logs": [log.to_dict() for log in logs]
    }), 200
