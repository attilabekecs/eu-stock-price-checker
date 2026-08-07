import test from "node:test";
import assert from "node:assert/strict";
import { applyPurchasePrice, evaluatePrices, hasUsablePrice, vatMultiplierFor } from "../public/src/services/priceEvaluator.js";

test("Standard VAT esetén 1,27-es szorzóval számolja a HUF-listaárat", () => {
  const [result] = evaluatePrices([{ unitPriceEur: 100, vatType: "Standard VAT" }], 400);
  assert.equal(result.netPriceHuf, 40000);
  assert.equal(result.vatMultiplier, 1.27);
  assert.equal(result.unitPriceHuf, 50800);
});

test("Marginal VAT esetén nem ad hozzá további ÁFÁ-t", () => {
  const [result] = evaluatePrices([{ unitPriceEur: 100, vatType: "Marginal VAT" }], 400);
  assert.equal(result.netPriceHuf, 40000);
  assert.equal(result.vatMultiplier, 1);
  assert.equal(result.unitPriceHuf, 40000);
});

test("a saját vételi árhoz viszonyítja a korrigált listaárat", () => {
  const base = { unitPriceHuf: 100000 };
  const fits = applyPurchasePrice(base, 110000);
  const over = applyPurchasePrice(base, 95000);
  const missing = applyPurchasePrice(base, null);

  assert.equal(fits.differenceHuf, 10000);
  assert.equal(fits.purchaseStatus, "fits");
  assert.equal(over.differenceHuf, -5000);
  assert.equal(over.purchaseStatus, "over");
  assert.equal(missing.differenceHuf, null);
  assert.equal(missing.purchaseStatus, "no-target");
});

test("csak a pozitív számszerű árat tekinti megjeleníthetőnek", () => {
  assert.equal(hasUsablePrice({ unitPriceEur: 97 }), true);
  assert.equal(hasUsablePrice({ unitPriceEur: 0 }), false);
  assert.equal(hasUsablePrice({ unitPriceEur: null }), false);
  assert.equal(hasUsablePrice({ unitPriceEur: Number.NaN }), false);
});

test("ismeretlen VAT-típusnál nem alkalmaz automatikus szorzót", () => {
  assert.equal(vatMultiplierFor({ vatType: "Ismeretlen VAT" }), 1);
});
