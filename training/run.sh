#/bin/bash

# 1) ---- Create embeddings
python3 create_embedding.py --input=./data/cifs --output=./data/embedding.pkl --granularity 10

# 2) ---- Create a K-Means object
# Clusters and saves the k-means object to to `data/kmeans.idx`
python3 cluster.py --input=./data/embedding.pkl --output=data/kmeans.idx --n-clusters=2

# 3) ---- Train a model
# Trains and saves a model to `models/`
python3 train.py --input=./data/embedding.pkl --kmeans-path=data/kmeans.idx --output-model-dir=./models/ --n-classes=2

# 4) ---- Create bucket-data
# Collects all predictions from the newest model in `models/`, and saves them to `bucket-data/`
python3 create_buckets.py --input=./data/embedding.pkl --model-dir-path=./models/ --output-chunks=./data/chunks --output-predictions=./data/overall --output-bucket-path ./data/bucket-data/

# 5) ---- Create bucket-data mapping to protein IDs
python3 create_protein_bucket_mapping.py --bucket-path=./data/bucket-data/ --output=./data/bucket-mapping.pkl