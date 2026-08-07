import { STANDARD_VAT_MULTIPLIER } from "../config.js";

export function hasUsablePrice(row) {
  return Number.isFinite(row?.unitPriceEur) && row.unitPriceEur > 0;
}

export function vatMultiplierFor(row) {
  return row?.vatType === "Standard VAT" ? STANDARD_VAT_MULTIPLIER : 1;
}

export function applyPurchasePrice(row, purchasePriceHuf) {
  const hasPurchasePrice = Number.isFinite(purchasePriceHuf) && purchasePriceHuf > 0;
  const normalizedPurchasePrice = hasPurchasePrice ? Math.round(purchasePriceHuf) : null;
  const differenceHuf = hasPurchasePrice && Number.isFinite(row.unitPriceHuf)
    ? normalizedPurchasePrice - row.unitPriceHuf
    : null;

  return {
    ...row,
    purchasePriceHuf: normalizedPurchasePrice,
    differenceHuf,
    purchaseStatus: differenceHuf === null ? "no-target" : differenceHuf >= 0 ? "fits" : "over",
  };
}

export function evaluatePrices(rows, exchangeRate) {
  return rows.map((row) => {
    const vatMultiplier = vatMultiplierFor(row);
    const netPriceHuf = hasUsablePrice(row) ? Math.round(row.unitPriceEur * exchangeRate) : null;
    const unitPriceHuf = hasUsablePrice(row) ? Math.round(row.unitPriceEur * exchangeRate * vatMultiplier) : null;

    return applyPurchasePrice({
      ...row,
      vatMultiplier,
      netPriceHuf,
      unitPriceHuf,
    }, row.purchasePriceHuf);
  });
}
