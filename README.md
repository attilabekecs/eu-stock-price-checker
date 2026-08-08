# EU Stock ár-ellenőrző

Excel-alapú EU Stock ár-összehasonlító, amely GitHub Pages-en és WD My Cloud PR2100 NAS alkalmazásként is futtatható.

## Mit csinál?

- Beolvassa az EU Stock Excel-listát közvetlenül a böngészőben; a feltöltött fájl nem kerül szerverre.
- Felismeri a készüléket, tárhelyet, állapotot és ÁFA-típust.
- Minden új lista feltöltésekor friss EUR/HUF piaci jegyzést kér le; ha bid/ask adat érhető el, azok középértékét használja.
- Standard VAT esetén a listaár × aktuális EUR/HUF árfolyam × 1,27, Marginal VAT esetén listaár × aktuális EUR/HUF árfolyam számítással dolgozik.
- Az állapot külön szűrhető.
- A saját vételi ár HUF-ban manuálisan megadható és a böngésző helyi tárhelyén megmarad.
- Az eredmény XLSX- vagy CSV-fájlként exportálható.

## Helyi futtatás

```bash
npm start
```

Alapértelmezett port a NAS-konfiguráció szerint: `8790`.

## Tesztek

```bash
npm test
```

## WD My Cloud PR2100 / OS 5

A NAS-integráció a `wd-my-cloud-app-template` mintáját követi. A release-csomag saját Node.js binárist tartalmaz, health checket használ, a frissítő pedig sikertelen telepítéskor rollbackel.

### Első közvetlen deploy

A repó gyökerében hozz létre egy nem verziózott `nas.target` fájlt a `nas.target.example` alapján, majd:

```bash
bash scripts/deploy.sh
bash scripts/install-auto-update.sh
```

Ezután az app a NAS `8790` portján érhető el.

### WD Alkalmazások menü

A WD OS 5 által elfogadott `.bin` csomag a NAS-on kapja meg a szükséges aláírást:

```bash
bash scripts/build-wd-bin.sh
bash scripts/install-wd-bin.sh
bash scripts/install-auto-update.sh
```

Telepítés után a WD **Alkalmazások** menüjében az `EU Stock ár-ellenőrző` jelenik meg, a konfigurációs oldal pedig a `8790` portra irányít.

### Release és automatikus frissítés

A `.github/workflows/release.yml` a `main` frissítésekor elkészíti az aktuális verzióhoz tartozó NAS release-csomagot. A NAS updater percenként ellenőrzi a GitHub Releases legújabb verzióját. Új NAS-verzió kiadásakor a `package.json` és a `version.json` verzióját együtt kell emelni.

A tartós adatok a `/shares/Volume_1/eu-stock-price-checker/data` könyvtárban maradnak frissítéskor.

## Ár-összehasonlítás

A különbség képlete: `saját vételi ár HUF − korrigált listaár HUF`. A nulla vagy pozitív eltérés `Keret alatt`, a negatív eltérés `Keret felett` értékelést jelent.

## Licenc

MIT
