import os
from pathlib import Path
from tempfile import TemporaryDirectory


from alphafind_training.create_embedding import create_embedding
from alphafind_training.cluster import create_kmeans


def _setup(tempdir: str):
    create_embedding(
        input_path=Path("./data/cifs"),
        output_path=Path(f"{tempdir}/embedding.pkl")
    )


def test_create_kmeans():
    with TemporaryDirectory() as tempdir:
        _setup(tempdir)
        
        output_path = f"{tempdir}/kmeans.idx"

        create_kmeans(
            input_path=f"{tempdir}/embedding.pkl",
            output_path=output_path,
            n_clusters=2
        )

        assert os.path.exists(output_path)
