# AlphaFind API

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)

This project uses [USalign](https://github.com/pylelab/USalign). Vector embeddings and model weights are available at [Protein embeddings and clustering used in AlphaFind - a protein structure similarity search tool | Czech national repository](https://data.narodni-repozitar.cz/general/datasets/egsm2-7a369).

The deployment expects the following volumes to be mounted:
- `/proteins` - persistent storage of AlphaFoldDB proteins
- `/embeddings` - persistent storage of embeddings and model weights (see the link above)
- `/eph` - ephemeral storage (empty)

Additionally, two indexes are expected to be present in the `/embeddings` volume:
- `protein_id_to_tar_index`
  - a mapping from protein ID to `(tar file ID, offset, size)` tuple
  - stored at file path specified by `PROTEIN_ID_TO_TAR_INDEX_FILE_PATH`
  - see `api/server/run-worker.py`
- `protein_id_to_position_mapping`
  - a mapping from protein ID to `(class ID, position in dataframe's class embeddings)` tuple
  - stored at file path specified by `PROTEIN_ID_TO_POSITION_FILE_PATH`
  - see `api/search.py`

## Environment Installation

```shell
# Production environment
pip install -r requirements.txt

# Development environment
pip install -r requirements-dev.txt
pre-commit install
```
