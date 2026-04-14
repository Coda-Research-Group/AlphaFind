# Mini AlphaFind – workshop Poznej FI

Tento balíček je **vše**, co potřebuješ: data, zadání a záložní prompty. Nemusíš mít celý repozitář AlphaFindu. Na Replitu ho rozbal do **kořene Replu** (soubory `data/`, `requirements.txt`, `main.py`, `.replit` … přímo v kořeni, ne do vnořené složky `workshop/`, pokud to organizátoři nechtějí záměrně).

**Po rozbalení ZIPu:** v kořeni Replu musíš **hned vidět** složku `data/` a soubor `main.py` (cesta má být `data/toy_embeddings.csv`, **ne** `nějaká_složka/data/...`). Špatně: kořen Replu obsahuje jen jednu podsložku a v ní až `data/`. Správně: `data/` leží na stejné úrovni jako `main.py`.

Organizátoři workshopu počítají s platformou **[Replit](https://replit.com)** (kód v prohlížeči, sdílení replu). Hlavní je **fungující vyhledávání** (Top‑k); graf nebo jiná vizualizace je podle zadání od lektora **volitelná** nebo doporučená.

## Rychlý start na Replitu

1. Založ **Python** Repl a nahraj **rozbalený obsah** tohoto balíčku do **kořene Replu** (drag-and-drop / ZIP tak, aby `data/` a `requirements.txt` byly hned v kořeni).
2. V kořeni Replu měj soubory jako u nás: složka `data/` s `toy_embeddings.csv`, podsložka `data/structures/` s ukázkovými `.cif`, `requirements.txt` (nebo `requirements-workshop.txt`), šablona **`main.py`**, soubor **`.replit`**. Popis dat: [data/README.md](data/README.md).
3. V záložce **Packages** (nebo v Shell) nainstaluj závislosti:

```bash
pip install -r requirements.txt
```

(případně `pip install -r requirements-workshop.txt` – obsah je stejný.)

4. **Run:** většinou stačí zelené tlačítko – `.replit` už má `python main.py`. Jiný příkaz nastav v nastavení Replu jen pokud víš proč.
5. Postupuj podle **[STUDENTI_KROKY.md](STUDENTI_KROKY.md)**. Pokud děláš graf, uložení `viz.png` přes `matplotlib` se na Replitu dobře kontroluje v souborech.

**Tip:** cesty k datům nech relativní vůči kořeni projektu (`data/toy_embeddings.csv`), stejně jako lokálně.

### Volitelně: 3D protein v prohlížeči (Mol*)

Ve složce **[molstar_demo/](molstar_demo/)** je jednoduchá stránka s **Mol\*** a modelem z PDB. Na Replitu spusť `python molstar_demo/serve.py` a otevři Webview; návod je v [molstar_demo/README.md](molstar_demo/README.md). Potřebuješ internet (CDN + PDB). Nesouvisí přímo s toy CSV, ale dobře doplňuje motiv AlphaFindu.

## Rychlý start lokálně (volitelné)

1. Otevři terminál **v kořenové složce projektu** (kde je `data/`).
2. Vytvoř virtuální prostředí a nainstaluj závislosti:

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

(`requirements-workshop.txt` je stejný obsah – použij jeden z nich.)

3. Postupuj podle **[STUDENTI_KROKY.md](STUDENTI_KROKY.md)**.
4. Když nevíš, co psát do AI nástroje, použij **[prompts/ZALOZNI_PROMPTY.md](prompts/ZALOZNI_PROMPTY.md)**.
5. K čemu má tvůj mini-projekt vztah k opravdovému AlphaFindu: **[KAM_TO_PATRI.md](KAM_TO_PATRI.md)** (odkazy na web a dokumentaci).

Hodně zdaru.
