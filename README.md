# EU Stock ár-ellenőrző

Nyilvános, statikus GitHub Pages alkalmazás az EU Stock listával azonos szerkezetű Excel-fájlok feldolgozására.

## Mit csinál?

- Beolvassa az első munkalap `Model` és `UnitPrice` oszlopát.
- Felismeri az Apple és Samsung készülékeket, valamint a tárhelyet, állapotot és ÁFA-típust.
- Az EUR-árat a Magyar Nemzeti Bank napi középárfolyamával HUF-ra váltja.
- Külön `Ár HUF-ban` és `Referencia HUF` oszlopot jelenít meg.
- Az azonos modell + tárhely + állapot + ÁFA-típus csoport mediánjához képest kedvező, átlagos vagy magas listán belüli árat jelez.
- A hibás, nulla vagy hiányzó árakat ellenőrzendőként jelöli.
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

## Árpozíció értelmezése

Az árpozíció kizárólag a feltöltött listán belüli összehasonlítás. Nem minősül magyar piaci értékbecslésnek. Külső piaci referencia nélkül az egyetlen összehasonlítható sort tartalmazó csoportok `Nincs összehasonlítás` állapotot kapnak.

## Licenc

MIT

