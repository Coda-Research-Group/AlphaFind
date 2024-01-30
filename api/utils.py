import os
import pickle
from typing import Optional


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


def load_newest_file_in_dir(dir_path) -> Optional[str]:
    files = [os.path.join(dir_path, f) for f in os.listdir(dir_path)]
    if files == []:
        return None
    else:
        return max(files, key=os.path.getctime)
