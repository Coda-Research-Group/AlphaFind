import argparse
import gc
import logging
import re
from os import listdir

import numpy as np
import pandas as pd
import torch
from tqdm import tqdm

from model import LIDatasetPredict, load_model
from utils import (
    create_dir,
    dir_exists,
    file_exists,
    load_newest_file_in_dir,
    load_pickle,
    remove_dir,
    save_pickle,
    save_predictions,
)

torch.manual_seed(2023)
np.random.seed(2023)

LOG = logging.getLogger(__name__)
DEFAULT_DIMENSIONALITY = 45


def load_all_embeddings(path):
    df = pd.DataFrame([])
    if path.endswith('.pkl'):
        return load_pickle(path)
    else:
        for _, emb_file in tqdm(enumerate([f for f in listdir(path) if f.endswith('.pkl')])):
            objs = load_pickle(f"{path}/{emb_file}")
            df = pd.concat([df, objs])
    return df


def parse_model_params(model_path):
    LOG.info(f'Parsing out model params from model path: {model_path}')
    pattern = r'model-(\w+)--.*?n_classes-(\d+)(?:--.*?dimensionality-(\d+))?'
    match = re.search(pattern, model_path, re.MULTILINE)
    # new model format
    if match and len(match.groups()) == 3:
        model = match.group(1)
        n_classes = int(match.group(2))
        dimensionality = match.group(3)
        dimensionality = int(dimensionality) if dimensionality is not None else DEFAULT_DIMENSIONALITY
    else:
        LOG.info(f'Failed to parse out model params from model path: {model_path}')
        exit(1)
    LOG.info(f'Parsed out model={model}, dimensionality={dimensionality}, n_classes={n_classes}')
    return model, dimensionality, n_classes


def assign_proteins_to_buckets(config):
    model, dimensionality, n_classes = parse_model_params(config.model_dir_path)

    nn, _ = load_model(
        config.model_dir_path,
        dimensionality=dimensionality,
        n_classes=n_classes,
        model_type=model,
        map_location=torch.device('cpu'),
    )

    predictions_per_class = {c: [] for c in range(n_classes)}

    if file_exists(config.input) and not dir_exists(config.input):
        embedding_files = [config.input]
    else:
        embedding_files = [f'{config.input}/{f}' for f in listdir(config.input)]

    for chunk, chunk_path in tqdm(enumerate(embedding_files)):
        dataset = LIDatasetPredict(chunk_path)
        loader = torch.utils.data.DataLoader(
            dataset,
            batch_size=config.chunk_size,
            sampler=torch.utils.data.SequentialSampler(dataset),
        )
        for slice, data_batch in tqdm(enumerate(loader)):
            predictions = nn.predict(data_batch)
            predictions = pd.Series(predictions, index=dataset.data_pd.index)
            predictions.groupby(predictions).apply(lambda x: predictions_per_class[x.name].extend(list(x.index)))
            save_predictions(
                predictions,
                f'{config.output_chunks}/chunk={chunk}-slice={slice}-shape={predictions.shape[0]}.pkl',
            )

        # ========== CLEANING UP ========== #
        del predictions
        del dataset
        gc.collect()

    LOG.info(f'Saved predictions per chunk in `{config.output_chunks}`')

    # ========== STORE PREDICTIONS FOR EACH CLASS ========== #
    LOG.info('Saving predictions per class')
    for c, predictions in tqdm(predictions_per_class.items()):
        save_predictions(
            predictions,
            f'{config.output_predictions}/class-{c}.pkl',
        )

    LOG.info(f'Saved predictions per class in `{config.output_predictions}`')


'''
The script loads a model and assigns protein IDs to buckets based on the model's predictions.

Implementation details:
The data is loaded in chunks and the predictions are saved in the form of a pickle file.
The predictions are saved in two successive steps:
1. per class + per slice (all the predictions for a given loaded chunk and a given slice of the chunk
  are saved in a single file), see `--output-folder-for-chunks` argument
2. per class (all the predictions in the previous step are grouped per class and saved in a single file),
  see `--output-folder-for-classes` argument

EXAMPLE USE:
python create-buckets.py \
    --output-chunks ./data/chunks \
    --output-predictions ./data/overall \
    --output-bucket-path ./data/bucket-data/ \
    --input ./data/embeddings \
    --model-dir-path "./data/models/"
'''
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--output-chunks',
        type=str,
        default=('./data/chunks'),
        help=(
            'Path to a folder where temporary (per class + per slice) '
            'predictions will be saved (without the / at the end)'
        ),
    )
    parser.add_argument(
        '--output-predictions',
        type=str,
        default=('./data/overall'),
        help='Path to a folder where the per bucket objects will be saved (without the / at the end)',
    )
    parser.add_argument(
        '--input',
        type=str,
        default='./data/embeddings',
        help='Path to the dataset',
    )
    parser.add_argument(
        '--model-dir-path',
        type=str,
        default=('./data/models/'),
        help='Path to the model',
    )
    parser.add_argument(
        '--output-bucket-path',
        type=str,
        default='./data/bucket-data/',
        help='path to output bucket data',
    )
    parser.add_argument('--chunk-size', type=int, default=1000000, help='Chunk size')

    args = parser.parse_args()

    assert args.output_chunks is not None
    assert args.output_predictions is not None

    logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

    LOG.info('Saving predictions per chunk and class')

    # the dir can be models/<dirs> or <specific-model-dir>/checkpoint.pt
    files = listdir(args.model_dir_path)

    if not any([f.endswith('.pt') for f in listdir(args.model_dir_path)]):
        args.model_dir_path = load_newest_file_in_dir(args.model_dir_path)

    assign_proteins_to_buckets(args)

    LOG.info('Loading all data')
    df = load_all_embeddings(args.input)

    create_dir(args.output_bucket_path)

    LOG.info(f'Saving predictions per bucket in `{args.output_bucket_path}`')
    for f in tqdm(listdir(args.output_predictions)):
        data_subset = df[df.index.isin(load_pickle(f'{args.output_predictions}/{f}'))]
        save_pickle(f'{args.output_bucket_path}/{f}', data_subset)

    LOG.info(f'Saved predictions per bucket in `{args.output_bucket_path}`')

    LOG.info(f'Removing temporary files in `{args.output_chunks}`, `{args.output_predictions}`')
    remove_dir(args.output_chunks)
    remove_dir(args.output_predictions)

    LOG.info('Done')
