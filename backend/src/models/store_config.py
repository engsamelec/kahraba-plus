from src.models.user import db


class StoreConfig(db.Model):
    """Single-row store settings the merchant can edit (shipping, free-shipping
    threshold, tax) instead of them being hardcoded. Amounts are in USD (the
    base currency); the storefront converts for display."""

    __tablename__ = "store_config"

    id = db.Column(db.Integer, primary_key=True)
    free_shipping_threshold = db.Column(db.Float, nullable=False, default=100.0)
    domestic_shipping = db.Column(db.Float, nullable=False, default=3.0)
    international_shipping = db.Column(db.Float, nullable=False, default=25.0)
    tax_rate = db.Column(db.Float, nullable=False, default=0.0)  # 0..1
    home_country = db.Column(db.String(80), nullable=False, default="Syria")
    # Contact details shown in the footer / about / invoice.
    store_phone = db.Column(db.String(40), nullable=False, default="+963 900 000 000")
    store_email = db.Column(db.String(120), nullable=False, default="info@kahrabaplus.com")
    store_address = db.Column(db.String(200), nullable=False, default="Damascus, Syria")

    def to_dict(self):
        return {
            "free_shipping_threshold": self.free_shipping_threshold,
            "domestic_shipping": self.domestic_shipping,
            "international_shipping": self.international_shipping,
            "tax_rate": self.tax_rate,
            "home_country": self.home_country,
            "store_phone": self.store_phone,
            "store_email": self.store_email,
            "store_address": self.store_address,
        }


def get_config():
    """Return the single config row, creating it with defaults on first use."""
    cfg = StoreConfig.query.first()
    if not cfg:
        cfg = StoreConfig()
        db.session.add(cfg)
        db.session.commit()
    return cfg
