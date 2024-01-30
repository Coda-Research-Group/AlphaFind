import argparse
import logging

import numpy as np
import torch

from clustering import run_clustering
from utils import dir_exists, file_exists, load_dataset, load_pickle

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

torch.manual_seed(2023)
np.random.seed(2023)

"""
Script for clustering the embeddings using K-Means.

Input: Embeddings pickle file
Output: K-Means object

EXAMPLE USE:
python3 cluster.py --input=./data/embedding.pkl --output=./data/kmeans.idx
"""
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input', type=str, required=True, help='Path to the embeddings pickle file or directory of pickle files'
    )
    parser.add_argument('--output', type=str, required=True, help='Path to the output K-Means file')
    parser.add_argument('--n-clusters', type=int, default=2, help='Number of clusters')
    parser.add_argument('--sample-size', type=int, default=108, help='Size of the sample')
    parser.add_argument('--n-iterations', type=int, default=10, help='Number of k-means iterations')
    args = parser.parse_args()

    assert file_exists(args.input) or dir_exists(args.input), 'Input file or directory does not exist'

    LOG.info('Loading embeddings')
    if dir_exists(args.input) and not file_exists(args.input):
        embeddings, _ = load_dataset(args.input, args.sample_size, shuffle=True)
    else:
        embeddings = load_pickle(args.input)

    assert embeddings.shape[0] >= args.sample_size, 'Sample size must be smaller than the number of embeddings'

    LOG.info(f'Loaded embeddings of shape: {embeddings.shape}')
    LOG.info(f'Running clustering, result k-means object will be saved to: {args.output}')

    run_clustering(
        args.output,
        embeddings.values,
        args.sample_size,
        args.n_clusters,
        args.n_iterations,
    )
