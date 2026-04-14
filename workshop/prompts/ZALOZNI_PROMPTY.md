# Záložní prompty (vibe coding)

Všechny cesty piš **relativně ke kořeni projektu** – tam, kde v Replitu leží `data/`, `main.py` atd. (po nahrání ZIPu obvykle **kořen Replu**, ne podsložka `workshop/`). Nepoužívej importy z jiných repozitářů mimo tento balíček. Závislosti: `requirements.txt` nebo `requirements-workshop.txt` (stejný obsah).

Každý prompt můžeš vložit do AI nástroje jako **jeden blok**. Doplň konkrétní `k` nebo `query_id`, pokud chceš.

---

## Prompt A – načtení dat a baseline Top‑k

```
Pracuju v malém Python projektu. Kořen projektu je adresář, kde mám složku data/ a soubor data/toy_embeddings.csv (sloupce: id, f0 až f15).

Napiš funkci baseline_topk(df, query_id: str, k: int) -> pandas.DataFrame,
která vrátí k nejbližších řádků (podle eukleidovské vzdálenosti vektoru f0..f15)
k řádku s daným id, bez toho aby mezi výsledky byl sám dotaz.
Sloupce výstupu: id, distance.

Použij pandas, numpy a/nebo scikit-learn. Bez externích API.
Krátký příklad __main__ s jedním voláním.
```

---

## Prompt B – K-means a soubory bucketů

```
V kořeni projektu mám soubor data/toy_embeddings.csv (id, f0..f15).

1) Natrénuj sklearn.cluster.KMeans s n_clusters=3 na matici f0..f15.
2) Přidej sloupec cluster každému řádku.
3) Rozděl řádky do tří DataFrame podle cluster a ulož je jako:
   data/bucket_0.csv, data/bucket_1.csv, data/bucket_2.csv (bez indexu).

Napiš čistý Python skript bucket_train.py do kořene projektu (relativní cesty).
```

---

## Prompt C – vyhledávání přes bucket

```
Mám data/toy_embeddings.csv a soubory data/bucket_*.csv
a už natrénovaný KMeans uložený v paměti nebo přetrénuj v kódu.

Napiš funkci search_routed(df_all, kmeans_model, query_id, k) která:
1) Najde vektor dotazu a předpíše jeho cluster.
2) Načte jen příslušný bucket CSV a spočítá kNN jen uvnitř něj (k nejbližších, bez self-match).
3) Vrátí DataFrame s id a distance.

pandas + sklearn. Cesty relativní ke kořeni projektu.
```

---

## Prompt D – druhá fáze přehodnocení

```
Mám seznam kandidátských id (cca 5) a celé df s embeddingy.
Napiš funkci rerank_candidates(df, query_id, candidate_ids) která:
- vezme jen ty řádky,
- seřadí je podle kosinové vzdálenosti (sklearn.metrics.pairwise.cosine_distances nebo ručně)
- vrátí seřazený DataFrame s id a cosine_distance.

Dotazový řádek vyloučit z výsledků.
```

---

## Prompt E – vizualizace výsledků (krok 5, matplotlib, vhodné pro Replit)

```
V kořeni projektu chci soubor main.py.

- Načti data/toy_embeddings.csv (pandas).
- Zvol jeden query_id (proměnná QUERY_ID = "A0A023H2U3" nebo input() – musí být v tabulce).
- Spočítej top 10 nejbližších řádků podle eukleidovské vzdálenosti vektorů f0..f15 (numpy nebo sklearn), bez self-match.
- Vytiskni tabulku výsledků (id, distance) pomocí print nebo DataFrame.to_string().
- PCA (sklearn.decomposition.PCA, n_components=2) na všech řádcích f0..f15, scatter plot matplotlib:
  ostatní body šedě, dotaz červeně, top 10 zeleně, legenda.
- Ulož graf jako viz.png do kořene projektu (plt.savefig("viz.png", dpi=150)).

Jen lokální CSV (žádné volání cloud API pro data). Matplotlib stačí z pip balíčků.
```

---

## Prompt F – volitelný bonus FAISS

```
Mám matici X (n_samples, 16) float32 z toy_embeddings.
Napiš minimální příklad faiss.IndexFlatL2 a search pro k=5 nejbližších k jednomu query vektoru.
Komentář česky pro studenta, kdy má smysl FAISS vs. sklearn.
```

---

## Prompt G – Mol* demo na Replitu (volitelné)

```
Mám v projektu podsložku molstar_demo/ se soubory index.html a serve.py.
Vysvětli česky v komentáři v serve.py, proč musím spouštět server z adresáře molstar_demo (chdir).
Do README v jedné větce: na Replitu nastav Run na "python molstar_demo/serve.py" a otevři Webview.
Neupravuj index.html – jen dokumentaci kolem, pokud něco chybí.
```

---

## Tipy pro lektora

- U „uvíznutých“ studentů nejdřív **Prompt A + E** (funkční graf `viz.png` + tabulka je důležitější než dokonalý bucket).
- Když AI vygeneruje špatné cesty, připomeň: „vše je relativní ke **kořeni Replu / kořeni projektu** (tam, kde je `data/toy_embeddings.csv`)“.
