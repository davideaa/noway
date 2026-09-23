# Sessione locale: Claude Code che usa MetaTrader da solo

Scritto il 2026-09-23 per la sessione che girerà **sul computer di
Davide**, non nel cloud. Chi la apre legge prima `docs/CONTINUA-QUI.md`,
poi `docs/metodo.md`, poi `docs/fx-pullback.md` (lo stato della ricerca su
USDJPY), poi questo.

## Cosa deve fare

Trovare una strategia USDJPY con edge vero, seguendo `docs/metodo.md`.
Obiettivo di Davide: **almeno 365 operazioni all'anno** sul conto forex,
long **e** short in utile, niente filtri su ore o giorni.

**I dati si usano così, e non si discute:**
- **dentro campione: 2019.01.01 – 2022.12.31.** Ogni prova, ogni
  ottimizzazione, ogni idea si misura solo qui;
- **fuori campione: 2023.01.01 – 2026.09.** Non si guarda, nemmeno per
  sbaglio, finché la strategia non è finita: regole, uscite, rischio e
  Monte Carlo. Poi si guarda **una volta sola**.

**Ogni configurazione provata si scrive nel registro** di
`docs/fx-pullback.md` (il K). Provare tanto è permesso: il prezzo è che la
soglia del t sale, `radice(2 × ln K)`. Lanciare mille prove e tenere la
migliore senza contarle è esattamente l'errore che il progetto evita.

## Come si fa girare il tester da riga di comando

Sul **PC Windows** è la strada più affidabile: MetaTrader gira nativo.
Sul Mac MetaTrader è dentro Wine, e la riga di comando passa da lì
(`wine`, con la cartella di MetaTrader dentro
`~/Library/Application Support/net.metaquotes.wine.metatrader5/`): si può,
ma va verificato sul campo.

**Compilare un EA:**

```
metaeditor64.exe /compile:"<cartella dati>\MQL5\Experts\FxTrendPullback.mq5" /log
```

Il risultato è nel `.log` accanto al file: deve dire `0 errors`.

**Lanciare un test:** un file `.ini` e un comando.

```
[Tester]
Expert=FxTrendPullback.ex5
Symbol=USDJPY
Period=H1
Model=4
FromDate=2019.01.01
ToDate=2022.12.31
Deposit=10000
Currency=USD
Leverage=100
Optimization=0
ExpertParameters=fx_001.set
Report=reports\fx_001
ReplaceReport=1
ShutdownTerminal=1
```

```
terminal64.exe /config:"C:\percorso\fx_001.ini"
```

- `Model`: 0 ogni tick, 1 un minuto OHLC, 2 solo aperture, 4 **tick reali**
  (quello che vuole Davide per i test veri; per esplorare va bene l'1).
- `ExpertParameters`: un `.set` in `MQL5\Profiles\Tester\`, uno per
  configurazione, così ogni prova è riproducibile.
- `Report`: il report HTML finisce nella cartella dati del terminale.
  Si legge con `tools/dati_validazione.py` (`leggi()`), come tutti gli
  altri.
- Con `ShutdownTerminal=1` il terminale si chiude a fine test: la
  sessione può lanciarne un altro. Il MetaTrader aperto a mano va chiuso
  prima, o si usa una seconda installazione solo per i test.
- **`ToDate` non va mai oltre il 2022-12-31** finché non si fa il test
  finale.

## Cosa si è già imparato (non rifarlo)

- **Il ritracciamento nel trend su H1** (`FxTrendPullback`, valori a
  priori) perde: 1.433 operazioni, −0,11 R, t −4,4, long e short
  negativi. Il difetto è l'ingresso. Registro #1 in `docs/fx-pullback.md`.
- **La strategia USDJPY di Algory** non è verificabile: opera solo dal
  2021-01-22 e ha un filtro orario 15-18. `docs/criteri-usdjpy-h1.md`.
- **La foto di Algory** (10 operazioni, agosto-settembre 2026) suggerisce:
  entrate a favore del movimento, target variabile, uscita a tempo sulle
  perdite. Dieci operazioni non dimostrano niente.
- Lo spread di USDJPY su PUPrime costa circa 0,05 R con stop di ~23 pip:
  gli stop stretti su H1 partono già svantaggiati.
