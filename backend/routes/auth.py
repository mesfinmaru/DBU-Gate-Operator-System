from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, verify_jwt_in_request, get_jwt
from backend.models.operator import Operator
from backend.app import db

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.route("/login", methods=["POST"])
def login():
    data = request.json
    
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400
    
    username = data.get("username")
    password = data.get("password")
    
    operator = Operator.query.filter_by(username=username).first()
    
    if not operator or not operator.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Create JWT token
    access_token = create_access_token(
        identity=str(operator.user_id),
        additional_claims={
            "username": operator.username,
            "role": operator.role
        }
    )
    
    return jsonify({
        "access_token": access_token,
        "user": operator.to_dict()
    }), 200

@bp.route("/register", methods=["POST"])
def register_operator():
    data = request.json
    
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400
    
    if Operator.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 409

    allow_self = current_app.config.get("ALLOW_OPERATOR_SELF_REGISTRATION", False)
    if not allow_self:
        total_operators = Operator.query.count()
        bootstrap_token = current_app.config.get("BOOTSTRAP_ADMIN_TOKEN")
        if total_operators == 0 and bootstrap_token:
            header_token = request.headers.get("X-Bootstrap-Token")
            if header_token != bootstrap_token or data.get("role") != "admin":
                return jsonify({"error": "Bootstrap token required for initial admin"}), 403
        else:
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") != "admin":
                return jsonify({"error": "Admin access required"}), 403

    operator = Operator(
        username=data["username"],
        role=data.get("role", "gate_operator")
    )
    operator.set_password(data["password"])
    
    db.session.add(operator)
    db.session.commit()
    
    return jsonify({
        "message": "Operator registered successfully",
        "user": operator.to_dict()
    }), 201
