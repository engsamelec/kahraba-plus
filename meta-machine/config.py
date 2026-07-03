"""إعدادات الماكينة — كل الأسرار من البيئة، لا credentials.json هنا (درس النظام المرجعي)."""
import os
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
WABA_ID = os.environ.get("WABA_ID", "")
WEBHOOK_VERIFY_TOKEN = os.environ.get("WEBHOOK_VERIFY_TOKEN", "")

CAPI_TOKEN = os.environ.get("CAPI_TOKEN", "")
DATASET_ID = os.environ.get("DATASET_ID", "")

ADS_TOKEN = os.environ.get("ADS_TOKEN", "")
AD_ACCOUNT_ID = os.environ.get("AD_ACCOUNT_ID", "")
PAGE_ID = os.environ.get("PAGE_ID", "")
CATALOG_ID = os.environ.get("CATALOG_ID", "")
LOOKALIKE_AUDIENCE_ID = os.environ.get("LOOKALIKE_AUDIENCE_ID", "")

DAILY_BUDGET_USD = float(os.environ.get("DAILY_BUDGET_USD", "40"))
TARGET_MSG_COST_USD = float(os.environ.get("TARGET_MSG_COST_USD", "2.0"))
TARGET_SALE_COST_USD = float(os.environ.get("TARGET_SALE_COST_USD", "17.0"))
CURRENCY = os.environ.get("CURRENCY", "ILS")
LEARNING_GRACE_DAYS = int(os.environ.get("LEARNING_GRACE_DAYS", "14"))

GRAPH = "https://graph.facebook.com/v21.0"
DB_PATH = os.path.join(os.path.dirname(__file__), "machine.db")
PRODUCTS_PATH = os.path.join(os.path.dirname(__file__), "products.json")
