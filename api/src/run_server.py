import fcntl
import logging
import os
import subprocess
import time

from flask import Flask, jsonify, make_response, request
from prometheus_client import Counter, Gauge, Summary, generate_latest

from api.src.search import get_queries_in_queue, search, setup_in_memory_data_structures
from api.src.utils import file_exists

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

app = Flask(__name__)
LOG.info('Started Flask server')

# Prometheus metrics
search_calls_metric = Counter('search_calls', 'Calls to the /search endpoint')
search_exceptions_metric = Counter('search_exceptions', 'Exceptions thrown in the /search endpoint')
search_duration_metric = Summary('search_duration_seconds', 'Time spent in the /search endpoint')
queue_length_metric = Gauge('queue_length', 'Number of queries in the queue')

# Constants
DEFAULT_LIMIT = 50
DEFAULT_OFFSET = 0
CANDIDATE_ANSWER_SIZE = 50

# Start the worker process (to compute the results in the background)
subprocess.Popen(
    [
        'python run-worker.py',
    ],
    shell=True,
    stdin=None,
    stdout=None,
    stderr=None,
    close_fds=True,
)
LOG.info('Started the worker')

ready = False


@app.route('/ready')
def is_ready():
    response = make_response(jsonify({'ready': ready}))

    response.headers['Access-Control-Allow-Origin'] = '*'

    return response


LOG.info('Setting up in-memory data structures')
s = time.time()
setup_in_memory_data_structures()
LOG.info(f'Done in {time.time() - s}. Ready to serve requests')
ready = True


def compute_aligned_percentage(query_protein_length: int, aligned_length: int) -> float:
    return aligned_length / query_protein_length


def compute_sequence_aligned_percentage(
    n_identical_div_n_aligned: float, query_protein_length: int, aligned_length: int
) -> float:
    return (n_identical_div_n_aligned * aligned_length) / query_protein_length


def prepare_search_response(proteins_with_scores, search_time):
    results = []

    for protein_with_scores in sorted(proteins_with_scores, key=lambda x: float(x[1]), reverse=True):
        object_id = protein_with_scores[0]
        tm_score = float(protein_with_scores[1])
        rmsd = float(protein_with_scores[2])
        n_identical_div_n_aligned = float(protein_with_scores[3])
        query_protein_length = int(protein_with_scores[4])
        aligned_length = int(protein_with_scores[5])

        results.append(
            {
                'object_id': object_id,
                'tm_score': tm_score,
                'rmsd': rmsd,
                'aligned_percentage': compute_aligned_percentage(query_protein_length, aligned_length),
                'sequence_aligned_percentage': compute_sequence_aligned_percentage(
                    n_identical_div_n_aligned, query_protein_length, aligned_length
                ),
            }
        )

    return {'results': results, 'search_time': search_time}


def lower_large_limit(offset: int, limit: int) -> int:
    if offset + limit > CANDIDATE_ANSWER_SIZE:
        # Modify the limit to be the size of the candidate answer
        new_limit = limit - (offset + limit - CANDIDATE_ANSWER_SIZE)
        LOG.info(f"Modified limit from {limit} to {new_limit} based of candidate answer size")
        limit = new_limit
    return limit


def is_offset_valid(offset: int) -> bool:
    if offset < 0:
        LOG.info(f'Invalid negative offset: {offset}')
        return False
    if offset > CANDIDATE_ANSWER_SIZE:
        LOG.info(f'Invalid offset larger than (or equal) {CANDIDATE_ANSWER_SIZE}: {offset}')
        return False
    return True


def is_limit_valid(limit: int) -> bool:
    if limit < 0:
        LOG.info(f'Invalid negative limit: {limit}')
        return False
    if limit > CANDIDATE_ANSWER_SIZE:
        LOG.info(f'Invalid limit larger than (or equal) {CANDIDATE_ANSWER_SIZE}: {limit}')
        return False
    return True


@app.route('/search')
@search_duration_metric.time()
@search_exceptions_metric.count_exceptions()
def execute_searching():
    search_calls_metric.inc()

    # 1. Read from results (/eph/results/{query}.txt)
    # 2. If not exists, 'submit' to 'queue' -> write to /eph/queue/{query}.txt
    query = request.args.get('query')
    offset = request.args.get('offset', DEFAULT_OFFSET, type=int)
    limit = request.args.get('limit', DEFAULT_LIMIT, type=int)

    LOG.info(f"Searching for query: '{query}' with offset: {offset} and limit: {limit}")

    # Validate offset and limit
    if not is_offset_valid(offset) or not is_limit_valid(limit):
        response = make_response(jsonify({'results': []}))
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    limit = lower_large_limit(offset, limit)

    if file_exists(f'/eph/results/{query}-limit={limit}-offset={offset}.txt'):
        # `query` is already computed
        t = time.time()
        proteins_with_scores = []
        while len(proteins_with_scores) != limit:
            with open(f'/eph/results/{query}-limit={limit}-offset={offset}.txt') as f:
                contents = f.read()
            proteins_with_scores = [row.split(' ') for row in contents.split('\n')][:-1]  # drop the last empty row
        response = prepare_search_response(proteins_with_scores, search_time=time.time() - t)
        response = make_response(jsonify(response))
    elif file_exists(f'/eph/queue/{query}-limit={limit}-offset={offset}.txt'):
        # `query` is already in queue
        t = time.time()
        # [0] -> oldest, [-1] -> newest
        queries_in_queue = get_queries_in_queue()
        response = make_response(
            jsonify({'results': [], 'queue_position': queries_in_queue.index(f'{query}-limit={limit}-offset={offset}')})
        )
    else:
        # precompute stuff and put in /eph/queue
        knns, _ = search(query, offset, limit, k=CANDIDATE_ANSWER_SIZE)

        if len(knns) == 0:
            # the protein doesn't exist in the database
            response = make_response(jsonify({'results': []}))
        else:
            n_queries_in_queue = len(os.listdir('/eph/queue'))
            LOG.info(
                f"{n_queries_in_queue} queries in queue"
                f", writing {query} to /eph/queue/{query}-limit={limit}-offset={offset}.txt"
            )
            with open(f'/eph/queue/{query}-limit={limit}-offset={offset}.txt', "w") as f:
                # acquire the file lock
                fd = f.fileno()
                fcntl.flock(fd, fcntl.LOCK_EX)
                f.write('\n'.join(knns))
                # release the file lock
                fcntl.flock(fd, fcntl.LOCK_UN)
            response = make_response(jsonify({'results': [], 'queue_position': n_queries_in_queue}))

    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


@app.route('/metrics')
def metrics():
    return generate_latest()


def compute_queue_length():
    return len(os.listdir('/eph/queue/'))


queue_length_metric.set_function(compute_queue_length)
