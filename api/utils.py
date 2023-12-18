import logging
import os
import pickle
import random

random.seed(2023)

LOG = logging.getLogger(__name__)


def load_pickle(pickle_path):
    with open(pickle_path, "rb") as f:
        return pickle.load(f)


def dir_exists(path):
    return os.path.isdir(path)


def file_exists(path):
    return os.path.isfile(path)


def remove_file(path):
    if file_exists(path):
        os.remove(path)


def load_newest_file_in_dir(dir_path):
    weight_files = [os.path.join(dir_path, f) for f in os.listdir(dir_path)]
    if weight_files == []:
        return None
    else:
        return max(weight_files, key=os.path.getctime)
