import numpy as np
import torch
import torch.nn.functional as nnf
import torch.utils.data
from torch import nn

# set seeds for reproducibility
torch.manual_seed(2023)
np.random.seed(2023)


class Model(nn.Module):
    """The model class representing the index."""

    def __init__(self, input_dim=768, output_dim=1000, model_type=None):  # noqa: C901
        super().__init__()

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
