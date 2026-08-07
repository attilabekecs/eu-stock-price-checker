import test from "node:test";
import assert from "node:assert/strict";
import { downloadXlsx } from "../public/src/services/exportService.js";

test("az Excel-export hozzáadja a HUF- és referenciaoszlopokat", () => {
  let exportedRows;
  let writtenFile;
  const sheet = {};
  const workbook = {};
  const xlsx = {
    utils: {
      json_to_sheet(rows) {
        exportedRows = rows;
        return sheet;
      },
      book_new() {
        return workbook;
      },
      book_append_sheet(target, targetSheet, name) {
        assert.equal(target, workbook);
        assert.equal(targetSheet, sheet);
        assert.equal(name, "Ár-ellenőrzés");
      },
    },
    writeFile(target, fileName) {
      assert.equal(target, workbook);
      writtenFile = fileName;
    },
  };

  downloadXlsx([{
    branch: "CZH01",
    productCode: "478386",
    description: "APPIPH11PRO64G GY BBTIC",
    available: 1,
    storage: "64 GB",
    category: "Phones",
    original: { "Product Type": "BBTI C Standard VAT" },
    sourceModel: "APP iPHONE 11 PRO",
    unitPriceEur: 97,
    displayModel: "Apple iPhone 11 Pro",
    brand: "Apple",
    condition: "C",
    vatType: "Standard VAT",
    unitPriceHuf: 35214,
    referenceHuf: null,
    comparableCount: 1,
    priceStatus: "no-reference",
  }], { rate: 363.03, date: "2026-08-06" }, "EU Stock list.xlsx", xlsx);

  assert.equal(exportedRows[0]["Ár HUF-ban"], 35214);
  assert.equal(exportedRows[0]["Referencia HUF"], null);
  assert.equal(exportedRows[0].Árpozíció, "Nincs összehasonlítás");
  assert.equal(writtenFile, "EU-Stock-list-HUF.xlsx");
});
