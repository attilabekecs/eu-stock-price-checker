import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePrices, hasUsablePrice, priceEvaluatorInternals } from "../public/src/services/priceEvaluator.js";

test("helyesen számít mediánt páros és páratlan elemszámnál", () => {
  assert.equal(priceEvaluatorInternals.median([3, 1, 2]), 2);
  assert.equal(priceEvaluatorInternals.median([4, 1, 3, 2]), 2.5);
});

test("a csoportmediánhoz viszonyítja és HUF-ra váltja az árakat", () => {
  const base = { comparisonKey: "APPLE|IPHONE|128|A|VAT" };
  const result = evaluatePrices([
    { ...base, unitPriceEur: 90 },
    { ...base, unitPriceEur: 100 },
    { ...base, unitPriceEur: 110 },
  ], 400);
  assert.equal(result[0].referenceEur, 100);
  assert.equal(result[0].unitPriceHuf, 36000);
  assert.equal(result[0].priceStatus, "favorable");
  assert.equal(result[1].priceStatus, "typical");
  assert.equal(result[2].priceStatus, "high");
});

test("egyedi és hibás áraknál nem állít piaci minősítést", () => {
  const result = evaluatePrices([
    { comparisonKey: "ONE", unitPriceEur: 100 },
    { comparisonKey: "BAD", unitPriceEur: null },
  ], 400);
  assert.equal(result[0].priceStatus, "no-reference");
  assert.equal(result[1].priceStatus, "invalid");
});

test("csak a pozitív számszerű árat tekinti megjeleníthetőnek", () => {
  assert.equal(hasUsablePrice({ unitPriceEur: 97 }), true);
  assert.equal(hasUsablePrice({ unitPriceEur: 0 }), false);
  assert.equal(hasUsablePrice({ unitPriceEur: null }), false);
  assert.equal(hasUsablePrice({ unitPriceEur: Number.NaN }), false);
});
