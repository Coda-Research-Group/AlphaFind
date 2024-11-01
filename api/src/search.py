import logging
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
import pandas as pd
import torch

from api.src.model import NeuralNetwork, data_X_to_torch
from api.src.utils import dir_exists, file_exists, load_newest_file_in_dir, load_pickle

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

# (Protein ID, TM-Score, RMSD)
ProteinWithScores = Tuple[str, float, float]

PROTEIN_ID_TO_POSITION_FILE_PATH = '/data/bucket-mapping.pkl'

# Embeddings grouped by the predicted class ID
embeddings: Dict[int, pd.DataFrame] = dict()

# Protein ID -> (class ID, position of this protein inside the class)
# Indexes the `embeddings` dictionary
protein_id_to_position_mapping: Dict[str, Tuple[int, int]] = dict()

# Protein ID -> (tar ID, offset, size)
protein_id_to_tar_index: Dict[str, Tuple[str, int, int]] = dict()

# The root model
root_model = None


def load_protein_id_to_position_mapping():
    global protein_id_to_position_mapping

    assert len(protein_id_to_position_mapping) == 0, 'Protein ID to position index mapping has already been loaded.'

    protein_id_to_position_mapping = load_pickle(PROTEIN_ID_TO_POSITION_FILE_PATH)


def load_model_to_cpu(model_path, model_type, n_classes, dimensionality):
    LOG.info(f'Loading model from weights: {model_path}')
    loaded_info = torch.load(model_path, map_location=torch.device('cpu'))
    if type(loaded_info) is dict and 'model_state_dict' in loaded_info:
        loaded_weights = loaded_info['model_state_dict']
    else:
        loaded_weights = loaded_info

    nn = NeuralNetwork(dimensionality, n_classes, model_type=model_type)
    nn.model.load_state_dict(loaded_weights)

    return nn


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
    n_buckets_to_visit: int = 2,
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
    n_classes: int = 2,
    model: str = 'MLP',
    model_path: str = '/models/',
    bucket_data_path: str = '/data/bucket-data/',
) -> None:
    global root_model

    if dir_exists(model_path):
        # It is a path to the root folder containing all the model folders
        # We find the newest folder and then the newest model in that folder

        # Path to the newest folder
        newest_folder_model_path = load_newest_file_in_dir(model_path)
        assert newest_folder_model_path is not None, 'No model folders found in the given path.'
        print(newest_folder_model_path)

        # Path to the newest model in that folder
        model_path = load_newest_file_in_dir(newest_folder_model_path)
        assert model_path is not None, 'No models found in the given path.'
        print(model_path)
    else:
        # It is a path to the model
        assert file_exists(model_path), 'The given path is not a file.'

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
    root_model = load_model_to_cpu(model_path, model, n_classes, data_dimensionality)
    LOG.info(f'Loaded model in {time.time() - s} seconds')
