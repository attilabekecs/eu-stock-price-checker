# EU Stock ár-ellenőrző

Nyilvános, statikus GitHub Pages alkalmazás az EU Stock listával azonos szerkezetű Excel-fájlok feldolgozására.

## Mit csinál?

- Beolvassa az első munkalap `Model` és `UnitPrice` oszlopát.
- Felismeri az Apple és Samsung készülékeket, valamint a tárhelyet, állapotot és ÁFA-típust.
- Az EUR-árat a Magyar Nemzeti Bank napi középárfolyamával HUF-ra váltja.
- Standard VAT esetén az EUR-listaárat az MNB árfolyama mellett 1,27-es ÁFA-szorzóval, Marginal VAT esetén további szorzó nélkül váltja HUF-ra.
- Soronként megadható a saját vételi ár HUF-ban.
- Megjeleníti a saját vételi ár és a korrigált listaár különbségét, majd `Keret alatt` vagy `Keret felett` értékelést ad.
- Csak a pozitív, számszerű árral rendelkező tételeket jeleníti meg és exportálja; a hibás, nulla vagy hiányzó árú sorokat elrejti.
- Teljes képernyős, a monitor szélességéhez igazodó táblázatos munkaterületet biztosít.
- Az eredményt XLSX- vagy CSV-fájlként exportálja.

Az Excel-fájl teljes feldolgozása a böngészőben történik; a feltöltött állomány nem kerül szerverre.

## Helyi futtatás

```bash
python3 -m http.server 8080 --directory public
```

Ezután nyisd meg a `http://localhost:8080` címet.

## Tesztek

```bash
npm test
```

## Árfolyamfrissítés

A `.github/workflows/update-rate.yml` munkanapokon lekéri az MNB aktuális EUR/HUF középárfolyamát, és frissíti a `public/data/exchange-rate.json` fájlt. Kézzel is futtatható:

```bash
npm run update-rate
```

## Ár-összehasonlítás

A különbség képlete: `saját vételi ár HUF − korrigált listaár HUF`. A nulla vagy pozitív eltérés `Keret alatt`, a negatív eltérés `Keret felett` értékelést jelent. A manuálisan megadott vételi árak az exportált XLSX- és CSV-fájlba is bekerülnek.

## Licenc

MIT
