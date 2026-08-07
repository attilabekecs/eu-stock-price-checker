import { readStockWorkbook } from "./services/excelReader.js";
import { loadExchangeRate } from "./services/exchangeRateService.js";
import { applyPurchasePrice, evaluatePrices, hasUsablePrice } from "./services/priceEvaluator.js";
import { downloadCsv, downloadXlsx } from "./services/exportService.js";
import { populateCategories, renderRate, renderTable, setProcessStatus, showResults } from "./ui/render.js";

const state = {
  rate: null,
  rows: [],
  fileName: "",
};

const elements = {
  fileInput: document.querySelector("#fileInput"),
  fileDrop: document.querySelector("#fileDrop"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  exportXlsx: document.querySelector("#exportXlsx"),
  exportCsv: document.querySelector("#exportCsv"),
};

function currentFilteredRows() {
  const query = elements.searchInput.value.trim().toLocaleLowerCase("hu-HU");
  const status = elements.statusFilter.value;
  const category = elements.categoryFilter.value;
  return state.rows.filter((row) => {
    const searchable = `${row.productCode} ${row.description} ${row.displayModel} ${row.sourceModel}`.toLocaleLowerCase("hu-HU");
    return (!query || searchable.includes(query))
      && (status === "all" || row.purchaseStatus === status)
      && (category === "all" || row.category === category);
  });
}

function applyFilters() {
  renderTable(currentFilteredRows(), updatePurchasePrice);
}

function parsePurchasePrice(value) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function updatePurchasePrice(rowId, rawValue) {
  const purchasePriceHuf = parsePurchasePrice(rawValue);
  state.rows = state.rows.map((row) => row.id === rowId ? applyPurchasePrice(row, purchasePriceHuf) : row);
  applyFilters();
}

async function processFile(file) {
  if (!file) return;
  setProcessStatus(`${file.name} feldolgozása…`);
  try {
    const parsed = await readStockWorkbook(file);
    const pricedRows = parsed.rows.filter(hasUsablePrice);
    const hiddenRowCount = parsed.rows.length - pricedRows.length;
    state.rows = evaluatePrices(pricedRows, state.rate.rate);
    state.fileName = file.name;
    populateCategories(state.rows);
    renderTable(state.rows, updatePurchasePrice);
    showResults(file.name, state.rows.length, parsed.sheetName, hiddenRowCount);
    elements.exportXlsx.disabled = false;
    elements.exportCsv.disabled = false;
    setProcessStatus("Feldolgozva", "success");
  } catch (error) {
    console.error(error);
    setProcessStatus(error instanceof Error ? error.message : "A fájl feldolgozása sikertelen.", "error");
  }
}

elements.fileInput.addEventListener("change", (event) => processFile(event.target.files?.[0]));
for (const eventName of ["dragenter", "dragover"]) {
  elements.fileDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.fileDrop.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.fileDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.fileDrop.classList.remove("is-dragging");
  });
}
elements.fileDrop.addEventListener("drop", (event) => processFile(event.dataTransfer?.files?.[0]));

elements.searchInput.addEventListener("input", applyFilters);
elements.statusFilter.addEventListener("change", applyFilters);
elements.categoryFilter.addEventListener("change", applyFilters);
elements.exportXlsx.addEventListener("click", () => downloadXlsx(state.rows, state.rate, state.fileName));
elements.exportCsv.addEventListener("click", () => downloadCsv(state.rows, state.rate, state.fileName));

state.rate = await loadExchangeRate();
renderRate(state.rate);
