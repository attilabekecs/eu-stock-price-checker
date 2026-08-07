import { FALLBACK_RATE } from "../config.js";

function isValidRate(payload) {
  return payload?.base === "EUR"
    && payload?.quote === "HUF"
    && Number.isFinite(Number(payload?.rate))
    && Number(payload.rate) > 0
    && /^\d{4}-\d{2}-\d{2}$/.test(payload?.date ?? "");
}

export async function loadExchangeRate(fetcher = globalThis.fetch) {
  try {
    const response = await fetcher(`./data/exchange-rate.json?cache=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!isValidRate(payload)) throw new Error("Érvénytelen árfolyamadat");
    return { ...payload, rate: Number(payload.rate), isFallback: false };
  } catch (error) {
    console.warn("Az MNB árfolyamfájl nem érhető el, tartalék árfolyam használata.", error);
    return FALLBACK_RATE;
  }
}

