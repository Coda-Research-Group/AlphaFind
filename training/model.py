# Copied from https://gitlab.fi.muni.cz/xprocha6/sisap23-laion-challenge-learned-index/-/blob/main/search/li/model.py

import logging
import os
import time
from pathlib import Path
from typing import Tuple

import numpy as np
import torch
import torch.nn.functional as nnf
import torch.utils.data
import wandb
from torch import nn

from clustering import assign_labels
from utils import (
    dir_exists,
    file_exists,
    get_current_timestamp,
    load_newest_file_in_dir,
    load_pickle,
)

# set seeds for reproducibility
torch.manual_seed(2023)
np.random.seed(2023)

LOG = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')


class Model(nn.Module):
    """The model class representing the index."""

    def __init__(self, input_dim=768, output_dim=1000, model_type=None):  # noqa: C901
        super().__init__()

        # Various MLP architectures were explored
        if model_type == 'MLP':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 128),
                torch.nn.ReLU(),
                torch.nn.Linear(128, output_dim),
            )
        if model_type == 'MLP2':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 64),
                torch.nn.ReLU(),
                torch.nn.Linear(64, output_dim),
            )
        if model_type == 'MLP-3':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 256),
                torch.nn.ReLU(),
                torch.nn.Linear(256, output_dim),
            )
        if model_type == 'MLP-4':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 512),
                torch.nn.ReLU(),
                torch.nn.Linear(512, output_dim),
            )
        if model_type == 'MLP5':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 256),
                torch.nn.ReLU(),
                torch.nn.Linear(256, 128),
                torch.nn.ReLU(),
                torch.nn.Linear(128, output_dim),
            )
        if model_type == 'MLP-6':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 32),
                torch.nn.ReLU(),
                torch.nn.Linear(32, output_dim),
            )
        if model_type == 'MLP-7':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 16),
                torch.nn.ReLU(),
                torch.nn.Linear(16, output_dim),
            )
        if model_type == 'MLP-8':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 8),
                torch.nn.ReLU(),
                torch.nn.Linear(8, output_dim),
            )
        if model_type == 'MLP-9':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 8),
                torch.nn.ReLU(),
                torch.nn.Linear(8, 16),
                torch.nn.ReLU(),
                torch.nn.Linear(16, output_dim),
            )
        if model_type == 'MLP10':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 512),
                torch.nn.ReLU(),
                torch.nn.Linear(512, 256),
                torch.nn.ReLU(),
                torch.nn.Linear(256, 128),
                torch.nn.ReLU(),
                torch.nn.Linear(128, output_dim),
            )
        if model_type == 'MLP-11':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 1024),
                torch.nn.ReLU(),
                torch.nn.Linear(1024, 512),
                torch.nn.ReLU(),
                torch.nn.Linear(512, 256),
                torch.nn.ReLU(),
                torch.nn.Linear(256, 512),
                torch.nn.ReLU(),
                torch.nn.Linear(512, output_dim),
            )
        if model_type == 'MLP-big':
            self.layers = torch.nn.Sequential(
                torch.nn.Linear(input_dim, 2048),
                torch.nn.ReLU(),
                torch.nn.Linear(2048, 4096),
                torch.nn.ReLU(),
                torch.nn.Linear(4096, 8192),
                torch.nn.ReLU(),
                torch.nn.Linear(8192, 4096),
                torch.nn.ReLU(),
                torch.nn.Linear(4096, 2048),
                torch.nn.ReLU(),
                torch.nn.Linear(2048, 1024),
                torch.nn.ReLU(),
                torch.nn.Linear(1024, 512),
                torch.nn.ReLU(),
                torch.nn.Linear(512, 256),
                torch.nn.ReLU(),
                torch.nn.Linear(256, 128),
                torch.nn.ReLU(),
                torch.nn.Linear(128, output_dim),
            )
        self.n_output_neurons = output_dim

    def forward(self, x: torch.FloatTensor) -> torch.FloatTensor:
        outputs = self.layers(x)
        return outputs


def data_X_to_torch(data) -> torch.FloatTensor:
    """Creates torch training data."""
    data_X = torch.from_numpy(np.array(data).astype(np.float32))
    return data_X


def data_y_to_torch(labels) -> torch.LongTensor:
    """Creates torch training labels."""
    data_y = torch.as_tensor(torch.from_numpy(labels), dtype=torch.long)
    return data_y


def data_to_torch(data, labels) -> Tuple[torch.FloatTensor, torch.LongTensor]:
    """Creates torch training data and labels."""
    data_X = data_X_to_torch(data)
    data_y = data_y_to_torch(labels)
    return data_X, data_y


def get_device() -> torch.device:
    """Gets the `device` to be used by torch.
    This arugment is needed to operate with the PyTorch model instance.

    Returns
    ------
    torch.device
        Device
    """
    use_cuda = torch.cuda.is_available()
    device = torch.device('cuda:0' if use_cuda else 'cpu')
    torch.backends.cudnn.benchmark = True
    return device


class NeuralNetwork:
    """The neural network class corresponding to every inner node.

    Parameters
    ----------
    input_dim : int
        The input dimension.
    output_dim : int
        The output dimension.
    loss : torch.nn, optional
        The loss function, the default is torch.nn.CrossEntropyLoss.
    lr : float, optional
        The learning rate, the default is 0.001.
    model_type : str, optional
        The model type, the default is 'MLP'.
    class_weight : torch.FloatTensor, optional
        The class weights, the default is None.
    """

    def __init__(
        self,
        input_dim,
        output_dim,
        loss=torch.nn.CrossEntropyLoss,
        lr=0.1,
        model_type='MLP',
        class_weight=None,
    ):
        self.device = get_device()
        self.model = Model(input_dim, output_dim, model_type=model_type).to(self.device)
        if not isinstance(class_weight, type(None)):
            self.loss = loss(weight=class_weight.to(self.device))
        else:
            self.loss = loss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)

    def train_chunk(
        self,
        dataset,
        wandb_summary=None,
    ):
        batch_step = len(dataset) // 5
        batch_step = 1 if batch_step == 0 else batch_step

        if wandb_summary:
            wandb.watch(self.model, self.loss, log="all", log_freq=10)
            if torch.cuda.is_available():
                wandb_summary['gpu_name'] = torch.cuda.get_device_name(0)

        for b, (data_X, data_y) in enumerate(iter(dataset)):
            self.optimizer.zero_grad()
            s_batch = time.time()
            pred_y = self.model(data_X.to(self.device))
            curr_loss = self.loss(pred_y, data_y.to(self.device))

            if b % batch_step == 0 and b != 0:
                LOG.info(f'Batch {b} | Loss {curr_loss.item():.5f}')
            if wandb_summary:
                wandb.log({"time_per_batch": time.time() - s_batch})
                wandb.log({"train_loss": curr_loss.item()})

            curr_loss.backward()
            self.optimizer.step()

        return curr_loss.item()

    def predict(self, data_X: torch.FloatTensor):
        """Collects predictions for multiple data points (used in structure building)."""
        self.model = self.model.to(self.device)
        self.model.eval()

        all_outputs = torch.tensor([], device=self.device)
        with torch.no_grad():
            outputs = self.model(data_X.to(self.device))
            all_outputs = torch.cat((all_outputs, outputs), 0)

        _, y_pred = torch.max(all_outputs, 1)
        return y_pred.cpu().numpy()

    def predict_proba(self, data_X: torch.FloatTensor):
        """Collects predictions for a single data point (used in query predictions)."""
        self.model = self.model.to(self.device)
        self.model.eval()

        with torch.no_grad():
            outputs = self.model(data_X.to(self.device))

        if outputs.dim() == 1:
            dim = 0
        else:
            dim = 1
        prob = nnf.softmax(outputs, dim=dim)
        probs, classes = prob.topk(prob.shape[1])

        return probs.cpu().numpy(), classes.cpu().numpy()


class LIDataset(torch.utils.data.Dataset):
    def __init__(self, path, chunk, kmeans_index):
        if not dir_exists(path) and file_exists(path):
            self.path = path
        else:
            self.path = f'{path}/{os.listdir(path)[chunk]}'
        self.kmeans_index = kmeans_index
        self.data = data_X_to_torch(load_pickle(self.path))
        self.labels = data_y_to_torch(assign_labels(self.kmeans_index, self.data))

    def __len__(self):
        return self.data.shape[0]

    def __getitem__(self, idx):
        return self.data[idx], self.labels[idx]


class LIDatasetPredict(torch.utils.data.Dataset):
    def __init__(self, path):
        self.path = path
        self.data_pd = load_pickle(self.path)
        self.data = data_X_to_torch(self.data_pd)

    def __len__(self):
        return self.data.shape[0]

    def __getitem__(self, idx):
        return self.data[idx]


def load_model(model_path, dimensionality, n_classes, model_type, map_location=None):
    losses = []

    if model_path is not None:
        if not file_exists(model_path) and dir_exists(model_path):
            model_path = load_newest_file_in_dir(model_path)
        # Load model from existing weights
        info_to_load = torch.load(model_path, map_location=map_location)
        if type(info_to_load) is dict and 'model_state_dict' in info_to_load:
            weights_to_load = info_to_load['model_state_dict']
        else:
            weights_to_load = info_to_load

        LOG.info(f'Loading model from existing weights: {model_path}')
        nn = NeuralNetwork(dimensionality, n_classes, model_type=model_type)
        nn.model.load_state_dict(weights_to_load)
        LOG.info("Recovering last optimizer's state")
        if 'optimizer_state_dict' in info_to_load and info_to_load['optimizer_state_dict'] is not None:
            nn.optimizer.load_state_dict(info_to_load['optimizer_state_dict'])
        LOG.info("Recovering list of previous losses")
        if 'losses' in info_to_load and info_to_load['losses'] is not None:
            losses = info_to_load['losses']
    else:
        LOG.info('Creating a new model')
        nn = NeuralNetwork(dimensionality, n_classes, model_type=model_type)

    return nn, losses


def save_model(model, optimizer, losses, path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if file_exists(path):
        path_parts = path.split('.pt')
        path = f'{path_parts[0]}-{get_current_timestamp()}.pt'
    torch.save(
        {
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'losses': losses,
        },
        path,
    )
