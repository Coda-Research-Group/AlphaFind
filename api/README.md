# AlphaFind API

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)

This project uses [USalign](https://github.com/pylelab/USalign). Vector embeddings and model weights are available at [Protein embeddings and clustering used in AlphaFind - a protein structure similarity search tool | Czech national repository](https://data.narodni-repozitar.cz/general/datasets/egsm2-7a369).

The deployment expects the following volumes to be mounted:
- `/proteins` - persistent storage of AlphaFoldDB proteins
- `/embeddings` - persistent storage of embeddings, model weights, and precomputed indexes
- `/eph` - ephemeral storage (empty)

## Environment Installation

```shell
# Production environment
pip install -r requirements.txt

# Development environment
pip install -r requirements-dev.txt
pre-commit install
```
