import asyncio
import logging
import os
import re
import shutil
import subprocess
import time
from typing import Dict, List, Tuple

from search import get_queries_in_queue
from utils import load_pickle, remove_file

PROTEIN_ID_TO_TAR_INDEX_FILE_PATH = '/embeddings/data-structures/index_v2.pickle'
COMPUTE_SCORES_SCRIPT_PATH = './compute_scores.sh'
ProteinWithScores = Tuple[str, float, float]

# protein_id -> (tar_file_identifier,  offset, size)
protein_id_to_tar_index: Dict[str, Tuple[str, int, int]] = dict()

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')


def load_protein_id_to_tar_mapping():
    global protein_id_to_tar_index

    assert len(protein_id_to_tar_index) == 0, 'Protein ID to tar index mapping has already been loaded.'

    protein_id_to_tar_index = load_pickle(PROTEIN_ID_TO_TAR_INDEX_FILE_PATH)


def parse_protein_scores(line: str) -> ProteinWithScores:
    protein, tm_score, rmsd = line.split(' ')

    return (protein, float(tm_score), float(rmsd))


def extract_protein_model(
    protein_id: str,
    tar_id: str,
    offset: int,
    size: int,
    output_folder_path: str,
) -> None:
    tar_path = f'/proteins/proteome-tax_id-{tar_id}_v3.tar'

    with open(tar_path, 'rb') as tar:
        tar.seek(offset)
        buffer = tar.read(size)

    with open(f'{output_folder_path}/AF-{protein_id}-F1-model_v3.cif.gz', 'wb') as outfile:
        outfile.write(buffer)


def compute_scores(
    protein_id: str, knn_ids: List[str], cache_result: bool = True, limit: int = 50, offset: int = 0
) -> List[ProteinWithScores]:
    """Computes TM-score and RMSD for the given protein ID and its k nearest neighbors."""

    assert len(protein_id_to_tar_index) != 0, 'Protein ID to tar index mapping has not been loaded.'

    output_folder = f'/eph/untared_proteins/{protein_id}'

    if os.path.exists(output_folder):
        LOG.info("Someone is already computing the same query, should be handled by the bash script")
    else:
        os.makedirs(output_folder)

    LOG.info('Extracting proteins from the tar files')
    s = time.time()
    for knn_protein_id in [protein_id] + knn_ids:
        tar_id, tar_offset, size = protein_id_to_tar_index[knn_protein_id]

        extract_protein_model(
            knn_protein_id,
            tar_id,
            tar_offset,
            size,
            output_folder,
        )
    LOG.info(f'Extraction done in {time.time() - s} seconds')

    LOG.info('Calculating scores')
    s = time.time()
    _ = subprocess.run(
        [COMPUTE_SCORES_SCRIPT_PATH, protein_id, ','.join(knn_ids), str(cache_result), str(limit), str(offset)],
        capture_output=True,
    )
    LOG.info(f'Scores calculated in {time.time() - s} seconds')

    if os.path.exists(output_folder):
        shutil.rmtree(output_folder)


def worker_loop():
    LOG.info('Loading protein ID to tar mapping')
    s = time.time()
    load_protein_id_to_tar_mapping()
    LOG.info(f'Loaded protein ID to tar mapping in {time.time() - s} seconds')

    LOG.info('Creating /eph/queue directory if it does not exist')
    os.makedirs('/eph/queue', exist_ok=True)

    def parse_query_from_file_name(file_name: str) -> List[str]:
        """
        Parses the query from the file name. For example, if the file name is `A0A346LI80-limit=10-offset=0.txt`,
        the query will be `A0A346LI80`.
        """
        parsed = []

        query_parsed = re.findall(r'^([a-zA-Z0-9]+)[-|$]', file_name)[0]
        parsed.append(query_parsed)

        for attribute in ['limit', 'offset']:
            attr = re.findall(rf'{attribute}=(\d+)', file_name)[0]
            attr = int(attr)
            parsed.append(attr)

        return parsed

    def process(query: str):
        """
        Process a query from the queue. Load the knn ids from the file,
        compute_scores then calculates the RMSD/TM-Score and stores the results in /eph/results.
        """
        query, limit, offset = parse_query_from_file_name(query)
        LOG.info(f'Computing scores for {query}')
        s = time.time()
        with open(f'/eph/queue/{query}-limit={limit}-offset={offset}.txt') as f:
            contents = f.read()
        knn_ids = contents.split('\n')
        compute_scores(query, knn_ids, cache_result=True, limit=limit, offset=offset)
        LOG.info(f'Computed scores in {time.time() - s} seconds')

    def watch_for_file(interval=1, loop=None):
        """
        Checks if there is a file in /eph/queue. If there is, process it and call the wait process again,
        otherwise wait for 1 second and check again.

        Runs indefinitely.
        """
        if not loop:
            loop = asyncio.get_event_loop()
        queries_in_queue = get_queries_in_queue()
        # There is nothing in the queue
        if len(queries_in_queue) == 0:
            loop.call_later(interval, watch_for_file, interval, loop)
        else:
            query = queries_in_queue.pop(0)
            LOG.info(f'Found {query} in /eph/queue, processing it.')
            process(query)
            remove_file(f'/eph/queue/{query}.txt')
            loop.call_later(interval, watch_for_file, interval, loop)

    # Creating the asyncio loop
    loop = asyncio.get_event_loop()
    loop.call_soon(watch_for_file)
    loop.run_forever()


if __name__ == '__main__':
    worker_loop()
