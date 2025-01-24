import os
from pathlib import Path
from tempfile import TemporaryDirectory
from pytest import fixture

from alphafind_training.create_embedding import create_embedding
from alphafind_training.cluster import create_kmeans
from alphafind_training.train import train_model


def _setup(tempdir: str):
    create_embedding(
        input_path=Path("./data/cifs"),
        output_path=Path(f"{tempdir}/embedding.pkl"),
        granularity=10
    )

    create_kmeans(
        input_path=f"{tempdir}/embedding.pkl",
        output_path=f"{tempdir}/kmeans.idx",
        n_clusters=2
    )


def test_model_existance():
    with TemporaryDirectory() as tempdir:
        _setup(tempdir)

        model_output_path = f"{tempdir}/models"

        train_model(
            input_path=f"{tempdir}/embedding.pkl",
            kmeans_path=f"{tempdir}/kmeans.idx",
            output_model_dir=model_output_path,
            n_classes=2
        )

        dir_contents = os.listdir(model_output_path)

        # Check if model is present and saved
        assert len(dir_contents) > 0
        assert len(os.listdir(f"{model_output_path}/{dir_contents[0]}")) > 0
