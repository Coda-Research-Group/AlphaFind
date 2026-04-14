# Instrukce pro lektora – workshop Mini AlphaFind (Poznej FI)

Materiály jsou v **`workshop/`** tak, aby je šlo **rozdat samostatně** (studenti nemají celý monorepo AlphaFindu).

## Cíle (90 min)

Studenti pochopí datový tok **embedding → zúžení prostoru (shluky/buckety) → rychlé kNN → jednoduché přehodnocení** (a podle potřeby i **vizualizaci** výsledků), v paralele k produkčnímu AlphaFindu, bez Dockeru a bez bioinformatických binárek.

## Harmonogram (orientační)

| Čas | Obsah |
|-----|--------|
| 0–8 min | Úvod + **krok 1** (Replit, `python main.py`, ověření `load_embeddings` / dat). Ukázka [alphafind.fi.muni.cz](https://alphafind.fi.muni.cz); proč ne „for loop přes celou databázi“. |
| 8–26 min | Krok 2 – baseline Top‑k (`main.py`: `baseline_topk`). |
| 26–48 min | Krok 3 – K-means + bucket + `search_routed`. |
| 48–65 min | Krok 4 – druhá fáze / `rerank_candidates` + srovnání s krokem 2. |
| 65–80 min | Krok 5 – **volitelná / doporučená vizualizace** (`plot_results_pca`, např. `viz.png`). |
| 80–90 min | Krok 6 reflexe + dotazy (krok 7 bonus domů / čas navíc). |

Detailní kroky: [STUDENTI_KROKY.md](STUDENTI_KROKY.md).

## Balení zipů pro studenty

**Doporučený studentský balíček** (bez řešení):

- Celá složka `workshop/` **kromě** `reference/`  
  nebo z `reference/` smaž / neexportuj `reseni_minimalni.py`.
- Ať v zipu nechybí **`main.py`**, **`.replit`**, **`requirements.txt`** (a `requirements-workshop.txt` je volitelná duplicita).

Příklad z kořene repozitáře (macOS/Linux):

```bash
cd workshop
zip -r ../workshop-student.zip . -x 'reference/*'
```

**Učitelský balíček:** celá `workshop/` včetně `reference/`.

## Replit (primární prostředí)

- Připrav **šablonu Replu**. Studentům dej **rozbalený obsah** složky `workshop/` z repa **přímo do kořene Replu** (`data/`, `main.py`, `.replit`, `requirements.txt` … nahoře), ne jako vnořenou podsložku `workshop/` – prompty a zadání počítají s cestami `data/...` od kořene projektu. (V git monorepu zůstává složka `workshop/` kvůli struktuře repozitáře.)
- **`.replit`:** výchozí `run = "python main.py"` a Python **3.11** (stabilnější než úplně nové verze na Replitu).
- **`requirements.txt`:** duplicita závislostí kvůli auto-install na Replitu; obsah je sladěný s `requirements-workshop.txt`.
- Run command: přednastaveno; studenti doplňují těla funkcí v přiloženém `main.py`.
- Studenti typicky uvidí výstup v **Console**; při grafu i soubor **`viz.png`** v panelu souborů.
- Ověř školní síť: Replit a `pip install` musí projít; případně účty pod školou / domácí přístup.

### Volitelná ukázka Mol* (3D)

- Složka [molstar_demo/](molstar_demo/): `python molstar_demo/serve.py` + Webview. Vyžaduje **odchozí HTTPS** (jsDelivr, RCSB). Ověř před akcí na školní Wi‑Fi.
- Volitelná motivace / rozšíření pro rychlé studenty.

## Kontrola před akcí

- Python **3.10+** (Replit nebo lokálně).
- `pip install -r requirements-workshop.txt` funguje offline jen s předstaženým wheel cache; jinak zajisti internet nebo lokální PyPI mirror.
- Ověř izolaci: zkopíruj jen `workshop/` do prázdného adresáře nebo čistého Replu, spusť `python reference/reseni_minimalni.py`.

## Odkazy do plného kódu AlphaFindu (jen pro lektora)

Tyto cesty platí v **celém klonu** repozitáře, ne ve studentském zipu:

- Orchestrace tréninku / indexu: [training/train_alphafind.py](../training/train_alphafind.py)
- Logika vyhledávání (FAISS, buckety): [api/src/search.py](../api/src/search.py)
- Frontend výsledků: [ui/src/pages/ProteinSearch/](../ui/src/pages/ProteinSearch/)

## Referenční řešení (jen lektor)

Z adresáře `workshop/`:

```bash
source .venv/bin/activate
python reference/reseni_minimalni.py
```

Slouží k rychlému ověření, že data i závislosti sedí. Nepředávej studentům jako copy-paste bez práce.

## Časté problémy

- **Replit nenašel `data/toy_embeddings.csv`:** špatný kořen projektu – CSV a složka `data/structures/` musí být v `data/` vedle `main.py`.
- **Změna sady struktur:** po úpravě souborů ve `data/structures/` znovu vygeneruj embeddingy: `cd data && python build_embeddings.py` (numpy z workshop závislostí).
- **Graf se neukáže:** při použití matplotlib zkus `plt.savefig("viz.png")` a náhled souboru v Replitu.
- **Příliš pomalé:** naše CSV je malá; když studenti zvětší data, připomeň rozdíl mezi O(n) a indexovaným hledáním.
- **Blokovaný ChatGPT:** použijte tištěné [prompts/ZALOZNI_PROMPTY.md](prompts/ZALOZNI_PROMPTY.md); párování studentů.

## Bezpečnost a etika

- Nepasteovat osobní údaje do cloudových modelů.
- Připomenout [podmínky AlphaFold DB](https://alphafold.ebi.ac.uk/download) u reálných dat; toy data jsou vymyšlená čísla.
