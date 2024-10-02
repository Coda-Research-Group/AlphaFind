import os
import re
import tempfile
from pathlib import Path

import pandas as pd
import pytest
from alphafind_training.create_embedding import create_embedding


@pytest.fixture(scope="function")
def output_file():
    # Setup: Define the output file path
    output_path = Path("./data/embedding.pkl")

    yield output_path

    # Teardown: Remove only the embedding.pkl file if it exists
    if output_path.exists():
        os.remove(output_path)


def parse_protein_id(filename):
    # Use regex to extract the protein ID
    match = re.search(r'AF-([\w\d]+)-F1-model_v3\.cif', filename)
    if match:
        return match.group(1)
    return None


def test_create_embedding():
    with tempfile.TemporaryDirectory() as tmpdir:
        cif_path = "./data/cifs"
        output_path = f"{tmpdir}/embedding.pkl"
        granularity = 10

        # 45 features for each protein - (10x10 - 10) / 2
        expected_dimensionality = 45

        create_embedding(Path(cif_path), Path(output_path), granularity)

        assert os.path.exists(output_path)
        assert os.path.getsize(output_path) > 0
        # load embedding.pkl and check if it has the correct shape
        df = pd.read_pickle(output_path)
        assert df.shape[0] == len(os.listdir(cif_path))
        assert df.shape[1] == expected_dimensionality

        # check if the length of the index is equal to the number of proteins
        assert sorted(df.index.tolist()) == sorted(
            [parse_protein_id(file) for file in os.listdir(cif_path) if file.endswith('.cif')]
        )
