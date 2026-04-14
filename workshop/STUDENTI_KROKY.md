# Kroky workshopu (~90 minut)

Pracuj v **kořeni projektu** – adresáři, kde máš `data/`, `main.py` a další soubory z balíčku. Na **Replitu** je to po nahrání ZIPu obvykle **kořen Replu** (ne podsložka `workshop/`). Všechny cesty piš relativně odtud (např. `data/toy_embeddings.csv`).

Šablona funkcí je v **`main.py`** – doplňuj těla funkcí podle kroků níže (signatury už jsou připravené).

Složka **`data/`** obsahuje **surové struktury** (`structures/*.cif` – AlphaFold modely) i tabulku **`toy_embeddings.csv`** (řádek = jeden protein, `id` odpovídá accession v názvu souboru; viz [data/README.md](data/README.md)).

**Minimální výstup:** funkce nebo skript, který pro zadané `id` vrátí **Top‑k** podobných řádků a výsledky **vyjádří** (např. výpis tabulky do konzole nebo uložení do CSV). Graf (např. PCA + **matplotlib**) je **volitelný**, ale často pomůže při prezentaci nebo při práci na Replitu (`viz.png`).

---

## Krok 1 – prostředí a načtení dat (cca 5 min)

**Doporučení z organizátorů: [Replit](https://replit.com)** – vše v prohlížeči, sdílení odkazem. Postup v [README_STUDENT.md](README_STUDENT.md). Soubor **`.replit`** nastavuje výchozí příkaz `python main.py`.

**Alternativa – lokálně:** terminál v kořenové složce projektu (tam, kde je `data/`), venv + `pip install -r requirements-workshop.txt` (nebo `pip install -r requirements.txt`).

Ověř načtení CSV (v `main.py` je už hotová funkce **`load_embeddings()`** – spusť `python main.py`):

```python
import pandas as pd
df = pd.read_csv("data/toy_embeddings.csv")
print(df.shape, df.columns[:5].tolist())
```

Sloupce `f0`…`f15` jsou tvůj „embedding“; `id` je identifikátor řádku (hrajeme roli **proteinu**).

---

## Krok 2 – baseline podobnost (cca 18 min)

**Cíl:** v `main.py` doplň **`baseline_topk`**: pro zadané `query_id` najdi **k** nejbližších jiných řádků podle eukleidovské vzdálenosti vektoru `[f0,…,f15]`.

- Vzdálenost můžeš počítat ručně z NumPy, nebo použít `sklearn.metrics.pairwise_distances`, nebo `sklearn.neighbors.NearestNeighbors`.
- Nezapomeň vyloučit z výsledků **samotný dotaz** (vzdálenost 0 k sobě).
- Vypiš tabulku: `id`, vzdálenost (nebo podobnost).

**Kontrolní otázka:** proč je u milionů záznamů špatný nápad spočítat vzdálenost ke **všem** pokaždé?

---

## Krok 3 – shluky a „bucket“ myšlenka (cca 22 min)

**Cíl:** doplň **`fit_kmeans_model`**, **`attach_clusters_and_write_buckets`** a **`search_routed`**.

1. Natrénuj **K-means** (např. `k=3`) na matici feature vektorů. Každému řádku přiřaď `cluster` (0, 1, 2).
2. **Zjednodušené bucketování:** pro každý cluster ulož jen řádky toho clusteru do samostatného souboru, např. `data/bucket_0.csv`, `bucket_1.csv`, `bucket_2.csv` (nebo drž v paměti tři tabulky).

**Vyhledávání ve dvou krocích:**

1. Zjisti cluster dotazu (predict z K-means).
2. Spusť kNN **jen uvnitř** souboru/bucketu toho clusteru (případně přidej i sousední cluster jako bonus).

**Kontrolní otázka:** kdy může „hledat jen ve vlastním bucketu“ **minout** dobré výsledky?

---

## Krok 4 – druhá fáze (cca 17 min)

**Cíl:** doplň **`rerank_candidates`**: vyber si **3–5 kandidátů** z rychlé fáze (bucket) a znovu je seřaď podle stejné nebo jiné metriky (např. kosinusová vzdálenost, nebo znovu eukleid, ale jen na té malé množině).

Porovnej pořadí s baseline z **kroku 2** (alespoň u jednoho `query_id`).

**Kontrolní otázka:** co v AlphaFindu dělá podobnou roli „přesnější druhé kolo“? (Nápověda: [KAM_TO_PATRI.md](KAM_TO_PATRI.md).)

---

## Krok 5 – vizualizace (doporučeno / volitelně, cca 15 min)

**Cíl (nad rámec minima):** doplň **`plot_results_pca`** – graf nebo jiný přehledný výstup (např. PCA scatter z `f0`…`f15` s vyznačeným dotazem a top výsledky; **matplotlib**, uložení `viz.png` na Replitu se hodí k náhledu souboru).

- V **`main()`** můžeš po výpočtech zavolat své funkce a vytisknout tabulku; graf je bonus.
- **Volitelně:** 3D struktura v prohlížeči – **[molstar_demo/](molstar_demo/)** (Mol* + PDB; návod v `molstar_demo/README.md`). Není propojená s toy CSV, ale doplňuje motiv AlphaFindu.

---

## Krok 6 – reflexe (cca 10 min)

**Cíl:** doplň **`reflexe_text()`** nebo zapiš odpovědi mimo kód – 3–5 vět:

- Co tvoje řešení **zrychlilo** oproti baseline?
- Co mohlo **zhoršit kvalitu** výsledků?
- K čemu slouží halucinace u AI asistenta při kódování a jak ses jim vyhnul/a?

---

## Krok 7 – volitelný bonus

- Doplň **`bonus_faiss_topk`** s **FAISS** (`faiss-cpu`) místo sklearn kNN na stejných datech.
- Spusť **[molstar_demo/](molstar_demo/)** a podívej se na 3D model (viz README ve složce).
- Nebo interaktivní výběr dotazu v `main.py` (`input()` / argument příkazové řádky).
- Nebo filtr výsledků podle clusteru.

---

## Odkazy mimo složku (volitelné)

- Web AlphaFind: [alphafind.fi.muni.cz](https://alphafind.fi.muni.cz)
- Mapování pojmů: [KAM_TO_PATRI.md](KAM_TO_PATRI.md)
- Záložní prompty: [prompts/ZALOZNI_PROMPTY.md](prompts/ZALOZNI_PROMPTY.md)
