import argparse
import logging
import os
from multiprocessing import Pool
from pathlib import Path
from time import time

import numpy as np
import pandas as pd
from tqdm import tqdm

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

np.random.seed(2023)

pd.options.mode.chained_assignment = None

DST_THRESHOLD = 20.0


def run(cif_path, output_path, granularity):
    """Calculate all protein descriptors

    Args:
        cif_path (str): path to CIF
        output_path (str): output file
        granularity (int): granularity of the descriptors
    """
    proteins = os.listdir(cif_path)
    proteins = [file for file in proteins if file.endswith(".cif")]
    LOG.info(f'Found {len(proteins)} proteins to create the embedding for')
    with Pool() as pool:
        results = []
        data = []
        index = []

        for protein in proteins:
            result = pool.apply_async(process_protein, (cif_path / protein, granularity))
            results.append(result)

        LOG.info("Processing started")
        t = time()
        data = [
            n for sublist in [result.get()['data'] for result in tqdm(results, total=len(proteins))] for n in sublist
        ]
        index = [n for sublist in [result.get()['index'] for result in results] for n in sublist]
        df = pd.DataFrame(index=index, data=data)
        df.to_pickle(Path(output_path))
        t = time() - t
        LOG.info(f'Processing took {t:.1f} seconds')
        LOG.info(f'Output saved to {output_path}')


def process_protein(protein, granularity):
    """Create protein descriptor from file

    Args:
        protein (Path): path to protein file
        granularity (int): descriptor granularity
        fstart (_type_): filename protein id start index
        fend (_type_): filename protein id end index

    Returns:
        dict: protein chain id and the descriptor
    """
    protein_chains = read_and_extract(protein, granularity)

    data_list = []
    index_list = []
    for chain, df in protein_chains:
        desc = create_descriptor(df, granularity)
        data_list.append(desc)
        index_list.append(f"{str(protein).split('/')[-1].split('-')[1].upper()}")
    return {'index': index_list, 'data': data_list}


def create_descriptor(chain_df, granularity):
    """Create protein descriptor from extracted data

    Args:
        chain_df (DataFrame): extracted protein data
        granularity (int): granularity of the descriptor
    """

    def compute_matrix(row):
        dist = np.linalg.norm(
            np.array([row['x_x'], row['y_x'], row['z_x']]) - np.array([row['x_y'], row['y_y'], row['z_y']])
        )
        return (DST_THRESHOLD - dist) / DST_THRESHOLD if dist <= DST_THRESHOLD else 0.0

    chain_df['key'] = 0
    chain_df = chain_df.sort_values('normalized_rs')
    chain_df = pd.merge(chain_df, chain_df, on='key', how='left')
    chain_df['dist'] = chain_df.apply(lambda row: compute_matrix(row), axis=1)

    chain_df = chain_df.pivot(index='normalized_rs_x', columns='normalized_rs_y', values='dist')
    nparray = chain_df.to_numpy(dtype='float16')
    shape = nparray.shape[0]
    nparray = np.pad(nparray, (0, granularity - shape), "constant")
    nup = nparray[np.triu_indices(nparray.shape[0], k=1)]
    return nup


def read_and_extract(protein_file, granularity):  # noqa: C901
    """Extract protein descriptor data from PDB gz file

    Args:
        protein_file (str): path to protein file
        granularity (int): descriptor granularity
    """

    def remap(n, min_, max_):
        if max_ - min_ >= granularity:
            return int((n - min_) / (max_ - min_) * (granularity - 1)) + 1
        return n - min_ + 1

    df = pd.DataFrame(columns=['atom', 'residue', 'chain', 'residue_sequence', 'x', 'y', 'z'])

    atoms = []
    residues = []
    chains = []
    residue_sequences = []
    xs = []
    ys = []
    zs = []

    with open(protein_file, 'rt') as file:
        model = True
        for line in file:
            words = line.split()
            if len(words) == 0:
                continue
            if model and line[0:4] == "ATOM":
                atoms.append(words[3])
                residues.append(words[5])
                chains.append(words[6])
                if words[6] != "A":
                    print("Chain is not A")
                residue_sequences.append(words[8])
                xs.append(words[10])
                ys.append(words[11])
                zs.append(words[12])

    if len(residue_sequences) == 0:
        return []

    coded_residue_sequences = []
    index = 1
    last = residue_sequences[0]
    for rs in residue_sequences:
        if rs == last:
            coded_residue_sequences.append(index)
        else:
            index += 1
            coded_residue_sequences.append(index)
            last = rs

    df = pd.DataFrame(
        {
            'atom': atoms,
            'residue': residues,
            'chain': chains,
            'residue_sequence': coded_residue_sequences,
            'x': xs,
            'y': ys,
            'z': zs,
        }
    )
    df = df.astype({'residue_sequence': int, 'x': float, 'y': float, 'z': float})
    chains = df['chain'].unique()
    tables = []
    for chain in chains:
        table = df[df["chain"] == chain]
        min_ = np.min(table["residue_sequence"])
        max_ = np.max(table["residue_sequence"])
        table.loc[:, "normalized_rs"] = table.loc[:, "residue_sequence"].apply(lambda x: remap(x, min_, max_))
        table = table.drop(['residue_sequence'], axis=1)
        table = table.groupby(['chain', 'normalized_rs'])
        table = table[["x", "y", "z"]].mean().reset_index()
        table = table.sort_values(['chain', 'normalized_rs'])
        tables.append((chain, table))
    return tables


"""
Script for creating protein descriptors from CIF files.
Used in AlphaFind to create the protein descriptors used in building an index and fast searching.

Input: Directory containing CIF files
Output: Pickle file containing the protein descriptors

EXAMPLE USE:
python3 create-embedding.py --input=./data/cifs --output=./data/embedding.pkl --granularity 10
"""
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, required=True, help="Path to the directory containing CIF files")
    parser.add_argument("--output", type=str, required=True, help="Path to the output file")
    parser.add_argument(
        "--granularity", type=int, required=False, default=10, help="How detailed should the descriptor be"
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    assert input_path.exists()

    run(input_path, output_path, args.granularity)
