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
from src.routes.coupons import coupons_bp
from src.routes.geo import geo_bp
from src.routes.imports import imports_bp
from src.routes.notify import notify_bp
from src.routes.orders import orders_bp
from src.routes.products import products_bp
from src.routes.promos import promos_bp
from src.routes.questions import questions_bp
from src.routes.uploads import uploads_bp
from src.routes.visual_search import visual_bp


def create_app():
    # The built frontend (Vite) lives in frontend/dist; Flask serves it as the
    # SPA. Capacitor uses the same dist/ as its webDir for the mobile apps.
    static_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "frontend", "dist"
    )
    app = Flask(__name__, static_folder=os.path.abspath(static_dir))

    # Secrets: real values must come from the environment. Dev defaults are
    # only allowed when FLASK_ENV/ENVIRONMENT isn't "production" — in prod we
    # fail fast rather than run with a forgeable, well-known key.
    is_prod = os.getenv("ENVIRONMENT", os.getenv("FLASK_ENV", "")).lower() == "production"
    secret_key = os.getenv("SECRET_KEY")
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if is_prod and (not secret_key or not jwt_secret):
        raise RuntimeError(
            "SECRET_KEY and JWT_SECRET_KEY must be set when ENVIRONMENT=production"
        )
    app.config["SECRET_KEY"] = secret_key or "dev-change-me-in-production"
    app.config["JWT_SECRET_KEY"] = jwt_secret or "jwt-dev-change-me"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

    # Database: default to local SQLite so the store runs instantly.
    # Set DATABASE_URL (e.g. mysql+pymysql://...) to use MySQL in production.
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_path = os.path.join(os.path.dirname(__file__), "kahraba_plus.db")
        db_url = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Restrict CORS in production to the configured origin(s); allow all in dev.
    cors_origins = os.getenv("CORS_ORIGINS")
    origins = (
        [o.strip() for o in cors_origins.split(",") if o.strip()]
        if cors_origins
        else "*"
    )
    CORS(app, resources={r"/api/*": {"origins": origins}})
    JWTManager(app)
    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(orders_bp, url_prefix="/api")
    app.register_blueprint(geo_bp, url_prefix="/api")
    app.register_blueprint(visual_bp, url_prefix="/api")
    app.register_blueprint(uploads_bp, url_prefix="/api")
    app.register_blueprint(imports_bp, url_prefix="/api")
    app.register_blueprint(coupons_bp, url_prefix="/api")
    app.register_blueprint(notify_bp, url_prefix="/api")
    app.register_blueprint(questions_bp, url_prefix="/api")
    app.register_blueprint(promos_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "kahraba-plus-api"})

    # --- API error handlers: never leak a raw HTML 500; always JSON, and roll
    # back the session so one bad request can't poison the next. ---
    from sqlalchemy.exc import IntegrityError, SQLAlchemyError
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(IntegrityError)
    def _handle_integrity(e):
        db.session.rollback()
        # Almost always a unique-constraint hit (duplicate SKU/slug/code) from
        # admin input — surface a friendly 409 instead of a 500.
        return jsonify({"error": "A record with these details already exists"}), 409

    @app.errorhandler(ValueError)
    def _handle_value_error(e):
        db.session.rollback()
        return jsonify({"error": "Invalid input"}), 400

    @app.errorhandler(SQLAlchemyError)
    def _handle_db_error(e):
        db.session.rollback()
        app.logger.exception("Database error")
        return jsonify({"error": "A database error occurred"}), 500

    @app.errorhandler(Exception)
    def _handle_unexpected(e):
        # Let Flask/Werkzeug HTTP errors (404/401/403/405…) pass through.
        if isinstance(e, HTTPException):
            return e
        db.session.rollback()
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Something went wrong"}), 500

    with app.app_context():
        # Import models so SQLAlchemy registers all tables
        from src.models import (  # noqa: F401
            catalog,
            coupon,
            notify,
            order,
            promo,
            question,
        )

        db.create_all()
        from src.seed import seed_database

        if seed_database():
            app.logger.info("Database seeded with initial catalog.")

        # Backfill human-friendly product numbers for any product missing one
        # (seeded rows, older imports). Idempotent.
        from src.models.catalog import Product

        missing = Product.query.filter(Product.product_number.is_(None)).all()
        if missing:
            for p in missing:
                p.product_number = f"KP-{p.id:05d}"
            db.session.commit()
            app.logger.info("Backfilled %d product numbers.", len(missing))

        # Seed a realistic cost (~62% of price) for demo products that have
        # none, so the accountant shows meaningful margins out of the box.
        no_cost = Product.query.filter(
            (Product.cost.is_(None)) | (Product.cost == 0)
        ).all()
        if no_cost:
            for p in no_cost:
                if p.price:
                    p.cost = round(p.price * 0.62, 2)
            db.session.commit()
            app.logger.info("Backfilled cost for %d products.", len(no_cost))

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
