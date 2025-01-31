import functools
import logging
import os
import pickle
import random
import shutil
import time
from pathlib import Path

import pandas as pd
import psutil

random.seed(2023)

LOG = logging.getLogger(__name__)


def sizeof_fmt(num, suffix="B"):
    """https://stackoverflow.com/questions/1094841/get-human-readable-version-of-file-size"""
    for unit in ("", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi"):
        if abs(num) < 1024.0:
            return f"{num:3.1f}{unit}{suffix}"
        num /= 1024.0
    return f"{num:.1f}Yi{suffix}"


def measure_runtime(func):
    @functools.wraps(func)
    def wrapper_measure_runtime(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        stop = time.time()

        LOG.info(f"-> Execution of {func.__name__} took {stop - start:.2}s.")

        return result

    return wrapper_measure_runtime


def measure_memory_usage(func):
    @functools.wraps(func)
    def wrapper_measure_memory_usage(*args, **kwargs):
        process = psutil.Process()

        start = process.memory_info().rss
        result = func(*args, **kwargs)
        stop = process.memory_info().rss
        # ? What if some objects are garbage collected during the function's execution?

        LOG.info(f"-> Function {func.__name__} allocated {sizeof_fmt(stop - start)}.")

        return result

    return wrapper_measure_memory_usage


def get_current_timestamp():
    return time.strftime("%Y-%m-%d-%H-%M-%S", time.gmtime())


def load_pickle(pickle_path):
    with open(pickle_path, "rb") as f:
        return pickle.load(f)


def save_json(path, data):
    import json

    with open(path, "w") as f:
        json.dump(data, f)


def dir_exists(path):
    return os.path.isdir(path)


def file_exists(path):
    return os.path.isfile(path)


def remove_file(path):
    if file_exists(path):
        os.remove(path)


def remove_dir(directory_path):
    try:
        shutil.rmtree(directory_path)
        LOG.info(f"Directory '{directory_path}' removed successfully.")
    except Exception as e:
        LOG.info(f"Error removing directory: {e}")


def create_dir(path):
    if not os.path.isdir(path):
        os.mkdir(path)


def save_pickle(pickle_path, data):
    if not file_exists(pickle_path):
        with open(pickle_path, "wb") as f:
            pickle.dump(data, f)


def save_parquet(parquet_path, data):
    if not file_exists(parquet_path):
        data.to_parquet(parquet_path)


def write_row_to_csv(path, row):
    import csv

    with open(path, "a") as f:
        writer = csv.writer(f)
        writer.writerow(row)


def save_predictions(predictions, path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)

    with open(path, "wb") as f:
        pickle.dump(predictions, f)


def load_newest_file_in_dir(dir_path):
    weight_files = [os.path.join(dir_path, f) for f in os.listdir(dir_path)]
    if weight_files == []:
        return None
    else:
        return max(weight_files, key=os.path.getctime)


@measure_runtime
def load_dataset(
    path: str,
    chunk_size: int = 10_000_000,
    parquet_files_used: list = [],
    shuffle: bool = False,
):
    dataset_path = "/".join(path.split("/")[:-1]) if path.endswith("/") else path
    LOG.info(f"Loading parquet files from: {dataset_path}")
    assert os.path.isdir(dataset_path), f"{dataset_path} is not a directory"
    data = pd.DataFrame([])
    emb_parquets = os.listdir(dataset_path)
    if shuffle:
        random.shuffle(emb_parquets)
    LOG.info(f"Loading chunk_size={chunk_size} proteins.")
    for i, parquet_file in enumerate(emb_parquets):
        if parquet_file not in parquet_files_used and parquet_file.endswith(".parquet"):
            if i % 10 == 0:
                LOG.info(f"Loaded {data.shape[0]} / {chunk_size} proteins.")
            data_pd = pd.read_parquet(f"{dataset_path}/{parquet_file}")
            data = pd.concat([data, data_pd])
            parquet_files_used.append(parquet_file)
            if data.shape[0] >= chunk_size:
                break
    return data, parquet_files_used
