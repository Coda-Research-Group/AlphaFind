# AlphaFind API

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)

This project uses [USalign](https://github.com/pylelab/USalign).
Vector embeddings and model weights used in [AlphaFind](https://alphafind.fi.muni.cz) are available at [AlphaFind: Discover structure similarity across the entire known proteome – data and model | Czech national repository](https://data.narodni-repozitar.cz/general/datasets/d35zf-1ja47).

## Running locally
1. Build and run AlphaFind API Docker image using compose:
```sh
docker compose up --build alphafind-api
```
Executing this command will automatically build and run also the training container and prepare model and mappings.

#### Example query
```sh
curl 'http://localhost:8080/search?query=A0A0C5PVI1'
```

## Installing dependencies

```shell
# Production environment
pip install -r requirements.txt

# Development environment
pip install -r requirements-dev.txt
pre-commit install
```
