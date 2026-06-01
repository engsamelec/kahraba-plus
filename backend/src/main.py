import os
import sys
from datetime import timedelta

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from src.models.user import db
from src.routes.auth import auth_bp
from src.routes.geo import geo_bp
from src.routes.imports import imports_bp
from src.routes.orders import orders_bp
from src.routes.products import products_bp
from src.routes.uploads import uploads_bp
from src.routes.visual_search import visual_bp


def create_app():
    # The built frontend (Vite) lives in frontend/dist; Flask serves it as the
    # SPA. Capacitor uses the same dist/ as its webDir for the mobile apps.
    static_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "frontend", "dist"
    )
    app = Flask(__name__, static_folder=os.path.abspath(static_dir))

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-change-me-in-production")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt-dev-change-me")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

    # Database: default to local SQLite so the store runs instantly.
    # Set DATABASE_URL (e.g. mysql+pymysql://...) to use MySQL in production.
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_path = os.path.join(os.path.dirname(__file__), "kahraba_plus.db")
        db_url = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(orders_bp, url_prefix="/api")
    app.register_blueprint(geo_bp, url_prefix="/api")
    app.register_blueprint(visual_bp, url_prefix="/api")
    app.register_blueprint(uploads_bp, url_prefix="/api")
    app.register_blueprint(imports_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "kahraba-plus-api"})

    with app.app_context():
        # Import models so SQLAlchemy registers all tables
        from src.models import catalog, order  # noqa: F401

        db.create_all()
        from src.seed import seed_database

        if seed_database():
            app.logger.info("Database seeded with initial catalog.")

    def _no_store(resp):
        """Never cache: the browser must always fetch the latest copy."""
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        # Serve real files directly. Content-hashed build assets (under
        # /assets/, with a hash in the filename) are safe to cache forever
        # because a new build produces a new filename. Everything else
        # (index.html, manifest, icons, sw cleanup) must revalidate so a fresh
        # deploy is picked up immediately — no manual cache clearing.
        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            resp = send_from_directory(static_folder_path, path)
            if path.startswith("assets/"):
                resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            else:
                resp = _no_store(resp)
            return resp

        index_path = os.path.join(static_folder_path, "index.html")
        if os.path.exists(index_path):
            return _no_store(send_from_directory(static_folder_path, "index.html"))
        return "index.html not found", 404

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
