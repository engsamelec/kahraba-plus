from src.models.user import db, utcnow


class Coupon(db.Model):
    """A discount code the merchant creates and the customer applies at checkout.

    discount_type:
      - "percent" -> `value` is a percentage off the subtotal (e.g. 10 = 10%)
      - "fixed"   -> `value` is a flat amount off in USD (the base currency)

    Optional guards: a minimum subtotal, an expiry date, and a usage cap.
    """

    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(40), unique=True, nullable=False, index=True)
    discount_type = db.Column(db.String(10), nullable=False, default="percent")
    value = db.Column(db.Float, nullable=False, default=0.0)
    min_subtotal = db.Column(db.Float, nullable=False, default=0.0)  # USD
    max_uses = db.Column(db.Integer, nullable=True)  # null = unlimited
    used_count = db.Column(db.Integer, nullable=False, default=0)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def status(self):
        """Return None if usable, else a machine-readable reason string."""
        from datetime import datetime, timezone

        if not self.is_active:
            return "inactive"
        if self.expires_at and self.expires_at < datetime.now(timezone.utc).replace(
            tzinfo=None
        ):
            return "expired"
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return "exhausted"
        return None

    def discount_for(self, subtotal):
        """USD discount amount for a given subtotal (0 if not applicable)."""
        if self.status() is not None:
            return 0.0
        if subtotal < (self.min_subtotal or 0):
            return 0.0
        if self.discount_type == "fixed":
            return round(min(self.value, subtotal), 2)
        # percent — never exceed the subtotal even if value is mis-set > 100
        pct = min(max(self.value, 0.0), 100.0)
        return round(subtotal * (pct / 100.0), 2)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "discount_type": self.discount_type,
            "value": self.value,
            "min_subtotal": self.min_subtotal,
            "max_uses": self.max_uses,
            "used_count": self.used_count,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "status": self.status() or "active",
        }
