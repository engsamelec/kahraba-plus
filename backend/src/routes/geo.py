"""Geo-based language suggestion.

Maps a visitor's country to a default UI language so the storefront opens in
the most relevant language:

  - Israel (IL)               -> Hebrew  (he)
  - Palestine (PS) + Arab     -> Arabic  (ar)
  - elsewhere                 -> English (en)

Country detection prefers trusted edge/proxy headers set by a CDN or reverse
proxy in production (Cloudflare, App Engine, Fastly, ...). When deployed behind
such infrastructure this is accurate and needs no external lookup or GeoIP
database. If no header is present the language simply falls back to Arabic and
the visitor can switch manually — detection never blocks the page.
"""

from flask import Blueprint, jsonify, request

geo_bp = Blueprint("geo", __name__)

# Countries we explicitly route to Arabic.
ARABIC_COUNTRIES = {
    "PS", "SY", "LB", "JO", "IQ", "SA", "AE", "EG", "KW", "QA", "BH", "OM",
    "YE", "LY", "TN", "DZ", "MA", "SD", "MR",
}

# Headers a CDN / reverse proxy commonly sets with a 2-letter ISO country code.
_COUNTRY_HEADERS = (
    "CF-IPCountry",            # Cloudflare
    "X-AppEngine-Country",     # Google App Engine
    "X-Country-Code",          # generic / Fastly
    "X-Geo-Country",           # generic
)


def country_to_lang(country: str | None) -> str:
    """Return the default language code for an ISO country code."""
    if not country:
        return "ar"
    c = country.strip().upper()
    if c == "IL":
        return "he"
    if c in ARABIC_COUNTRIES:
        return "ar"
    if c in ("", "XX", "T1"):  # unknown / Tor
        return "ar"
    return "en"


def detect_country() -> str | None:
    for header in _COUNTRY_HEADERS:
        value = request.headers.get(header)
        if value and value.strip():
            return value.strip().upper()
    return None


@geo_bp.route("/geo/lang", methods=["GET"])
def geo_lang():
    """Suggest a UI language for the requesting visitor based on their region."""
    country = detect_country()
    return jsonify({"country": country, "lang": country_to_lang(country)})
