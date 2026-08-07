import { PRICE_CURRENCY, REQUIRED_COLUMNS } from "../config.js";
import { recognizeDevice } from "./deviceRecognizer.js";

function normalizeHeader(value) {
  return String(value ?? "").replace(/\s+/g, "").toLocaleLowerCase("en-US");
}

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized || normalized.startsWith("#")) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalizeRow(row, headers) {
  const canonical = {};
  for (const [key, value] of Object.entries(row)) {
    canonical[headers.get(normalizeHeader(key)) ?? key] = value;
  }
  return canonical;
}

export async function readStockWorkbook(file, xlsx = globalThis.XLSX) {
  if (!xlsx) throw new Error("Az Excel-feldolgozó könyvtár nem töltődött be. Frissítsd az oldalt, majd próbáld újra.");
  if (!file) throw new Error("Nem választottál fájlt.");

  const buffer = await file.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: "array", cellFormula: true, cellNF: true, cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("A munkafüzet nem tartalmaz munkalapot.");

  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: true });
  if (rawRows.length === 0) throw new Error("Az első munkalap üres.");

  const discoveredHeaders = new Set(Object.keys(rawRows[0]).map(normalizeHeader));
  const missing = REQUIRED_COLUMNS.filter((column) => !discoveredHeaders.has(normalizeHeader(column)));
  if (missing.length > 0) throw new Error(`Hiányzó kötelező oszlop: ${missing.join(", ")}.`);

  const headerMap = new Map([
    [normalizeHeader("Branch Plant"), "Branch Plant"],
    [normalizeHeader("Product Code"), "Product Code"],
    [normalizeHeader("Description"), "Description"],
    [normalizeHeader("Available"), "Available"],
    [normalizeHeader("Commodity Class"), "Commodity Class"],
    [normalizeHeader("Product Group"), "Product Group"],
    [normalizeHeader("Product Type"), "Product Type"],
    [normalizeHeader("Model"), "Model"],
    [normalizeHeader("UnitPrice"), "UnitPrice"],
  ]);

  const rows = rawRows
    .map((row) => canonicalizeRow(row, headerMap))
    .filter((row) => String(row.Model ?? "").trim() || String(row.Description ?? "").trim())
    .map((row, index) => {
      const device = recognizeDevice(row);
      return {
        id: `${String(row["Product Code"] ?? "row")}-${index + 2}`,
        sourceRow: index + 2,
        branch: String(row["Branch Plant"] ?? "").trim(),
        productCode: String(row["Product Code"] ?? "").trim(),
        description: String(row.Description ?? "").trim(),
        available: parseNumber(row.Available) ?? 0,
        sourceModel: String(row.Model ?? "").trim(),
        unitPriceEur: parseNumber(row.UnitPrice),
        priceCurrency: PRICE_CURRENCY,
        original: row,
        ...device,
      };
    });

  return { rows, sheetName, workbookName: file.name };
}

export const excelReaderInternals = Object.freeze({ parseNumber, normalizeHeader });

