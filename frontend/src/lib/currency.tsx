import { useI18n, type Lang } from "@/lib/i18n";

// Catalog prices are stored in USD (the base currency on the backend). The
// storefront displays them in the currency that matches the visitor's region:
//   - Hebrew (Israel)            -> ILS  ₪
//   - Arabic (Palestine & Arab)  -> ILS  ₪   (per business decision)
//   - English (rest of world)    -> USD  $
//
// NOTE: this is a display-time conversion at a fixed reference rate. A
// production deployment would pull a live FX rate (and ideally record the
// charged currency on the order). Update USD_TO_ILS or wire a rates API here.
export const USD_TO_ILS = 3.7;

export interface Currency {
  code: "USD" | "ILS";
  symbol: string;
  rate: number; // multiply a USD amount by this to get the local amount
}

export function currencyForLang(lang: Lang): Currency {
  if (lang === "he" || lang === "ar") {
    return { code: "ILS", symbol: "₪", rate: USD_TO_ILS };
  }
  return { code: "USD", symbol: "$", rate: 1 };
}

export function formatMoney(amountUsd: number, cur: Currency): string {
  const value = amountUsd * cur.rate;
  return `${cur.symbol}${value.toFixed(2)}`;
}

/**
 * Returns a `format(amountUsd)` function bound to the active language's
 * currency. Use in components: `const money = useMoney(); money(p.price)`.
 */
export function useMoney() {
  const { lang } = useI18n();
  const cur = currencyForLang(lang);
  return (amountUsd: number) => formatMoney(amountUsd, cur);
}
