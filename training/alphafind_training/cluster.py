import logging

import numpy as np
import pandas as pd
import torch

from alphafind_training.clustering import run_clustering
from alphafind_training.utils import dir_exists, file_exists, load_dataset, load_pickle

LOG = logging.getLogger(__name__)

torch.manual_seed(2023)
np.random.seed(2023)


def create_kmeans(input_path, output_path, n_clusters=2, sample_size=108, n_iterations=20):
    """
    Function for clustering the embeddings using K-Means.

    Args:
    input_path (str): Path to the embeddings parquet file or directory of parquet files
    output_path (str): Path to the output K-Means file
    n_clusters (int): Number of clusters (default: 2)
    sample_size (int): Size of the sample (default: 108)
    n_iterations (int): Number of k-means iterations (default: 10)

    Returns:
    None
    """
    assert file_exists(input_path) or dir_exists(input_path), 'Input file or directory does not exist'

    LOG.info('Loading embeddings')
    LOG.info('from %s', input_path)
    if dir_exists(input_path) and not file_exists(input_path):
        embeddings, _ = load_dataset(input_path, sample_size, shuffle=True)
    else:
        embeddings = pd.read_parquet(input_path)

    assert embeddings.shape[0] >= sample_size, 'Sample size must be smaller than the number of embeddings'

    LOG.info(f'Loaded embeddings of shape: {embeddings.shape}')
    LOG.info(f'Running clustering, result k-means object will be saved to: {output_path}')

    run_clustering(
        output_path,
        embeddings.values,
        sample_size,
        n_clusters,
        n_iterations,
    )


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description="Cluster embeddings using K-Means")
    parser.add_argument(
        '--input', type=str, required=True, help='Path to the embeddings parquet file or directory of parquet files'
    )
    parser.add_argument('--output', type=str, required=True, help='Path to the output K-Means file')
    parser.add_argument('--n-clusters', type=int, default=2, help='Number of clusters')
    parser.add_argument('--sample-size', type=int, default=108, help='Size of the sample')
    parser.add_argument('--n-iterations', type=int, default=10, help='Number of k-means iterations')
    args = parser.parse_args()

    create_kmeans(args.input, args.output, args.n_clusters, args.sample_size, args.n_iterations)
