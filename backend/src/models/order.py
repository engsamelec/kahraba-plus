from src.models.user import db, utcnow

ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"]
PAYMENT_STATUSES = ["unpaid", "paid", "refunded", "failed"]


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(40), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="pending")
    payment_status = db.Column(db.String(20), nullable=False, default="unpaid")
    payment_method = db.Column(db.String(40), nullable=False, default="cod")

    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    discount = db.Column(db.Float, nullable=False, default=0.0)
    coupon_code = db.Column(db.String(40), nullable=True)
    shipping_cost = db.Column(db.Float, nullable=False, default=0.0)
    tax = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    currency = db.Column(db.String(8), nullable=False, default="USD")

    # contact / shipping snapshot
    customer_name = db.Column(db.String(160), nullable=False)
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(40), nullable=True)
    shipping_address = db.Column(db.String(400), nullable=False)
    shipping_city = db.Column(db.String(120), nullable=False)
    shipping_country = db.Column(db.String(80), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    items = db.relationship(
        "OrderItem", backref="order", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self, with_items=True):
        data = {
            "id": self.id,
            "order_number": self.order_number,
            "user_id": self.user_id,
            "status": self.status,
            "payment_status": self.payment_status,
            "payment_method": self.payment_method,
            "subtotal": self.subtotal,
            "discount": self.discount,
            "coupon_code": self.coupon_code,
            "shipping_cost": self.shipping_cost,
            "tax": self.tax,
            "total_amount": self.total_amount,
            "currency": self.currency,
            "customer_name": self.customer_name,
            "customer_email": self.customer_email,
            "customer_phone": self.customer_phone,
            "shipping_address": self.shipping_address,
            "shipping_city": self.shipping_city,
            "shipping_country": self.shipping_country,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if with_items:
            data["items"] = [item.to_dict() for item in self.items]
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    product_name = db.Column(db.String(200), nullable=False)
    # Localized name snapshots so historical orders render in the customer's
    # language even if the product is later renamed or deleted.
    product_name_ar = db.Column(db.String(200), nullable=True)
    product_name_he = db.Column(db.String(200), nullable=True)
    product_image = db.Column(db.String(500), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Float, nullable=False, default=0.0)
    subtotal = db.Column(db.Float, nullable=False, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "product_name_ar": self.product_name_ar,
            "product_name_he": self.product_name_he,
            "product_image": self.product_image,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "subtotal": self.subtotal,
        }
