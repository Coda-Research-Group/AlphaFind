"""Referenční řešení workshopu – jen pro lektora (neposílat studentům jako hotový úkol)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import pairwise_distances
from sklearn.neighbors import NearestNeighbors

WORKSHOP_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = WORKSHOP_ROOT / "data" / "toy_embeddings.csv"
FEATURE_COLS = [f"f{i}" for i in range(16)]


def load_embeddings(path: Path | None = None) -> pd.DataFrame:
    path = path or DATA_PATH
    df = pd.read_csv(path)
    missing = [c for c in FEATURE_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Chybí sloupce: {missing[:5]}…")
    return df


def baseline_topk(df: pd.DataFrame, query_id: str, k: int = 10) -> pd.DataFrame:
    if query_id not in set(df["id"]):
        raise KeyError(f"Neznámé id: {query_id}")
    X = df[FEATURE_COLS].to_numpy(dtype=np.float64)
    ids = df["id"].to_numpy()
    q_mask = ids == query_id
    q_vec = X[q_mask][0]
    dists = np.linalg.norm(X - q_vec, axis=1)
    order = np.argsort(dists)
    out_rows = []
    for idx in order:
        if ids[idx] == query_id:
            continue
        out_rows.append({"id": ids[idx], "distance": float(dists[idx])})
        if len(out_rows) >= k:
            break
    return pd.DataFrame(out_rows)


def fit_kmeans(df: pd.DataFrame, n_clusters: int = 3, random_state: int = 42) -> KMeans:
    X = df[FEATURE_COLS].to_numpy(dtype=np.float64)
    km = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    km.fit(X)
    return km


def attach_clusters(df: pd.DataFrame, km: KMeans) -> pd.DataFrame:
    out = df.copy()
    X = out[FEATURE_COLS].to_numpy(dtype=np.float64)
    out["cluster"] = km.predict(X)
    return out


def write_buckets(df: pd.DataFrame, out_dir: Path | None = None) -> None:
    out_dir = out_dir or (WORKSHOP_ROOT / "data")
    out_dir.mkdir(parents=True, exist_ok=True)
    for c in sorted(df["cluster"].unique()):
        part = df[df["cluster"] == c].drop(columns=["cluster"])
        part.to_csv(out_dir / f"bucket_{int(c)}.csv", index=False)


def search_routed(df: pd.DataFrame, km: KMeans, query_id: str, k: int = 10) -> pd.DataFrame:
    df_c = attach_clusters(df, km)
    row = df_c.loc[df_c["id"] == query_id]
    if row.empty:
        raise KeyError(query_id)
    c = int(row["cluster"].iloc[0])
    sub = df_c[df_c["cluster"] == c].reset_index(drop=True)
    Xs = sub[FEATURE_COLS].to_numpy(dtype=np.float64)
    ids = sub["id"].to_numpy()
    q_vec = Xs[ids == query_id][0]
    dists = np.linalg.norm(Xs - q_vec, axis=1)
    order = np.argsort(dists)
    out_rows = []
    for idx in order:
        if ids[idx] == query_id:
            continue
        out_rows.append({"id": ids[idx], "distance": float(dists[idx])})
        if len(out_rows) >= k:
            break
    return pd.DataFrame(out_rows)


def rerank_cosine(df: pd.DataFrame, query_id: str, candidate_ids: list[str]) -> pd.DataFrame:
    X = df.set_index("id")[FEATURE_COLS].to_numpy(dtype=np.float64)
    all_ids = df["id"].tolist()
    id_to_row = {i: j for j, i in enumerate(all_ids)}
    q = X[id_to_row[query_id]].reshape(1, -1)
    cand_idx = [id_to_row[i] for i in candidate_ids if i in id_to_row and i != query_id]
    sub = X[cand_idx]
    # cosine distance from sklearn metric on (1+n, d) then take row 0
    stacked = np.vstack([q, sub])
    dmat = pairwise_distances(stacked, metric="cosine")[0, 1:]
    order = np.argsort(dmat)
    out = []
    for j in order:
        oid = all_ids[cand_idx[j]]
        out.append({"id": oid, "cosine_distance": float(dmat[j])})
    return pd.DataFrame(out)


def pca_2d(df: pd.DataFrame) -> tuple[np.ndarray, PCA]:
    X = df[FEATURE_COLS].to_numpy(dtype=np.float64)
    pca = PCA(n_components=2, random_state=42)
    xy = pca.fit_transform(X)
    return xy, pca


def neighbors_sklearn(df: pd.DataFrame, query_id: str, k: int = 10) -> pd.DataFrame:
    """Alternativa k ručnímu výpočtu – sklearn NearestNeighbors."""
    mask = df["id"] != query_id
    X = df.loc[mask, FEATURE_COLS].to_numpy(dtype=np.float64)
    ids = df.loc[mask, "id"].to_numpy()
    q = df.loc[df["id"] == query_id, FEATURE_COLS].to_numpy(dtype=np.float64)
    nn = NearestNeighbors(n_neighbors=k, metric="euclidean")
    nn.fit(X)
    dists, inds = nn.kneighbors(q, return_distance=True)
    return pd.DataFrame({"id": ids[inds[0]], "distance": dists[0]})


if __name__ == "__main__":
    df0 = load_embeddings()
    print("shape", df0.shape)
    q = df0["id"].iloc[0]
    print("baseline top 5 for", q)
    print(baseline_topk(df0, q, k=5))
    km = fit_kmeans(df0, n_clusters=3)
    df_c = attach_clusters(df0, km)
    print(df_c["cluster"].value_counts())
    write_buckets(df_c)
    print("routed", search_routed(df0, km, q, k=5).head())
    top = baseline_topk(df0, q, k=5)["id"].tolist()
    print(rerank_cosine(df0, q, top))
