import argparse
import os
import subprocess
import time
from multiprocessing import Pool
from pathlib import Path

import pandas as pd


def _untar(tar_file, input_dir, scratch_dir):
    """Helper function to paralelize untaring"""
    tar_file_path = str(os.path.join(input_dir, tar_file))
    subprocess.run(
        ["tar", "-xf", tar_file_path, "-C", scratch_dir, "--wildcards", "*.cif.gz"]
    )


def extract(input_dir, scratch_dir, index):
    """Extracts CHUNK of proteins on persistent storage from tars and moves them to the zip folder"""
    scrach_dir_loc = str(os.path.join(scratch_dir))
    if not os.path.exists(scrach_dir_loc):
        os.mkdir(scrach_dir_loc)

    # first untar and move to zip folder
    with open(index, "r") as index_f:
        print(f"Taking from index file {index}")
        proteins = index_f.readlines()
        for tar_protein_file in proteins:
            tar_file = tar_protein_file.split(",")[0].strip()
            tar_file = tar_file.replace("v3", "v4")
            _untar(tar_file, input_dir, scrach_dir_loc)

    # then unzip proteins itself
    subprocess.run(["gzip", "-dfr", str(scrach_dir_loc)])

    return scrach_dir_loc


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
                face_info = (
                    "f " + str(vertex1) + " " + str(vertex2) + " " + str(vertex3)
                )
                obj_file.write(face_info + "\n")

        obj_file.close()


def process_protein(it):
    start_time = time.time()

    path, protein_file = it
    protein_name = protein_file.split("-")[1]

    # convert from cif -> pdb
    subprocess.run(
        ["python3", "/scripts/3d-af-surfer/mmcif_to_pdb.py", "--ciffile", protein_file]
    )

    # convert to ply -> obj -> grid -> zernike
    subprocess.run(
        [
            "/scripts/3d-af-surfer/bin/EDTSurf",
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
    subprocess.run(
        ["/scripts/3d-af-surfer/bin/obj2grid", "-g", "64", f"{path}{protein_name}.obj"]
    )
    subprocess.run(
        [
            "/scripts/3d-af-surfer/bin/map2zernike",
            f"{path}{protein_name}.obj.grid",
            "-c",
            "0.5",
        ]
    )

    # convert to vector
    with open(f"{path}{protein_name}.obj.grid.inv") as f:
        embedding = [float(x.strip()) for x in f.readlines()[1:]]

    # clean up
    subprocess.run(
        [
            "rm",
            f"{path}{protein_name}.ply",
            f"{path}{protein_name}.obj",
            f"{path}{protein_name}.obj.grid",
            f"{path}{protein_name}.obj.grid.inv",
        ]
    )

    print(f"Processed {protein_name} in {time.time() - start_time} seconds")
    return protein_name, embedding


def run(input_path, output_path, processes=2):
    """Run Invariant-3d-coordinates embedding on a directory of cif files

    Args:
        input_path (str): Path to directory containing cif files
        output_path (str): Path to save embeddings as parquet

    Returns:
        None, saves embeddings as .parquet
    """
    index = []
    data = []
    # os.mkdir(f"{input_path}/objdata")

    proteins = os.listdir(input_path)
    proteins = [file for file in proteins if file.endswith(".cif")]
    print("Starting processing", len(proteins), "files...")

    with Pool(processes) as p:
        results = p.map(
                process_protein,
                [
                    ("/scripts/3d-af-surfer/tmp/", f"{input_path}/{protein}")
                    for protein in proteins
                ]
            )
    
    for result in results:
        index.append(result[0])
        data.append(result[1])

    df = pd.DataFrame(index=index, data=data, dtype="float32")
    df.to_parquet(output_path, compression="gzip")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, required=True)
    parser.add_argument("--scratch_dir", type=str, required=True)
    parser.add_argument("--output", type=str, required=True)
    parser.add_argument("--position", type=int, required=False, default=0)
    parser.add_argument("--processes", type=int, required=False, default=8)
    parser.add_argument("--cache", type=bool, required=False, default=False)
    parser.add_argument("--index", type=str, required=False, default=False)

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    scratch_dir = Path(args.scratch_dir)
    assert input_path.exists()

    if not output_path.exists():
        os.mkdir(output_path)

    extracted_data = args.scratch_dir
    if not args.cache:
        extracted_data = extract(input_path, scratch_dir, args.index)

    run(
        extracted_data,
        os.path.join(output_path, f"afdb2surfer-{args.position}.parquet"),
        args.processes,
    )