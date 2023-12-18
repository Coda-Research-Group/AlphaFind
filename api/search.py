import argparse
import logging
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np
import pandas as pd
import torch

from model import NeuralNetwork, data_X_to_torch
from utils import dir_exists, file_exists, load_newest_file_in_dir, load_pickle

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

ProteinWithScores = Tuple[str, float, float]
ProteinWithEuclid = Tuple[str, float]

PROTEIN_ID_TO_POSITION_FILE_PATH = '/embeddings/data-structures/protein_id_to_position_index.pickle'

# Embeddings are grouped by the predicted class ID
embeddings: Dict[int, pd.DataFrame] = dict()

# protein_id -> (class_id, position_in_class_embeddings_df)
protein_id_to_position_mapping: Dict[str, Tuple[int, int]] = dict()

# The root model
root_model = None


def load_protein_id_to_position_mapping():
    global protein_id_to_position_mapping

    assert len(protein_id_to_position_mapping) == 0, 'Protein ID to position index mapping has already been loaded.'

    protein_id_to_position_mapping = load_pickle(PROTEIN_ID_TO_POSITION_FILE_PATH)


def load_model_to_cpu(name, model_type, n_classes, models_path, dimensionality):
    weights_to_load = f'{models_path}/{name}/chunk-20.pt'
    weights_to_load = (
        weights_to_load if file_exists(weights_to_load) else load_newest_file_in_dir(f'{models_path}/{name}')
    )

    if weights_to_load is not None:
        LOG.info(f'Loading model from weights: {weights_to_load}')
        nn = NeuralNetwork(dimensionality, n_classes, model_type=model_type)
        nn.model.load_state_dict(torch.load(weights_to_load, map_location=torch.device('cpu')))
    else:
        nn = NeuralNetwork(dimensionality, n_classes, model_type=model_type)

    return nn


def parse_protein_scores(line: str) -> ProteinWithScores:
    protein, tm_score, rmsd = line.split(' ')

    return (protein, float(tm_score), float(rmsd))


def format_protein_euclid(protein_ids, euclidean_distances) -> ProteinWithEuclid:
    return [(protein_ids[i], float(euclidean_distances[i])) for i in range(len(protein_ids))]


def search_fast(
    protein_id: str,
    k: int = 1_000,
    n_buckets_to_visit: int = 10,
) -> Tuple[List[ProteinWithEuclid], float]:
    search_time_start = time.time()

    assert len(embeddings) != 0, 'Embeddings have not been loaded.'
    assert len(protein_id_to_position_mapping) != 0, 'Protein ID to position mapping has not been created.'
    assert root_model is not None, 'Model has not been loaded.'

    LOG.info('Finding protein data based on the ID')
    s = time.time()
    try:
        class_id, protein_index = protein_id_to_position_mapping[protein_id]
        protein_data = embeddings[class_id].iloc[protein_index].values.reshape(1, -1)
    except KeyError:
        LOG.info(f'Protein ID {protein_id} not found in the database')
        return [], time.time() - search_time_start
    LOG.info(f'Found protein data in {time.time() - s} seconds')

    LOG.info('Predicting')
    s = time.time()
    _, predictions = root_model.predict_proba(data_X_to_torch(protein_data))
    LOG.info(f'Predicted in {time.time() - s} seconds')

    LOG.info('Searching for nearest neighbors in the buckets')
    s = time.time()
    bucket_ids_to_visit = predictions[0][:n_buckets_to_visit]

    LOG.info(' Visiting the buckets')
    s = time.time()
    knn_data = pd.DataFrame([])
    for bucket_id in bucket_ids_to_visit:
        _, indices = faiss.knn(protein_data, embeddings[bucket_id].to_numpy(), k)
        knn_data = pd.concat([knn_data, embeddings[bucket_id].iloc[indices[0]]])
    LOG.info(f' Visited the buckets in {time.time() - s} seconds')

    LOG.info(' Searching for nearest neighbors in the found data')
    s = time.time()
    # Keep only the k nearest neighbors
    distances, indices = faiss.knn(protein_data, knn_data.to_numpy(), k)
    knn_ids = knn_data.iloc[indices[0]].index.tolist()
    LOG.info(f' Searched for nearest neighbors in the found data in {time.time() - s} seconds')

    LOG.info(f'Searched for nearest neighbors in {time.time() - s} seconds')

    euclidean_distance = np.sqrt(distances)

    return format_protein_euclid(knn_ids, euclidean_distance[0]), time.time() - search_time_start


def get_queries_in_queue():
    """Returns a list of queries in the queue, sorted by the time they were added to the queue."""
    while True:
        try:
            return [f.stem for f in sorted(Path('/eph/queue').iterdir(), key=os.path.getmtime)]
        # Sometimes the file is not found, because it's being deleted by worker, taking care of that in a while loop
        except FileNotFoundError:
            LOG.info('FileNotFoundError, retrying in 1s')
            time.sleep(0.1)


def search(
    protein_id: str,
    offset: Optional[int] = 0,
    limit: Optional[int] = 50,
    k: int = 1_000,
    n_buckets_to_visit: int = 10,
) -> Tuple[List[ProteinWithScores], float]:
    search_time_start = time.time()

    assert len(embeddings) != 0, 'Embeddings have not been loaded.'
    assert len(protein_id_to_position_mapping) != 0, 'Protein ID to position mapping has not been created.'
    assert root_model is not None, 'Model has not been loaded.'

    LOG.info('Finding protein data based on the ID')
    s = time.time()
    try:
        class_id, protein_index = protein_id_to_position_mapping[protein_id]
        protein_data = embeddings[class_id].iloc[protein_index].values.reshape(1, -1)
    except KeyError:
        LOG.info(f'Protein ID {protein_id} not found in the database')
        return [], time.time() - search_time_start
    LOG.info(f'Found protein data in {time.time() - s} seconds')

    LOG.info('Predicting')
    s = time.time()
    _, predictions = root_model.predict_proba(data_X_to_torch(protein_data))
    LOG.info(f'Predicted in {time.time() - s} seconds')

    LOG.info('Searching for nearest neighbors in the buckets')
    s = time.time()
    bucket_ids_to_visit = predictions[0][:n_buckets_to_visit]

    LOG.info(' Visiting the buckets')
    s = time.time()
    knn_data = pd.DataFrame([])
    for bucket_id in bucket_ids_to_visit:
        _, indices = faiss.knn(protein_data, embeddings[bucket_id].to_numpy(), k)
        knn_data = pd.concat([knn_data, embeddings[bucket_id].iloc[indices[0]]])
    LOG.info(f' Visited the buckets in {time.time() - s} seconds')

    LOG.info(' Searching for nearest neighbors in the found data')
    s = time.time()

    # k + 1 because the first result can be the query protein itself
    _, indices = faiss.knn(protein_data, knn_data.to_numpy(), k + 1)
    knn_ids = knn_data.iloc[indices[0]].index.tolist()

    if protein_id in knn_ids:
        # Remove the query protein from the results
        knn_ids.remove(protein_id)

    # Keep only the k nearest neighbors
    knn_ids = knn_ids[:k]

    LOG.info(f' Searched for nearest neighbors in the found data in {time.time() - s} seconds')

    LOG.info(f'Searched for nearest neighbors in {time.time() - s} seconds')

    if offset is not None and limit is not None:
        knn_ids = knn_ids[offset : (offset + limit) if (offset + limit) < len(knn_ids) else len(knn_ids)]

    return knn_ids, time.time() - search_time_start


def setup_in_memory_data_structures(
    n_classes: int = 2000,
    name: str = (
        'l0--model-MLP5--batchsize-1000000--n_chunks-25--epochs-per-chunk-20--mem-50'
        '--n_classes-2000--sample_size-2000000--n_iterations-10--2023-10-21-21-36-27'
    ),
    model: str = 'MLP5',
    models_path: str = '/embeddings/data-structures/',
    bucket_data_path: str = '/embeddings/ng-granularity-10-randomized/bucket-data/',
) -> None:
    global root_model

    assert len(embeddings) == 0, 'Embeddings have already been loaded.'
    assert len(protein_id_to_position_mapping) == 0, 'Protein ID to position mapping has already been created.'
    assert root_model is None, 'Model has already been loaded.'

    LOG.info('Loading embeddings')
    s = time.time()
    for class_id in range(n_classes):
        embeddings[class_id] = load_pickle(f'{bucket_data_path}class-{class_id}.pkl')
    LOG.info(f'Loaded embeddings in {time.time() - s} seconds')

    LOG.info('Loading protein ID to position mapping')
    s = time.time()
    load_protein_id_to_position_mapping()
    LOG.info(f'Loading protein ID to position mapping in {time.time() - s} seconds')

    LOG.info('Loading model')
    s = time.time()
    data_dimensionality = embeddings[0].iloc[[0]].shape[1]
    root_model = load_model_to_cpu(name, model, n_classes, models_path, data_dimensionality)
    LOG.info(f'Loaded model in {time.time() - s} seconds')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Search for k nearest proteins.')
    parser.add_argument('--k', type=int, default=1_000, help='Number of nearest proteins to search for')
    parser.add_argument('--n-classes', type=int, default=2000, help='Number of classes to use')
    parser.add_argument('-m', '--model', type=str, default='MLP5', help='Model to use')
    parser.add_argument(
        '--name',
        default=(
            'l0--model-MLP5--batchsize-1000000--n_chunks-25--epochs-per-chunk-20--mem-50'
            '--n_classes-2000--sample_size-2000000--n_iterations-10--2023-10-21-21-36-27'
        ),
        help='Name of the model',
    )
    parser.add_argument(
        '--metadata-path', default='/embeddings/ng-granularity-10-randomized/metadata/', help='Path to the metadata'
    )
    parser.add_argument(
        '--bucket-data-path',
        default='/embeddings/ng-granularity-10-randomized/bucket-data/',
        help='Path to the bucket data',
    )
    parser.add_argument('--models-path', default='/embeddings/data-structures/', help='Path to the models')
    parser.add_argument('--protein-id', default='A0A346LI80', help='Protein ID to search the nearest neighbors for')
    parser.add_argument('--n-buckets-to-visit', type=int, default=10, help='Number of buckets to visit')
    args = parser.parse_args()

    assert dir_exists(args.metadata_path), f'Path {args.metadata_path} does not exist.'
    assert dir_exists(args.bucket_data_path), f'Path {args.bucket_data_path} does not exist.'
    assert dir_exists(args.models_path), f'Path {args.models_path} does not exist.'

    # Setup
    LOG.info('--- Setting up')
    start_setup_t = time.time()

    setup_in_memory_data_structures(args.n_classes, args.name, args.model, args.models_path, args.bucket_data_path)

    LOG.info(f'--- The setup took {time.time() - start_setup_t} seconds')

    # Search for the nearest neighbors
    LOG.info(f'--- Searching for {args.k} nearest neighbors of protein {args.protein_id}')
    search_start_t = time.time()

    knn_ids = search(args.protein_id, args.k, args.n_buckets_to_visit)

    LOG.info(f'--- Found: {knn_ids}')
    LOG.info(f'--- The search took {time.time() - search_start_t} seconds')
