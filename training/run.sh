#!/bin/bash

# Set the base directory
BASE_DIR="$(dirname "$0")"
DATA_DIR="$BASE_DIR/data"
MODELS_DIR="$BASE_DIR/models"

# Run the train_alphafind.py script
python3 "$BASE_DIR/train_alphafind.py" --base-dir="$BASE_DIR" --data-dir="$DATA_DIR" --models-dir="$MODELS_DIR"