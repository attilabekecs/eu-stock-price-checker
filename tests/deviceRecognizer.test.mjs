import test from "node:test";
import assert from "node:assert/strict";
import { recognizeDevice } from "../public/src/services/deviceRecognizer.js";

test("felismeri az Apple iPhone modellt és az állapotot", () => {
  const result = recognizeDevice({
    Model: "APP iPHONE 15 PRO MAX",
    "Commodity Class": "256 GB",
    "Product Group": "Phones",
    "Product Type": "BBTI A+ Marginal VAT",
  });
  assert.equal(result.brand, "Apple");
  assert.equal(result.displayModel, "Apple iPhone 15 Pro Max");
  assert.equal(result.condition, "A+");
  assert.equal(result.vatType, "Marginal VAT");
});

test("a Samsung zárójeles Galaxy-nevét használja", () => {
  const result = recognizeDevice({
    Model: "SAM S928B (Galaxy S24 Ultra5G)",
    "Commodity Class": "512 GB",
    "Product Group": "Phones",
    "Product Type": "BBTI C RC Standard VAT",
  });
  assert.equal(result.displayModel, "Samsung Galaxy S24 Ultra 5G");
  assert.equal(result.condition, "C RC");
});

