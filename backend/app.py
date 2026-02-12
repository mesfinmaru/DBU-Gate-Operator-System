from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from werkzeug.middleware.proxy_fix import ProxyFix
from .config import Config

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    CORS(app, resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", [])}})
    
    db.init_app(app)
    jwt.init_app(app)

    @app.before_request
    def enforce_https():
        if not app.config.get("ENFORCE_HTTPS", False):
            return None
        if request.is_secure:
            return None
        forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
        if forwarded_proto.lower() == "https":
            return None
        if request.host.startswith("localhost") or request.host.startswith("127.0.0.1"):
            return None
        return jsonify({"error": "HTTPS required"}), 403
    
    # Register blueprints
    from .routes.auth import bp as auth_bp
    from .routes.gate import bp as gate_bp
    from .routes.admin import bp as admin_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(gate_bp)
    app.register_blueprint(admin_bp)
    @app.route("/")
    def index():
        return jsonify({"service": "EACS API", "status": "ok"}), 200
    @app.route("/healthz")
    def healthz():
        return jsonify({"status": "healthy"}), 200
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=app.config.get("DEBUG", False))
