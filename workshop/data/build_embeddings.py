#!/usr/bin/env python3
"""
Z mmCIF souborů ve structures/ spočítá jednoduchý 16D deskriptor z CA atomů
(geometrie, ne Zernike jako v produkčním AlphaFindu) a zapíše toy_embeddings.csv.

Spuštění z této složky (data/):
  python build_embeddings.py
"""
from __future__ import annotations

import csv
import math
import re
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
STRUCT = HERE / "structures"
OUT_CSV = HERE / "toy_embeddings.csv"


def parse_ca_coords(path: Path) -> np.ndarray:
    """Vrátí (N, 3) souřadnic CA z jednoho mmCIF; prázdné pole při chybě."""
    text = path.read_text(encoding="utf-8", errors="replace").splitlines()
    i = 0
    while i < len(text):
        if text[i].strip() == "loop_" and i + 1 < len(text) and text[i + 1].startswith("_atom_site."):
            tags: list[str] = []
            j = i + 1
            while j < len(text) and text[j].startswith("_atom_site."):
                tags.append(text[j].strip())
                j += 1
            try:
                ix = tags.index("_atom_site.Cartn_x")
                iy = tags.index("_atom_site.Cartn_y")
                iz = tags.index("_atom_site.Cartn_z")
                ia = tags.index("_atom_site.label_atom_id")
            except ValueError:
                i = j + 1
                continue
            coords: list[list[float]] = []
            while j < len(text):
                line = text[j].strip()
                if not line or line.startswith("#") or line.startswith("loop_") or line.startswith("_"):
                    break
                if line.startswith("ATOM") or line.startswith("HETATM"):
                    parts = line.split()
                    if len(parts) <= max(ix, iy, iz, ia):
                        j += 1
                        continue
                    if parts[ia] != "CA":
                        j += 1
                        continue
                    coords.append([float(parts[ix]), float(parts[iy]), float(parts[iz])])
                j += 1
            if coords:
                return np.asarray(coords, dtype=np.float64)
        i += 1
    return np.zeros((0, 3), dtype=np.float64)


def accession_from_filename(name: str) -> str:
    m = re.match(r"AF-([A-Z0-9]+)-F\d+-model_v\d+\.cif", name, re.I)
    if m:
        return m.group(1)
    return Path(name).stem


def descriptor_from_ca(X: np.ndarray) -> np.ndarray:
    """16 čísel z CA matic (N,3); stabilní i pro malá N."""
    if X.shape[0] == 0:
        return np.zeros(16, dtype=np.float64)
    n = X.shape[0]
    c = X.mean(axis=0)
    Xc = X - c
    rg = float(np.sqrt(np.mean(np.sum(Xc**2, axis=1))))
    rg = max(rg, 1e-6)
    cov = np.cov(Xc.T)
    w, _ = np.linalg.eigh(cov)
    w = np.sort(w)[::-1][:3]
    while len(w) < 3:
        w = np.append(w, 0.0)
    span = (X.max(axis=0) - X.min(axis=0)).astype(np.float64)
    std = Xc.std(axis=0)
    # první tři vlastní čísla kovariance (tvar elipsoidu)
    ev = np.asarray(w, dtype=np.float64)
    feats = [
        math.log1p(n),
        c[0] / 50.0,
        c[1] / 50.0,
        c[2] / 50.0,
        math.log1p(rg),
        span[0] / rg,
        span[1] / rg,
        span[2] / rg,
        std[0] / rg,
        std[1] / rg,
        std[2] / rg,
        ev[0] / (rg**2 + 1e-6),
        ev[1] / (rg**2 + 1e-6),
        ev[2] / (rg**2 + 1e-6),
        float(np.mean(np.linalg.norm(Xc, axis=1)) / rg),
        float(np.percentile(np.linalg.norm(Xc, axis=1), 90) / rg),
    ]
    return np.asarray(feats, dtype=np.float64)


def main() -> None:
    if not STRUCT.is_dir():
        raise SystemExit(f"Chybí složka {STRUCT}")
    rows: list[dict[str, str | float]] = []
    for cif in sorted(STRUCT.glob("*.cif")):
        acc = accession_from_filename(cif.name)
        X = parse_ca_coords(cif)
        vec = descriptor_from_ca(X)
        row: dict[str, str | float] = {"id": acc}
        for k in range(16):
            row[f"f{k}"] = float(vec[k])
        rows.append(row)

    fields = ["id"] + [f"f{i}" for i in range(16)]
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"Zapsáno {len(rows)} řádků do {OUT_CSV.name}")


if __name__ == "__main__":
    main()
