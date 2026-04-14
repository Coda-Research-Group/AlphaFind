# Mol* demo – 3D struktura v prohlížeči

Minimální stránka **[Mol\***](https://molstar.org/) (přes CDN) načte malý model z **RCSB PDB** (`1crn`). Slouží jako **volitelný doplněk** k workshopu: ukáže studentům, kam vizuálně směřuje AlphaFind (3D), zatímco hlavní úkol zůstává u **CSV embeddingů** a vyhledávání podobnosti.

## Požadavky

- **Internet** – skripty Mol* a data struktury se tahají z CDN / PDB.
- **Python** (jen kvůli vestavěnému HTTP serveru; samotný viewer je JavaScript v prohlížeči).

## Replit

1. V kořeni Replu měj `molstar_demo/` vedle `main.py` a `data/` (součást stejného ZIPu jako zbytek workshopu).
2. V nastavení **Run** zadej příkaz:

   ```bash
   python molstar_demo/serve.py
   ```

   (Na některých Replích je proměnná `PORT` už nastavená – skript ji použije.)

3. Otevři **Webview** / „Open in new tab“. Mělo by se zobrazit 3D okno Mol*.

**Když Replit napíše „Your app is not running“:** musí běžet příkaz `python molstar_demo/serve.py` (Run) a v konzoli nesmí být traceback – prázdný Webview často znamená spadlý proces nebo špatný Run příkaz.

Pokud Webview ukazuje prázdnou stránku i při běžícím serveru: v konzoli serveru je vypsaná URL `http://127.0.0.1:PORT/` – zkus ji v novém tabu lokálně; na Replitu ověř blokace skriptů / adblock a že Repl smí na internet (CDN + PDB).

## Lokálně

```bash
cd molstar_demo
python3 serve.py
```

(Příkaz spouštěj z kořene projektu; `cd molstar_demo` přejde do složky s `index.html`.)

Pak v prohlížeči otevři `http://127.0.0.1:8080/` (nebo port z výpisu).

## Úpravy (pro zvídavé)

- V `index.html` změň `viewer.loadPdb('1crn')` na jiný **PDB kód**.
- Načtení z URL (AlphaFold CIF) jde přes API vieweru, ale často narazíš na **CORS** – spolehlivější je začít s PDB z RCSB.

Dokumentace: [Mol* – instance / embedding](https://molstar.org/docs/plugin/instance/).
