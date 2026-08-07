const STATUS_LABELS = Object.freeze({
  favorable: "Kedvező",
  typical: "Átlagos",
  high: "Magas",
  "no-reference": "Nincs összehasonlítás",
  invalid: "Ellenőrzendő",
});

function exportRows(rows, rate) {
  return rows.map((row) => ({
    "Branch Plant": row.branch,
    "Product Code": row.productCode,
    Description: row.description,
    Available: row.available,
    "Commodity Class": row.storage,
    "Product Group": row.category,
    "Product Type": row.original["Product Type"] ?? "",
    Model: row.sourceModel,
    UnitPrice: row.unitPriceEur,
    "Felismerte a rendszer": row.displayModel,
    Márka: row.brand,
    Állapot: row.condition,
    "ÁFA-típus": row.vatType,
    "MNB EUR/HUF": rate.rate,
    "Árfolyam dátuma": rate.date,
    "Ár HUF-ban": row.unitPriceHuf,
    "Referencia HUF": row.comparableCount >= 2 ? row.referenceHuf : null,
    "Összehasonlítható sorok": row.comparableCount,
    Árpozíció: STATUS_LABELS[row.priceStatus],
  }));
}

function safeBaseName(fileName) {
  return String(fileName || "eu-stock-list").replace(/\.(xlsx|xls|csv)$/i, "").replace(/[^\p{L}\p{N}._-]+/gu, "-");
}

export function downloadXlsx(rows, rate, sourceFileName, xlsx = globalThis.XLSX) {
  if (!xlsx) throw new Error("Az Excel-exportáló nem érhető el.");
  const sheet = xlsx.utils.json_to_sheet(exportRows(rows, rate));
  sheet["!cols"] = [
    { wch: 12 }, { wch: 14 }, { wch: 34 }, { wch: 10 }, { wch: 16 }, { wch: 18 },
    { wch: 24 }, { wch: 28 }, { wch: 12 }, { wch: 32 }, { wch: 13 }, { wch: 12 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 22 },
  ];
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, "Ár-ellenőrzés");
  xlsx.writeFile(workbook, `${safeBaseName(sourceFileName)}-HUF.xlsx`, { compression: true });
}

export function downloadCsv(rows, rate, sourceFileName, xlsx = globalThis.XLSX) {
  if (!xlsx) throw new Error("A CSV-exportáló nem érhető el.");
  const sheet = xlsx.utils.json_to_sheet(exportRows(rows, rate));
  const csv = xlsx.utils.sheet_to_csv(sheet, { FS: ";" });
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeBaseName(sourceFileName)}-HUF.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

