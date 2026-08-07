const CONDITION_PATTERN = /\bBBTI\s*(AA|A\+|A|B\+|B|C\+|C|D|E)(?:\s*(RC))?/i;

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizedAppleModel(model) {
  return clean(model)
    .replace(/^APP\s*WATCH/i, "Apple Watch")
    .replace(/^APP\s+iPHONE/i, "Apple iPhone")
    .replace(/^APP\s+IPHONE/i, "Apple iPhone")
    .replace(/^IPAD/i, "Apple iPad")
    .replace(/^MACBOOK/i, "Apple MacBook")
    .replace(/\bPRO\b/g, "Pro")
    .replace(/\bMAX\b/g, "Max")
    .replace(/\bMINI\b/g, "mini")
    .replace(/\bPLUS\b/g, "Plus");
}

function normalizedSamsungModel(model) {
  const cleaned = clean(model);
  const parenthetical = cleaned.match(/\(([^)]+)\)/)?.[1];
  if (parenthetical) {
    const readable = parenthetical
      .replace(/Ultra5G/gi, "Ultra 5G")
      .replace(/Plus\s*5G/gi, "Plus 5G")
      .replace(/Flip(\d)/gi, "Flip $1")
      .replace(/Fold(\d)/gi, "Fold $1");
    return `Samsung ${readable}`;
  }
  return cleaned.replace(/^SAM\s*/i, "Samsung ");
}

function recognizeBrand(model, productGroup) {
  const upper = clean(model).toUpperCase();
  if (/^(APP\b|APPWATCH\b|IPAD\b|MACBOOK\b)/.test(upper)) return "Apple";
  if (/^SAM\b/.test(upper)) return "Samsung";
  if (/UNIVERSAL|MULTI/.test(upper) || /ACCESSORY/i.test(clean(productGroup))) return "Kiegészítő";
  return "Ismeretlen";
}

function displayModel(model, brand) {
  if (brand === "Apple") return normalizedAppleModel(model);
  if (brand === "Samsung") return normalizedSamsungModel(model);
  return clean(model) || "Ismeretlen készülék";
}

function extractCondition(productType) {
  const cleaned = clean(productType);
  const match = cleaned.match(CONDITION_PATTERN);
  if (!match) return "Ismeretlen";
  return `${match[1].toUpperCase()}${match[2] ? " RC" : ""}`;
}

function extractVatType(productType) {
  const cleaned = clean(productType);
  if (/marginal vat/i.test(cleaned)) return "Marginal VAT";
  if (/standard vat/i.test(cleaned)) return "Standard VAT";
  return "Ismeretlen VAT";
}

function comparisonKey(parts) {
  return [parts.brand, parts.displayModel, parts.storage, parts.condition, parts.vatType]
    .map((value) => clean(value).toLocaleUpperCase("hu-HU"))
    .join("|");
}

export function recognizeDevice(row) {
  const model = clean(row.Model);
  const brand = recognizeBrand(model, row["Product Group"]);
  const recognized = {
    brand,
    displayModel: displayModel(model, brand),
    storage: clean(row["Commodity Class"]) || "—",
    condition: extractCondition(row["Product Type"]),
    vatType: extractVatType(row["Product Type"]),
    category: clean(row["Product Group"]) || "Ismeretlen",
  };

  return { ...recognized, comparisonKey: comparisonKey(recognized) };
}

export const deviceRecognitionInternals = Object.freeze({
  extractCondition,
  extractVatType,
});

