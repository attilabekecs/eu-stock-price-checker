const STORAGE_KEY = "eu-stock-price-checker.live-eurhuf.v1";
const YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/EURHUF=X?interval=1m&range=1d";

function normalizeYahooRate(payload) {
  const meta = payload?.chart?.result?.[0]?.meta;
  const rate = Number(meta?.regularMarketPrice);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Érvénytelen EUR/HUF piaci árfolyam érkezett.");

  const marketTime = Number(meta?.regularMarketTime);
  const retrievedAt = Number.isFinite(marketTime) && marketTime > 0
    ? new Date(marketTime * 1000).toISOString()
    : new Date().toISOString();

  return {
    base: "EUR",
    quote: "HUF",
    rate,
    retrievedAt,
    source: "Yahoo Finance",
    isCached: false,
  };
}

function readCachedRate(storage = globalThis.localStorage) {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    if (!parsed || parsed.base !== "EUR" || parsed.quote !== "HUF") return null;
    const rate = Number(parsed.rate);
    if (!Number.isFinite(rate) || rate <= 0 || !parsed.retrievedAt) return null;
    return { ...parsed, rate, isCached: true };
  } catch {
    return null;
  }
}

function saveCachedRate(rate, storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(rate));
  } catch {
    // A böngésző tárhelyének hibája ne akadályozza az oldal használatát.
  }
}

async function fetchYahooJson(fetcher, url) {
  const response = await fetcher(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function loadExchangeRate(fetcher = globalThis.fetch, storage = globalThis.localStorage) {
  const liveUrl = `${YAHOO_URL}&_=${Date.now()}`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(liveUrl)}`;

  for (const url of [liveUrl, proxyUrl]) {
    try {
      const rate = normalizeYahooRate(await fetchYahooJson(fetcher, url));
      saveCachedRate(rate, storage);
      return rate;
    } catch (error) {
      console.warn("Az élő EUR/HUF lekérés ezen az útvonalon nem sikerült.", error);
    }
  }

  const cached = readCachedRate(storage);
  if (cached) return cached;
  throw new Error("Az aktuális EUR/HUF piaci árfolyam most nem érhető el. Próbáld meg újra a lista feltöltését.");
}

export const exchangeRateInternals = Object.freeze({
  STORAGE_KEY,
  YAHOO_URL,
  normalizeYahooRate,
  readCachedRate,
});
