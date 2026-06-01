from datetime import datetime, timezone

from src.models.user import db, utcnow


class Promotion(db.Model):
    """A merchant-created sale event / occasion (e.g. Eid, Black Friday).

    Shows a banner on the storefront during its active window, links to the
    shop (optionally pre-filtered), and can advertise a coupon code. Purely a
    marketing surface — the actual discount is applied by the linked coupon
    and/or per-product sale prices.
    """

    __tablename__ = "promotions"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False)
    title_ar = db.Column(db.String(140), nullable=True)
    title_he = db.Column(db.String(140), nullable=True)
    subtitle = db.Column(db.String(240), nullable=True)
    subtitle_ar = db.Column(db.String(240), nullable=True)
    subtitle_he = db.Column(db.String(240), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    coupon_code = db.Column(db.String(40), nullable=True)
    cta_link = db.Column(db.String(200), nullable=True)  # e.g. /shop?category=...
    starts_at = db.Column(db.DateTime, nullable=True)
    ends_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)

    @property
    def live(self):
        """True if active and within its (optional) date window right now."""
        if not self.is_active:
            return False
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if self.starts_at and self.starts_at > now:
            return False
        if self.ends_at and self.ends_at < now:
            return False
        return True

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "title_ar": self.title_ar,
            "title_he": self.title_he,
            "subtitle": self.subtitle,
            "subtitle_ar": self.subtitle_ar,
            "subtitle_he": self.subtitle_he,
            "image_url": self.image_url,
            "coupon_code": self.coupon_code,
            "cta_link": self.cta_link or "/offers",
            "starts_at": self.starts_at.isoformat() if self.starts_at else None,
            "ends_at": self.ends_at.isoformat() if self.ends_at else None,
            "is_active": self.is_active,
            "live": self.live,
            "sort_order": self.sort_order,
        }
