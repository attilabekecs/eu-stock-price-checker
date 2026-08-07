import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const endpoint = "http://www.mnb.hu/arfolyamok.asmx";
const soapAction = "http://www.mnb.hu/webservices/MNBArfolyamServiceSoap/GetCurrentExchangeRates";
const body = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><GetCurrentExchangeRates xmlns="http://www.mnb.hu/webservices/" /></s:Body></s:Envelope>';

function decodeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function parseMnbResponse(xml) {
  const result = xml.match(/<GetCurrentExchangeRatesResult>([\s\S]*?)<\/GetCurrentExchangeRatesResult>/)?.[1];
  if (!result) throw new Error("Az MNB válaszából hiányzik az árfolyam-adat.");
  const decoded = decodeXml(result);
  const date = decoded.match(/<Day\s+date="(\d{4}-\d{2}-\d{2})"/)?.[1];
  const eur = decoded.match(/<Rate\s+unit="(\d+)"\s+curr="EUR">([^<]+)<\/Rate>/);
  if (!date || !eur) throw new Error("Az EUR/HUF árfolyam nem található az MNB válaszában.");
  const unit = Number(eur[1]);
  const value = Number(eur[2].replace(",", "."));
  if (!Number.isFinite(unit) || unit <= 0 || !Number.isFinite(value) || value <= 0) {
    throw new Error("Az MNB érvénytelen EUR/HUF árfolyamot adott vissza.");
  }
  return { date, rate: value / unit };
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "text/xml; charset=utf-8",
    SOAPAction: soapAction,
  },
  body,
});
if (!response.ok) throw new Error(`Az MNB API hibát adott: HTTP ${response.status}.`);

const parsed = parseMnbResponse(await response.text());
const payload = {
  base: "EUR",
  quote: "HUF",
  rate: parsed.rate,
  date: parsed.date,
  source: "MNB",
  sourceUrl: "https://www.mnb.hu/arfolyamok",
  retrievedAt: new Date().toISOString(),
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDir, "../public/data/exchange-rate.json");
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`MNB EUR/HUF: ${payload.rate} (${payload.date})`);

export { parseMnbResponse };

