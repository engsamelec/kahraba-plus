from src.models.user import db, utcnow


class Question(db.Model):
    """A customer question on a product, optionally answered by the store.

    Public visitors can ask and read; only an admin can answer. Useful for
    electronics where buyers ask about compatibility, voltage, specs, etc.
    """

    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(
        db.Integer, db.ForeignKey("products.id"), nullable=False, index=True
    )
    asker_name = db.Column(db.String(80), nullable=True)
    body = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=True)
    answered_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "asker_name": self.asker_name or "Customer",
            "body": self.body,
            "answer": self.answer,
            "answered": self.answer is not None,
            "answered_at": self.answered_at.isoformat() if self.answered_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
