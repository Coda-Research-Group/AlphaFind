# AlphaFind API

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)

This project uses [USalign](https://github.com/pylelab/USalign).
Vector embeddings and model weights used in [AlphaFind](https://alphafind.fi.muni.cz) are available at [AlphaFind: Discover structure similarity across the entire known proteome – data and model | Czech national repository](https://data.narodni-repozitar.cz/general/datasets/d35zf-1ja47).

## Running locally

1. Copy folders `data` and `models` from `alphafind-training` to the root of this repository.

```shell
ln -s ../alphafind-training/models/ models/
ln -s ../alphafind-training/data/ data/
```

2. Run the following commands:

```shell
# Build the server image
docker build -t alphafind:server -f ./server/Dockerfile .

# Run the server
docker run -p 8080:8000 \
    -v ./data:/data \
    -v ./models:/models \
    -v ./eph:/eph \
    alphafind:server

Note: On **Windows** you may need to use absolute paths instead of relative paths.

# Example query
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
