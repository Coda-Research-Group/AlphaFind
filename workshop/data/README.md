# Data workshopu

## Obsah složky

| Cesta | Popis |
|--------|--------|
| **`structures/*.cif`** | Surové **AlphaFold mmCIF** modely (malá podmnožina z tréninkových dat projektu). Názvy: `AF-<accession>-F1-model_v3.cif`. |
| **`toy_embeddings.csv`** | Tabulka **embeddingů** ve smyslu workshopu: jeden řádek = jeden protein (`id` = accession bez prefixu `AF-`), sloupce `f0`…`f15` jsou **16D deskriptor spočítaný z CA souřadnic** (geometrie). **Není** to stejný výpočet jako Zernike momenty v produkčním AlphaFindu – slouží k výuce pipeline podobnosti. |
| **`toy_queries.txt`** | Pár příkladových `id` pro kontrolu / peer review. |
| **`build_embeddings.py`** | Skript pro **přegenerování** `toy_embeddings.csv` ze všech souborů ve `structures/`. Spuštění z této složky: `python build_embeddings.py` (potřebuješ `numpy`). |

## Propojení id ↔ soubor struktury

Pro řádek s `id` = `A0A023H2U3` najdeš strukturu v souboru:

`structures/AF-A0A023H2U3-F1-model_v3.cif`

(Občas se liší číslo modelu v názvu – v téhle sadě jsou všechny soubory `F1-model_v3`.)

## Licence

Struktury pocházejí z **AlphaFold DB** – při dalším použití respektuj [podmínky EBI AlphaFold](https://alphafold.ebi.ac.uk/download).
