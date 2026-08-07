const STATUS_LABELS = Object.freeze({
  fits: "Keret alatt",
  over: "Keret felett",
  "no-target": "Nincs vételi ár",
});

const numberFormatter = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 2 });
const integerFormatter = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });
const eurFormatter = new Intl.NumberFormat("hu-HU", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const hufFormatter = new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric" });

function appendCell(row, content, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  if (content instanceof Node) cell.append(content);
  else cell.textContent = content;
  row.append(cell);
}

function deviceCell(item) {
  const wrapper = document.createElement("span");
  const name = document.createElement("span");
  name.className = "device-name";
  name.textContent = item.displayModel;
  const meta = document.createElement("span");
  meta.className = "device-meta";
  meta.textContent = `${item.brand} · ${item.vatType}`;
  wrapper.append(name, meta);
  return wrapper;
}

function statusBadge(status) {
  const badge = document.createElement("span");
  badge.className = `badge badge-${status}`;
  badge.textContent = STATUS_LABELS[status];
  return badge;
}

function purchasePriceInput(item, onPurchasePriceChange) {
  const input = document.createElement("input");
  input.className = "purchase-input";
  input.type = "text";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.placeholder = "pl. 120 000";
  input.setAttribute("aria-label", `${item.displayModel} saját vételi ára HUF-ban`);
  input.value = Number.isFinite(item.purchasePriceHuf) ? integerFormatter.format(item.purchasePriceHuf) : "";
  input.addEventListener("blur", () => onPurchasePriceChange(item.id, input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
  return input;
}

function vatLabel(item) {
  return item.vatType === "Standard VAT" ? "Standard ×1,27" : "Marginal ×1";
}

export function renderRate(rate) {
  document.querySelector("#rateValue").textContent = `1 EUR = ${numberFormatter.format(rate.rate)} HUF`;
  const formattedDate = dateFormatter.format(new Date(`${rate.date}T12:00:00`));
  document.querySelector("#rateDate").textContent = `${formattedDate}${rate.isFallback ? " · tartalék adat" : " · MNB"}`;
}

export function setProcessStatus(message, kind = "") {
  const status = document.querySelector("#processStatus");
  status.textContent = message;
  status.className = `process-status${kind ? ` is-${kind}` : ""}`;
}

export function showResults(fileName, rowCount, sheetName, hiddenRowCount) {
  document.querySelector("#fileMeta").textContent = `${fileName} · ${sheetName} · ${integerFormatter.format(rowCount)} árazott tétel · ${integerFormatter.format(hiddenRowCount)} ár nélküli sor elrejtve`;
}

export function populateCategories(rows) {
  const select = document.querySelector("#categoryFilter");
  const categories = [...new Set(rows.map((row) => row.category))].sort((a, b) => a.localeCompare(b, "hu"));
  select.replaceChildren(new Option("Összes", "all"), ...categories.map((category) => new Option(category, category)));
}

export function populateConditions(rows) {
  const select = document.querySelector("#conditionFilter");
  const conditions = [...new Set(rows.map((row) => row.condition))].sort((a, b) => a.localeCompare(b, "hu", { numeric: true }));
  select.replaceChildren(new Option("Összes", "all"), ...conditions.map((condition) => new Option(condition, condition)));
}

export function renderTable(rows, onPurchasePriceChange) {
  const body = document.querySelector("#resultsBody");
  const fragment = document.createDocumentFragment();

  if (rows.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 11;
    cell.className = "empty-row";
    cell.textContent = "A szűrésnek nincs megfelelő találata.";
    row.append(cell);
    fragment.append(row);
  } else {
    for (const item of rows) {
      const row = document.createElement("tr");
      appendCell(row, item.productCode || "—");
      appendCell(row, deviceCell(item));
      appendCell(row, item.storage);
      appendCell(row, item.condition);
      appendCell(row, vatLabel(item));
      appendCell(row, integerFormatter.format(item.available), "numeric");
      appendCell(row, Number.isFinite(item.unitPriceEur) ? eurFormatter.format(item.unitPriceEur) : "—", "numeric");
      appendCell(row, Number.isFinite(item.unitPriceHuf) ? hufFormatter.format(item.unitPriceHuf) : "—", "numeric");
      appendCell(row, purchasePriceInput(item, onPurchasePriceChange), "purchase-cell");
      appendCell(row, Number.isFinite(item.differenceHuf) ? hufFormatter.format(item.differenceHuf) : "—", `numeric difference-${item.purchaseStatus}`);
      appendCell(row, statusBadge(item.purchaseStatus));
      fragment.append(row);
    }
  }

  body.replaceChildren(fragment);
  document.querySelector("#visibleCount").textContent = `${integerFormatter.format(rows.length)} látható sor`;
}
