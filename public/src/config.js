export const PRICE_CURRENCY = "EUR";
export const STANDARD_VAT_MULTIPLIER = 1.27;
export const FALLBACK_RATE = Object.freeze({
  base: "EUR",
  quote: "HUF",
  rate: 363.03,
  date: "2026-08-06",
  source: "MNB",
  isFallback: true,
});

export const REQUIRED_COLUMNS = Object.freeze(["Model", "UnitPrice"]);
