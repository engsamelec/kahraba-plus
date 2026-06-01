import json

from src.models.user import db, utcnow


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    name_ar = db.Column(db.String(120), nullable=True)
    name_he = db.Column(db.String(120), nullable=True)
    slug = db.Column(db.String(140), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(60), nullable=True)  # lucide icon name
    parent_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    products = db.relationship("Product", backref="category", lazy=True)
    children = db.relationship(
        "Category", backref=db.backref("parent", remote_side=[id]), lazy=True
    )

    def to_dict(self, with_count=False):
        data = {
            "id": self.id,
            "name": self.name,
            "name_ar": self.name_ar,
            "name_he": self.name_he,
            "slug": self.slug,
            "description": self.description,
            "icon": self.icon,
            "parent_id": self.parent_id,
        }
        if with_count:
            data["product_count"] = len(self.products)
        return data


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    name_ar = db.Column(db.String(200), nullable=True)
    name_he = db.Column(db.String(200), nullable=True)
    slug = db.Column(db.String(220), unique=True, nullable=False, index=True)
    sku = db.Column(db.String(60), unique=True, nullable=True)
    brand = db.Column(db.String(120), nullable=True)
    description = db.Column(db.Text, nullable=True)
    description_ar = db.Column(db.Text, nullable=True)
    description_he = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False, default=0.0)
    compare_at_price = db.Column(db.Float, nullable=True)  # original price for discounts
    currency = db.Column(db.String(8), nullable=False, default="USD")
    stock_quantity = db.Column(db.Integer, nullable=False, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    _image_urls = db.Column("image_urls", db.Text, nullable=True)  # JSON array
    _technical_specs = db.Column("technical_specs", db.Text, nullable=True)  # JSON object
    is_featured = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    rating_avg = db.Column(db.Float, default=0.0)
    rating_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    reviews = db.relationship(
        "Review", backref="product", lazy=True, cascade="all, delete-orphan"
    )

    # --- JSON helpers ---
    @property
    def image_urls(self):
        if not self._image_urls:
            return []
        try:
            return json.loads(self._image_urls)
        except (ValueError, TypeError):
            return []

    @image_urls.setter
    def image_urls(self, value):
        self._image_urls = json.dumps(value or [])

    @property
    def technical_specs(self):
        if not self._technical_specs:
            return {}
        try:
            return json.loads(self._technical_specs)
        except (ValueError, TypeError):
            return {}

    @technical_specs.setter
    def technical_specs(self, value):
        self._technical_specs = json.dumps(value or {})

    @property
    def in_stock(self):
        return self.stock_quantity > 0

    @property
    def discount_percent(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return round((1 - self.price / self.compare_at_price) * 100)
        return 0

    def to_dict(self, full=False):
        data = {
            "id": self.id,
            "name": self.name,
            "name_ar": self.name_ar,
            "name_he": self.name_he,
            "slug": self.slug,
            "sku": self.sku,
            "brand": self.brand,
            "price": self.price,
            "compare_at_price": self.compare_at_price,
            "discount_percent": self.discount_percent,
            "currency": self.currency,
            "stock_quantity": self.stock_quantity,
            "in_stock": self.in_stock,
            "category_id": self.category_id,
            "category": self.category.to_dict() if self.category else None,
            "image_urls": self.image_urls,
            "is_featured": self.is_featured,
            "is_active": self.is_active,
            "rating_avg": round(self.rating_avg or 0, 1),
            "rating_count": self.rating_count,
        }
        if full:
            data["description"] = self.description
            data["description_ar"] = self.description_ar
            data["description_he"] = self.description_he
            data["technical_specs"] = self.technical_specs
        return data


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False, default=5)  # 1..5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "user_id": self.user_id,
            "user_name": (
                f"{self.user.first_name} {self.user.last_name}".strip()
                if self.user
                else "User"
            ),
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
