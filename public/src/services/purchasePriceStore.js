const STORAGE_KEY = "eu-stock-price-checker.purchase-prices.v1";

function readPriceMap(storage = globalThis.localStorage) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writePriceMap(priceMap, storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(priceMap));
  } catch {
    // A böngésző tárhelyének hibája ne akadályozza az árlista használatát.
  }
}

export function loadPurchasePrice(comparisonKey, storage = globalThis.localStorage) {
  if (!comparisonKey) return null;
  const value = readPriceMap(storage)[comparisonKey];
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function savePurchasePrice(comparisonKey, purchasePriceHuf, storage = globalThis.localStorage) {
  if (!comparisonKey) return;
  const priceMap = readPriceMap(storage);
  if (Number.isFinite(purchasePriceHuf) && purchasePriceHuf > 0) {
    priceMap[comparisonKey] = Math.round(purchasePriceHuf);
  } else {
    delete priceMap[comparisonKey];
  }
  writePriceMap(priceMap, storage);
}

export function applySavedPurchasePrices(rows, applyPurchasePrice, storage = globalThis.localStorage) {
  return rows.map((row) => applyPurchasePrice(row, loadPurchasePrice(row.comparisonKey, storage)));
}

export const purchasePriceStoreInternals = Object.freeze({
  STORAGE_KEY,
  readPriceMap,
  writePriceMap,
});
