import argparse
import logging
import os
import subprocess
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
import pandas as pd
from tqdm import tqdm

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

np.random.seed(2023)

pd.options.mode.chained_assignment = None


def plytoobj(filename):
    obj_filename = filename[:-4] + ".obj"
    obj_file = open(obj_filename, "w")

    with open(filename) as ply_file:
        ply_file_content = ply_file.read().split("\n")[:-1]

        for content in ply_file_content:
            content_info = content.split()
            if len(content_info) == 6:
                vertex_info = "v " + " ".join(content_info[0:3])
                obj_file.write(vertex_info + "\n")
            elif len(content_info) == 7:
                vertex1, vertex2, vertex3 = map(int, content_info[1:4])
                vertex1, vertex2, vertex3 = vertex1 + 1, vertex2 + 1, vertex3 + 1
                face_info = "f " + str(vertex1) + " " + str(vertex2) + " " + str(vertex3)
                obj_file.write(face_info + "\n")

        obj_file.close()


def process_protein(it):
    start_time = time.time()

    path, protein_file = it
    protein_file = str(protein_file)
    protein_name = protein_file.split("-")[1]

    # Convert from .cif -> .pdb
    subprocess.run(["python3", "./alphafind_training/mmcif_to_pdb.py", "--ciffile", protein_file])

    # Convert to .ply -> .obj -> .grid -> Zernike descriptors
    subprocess.run(
        [
            "./alphafind_training/bin/EDTSurf",
            "-i",
            f"{protein_file}.pdb",
            "-h",
            "2",
            "-f",
            "1",
            "-o",
            f"{path}{protein_name}",
        ]
    )
    plytoobj(f"{path}{protein_name}.ply")
    subprocess.run(["./alphafind_training/bin/obj2grid", "-g", "64", f"{path}{protein_name}.obj"])
    subprocess.run(
        [
            "./alphafind_training/bin/map2zernike",
            f"{path}{protein_name}.obj.grid",
            "-c",
            "0.5",
        ]
    )

    # Convert to vector
    with open(f"{path}{protein_name}.obj.grid.inv") as f:
        embedding = [float(x.strip()) for x in f.readlines()[1:]]

    # Clean up
    subprocess.run(
        [
            "rm",
            f"{path}{protein_name}.ply",
            f"{path}{protein_name}.obj",
            f"{path}{protein_name}.obj.grid",
            f"{path}{protein_name}.obj.grid.inv",
            f"{path}{protein_name}-cav.pdb",
            f"{protein_file}.pdb"
        ]
    )

    LOG.info(f"Processed {protein_name} in {time.time() - start_time:.2f} seconds")
    return protein_name, embedding


def create_embedding(input_path, output_path):
    """Calculate all protein descriptors using the new method

    Args:
        input_path (str or Path): Path to CIF directory
        output_path (str or Path): Path to save embeddings as a parquet file

    Returns:
        None
    """
    input_path = Path(input_path)
    output_path = Path(output_path)

    proteins = [file for file in os.listdir(input_path) if file.endswith(".cif")]
    LOG.info(f'Found {len(proteins)} proteins to create embeddings for')

    with Pool() as pool:
        results = []
        data = []
        index = []

        for protein in proteins:
            result = pool.apply_async(process_protein, ((input_path, input_path / protein),))
            results.append(result)

        LOG.info("Processing started")
        t = time.time()
        for result in tqdm(results, total=len(proteins)):
            protein_name, embedding = result.get()
            index.append(protein_name)
            data.append(embedding)

        df = pd.DataFrame(index=index, data=data, dtype="float32")
        # Save as parquet
        df.to_parquet(output_path)

        t = time.time() - t
        LOG.info(f'Processing took {t:.1f} seconds')
        LOG.info(f'Output saved to {output_path}')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create protein descriptors from CIF files")
    parser.add_argument("--input", type=str, required=True, help="Path to the directory containing CIF files")
    parser.add_argument("--output", type=str, required=True, help="Path to the output file")

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

    input_path = Path(args.input)
    output_path = Path(args.output)
    assert input_path.exists(), f"Input path {input_path} does not exist"

    create_embedding(input_path, output_path)
