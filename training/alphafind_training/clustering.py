import logging

import faiss
import numpy as np

from alphafind_training.utils import measure_memory_usage, measure_runtime

np.random.seed(2023)

LOG = logging.getLogger(__name__)


def assign_labels(kmeans_index: faiss.Kmeans, data: np.ndarray) -> np.ndarray:
    # Assign each data point to the closest centroid
    return kmeans_index.search(data, 1)[1].T[0]


@measure_runtime
def run_clustering(
    output_path: str,
    chunk: np.ndarray,
    sample_size: int,
    n_clusters: int,
    n_iterations: int,
) -> None:
    LOG.info('Taking a sample from the chunk')
    sample = _take_sample(chunk, sample_size)

    LOG.info('Running the k-means clustering')
    kmeans = _cluster(sample, n_clusters, n_iterations, use_gpu=False)

    LOG.info('Saving the k-means index')
    faiss.write_index(
        kmeans.index,
        output_path,
    )


@measure_runtime
@measure_memory_usage
def _take_sample(chunk: np.ndarray, sample_size: int) -> np.ndarray:
    if sample_size > chunk.shape[0]:
        LOG.info('Sample size is larger than the chunk size, using the whole chunk')
        sample_size = chunk.shape[0]

    indices = np.random.choice(chunk.shape[0], sample_size, replace=False)
    sample = chunk[indices, :]

    return sample


@measure_runtime
@measure_memory_usage
def _cluster(data: np.ndarray, n_clusters: int, n_iterations: int, use_gpu: bool) -> faiss.Kmeans:
    if n_clusters > data.shape[0]:
        LOG.info('Number of clusters is larger than the number of points, using all points')
        n_clusters = data.shape[0]

    kmeans = faiss.Kmeans(
        d=data.shape[1],
        k=n_clusters,
        max_points_per_centroid=data.shape[0],
        gpu=use_gpu,
        niter=n_iterations,
        verbose=False,
    )

    kmeans.train(data)

    return kmeans
