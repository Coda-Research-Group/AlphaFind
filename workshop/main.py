"""
Mini AlphaFind – workshop Poznej FI.

Doplň tělo funkcí podle STUDENTI_KROKY.md (kroky 1–7).
Spuštění: python main.py  (na Replitu výchozí Run z .replit)
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

FEATURE_COLS = [f"f{i}" for i in range(16)]
DATA_CSV = Path("data") / "toy_embeddings.csv"


def load_embeddings(csv_path: Path | None = None) -> pd.DataFrame:
    """Krok 1: načti tabulku embeddingů (sloupce id, f0…f15)."""
    path = csv_path or DATA_CSV
    return pd.read_csv(path)


def baseline_topk(df: pd.DataFrame, query_id: str, k: int) -> pd.DataFrame:
    """Krok 2: Top‑k nejbližších podle eukleidovské vzdálenosti ve f0…f15; bez řádku dotazu. Výstup: id, distance."""
    raise NotImplementedError("Doplň v kroku 2")


def fit_kmeans_model(df: pd.DataFrame, n_clusters: int = 3) -> Any:
    """Krok 3a: natrénuj KMeans na matici feature; vrať model (např. sklearn.cluster.KMeans)."""
    raise NotImplementedError("Doplň v kroku 3a")


def attach_clusters_and_write_buckets(df: pd.DataFrame, kmeans: Any, out_dir: Path | None = None) -> pd.DataFrame:
    """Krok 3b: přidej sloupec cluster; ulož data/bucket_0.csv … nebo drž bucket DataFramy v paměti."""
    raise NotImplementedError("Doplň v kroku 3b")


def search_routed(df_with_clusters: pd.DataFrame, kmeans: Any, query_id: str, k: int) -> pd.DataFrame:
    """Krok 3c: cluster dotazu → kNN jen v příslušném bucketu. Výstup: id, distance."""
    raise NotImplementedError("Doplň v kroku 3c")


def rerank_candidates(df: pd.DataFrame, query_id: str, candidate_ids: list[str]) -> pd.DataFrame:
    """Krok 4: přehodnoť malou sadu kandidátů (např. kosinus). Výstup: id, cosine_distance."""
    raise NotImplementedError("Doplň v kroku 4")


def plot_results_pca(
    df: pd.DataFrame,
    query_id: str,
    neighbor_ids: list[str],
    out_path: Path | None = None,
) -> None:
    """Krok 5 (volitelné): PCA 2D, ulož např. viz.png."""
    raise NotImplementedError("Doplň v kroku 5, pokud děláš graf")


def reflexe_text() -> str:
    """Krok 6: krátké odpovědi na otázky z zadání; můžeš vrátit string nebo psát mimo kód."""
    raise NotImplementedError("Doplň v kroku 6 (nebo nech prázdné)")


def bonus_faiss_topk(X: Any, query_vec: Any, k: int) -> list[int]:
    """Krok 7 (volitelné): FAISS IndexFlatL2 → indexy sousedů."""
    raise NotImplementedError("Doplň v kroku 7, pokud instaluješ faiss-cpu")


def main() -> None:
    print(f"Načítám {DATA_CSV} …")
    df = load_embeddings()
    print("shape:", df.shape, "| sloupce:", list(df.columns[:6]), "…")
    print("---")
    print("OK: závislosti a cesty k datům fungují.")
    print("Pokračuj podle STUDENTI_KROKY.md (kroky 2–7) – doplň funkce v main.py výše.")
    print("Záložní prompty: prompts/ZALOZNI_PROMPTY.md")


if __name__ == "__main__":
    main()
