# Kahraba Plus ⚡ — Electronics E-commerce Store

**كهربا بلس** is a full-stack, bilingual (Arabic / English) e-commerce platform for
selling electronics and electrical components — Arduino boards, sensors, motors,
solar energy gear and more — to customers **locally and worldwide**.

This is a fully working storefront, not just a plan: browse, search, filter, add
to cart, checkout (cash on delivery), track orders, register/login, and manage
the whole catalog from an admin dashboard.

## ✨ Features

- **Storefront** — hero landing page, category browsing, product grid with
  search, price/stock filters, sorting and pagination.
- **Product pages** — image gallery, technical specs, customer reviews & ratings,
  related products, stock-aware add-to-cart.
- **Cart & Checkout** — persistent cart, live shipping quote (domestic vs.
  international), free shipping over $100, cash-on-delivery.
- **Orders** — order confirmation, public order tracking with a visual status
  timeline, per-user order history.
- **Accounts** — JWT auth (register / login), profile editing.
- **Admin dashboard** — sales stats, full product CRUD, order status management.
- **Bilingual + RTL** — instant Arabic ⇄ English switch with full right-to-left
  layout support and localized product data.

## 🧱 Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Axios |
| Backend  | Flask, SQLAlchemy, Flask-JWT-Extended, Flask-CORS |
| Database | SQLite out of the box · MySQL-ready via `DATABASE_URL` |

## 📁 Project Structure

```
kahraba-plus/
├── backend/
│   ├── src/
│   │   ├── models/      # User/Address, Category/Product/Review, Order/OrderItem
│   │   ├── routes/      # auth, products, orders (+ admin), helpers
│   │   ├── seed.py      # initial bilingual catalog + admin user
│   │   ├── static/      # built frontend (served by Flask)
│   │   └── main.py      # app factory, DB init, SPA serving
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/  # Navbar, Footer, ProductCard, Layout, ...
│       ├── lib/         # api client, i18n, auth & cart contexts
│       └── pages/       # Home, Shop, ProductDetail, Cart, Checkout, Admin, ...
└── docs/                # requirements, architecture, schema, costs
```

## 🚀 Getting Started

### 1. Backend (Flask API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/main.py          # runs on http://localhost:5000
```

On first run the database is created and seeded automatically with categories,
~20 products, and an admin account:

> **Admin login:** `admin@kahrabaplus.com` / `admin123`

### 2. Frontend (React app)

```bash
cd frontend
pnpm install
pnpm dev                    # runs on http://localhost:5173, proxies /api → :5000
```

### 3. Production build

`pnpm build` compiles the frontend straight into `backend/src/static/`, so the
Flask server serves the whole app (SPA + API) from a single origin on port 5000.

## 🔧 Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `DATABASE_URL` | SQLite file | Use MySQL: `mysql+pymysql://user:pass@host/db` |
| `SECRET_KEY` | dev value | Flask secret — **set in production** |
| `JWT_SECRET_KEY` | dev value | JWT signing key — **set in production** |

## 🌍 Local & International Selling

- **Shipping** is computed per destination (domestic vs. international) with a
  free-shipping threshold, in `backend/src/routes/orders.py`.
- **Payment** ships with Cash on Delivery; card/PayPal gateways are stubbed and
  ready to wire in.
- **Currency / VAT** are modeled on products and orders for future expansion.

## 🔌 Key API Endpoints

```
POST /api/auth/register · POST /api/auth/login · GET /api/auth/me
GET  /api/categories
GET  /api/products            (search, category, price, sort, pagination)
GET  /api/products/<slug>
POST /api/orders             · GET /api/orders/track/<number>
POST /api/orders/quote       (live shipping/total quote)
GET  /api/admin/stats        · GET/PUT /api/admin/orders     (admin)
POST/PUT/DELETE /api/products                                  (admin)
```

## 📱 Mobile Apps (Android & iOS)

The web app, the installable PWA, and the native apps **all run from the same
React codebase** via [Capacitor](https://capacitorjs.com) — so the Kahraba Plus
theme stays identical everywhere.

### PWA (works today, no stores)
After `pnpm build`, the app is installable from the browser ("Add to Home
Screen"), works offline for browsing, and uses the branded icon + splash.

### Native build

Native projects (`android/`, `ios/`) are **generated artifacts** (gitignored).
Recreate them on a machine with the platform SDKs:

```bash
cd frontend
pnpm install
pnpm build

# point the app at your deployed backend (mobile can't use a relative /api)
echo "VITE_API_URL=https://api.kahrabaplus.com/api" > .env.production
pnpm build

# add platforms (once)
pnpm cap:add:android      # needs Android Studio + SDK
pnpm cap:add:ios          # needs macOS + Xcode + CocoaPods

# generate branded icons & splash into the native projects
pnpm cap:assets

# sync web build into native and open the IDE
pnpm cap:sync
pnpm cap:open:android     # → build / run / generate signed APK/AAB
pnpm cap:open:ios         # → run on simulator / archive for App Store
```

| Setting | Value |
|---------|-------|
| App ID  | `com.kahrabaplus.app` |
| App name | Kahraba Plus |
| Theme / splash | `#1e293b` (navy) with amber bolt |

Icon & splash sources live in [`frontend/assets/`](frontend/assets); the PWA
icons in [`frontend/public/icons/`](frontend/public/icons). Regenerate all of
them from brand colors with `python scripts/generate_icons.py`.

> **Note:** the mobile apps are thin native shells around the web UI; the
> backend must be deployed and reachable over HTTPS at `VITE_API_URL`.

## 📚 Documentation

Detailed planning docs live in [`docs/`](docs/): requirements analysis, system
architecture, database schema, tech-stack rationale, and timeline/cost estimates.
