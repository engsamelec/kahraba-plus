"""Product questions & answers (Q&A).

Public:
  GET  /api/products/:id/questions          answered questions (newest first)
  POST /api/products/:id/questions          ask a question {body, name?}

Admin:
  GET  /api/admin/questions                 all questions (for moderation)
  PUT  /api/admin/questions/:id             answer {answer}
  DELETE /api/admin/questions/:id
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from src.models.catalog import Product
from src.models.question import Question
from src.models.user import db
from src.routes.helpers import admin_required

questions_bp = Blueprint("questions", __name__)


@questions_bp.route("/products/<int:product_id>/questions", methods=["GET"])
def list_questions(product_id):
    # Public sees answered questions; unanswered stay private until addressed.
    qs = (
        Question.query.filter(
            Question.product_id == product_id, Question.answer.isnot(None)
        )
        .order_by(Question.created_at.desc())
        .all()
    )
    return jsonify([q.to_dict() for q in qs])


@questions_bp.route("/products/<int:product_id>/questions", methods=["POST"])
def ask_question(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if len(body) < 3:
        return jsonify({"error": "Question too short"}), 400
    q = Question(
        product_id=product_id,
        body=body[:1000],
        asker_name=(data.get("name") or "").strip()[:80] or None,
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({"ok": True}), 201


@questions_bp.route("/admin/questions", methods=["GET"])
@admin_required
def admin_list_questions():
    qs = Question.query.order_by(Question.created_at.desc()).all()
    out = []
    for q in qs:
        d = q.to_dict()
        product = db.session.get(Product, q.product_id)
        d["product_name"] = product.name if product else None
        d["slug"] = product.slug if product else None
        out.append(d)
    return jsonify(out)


@questions_bp.route("/admin/questions/<int:qid>", methods=["PUT"])
@admin_required
def answer_question(qid):
    q = db.session.get(Question, qid)
    if not q:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(silent=True) or {}
    answer = (data.get("answer") or "").strip()
    q.answer = answer or None
    q.answered_at = datetime.now(timezone.utc) if answer else None
    db.session.commit()
    return jsonify(q.to_dict())


@questions_bp.route("/admin/questions/<int:qid>", methods=["DELETE"])
@admin_required
def delete_question(qid):
    q = db.session.get(Question, qid)
    if not q:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(q)
    db.session.commit()
    return "", 204
