import argparse
import logging
import os

import faiss
import numpy as np
import torch
import wandb

from alphafind_training.model import LIDataset, load_model, save_model
from alphafind_training.utils import (
    create_dir,
    dir_exists,
    file_exists,
    get_current_timestamp,
)

torch.manual_seed(2023)
np.random.seed(2023)

LOG = logging.getLogger(__name__)


def train_model(
    input_path,
    output_model_dir,
    kmeans_path,
    model='MLP',
    model_path=None,
    epochs=10,
    n_classes=2,
    batch_size=32,
    dimensionality=45,
    wandb_project='small-data-training',
    wandb_entity='protein-db',
):
    """
    Train a model on the embeddings dataset.

    Args:
        input_path (str): Path to the embeddings pickle file or directory of pickle files
        output_model_dir (str): Path to the output model directory
        kmeans_path (str): Path to the k-means model
        model (str): Model to use (default: 'MLP')
        model_path (str): Path to the trained model if using a pretrained model (default: None)
        epochs (int): Number of epochs (default: 10)
        n_classes (int): Number of classes to use (default: 2)
        batch_size (int): Batch size (default: 32)
        dimensionality (int): Number of dimensions of the data (default: 45)
        wandb_project (str): W&B project name (default: 'small-data-training')
        wandb_entity (str): W&B entity name (default: 'protein-db')

    Returns:
        None
    """
    pretrained = model_path is not None
    if not dir_exists(output_model_dir):
        create_dir(output_model_dir)

    if model_path is not None:
        assert file_exists(model_path) or dir_exists(model_path), 'Model file or dir does not exist'
    assert file_exists(kmeans_path), 'K-Means file does not exist'

    timestamp = get_current_timestamp()
    if pretrained:
        timestamp = model_path.split('--')[-1]
    name = str(
        f'model-{model}--pretrained-{pretrained}--n_classes-{n_classes}--epochs-{epochs}'
        f'--batchsize={batch_size}--dimensionality-{dimensionality}--{timestamp}'
    )

    config = argparse.Namespace(
        input=input_path,
        output_model_dir=output_model_dir,
        model=model,
        model_path=model_path,
        kmeans_path=kmeans_path,
        epochs=epochs,
        n_classes=n_classes,
        batch_size=batch_size,
        dimensionality=dimensionality,
        use_wandb=False,
        wandb_project=wandb_project,
        wandb_entity=wandb_entity,
        name=name,
    )

    if config.use_wandb:
        wandb.init(
            project=wandb_project,
            entity=wandb_entity,
            config=config,
            settings=wandb.Settings(start_method='thread'),
        )
        wandb.run.name = config.name

    LOG.info(f'Using config: {config}')

    # load the k-means object created running cluster.py
    LOG.info(f'Loading k-means object from {config.kmeans_path}')
    kmeans_index = faiss.read_index(config.kmeans_path)

    if not dir_exists(config.input) and file_exists(config.input):
        n_chunks = 1
    else:
        n_chunks = len([f for f in os.listdir(config.input) if f.endswith('.pkl')])
    nn, _ = load_model(config.model_path, config.dimensionality, config.n_classes, config.model)

    LOG.info(f'Starting training with epochs={config.epochs}, n_chunks={n_chunks}')
    losses = []
    for epoch in range(config.epochs):
        for chunk in range(n_chunks):
            dataset = LIDataset(config.input, chunk, kmeans_index)

            train_loader = torch.utils.data.DataLoader(
                dataset,
                batch_size=config.batch_size,
                sampler=torch.utils.data.SubsetRandomSampler(
                    np.arange(0, len(dataset), 1),
                ),
            )

            loss = nn.train_chunk(train_loader, wandb_summary=wandb.run.summary if config.use_wandb else None)
            LOG.info(
                str(
                    f'--- Loss: {loss:.5f} for Epoch: {epoch+1} | Chunk: {chunk+1}/{n_chunks}'
                    f' | Data: {dataset.path} | Data shape: {dataset.data.shape}---'
                )
            )
            losses.append(loss)

            if config.use_wandb:
                wandb.log({"epoch": epoch + 1, "chunk": chunk + 1, "train_loss": loss})

            save_model(
                nn.model,
                nn.optimizer,
                losses,
                f'{config.output_model_dir}/{config.name}/epoch-{epoch+1}-chunk-{chunk+1}.pt',
            )

        save_model(
            nn.model,
            nn.optimizer,
            losses,
            f'{config.output_model_dir}/{config.name}/epoch-{epoch+1}.pt',
        )
    if config.use_wandb:
        wandb.finish()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train a model on the embeddings dataset")
    parser.add_argument(
        '--input', type=str, required=True, help='Path to the embeddings pickle file or directory of pickle files'
    )
    parser.add_argument('--output-model-dir', type=str, required=True, help='Path to the output model dir')
    parser.add_argument('-m', '--model', type=str, default='MLP', help='Model to use')
    parser.add_argument(
        '--model-path', type=str, default=None, help='Path to the trained model if using a pretrained model'
    )
    parser.add_argument('--kmeans-path', type=str, required=True, help='Path to the k-means model')
    parser.add_argument('-e', '--epochs', type=int, default=10, help='Number of epochs')
    parser.add_argument('--n-classes', type=int, default=2, help='Number of classes to use')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--dimensionality', type=int, default=45, help='Number of dimensions of the data')

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

    train_model(
        input_path=args.input,
        output_model_dir=args.output_model_dir,
        kmeans_path=args.kmeans_path,
        model=args.model,
        model_path=args.model_path,
        epochs=args.epochs,
        n_classes=args.n_classes,
        batch_size=args.batch_size,
        dimensionality=args.dimensionality,
    )
