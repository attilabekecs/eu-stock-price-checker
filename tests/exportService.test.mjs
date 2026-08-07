import test from "node:test";
import assert from "node:assert/strict";
import { downloadXlsx } from "../public/src/services/exportService.js";

test("az Excel-export hozzáadja az ÁFA-, vételiár- és eltérésoszlopokat", () => {
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
    vatMultiplier: 1.27,
    netPriceHuf: 35214,
    unitPriceHuf: 44722,
    purchasePriceHuf: 50000,
    differenceHuf: 5278,
    purchaseStatus: "fits",
  }], { rate: 363.03, date: "2026-08-06" }, "EU Stock list.xlsx", xlsx);

  assert.equal(exportedRows[0]["ÁFA-szorzó"], 1.27);
  assert.equal(exportedRows[0]["Korrigált listaár HUF"], 44722);
  assert.equal(exportedRows[0]["Saját vételi ár HUF"], 50000);
  assert.equal(exportedRows[0]["Eltérés HUF"], 5278);
  assert.equal(exportedRows[0].Értékelés, "Keret alatt");
  assert.equal(writtenFile, "EU-Stock-list-HUF.xlsx");
});
