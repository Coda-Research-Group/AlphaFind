import argparse
import gc
import logging
import math
from typing import Dict, List

import pandas as pd

from utils import create_dir, load_dataset, save_json, save_pickle, write_row_to_csv


def construct_metadata_dict(
    chunk_size: int,
    n_proteins: tuple,
    orig_emb_files_used: list,
    modified_emb_files: list,
    output_chunk_size: int,
) -> Dict:
    d = {}
    d['chunk_size'] = chunk_size
    d['n_proteins'] = n_proteins
    d['orig_emb_files_used'] = orig_emb_files_used
    d['modified_emb_files'] = modified_emb_files
    d['output_chunk_size'] = output_chunk_size
    return d


def split_dataframe(df: pd.DataFrame, chunk_size=10000) -> List[pd.DataFrame]:
    """
    Splits a dataframe into chunks of size `chunk_size`.
    Adapted from https://stackoverflow.com/a/28882020
    """
    chunks = list()
    num_chunks = math.ceil(len(df) / chunk_size)
    for i in range(num_chunks):
        chunks.append(df[i * chunk_size : (i + 1) * chunk_size])
    return chunks


"""
Script used to randomize the AlphaFold dataset (214M) into chunks of 1M proteins
with random order of proteins in each chunk.
"""
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input-path', type=str, required=True, help='Directory with the non-randomized embedding files'
    )
    parser.add_argument('--output-path', type=str, required=True, help='Output directory for the randomized files')
    parser.add_argument('--chunk-size', type=int, default=50_000_000)
    parser.add_argument('--output-chunk-size', type=int, default=1_000_000)
    parser.add_argument('--dataset-size', type=int, default=214_000_000)
    args = parser.parse_args()

    LOG = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')
    LOG.info('Initialized run')
    create_dir(f'{args.output_path}/data')
    create_dir(f'{args.output_path}/metadata')

    pickle_files_used = []
    pickle_files_used_prev = []
    write_row_to_csv(f'{args.output_path}/metadata/sizes.csv', ['file', 'n_objects'])

    for i in range(math.ceil(args.dataset_size / args.chunk_size)):
        data, pickle_files_used = load_dataset(
            path=args.input_path,
            chunk_size=args.chunk_size,
            pickle_files_used=pickle_files_used,
            shuffle=True,
        )
        # randomly shuffle the dataframe (in place)
        data = data.sample(frac=1, random_state=2023)
        pickle_files_used_current = set(pickle_files_used).difference(set(pickle_files_used_prev))
        pickle_files_used_prev = pickle_files_used.copy()

        chunks_to_save = split_dataframe(data, chunk_size=args.output_chunk_size)
        saved_chunk_ids = []
        for ch_to_save_id, chunk_to_save in enumerate(chunks_to_save):
            # save
            save_pickle(f'/{args.output_path}/data/{i}-{ch_to_save_id}.pkl', chunk_to_save)
            save_pickle(f'/{args.output_path}/metadata/{i}-{ch_to_save_id}.pkl', chunk_to_save.index.values)
            write_row_to_csv(
                f'/{args.output_path}/metadata/sizes.csv',
                [f'{i}-{ch_to_save_id}.pkl', chunk_to_save.shape],
            )
            saved_chunk_ids.append(ch_to_save_id)

        d = construct_metadata_dict(
            args.chunk_size,
            data.shape,
            list(pickle_files_used_current),
            saved_chunk_ids,
            args.output_chunk_size,
        )
        save_json(f'/{args.output_path}/metadata/randomization-{i}.json', d)
        del data
        del chunks_to_save
        gc.collect()

    df = pd.read_csv(f'/{args.output_path}/metadata/sizes.csv')
    df = df.drop_duplicates()
    df['volume'] = df.n_objects.apply(lambda x: int(x.split(',')[0][1:]))
    df.to_csv(f'/{args.output_path}/metadata/sizes.csv', index=None)
