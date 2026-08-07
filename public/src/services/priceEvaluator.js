import { FAVORABLE_RATIO, HIGH_RATIO } from "../config.js";

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function priceStatus(price, reference, comparableCount) {
  if (!Number.isFinite(price) || price <= 0) return "invalid";
  if (!Number.isFinite(reference) || comparableCount < 2) return "no-reference";
  const ratio = price / reference;
  if (ratio <= FAVORABLE_RATIO) return "favorable";
  if (ratio <= HIGH_RATIO) return "typical";
  return "high";
}

export function evaluatePrices(rows, exchangeRate) {
  const groups = new Map();

  for (const row of rows) {
    if (!Number.isFinite(row.unitPriceEur) || row.unitPriceEur <= 0) continue;
    const group = groups.get(row.comparisonKey) ?? [];
    group.push(row.unitPriceEur);
    groups.set(row.comparisonKey, group);
  }

  return rows.map((row) => {
    const comparablePrices = groups.get(row.comparisonKey) ?? [];
    const referenceEur = median(comparablePrices);
    return {
      ...row,
      unitPriceHuf: Number.isFinite(row.unitPriceEur) && row.unitPriceEur > 0
        ? Math.round(row.unitPriceEur * exchangeRate)
        : null,
      referenceEur,
      referenceHuf: Number.isFinite(referenceEur) ? Math.round(referenceEur * exchangeRate) : null,
      comparableCount: comparablePrices.length,
      priceStatus: priceStatus(row.unitPriceEur, referenceEur, comparablePrices.length),
    };
  });
}

export function hasUsablePrice(row) {
  return Number.isFinite(row?.unitPriceEur) && row.unitPriceEur > 0;
}

export const priceEvaluatorInternals = Object.freeze({ median, priceStatus });
