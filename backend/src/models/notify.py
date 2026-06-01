from src.models.user import db, utcnow


class StockNotification(db.Model):
    """A customer's request to be notified when an out-of-stock product is
    back. The merchant sees pending requests per product in the admin so they
    know real demand and who to contact."""

    __tablename__ = "stock_notifications"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(
        db.Integer, db.ForeignKey("products.id"), nullable=False, index=True
    )
    email = db.Column(db.String(160), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)
    notified = db.Column(db.Boolean, default=False)

    __table_args__ = (
        db.UniqueConstraint("product_id", "email", name="uq_stock_notify"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "email": self.email,
            "notified": self.notified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
