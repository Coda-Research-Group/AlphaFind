import argparse
import os

from alphafind_training.cluster import create_kmeans
from alphafind_training.create_buckets import create_buckets
from alphafind_training.create_embedding import create_embedding
from alphafind_training.create_protein_bucket_mapping import create_mapping
from alphafind_training.train import train_model


def train_alphafind(base_dir, data_dir, models_dir):
    # 1) Create embeddings
    create_embedding(
        input_path=os.path.join(data_dir, "cifs"), output_path=os.path.join(data_dir, "embedding.pkl"), granularity=10
    )

    # 2) Create a K-Means object
    create_kmeans(
        input_path=os.path.join(data_dir, "embedding.pkl"),
        output_path=os.path.join(data_dir, "kmeans.idx"),
        n_clusters=2,
    )

    # 3) Train a model
    train_model(
        input_path=os.path.join(data_dir, "embedding.pkl"),
        kmeans_path=os.path.join(data_dir, "kmeans.idx"),
        output_model_dir=models_dir,
        n_classes=2,
    )

    # 4) Create bucket-data
    create_buckets(
        input_path=os.path.join(data_dir, "embedding.pkl"),
        model_dir_path=models_dir,
        output_chunks=os.path.join(data_dir, "chunks"),
        output_predictions=os.path.join(data_dir, "overall"),
        output_bucket_path=os.path.join(data_dir, "bucket-data"),
    )

    # 5) Create bucket-data mapping to protein IDs
    create_mapping(
        bucket_data_path=os.path.join(data_dir, "bucket-data"), output_path=os.path.join(data_dir, "bucket-mapping.pkl")
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train AlphaFind model")
    parser.add_argument(
        "--base-dir", default=os.path.dirname(os.path.abspath(__file__)), help="Base directory for scripts"
    )
    parser.add_argument(
        "--data-dir",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data"),
        help="Data directory",
    )
    parser.add_argument(
        "--models-dir",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models"),
        help="Models directory",
    )
    args = parser.parse_args()

    train_alphafind(args.base_dir, args.data_dir, args.models_dir)
