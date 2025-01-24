import os
import gzip
import shutil
import tarfile
from typing import List, Dict, Tuple, Generator, TypeVar
import pickle
import sys


INPUT_DIR: str = "./data/cifs"
GZIPPED_DIR: str = "./data/gzipped"
OUTPUT_DIR: str = "./proteins"
INDEX_FILE: str = "./data/index.pkl"

T = TypeVar("T")
def print_progress(list: List[T]) -> Generator[T, None, None]:
    total_elements = len(list)
    last_progress: float = 0

    for index, element in enumerate(list):
        progress = (index + 1) / total_elements * 100
        current_progress = int(progress * 100) / 100

        if current_progress != last_progress:
            sys.stdout.write("\rProgress: {:.0f}%".format(current_progress))
            sys.stdout.flush()

            last_progress = current_progress

        yield element
    
    # Clear printing
    print()


def _clear_folders(dirs: List[str]) -> None:
    for directory in dirs:
        shutil.rmtree(directory, ignore_errors=True)


def _create_dirs(dirs: List[str]) -> None:
    for directory in dirs:
        os.makedirs(directory, exist_ok=True)


def _gzip_file(input_file: str, output_file: str) -> None:
    """
    Compresses a file using gzip.
    """

    with open(input_file, "rb") as f_in, gzip.open(output_file, "wb") as f_out:
        f_out.writelines(f_in)


def _create_tar_archive(output_file: str, source_dir: str, file_name: str) -> Tuple[int, int]:
    """
    Creates a tar archive with a specific file.

    Returns tuple of integers.
    The first integer is the offset of the file in the tar archive.
    The second integer is the size of the file in the tar archive.
    These could be used to locate the file directly in the archive without
    the need for extraction.
    """

    # Create archive and add the file
    with tarfile.open(output_file, "w") as tar:
        tar.add(os.path.join(source_dir, file_name), arcname=file_name)
    
    # Read the created archive to get the offset of the file contained
    with tarfile.open(output_file, "r") as tar:
        ti = tar.getmembers()[0]
        offset = ti.offset_data
        size = ti.size
    
    return offset, size


def _process_cif_files() -> None:
    """
    Processes .cif files by gzipping them and storing them in a tar archive.
    """

    _clear_folders([GZIPPED_DIR, OUTPUT_DIR])
    _create_dirs([GZIPPED_DIR, OUTPUT_DIR])

    # Protein ID -> (tar ID, offset, size)
    index: Dict[str, Tuple[str, int, int]] = dict()

    cif_files = [f for f in os.listdir(INPUT_DIR) if f.endswith(".cif")]

    for i, cif_file in enumerate(print_progress(cif_files)):
        # Gzip the .cif file
        full_cif_path: str = os.path.join(INPUT_DIR, cif_file)
        gzipped_file: str = os.path.join(GZIPPED_DIR, cif_file + ".gz")
        _gzip_file(full_cif_path, gzipped_file)

        # Create tar archive in output directory
        tar_name: str = f"proteome-tax_id-{i + 1}-0_v3.tar"
        offset, size = _create_tar_archive(os.path.join(OUTPUT_DIR, tar_name), GZIPPED_DIR, os.path.basename(gzipped_file))

        # Add to the index
        uniProtId = cif_file.split("-")[1]
        index[uniProtId] = (f"{i + 1}-0", offset, size)

    with open(INDEX_FILE, "wb") as f:
        pickle.dump(index, f)


if __name__ == "__main__":
    _process_cif_files()
